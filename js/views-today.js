/* ---------------------------------------------------------------------------
   TODAY  —  the guided session.

   The rest of the site is a library: everything is reachable, which is right
   for the teacher and overwhelming for a learner. This page is the opposite.
   One thing on screen, two buttons, and it decides what comes next.

   A session is: a few new words, the shakiest old ones brought back, then a
   short check. Nothing here is a score - the check exists to move a word from
   "I recognised it" to "I could produce it".

   State lives in memory, but every answer is written through immediately, so
   closing the phone mid-session loses nothing except the position in the queue.
   --------------------------------------------------------------------------- */
(function () {
  var E = UI.esc;
  var NEW_PER_SESSION = 4;
  var REVIEW_PER_SESSION = 6;
  var CHECK_QUESTIONS = 4;

  var run = null;

  function todayStr() { return new Date().toISOString().slice(0, 10); }
  function seen(id) { return Store.get('seen:' + id, false) === true; }

  /* ---------------- what counts as done, and how long a run of days ---------- */
  function didToday() { return Store.get('did:' + todayStr(), false) === true; }

  function streak() {
    var n = 0, d = new Date();
    /* today only counts once it is done; yesterday still counts until midnight */
    if (!Store.get('did:' + todayStr(), false)) d.setDate(d.getDate() - 1);
    for (var i = 0; i < 400; i++) {
      if (!Store.get('did:' + d.toISOString().slice(0, 10), false)) break;
      n++; d.setDate(d.getDate() - 1);
    }
    return n;
  }

  function daysThisWeek() {
    var n = 0, d = new Date();
    for (var i = 0; i < 7; i++) {
      if (Store.get('did:' + d.toISOString().slice(0, 10), false)) n++;
      d.setDate(d.getDate() - 1);
    }
    return n;
  }

  /* ---------------- the pool this learner is working through ---------------- */
  function pool() {
    var course = UI.currentCourse();
    if (!course || !course.weeks) return { course: course, week: null, cards: [] };
    var wk = UI.currentWeek(course);
    var upto = wk ? wk.number : 1;
    var cards = UI.allActiveCards().filter(function (c) {
      if (c.courseId !== course.id) return false;
      if (c.freq === 'extra') return false;           /* extras are for browsing, not drilling */
      return c.week == null || c.week <= upto;
    });
    return { course: course, week: wk, cards: cards };
  }

  function plan() {
    var p = pool();
    var fresh = p.cards.filter(function (c) { return !seen(c.id); });
    /* teach in the order the course teaches, core words before useful ones */
    fresh.sort(function (a, b) {
      if ((a.week || 0) !== (b.week || 0)) return (a.week || 0) - (b.week || 0);
      if ((a.freq === 'core') !== (b.freq === 'core')) return a.freq === 'core' ? -1 : 1;
      return 0;
    });
    var due = p.cards.filter(function (c) { return seen(c.id) && UI.strength(c.id) < 3; });
    due.sort(function (a, b) { return UI.strength(a.id) - UI.strength(b.id); });
    return {
      course: p.course, week: p.week, all: p.cards,
      fresh: fresh.slice(0, NEW_PER_SESSION),
      due: due.slice(0, REVIEW_PER_SESSION),
      freshTotal: fresh.length, dueTotal: due.length
    };
  }

  /* ---------------- building one session ---------------- */
  function pick(arr, n, notId) {
    var out = [], used = {};
    if (notId) used[notId] = 1;
    var guard = 0;
    while (out.length < n && guard++ < 400) {
      var c = arr[Math.floor(Math.random() * arr.length)];
      if (!c || used[c.id]) continue;
      used[c.id] = 1; out.push(c);
    }
    return out;
  }

  function checkQuestions(cards, all) {
    var qs = [];
    var subject = cards.slice();
    subject.sort(function () { return Math.random() - 0.5; });
    subject.slice(0, CHECK_QUESTIONS).forEach(function (c) {
      var wrong = pick(all.filter(function (x) { return x.id !== c.id; }), 3, c.id);
      if (wrong.length < 3) return;
      var opts = wrong.concat([c]);
      opts.sort(function () { return Math.random() - 0.5; });
      qs.push({ card: c, options: opts, answer: opts.indexOf(c) });
    });
    return qs;
  }

  function start() {
    var p = plan();
    if (!p.fresh.length && !p.due.length) { run = null; return null; }
    var steps = [];
    p.fresh.forEach(function (c) { steps.push({ kind: 'learn', card: c }); });
    p.due.forEach(function (c) { steps.push({ kind: 'recall', card: c }); });
    var subject = p.fresh.concat(p.due);
    checkQuestions(subject, p.all).forEach(function (q) { steps.push({ kind: 'check', q: q }); });
    run = { steps: steps, i: 0, revealed: false, chosen: -1, right: 0, asked: 0,
            day: todayStr(),
            learned: p.fresh.length, reviewed: p.due.length, week: p.week, course: p.course };
    return run;
  }

  /* ---------------- the screens ---------------- */
  function shell(inner, cls) {
    return '<div class="sess' + (cls ? ' ' + cls : '') + '">' + inner + '</div>';
  }

  function progressBar() {
    var pct = Math.round(run.i / Math.max(1, run.steps.length) * 100);
    return '<div class="sessbar"><span style="width:' + pct + '%"></span></div>';
  }

  function stepCounter() {
    return '<p class="sessstep">Step ' + (run.i + 1) + ' of ' + run.steps.length + '</p>';
  }

  /* a brand new word: show everything, ask nothing */
  function learnStep(c) {
    var f = UI.formFor(c);
    var h = progressBar() + stepCounter() +
      '<p class="sesskind new">New word</p>' +
      '<p class="sessen">' + E(c.en) + '</p>' +
      '<p class="sesssay">' + UI.sayHTML(f.phon) + '</p>' +
      '<p class="sessar ar" dir="rtl">' + E(f.arv || c.ar) + '</p>';
    if (c.use) h += '<p class="sessuse"><strong>When you say it.</strong> ' + E(c.use) + '</p>';
    if (c.example) {
      h += '<div class="sessex"><span class="crumb">For example</span>' +
           '<p class="sesssay sm">' + UI.sayHTML(c.example.phon || '') + '</p>' +
           '<p class="muted sm">' + E(c.example.en || '') + '</p></div>';
    }
    h += '<button class="btn primary wide big" data-sess="next">Say it out loud, then continue →</button>';
    return shell(h);
  }

  /* a word seen before: ask first, reveal second, they mark themselves */
  function recallStep(c) {
    var f = UI.formFor(c);
    var h = progressBar() + stepCounter() +
      '<p class="sesskind rev">From before</p>' +
      '<p class="sessen">' + E(c.en) + '</p>';
    if (!run.revealed) {
      h += '<p class="sesshint">Say it in Darija, out loud, before you look.</p>' +
           '<button class="btn wide big" data-sess="reveal">Show me →</button>';
    } else {
      h += '<p class="sesssay">' + UI.sayHTML(f.phon) + '</p>' +
           '<p class="sessar ar" dir="rtl">' + E(f.arv || c.ar) + '</p>' +
           '<div class="sesspair">' +
             '<button class="btn wide big" data-sess="miss">Not yet</button>' +
             '<button class="btn primary wide big" data-sess="got">I had it</button>' +
           '</div>';
    }
    return shell(h);
  }

  function checkStep(q) {
    var h = progressBar() + stepCounter() +
      '<p class="sesskind chk">Quick check</p>' +
      '<p class="sessen">' + E(q.card.en) + '</p>' +
      '<div class="sessopts">';
    q.options.forEach(function (o, idx) {
      var state = '';
      if (run.chosen >= 0) {
        if (idx === q.answer) state = ' right';
        else if (idx === run.chosen) state = ' wrong';
        else state = ' dim';
      }
      h += '<button class="sessopt' + state + '" data-sess="answer" data-i="' + idx + '"' +
           (run.chosen >= 0 ? ' disabled' : '') + '>' +
           '<span class="oph">' + UI.sayHTML(UI.formFor(o).phon) + '</span>' +
           '<span class="opa ar" dir="rtl">' + E(UI.formFor(o).arv || o.ar) + '</span></button>';
    });
    h += '</div>';
    if (run.chosen >= 0) {
      h += '<p class="sessfb ' + (run.chosen === q.answer ? 'ok' : 'no') + '">' +
           (run.chosen === q.answer ? 'Yes — ' : 'Not quite. It is ') +
           UI.sayHTML(UI.formFor(q.card).phon) + '</p>' +
           (q.card.use ? '<p class="sessuse">' + E(q.card.use) + '</p>' : '') +
           '<button class="btn primary wide big" data-sess="next">Continue →</button>';
    }
    return shell(h);
  }

  function doneStep() {
    var s = streak();
    var h = '<p class="sessdone">✓</p><h1 class="sessdoneh">Session done</h1>';
    h += '<p class="sub">' + run.learned + ' new word' + (run.learned === 1 ? '' : 's') +
         ', ' + run.reviewed + ' brought back' +
         (run.asked ? ', ' + run.right + ' of ' + run.asked + ' right in the check' : '') + '.</p>';
    if (s > 1) h += '<p class="sessstreak">' + s + ' days in a row.</p>';
    else h += '<p class="sessstreak">Come back tomorrow and that becomes a run.</p>';
    h += '<div class="sesspair" style="margin-top:20px">' +
         '<a class="btn wide" href="#/">Home</a>' +
         '<button class="btn primary wide" data-sess="again">Another round →</button></div>';
    if (run.week) {
      h += '<p class="muted sm" style="margin-top:16px">You are on <a href="#/course/' + run.course.id +
           '/week/' + run.week.number + '">Week ' + run.week.number + ' — ' + E(run.week.title) + '</a>.</p>';
    }
    return shell(h, 'centred');
  }

  function nothingDue() {
    var p = plan();
    var h = '<p class="sessdone">✓</p><h1 class="sessdoneh">Nothing due</h1>' +
      '<p class="sub">Every word up to here is solid and there is nothing new left in this week. ' +
      'Either move the week on, or practise freely.</p>' +
      '<div class="sesspair" style="margin-top:20px">' +
      '<a class="btn wide" href="#/practice">Free practice</a>' +
      (p.week ? '<a class="btn primary wide" href="#/course/' + p.course.id + '/week/' + p.week.number +
                '">Week ' + p.week.number + ' →</a>' : '') +
      '</div>';
    return shell(h, 'centred');
  }

  /* ---------------- the view ---------------- */
  function todayView() {
    /* a session left open overnight is yesterday's; start a fresh one */
    if (run && run.day !== todayStr()) run = null;
    if (!run) { if (!start()) return nothingDue(); }
    if (run.i >= run.steps.length) return doneStep();
    var st = run.steps[run.i];
    if (st.kind === 'learn')  return learnStep(st.card);
    if (st.kind === 'recall') return recallStep(st.card);
    return checkStep(st.q);
  }

  /* ---------------- interaction ---------------- */
  function advance() {
    run.i++; run.revealed = false; run.chosen = -1;
    if (run.i >= run.steps.length) Store.set('did:' + todayStr(), true);
  }

  function handleClick(t) {
    var btn = t.closest ? t.closest('[data-sess]') : null;
    if (!btn) return false;
    var a = btn.dataset.sess;
    var st = run && run.steps[run.i];

    if (a === 'reveal') { run.revealed = true; return true; }
    if (a === 'got' || a === 'miss') {
      UI.markFam(st.card.id, a === 'got');
      advance(); return true;
    }
    if (a === 'next') {
      if (st && st.kind === 'learn') Store.set('seen:' + st.card.id, true);
      advance(); return true;
    }
    if (a === 'answer') {
      if (run.chosen >= 0) return true;
      run.chosen = parseInt(btn.dataset.i, 10);
      run.asked++;
      var ok = run.chosen === st.q.answer;
      if (ok) run.right++;
      UI.markFam(st.q.card.id, ok);
      Store.set('seen:' + st.q.card.id, true);
      return true;
    }
    if (a === 'again') { run = null; return true; }
    return false;
  }

  function reset() { run = null; }

  /* ---------------- the summary other pages show ---------------- */
  function statusStrip() {
    var p = plan();
    var solid = 0, ok = 0, shaky = 0, unseen = 0;
    p.all.forEach(function (c) {
      if (!seen(c.id)) { unseen++; return; }
      var s = UI.strength(c.id);
      if (s === 3) solid++; else if (s === 2) ok++; else shaky++;
    });
    var total = Math.max(1, p.all.length);
    var w = function (n) { return (n / total * 100).toFixed(1) + '%'; };
    var st = streak();

    return '<div class="status">' +
      '<div class="statnums">' +
        '<div class="stat"><b>' + st + '</b><span>day' + (st === 1 ? '' : 's') + ' in a row</span></div>' +
        '<div class="stat"><b>' + daysThisWeek() + '/7</b><span>days this week</span></div>' +
        '<div class="stat"><b>' + solid + '</b><span>words solid</span></div>' +
        '<div class="stat"><b>' + (p.dueTotal) + '</b><span>due for review</span></div>' +
      '</div>' +
      '<div class="statbar" role="img" aria-label="' + solid + ' solid, ' + ok + ' getting there, ' +
        shaky + ' shaky, ' + unseen + ' not started">' +
        '<span class="s3" style="width:' + w(solid) + '"></span>' +
        '<span class="s2" style="width:' + w(ok) + '"></span>' +
        '<span class="s1" style="width:' + w(shaky) + '"></span>' +
        '<span class="s0" style="width:' + w(unseen) + '"></span>' +
      '</div>' +
      '<div class="statkey">' +
        '<span><i class="s3"></i>solid ' + solid + '</span>' +
        '<span><i class="s2"></i>getting there ' + ok + '</span>' +
        '<span><i class="s1"></i>shaky ' + shaky + '</span>' +
        '<span><i class="s0"></i>not started ' + unseen + '</span>' +
      '</div></div>';
  }

  /* the one card that replaces the old home page clutter */
  function startCard() {
    var p = plan();
    var done = didToday();
    var n = p.fresh.length, r = p.due.length;
    var line = !n && !r ? 'Everything up to here is solid.'
             : (n ? n + ' new word' + (n === 1 ? '' : 's') : '') +
               (n && r ? ' and ' : '') +
               (r ? r + ' to bring back' : '') + '. About five minutes.';
    return '<a class="startcard' + (done ? ' done' : '') + '" href="#/today">' +
      '<div class="scleft">' +
        '<span class="crumb">' + (done ? 'Done today' : 'Today') + '</span>' +
        '<h2>' + (done ? 'Another round?' : 'Start today’s session') + '</h2>' +
        '<p>' + E(line) + '</p>' +
      '</div><span class="scgo">→</span></a>';
  }

  window.Views.today = todayView;
  window.Views.todayClick = handleClick;
  window.Views.resetToday = reset;
  window.Views.statusStrip = statusStrip;
  window.Views.startCard = startCard;
  window.Views.streak = streak;
})();
