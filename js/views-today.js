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
  /* Above this much overdue work, new words slow down and then stop.

     A correction to what an earlier version of this comment claimed. It said
     these thresholds had been measured against "the real grade() and plan()";
     they had not - the simulation behind that number reimplemented the
     scheduler inside the test file and drew from every card in the course
     rather than the ones a session can reach. Independent review caught it.
     The thresholds were never the binding constraint: the real limits were two
     course-progression gates, now fixed in pool() and teachingCourse() above.

     These figures ARE from driving the real scheduler, day by day, through its
     own clock: 326 of 326 cards introduced within 180 days at both 95% and 85%
     accuracy, at 14 and 20 reviews a day, with no day on which new words were
     blocked. At 75% it reaches 267 of 326, because review correctly takes
     priority - a trade-off, recorded rather than tuned away. See
     throughput.js, which reads these constants from this file so they cannot
     drift away from the test. */
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
  /* What the session may draw from, split in two because the two halves have
     different rules.

     NEW material is paced by the course: the current month, up to the week the
     learner has reached. That is right - teaching month 3 vocabulary in week 2
     would be incoherent.

     REVIEW is not paced by anything. Once a word has been introduced it must
     stay reachable for the rest of the course, whatever month it came from.
     This used to apply the course-and-week filter to BOTH, so the day the
     learner moved to month 2, all 125 month-1 cards left the review pool for
     good: their schedules kept going overdue, the teacher's weak-spots view
     kept ranking them, and the session could never serve them again. "Nothing
     is ever retired" was true of the scheduler and false one layer above it. */
  /* Which course is new material drawn from? UI.currentCourse() answers "the
     first one not yet 100% complete", and completeness is built from the day and
     self-check ticks made on the Week pages. The daily session does not make
     those, so a learner who only ever opens the session finished month 1 and
     then drew new words from nowhere for the remaining five months - 125 of 326
     cards, with the other two months unreachable. The same mistake as the week
     frontier, one level up.

     So: the first active course that still has something unlearned. The week and
     course ticks stay what they were, the learner's and the teacher's own record
     of having worked through a week; they no longer gate what can be taught. */
  function teachingCourse() {
    var act = UI.activeCourses();
    for (var i = 0; i < act.length; i++) {
      var c = act[i];
      var unlearned = UI.allActiveCards().some(function (card) {
        return card.courseId === c.id && card.freq !== 'extra' && !seen(card.id);
      });
      if (unlearned) return c;
    }
    return UI.currentCourse();
  }

  function pool() {
    var course = teachingCourse();
    if (!course || !course.weeks) {
      return { course: course, week: null, cards: [], newCards: [], reviewable: [] };
    }
    var wk = UI.currentWeek(course);
    var drillable = UI.allActiveCards().filter(function (c) {
      return c.freq !== 'extra';     /* extras are for browsing, not drilling */
    });
    var mine = drillable.filter(function (c) { return c.courseId === course.id; });

    /* How far through the course may new words come from?

       UI.currentWeek() advances only when a week is marked complete, and that
       depends on day and self-check ticks made on the Week pages. The daily
       session does not make those - it records that the day was done. So a
       learner who opens the session every day and never visits a Week page
       stayed on week 1 for six months and saw about fifty words.

       The frontier is instead the first week that still has something unlearned.
       The session paces itself by what has actually been introduced, which is a
       fact it owns, while the week ticks remain what they were: the learner's
       and the teacher's own marker of having worked through a week. Neither
       overrides the other, and new words never run ahead of unlearned ones. */
    var weeks = (course.weeks || []).map(function (w) { return w.number; });
    var frontier = wk ? wk.number : 1;
    for (var i = 0; i < weeks.length; i++) {
      var n = weeks[i];
      var unlearned = mine.some(function (c) { return c.week === n && !seen(c.id); });
      if (unlearned) { frontier = Math.max(frontier, n); break; }
      frontier = Math.max(frontier, n + 1);
    }

    var newCards = mine.filter(function (c) {
      return c.week == null || c.week <= frontier;
    });

    /* everything already introduced, from any month */
    var reviewable = drillable.filter(function (c) { return seen(c.id); });

    return {
      course: course, week: wk, frontier: frontier,
      cards: drillable,            /* for counting and for the status strip */
      newCards: newCards,
      reviewable: reviewable
    };
  }

  function plan() {
    var p = pool();
    var fresh = p.newCards.filter(function (c) { return !seen(c.id); });
    /* teach in the order the course teaches, core words before useful ones */
    fresh.sort(function (a, b) {
      if ((a.week || 0) !== (b.week || 0)) return (a.week || 0) - (b.week || 0);
      if ((a.freq === 'core') !== (b.freq === 'core')) return a.freq === 'core' ? -1 : 1;
      return 0;
    });

    /* Anything introduced but never scheduled - progress from before this
       existed - counts as maximally overdue and is MERGED INTO the sort rather
       than appended after it. Appending put it permanently behind the per-session
       cap while still inflating the backlog that blocks new words, so those cards
       could never be reached and never stopped counting against the learner. */
    var due = p.reviewable.filter(function (c) {
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
      course: p.course, week: p.week, frontier: p.frontier, all: p.cards,
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
    /* Place each first retrieval CHECK_GAP items after its own teaching step,
       counting the retrievals already inserted. Clamping to steps.length made
       them all land together at the end on day one, when there is no due work
       to space them out - which is the day the spacing matters most. */
    p.fresh.forEach(function (c, n) {
      var teachAt = n;                       /* its learn step */
      var at = Math.min(steps.length, teachAt + CHECK_GAP + 1 + n);
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

  /* bar and count share one line, so the arch below gets the screen */
  function progressBar() {
    var pct = Math.round(run.i / Math.max(1, run.steps.length) * 100);
    return '<div class="sesshead"><div class="sessbar" role="progressbar" aria-valuemin="0" ' +
           'aria-valuemax="' + run.steps.length + '" aria-valuenow="' + run.i + '" ' +
           'aria-label="Session progress"><span style="width:' + pct + '%"></span></div>' +
           '<p class="sessstep">' + (run.i + 1) + ' / ' + run.steps.length + '</p></div>';
  }

  function stepCounter() { return ''; }

  /* The arch: the word's three forms as one composed unit, in the teaching
     order - English, then the Darija, then the Arabic. They used to sit as
     separate lines, English and Latin hugging the left and the Arabic alone on
     the right, so the eye read three things instead of one word. */
  function arch(inner, cls) {
    return '<div class="arch' + (cls ? ' ' + cls : '') + '">' + inner + '</div>';
  }

  /* a brand new word: show everything, ask nothing */
  function learnStep(c) {
    var f = UI.formFor(c);
    var h = progressBar() + stepCounter() +
      '<p class="sesskind new">New word</p>' +
      arch('<p class="sessen">' + E(c.en) + '</p>' +
           '<p class="sesssay">' + UI.sayHTML(f.phon) + '</p>' +
           '<p class="sessar ar" dir="rtl" lang="ar">' + E(f.arv || c.ar) + '</p>' +
           (window.Audio2 ? '<div class="arow">' + Audio2.button(c.id, c, { label: 'Hear it said' }) + '</div>' : ''));
    if (c.use) h += '<p class="sessuse"><strong>When you say it.</strong> ' + E(c.use) + '</p>';
    if (c.example) {
      h += '<div class="sessex"><span class="crumb">For example</span>' +
           '<p class="sesssay sm">' + UI.sayHTML(c.example.phon || '') + '</p>' +
           '<p class="muted sm">' + E(c.example.en || '') + '</p></div>';
    }
    h += '<div class="sessact"><button class="btn primary wide big" data-sess="next">' +
         'Say it out loud, then continue</button></div>';
    return shell(h);
  }

  /* a word seen before: ask first, reveal second, they mark themselves */
  function recallStep(c) {
    var f = UI.formFor(c);
    var h = progressBar() + stepCounter() +
      '<p class="sesskind rev">From before</p>';
    if (!run.revealed) {
      /* the answer's place is held by a veil, so the arch keeps its shape and
         the reveal lands where the eye already is */
      h += arch('<p class="sessen">' + E(c.en) + '</p>' +
                '<div class="veil" aria-hidden="true"></div>' +
                '<p class="sesshint">Say it in Darija, out loud, before you look.</p>');
      h += '<div class="sessact"><button class="btn wide big" data-sess="reveal">Show me</button></div>';
    } else {
      h += arch('<p class="sessen">' + E(c.en) + '</p>' +
                '<p class="sesssay">' + UI.sayHTML(f.phon) + '</p>' +
                '<p class="sessar ar" dir="rtl" lang="ar">' + E(f.arv || c.ar) + '</p>' +
                (window.Audio2 ? '<div class="arow">' + Audio2.button(c.id, c, { label: 'Hear the model' }) + '</div>' : ''),
                'reveal-in');
      /* The two answers are given EQUAL weight on purpose. Self-reports of
         speaking skew optimistic, and most of all for the weakest speakers;
         making "I said it first" the big green button was a visual nudge
         toward the flattering answer, and the schedule is built on this one
         tap. Neither is the right answer, so neither looks like it. */
      h += '<div class="sessact"><p class="sessq">Did you say it before you looked?</p>' +
           '<div class="sesspair selfcheck">' +
             '<button class="btn wide big" data-sess="miss">I needed the answer</button>' +
             '<button class="btn wide big" data-sess="got">I said it first</button>' +
           '</div></div>';
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
         see on every menu and street sign in Morocco, and 9 is the chat-Arabic
         q. Both are the same sound written two ways, so accepting them costs
         nothing and a false rejection now shortens a review interval.

         'gh -> r' was here too and has been REMOVED: غ and ر are different
         phonemes, distinguished in Tetouani, and treating them as equal accepts
         a different word rather than a different spelling. That is a dialect
         judgement, not an orthographic one, and it is Ahmed's to make - see
         RESEARCH-LOG.md. */
      .replace(/kh/g, 'x').replace(/sh/g, 'c').replace(/ch/g, 'c')
      .replace(/9/g, 'q')
      .replace(/ou/g, 'u').replace(/ii/g, 'i').replace(/aa/g, 'a').replace(/ee/g, 'i')
      /* spacing is not a fact about the word - 'men fin' and 'menfin' are the
         same thing said out loud, and the hyphens here are only our stress marks */
      .replace(/\s+/g, '');
  }

  function produceStep(c) {
    var f = UI.formFor(c);
    var h = progressBar() + stepCounter() +
      '<p class="sesskind pro">Say it yourself</p>';

    if (run.chosen < 0) {
      h += arch('<p class="sessen">' + E(c.en) + '</p>' +
                '<div class="veil" aria-hidden="true"></div>' +
                '<p class="sesshint">Type it the way you would say it. Spelling is not ' +
                'the point — close enough counts.</p>');
      h += '<div class="sessact">' +
           '<form id="produceform" class="produce">' +
             /* every one of these is load-bearing on a phone: without
                autocorrect="off" iOS rewrites Darija written in Latin letters
                into English words, and the learner is marked wrong for what the
                keyboard did. */
             '<input name="say" type="text" autocomplete="off" autocorrect="off" ' +
               'autocapitalize="none" spellcheck="false" enterkeyhint="done" ' +
               'aria-label="Your answer, in Darija" ' +
               'placeholder="in Darija, Latin letters" autofocus>' +
             '<button class="btn primary" type="submit">Check</button>' +
           '</form>' +
           '<button class="linkbtn" data-sess="giveup">I cannot remember it</button></div>';
    } else {
      var got = run.chosen === 1;
      h += arch('<p class="sessen">' + E(c.en) + '</p>' +
                '<p class="sesssay">' + UI.sayHTML(f.phon) + '</p>' +
                '<p class="sessar ar" dir="rtl" lang="ar">' + E(f.arv || c.ar) + '</p>',
                'reveal-in');
      h += '<p class="sessfb ' + (got ? 'ok' : 'no') + '">' +
           (got ? 'That is it.' : 'Not quite.') + '</p>' +
           (run.typed ? '<p class="sessyou">You wrote <span>' + E(run.typed) + '</span></p>' : '') +
           (c.use ? '<p class="sessuse">' + E(c.use) + '</p>' : '') +
           '<div class="sessact"><button class="btn primary wide big" data-sess="next">Continue</button></div>';
    }
    return shell(h);
  }

  function checkStep(q) {
    var h = progressBar() + stepCounter() +
      '<p class="sesskind chk">Quick check</p>' +
      arch('<p class="sessen big">' + E(q.card.en) + '</p>' +
           '<p class="sesshint">Which is the Tetouani?</p>', 'small') +
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
           '<div class="sessact"><button class="btn primary wide big" data-sess="next">Continue</button></div>';
    }
    return shell(h);
  }

  /* The pointed arch of the TetouTalk mark, without its speech tail: the one
     recurring shape, used small. Open at the foot, like a doorway. */
  var ARCH = 'M5 21V11.4C5 8.2 7.3 6.3 9.8 5L12 3.6 14.2 5C16.7 6.3 19 8.2 19 11.4V21';

  /* the arch, with a check standing in the doorway, for the finish */
  function doneMark(size) {
    return '<svg viewBox="0 0 24 24" width="' + size + '" height="' + size + '" aria-hidden="true">' +
      '<g fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round">' +
      '<path d="' + ARCH + '" stroke-width="1.1"/><path d="M3.5 21h17" stroke-width="1.1"/>' +
      '<path d="m9.3 14.6 1.9 1.9 3.6-4.1" stroke-width="1.4"/></g></svg>';
  }

  function doneStep() {
    var s = streak();
    var h = '<div class="sessdone">' + doneMark(84) + '</div><h1 class="sessdoneh">Session done</h1>';
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
    h += '<div class="sesspair" style="margin-top:26px">' +
         '<a class="btn wide big" href="#/">Home</a>' +
         '<button class="btn primary wide big" data-sess="again">Another round</button></div>';
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

    var h = '<div class="sessdone">' + doneMark(84) + '</div><h1 class="sessdoneh">Nothing due</h1>' +
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
      UI.markFam(st.card.id, a === 'got', {
        task: 'recall', assisted: true,
        /* Failing to recall a word first met four items ago is not evidence
           that it has been forgotten - it has barely been learned. Without
           this, the retrieval added to help a new word stick gave it a lapse,
           a permanent ease penalty and a reset on the day it was introduced. */
        soft: !!st.firstTry,
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
    /* An exact match always counts. A prefix counts only when it is one
       character short of a word of real length - otherwise, for a card whose
       phonetics hold a short alternative, a single letter would pass. */
    var right = got.length > 0 && wants.some(function (want) {
      if (got === want) return true;
      if (want.length < 4) return false;
      return want.indexOf(got) === 0 && got.length >= want.length - 1;
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
    var w = function (n) { return (n / total * 100).toFixed(2) + '%'; };
    var st = streak(), wk = daysThisWeek();
    var learned = solid + ok + shaky;

    return '<section class="status">' +
      '<div class="statrowx">' +
        '<div class="streak"><span class="streakn">' + st + '</span>' +
          '<span class="streakl">day' + (st === 1 ? '' : 's') + '<br>in a row</span></div>' +
        '<div class="stars" role="img" aria-label="' + wk + ' of the last 7 days done">' +
          weekStars() + '</div>' +
      '</div>' +
      '<div class="words">' +
        '<div class="wordshead"><span class="crumb">Your words</span>' +
          '<span class="wordsn"><b>' + learned + '</b> of ' + p.all.length + ' met' +
          (p.dueTotal ? ' · <b>' + p.dueTotal + '</b> due' : '') + '</span></div>' +
        '<div class="statbar" role="img" aria-label="' + solid + ' solid, ' + ok + ' getting there, ' +
          shaky + ' shaky, ' + unseen + ' not started">' +
          '<span class="s3" style="width:' + w(solid) + '"></span>' +
          '<span class="s2" style="width:' + w(ok) + '"></span>' +
          '<span class="s1" style="width:' + w(shaky) + '"></span>' +
        '</div>' +
        '<div class="statkey">' +
          '<span><i class="s3"></i>' + solid + ' solid</span>' +
          '<span><i class="s2"></i>' + ok + ' getting there</span>' +
          '<span><i class="s1"></i>' + shaky + ' shaky</span>' +
        '</div>' +
      '</div>' +
      (p.backlog >= BACKLOG_SLOW
        ? '<p class="statsoon warn">' + p.backlog + ' are waiting to come back. ' +
          (p.newAllowance === 0 ? 'New words are paused until that clears.'
                                : 'New words are slowed until that clears.') + '</p>'
        : '') +
      '</section>';
  }

  /* THE DOOR. Today's session is a doorway onto Feddan Square - the real
     square at the centre of Tetouan, a CC0 photograph (see
     assets/photos/CREDITS.md) - with the way in beneath it. The arch is the
     same shape that frames each word in the session, so stepping through it
     is the same gesture as studying. */
  function startCard() {
    var p = plan();
    var done = didToday();
    var n = p.fresh.length, r = p.due.length;
    var parts = [];
    if (n) parts.push('<b>' + n + '</b> new');
    if (r) parts.push('<b>' + r + '</b> to bring back');
    var line = parts.length ? parts.join(' · ') : 'Everything up to here is solid';
    var note = '';
    if (p.newHeldBack) {
      note = p.newAllowance === 0
        ? 'No new words today — ' + p.backlog + ' are waiting to come back first.'
        : 'Fewer new words today, because ' + p.backlog + ' are waiting.';
    } else if (p.dueRemaining) {
      note = p.dueRemaining + ' more after this one.';
    }

    return '<a class="door' + (done ? ' done' : '') + '" href="#/today">' +
      '<span class="doorhead">' +
        '<img src="assets/photos/tetouan-feddan-square-800.jpg" ' +
             'srcset="assets/photos/tetouan-feddan-square-800.jpg 800w, ' +
                     'assets/photos/tetouan-feddan-square-1600.jpg 1600w" ' +
             'sizes="(max-width:640px) 92vw, 520px" ' +
             'alt="Feddan Square in Tetouan, with the white medina rising behind it" ' +
             'loading="eager" decoding="async">' +
        '<span class="doorplace">Feddan Square, Tetouan</span>' +
      '</span>' +
      '<span class="doorbody">' +
        '<span class="crumb">' + (done ? 'Done today' : 'Today') + '</span>' +
        '<span class="doortitle">' + (done ? 'Another round?' : 'Today’s session') + '</span>' +
        '<span class="doorline">' + line + (parts.length ? ' · about five minutes' : '') + '</span>' +
        (note ? '<span class="doornote">' + E(note) + '</span>' : '') +
        '<span class="doorgo">' + (done ? 'Go again' : 'Begin') +
          '<svg class="ico" aria-hidden="true"><use href="#i-arrow"/></svg></span>' +
      '</span>' +
    '</a>';
  }

  /* The last seven days as seven small arches - filled where a session was done.
     A streak is shown, never rewarded: no badges, no points, nothing to lose. */
  function weekStars() {
    var out = '', d = new Date();
    var days = [];
    for (var i = 6; i >= 0; i--) {
      var x = new Date(d); x.setDate(d.getDate() - i);
      days.push(x);
    }
    var names = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
    days.forEach(function (x, i) {
      var on = Store.get('did:' + dayOf(x), false) === true;
      var isToday = i === 6;
      out += '<span class="star' + (on ? ' on' : '') + (isToday ? ' today' : '') + '" ' +
             'title="' + x.toDateString() + (on ? ' — done' : '') + '">' +
             '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="' + ARCH + 'Z"/></svg>' +
             '<i>' + names[x.getDay()] + '</i></span>';
    });
    return out;
  }

  window.Views.weekStars = weekStars;
  window.Views.today = todayView;
  window.Views.todayClick = handleClick;
  window.Views.todayProduced = answerProduced;
  window.Views.resetToday = reset;
  window.Views.statusStrip = statusStrip;
  window.Views.startCard = startCard;
  /* exported so the throughput suite can drive the real selection rather than
     a reimplementation of it in the test file */
  window.Views.todayPlan = plan;
  window.Views.streak = streak;
})();
