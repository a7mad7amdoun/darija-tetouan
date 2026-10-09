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
  function home() {
    var course = UI.currentCourse();
    var wk = UI.currentWeek(course);
    var name = (window.Auth && Auth.currentProfile() && Auth.currentProfile().name) || '';
    var hour = new Date().getHours();
    var greet = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';

    var h = '<section class="homehead">' +
      '<p class="harab">الدارجة التطوانية</p>' +
      '<h1>' + E(greet) + (name ? ', ' + E(name.split(' ')[0]) : '') + '</h1>' +
      '</section>';

    h += Views.startCard();
    h += Views.statusStrip();

    if (wk) {
      var wp = UI.weekProgress(course.id, wk);
      h += '<a class="weeknow" href="#/course/' + course.id + '/week/' + wk.number + '">' +
           '<span class="crumb">' + E(course.label) + ' · Week ' + wk.number +
             ' of ' + course.weeks.length + '</span>' +
           '<h3>' + E(wk.title) + '</h3>' +
           UI.bar(wp.pct) +
           '<span class="muted sm">' + wp.daysDone + ' of ' + wp.daysTotal + ' days · ' +
             wp.checksDone + ' of ' + wp.checksTotal + ' checks</span></a>';
    }

    h += '<div class="wstrip">';
    course.weeks.forEach(function (w) {
      var p = UI.weekProgress(course.id, w);
      var isNow = wk && w.number === wk.number;
      h += '<a href="#/course/' + course.id + '/week/' + w.number + '" ' +
           'class="wpill' + (p.complete ? ' done' : '') + (isNow && !p.complete ? ' now' : '') + '">' +
           (p.complete ? '✓' : w.number) + '<span>Week ' + w.number + '</span></a>';
    });
    h += '</div>';

    h += '<a class="libcta" href="#/library"><span>Library</span>' +
         '<small>Vocabulary, conversations, the Tetouani guide, tests</small><b>→</b></a>';

    h += '<div class="teacher-only" style="margin-top:16px">' +
         '<a class="btn wide" href="#/teacher">Open teacher workspace →</a></div>';
    return h;
  }

  /* Everything that used to crowd the home page. Browsing is the point here,
     so density is fine. */
  function library() {
    var course = UI.currentCourse();
    var cards = UI.allCards(course);
    var nCore = cards.filter(function (c) { return c.freq === 'core'; }).length;

    var h = UI.banner('vocab') + '<h1>Library</h1>' +
      '<p class="sub">Everything in the course, to look through whenever you want. ' +
      'None of it is required — the daily session already picks what you need next.</p>';

    h += '<h2>Practise</h2><div class="tiles">' +
         tile('#/practice', '🎯', 'Flashcards', 'Say it out loud, then reveal') +
         tile('#/tests', '🎲', 'Tests', Tests.list.length + ' short tests: pictures, gaps, spoken') +
         tile('#/exams', '📋', 'Quizzes and finals', 'Weekly quizzes and the monthly finals') +
         '</div>';

    h += '<h2>Read and listen</h2><div class="tiles">' +
         tile('#/situations', '💬', 'Situations', D.situations.length + ' real scenes — start in English, finish in Darija') +
         tile('#/dialogues', '🗣️', 'Conversations', UI.allDialogues().length + ' full exchanges, both sides scripted') +
         tile('#/sentences', '🧱', 'Sentences', UI.allSentences().length + ' sentences broken into their pieces') +
         '</div>';

    h += '<h2>Look things up</h2><div class="tiles">' +
         tile('#/vocab', '🗂️', 'Vocabulary', nCore + ' everyday words, ' + cards.length + ' in all') +
         tile('#/course/' + course.id, '📘', course.label, E(course.goal)) +
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

    h += '<h2>Self-check</h2><div class="panel">';
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

    var h = UI.banner('vocab') + '<h1>Vocabulary</h1><p class="sub">' +
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
    h += '<input class="search" id="vsearch" type="search" ' +
         'placeholder="Search English, Darija, Arabic or pronunciation…" ' +
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

  function flipCard(c) {
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
  }

  function drillRow(c) {
    var pf = UI.formFor(c);
    return '<div class="drow">' + UI.strengthDot(c.id) +
      '<span class="den">' + E(c.en) + '</span>' +
      '<span class="dsay">' + UI.sayHTML(pf.phon) + '</span>' +
      '<span class="ar sec sm" dir="rtl">' + E(pf.arv || pf.ar) + '</span></div>';
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

  function practiceView(wantTest, set) {
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
      var cell = !built ? '<span class="badge tag-formality">not built</span>'
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
    vocab: vocabView, vocabList: vocabList, vocabState: vocabState,
    practice: practiceView, flash: flash, buildPool: buildPool,
    progress: progressView, dialect: dialect,
    situations: situations, situation: situation,
    courseById: courseById, sitById: sitById
  };
})();
