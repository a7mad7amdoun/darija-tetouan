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
  var NEW_PER_SESSION = 5;
  var REVIEW_PER_SESSION = 25;
  /* Above this much overdue work, new words slow down and then stop. These
     thresholds were first set at 6 and 12 against a review cap of 10, which
     self-locked: simulating the real grade() and plan() over 180 days at 85%
     accuracy, only 188 of 326 drillable cards were ever introduced, and 108 of
     326 at 75%. New words were blocked outright on 93 days of 180. Three months
     of written content and the learner would have met about half of it.
     A 326-card course simply generates more daily review than a threshold of 6
     can tolerate. At 25/25/50 the same simulation introduces all 326 with no
     blocked days, at about 19 reviews a day. */
  var BACKLOG_PAUSE = 50;
  var BACKLOG_SLOW = 25;
  var CHECK_GAP = 4;        /* items between teaching a word and asking for it */
  var CHECK_QUESTIONS = 4;

  var run = null;

  /* The learner's local day, shared with the scheduler rather than computed a
     second way here. This was UTC while schedule.js used local, so in Tetouan
     (UTC+1) the streak and the scheduler disagreed about the date for the first
     hour of every day. */
  function todayStr() {
    return window.Sched ? Sched.todayStr()
                        : new Date().toISOString().slice(0, 10);
  }
  function seen(id) { return Store.get('seen:' + id, false) === true; }

  /* ---------------- what counts as done, and how long a run of days ---------- */
  function didToday() { return Store.get('did:' + todayStr(), false) === true; }

  /* Every date below goes through dayOf(), which is the learner's local day.
     These loops used to walk the calendar in UTC while todayStr() was local, so
     the two disagreed for the first hour of each day in Tetouan and a session
     finished at half past midnight was credited to the wrong day. */
  function dayOf(d) {
    return window.Sched ? Sched.todayStr(d) : d.toISOString().slice(0, 10);
  }

  function streak() {
    var n = 0, d = new Date();
    /* today only counts once it is done; yesterday still counts until midnight */
    if (!Store.get('did:' + todayStr(), false)) d.setDate(d.getDate() - 1);
    for (var i = 0; i < 400; i++) {
      if (!Store.get('did:' + dayOf(d), false)) break;
      n++; d.setDate(d.getDate() - 1);
    }
    return n;
  }

  function daysThisWeek() {
    var n = 0, d = new Date();
    for (var i = 0; i < 7; i++) {
      if (Store.get('did:' + dayOf(d), false)) n++;
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
    /* Due by the calendar, not by how well it once went. A word answered
       correctly twice used to be retired on the spot; now it comes back
       tomorrow, then in three days, then at a growing gap, for good. */
    /* Anything introduced but never scheduled - progress from before this
       existed - counts as maximally overdue and is MERGED INTO the sort rather
       than appended after it. Appending put it permanently behind the per-session
       cap while still inflating the backlog that blocks new words, so those cards
       could never be reached and never stopped counting against the learner. */
    var introduced = p.cards.filter(function (c) { return seen(c.id); });
    var due = introduced.filter(function (c) {
      return !Sched.isTracked(c.id) || Sched.isDue(c.id);
    });
    due.sort(function (a, b) {
      var oa = Sched.isTracked(a.id) ? Sched.overdueBy(a.id) : 9999;
      var ob = Sched.isTracked(b.id) ? Sched.overdueBy(b.id) : 9999;
      return ob - oa;
    });

    /* Due work comes first and the session is short, so new material yields
       to it rather than competing with it. */
    var backlog = due.length;
    var newAllowance = backlog >= BACKLOG_PAUSE ? 0
                     : backlog >= BACKLOG_SLOW  ? 2
                     : NEW_PER_SESSION;

    return {
      course: p.course, week: p.week, all: p.cards,
      fresh: fresh.slice(0, newAllowance),
      due: due.slice(0, REVIEW_PER_SESSION),
      freshTotal: fresh.length, dueTotal: due.length,
      backlog: backlog,
      newAllowance: newAllowance,
      /* what is still waiting after this session, so it can be said out loud
         rather than silently deferred */
      dueRemaining: Math.max(0, due.length - REVIEW_PER_SESSION),
      newHeldBack: newAllowance < NEW_PER_SESSION
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
    p.due.forEach(function (c) {
      /* Once a word is holding, stop offering it back and make them produce it.
         Recognising 'salam' in a list is not the same as reaching for it. */
      steps.push({ kind: Sched.isMature(c.id) ? 'produce' : 'recall', card: c });
    });

    /* Every new word gets ONE retrieval in the session that taught it, a few
       items later rather than straight after. Presentation alone teaches very
       little; the final check only drew four questions from the whole session,
       so three of four new words were never retrieved at all on the day they
       were introduced. One retrieval is where the value per minute is - more
       in the same sitting adds much less. Spaced by a few items, not adjacent,
       so it is a retrieval and not an echo. */
    p.fresh.forEach(function (c, n) {
      var at = Math.min(steps.length, (n + 1) * (CHECK_GAP + 1));
      steps.splice(at, 0, { kind: 'recall', card: c, firstTry: true });
    });
    var subject = p.fresh.concat(p.due);
    checkQuestions(subject, p.all).forEach(function (q) { steps.push({ kind: 'check', q: q }); });
    run = { steps: steps, i: 0, revealed: false, chosen: -1, right: 0, asked: 0,
            day: todayStr(), shownAt: Date.now(),
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
    if (window.Audio2) h += '<div class="arow">' + Audio2.button(c.id, c, { label: 'Hear it said' }) + '</div>';
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
           (window.Audio2 ? '<div class="arow">' + Audio2.button(c.id, c, { label: 'Hear the model' }) + '</div>' : '') +
           '<div class="sesspair">' +
             '<button class="btn wide big" data-sess="miss">Not yet</button>' +
             '<button class="btn primary wide big" data-sess="got">I had it</button>' +
           '</div>';
    }
    return shell(h);
  }

  /* Produce it: no options, they type what they would say. Marked leniently -
     this is a spoken language written in Latin letters by convention, so
     insisting on one spelling would be testing the convention, not the word. */
  function normalise(t) {
    return String(t || '').toLowerCase()
      .replace(/[`'’\-_.,!?()]/g, '')
      /* ch is the French-influenced spelling of the same sound these learners
         see on every menu and street sign in Morocco; 9 is the chat-Arabic q,
         and gh and r are written both ways. Accepting them costs nothing and a
         false rejection now shortens the review interval. */
      .replace(/kh/g, 'x').replace(/sh/g, 'c').replace(/ch/g, 'c')
      .replace(/9/g, 'q').replace(/gh/g, 'r')
      .replace(/ou/g, 'u').replace(/ii/g, 'i').replace(/aa/g, 'a').replace(/ee/g, 'i')
      /* spacing is not a fact about the word - 'men fin' and 'menfin' are the
         same thing said out loud, and the hyphens here are only our stress marks */
      .replace(/\s+/g, '');
  }

  function produceStep(c) {
    var f = UI.formFor(c);
    var h = progressBar() + stepCounter() +
      '<p class="sesskind pro">Say it yourself</p>' +
      '<p class="sessen">' + E(c.en) + '</p>';

    if (run.chosen < 0) {
      h += '<p class="sesshint">Type it the way you would say it. Spelling is not ' +
           'the point — close enough counts.</p>' +
           '<form id="produceform" class="produce">' +
             '<input name="say" autocomplete="off" autocapitalize="off" spellcheck="false" ' +
               'placeholder="in Darija, Latin letters" autofocus>' +
             '<button class="btn primary" type="submit">Check</button>' +
           '</form>' +
           '<button class="linkbtn" data-sess="giveup">I cannot remember it</button>';
    } else {
      var got = run.chosen === 1;
      h += '<p class="sessfb ' + (got ? 'ok' : 'no') + '">' +
           (got ? 'That is it.' : 'Not quite.') + '</p>' +
           (run.typed ? '<p class="muted sm">You wrote: ' + E(run.typed) + '</p>' : '') +
           '<p class="sesssay">' + UI.sayHTML(f.phon) + '</p>' +
           '<p class="sessar ar" dir="rtl">' + E(f.arv || c.ar) + '</p>' +
           (c.use ? '<p class="sessuse">' + E(c.use) + '</p>' : '') +
           '<button class="btn primary wide big" data-sess="next">Continue →</button>';
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
    var after = plan();
    if (after.dueTotal) {
      h += '<p class="sessleft">' + after.dueTotal + ' more still due today. ' +
           'Another round clears them.</p>';
    }
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
    var next = Sched.nextDueDate(p.all);
    var inDays = next ? Sched.daysBetween(Sched.todayStr(), next) : -1;
    var line = inDays > 0
      ? 'Nothing is due today. ' + (inDays === 1 ? 'The next words come back tomorrow.'
          : 'The next words come back in ' + inDays + ' days.')
      : 'Everything up to here is learned and there is nothing new left in this week.';

    var h = '<p class="sessdone">✓</p><h1 class="sessdoneh">Nothing due</h1>' +
      '<p class="sub">' + E(line) + ' Coming back on the day a word is due is what ' +
      'makes it stick — there is no benefit to drilling it early.</p>' +
      '<div class="sesspair" style="margin-top:20px">' +
      '<a class="btn wide" href="#/practice">Practise anyway</a>' +
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
    if (st.kind === 'learn')   return learnStep(st.card);
    if (st.kind === 'recall')  return recallStep(st.card);
    if (st.kind === 'produce') return produceStep(st.card);
    return checkStep(st.q);
  }

  /* ---------------- interaction ---------------- */
  function advance() {
    run.i++; run.revealed = false; run.chosen = -1; run.typed = '';
    run.shownAt = Date.now();
    if (run.i >= run.steps.length) Store.set('did:' + todayStr(), true);
  }

  function handleClick(t) {
    var btn = t.closest ? t.closest('[data-sess]') : null;
    if (!btn) return false;
    var a = btn.dataset.sess;
    var st = run && run.steps[run.i];

    if (a === 'reveal') { run.revealed = true; return true; }
    if (a === 'got' || a === 'miss') {
      /* Assisted, and honestly so: these two buttons only exist in the
         revealed branch, so the Darija and the Arabic are both on screen when
         the learner says whether they had it. Under attempts.js's own
         definition that is assistance, and marking it otherwise is what let a
         self-report lift the production cap on the first review of every card. */
      UI.markFam(st.card.id, a === 'got', { task: 'recall', assisted: true,
                                            ms: run.shownAt ? Date.now() - run.shownAt : undefined });
      advance(); return true;
    }
    if (a === 'next') {
      if (st && st.kind === 'learn') {
        Store.set('seen:' + st.card.id, true);
        if (window.Attempts) Attempts.record(st.card.id, { task: 'learn', ok: true, assisted: true, sched: 'none' });
      }
      advance(); return true;
    }
    if (a === 'answer') {
      if (run.chosen >= 0) return true;
      run.chosen = parseInt(btn.dataset.i, 10);
      run.asked++;
      var ok = run.chosen === st.q.answer;
      if (ok) run.right++;
      UI.markFam(st.q.card.id, ok, { task: 'recognise',
                                     ms: run.shownAt ? Date.now() - run.shownAt : undefined });
      Store.set('seen:' + st.q.card.id, true);
      return true;
    }
    if (a === 'giveup') {
      run.chosen = 0; run.typed = '';
      UI.markFam(st.card.id, false, { task: 'produce', assisted: true });
      return true;
    }
    if (a === 'again') { run = null; return true; }
    return false;
  }

  /* Called from the submit handler, since this step takes typing. */
  function answerProduced(text) {
    var st = run && run.steps[run.i];
    if (!st || st.kind !== 'produce' || run.chosen >= 0) return false;
    /* Some cards carry two acceptable forms separated by a slash - a masculine
       and a feminine, say. Either one is a correct answer. These two cards could
       previously NEVER be answered correctly, which under the lapse rules meant
       a failure and a shortened interval every single time they came up. */
    var wants = String(UI.formFor(st.card).phon || '').split('/')
                  .map(normalise).filter(function (x) { return x.length; });
    var got = normalise(text);
    var right = got.length > 0 && wants.some(function (want) {
      return got === want || (want.indexOf(got) === 0 && got.length >= want.length - 1);
    });
    run.typed = text;
    run.chosen = right ? 1 : 0;
    run.asked++;
    if (right) run.right++;
    UI.markFam(st.card.id, right, { task: 'produce',
                                    ms: run.shownAt ? Date.now() - run.shownAt : undefined });
    return true;
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
    var sc = Sched.counts(p.all);

    return '<div class="status">' +
      '<div class="statnums">' +
        '<div class="stat"><b>' + st + '</b><span>day' + (st === 1 ? '' : 's') + ' in a row</span></div>' +
        '<div class="stat"><b>' + daysThisWeek() + '/7</b><span>days this week</span></div>' +
        '<div class="stat"><b>' + solid + '</b><span>words solid</span></div>' +
        '<div class="stat"><b>' + p.dueTotal + '</b><span>due for review</span></div>' +
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
      '</div>' +
      (p.backlog >= BACKLOG_SLOW
        ? '<p class="statsoon warn">' + p.backlog + ' are waiting to come back. ' +
          (p.newAllowance === 0 ? 'New words are paused until that clears.'
                                : 'New words are slowed until that clears.') + '</p>'
        : sc.soon ? '<p class="statsoon">' + sc.soon + ' more come back within three days.</p>' : '') +
      '</div>';
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
    if (p.newHeldBack) {
      line += p.newAllowance === 0
        ? ' No new words today — ' + p.backlog + ' are waiting to come back first.'
        : ' Fewer new words today, because ' + p.backlog + ' are waiting to come back.';
    }
    if (p.dueRemaining) line += ' ' + p.dueRemaining + ' more after that.';
    return '<a class="startcard' + (done ? ' done' : '') + '" href="#/today">' +
      '<div class="scleft">' +
        '<span class="crumb">' + (done ? 'Done today' : 'Today') + '</span>' +
        '<h2>' + (done ? 'Another round?' : 'Start today’s session') + '</h2>' +
        '<p>' + E(line) + '</p>' +
      '</div><span class="scgo">→</span></a>';
  }

  window.Views.today = todayView;
  window.Views.todayClick = handleClick;
  window.Views.todayProduced = answerProduced;
  window.Views.resetToday = reset;
  window.Views.statusStrip = statusStrip;
  window.Views.startCard = startCard;
  window.Views.streak = streak;
})();
