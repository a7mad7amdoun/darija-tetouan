/* ---------------------------------------------------------------------------
   HABITS — what the best learning apps do well, done for two learners.

     rest days     a streak survives one missed day per week (Duolingo's
                   "streak freeze", granted automatically, never bought)
     quests        three small goals a day, from what the learner did today
     milestones    a streak of 7, 30, 100 days is said so, once
     mistakes      the words missed in the last 7 days, one tap to practise
     memory hooks  a learner's own note on a word ("mem"), shown on recall
     the year      365 days as cells, the days practised filled (Anki's heatmap)
     leeches       a word missed 6+ times in 30 days is flagged to the teacher

   What this writes: ONE kind of key, hook:<cardId> (the learner's own text,
   synced as text). Everything else is read from records that already exist:
   did:<day>, att:<cardId>, fam:<cardId>. No attempt, schedule, familiarity,
   seen or done key is ever written here (tests/habits.js checks it).
   --------------------------------------------------------------------------- */
(function () {
  var E = function (s) { return UI.esc(s); };
  var dayOf = function (d) { return Sched.addDays(Sched.todayStr(), 0) && d; };
  function iso(d) { var y = d.getFullYear(), m = ('0' + (d.getMonth() + 1)).slice(-2), day = ('0' + d.getDate()).slice(-2); return y + '-' + m + '-' + day; }
  function did(dayStr) { return Store.get('did:' + dayStr, false) === true; }

  /* ---------- the streak, with rest days ----------
     A streak counts the days in a row with a session. One missed day in any
     seven is forgiven, as a rest day; two in a row is a break. The learner
     sees which days were rest days, so nothing is hidden. */
  function streak() {
    var today = Sched.todayStr(), d = new Date(today + 'T12:00:00'), n = 0, rests = 0, missedInRow = 0, lastRestAt = -99, i = 0;
    if (!did(today)) d.setDate(d.getDate() - 1);
    for (; i < 400; i++) {
      var s = iso(d);
      if (did(s)) { n++; missedInRow = 0; }
      else {
        /* a rest day: only one per seven, and never the day we would start on */
        if (n > 0 && i - lastRestAt >= 7 && missedInRow === 0) { rests++; lastRestAt = i; missedInRow = 1; }
        else break;
      }
      d.setDate(d.getDate() - 1);
    }
    return { days: n, rests: rests, restAvailable: n > 0 && (i - lastRestAt) >= 7 };
  }
  var MILESTONES = [3, 7, 14, 30, 60, 100, 180, 365];
  function milestone(n) { return MILESTONES.indexOf(n) >= 0 ? n : 0; }

  /* ---------- today's quests ----------
     Three small goals, drawn from today's records. Read-only: a quest is
     done when the record that proves it exists. */
  function todayAttempts() {
    var today = Sched.todayStr(), out = [];
    UI.allActiveCards().forEach(function (c) {
      Attempts.all(c.id).forEach(function (r) { if (String(r.at || '').slice(0, 10) === today) out.push({ card: c, r: r }); });
    });
    return out;
  }
  function quests() {
    var today = Sched.todayStr(), at = todayAttempts();
    var session = did(today);
    var typed = at.filter(function (x) { return x.r.task === 'produce' && !x.r.assisted && x.r.ok; }).length;
    var gameToday = Tests.list.concat(window.Games ? Games.list : []).some(function (g) {
      var id = (window.Games && Games.list.indexOf(g) >= 0) ? 'game:' + g.id : g.id;
      return Tests.results(id).some(function (r) { return r.date === today; });
    });
    var q = [
      { id: 'session', text: 'Do today’s session', done: session, href: '#/today', icon: 'i-today' },
      { id: 'typed', text: 'Type three words from memory', done: typed >= 3, n: Math.min(typed, 3), of: 3, href: '#/today', icon: 'i-find' },
      { id: 'game', text: 'Play one game or test', done: gameToday, href: '#/games', icon: 'i-dice' }
    ];
    return { list: q, done: q.filter(function (x) { return x.done; }).length };
  }

  /* ---------- mistakes ---------- */
  function mistakes(days) {
    var cut = Date.now() - (days || 7) * 86400000, out = [];
    UI.allActiveCards().forEach(function (c) {
      var misses = Attempts.all(c.id).filter(function (r) { return !r.ok && Date.parse(r.at) >= cut; }).length;
      if (misses) out.push({ card: c, misses: misses });
    });
    out.sort(function (a, b) { return b.misses - a.misses; });
    return out;
  }

  /* ---------- leeches: a word that will not stick ---------- */
  var LEECH = 6;
  function leeches() {
    return mistakes(30).filter(function (x) { return x.misses >= LEECH; });
  }

  /* ---------- memory hooks ---------- */
  function hook(id) { return String(Store.get('hook:' + id, '') || ''); }
  function setHook(id, text) { Store.set('hook:' + id, String(text || '').trim().slice(0, 140)); }

  /* ---------- the year ---------- */
  function year() {
    var today = Sched.todayStr(), d = new Date(today + 'T12:00:00'), cells = [], n = 0;
    d.setDate(d.getDate() - 364);
    for (var i = 0; i < 365; i++) { var s = iso(d); var on = did(s); if (on) n++; cells.push({ day: s, on: on }); d.setDate(d.getDate() + 1); }
    return { cells: cells, days: n };
  }

  /* ---------- views ---------- */
  function questsView() {
    var q = quests();
    return '<section class="quests"><div class="qhead"><span class="crumb">Today’s three</span><span class="qcount">' + q.done + ' of 3</span></div><ul>' +
      q.list.map(function (x) {
        return '<li class="' + (x.done ? 'done' : '') + '"><a href="' + E(x.href) + '">' +
          '<span class="qtick" aria-hidden="true">' + (x.done ? '✓' : '') + '</span>' +
          '<svg class="ico" aria-hidden="true"><use href="#' + E(x.icon) + '"/></svg>' +
          '<span class="qtext">' + E(x.text) + (x.of && !x.done ? ' <small>' + x.n + ' of ' + x.of + '</small>' : '') + '</span></a></li>';
      }).join('') + '</ul>' +
      (q.done === 3 ? '<p class="qdone">All three. That is a day well used.</p>' : '') + '</section>';
  }
  function streakView() {
    var s = streak(), m = milestone(s.days);
    return '<div class="streak' + (m ? ' milestone' : '') + '"><span class="streakn">' + s.days + '</span>' +
      '<span class="streakl">day' + (s.days === 1 ? '' : 's') + '<br>in a row' +
      (s.rests ? '<small>' + s.rests + ' rest day' + (s.rests === 1 ? '' : 's') + '</small>' : '') + '</span></div>';
  }
  function mistakesView() {
    var m = mistakes(7);
    if (!m.length) return '';
    return '<section class="mistakes"><span class="crumb">Missed this week</span><ul>' +
      m.slice(0, 5).map(function (x) {
        return '<li><span class="sen">' + E(x.card.en) + '</span><span class="say ssay">' + UI.sayHTML(UI.formFor(x.card).phon) + '</span>' +
          '<span class="swhy">' + x.misses + ' miss' + (x.misses === 1 ? '' : 'es') + '</span></li>';
      }).join('') + '</ul><a class="btn" href="#/practice?set=mistakes">Practise your mistakes (' + m.length + ')</a></section>';
  }
  function yearView() {
    var y = year();
    return '<section class="yearmap"><div class="qhead"><span class="crumb">The last year</span><span class="qcount">' + y.days + ' day' + (y.days === 1 ? '' : 's') + '</span></div>' +
      '<div class="ygrid" role="img" aria-label="' + y.days + ' days practised in the last year">' +
      y.cells.map(function (c) { return '<i class="' + (c.on ? 'on' : '') + '" title="' + c.day + '"></i>'; }).join('') + '</div></section>';
  }
  function hookField(id) {
    var h = hook(id);
    return '<div class="hook"><label for="hook-' + E(id) + '"><svg class="ico" aria-hidden="true"><use href="#f-idea"/></svg>Your memory hook</label>' +
      '<input id="hook-' + E(id) + '" type="text" maxlength="140" data-hook="' + E(id) + '" value="' + E(h) + '" ' +
      'placeholder="A picture, a rhyme, a story: whatever makes it stick"></div>';
  }
  function hookShow(id) {
    var h = hook(id);
    return h ? '<p class="hookshow"><svg class="ico" aria-hidden="true"><use href="#f-idea"/></svg>' + E(h) + '</p>' : '';
  }

  window.Habits = { streak: streak, milestone: milestone, quests: quests, mistakes: mistakes, leeches: leeches, LEECH: LEECH,
                    hook: hook, setHook: setHook, year: year,
                    questsView: questsView, streakView: streakView, mistakesView: mistakesView, yearView: yearView,
                    hookField: hookField, hookShow: hookShow };
})();
