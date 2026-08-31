/* Hash router + event delegation. No build step, no dependencies. */
(function () {
  var root = document.getElementById('app');

  function parse() {
    var h = (location.hash || '#/').replace(/^#/, '');
    var qi = h.indexOf('?');
    var query = {};
    if (qi > -1) {
      h.slice(qi + 1).split('&').forEach(function (p) {
        var kv = p.split('='); query[kv[0]] = decodeURIComponent(kv[1] || '');
      });
      h = h.slice(0, qi);
    }
    return { parts: h.split('/').filter(Boolean), query: query };
  }

  function render() {
    var r = parse(), p = r.parts, html;

    if (!p.length)                                  html = Views.home();
    else if (p[0] === 'course' && p[2] === 'week')  html = Views.week(p[1], p[3]);
    else if (p[0] === 'course')                     html = Views.course(p[1]);
    else if (p[0] === 'situations' && p[1])         html = Views.situation(p[1]);
    else if (p[0] === 'situations')                 html = Views.situations();
    else if (p[0] === 'vocab')                      html = Views.vocab();
    else if (p[0] === 'practice')                   html = Views.practice(r.query.test === '1', r.query.set);
    else if (p[0] === 'progress')                   html = Views.progress();
    else if (p[0] === 'sentences')                  html = Views.sentences();
    else if (p[0] === 'dialogues')                  html = Views.dialogues();
    else if (p[0] === 'exam' && p[1])               html = Views.exam(p[1]);
    else if (p[0] === 'exams')                      { Views.resetExam(); html = Views.exams(); }
    else if (p[0] === 'dialect')                    html = Views.dialect();
    else if (p[0] === 'tests' && p[1])              html = Views.test(p[1]);
    else if (p[0] === 'tests')                      { Views.resetTest(); html = Views.tests(); }
    else if (p[0] === 'feedback')                   html = Views.feedback();
    else if (p[0] === 'teacher')                    html = Views.teacher();
    else                                            html = '<p class="empty">Page not found.</p>';

    root.innerHTML = html;
    pruneMissingPhotos(root);
    if (p[0] === 'teacher' || p[0] === 'feedback') Views.wireTeacher(root);
    markNav(p[0] || 'home');
    renderSnapshot();
    if (window.Feedback) Feedback.refreshBadge();
    window.scrollTo(0, 0);
  }

  /* A photo banner with no file behind it is just an empty coloured band —
     remove it rather than show a hole. Once the files land, they appear. */
  function pruneMissingPhotos(root) {
    Array.prototype.forEach.call(root.querySelectorAll('.phead'), function (el) {
      var m = /url\(([^)]+)\)/.exec(el.style.backgroundImage || '');
      if (!m) { el.parentNode.removeChild(el); return; }
      var img = new Image();
      img.onerror = function () { if (el.parentNode) el.parentNode.removeChild(el); };
      img.src = m[1].replace(/^["']|["']$/g, '');
    });
    var hero = root.querySelector('.hero.hasphoto');
    if (hero) {
      var hm = /url\(([^)]+)\)/.exec(hero.style.backgroundImage || '');
      if (hm) {
        var hi = new Image();
        hi.onerror = function () { hero.classList.remove('hasphoto'); hero.style.backgroundImage = ''; };
        hi.src = hm[1].replace(/^["']|["']$/g, '');
      }
    }
  }

  /* Laptop rail carries a live snapshot of where the student is. */
  function renderSnapshot() {
    var el = document.getElementById('snapshot');
    if (!el) return;
    var course = UI.activeCourses()[0];
    if (!course) { el.innerHTML = ''; return; }
    var wk = UI.currentWeek(course), cp = UI.courseProgress(course);
    var open = window.Feedback ? Feedback.openCount() : 0;
    el.innerHTML =
      '<div class="crumb">Where he is</div>' +
      '<div class="snaprow">' + UI.ring(cp.pct, 52) +
        '<div><div class="snapweek">Week ' + (wk ? wk.number : '—') + ' of ' + course.weeks.length + '</div>' +
        '<div class="snaptitle">' + UI.esc(wk ? wk.title : '') + '</div></div></div>' +
      (UI.isTeacher() && open
        ? '<a class="snapnote" href="#/feedback">' + open + ' note' + (open > 1 ? 's' : '') + ' open</a>'
        : '');
  }

  function markNav(section) {
    var map = { home: 'home', course: 'course', situations: 'situations', vocab: 'vocab',
                practice: 'tests', tests: 'tests', progress: 'progress', sentences: 'sentences', dialogues: 'dialogues', exams: 'exams', exam: 'exams',
                teacher: 'teacher', feedback: 'feedback', dialect: 'home' };
    Array.prototype.forEach.call(document.querySelectorAll('.nav a'), function (a) {
      a.classList.toggle('on', a.dataset.sec === (map[section] || 'home'));
    });
  }

  function applyRole() {
    var role = Store.get(Store.kRole, 'student');
    document.body.dataset.role = role;
    Array.prototype.forEach.call(document.querySelectorAll('.role-toggle button'), function (b) {
      b.setAttribute('aria-pressed', String(b.dataset.role === role));
    });
  }

  /* ---- theme: light / dark / auto ---- */
  var THEMES = ['auto', 'light', 'dark'];
  var THEME_ICON = { auto: '🌗', light: '☀️', dark: '🌙' };
  function applyTheme() {
    var t = Store.get('theme', 'auto');
    if (t === 'auto') document.documentElement.removeAttribute('data-theme');
    else document.documentElement.setAttribute('data-theme', t);
    /* the toggles exist twice — once in the rail, once in the phone topbar */
    Array.prototype.forEach.call(document.querySelectorAll('.themebtn'), function (b) {
      b.textContent = THEME_ICON[t];
      b.title = 'Theme: ' + t + ' — tap to change';
      b.setAttribute('aria-label', 'Theme: ' + t);
    });
  }
  Array.prototype.forEach.call(document.querySelectorAll('.themebtn'), function (b) {
    b.addEventListener('click', function () {
      var t = Store.get('theme', 'auto');
      Store.set('theme', THEMES[(THEMES.indexOf(t) + 1) % THEMES.length]);
      applyTheme();
    });
  });

  Array.prototype.forEach.call(document.querySelectorAll('.role-toggle'), function (rt) {
  rt.addEventListener('click', function (e) {
    var b = e.target.closest('button');
    if (!b) return;
    Store.set(Store.kRole, b.dataset.role);
    applyRole();
    /* the two roles have genuinely different homes */
    var toTeacher = b.dataset.role === 'teacher';
    if (toTeacher && location.hash !== '#/teacher') location.hash = '#/teacher';
    else if (!toTeacher && (location.hash === '#/teacher' || location.hash === '#/feedback')) location.hash = '#/';
    else render();
  });
  });

  /* ---- delegated events ---- */
  root.addEventListener('change', function (e) {
    var t = e.target;
    if (t.dataset && t.dataset.store) {
      Store.set(t.dataset.store, t.checked);
      var day = t.closest('.day');
      if (day) day.classList.toggle('done', t.checked);
      return;
    }
  });

  root.addEventListener('input', function (e) {
    var t = e.target;
    if (t.id === 'vsearch') { Views.vocabState.q = t.value; refreshVocabList(); return; }
    if (t.dataset && t.dataset.storeText) Store.set(t.dataset.storeText, t.value);
  });

  function refreshVocabList() {
    var list = document.getElementById('vlist');
    if (!list) return;
    list.innerHTML = Views.vocabList(UI.allCards(UI.activeCourses()[0]), UI.isTeacher());
  }

  root.addEventListener('click', function (e) {
    var t = e.target;

    if (Views.examClick && Views.examClick(t)) { render(); return; }
    if (Views.testClick && Views.testClick(t)) { render(); return; }

    var lw = t.closest('#learnerpick button');
    if (lw) { Store.set('learner', lw.dataset.l); render(); return; }

    var fc = t.closest('[data-flip]');
    if (fc) { fc.classList.toggle('flipped'); return; }

    var vp = t.closest('#viewpick button');
    if (vp) {
      Views.vocabState.view = vp.dataset.v;
      Array.prototype.forEach.call(vp.parentNode.children, function (b) {
        b.setAttribute('aria-pressed', String(b === vp));
      });
      refreshVocabList();
      return;
    }

    var chip = t.closest('#vchips button');
    if (chip) {
      Views.vocabState.filter = chip.dataset.f;
      Array.prototype.forEach.call(chip.parentNode.children, function (b) {
        b.setAttribute('aria-pressed', String(b === chip));
      });
      refreshVocabList();
      return;
    }

    var mode = t.closest('#pmode button');
    if (mode) {
      Views.flash.mode = mode.dataset.m;
      if (location.hash !== '#/practice') location.hash = '#/practice';
      else render();
      return;
    }

    var schip = t.closest('#schips button');
    if (schip) { Views.sentState.course = schip.dataset.s; render(); return; }

    var pchip = t.closest('#pchips button');
    if (pchip) { Views.flash.filter = pchip.dataset.f; Views.buildPool(); render(); return; }

    /* ---- situation mix level ---- */
    var lvl = t.closest('.levelpick button');
    if (lvl) {
      Store.set('sitlevel:' + lvl.closest('.levelpick').dataset.sit, +lvl.dataset.l);
      render();
      return;
    }
    /* per-line step, clamped to that line's own ladder length */
    var step = t.closest('.lstep button');
    if (step) {
      var lad = step.closest('.ladder');
      var sit = Views.sitById(lad.dataset.sit);
      var line = sit.lines[+lad.dataset.line];
      var max = line.mix.length + 1;
      var cur = Math.min(Store.get('sitlevel:' + sit.id, 0), max);
      var next = Math.max(0, Math.min(max, cur + (+step.dataset.step)));
      Store.set('sitlevel:' + sit.id, next);
      render();
      return;
    }

    if (t.closest('#flashcard')) {
      var f = Views.flash;
      if (!f.revealed) f.revealed = true;
      else { f.i = (f.i + 1) % f.pool.length; f.revealed = false; }
      render();
      return;
    }
    if (t.id === 'fnext')  { var f2 = Views.flash; f2.i = (f2.i + 1) % f2.pool.length; f2.revealed = false; render(); return; }
    if (t.id === 'fprev')  { var f3 = Views.flash; f3.i = (f3.i - 1 + f3.pool.length) % f3.pool.length; f3.revealed = false; render(); return; }
    if (t.id === 'fshuffle') { Views.buildPool(); render(); return; }

    var star = t.closest('.stars button');
    if (star) {
      var key = star.parentNode.dataset.rate;
      var v = +star.dataset.v;
      if (Store.get(key, 0) === v) v = 0;
      Store.set(key, v);
      Array.prototype.forEach.call(star.parentNode.children, function (b) {
        b.classList.toggle('on', +b.dataset.v <= v);
      });
      return;
    }

    var cpb = t.closest('[data-cp] button');
    if (cpb) {
      var ck = cpb.closest('[data-cp]').dataset.cp;
      Store.set(ck, Store.get(ck, '') === cpb.dataset.v ? '' : cpb.dataset.v);
      render();
      return;
    }

    if (t.id === 'resetall') {
      if (confirm('Clear all progress on this device? This cannot be undone.')) { Store.reset(); render(); }
    }
  });

  window.App = { render: render };
  window.addEventListener('hashchange', render);
  applyRole();
  applyTheme();
  if (window.Feedback) Feedback.mount();
  render();
  if (window.Feedback) Feedback.refreshBadge();
})();
