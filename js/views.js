/* Page renderers. Each returns an HTML string; app.js mounts it and wires events. */
(function () {
  var D = window.DARIJA, E = UI.esc;

  function courseById(id) {
    for (var i = 0; i < D.courses.length; i++) if (D.courses[i].id === id) return D.courses[i];
    return null;
  }
  function sitById(id) {
    for (var i = 0; i < D.situations.length; i++) if (D.situations[i].id === id) return D.situations[i];
    return null;
  }

  /* ========================= HOME ========================= */
  /* Home is deliberately short. A learner should land on one obvious action
     and a plain answer to "where am I". Everything else lives in the Library,
     one tap away, where browsing is the point. */
  /* ---------- the next useful action, on Home ----------
     Everything below only reads. Rendering Home writes nothing: no attempt,
     no schedule, no completion (tests/home.js checks the document and the
     outbox are unchanged). */

  function findWordBox() {
    return '<form class="findword" id="findword" role="search">' +
      '<label for="findq">Find a word</label>' +
      '<div class="findrow"><input id="findq" name="q" type="search" autocomplete="off" autocorrect="off" ' +
        'autocapitalize="none" spellcheck="false" placeholder="English, Darija or Arabic">' +
      '<button class="btn" type="submit">Search</button></div></form>';
  }

  /* One real situation to use this week: the current week's, else the most
     recent one not yet marked done. Reading it records nothing. */
  function outsideSituation(wkNum) {
    var sits = (D.situations || []).slice();
    var ready = sits.filter(function (s) { return s.week <= (wkNum || 1); });
    if (!ready.length) ready = sits.slice(0, 1);
    var open = ready.filter(function (s) { return !Store.get('sitdone:' + s.id, false); });
    var pool = open.length ? open : ready;
    pool.sort(function (a, b) {
      return ((b.week === wkNum) - (a.week === wkNum)) || (b.week - a.week);
    });
    return pool[0] || null;
  }
  function outsideCard(wk) {
    var s = outsideSituation(wk && wk.number);
    if (!s) return '';
    return '<a class="outside" href="#/situations/' + E(s.id) + '">' +
      '<span class="crumb">Use it outside</span>' +
      '<span class="otitle">' + s.icon + ' ' + E(s.title) + '</span>' +
      '<span class="owhen">' + E(s.when) + '</span>' +
      '<span class="ogo">Rehearse it, then try it for real <svg class="ico" aria-hidden="true"><use href="#i-arrow"/></svg></span></a>';
  }

  /* The words with the most recent trouble, ranked by the same evidence the
     teacher's weak spots use - with that evidence shown, not a score. */
  function slippingCard() {
    if (!window.Weak || !window.Attempts) return '';
    var seenCards = UI.allActiveCards().filter(function (c) { return Store.get('seen:' + c.id, false); });
    var top = Weak.targets(seenCards, 3);
    if (!top.length) return '';
    var h = '<section class="slipping"><span class="crumb">Words that keep slipping</span><ul>';
    top.forEach(function (t) {
      var s = Attempts.summary(t.card.id);
      /* the evidence as it is: dated misses when there are some, otherwise the
         older lifetime count, said to be undated */
      var fw = (UI.fam(t.card.id) || {}).w || 0;
      var why = s.recentFailures ? s.recentFailures + ' missed in the last 30 days'
              : s.failures ? s.failures + ' missed so far'
              : fw ? 'missed ' + fw + ' time' + (fw === 1 ? '' : 's') + ' before (no dates kept)' : 'worth another look';
      h += '<li><span class="sen">' + E(t.card.en) + '</span>' +
           '<span class="say ssay">' + UI.sayHTML(UI.formFor(t.card).phon) + '</span>' +
           '<span class="swhy">' + E(why) + '</span></li>';
    });
    return h + '</ul><a class="linkbtn" href="#/practice?set=weak">Practise the words that need work</a></section>';
  }

  /* How many introduced words have a saved due date overdue, today, and on
     each of the next seven days. A count of dates as they are saved now -
     each answer moves them - not a forecast. Reads only. */
  function scheduleCounts() {
    var today = Sched.todayStr();
    var days = [];
    for (var i = 0; i <= 7; i++) days.push({ date: Sched.addDays(today, i), n: 0 });
    var out = { today: today, overdue: 0, days: days, later: 0, invalid: 0, unscheduled: 0, unmatched: 0 };
    var known = {};
    UI.allActiveCards().forEach(function (c) {
      known[c.id] = 1;
      if (!Store.get('seen:' + c.id, false)) return;
      var s = Sched.get(c.id);
      if (!s) { out.unscheduled++; return; }
      if (typeof s.d !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(s.d)) { out.invalid++; return; }
      if (s.d < today) { out.overdue++; return; }
      for (var j = 0; j < days.length; j++) if (days[j].date === s.d) { days[j].n++; return; }
      out.later++;
    });
    var doc = window.Storage && Storage.currentDoc && Storage.currentDoc();
    Object.keys((doc && doc.entries) || {}).forEach(function (k) {
      if (k.indexOf('sched:') === 0 && !known[k.slice(6)]) out.unmatched++;
    });
    return out;
  }
  function dueChart() {
    var c = scheduleCounts();
    var rows = [{ label: 'Overdue', n: c.overdue, cls: 'over' }];
    c.days.forEach(function (d, i) {
      var label = i === 0 ? 'Today' : i === 1 ? 'Tomorrow'
        : new Date(d.date + 'T12:00:00').toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric' });
      rows.push({ label: label, n: d.n, cls: i === 0 ? 'today' : '' });
    });
    var total = rows.reduce(function (s, r) { return s + r.n; }, 0) + c.later;
    if (!total) return '';
    var max = Math.max.apply(null, rows.map(function (r) { return r.n; }).concat([1]));
    var h = '<section class="dueplan"><span class="crumb">When your words come back</span>' +
      '<table><caption class="sr">Words with a saved review date: overdue, today and the next seven days</caption><tbody>';
    rows.forEach(function (r) {
      h += '<tr class="' + r.cls + '"><th scope="row">' + E(r.label) + '</th><td>' +
           '<span class="dpbar" style="width:' + Math.round(r.n / max * 100) + '%"></span>' +
           '<span class="dpn">' + r.n + '</span></td></tr>';
    });
    h += '</tbody></table><p class="dpnote">The dates saved now' +
         (c.later ? ', plus ' + c.later + ' further out' : '') +
         '. Every answer moves them, so this is not a forecast.' +
         (c.unmatched ? ' ' + c.unmatched + ' saved schedule' + (c.unmatched === 1 ? ' belongs' : 's belong') +
           ' to words not in the course now; kept, not counted.' : '') + '</p></section>';
    return h;
  }

  function home() {
    var course = UI.currentCourse();
    var wk = UI.currentWeek(course);
    var name = (window.Auth && Auth.currentProfile() && Auth.currentProfile().name) || '';
    var hour = new Date().getHours();
    /* English only. A Darija greeting here would have to come from the course,
       and the course does not teach a time-of-day greeting - inventing one in
       the interface is exactly the unverified content this project refuses. */
    var greet = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';
    var first = name ? E(name.split(' ')[0]) : '';

    /* the tagline above, the introduction below - one short line each, so a
       returning learner still reaches the door without scrolling */
    var B = (window.Account && Account.BRAND) || {};
    var h = '<section class="homehead">' +
      (B.tagline ? '<p class="hometag">' + E(B.tagline) + '</p>' : '') +
      '<h1>' + E(greet) + (first ? ', <span class="hname">' + first + '</span>' : '') + '</h1>' +
      (B.intro ? '<p class="homeintro">' + E(B.intro) + '</p>' : '') +
      '</section>';

    h += '<div class="homegrid2"><div class="homemain">';
    h += Views.startCard();
    h += findWordBox() + outsideCard(wk);
    h += '</div><div class="homeside">';
    h += Views.statusStrip();
    h += slippingCard() + dueChart();

    /* the month as four arches, one per week */
    h += '<section class="month"><div class="monthhead"><span class="crumb">' + E(course.label) +
         '</span>' + (wk ? '<a href="#/course/' + course.id + '/week/' + wk.number + '" class="monthnow">' +
         E(wk.title) + '</a>' : '') + '</div><div class="arches">';
    course.weeks.forEach(function (w) {
      var p = UI.weekProgress(course.id, w);
      var isNow = wk && w.number === wk.number;
      h += '<a href="#/course/' + course.id + '/week/' + w.number + '" ' +
           'class="warch' + (p.complete ? ' done' : '') + (isNow && !p.complete ? ' now' : '') + '" ' +
           'aria-label="Week ' + w.number + (p.complete ? ', complete' : isNow ? ', current' : '') + '">' +
           '<span class="wfill" style="height:' + (p.complete ? 100 : p.pct) + '%"></span>' +
           '<span class="wnum">' + w.number + '</span></a>';
    });
    h += '</div></section>';
    h += '</div></div>';

    h += '<a class="libcta" href="#/library"><span class="libt">Library</span>' +
         '<small>Every word, conversation and situation, and what makes it Tetouani</small>' +
         '<svg class="ico" aria-hidden="true"><use href="#i-arrow"/></svg></a>';

    h += '<div class="teacher-only" style="margin-top:16px">' +
         '<a class="btn wide" href="#/teacher">Open the teacher workspace</a></div>';
    return h;
  }


  /* Everything that used to crowd the home page. Browsing is the point here,
     so density is fine. */
  function library() {
    var course = UI.currentCourse();
    /* "Everything in the course": every month's words, as the Words page
       counts them - this counted the current month only (136 of 338) */
    var cards = UI.allActiveCards();
    var nCore = cards.filter(function (c) { return c.freq === 'core'; }).length;

    var h = UI.banner('vocab') + '<h1>Library</h1>' +
      '<p class="sub">Everything in the course, to look through whenever you want. ' +
      'None of it is required — the daily session already picks what you need next.</p>';

    /* the same order as the strip at the top: the plan and the words, then
       speaking practice, then checking yourself */
    h += '<h2>Your course and your words</h2><div class="tiles">' +
         tile('#/course/' + course.id, '📘', course.label, E(course.goal)) +
         tile('#/vocab', '🗂️', 'Words', nCore + ' everyday words, ' + cards.length + ' in all') +
         '</div>';

    h += '<h2>Practise speaking</h2><div class="tiles">' +
         tile('#/practice', '🎯', 'Flashcards', 'Say it out loud, then reveal') +
         tile('#/situations', '💬', 'Situations', D.situations.length + ' real scenes — start in English, finish in Darija') +
         tile('#/dialogues', '🗣️', 'Conversations', UI.allDialogues().length + ' full exchanges, both sides scripted') +
         tile('#/sentences', '🧱', 'Sentences', UI.allSentences().length + ' sentences broken into their pieces') +
         '</div>';

    h += '<h2>Check yourself</h2><div class="tiles">' +
         tile('#/tests', '🎲', 'Tests', Tests.list.length + ' short tests: pictures, gaps, spoken') +
         tile('#/exams', '📋', 'Quizzes', 'Weekly quizzes and the monthly finals') +
         tile('#/progress', '📈', 'Progress', 'Every week and month you have worked through') +
         '</div>';

    h += '<h2>Why Tetouan is different</h2>' +
         '<a class="panel" href="#/dialect" style="display:block">' +
         '<div class="crumb">The guide</div>' +
         '<h3 style="font-family:var(--sans);font-size:17px;margin:0 0 5px">' +
         D.dialect.contrasts.length + ' differences from national Darija</h3>' +
         '<p class="muted" style="margin:0">Each one labelled by how Tetouani it really is — the city\'s own, ' +
         'or shared with Tangier and the mountains. With sources.</p></a>';
    return h;
  }

  /* Emoji were the last of the old visual language on the main path: each
     platform draws them differently and none of them match the drawn set. An
     emoji passed in is mapped to the matching drawn icon; anything unmapped
     still renders, so no caller breaks. */
  var TILE_ICON = { '🎯': 'cards', '🎲': 'target', '📋': 'pen', '💬': 'talk', '🗣️': 'convo',
                    '🧱': 'layers', '🗂️': 'words', '📘': 'book', '📈': 'chart', '🧭': 'compass' };
  function tile(href, icon, title, sub) {
    var id = TILE_ICON[icon];
    var ic = id ? '<svg class="ico" aria-hidden="true"><use href="#i-' + id + '"/></svg>' : icon;
    return '<a class="tile" href="' + href + '"><span class="ticon">' + ic + '</span>' +
           '<span class="ttitle">' + E(title) + '</span><span class="tsub">' + E(sub) + '</span></a>';
  }
  function countCards() {
    var n = 0; UI.activeCourses().forEach(function (c) { n += UI.allCards(c).length; }); return n;
  }

  /* ========================= DIALECT GUIDE ========================= */
  function dialect() {
    var dl = D.dialect;
    var teacher = UI.isTeacher();
    var h = UI.banner('dialect') + '<h1>What makes it Tetouani</h1>';
    /* the headline is the researched summary, dense with linguistics; a learner
       gets the plain version first and the full one a tap away */
    h += teacher ? '<p class="sub">' + E(dl.headline) + '</p>'
      : '<p class="sub">Tetouan\u2019s Arabic is an old city dialect with roots in al\u2011Andalus, and it ' +
        'sounds unlike any other Moroccan city, Tangier included. Each difference below shows the Tetouan ' +
        'form beside the one used elsewhere in Morocco.</p>' +
        '<details class="fold"><summary>The history, in more detail</summary><p class="muted" style="margin:10px 0 0">' +
        E(dl.headline) + '</p></details>';
    h += '<div class="scopekey"><div class="crumb">How to read the labels</div>' +
         Object.keys(dl.scopes).map(function (k) {
           return '<p class="skrow"><span class="badge ' + dl.scopes[k].cls + '">' + E(dl.scopes[k].label) +
                  '</span> ' + E(dl.scopes[k].note) + '</p>';
         }).join('') + '</div>';
    /* the intro is advice to the teacher ("what you teach") */
    if (teacher) dl.intro.forEach(function (p) { h += '<p class="muted" style="margin:0 0 10px">' + E(p) + '</p>'; });

    h += '<h2>The differences that matter daily</h2>';
    dl.contrasts.forEach(function (c, i) {
      var conf = c.confidence === 'high' ? 'tag-ok' : (c.confidence === 'medium' ? 'tag-partial' : 'tag-flag');
      var sc = dl.scopes[c.scope] || dl.scopes.north;
      h += '<div class="panel"><div class="vmeta" style="margin:0 0 8px">' +
           '<span class="badge tag-formality">' + (i + 1) + '</span>' +
           '<span class="badge ' + sc.cls + '">' + E(sc.label) + '</span>' +
           '<span class="badge ' + conf + '">' + E(c.confidence) + ' confidence</span></div>' +
           '<h3 style="font-size:16px;margin:0 0 8px">' + E(c.title) + '</h3>' +
           '<div class="contrast"><div class="crow north"><span class="badge tag-northern">Tetouan</span>' +
           '<span class="cphon big">' + E(c.north) + '</span></div>' +
           '<div class="crow natl"><span class="badge tag-national">Elsewhere in Morocco</span>' +
           '<span class="cphon big">' + E(c.national) + '</span></div></div>';
      if (c.example) {
        h += '<div class="vex"><p class="en" style="font-weight:600;color:var(--ink)">' + E(c.example.en) + '</p>' +
             '<p class="phon" style="margin:4px 0 0">Tetouan: ' + E(c.example.north) + '</p>' +
             '<p class="phon" style="margin:2px 0 0;color:var(--indigo)">Elsewhere in Morocco: ' + E(c.example.national) + '</p></div>';
      }
      h += '<p class="vuse" style="margin-top:10px"><strong>Why:</strong> ' + E(c.why) + '</p>';
      if (teacher) h += '<p class="vuse"><strong>Teach it like this:</strong> ' + E(c.teach) + '</p>';
      if (c.note) h += '<p class="vnotes">' + E(c.note) + '</p>';
      if (c.scope === 'north') h += '<p class="scopewarn">Shared with Tangier and the Jebala — correct in Tetouan, but not the city\'s own form.</p>';
      if (c.correction) h += '<div class="flagbox partial"><b>◐ Corrected</b>' + E(c.correction) + '</div>';
      h += '</div>';
    });

    h += '<h2>Not settled by research</h2>';
    dl.open.forEach(function (o) {
      h += '<div class="panel tight"><div class="vmeta" style="margin:0 0 6px"><span class="badge tag-flag">Open</span></div>' +
           '<strong style="font-size:14.5px">' + E(o.title) + '</strong>' +
           '<p class="muted" style="margin:4px 0 0">' + E(o.detail) + '</p></div>';
    });

    h += '<h2>Sources</h2><div class="panel"><ul class="srcs">';
    dl.sources.forEach(function (s) {
      h += '<li><a href="' + E(s.url) + '" target="_blank" rel="noopener">' + E(s.title) + '</a></li>';
    });
    h += '</ul><p class="muted" style="margin:10px 0 0;font-size:12px">Dialectology sources describe the northern region; where a claim is specific to Tetouan rather than the north generally, it is marked high confidence. Anything unconfirmed is listed above rather than smoothed over.</p></div>';
    return h;
  }

  /* ========================= SITUATIONS ========================= */
  function situations() {
    var h = UI.banner('situations') + '<h1>Situations</h1><p class="sub">Real scenes, built as ladders: start in English, swap in one Darija word at a time, finish with the whole line.</p>';
    h += '<div class="tiles">';
    D.situations.forEach(function (s) {
      var lvl = Store.get('sitlevel:' + s.id, 0);
      var max = s.lines[0].mix.length + 1;
      h += '<a class="tile sit" href="#/situations/' + s.id + '"><span class="ticon">' + s.icon + '</span>' +
           '<span class="ttitle">' + E(s.title) + '</span>' +
           '<span class="tsub">' + s.lines.length + ' lines · Week ' + s.week + '</span>' +
           '<span class="tprog">' + (lvl >= max ? 'full Darija' : 'level ' + lvl + '/' + max) + '</span></a>';
    });
    h += '</div>';
    h += '<div class="panel tight"><div class="crumb">How to use it</div><p class="muted" style="margin:0">' +
         'Set the level for the whole scene, then say every line out loud at that level before moving up. ' +
         'The point is to speak a complete sentence from the first minute — never to wait until the full Darija is memorised.</p></div>';
    return h;
  }

  /* one rung of a ladder */
  function rung(parts) {
    return parts.map(function (p) {
      if (typeof p === 'string') return '<span class="epart">' + E(p) + '</span>';
      return '<span class="dpart"><span class="dphon">' + E(p.d) + '</span>' +
             '<span class="dar" lang="ary" dir="rtl">' + E(p.ar) + '</span></span>';
    }).join('');
  }
  function chunkCount(parts) {
    return parts.filter(function (p) { return typeof p === 'object'; }).length;
  }

  /* ---------- a mission: rehearse a situation as an exchange ----------
     Prompt, pause, answer aloud (or write it), then hear - here, see - the
     model: the pattern Pimsleur and Language Transfer use, on the course's own
     approved lines. UNSCORED: nothing here writes anything. No attempt, no
     schedule, no familiarity, no seen or completion key - so it cannot count
     as unaided production or move a review (tests/mission.js proves it). The
     daily session stays the scored route.
     What it does not have yet, and says so: the other person's lines, and a
     second run with one detail changed. Those need Ahmed's approved Darija;
     nothing here generates any. */
  var mission = { sid: null, step: 'off', i: 0, shown: false, wrote: {} };

  function helpPhrases() {
    var r = (D.situations || []).filter(function (x) { return x.id === 'repair'; })[0];
    if (!r) return '';
    return '<details class="mhelp"><summary>Help me continue</summary><ul>' +
      r.lines.map(function (l) {
        return '<li><span class="men">' + E(l.en) + '</span><span class="say msay">' + UI.sayHTML(l.full.phon) +
               '</span>' + UI.arabic(l.full.ar, 'sec sm') + '</li>';
      }).join('') +
      '</ul><p class="mnote">Asking someone to repeat or slow down is part of the conversation, not a failure.</p></details>';
  }

  function missionPanel(s) {
    if (s.id === 'repair') return '';
    if (mission.sid !== s.id || mission.step === 'off') {
      return '<div class="mission off"><div><span class="crumb">Practise it as a mission</span>' +
        '<p>Your goal in English, then your lines hidden one at a time: answer aloud, then check. ' +
        'Not scored, and it does not change your reviews.</p></div>' +
        '<button class="btn primary" type="button" data-mission="start" data-sid="' + E(s.id) + '">Start the mission</button></div>';
    }
    var lines = s.lines, n = lines.length;
    var h = '<section class="mission on" aria-live="polite"><div class="mtop"><span class="crumb">Mission · not scored</span>' +
            '<button class="linkbtn" type="button" data-mission="exit">Back to the scene</button></div>';
    if (mission.step === 'intro') {
      h += '<h2 class="mgoal">' + E(s.when) + '</h2>' +
        '<p class="mlead">First, study your lines. When you start, they are hidden and you answer each cue aloud.</p><ol class="mmodel">' +
        lines.map(function (l) {
          return '<li><span class="men">' + E(l.en) + '</span><span class="say msay">' + UI.sayHTML(l.full.phon) +
                 '</span>' + UI.arabic(l.full.ar, 'sec sm') + '</li>';
        }).join('') + '</ol>' +
        '<p class="mpending">The other person\u2019s side of this conversation is waiting for Ahmed to approve it, ' +
        'so for now you rehearse your own lines.</p>' +
        '<button class="btn primary big" type="button" data-mission="begin">Hide my lines and start</button>';
    } else if (mission.step === 'line') {
      var l = lines[mission.i];
      h += '<p class="mcount">' + (mission.i + 1) + ' of ' + n + '</p>' +
        '<p class="mcue"><span>Say it in Darija</span>' + E(l.en) + '</p>';
      if (!mission.shown) {
        h += '<label class="mwrite" for="mwrite">Write it if you like (optional, not marked)</label>' +
          '<textarea id="mwrite" rows="2" autocomplete="off" autocorrect="off" autocapitalize="none" spellcheck="false">' +
          E(mission.wrote[mission.i] || '') + '</textarea>' +
          '<button class="btn primary big" type="button" data-mission="show">I said it, show the model</button>';
      } else {
        h += '<div class="mreveal"><p class="say mbig">' + UI.sayHTML(l.full.phon) + '</p>' + UI.arabic(l.full.ar) +
          (mission.wrote[mission.i] ? '<p class="myours">You wrote <b>' + E(mission.wrote[mission.i]) + '</b></p>' : '') +
          '</div><button class="btn primary big" type="button" data-mission="next">' +
          (mission.i + 1 < n ? 'Next line' : 'Finish') + '</button>';
      }
      h += helpPhrases();
    } else {
      h += '<h2 class="mgoal">Mission rehearsed</h2>' +
        '<p class="mlead">You went through every line. Now try it for real in Tetouan, or with Ahmed in your next lesson: ' +
        'that is where the other person can answer you.</p>' +
        '<p class="mpending">Next: the same mission with one detail changed (another item, another price). ' +
        'It is waiting for Ahmed to approve the changed lines.</p>' +
        '<div class="btnrow"><button class="btn" type="button" data-mission="again">Rehearse again</button>' +
        '<button class="btn primary" type="button" data-mission="exit">Back to the scene</button></div>';
    }
    return h + '</section>';
  }

  /* the mission's own state is in memory only, and is all it changes */
  function missionAct(act, arg) {
    if (act === 'start') { mission = { sid: arg, step: 'intro', i: 0, shown: false, wrote: {} }; return; }
    if (act === 'exit') { mission.step = 'off'; return; }
    if (act === 'begin' || act === 'again') { mission.step = 'line'; mission.i = 0; mission.shown = false; mission.wrote = {}; return; }
    if (act === 'show') { if (typeof arg === 'string' && arg.trim()) mission.wrote[mission.i] = arg.trim(); mission.shown = true; return; }
    if (act === 'next') {
      var s = (D.situations || []).filter(function (x) { return x.id === mission.sid; })[0];
      if (s && mission.i + 1 < s.lines.length) { mission.i++; mission.shown = false; }
      else mission.step = 'done';
    }
  }

  function situation(id) {
    var s = sitById(id);
    if (!s) return '<p class="empty">Situation not found.</p>';
    var maxLevel = 0;
    s.lines.forEach(function (l) { maxLevel = Math.max(maxLevel, l.mix.length + 1); });
    var level = Math.min(Store.get('sitlevel:' + s.id, 0), maxLevel);

    var h = '<div class="crumb"><a href="#/situations">Situations</a></div>';
    h += '<h1>' + s.icon + ' ' + E(s.title) + '</h1>';
    h += '<p class="sub">' + E(s.when) + '</p>';

    h += missionPanel(s);
    if (mission.sid === s.id && mission.step !== 'off') return h;

    h += '<div class="panel tight levelpick" data-sit="' + E(s.id) + '">' +
         '<div class="crumb">Mix level — how much Darija</div><div class="levels">';
    for (var i = 0; i <= maxLevel; i++) {
      var lbl = i === 0 ? 'English' : (i === maxLevel ? 'Darija' : i + ' word' + (i > 1 ? 's' : ''));
      h += '<button data-l="' + i + '" aria-pressed="' + (i === level) + '">' + lbl + '</button>';
    }
    h += '</div><p class="muted" style="margin:8px 0 0">' +
         (level === 0 ? 'Read them in English first — know what you are going to say.'
          : level === maxLevel ? 'Full Darija. No English left to lean on.'
          : 'Say the whole sentence out loud, English and Darija mixed. Do not stop at the Darija word.') +
         '</p></div>';

    s.lines.forEach(function (l, li) {
      var lm = l.mix.length + 1;
      var lv = Math.min(level, lm);
      var parts, isFull = lv === lm;
      if (lv === 0) parts = [l.en];
      else if (isFull) parts = null;
      else parts = l.mix[lv - 1];

      h += '<div class="ladder" data-sit="' + E(s.id) + '" data-line="' + li + '">';
      h += '<div class="lhead"><span class="lnum">' + (li + 1) + '</span>' +
           '<span class="lmeta">' + (lv === 0 ? 'All English' : isFull ? 'Full Darija'
             : chunkCount(parts) + ' Darija word' + (chunkCount(parts) > 1 ? 's' : '')) + '</span></div>';

      /* the course order: English, then Darija in Latin letters, then Arabic.
         At the all-English rung the line IS the English, so it is not repeated. */
      if (isFull) {
        h += '<div class="lfull"><p class="len">' + E(l.en) + '</p>' +
             '<p class="phon">' + E(l.full.phon) + '</p>' + UI.arabic(l.full.ar) + '</div>';
      } else {
        h += '<p class="lsent">' + rung(parts) + '</p>';
        if (lv > 0) h += '<p class="len">' + E(l.en) + '</p>';
      }
      h += '<div class="lstep"><button class="btn ghost sm" data-step="-1">‹ less</button>' +
           '<button class="btn ghost sm" data-step="1">more Darija ›</button></div>';
      h += '</div>';
    });

    var doneKey = 'sitdone:' + s.id;
    var done = Store.get(doneKey, false);
    h += '<label class="check panel" style="margin-top:14px"><input type="checkbox" data-store="' + doneKey + '"' +
         (done ? ' checked' : '') + '><span class="ctext">I can run this whole scene in full Darija</span></label>';

    /* neighbouring situations */
    var idx = D.situations.indexOf(s);
    h += '<div class="btnrow" style="margin-top:12px">';
    if (idx > 0) h += '<a class="btn" href="#/situations/' + D.situations[idx - 1].id + '">‹ ' + E(D.situations[idx - 1].title) + '</a>';
    if (idx < D.situations.length - 1) h += '<a class="btn" href="#/situations/' + D.situations[idx + 1].id + '">' + E(D.situations[idx + 1].title) + ' ›</a>';
    h += '</div>';
    return h;
  }

  /* ========================= COURSE ========================= */
  function courseView(id) {
    var course = courseById(id);
    if (!course) return '<p class="empty">Course not found.</p>';

    if (course.status !== 'active') {
      return '<div class="crumb"><a href="#/">Home</a> · ' + E(course.label) + '</div>' +
             '<div class="locked"><h1>' + E(course.title) + '</h1>' +
             '<p class="sub">' + E(course.goal) + '</p>' +
             '<div class="panel tight"><div class="crumb">Locked</div>' +
             '<p class="muted" style="margin:0">' + E(course.label) + ' has not been written yet. ' +
             'Finish Month 1 first — this page unlocks when its content is added.</p></div></div>' +
             '<a class="btn wide" href="#/course/month1" style="margin-top:12px">Back to Month 1</a>';
    }

    var cp = UI.courseProgress(course);
    var h = UI.banner('course') + '<div class="crumb"><a href="#/">Home</a> · ' + E(course.label) + '</div>';
    h += '<h1>' + E(course.title) + '</h1><p class="sub">' + E(course.goal) + '</p>';
    h += '<div class="panel">' + UI.bar(cp.pct) +
         '<p class="muted" style="margin:8px 0 0">' + cp.weeksDone + ' of ' + cp.weeksTotal + ' weeks complete</p></div>';

    h += '<div class="panel">';
    course.weeks.forEach(function (w) {
      var p = UI.weekProgress(course.id, w);
      h += '<a class="weekrow' + (p.complete ? ' complete' : '') + '" href="#/course/' + course.id + '/week/' + w.number + '">' +
           '<span class="wnum">' + (p.complete ? '✓' : w.number) + '</span>' +
           '<span class="wbody"><span class="wtitle">Week ' + w.number + ' — ' + E(w.title) + '</span>' +
           '<span class="wmeta">Days ' + p.daysDone + '/' + p.daysTotal + ' · Can-do ' + p.checksDone + '/' + p.checksTotal +
           (w.vocab.length ? ' · ' + w.vocab.length + ' words' : ' · review week') + '</span></span>' +
           '<span class="chev">›</span></a>';
    });
    h += '</div>';

    if (course.checkpoint) {
      h += '<a class="btn wide" href="#/practice?test=1" style="margin-bottom:12px">Go to ' + E(course.checkpoint.title) + '</a>';
    }

    var locked = D.courses.filter(function (c) { return c.status === 'locked'; });
    if (locked.length) {
      h += '<h2>Coming next</h2><div class="locked">';
      locked.forEach(function (c) {
        h += '<a class="panel tight" href="#/course/' + c.id + '" style="display:block">' +
             '<div class="crumb">' + E(c.label) + ' · locked</div>' +
             '<strong style="font-size:14.5px">' + E(c.title) + '</strong>' +
             '<p class="muted" style="margin:4px 0 0">' + E(c.goal) + '</p></a>';
      });
      h += '</div>';
    }
    return h;
  }

  /* ========================= WEEK ========================= */
  function weekView(courseId, num) {
    var course = courseById(courseId);
    if (!course) return '<p class="empty">Course not found.</p>';
    var w = course.weeks.filter(function (x) { return x.number === +num; })[0];
    if (!w) return '<p class="empty">Week not found.</p>';
    var teacher = UI.isTeacher();

    var wph = (D.weekPhoto || {})[course.id + ':' + w.number];
    var h = UI.banner('week', wph) +
      '<div class="crumb"><a href="#/">Home</a> · <a href="#/course/' + course.id + '">' + E(course.label) + '</a> · Week ' + w.number + '</div>';
    h += '<h1>Week ' + w.number + ' — ' + E(w.title) + '</h1>';
    h += '<p class="sub"><strong>Objective:</strong> ' + E(w.objective) + '</p>';
    if (w.focus) h += '<div class="focus"><b>Northern focus</b>' + E(w.focus) + '</div>';
    if (teacher && w.teacherNote) h += '<div class="tnote"><b>Teacher note</b>' + E(w.teacherNote) + '</div>';
    if (w.culture) {
      h += '<div class="panel culture"><div class="crumb">Culture note</div>' +
           '<p class="muted" style="margin:0">' + E(w.culture.note) + '</p></div>';
    }

    h += '<h2>Day by day</h2>' +
         '<p class="sub dayhow">Your daily session on <a href="#/today">Today</a> already brings you this ' +
         'week\u2019s words, a few at a time. The days below are the week\u2019s plan of activities: tick each ' +
         'one when you have done it.</p><div class="panel">';
    w.days.forEach(function (d) {
      if (d.rest) {
        h += '<div class="day rest"><span class="dnum">' + d.n + '</span>' +
             '<span class="dbody"><span class="dtitle">Day ' + d.n + ': Rest</span></span></div>';
        return;
      }
      var key = Store.kDay(course.id, w.number, d.n);
      var on = Store.get(key, false);
      h += '<label class="day' + (on ? ' done' : '') + '">' +
           '<input type="checkbox" data-store="' + key + '"' + (on ? ' checked' : '') + '>' +
           '<span class="dnum">' + d.n + '</span>' +
           '<span class="dbody"><span class="dtitle">Day ' + d.n + ' · ' + E(d.title) + '</span>' +
           '<span class="ddetail">' + E(d.detail) + '</span></span></label>';
    });
    h += '</div>';

    /* situations for this week */
    var sits = D.situations.filter(function (s) { return s.week === w.number; });
    if (sits.length) {
      h += '<h2>Situations for this week</h2><div class="tiles">';
      sits.forEach(function (s) {
        h += '<a class="tile sit" href="#/situations/' + s.id + '"><span class="ticon">' + s.icon + '</span>' +
             '<span class="ttitle">' + E(s.title) + '</span><span class="tsub">' + s.lines.length + ' lines</span></a>';
      });
      h += '</div>';
    }

    h += '<h2>Vocabulary — Week ' + w.number + '</h2>';
    if (!w.vocab.length) {
      h += '<div class="panel tight"><p class="muted" style="margin:0">' + E(w.noVocabNote || 'No new vocabulary this week.') + '</p></div>';
    } else {
      var groups = {}, order = [];
      w.vocab.forEach(function (c) {
        var g = c.group || '';
        if (!groups[g]) { groups[g] = []; order.push(g); }
        groups[g].push(c);
      });
      order.forEach(function (g) {
        if (g) h += '<h3 class="grouphead">' + E(g) + '</h3>';
        groups[g].forEach(function (c) { h += UI.vocabCard(c, { teacher: teacher }); });
      });
    }

    var dials = (course.dialogues || []).filter(function (d) { return d.week === w.number; });
    if (dials.length) {
      h += '<h2>Conversations</h2>';
      dials.forEach(function (d) { h += UI.dialogueCard(d); });
    }

    if (w.sentences && w.sentences.length) {
      h += '<h2>Sentences to build</h2>';
      h += '<div class="panel tight"><p class="muted" style="margin:0">Each one is broken into the pieces it is made of. ' +
           'Learn the pattern, then swap the pieces.</p></div>';
      w.sentences.forEach(function (x) { h += UI.sentenceCard(x); });
    }

    h += '<h2>Day 6 quiz</h2>';
    var qr = window.Exams ? Exams.last('w:' + course.id + ':' + w.number) : null;
    h += '<a class="btn wide' + (qr && qr.pct >= 70 ? '' : ' primary') + '" href="#/exam/w:' + course.id + ':' + w.number + '">' +
         (qr ? 'Week ' + w.number + ' quiz — last score ' + qr.pct + '%' : 'Take the Week ' + w.number + ' quiz') +
         '</a>';

    /* the anti-forgetting rule: Day 1 opens with a review of the month before */
    var prevCourse = D.courses.filter(function (x) { return x.status === 'active' && x.order === course.order - 1; })[0];
    if (prevCourse && w.number === course.weeks[0].number) {
      h += '<div class="tnote" style="margin-top:12px"><b>Day 1 review</b>' +
           'Open with two minutes of rapid review from ' + E(prevCourse.label) +
           ' before any new material. Nothing is ever retired — it moves from new to review.</div>';
    }

    h += '<h2>Can you do these yet?</h2><div class="panel">';
    w.selfCheck.forEach(function (t) {
      var key = Store.kCheck(course.id, w.number, t.id);
      var on = Store.get(key, false);
      h += '<label class="check"><input type="checkbox" data-store="' + key + '"' + (on ? ' checked' : '') + '>' +
           '<span class="ctext">' + E(t.text) + '</span></label>';
    });
    h += '</div>';

    var rate = Store.get(Store.kRate(course.id, w.number), 0);
    h += '<div class="panel tight"><div class="crumb">Self-rating for this week</div>' +
         '<div class="stars" data-rate="' + Store.kRate(course.id, w.number) + '">';
    for (var s2 = 1; s2 <= 5; s2++) h += '<button type="button" data-v="' + s2 + '" class="' + (s2 <= rate ? 'on' : '') + '">★</button>';
    h += '</div></div>';

    h += '<div class="teacher-only"><h2>Teacher notes</h2><div class="panel tight">' +
         '<textarea class="notes" data-store-text="' + Store.kNote(course.id, w.number) + '" ' +
         'placeholder="Weak spots, what to re-drill, what a local confirmed…">' +
         E(Store.get(Store.kNote(course.id, w.number), '')) + '</textarea></div></div>';

    h += '<button class="btn wide printbtn" onclick="window.print()" style="margin-top:16px">' +
         'Print this week as a pocket sheet</button>';

    h += '<div class="btnrow" style="margin-top:16px">';
    if (w.number > 1) h += '<a class="btn" href="#/course/' + course.id + '/week/' + (w.number - 1) + '">‹ Week ' + (w.number - 1) + '</a>';
    if (w.number < course.weeks.length) h += '<a class="btn" href="#/course/' + course.id + '/week/' + (w.number + 1) + '">Week ' + (w.number + 1) + ' ›</a>';
    h += '</div>';
    return h;
  }

  /* ========================= VOCAB LIBRARY ========================= */
  var vocabState = { q: '', filter: 'core', view: 'learn' };

  function vocabView() {
    /* ONE pool, every card once, every month. This read
       UI.allCards(UI.activeCourses()[0]) - month 1 only - while the month chips
       below were built from a different course object entirely. Selecting
       Month 2 or Month 3 therefore compared courseId against a pool that
       contained none, and the page said "Nothing matches" about 202 words that
       exist. The same pool is used by the live search handler in app.js. */
    var cards = UI.allActiveCards();
    var course = UI.currentCourse();
    var nTet = cards.filter(function (c) { return c.scope === 'tetouan' || c.scope === 'mdini'; }).length;
    var nCore = cards.filter(function (c) { return c.freq === 'core'; }).length;
    var clashes = UI.conflictingIds();

    var h = UI.banner('vocab') + '<h1>Words</h1><p class="sub">' +
            'Every word in the course — <strong>' + cards.length + ' entries</strong> across ' +
            UI.activeCourses().length + ' months, ' + nCore + ' of them everyday words, ' +
            nTet + ' attested for Tetouan itself.</p>';
    if (clashes.length) {
      h += '<div class="panel tight"><p class="errmsg" style="margin:0">' +
           clashes.length + ' card' + (clashes.length === 1 ? '' : 's') +
           ' share an id with another and only the first is shown: ' +
           E(clashes.slice(0, 5).join(', ')) + '. That is a content problem — two ' +
           'entries are claiming one identity — and it needs fixing in the data ' +
           'rather than here.</p></div>';
    }
    h += '<div class="vtools"><div class="viewpick" id="viewpick">' +
         '<button data-v="learn" aria-pressed="' + (vocabState.view === 'learn') + '">Learn</button>' +
         '<button data-v="drill" aria-pressed="' + (vocabState.view === 'drill') + '">Drill</button>' +
         '<button data-v="cards" aria-pressed="' + (vocabState.view === 'cards') + '">Cards</button>' +
         '</div>';
    h += UI.learnerBar();
    h += '</div>';
    h += '<label class="searchlab" for="vsearch">Find a word</label>';
    h += '<input class="search" id="vsearch" type="search" ' +
         'placeholder="Search in English, Darija or Arabic" ' +
         'autocomplete="off" autocorrect="off" autocapitalize="none" spellcheck="false" ' +
         'value="' + E(vocabState.q) + '">';
    h += '<p class="vscope" id="vscope" aria-live="polite">' + scopeSummary(cards) + '</p>';

    h += '<div class="chips" id="vchips">';
    UI.activeCourses().forEach(function (c) {
      h += chip('c:' + c.id, c.label, vocabState.filter);
    });
    h += chip('core', 'Everyday', vocabState.filter);
    h += chip('useful', 'Useful', vocabState.filter);
    h += chip('extra', 'Extra', vocabState.filter);
    h += chip('all', 'All', vocabState.filter);
    h += chip('tetouan', 'Tetouan only', vocabState.filter);
    h += chip('mdini', 'Mdini · traditional', vocabState.filter);
    h += chip('north', 'Shared with the north', vocabState.filter);
    h += chip('g:Respect & faith', 'Respect & faith', vocabState.filter);
    h += chip('g:People & family', 'People & family', vocabState.filter);
    h += chip('g:How you feel', 'How you feel', vocabState.filter);
    h += chip('weak', 'Needs work', vocabState.filter);
    h += chip('contrast', '⇄ Has national form', vocabState.filter);
    /* week chips belong to the month being taught; they filter on c.week, which
       is only meaningful alongside a month chip */
    (course.weeks || []).forEach(function (w) {
      if (!w.vocab.length) return;
      h += chip('w' + w.number, 'Week ' + w.number, vocabState.filter);
    });
    h += chip('flagged', '⚑ Flagged', vocabState.filter);
    if (course.extras && course.extras.length) h += chip('extras', 'Spanish / extras', vocabState.filter);
    if (UI.customCards().length) h += chip('mine', '✍️ Teacher added', vocabState.filter);
    h += '</div>';

    h += '<div id="vlist">' + vocabList(cards, UI.isTeacher()) + '</div>';
    return h;
  }
  function chip(f, label, cur) {
    return '<button data-f="' + f + '" aria-pressed="' + (cur === f) + '">' + E(label) + '</button>';
  }

  /* Arabic typed without harakat should still find a vocalised entry. The
     stripping happens on a throwaway copy used for matching; the source text is
     never altered, and no transliteration convention is imposed on the learner's
     query. Distinct letters are NOT folded together - only the diacritics and
     the tatweel stretching character come off. */
  var HARAKAT = /[\u0610-\u061A\u064B-\u065F\u0670\u06D6-\u06ED\u0640]/g;

  function searchIndex(c) {
    return (c.en + ' ' + (c.phon || '') + ' ' + (c.use || '') + ' ' + (c.notes || '')).toLowerCase() +
           ' ' + String(c.ar || '').replace(HARAKAT, '') +
           ' ' + String((c.speaker && c.speaker.f) || '') +
           ' ' + String(c.arv || '').replace(HARAKAT, '');
  }

  function matchesFilter(c, f) {
    if (f === 'flagged') return !!(c.flags && c.flags.length);
    if (f.indexOf('c:') === 0) return c.courseId === f.slice(2);
    if (f === 'weak') { var st = UI.strength(c.id); return st === 1 || st === 2; }
    if (f.indexOf('g:') === 0) return c.group === f.slice(2);
    if (f === 'core' || f === 'useful' || f === 'extra') return c.freq === f;
    if (f === 'mdini' || f === 'tetouan' || f === 'north') return c.scope === f;
    if (f === 'contrast') return !!c.national;
    if (f === 'extras') return c.week === null && !c.custom;
    if (f === 'mine') return !!c.custom;
    if (f === 'all') return true;
    return 'w' + c.week === f;
  }

  function matchesQuery(c, q) {
    if (!q) return true;
    return searchIndex(c).indexOf(q) > -1;
  }

  /* What is actually being shown, in words. The count on its own does not say
     whether 44 means "44 everyday words" or "44 in all", and the chips wrap out
     of sight on a phone. */
  function scopeLabel() {
    var f = vocabState.filter;
    var names = {
      core: 'Everyday', useful: 'Useful', extra: 'Extra', all: 'All vocabulary',
      tetouan: 'Tetouan only', mdini: 'Mdini · traditional',
      north: 'Shared with the north', contrast: 'Has a national form',
      weak: 'Needs work', flagged: 'Flagged', mine: 'Teacher added',
      extras: 'Extras'
    };
    if (names[f]) return names[f];
    if (f.indexOf('c:') === 0) {
      var c = UI.activeCourses().filter(function (x) { return x.id === f.slice(2); })[0];
      return c ? c.label : f.slice(2);
    }
    if (f.indexOf('g:') === 0) return f.slice(2);
    if (f.charAt(0) === 'w') return 'Week ' + f.slice(1);
    return f;
  }

  /* "Everyday · 87 of 339" - what is on screen and out of how much. Announced
     politely, so a screen reader hears the count change when a filter changes. */
  function scopeSummary(cards) {
    var q = vocabState.q.trim().toLowerCase().replace(HARAKAT, '');
    var shown = cards.filter(function (c) {
      return matchesFilter(c, vocabState.filter) && matchesQuery(c, q);
    }).length;
    return E(scopeLabel()) + ' · <strong>' + shown + '</strong> of ' + cards.length +
           (q ? ' matching “' + E(vocabState.q.trim()) + '”' : '');
  }

  function vocabList(cards, teacher) {
    var q = vocabState.q.trim().toLowerCase().replace(HARAKAT, '');
    var f = vocabState.filter;
    var out = cards.filter(function (c) { return matchesFilter(c, f) && matchesQuery(c, q); });

    /* "Nothing matches" used to be the whole answer, which left the learner
       unable to tell a too-narrow filter from a word the course does not teach.
       Those are different facts and only one of them is their problem. */
    if (!out.length) {
      var anywhere = q ? cards.filter(function (c) { return matchesQuery(c, q); }).length : 0;
      var label = scopeLabel();
      if (q && anywhere) {
        return '<p class="empty">No match for <strong>' + E(vocabState.q.trim()) + '</strong> in ' +
               E(label) + ' — but ' + anywhere + ' elsewhere in the course. ' +
               '<button class="linkbtn" id="vsearchall">Search all vocabulary</button></p>';
      }
      if (q) {
        return '<p class="empty">Nothing in the course matches <strong>' +
               E(vocabState.q.trim()) + '</strong>. ' +
               'It may be a word we have not taught yet — worth asking Ahmed for.</p>';
      }
      return '<p class="empty">Nothing under ' + E(label) + '. ' +
             '<button class="linkbtn" id="vsearchall">Show all vocabulary</button></p>';
    }

    /* Group into sections so numbers never sit among the greetings. */
    var buckets = {}, seen = [];
    out.forEach(function (c) {
      var g = c.custom ? 'Teacher added' : (c.group || 'Other');
      if (!buckets[g]) { buckets[g] = []; seen.push(g); }
      buckets[g].push(c);
    });
    var order = (D.sectionOrder || []).filter(function (g) { return buckets[g]; })
      .concat(seen.filter(function (g) { return (D.sectionOrder || []).indexOf(g) === -1; }));

    var searching = vocabState.q.trim().length > 0;

    return order.map(function (g) {
      var list = buckets[g];
      /* long, repetitive sections start folded — unless a search is running */
      var folded = !searching && (D.sectionFolded || {})[g];
      var body = list.map(function (c) {
        if (vocabState.view === 'cards') return flipCard(c);
        if (vocabState.view === 'drill') return drillRow(c);
        return UI.vocabCard(c, { teacher: teacher, inSection: true });
      }).join('');
      if (vocabState.view === 'cards') body = '<div class="vgrid">' + body + '</div>';
      if (vocabState.view === 'drill') body = '<div class="drill">' + body + '</div>';

      return '<details class="vsection"' + (folded ? '' : ' open') + '>' +
        '<summary><span class="secname">' + E(g) + '</span>' +
        '<span class="seccount">' + list.length + '</span></summary>' +
        '<div class="secbody">' + body + '</div></details>';
    }).join('');
  }

  /* A real button: Enter and Space turn it, and it says whether it is turned.
     The answer side is hidden from a screen reader until it is. */
  function flipCard(c) {
    var pf = UI.formFor(c), sc = UI.scopeInfo(c);
    return '<button type="button" class="flip" data-flip aria-expanded="false"><span class="flipin">' +
      '<span class="flipface front">' + UI.strengthDot(c.id) +
        '<span class="fen">' + E(c.en) + '</span>' +
        '<span class="fhint">tap to reveal</span></span>' +
      '<span class="flipface back" aria-hidden="true">' +
        '<span class="say sm">' + UI.sayHTML(pf.phon) + '</span>' +
        '<span class="ar" lang="ary" dir="rtl">' + E(pf.arv || pf.ar) + '</span>' +
        (sc ? '<span class="fmark">★ ' + E(sc.label) + '</span>' : '') +
      '</span></span></button>';
  }

  function drillRow(c) {
    var pf = UI.formFor(c), sc = UI.scopeInfo(c);
    return '<div class="drow">' + UI.strengthDot(c.id) +
      '<span class="den">' + E(c.en) + '</span>' +
      '<span class="dsay">' + UI.sayHTML(pf.phon) +
        (sc ? ' <span class="badge dscope ' + E(sc.cls) + '">' + E(sc.label) + '</span>' : '') + '</span>' +
      '<span class="ar sec sm" lang="ary" dir="rtl">' + E(pf.arv || pf.ar) + '</span></div>';
  }

  /* ========================= PRACTICE ========================= */
  var flash = { pool: [], i: 0, revealed: false, filter: 'core', mode: 'cards' };

  function buildPool() {
    var course = UI.currentCourse();
    var cards = UI.allActiveCards();
    if (flash.filter === 'marker') cards = cards.filter(function (c) { return c.marker; });
    else if (flash.filter === 'core') cards = cards.filter(function (c) { return c.freq === 'core'; });
    else if (flash.filter === 'today') { cards = todayFive(); }
    else if (flash.filter === 'weak') {
      cards = cards.filter(function (c) { var s2 = UI.strength(c.id); return s2 === 1 || s2 === 2; });
    }
    else if (flash.filter !== 'all') cards = cards.filter(function (c) { return 'w' + c.week === flash.filter; });
    for (var i = cards.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1)), t = cards[i]; cards[i] = cards[j]; cards[j] = t;
    }
    flash.pool = cards; flash.i = 0; flash.revealed = false;
  }

  function setVocabQuery(q) { vocabState.q = String(q || ''); vocabState.filter = 'all'; vocabState.view = 'learn'; }

  function practiceView(wantTest, set) {
    if (set === 'weak' && flash.filter !== 'weak') { flash.filter = 'weak'; flash.pool = []; }
    if (wantTest) flash.mode = 'test';
    if (set === 'today' && flash.filter !== 'today') { flash.filter = 'today'; flash.pool = []; }
    var h = UI.banner('practice') + '<h1>Practice</h1><p class="sub">Spoken practice. Say it out loud before you reveal.</p>';
    h += '<div class="chips" id="pmode">' +
         '<button data-m="cards" aria-pressed="' + (flash.mode === 'cards') + '">Flashcards</button>' +
         '<button data-m="test" aria-pressed="' + (flash.mode === 'test') + '">Month 1 Checkpoint</button></div>';
    h += flash.mode === 'test' ? checkpointBlock() : flashBlock();
    return h;
  }

  function flashBlock() {
    var course = UI.currentCourse();
    var h = '<div class="chips" id="pchips">' +
            '<button data-f="today" aria-pressed="' + (flash.filter === 'today') + '">Today\'s five</button>' +
            '<button data-f="weak" aria-pressed="' + (flash.filter === 'weak') + '">Needs work</button>' +
            '<button data-f="core" aria-pressed="' + (flash.filter === 'core') + '">Everyday</button>' +
            '<button data-f="all" aria-pressed="' + (flash.filter === 'all') + '">All</button>' +
            '<button data-f="marker" aria-pressed="' + (flash.filter === 'marker') + '">★ Tetouani markers</button>';
    course.weeks.forEach(function (w) {
      if (!w.vocab.length) return;
      h += '<button data-f="w' + w.number + '" aria-pressed="' + (flash.filter === 'w' + w.number) + '">Week ' + w.number + '</button>';
    });
    h += '</div>';

    if (!flash.pool.length) buildPool();
    if (!flash.pool.length) return h + '<p class="empty">No cards in this filter.</p>';

    var c = flash.pool[flash.i];
    h += '<div class="flash" id="flashcard">';
    if (!flash.revealed) {
      h += '<p class="fen">' + E(c.en) + '</p><p class="hint">Say it, then tap to reveal</p>';
    } else {
      var pf = UI.formFor(c);
      h += '<p class="say">' + E(pf.phon) + '</p>' + UI.arabic(pf.arv || pf.ar, 'sec');
      if (c.example) h += '<div class="vex"><p class="say sm">' + E(c.example.phon) + '</p>' +
        UI.arabic(c.example.arv || c.example.ar, 'sec sm') + '<p class="exen">' + E(c.example.en) + '</p></div>';
      if (c.fusha) h += '<p class="fgloss" style="margin-top:12px">Classical: ' + E(c.fusha.translit) + ' — ' + E(c.fusha.gloss) + '</p>';
      if (c.national) h += '<p class="fnat">Elsewhere in Morocco: ' + E(c.national.phon) + '</p>';
      h += '<p class="hint">Tap for next</p>';
    }
    h += '</div>';
    h += '<p class="counter">' + (flash.i + 1) + ' / ' + flash.pool.length +
         (c.marker && D.dialect.scopes[c.scope] ? ' · ★ ' + E(D.dialect.scopes[c.scope].label)
            : c.marker ? ' · ★ marker' : '') + '</p>';
    h += '<div class="btnrow"><button class="btn" id="fprev">‹ Back</button>' +
         '<button class="btn" id="fshuffle">Shuffle</button>' +
         '<button class="btn primary" id="fnext">Next ›</button></div>';
    return h;
  }

  function checkpointBlock() {
    var course = UI.currentCourse(), cp = course.checkpoint;
    var status = Store.get(Store.kCpStatus(course.id), '');
    var done = cp.tasks.filter(function (t) { return Store.get(Store.kTask(course.id, t.id), false); }).length;

    var h = '<div class="panel"><div class="crumb">' + E(cp.format) + '</div>' +
            '<h3 style="font-size:18px;margin:2px 0 6px">' + E(cp.title) + '</h3>' +
            '<p class="muted" style="margin:0">' + E(cp.intro) + '</p></div>';

    h += '<div class="panel">';
    cp.tasks.forEach(function (t, i) {
      var key = Store.kTask(course.id, t.id), on = Store.get(key, false);
      h += '<label class="check"><input type="checkbox" data-store="' + key + '"' + (on ? ' checked' : '') + '>' +
           '<span class="ctext"><strong>' + (i + 1) + '.</strong> ' + E(t.text) + '</span></label>';
    });
    h += '</div>';

    h += '<div class="panel tight"><div class="crumb">Pass bar</div><p class="muted" style="margin:0">' + E(cp.passBar) + '</p>';
    if (cp.northernBar) h += '<p class="muted" style="margin:8px 0 0;color:var(--accent-ink)">' + E(cp.northernBar) + '</p>';
    h += '<p class="muted" style="margin:8px 0 0">' + done + ' of ' + cp.tasks.length + ' tasks marked.</p></div>';

    h += '<div class="btnrow" data-cp="' + Store.kCpStatus(course.id) + '">' +
         '<button class="btn' + (status === 'passed' ? ' primary' : '') + '" data-v="passed">Passed</button>' +
         '<button class="btn' + (status === 'retry' ? ' danger' : '') + '" data-v="retry">Needs retry</button></div>';
    if (status) h += '<p class="counter">Marked: <strong>' + (status === 'passed' ? 'Passed' : 'Needs retry') + '</strong></p>';
    return h;
  }

  /* ========================= PROGRESS ========================= */
  function progressView() {
    var h = UI.banner('progress') + '<h1>Progress</h1>' +
      '<p class="sub">Where the six months stand. Final tests are marked automatically; the spoken parts are self-marked.</p>';

    /* the six-month tracker */
    h += '<h2>The six months</h2><div class="panel"><table class="ttable sixmo">' +
         '<thead><tr><th>Month</th><th>Theme</th><th>Final test</th></tr></thead><tbody>';
    var PLAN = [
      ['Month 1', 'Survival Northern Darija'],
      ['Month 2', 'Daily Life Northern Darija'],
      ['Month 3', 'Sentence-Building Bridge (1)'],
      ['Month 4', 'Sentence-Building Bridge (2) and Social Fluency'],
      ['Month 5', 'Responsive Conversation (1)'],
      ['Month 6', 'Responsive Conversation (2) and Consolidation']
    ];
    PLAN.forEach(function (row, i) {
      var c = D.courses.filter(function (x) { return x.order === i + 1; })[0];
      var built = c && c.status === 'active';
      var r = built && window.Exams ? Exams.last('m:' + c.id) : null;
      var cell = !built ? '<span class="badge tag-formality">coming later</span>'
        : r ? '<span class="badge ' + (r.pct >= 70 ? 'tag-ok' : 'tag-flag') + '">' + r.pct + '%</span>'
            : '<span class="badge tag-formality">not taken</span>';
      h += '<tr' + (r && r.pct >= 70 ? ' class="done"' : '') + '><td><strong>' + E(row[0]) + '</strong></td>' +
           '<td>' + E(row[1]) + '</td><td>' + cell + '</td></tr>';
    });
    h += '</tbody></table>';
    var six = window.Exams ? Exams.last('six') : null;
    h += '<p class="muted" style="margin:12px 0 0">Six-month final: ' +
         (six ? '<strong>' + six.pct + '%</strong> on ' + E(six.date) : 'not taken') +
         ' · <a href="#/exam/six">open it</a></p></div>';

    D.courses.forEach(function (course) {
      if (course.status !== 'active') {
        h += '<a class="locked panel tight" href="#/course/' + course.id + '" style="display:block">' +
             '<div class="crumb">' + E(course.label) + ' · locked</div>' +
             '<strong style="font-size:14.5px">' + E(course.title) + '</strong>' +
             '<p class="muted" style="margin:4px 0 0">Coming soon</p></a>';
        return;
      }
      var cp = UI.courseProgress(course);
      var status = Store.get(Store.kCpStatus(course.id), '');
      h += '<div class="panel"><div class="crumb">' + E(course.label) + '</div>' +
           '<h3 style="font-size:17px;margin:2px 0 0">' + E(course.title) + '</h3>' + UI.bar(cp.pct) +
           '<p class="muted" style="margin:8px 0 6px">' + cp.weeksDone + '/' + cp.weeksTotal + ' weeks complete' +
           (status ? ' · Checkpoint: <strong style="color:' + (status === 'passed' ? 'var(--ok)' : 'var(--alert)') + '">' +
             (status === 'passed' ? 'Passed' : 'Needs retry') + '</strong>' : ' · Checkpoint not yet taken') + '</p>';

      course.weeks.forEach(function (w) {
        var p = UI.weekProgress(course.id, w);
        h += '<a class="weekrow' + (p.complete ? ' complete' : '') + '" href="#/course/' + course.id + '/week/' + w.number + '">' +
             '<span class="wnum">' + (p.complete ? '✓' : w.number) + '</span>' +
             '<span class="wbody"><span class="wtitle">Week ' + w.number + ' — ' + E(w.title) + '</span>' +
             '<span class="wmeta">Days ' + p.daysDone + '/' + p.daysTotal + ' · Can-do ' + p.checksDone + '/' + p.checksTotal +
             ' · ' + (p.rating ? '★'.repeat(p.rating) : 'not rated') + '</span></span><span class="chev">›</span></a>';
      });
      h += '</div>';
    });

    /* situations progress */
    var sdone = D.situations.filter(function (s) { return Store.get('sitdone:' + s.id, false); }).length;
    h += '<div class="panel"><div class="crumb">Situations</div>' +
         UI.bar(Math.round(sdone / D.situations.length * 100)) +
         '<p class="muted" style="margin:8px 0 6px">' + sdone + ' of ' + D.situations.length + ' scenes runnable in full Darija</p>';
    D.situations.forEach(function (s) {
      var on = Store.get('sitdone:' + s.id, false);
      var lvl = Store.get('sitlevel:' + s.id, 0);
      h += '<a class="weekrow' + (on ? ' complete' : '') + '" href="#/situations/' + s.id + '">' +
           '<span class="wnum">' + (on ? '✓' : s.icon) + '</span>' +
           '<span class="wbody"><span class="wtitle">' + E(s.title) + '</span>' +
           '<span class="wmeta">Mix level ' + lvl + ' · Week ' + s.week + '</span></span><span class="chev">›</span></a>';
    });
    h += '</div>';

    h += '<div class="panel"><div class="crumb">Tests</div>';
    var taken = 0;
    Tests.list.forEach(function (tt) {
      var l = Tests.last(tt.id);
      if (l) taken++;
      h += '<a class="weekrow' + (l && l.score / Math.max(1, l.total) >= 0.8 ? ' complete' : '') + '" href="#/tests/' + tt.id + '">' +
           '<span class="wnum">' + tt.icon + '</span>' +
           '<span class="wbody"><span class="wtitle">' + E(tt.title) + '</span>' +
           '<span class="wmeta">' + (l ? 'last ' + Math.round(l.score / Math.max(1, l.total) * 100) + '% · best ' + Tests.best(tt.id) + '%'
             : 'not taken') + '</span></span><span class="chev">›</span></a>';
    });
    h += '<p class="muted" style="margin:8px 0 0">' + taken + ' of ' + Tests.list.length + ' tests attempted.</p></div>';

    h += '<div class="teacher-only"><a class="btn wide" href="#/teacher">✍️ Teacher workspace</a></div>';
    return h;
  }

  /* ========================= DIALOGUES ========================= */
  function dialogues() {
    var all = UI.allDialogues();
    if (!all.length) {
      return '<h1>Conversations</h1><div class="panel"><p class="muted" style="margin:0">' +
             'Full conversations start in Month 3.</p></div>';
    }
    var h = UI.banner('dialogues') + '<h1>Conversations</h1>' +
      '<p class="sub">' + all.length + ' complete exchanges — not lines to memorise but conversations to run. ' +
      'Read both sides out loud, then cover one side and take the other.</p>';
    all.forEach(function (d) { h += UI.dialogueCard(d); });
    return h;
  }

  /* ========================= SENTENCES ========================= */
  var sentState = { course: 'all' };

  function sentences() {
    var all = UI.allSentences();
    if (!all.length) {
      return '<h1>Sentences</h1><div class="panel"><p class="muted" style="margin:0">' +
             'Complex sentences start in Month 2. Finish Month 1 first.</p></div>';
    }
    var h = UI.banner('sentences') + '<h1>Sentences</h1>' +
      '<p class="sub">' + all.length + ' complete sentences, each broken into the pieces it is built from. ' +
      'The pattern above each one is the reusable part — swap the pieces and it still works.</p>';

    h += '<div class="chips" id="schips">' +
         '<button data-s="all" aria-pressed="' + (sentState.course === 'all') + '">All</button>';
    UI.activeCourses().forEach(function (c) {
      if (!(c.weeks || []).some(function (w) { return (w.sentences || []).length; })) return;
      h += '<button data-s="' + c.id + '" aria-pressed="' + (sentState.course === c.id) + '">' + E(c.label) + '</button>';
    });
    h += '</div>';

    var list = all.filter(function (x) {
      return sentState.course === 'all' || x.courseId === sentState.course;
    });
    var byWeek = {}, order = [];
    list.forEach(function (x) {
      var k = 'Week ' + x.week + ' — ' + x.weekTitle;
      if (!byWeek[k]) { byWeek[k] = []; order.push(k); }
      byWeek[k].push(x);
    });
    order.forEach(function (k) {
      h += '<details class="vsection" open><summary><span class="secname">' + E(k) + '</span>' +
           '<span class="seccount">' + byWeek[k].length + '</span></summary><div class="secbody">' +
           byWeek[k].map(UI.sentenceCard).join('') + '</div></details>';
    });
    return h;
  }

  window.Views = {
    vocabScopeSummary: scopeSummary, sentences: sentences, sentState: sentState, dialogues: dialogues,
    home: home, library: library, course: courseView, week: weekView,
    scheduleCounts: scheduleCounts, setVocabQuery: setVocabQuery,
    missionAct: missionAct, missionState: function () { return mission; },
    vocab: vocabView, vocabList: vocabList, vocabState: vocabState,
    practice: practiceView, flash: flash, buildPool: buildPool,
    progress: progressView, dialect: dialect,
    situations: situations, situation: situation,
    courseById: courseById, sitById: sitById
  };
})();
