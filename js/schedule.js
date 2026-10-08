/* ---------------------------------------------------------------------------
   SPACED REPETITION

   The old rule was "review anything not yet solid". It had a hole: two right
   answers made a word solid, and a solid word was never asked again. Words were
   retired on the day they were first learned, which is exactly when they are
   most likely to be forgotten.

   This schedules every word a date instead. Get it right and the gap grows —
   1 day, 3 days, then multiplying. Get it wrong and it comes straight back and
   the gap shrinks. Nothing is ever retired.

   The algorithm is SM-2 with the knobs turned down: two buttons rather than
   four grades, because asking a learner to rate their own recall on a scale is
   a decision they should not have to make mid-sentence.

   Stored compactly, one entry per card, because this doc syncs:
     sched:<cardId> = { d: 'YYYY-MM-DD' due, i: interval days,
                        e: ease x100,     n: reps,  l: lapses }
   --------------------------------------------------------------------------- */
(function () {
  var KEY = 'sched:';
  var EASE_START = 250;     /* x100, so 2.5 */
  var EASE_MIN = 130;
  var EASE_DROP = 20;       /* a lapse costs 0.20 */
  /* The course is six months. An interval of 180 days inside a 180-day course
     retires a word on the day it reaches it - the exact failure this file was
     written to fix, arrived at from the other direction. Cepeda et al. (2008)
     put the useful study gap at roughly 10-20% of the retention interval, which
     for a six-month horizon is about 18-36 days; 60 keeps every core word
     circulating with room above that band. */
  var MAX_INTERVAL = 60;

  /* The learner's own calendar day. This used to be UTC, which in Tetouan
     (UTC+1, UTC+0 during Ramadan) made 00:00-01:00 local count as yesterday -
     enough to let a card advance twice in one real day and to miscredit a
     streak. */
  function todayStr(d) {
    d = d || new Date();
    return new Date(d.getTime() - d.getTimezoneOffset() * 60000)
             .toISOString().slice(0, 10);
  }

  function addDays(dateStr, n) {
    var d = new Date(dateStr + 'T00:00:00Z');
    d.setUTCDate(d.getUTCDate() + n);
    return d.toISOString().slice(0, 10);
  }

  function daysBetween(a, b) {
    return Math.round((new Date(b + 'T00:00:00Z') - new Date(a + 'T00:00:00Z')) / 86400000);
  }

  function get(id) {
    var raw = Store.get(KEY + id, null);
    if (!raw || typeof raw !== 'object') return null;
    return raw;
  }

  function isTracked(id) { return !!get(id); }

  /* Due today or overdue. A word never seen is not due — it is new, which is a
     different queue with a different pace. */
  function isDue(id, today) {
    var s = get(id);
    if (!s || !s.d) return false;
    return s.d <= (today || todayStr());
  }

  function overdueBy(id, today) {
    var s = get(id);
    if (!s || !s.d) return -1;
    return daysBetween(s.d, today || todayStr());
  }

  /* How long until this comes back, in days. -1 if it is not scheduled yet. */
  function nextIn(id) {
    var s = get(id);
    if (!s || !s.d) return -1;
    return Math.max(0, daysBetween(todayStr(), s.d));
  }

  /* The one entry point.

     Three things it now refuses to do, each of which it used to do:

     1. ADVANCE TWICE IN A DAY. Answering correctly in the session and again in
        a test an hour later is one day's evidence, not two. A second correct
        answer on a day the card has already advanced is recorded as an attempt
        and leaves the calendar alone. Without this, a learner who likes tests
        pushes every shared word out to months while learning it less well.

     2. LET RECOGNITION BUY A LONG INTERVAL. Picking the right option out of
        four says you can recognise it, not that you could say it in the street.
        Until a card has one unaided production success, its interval is capped
        at RECOGNITION_CAP days. Recognition keeps it alive; production is what
        lets the gap get long.

     3. ERASE A FAILURE BY GETTING IT RIGHT A MINUTE LATER. A lapse puts the
        card into relearning. Getting it right again in the same session clears
        the relearning step so the session can end, but the next interval is
        rebuilt from the short step and the reduced ease - it does not spring
        back to where it was before the failure. The lapse count and the failed
        attempt both stay on the record.

     opts: { task, assisted }  - see attempts.js for the task vocabulary. */
  var RECOGNITION_CAP = 21;
  var RELEARN_STEP = 1;
  var EASE_RECOVER = 10;      /* ease can climb back, slowly */
  var RECOVER_AFTER = 4;      /* consecutive successes before it does */

  /* Tasks whose failure is weak evidence. A mis-tap on one of four options is
     not the same event as failing to produce a word cold, and it used to carry
     the same punishment: a lapse, a permanent ease penalty and a reset to zero.
     Success was capped at once a day while failure was uncapped, so the least
     diagnostic task in the system had the most destructive power. */
  var SOFT_FAIL = { recognise: 1, match: 1, exam: 1, listen: 1 };

  function grade(id, correct, opts) {
    if (!id) return null;
    opts = opts || {};
    var task = opts.task || 'recognise';
    var assisted = !!opts.assisted;
    var today = todayStr();
    var prev = get(id);
    /* work on a copy: get() hands back the live object, and while the teacher
       is looking at a student that object is the student's read-only overlay */
    var s = prev ? JSON.parse(JSON.stringify(prev))
                 : { d: today, i: 0, e: EASE_START, n: 0, l: 0 };
    var ease = s.e || EASE_START;

    /* Fail SAFE if attempts.js did not load: assume nothing has been produced
       (so the cap applies) rather than assuming everything has. */
    var produced = window.Attempts ? Attempts.hasProduced(id) : false;
    var isCheckedProduction = window.Attempts
      ? (Attempts.isCheckedProduction(task) && !assisted) : false;
    var outcome;

    if (!correct && SOFT_FAIL[task]) {
      /* shorten the gap, bring it back soon, but do not record a lapse and do
         not touch ease - we do not know enough from a wrong option */
      s.i = Math.max(1, Math.round((s.i || 1) / 2));
      s.d = addDays(today, 1);
      s.n = Math.max(0, (s.n || 0) - 1);
      outcome = 'soft';

    } else if (!correct) {
      s.l = (s.l || 0) + 1;
      s.n = 0;
      s.e = Math.max(EASE_MIN, ease - EASE_DROP);
      s.i = 0;
      s.rl = 1;
      s.d = addDays(today, 1);
      outcome = 'lapse';

    } else if (s.rl) {
      /* Out of relearning, from the short step - never from the interval it
         held before it lapsed. This runs even on a day the card already
         advanced, because clearing relearning is not an advance. */
      s.rl = 0;
      s.n = 1;
      s.i = RELEARN_STEP;
      s.d = addDays(today, s.i);
      s.a = today;
      outcome = 'advance';

    } else if (s.a === today) {
      /* Already advanced today. One calendar day is one day's evidence however
         many times it is answered. This condition is self-contained on purpose:
         it used to be ANDed with a check of the attempt log, which made it
         weaker than either half - an empty or rewritten log re-opened double
         advancing. */
      outcome = 'hold';

    } else {
      s.n = (s.n || 0) + 1;
      if (s.n === 1)      s.i = 1;
      else if (s.n === 2) s.i = 3;
      else                s.i = Math.min(MAX_INTERVAL, Math.max(1, Math.round((s.i || 1) * ease / 100)));

      /* Ease may climb back. It could previously only ever fall, with no path
         up at all once the Easy grade was removed, so a word that was hard in
         week two stayed punished for the rest of the course. */
      if (s.n >= RECOVER_AFTER && s.e < EASE_START) {
        s.e = Math.min(EASE_START, s.e + EASE_RECOVER);
      }

      /* Recognition alone cannot buy a long gap - but only for cards this
         system has actually watched. A card carrying reps from before attempts
         were recorded is grandfathered: capping it would silently rewrite an
         interval that was legitimately earned, which is a reinterpretation of
         an existing record, not a scheduling decision. */
      var watched = !window.Attempts || Attempts.all(id).length > 0;
      if (watched && !produced && !isCheckedProduction) {
        s.i = Math.min(s.i, RECOGNITION_CAP);
      }

      s.d = addDays(today, s.i);
      s.a = today;
      outcome = 'advance';
    }

    Store.set(KEY + id, s);
    if (window.Attempts) {
      Attempts.record(id, { task: task, assisted: assisted, ok: !!correct,
                            sched: outcome, ms: opts.ms });
    }
    /* returned for the caller, NOT stored - this used to be assigned onto s
       after the write and rode into IndexedDB and the sync payload */
    return { sched: s, outcome: outcome };
  }

  /* Cards due now, most overdue first. Overdue beats barely-due, because a word
     a month late is closer to being lost than one that came up this morning. */
  function dueCards(cards, today) {
    today = today || todayStr();
    return cards.filter(function (c) { return isDue(c.id, today); })
                .sort(function (a, b) { return overdueBy(b.id, today) - overdueBy(a.id, today); });
  }

  function counts(cards) {
    var today = todayStr(), out = { due: 0, tracked: 0, soon: 0, learned: 0 };
    cards.forEach(function (c) {
      var s = get(c.id);
      if (!s) return;
      out.tracked++;
      if (s.d <= today) out.due++;
      else if (daysBetween(today, s.d) <= 3) out.soon++;
      if ((s.n || 0) >= 3) out.learned++;
    });
    return out;
  }

  /* A word that has survived three correct answers in a row and is not coming
     back for a week is worth asking for by production, not recognition. */
  function isMature(id) {
    var s = get(id);
    if (!s || (s.n || 0) < 2 || (s.i || 0) < 3) return false;
    if (s.rl) return false;        /* still relearning: ask it the easy way first */
    return true;
  }

  /* Is this card's interval being held back for want of production evidence?
     The teacher's view uses this to explain why a word is not progressing. */
  function cappedByRecognition(id) {
    var s = get(id);
    if (!s) return false;
    if (window.Attempts && !Attempts.all(id).length) return false;  /* grandfathered */
    var produced = window.Attempts ? Attempts.hasProduced(id) : false;
    return !produced && (s.i || 0) >= RECOGNITION_CAP;
  }

  /* When is the next thing due at all? Used to tell someone there is nothing
     to do today rather than leaving them guessing. */
  function nextDueDate(cards) {
    var best = null;
    cards.forEach(function (c) {
      var s = get(c.id);
      if (!s || !s.d) return;
      if (!best || s.d < best) best = s.d;
    });
    return best;
  }

  window.Sched = {
    KEY: KEY, get: get, grade: grade, isDue: isDue, isTracked: isTracked,
    dueCards: dueCards, counts: counts, nextIn: nextIn, overdueBy: overdueBy,
    isMature: isMature, nextDueDate: nextDueDate,
    cappedByRecognition: cappedByRecognition,
    RECOGNITION_CAP: RECOGNITION_CAP,
    todayStr: todayStr, addDays: addDays, daysBetween: daysBetween
  };
})();
