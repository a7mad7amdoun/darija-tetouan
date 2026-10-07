/* ---------------------------------------------------------------------------
   ATTEMPTS  —  an immutable record of what actually happened.

   Before this, the only evidence a word had been practised was two numbers:
   right and wrong, summed over all time. You could not tell whether someone
   recognised a word in a list of four or produced it cold, whether a failure
   was last night or in March, or whether three "correct" answers were three
   spaced reviews or one answer clicked three times.

   So every attempt is now its own record, appended and never edited:

     att:<cardId> = [ { id, at, task, assisted, ok, sched }, ... ]

   id       a UUID, so a retry cannot double-count and two devices merge by
            union - the same rule the existing results arrays already use
   at       ISO timestamp, so recency is a fact rather than an inference
   task     how it was asked (see TASKS)
   assisted true if the answer was shown, or a hint taken, before answering
   ok       what the learner did, not a judgement of their pronunciation
   sched    what the scheduler did with it: 'advance', 'hold', 'lapse', 'none'

   Nothing here is ever rewritten. A failure stays a failure even after the
   learner gets it right a minute later, because "got it eventually" and "knew
   it" are different facts and the teacher needs both.
   --------------------------------------------------------------------------- */
(function () {
  var KEY = 'att:';

  /* What kind of retrieval was this? These are not difficulty levels; they are
     different skills, and succeeding at one says little about the others. */
  var TASKS = {
    learn:     { label: 'first seen',   produces: false, graded: false },
    recognise: { label: 'multiple choice', produces: false, graded: true },
    match:     { label: 'matching',     produces: false, graded: true },
    recall:    { label: 'covered recall', produces: true,  graded: true, selfGraded: true },
    produce:   { label: 'typed cold',   produces: true,  graded: true },
    spoken:    { label: 'said aloud',   produces: true,  graded: true, selfGraded: true },
    listen:    { label: 'heard it',     produces: false, graded: true },
    exam:      { label: 'exam',         produces: false, graded: true }
  };

  function isProduction(task) { return !!(TASKS[task] && TASKS[task].produces); }
  function label(task) { return (TASKS[task] || {}).label || task; }

  function all(id) {
    var v = Store.get(KEY + id, null);
    return Array.isArray(v) ? v : [];
  }

  /* Append one. Returns the record so the caller can report it. */
  function record(id, fields) {
    if (!id) return null;
    var rec = {
      id: (window.DB && DB.uuid) ? DB.uuid() : String(Date.now()) + Math.random().toString(16).slice(2),
      at: new Date().toISOString(),
      task: fields.task || 'recognise',
      assisted: !!fields.assisted,
      ok: !!fields.ok,
      sched: fields.sched || 'none'
    };
    Store.set(KEY + id, all(id).concat([rec]));
    return rec;
  }

  /* ---- reading the evidence back ---- */

  function since(id, days) {
    var cut = Date.now() - days * 86400000;
    return all(id).filter(function (r) { return new Date(r.at).getTime() >= cut; });
  }

  function last(id, filter) {
    var list = all(id);
    for (var i = list.length - 1; i >= 0; i--) {
      if (!filter || filter(list[i])) return list[i];
    }
    return null;
  }

  function lastAt(id) { var r = last(id); return r ? r.at : null; }

  /* Has this card been answered already today? Used to stop one evening's
     repeated answers reading as several days of spaced review. */
  function answeredToday(id, task) {
    var today = new Date().toISOString().slice(0, 10);
    return all(id).some(function (r) {
      if (r.at.slice(0, 10) !== today) return false;
      if (!r.ok) return false;
      return task ? r.task === task : true;
    });
  }

  /* Unaided production success, ever. Recognising a word in a list of four is
     not evidence that it can be produced, so the scheduler asks this before
     letting an interval grow long. */
  function hasProduced(id) {
    return all(id).some(function (r) { return r.ok && !r.assisted && isProduction(r.task); });
  }

  function summary(id) {
    var list = all(id);
    var out = {
      total: list.length, failures: 0, recent: 0, recentFailures: 0,
      production: 0, productionFailures: 0, recognition: 0,
      lastAt: null, lastOk: null, tasks: {}
    };
    var cut = Date.now() - 30 * 86400000;
    list.forEach(function (r) {
      if (!r.ok) out.failures++;
      var isRecent = new Date(r.at).getTime() >= cut;
      if (isRecent) { out.recent++; if (!r.ok) out.recentFailures++; }
      if (isProduction(r.task)) { out.production++; if (!r.ok) out.productionFailures++; }
      else out.recognition++;
      out.tasks[r.task] = (out.tasks[r.task] || 0) + 1;
      out.lastAt = r.at; out.lastOk = r.ok;
    });
    return out;
  }

  /* How much do we actually know about this card?
       'none'       nothing recorded at all
       'historical' only the old lifetime counters - no dated attempts, so
                    recency and task type are genuinely unknown
       'thin'       fewer than three dated attempts
       'recent'     dated attempts within the last 30 days  */
  function evidence(id) {
    var list = all(id);
    if (!list.length) {
      var f = (window.UI && UI.fam) ? UI.fam(id) : { r: 0, w: 0 };
      return (f.r + f.w) > 0 ? 'historical' : 'none';
    }
    var cut = Date.now() - 30 * 86400000;
    var recent = list.filter(function (r) { return new Date(r.at).getTime() >= cut; });
    if (!recent.length) return 'thin';
    return recent.length < 3 ? 'thin' : 'recent';
  }

  window.Attempts = {
    KEY: KEY, TASKS: TASKS, record: record, all: all, since: since,
    last: last, lastAt: lastAt, answeredToday: answeredToday,
    hasProduced: hasProduced, summary: summary, evidence: evidence,
    isProduction: isProduction, label: label
  };
})();
