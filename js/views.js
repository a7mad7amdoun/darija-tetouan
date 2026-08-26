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
  function home() {
    var course = UI.activeCourses()[0];
    var wk = UI.currentWeek(course);
    var cp = UI.courseProgress(course);
    var cards = UI.allCards(course);
    var nCore = cards.filter(function (c) { return c.freq === 'core'; }).length;

    /* hero — what this is, where he is, one way forward */
    var h = '<section class="hero' + UI.heroPhoto() + '>' +
      '<p class="harab">الدارجة التطوانية</p>' +
      '<h1>Tetouani Darija</h1>' +
      '<p class="hsub">The Arabic of Tetouan — a pre-Hilalian city dialect with an Andalusi past, ' +
      'not the Darija the rest of Morocco speaks.</p>';
    if (wk) {
      var wp = UI.weekProgress(course.id, wk);
      h += '<div class="hrow">' + UI.ring(cp.pct, 64) +
           '<div class="hmeta"><div class="hweek">' + E(course.label) + ' · Week ' + wk.number + ' of ' + course.weeks.length + '</div>' +
           '<div class="htitle">' + E(wk.title) + '</div></div></div>' +
           '<a class="btn wide" href="#/course/' + course.id + '/week/' + wk.number + '">Continue Week ' + wk.number + ' →</a>';
    }
    h += '</section>';

    h += todayPanel();

    /* where he is */
    h += '<h2>The month</h2><div class="wstrip">';
    course.weeks.forEach(function (w) {
      var p = UI.weekProgress(course.id, w);
      var isNow = wk && w.number === wk.number;
      h += '<a href="#/course/' + course.id + '/week/' + w.number + '" ' +
           'class="wpill' + (p.complete ? ' done' : '') + (isNow && !p.complete ? ' now' : '') + '">' +
           (p.complete ? '✓' : w.number) + '<span>Week ' + w.number + '</span></a>';
    });
    h += '</div>';

    /* what is inside */
    h += '<h2>What is inside</h2><div class="tiles">' +
         tile('#/situations', '💬', 'Situations', D.situations.length + ' real scenes — start in English, finish in Darija') +
         tile('#/tests', '🎲', 'Tests', Tests.list.length + ' short tests: pictures, gaps, spoken') +
         tile('#/vocab', '🗂️', 'Vocabulary', nCore + ' everyday words, ' + cards.length + ' in all') +
         tile('#/practice', '🎯', 'Flashcards', 'Say it out loud, then reveal') +
         '</div>';

    h += '<h2>Why Tetouan is different</h2>' +
         '<a class="panel" href="#/dialect" style="display:block">' +
         '<div class="crumb">The guide</div>' +
         '<h3 style="font-family:var(--serif);font-size:17px;margin:0 0 5px">' +
         D.dialect.contrasts.length + ' differences from national Darija</h3>' +
         '<p class="muted" style="margin:0">Each one labelled by how Tetouani it really is — the city\'s own, ' +
         'or shared with Tangier and the mountains. With sources.</p></a>';

    h += '<h2>This month\'s goal</h2>' +
         '<div class="panel tight zellij"><p class="muted" style="margin:0">' + E(course.goal) + '</p></div>';

    h += '<div class="teacher-only" style="margin-top:16px">' +
         '<a class="btn wide" href="#/teacher">Open teacher workspace →</a></div>';
    return h;
  }

  /* The five words to work on now: weakest first, then unseen, from the
     everyday band and no further ahead than the week he is actually on. */
  function todayFive() {
    var course = UI.activeCourses()[0];
    var wk = UI.currentWeek(course);
    var upto = wk ? wk.number : 4;
    var pool = UI.allCards(course).filter(function (c) {
      return c.freq === 'core' && (c.week === null || c.week <= upto);
    });
    pool.sort(function (a, b) {
      var sa = UI.strength(a.id), sb = UI.strength(b.id);
      if (sa !== sb) return (sa === 0 ? 1.5 : sa) - (sb === 0 ? 1.5 : sb);  /* shaky first, then unseen */
      return 0;
    });
    return pool.slice(0, 5);
  }

  function todayPanel() {
    var five = todayFive();
    if (!five.length) return '';
    var h = '<h2>Today</h2><div class="panel today">' +
            '<p class="muted" style="margin:0 0 12px">Five words, picked from what is shakiest. Two minutes.</p>';
    five.forEach(function (c) {
      h += '<div class="todayrow">' + UI.strengthDot(c.id) +
           '<span class="tden">' + E(c.en) + '</span>' +
           '<span class="tdsay">' + UI.sayHTML(UI.formFor(c).phon) + '</span>' +
           '<span class="ar sec sm" dir="rtl">' + E(UI.formFor(c).arv || c.ar) + '</span></div>';
    });
    h += '<a class="btn primary wide" href="#/practice?set=today" style="margin-top:12px">Drill these five →</a></div>';
    return h;
  }

  function tile(href, icon, title, sub) {
    return '<a class="tile" href="' + href + '"><span class="ticon">' + icon + '</span>' +
           '<span class="ttitle">' + E(title) + '</span><span class="tsub">' + E(sub) + '</span></a>';
  }
  function countCards() {
    var n = 0; UI.activeCourses().forEach(function (c) { n += UI.allCards(c).length; }); return n;
  }

  /* ========================= DIALECT GUIDE ========================= */
  function dialect() {
    var dl = D.dialect;
    var h = UI.banner('dialect') + '<h1>What makes it Tetouani</h1>';
    h += '<p class="sub">' + E(dl.headline) + '</p>';
    h += '<div class="scopekey"><div class="crumb">How to read the labels</div>' +
         Object.keys(dl.scopes).map(function (k) {
           return '<p class="skrow"><span class="badge ' + dl.scopes[k].cls + '">' + E(dl.scopes[k].label) +
                  '</span> ' + E(dl.scopes[k].note) + '</p>';
         }).join('') + '</div>';
    dl.intro.forEach(function (p) { h += '<p class="muted" style="margin:0 0 10px">' + E(p) + '</p>'; });

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
           '<div class="crow natl"><span class="badge tag-national">National</span>' +
           '<span class="cphon big">' + E(c.national) + '</span></div></div>';
      if (c.example) {
        h += '<div class="vex"><p class="en" style="font-weight:600;color:var(--ink)">' + E(c.example.en) + '</p>' +
             '<p class="phon" style="margin:4px 0 0">Tetouan: ' + E(c.example.north) + '</p>' +
             '<p class="phon" style="margin:2px 0 0;color:var(--warn)">National: ' + E(c.example.national) + '</p></div>';
      }
      h += '<p class="vuse" style="margin-top:10px"><strong>Why:</strong> ' + E(c.why) + '</p>';
      h += '<p class="vuse"><strong>Teach it like this:</strong> ' + E(c.teach) + '</p>';
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

  function situation(id) {
    var s = sitById(id);
    if (!s) return '<p class="empty">Situation not found.</p>';
    var maxLevel = 0;
    s.lines.forEach(function (l) { maxLevel = Math.max(maxLevel, l.mix.length + 1); });
    var level = Math.min(Store.get('sitlevel:' + s.id, 0), maxLevel);

    var h = '<div class="crumb"><a href="#/situations">Situations</a></div>';
    h += '<h1>' + s.icon + ' ' + E(s.title) + '</h1>';
    h += '<p class="sub">' + E(s.when) + '</p>';

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

      if (isFull) {
        h += '<div class="lfull">' + UI.arabic(l.full.ar) +
             '<p class="phon">' + E(l.full.phon) + '</p>' +
             '<p class="len">' + E(l.en) + '</p></div>';
      } else {
        h += '<p class="lsent">' + rung(parts) + '</p>';
        h += '<p class="len">' + E(l.en) + '</p>';
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
    var h = '<div class="crumb"><a href="#/">Home</a> · ' + E(course.label) + '</div>';
    h += '<h1>' + E(course.title) + '</h1><p class="sub">' + E(course.goal) + '</p>';
    h += '<div class="panel">' + UI.bar(cp.pct) +
         '<p class="muted" style="margin:8px 0 0">' + cp.weeksDone + ' of ' + cp.weeksTotal + ' weeks complete</p></div>';

    h += '<div class="panel">';
    course.weeks.forEach(function (w) {
      var p = UI.weekProgress(course.id, w);
      h += '<a class="weekrow' + (p.complete ? ' complete' : '') + '" href="#/course/' + course.id + '/week/' + w.number + '">' +
           '<span class="wnum">' + (p.complete ? '✓' : w.number) + '</span>' +
           '<span class="wbody"><span class="wtitle">Week ' + w.number + ' — ' + E(w.title) + '</span>' +
           '<span class="wmeta">Days ' + p.daysDone + '/' + p.daysTotal + ' · Self-check ' + p.checksDone + '/' + p.checksTotal +
           (w.vocab.length ? ' · ' + w.vocab.length + ' cards' : ' · integration week') + '</span></span>' +
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

    var h = '<div class="crumb"><a href="#/">Home</a> · <a href="#/course/' + course.id + '">' + E(course.label) + '</a> · Week ' + w.number + '</div>';
    h += '<h1>Week ' + w.number + ' — ' + E(w.title) + '</h1>';
    h += '<p class="sub"><strong>Objective:</strong> ' + E(w.objective) + '</p>';
    if (w.focus) h += '<div class="focus"><b>Northern focus</b>' + E(w.focus) + '</div>';
    if (teacher && w.teacherNote) h += '<div class="tnote"><b>Teacher note</b>' + E(w.teacherNote) + '</div>';

    h += '<h2>Day by day</h2><div class="panel">';
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

    h += '<h2>Self-check</h2><div class="panel">';
    w.selfCheck.forEach(function (t, i) {
      var key = Store.kCheck(course.id, w.number, i);
      var on = Store.get(key, false);
      h += '<label class="check"><input type="checkbox" data-store="' + key + '"' + (on ? ' checked' : '') + '>' +
           '<span class="ctext">' + E(t) + '</span></label>';
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
    var course = UI.activeCourses()[0];
    var cards = UI.allCards(course);
    var nTet = cards.filter(function (c) { return c.scope === 'tetouan' || c.scope === 'mdini'; }).length;
    var nNorth = cards.filter(function (c) { return c.scope === 'north'; }).length;

    var nCore = cards.filter(function (c) { return c.freq === 'core'; }).length;
    var h = UI.banner('vocab') + '<h1>Vocabulary</h1><p class="sub">Showing the <strong>' + nCore + ' everyday words</strong> first — ' +
            'the ones he will hear today. ' + cards.length + ' entries in total, ' + nTet +
            ' attested for Tetouan itself.</p>';
    h += '<div class="viewpick" id="viewpick">' +
         '<button data-v="learn" aria-pressed="' + (vocabState.view === 'learn') + '">Learn</button>' +
         '<button data-v="drill" aria-pressed="' + (vocabState.view === 'drill') + '">Drill</button>' +
         '<button data-v="cards" aria-pressed="' + (vocabState.view === 'cards') + '">Cards</button>' +
         '</div>';
    h += UI.learnerBar();
    h += '<input class="search" id="vsearch" type="search" placeholder="Search English, Darija or pronunciation…" value="' + E(vocabState.q) + '">';

    h += '<div class="chips" id="vchips">';
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
    course.weeks.forEach(function (w) {
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

  function vocabList(cards, teacher) {
    var q = vocabState.q.trim().toLowerCase(), f = vocabState.filter;
    var out = cards.filter(function (c) {
      if (f === 'flagged') { if (!c.flags || !c.flags.length) return false; }
      else if (f === 'weak') { var st = UI.strength(c.id); if (st !== 1 && st !== 2) return false; }
      else if (f.indexOf('g:') === 0) { if (c.group !== f.slice(2)) return false; }
      else if (f === 'core' || f === 'useful' || f === 'extra') { if (c.freq !== f) return false; }
      else if (f === 'mdini' || f === 'tetouan' || f === 'north') { if (c.scope !== f) return false; }
      else if (f === 'contrast') { if (!c.national) return false; }
      else if (f === 'extras') { if (c.week !== null || c.custom) return false; }
      else if (f === 'mine') { if (!c.custom) return false; }
      else if (f !== 'all') { if ('w' + c.week !== f) return false; }
      if (!q) return true;
      return (c.en + ' ' + c.ar + ' ' + c.phon + ' ' + (c.use || '') + ' ' + (c.notes || '')).toLowerCase().indexOf(q) > -1;
    });
    if (!out.length) return '<p class="empty">Nothing matches.</p>';

    /* Cards: a grid of flip cards. English on the face, tap to turn it over.
       Self-testing without leaving the library. */
    if (vocabState.view === 'cards') {
      return '<div class="vgrid">' + out.map(function (c) {
        var pf = UI.formFor(c);
        return '<div class="flip" data-flip><div class="flipin">' +
          '<div class="flipface front">' + UI.strengthDot(c.id) +
            '<span class="fen">' + E(c.en) + '</span>' +
            '<span class="fhint">tap to reveal</span></div>' +
          '<div class="flipface back">' +
            '<span class="say sm">' + UI.sayHTML(pf.phon) + '</span>' +
            '<span class="ar" dir="rtl">' + E(pf.arv || pf.ar) + '</span>' +
            (c.marker ? '<span class="fmark">★ Tetouani</span>' : '') +
          '</div></div></div>';
      }).join('') + '</div>';
    }

    /* Drill: no explanations, no folds — just the three lines, scannable. */
    if (vocabState.view === 'drill') {
      return '<div class="drill">' + out.map(function (c) {
        var pf = UI.formFor(c);
        return '<div class="drow">' + UI.strengthDot(c.id) +
          '<span class="den">' + E(c.en) + '</span>' +
          '<span class="dsay">' + UI.sayHTML(pf.phon) + '</span>' +
          '<span class="ar sec sm" dir="rtl">' + E(pf.arv || pf.ar) + '</span></div>';
      }).join('') + '</div>';
    }

    return out.map(function (c) {
      var label = c.custom ? 'Teacher added' : (c.week ? 'Week ' + c.week : 'Extra');
      return '<div class="crumb" style="margin:14px 0 5px">' + label + '</div>' + UI.vocabCard(c, { teacher: teacher });
    }).join('');
  }

  /* ========================= PRACTICE ========================= */
  var flash = { pool: [], i: 0, revealed: false, filter: 'core', mode: 'cards' };

  function buildPool() {
    var course = UI.activeCourses()[0];
    var cards = UI.allCards(course);
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

  function practiceView(wantTest, set) {
    if (wantTest) flash.mode = 'test';
    if (set === 'today' && flash.filter !== 'today') { flash.filter = 'today'; flash.pool = []; }
    var h = '<h1>Practice</h1><p class="sub">Spoken practice. Say it out loud before you reveal.</p>';
    h += '<div class="chips" id="pmode">' +
         '<button data-m="cards" aria-pressed="' + (flash.mode === 'cards') + '">Flashcards</button>' +
         '<button data-m="test" aria-pressed="' + (flash.mode === 'test') + '">Month 1 Checkpoint</button></div>';
    h += flash.mode === 'test' ? checkpointBlock() : flashBlock();
    return h;
  }

  function flashBlock() {
    var course = UI.activeCourses()[0];
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
      if (c.national) h += '<p class="fnat">Rest of Morocco: ' + E(c.national.phon) + '</p>';
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
    var course = UI.activeCourses()[0], cp = course.checkpoint;
    var status = Store.get(Store.kCpStatus(course.id), '');
    var done = cp.tasks.filter(function (_, i) { return Store.get(Store.kTask(course.id, i), false); }).length;

    var h = '<div class="panel"><div class="crumb">' + E(cp.format) + '</div>' +
            '<h3 style="font-size:18px;margin:2px 0 6px">' + E(cp.title) + '</h3>' +
            '<p class="muted" style="margin:0">' + E(cp.intro) + '</p></div>';

    h += '<div class="panel">';
    cp.tasks.forEach(function (t, i) {
      var key = Store.kTask(course.id, i), on = Store.get(key, false);
      h += '<label class="check"><input type="checkbox" data-store="' + key + '"' + (on ? ' checked' : '') + '>' +
           '<span class="ctext"><strong>' + (i + 1) + '.</strong> ' + E(t) + '</span></label>';
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
    var h = UI.banner('progress') + '<h1>Progress</h1><p class="sub">Self-marked. Spoken performance only — nothing here is a written score.</p>';

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
             '<span class="wmeta">Days ' + p.daysDone + '/' + p.daysTotal + ' · Self-check ' + p.checksDone + '/' + p.checksTotal +
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

  window.Views = {
    home: home, course: courseView, week: weekView,
    vocab: vocabView, vocabList: vocabList, vocabState: vocabState,
    practice: practiceView, flash: flash, buildPool: buildPool,
    progress: progressView, dialect: dialect,
    situations: situations, situation: situation,
    courseById: courseById, sitById: sitById
  };
})();
