/* Hash router + event delegation. No build step, no dependencies. */
(function () {
  function D2() { return window.DARIJA || {}; }
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

    /* A student's progress is only ever shown on the teacher page. Drop the
       overlay BEFORE building the page, or their numbers would appear once on
       the teacher's own home or week pages on the way out. */
    if (p[0] !== 'teacher' && window.Storage && Storage.viewing) {
      if (Storage.viewing()) Storage.stopViewing();
    }

    if (!p.length)                                  html = Views.home();
    else if (p[0] === 'today')                      html = Views.today();
    else if (p[0] === 'library')                    html = Views.library();
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
    else if (p[0] === 'verify')                     html = Views.verify();
    else if (p[0] === 'account')                    html = accountView();
    else if (p[0] === 'teacher')                    { ensurePeople(); html = Views.teacher(); }
    else                                            html = '<p class="empty">Page not found.</p>';

    var sec = p[0] || 'home';
    var wkey = (sec === 'course' && p[2] === 'week')
      ? (D2().weekPhoto || {})[p[1] + ':' + p[3]] : null;
    root.innerHTML = (window.UI && UI.pageWash ? UI.pageWash(sec === 'course' && p[2] === 'week' ? 'week' : sec, wkey) : '') + html;
    pruneMissingPhotos(root);
    if (p[0] === 'teacher' || p[0] === 'feedback' || p[0] === 'verify') Views.wireTeacher(root);
    markNav(p[0] || 'home');
    renderSnapshot();
    if (window.Feedback) Feedback.refreshBadge();
    window.scrollTo(0, 0);
  }

  /* The teacher page needs to know who else is on the course. Fetched once,
     lazily, and only when that page is actually opened. */
  function ensurePeople() {
    var st = window.Views && Views.teacherPeople && Views.teacherPeople();
    if (!st || st.list || st.loading || st.error) return;
    var prof = window.Auth && Auth.currentProfile();
    if (!prof || prof.local || !Auth.configured()) return;
    st.loading = true;
    Auth.listProfiles().then(function (list) {
      st.list = list; st.loading = false; render();
    }).catch(function (e) {
      st.error = e.message; st.loading = false; render();
    });
  }

  /* Switching between "my progress" and a student's. Their progress is fetched
     read-only; nothing on this page can write into it. */
  function peek(id) {
    var st = Views.teacherPeople();
    if (id === 'me') { Storage.stopViewing(); render(); return; }
    if (id === 'refresh') {
      var v = Storage.viewing();
      if (!v) { st.list = null; st.error = null; ensurePeople(); render(); return; }
      id = v.profileId;
    }
    var person = (st.list || []).filter(function (p) { return p.id === id; })[0];
    st.busy = id; st.error = null; render();
    Sync.pullStudent(id).then(function (snap) {
      st.busy = null;
      Storage.viewAs({ profileId: id, name: person ? person.name : '', entries: snap.entries, at: snap.at });
      render();
    }).catch(function (e) {
      /* offline, or the fetch failed: fall back to the last copy we cached */
      Sync.cachedStudent(id).then(function (snap) {
        st.busy = null;
        if (snap) {
          Storage.viewAs({ profileId: id, name: person ? person.name : '', entries: snap.entries, at: snap.at });
          st.error = e.message;
        } else {
          st.error = e.message;
        }
        render();
      });
    });
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
    var map = { home: 'home', today: 'today', library: 'library', course: 'course', situations: 'situations', vocab: 'vocab',
                practice: 'tests', tests: 'tests', progress: 'progress', sentences: 'sentences', dialogues: 'dialogues', exams: 'exams', exam: 'exams', verify: 'verify', account: 'account',
                teacher: 'teacher', feedback: 'feedback', dialect: 'home' };
    Array.prototype.forEach.call(document.querySelectorAll('.nav a'), function (a) {
      a.classList.toggle('on', a.dataset.sec === (map[section] || 'home'));
    });
  }

  function applyRole() {
    var role = Store.get(Store.kRole, 'student');
    document.body.dataset.role = role;
    /* Who is actually signed in, as the database says. The Student/Teacher
       switch only previews a view, and is now shown only to the teacher - a
       student was being offered a "Teacher" button that could change nothing
       real. In local, unsigned use there is no database to ask, so the switch
       stays available there as before. */
    var prof = window.Auth && Auth.currentProfile();
    document.body.dataset.signedRole = !prof ? 'teacher'
                                     : prof.local ? 'teacher'
                                     : (prof.role || 'student');
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
    /* the same pool the page was rendered from - this was month 1 only, so
       typing or clearing the box silently narrowed the results to one month */
    var pool = UI.allActiveCards();
    list.innerHTML = Views.vocabList(pool, UI.isTeacher());
    var scope = document.getElementById('vscope');
    if (scope) scope.innerHTML = Views.vocabScopeSummary(pool);
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

    if (t.id === 'reupload') {
      acct.repairMsg = 'Uploading…'; acct.repairOk = false; render();
      Sync.reupload().then(function (r) {
        acct.repairMsg = 'Sent ' + r.queued + ' entries. Anything the server was missing is back; ' +
                         'anything it already had was left alone.';
        acct.repairOk = true;
      }).catch(function (e) {
        acct.repairMsg = e.message; acct.repairOk = false;
      }).then(render);
      return;
    }

    /* ---- teacher: naming the kind of problem a word has ---- */
    var au = t.closest('[data-audio]');
    if (au) {
      var card = UI.allActiveCards().filter(function (c) { return c.id === au.dataset.audio; })[0];
      /* Refuse rather than play. Both the staleness and scope guards treat a
         missing card as "fine", so an unresolved id would have sailed past them
         and played a clip we could not check against anything. */
      if (!card) { au.classList.add('failed'); return; }
      Audio2.play(au.dataset.audio, card).catch(function () {
        au.classList.add('failed');
      });
      return;
    }

    var wk = t.closest('[data-wskind]');
    if (wk) {
      var vw = Storage.viewing();
      if (vw) {
        var already = Weak.currentKind(vw.profileId, wk.dataset.wscard);
        Weak.observe(vw.profileId, wk.dataset.wscard,
                     already === wk.dataset.wskind ? '' : wk.dataset.wskind, '');
        render();
      }
      return;
    }

    var pk = t.closest('[data-peek]');
    if (pk) { peek(pk.dataset.peek); return; }

    /* ---- the guided session ---- */
    if (t.closest('[data-sess]')) {
      if (Views.todayClick(t)) { render(); return; }
    }

    if (t.id === 'vsearchall') {
      /* an explicit action, never a silent widening: the learner asked to look
         past the filter they chose */
      Views.vocabState.filter = 'all';
      render();
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

  /* =====================================================================
     BOOT

     Three gates in order: sign in, migration, then the app. Each blocks, and
     the migration gate never acts on its own — it waits for a button.
     ===================================================================== */
  var gate = null;              /* 'login' | 'notconfigured' | 'migration' | null */
  var gateData = null;

  function paintGate(html) { root.innerHTML = html; }

  function boot() {
    applyTheme();
    if (!window.Storage || !window.DB || !DB.available()) {
      /* no IndexedDB: run on the fallback store, no accounts, no sync */
      startApp();
      return;
    }
    Auth.init().then(function (r) {
      if (!Auth.configured()) { gate = 'notconfigured'; paintGate(Account.notConfiguredScreen()); return; }
      if (!r.profile) { gate = 'login'; paintGate(Account.loginScreen()); return; }
      afterSignIn(r.profile);
    }).catch(function (e) {
      gate = 'login';
      paintGate(Account.loginScreen('Could not reach the server: ' + e.message +
        ' — if you have signed in before, reconnect and try again.'));
    });
  }

  function afterSignIn(profile) {
    return Storage.putProfile({ id: profile.id, name: profile.name, role: profile.role })
      .catch(function () {})
      .then(function () { return Migrations.inspect(profile.id); })
      .then(function (info) {
        if (info.needsSchemaMigration || info.legacyPresent) {
          gate = 'migration'; gateData = info;
          paintGate(Account.migrationScreen(info));
          return;
        }
        return Storage.load(profile.id).then(function (res) {
          if (res && res.needsMigration) {
            gate = 'migration';
            gateData = { savedVersion: res.found, appVersion: res.expected, legacyPresent: false };
            paintGate(Account.migrationScreen(gateData));
            return;
          }
          startApp();
        });
      });
  }

  function startApp() {
    gate = null; gateData = null;
    applyRole();
    if (window.Sync) { Sync.start(); Sync.onChange(paintSyncBadge); }
    if (window.Storage) Storage.onChange(function () { paintSyncBadge(); });
    if (window.Feedback) Feedback.mount();
    render();
    if (window.Feedback) Feedback.refreshBadge();
  }

  /* Small, deliberately local state: the result of the last password or rename
     attempt, plus the list of people once it has been fetched. Kept here rather
     than in storage because none of it is progress. */
  var acct = {};

  function accountView() {
    if (acct.people === undefined && window.Auth && Auth.currentProfile() &&
        !Auth.currentProfile().local && !acct.loading) {
      acct.loading = true;
      Auth.listProfiles().then(function (list) {
        acct.people = list; acct.loading = false; render();
      }).catch(function (e) {
        acct.people = null; acct.peopleErr = e.message; acct.loading = false; render();
      });
    }
    return UI.banner('progress') +
      '<p class="sub">Who is signed in, whether progress has reached the server, and how to ' +
      'take a backup out or bring one back.</p>' + Account.accountPanel(acct);
  }


  function paintSyncBadge() {
    if (!window.Account) return;
    /* There are TWO badges - one in the laptop rail, one in the phone topbar -
       and they shared an id, so getElementById only ever found the first and
       whichever shell was in use on a phone showed a status that never changed.
       Paint every one of them. */
    var html = Account.headerBadge();
    Array.prototype.forEach.call(document.querySelectorAll('[data-syncbadge]'), function (el) {
      el.innerHTML = html;
    });
  }

  /* ---- gate interactions ---- */
  document.addEventListener('submit', function (e) {
    var wsf = e.target.closest ? e.target.closest('.wsnoteform') : null;
    if (wsf) {
      e.preventDefault();
      var vws = Storage.viewing();
      if (vws && wsf.note.value.trim()) {
        Weak.observe(vws.profileId, wsf.dataset.wscard,
                     Weak.currentKind(vws.profileId, wsf.dataset.wscard), wsf.note.value.trim());
        render();
      }
      return;
    }

    var prodf = e.target.closest ? e.target.closest('#produceform') : null;
    if (prodf) {
      e.preventDefault();
      if (Views.todayProduced(prodf.say.value)) render();
      return;
    }

    var pf = e.target.closest ? e.target.closest('#pwform') : null;
    if (pf) {
      e.preventDefault();
      var pw = pf.pw.value;
      acct.pwMsg = 'Changing…'; acct.pwOk = false; render();
      Auth.changePassword(pw).then(function () {
        acct.pwMsg = 'Password changed. Use the new one next time you sign in.'; acct.pwOk = true;
      }).catch(function (err) {
        acct.pwMsg = err.message; acct.pwOk = false;
      }).then(render);
      return;
    }
    var rf = e.target.closest ? e.target.closest('.renameform') : null;
    if (rf) {
      e.preventDefault();
      Auth.rename(rf.dataset.id, rf.name.value).then(function (row) {
        (acct.people || []).forEach(function (p) { if (p.id === row.id) p.name = row.name; });
        if (Auth.currentProfile() && Auth.currentProfile().id === row.id) Auth.currentProfile().name = row.name;
        acct.peopleMsg = 'Saved.'; acct.peopleOk = true;
      }).catch(function (err) {
        acct.peopleMsg = err.message; acct.peopleOk = false;
      }).then(render);
      return;
    }

    var f = e.target;
    if (f && f.id === 'loginform') {
      e.preventDefault();
      var d = new FormData(f);
      paintGate(Account.loginScreen(null, true));
      Auth.signIn(String(d.get('email')).trim(), String(d.get('password')))
        .then(function (profile) { return afterSignIn(profile); })
        .catch(function (err) { paintGate(Account.loginScreen(err.message)); });
    }
  });

  document.addEventListener('click', function (e) {
    var t = e.target;

    if (t.id === 'uselocal') {
      Storage.putProfile({ id: 'local', name: 'This device', role: 'student' })
        .then(function () { return Migrations.inspect('local'); })
        .then(function (info) {
          if (info.needsSchemaMigration || info.legacyPresent) {
            gate = 'migration'; gateData = info;
            paintGate(Account.migrationScreen(info));
          } else {
            return Storage.load('local').then(startApp);
          }
        });
      return;
    }

    if (t.id === 'migbackup') {
      t.disabled = true; t.textContent = 'Preparing…';
      /* the legacy blob is exported verbatim, before anything is rewritten */
      var raw = null;
      try { raw = localStorage.getItem('darija.tetouan.v1'); } catch (err) {}
      var payload = {
        kind: 'darija-tetouan-backup', formatVersion: 1,
        schemaVersion: (gateData && gateData.savedVersion) || 1,
        contentVersion: 1, exportedAt: new Date().toISOString(),
        note: 'Pre-migration export. Legacy localStorage copied verbatim.',
        profiles: {}, progress: {}, shared: {},
        legacy: raw ? JSON.parse(raw) : null
      };
      var blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
      var a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = 'darija-tetouan-pre-migration-' + new Date().toISOString().slice(0, 10) + '.json';
      document.body.appendChild(a); a.click(); a.remove();
      t.textContent = 'Backup downloaded';
      return;
    }

    if (t.id === 'migrun') {
      var pid = (Auth.currentProfile() && Auth.currentProfile().id) || 'local';
      t.disabled = true; t.textContent = 'Migrating…';
      var job = gateData && gateData.legacyPresent
        ? Migrations.migrateLegacy(pid)
        : Migrations.runMigration(pid);
      job.then(function (res) {
        return Storage.load(pid).then(function () {
          startApp();
          var n = res && (res.migrated || res.applied);
          alert('Migration finished.\n\n' +
                (res.migrated ? res.migrated + ' entries carried across, ' +
                                res.remapped + ' rewritten to stable ids.\n' : '') +
                (res.applied ? 'Applied ' + res.applied.join(', ') + '.\n' : '') +
                'Your original data was backed up first and the old key is still in place.');
        });
      }).catch(function (err) {
        t.disabled = false; t.textContent = 'Migrate now';
        alert('Migration did NOT run. Nothing was changed.\n\n' + err.message);
      });
      return;
    }

    if (t.id === 'migskip') {
      var pid2 = (Auth.currentProfile() && Auth.currentProfile().id) || 'local';
      if (!confirm('Start fresh on this device?\n\nYour old progress is left where it is and ' +
                   'can be migrated later from the Account page. Nothing is deleted.')) return;
      DB.put('state', pid2, Storage.emptyDoc(pid2))
        .then(function () { return Storage.load(pid2); })
        .then(startApp);
      return;
    }

    if (t.id === 'signout') {
      Storage.flush()
        .then(function () { return Auth.signOut(); })
        .then(function () {
          Storage.unload();          /* never leave the last person's data in memory */
          gate = 'login';
          paintGate(Account.loginScreen('Signed out.'));
        });
      return;
    }

    if (t.id === 'syncnow') { t.disabled = true; t.textContent = 'Syncing…';
      Sync.syncNow().then(function () { render(); }); return; }

    if (t.id === 'doexport') { var name = Backup.download(); t.textContent = 'Saved ' + name; return; }
    if (t.id === 'showimport') { document.getElementById('importwrap').hidden = false; return; }
    if (t.id === 'importcancel') {
      document.getElementById('importpreview').innerHTML = '';
      document.getElementById('importfile').value = '';
      return;
    }
    if (t.id === 'importconfirm') {
      if (!window.__pendingImport) return;
      t.disabled = true; t.textContent = 'Importing…';
      Backup.apply(window.__pendingImport, { includeShared: Auth.isTeacher() })
        .then(function (r) {
          window.__pendingImport = null;
          alert('Imported ' + r.entries + ' entries.' +
                (r.migrated ? ' The backup was older and was migrated on the way in.' : '') +
                '\n\nA backup of your previous state was written first.');
          render();
        })
        .catch(function (err) { alert('Import failed. Nothing was changed.\n\n' + err.message); render(); });
      return;
    }
  });

  document.addEventListener('change', function (e) {
    if (e.target && e.target.id === 'importfile') {
      var f = e.target.files && e.target.files[0];
      if (!f) return;
      var rd = new FileReader();
      rd.onload = function () {
        var pv = Backup.inspect(String(rd.result));
        window.__pendingImport = pv.ok ? pv : null;
        document.getElementById('importpreview').innerHTML = Account.importPreview(pv);
      };
      rd.readAsText(f);
    }
  });

  window.App = { render: render, boot: boot, startApp: startApp,
                 gate: function () { return gate; } };
  window.addEventListener('hashchange', function () { if (!gate) render(); });
  boot();
})();
