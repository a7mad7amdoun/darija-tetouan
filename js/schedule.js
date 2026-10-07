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
  var MAX_INTERVAL = 180;   /* the course is six months; beyond that is theatre */

  function todayStr() { return new Date().toISOString().slice(0, 10); }

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

  /* The one entry point. correct=false sends it back to the start of the ladder
     but keeps the history, so a word that keeps lapsing gets a lower ease and
     therefore shorter gaps for good. */
  function grade(id, correct) {
    if (!id) return null;
    var today = todayStr();
    var s = get(id) || { d: today, i: 0, e: EASE_START, n: 0, l: 0 };
    var ease = s.e || EASE_START;

    if (!correct) {
      s.l = (s.l || 0) + 1;
      s.n = 0;
      s.e = Math.max(EASE_MIN, ease - EASE_DROP);
      s.i = 0;
      /* back tomorrow. Coming back later in the same session is the session
         queue's job, not the calendar's. */
      s.d = addDays(today, 1);
    } else {
      s.n = (s.n || 0) + 1;
      if (s.n === 1)      s.i = 1;
      else if (s.n === 2) s.i = 3;
      else                s.i = Math.min(MAX_INTERVAL, Math.max(1, Math.round((s.i || 1) * ease / 100)));
      s.d = addDays(today, s.i);
    }
    Store.set(KEY + id, s);
    return s;
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
    return !!(s && (s.n || 0) >= 2 && (s.i || 0) >= 3);
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
    todayStr: todayStr, addDays: addDays, daysBetween: daysBetween
  };
})();
