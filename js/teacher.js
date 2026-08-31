/* Teacher workspace — progress at a glance, plus space to change things
   without touching code. Everything here writes to localStorage. */
(function () {
  var D = window.DARIJA, E = UI.esc;

  function sessions() {
    var raw = Store.get('sessions', null);
    if (!raw) return [];
    try { return typeof raw === 'string' ? JSON.parse(raw) : raw; } catch (e) { return []; }
  }
  function saveSessions(list) { Store.set('sessions', list); }

  function teacherView() {
    var course = UI.activeCourses()[0];
    var cp = UI.courseProgress(course);
    var cards = UI.allCards(course);
    var h = UI.banner('teacher') + '<h1>Teacher workspace</h1><p class="sub">Everything you need to run and adjust the course, in one place. All edits save on this device.</p>';

    /* ---------- 1. progress at a glance ---------- */
    h += '<h2>Where Hamza is</h2><div class="panel">';
    h += '<div class="statrow">' +
         stat(cp.weeksDone + '/' + cp.weeksTotal, 'weeks done') +
         stat(D.situations.filter(function (s) { return Store.get('sitdone:' + s.id, false); }).length + '/' + D.situations.length, 'scenes fluent') +
         stat(Store.get(Store.kCpStatus(course.id), '') === 'passed' ? 'Passed' :
              Store.get(Store.kCpStatus(course.id), '') === 'retry' ? 'Retry' : '—', 'checkpoint') +
         '</div>';
    h += '<table class="ttable"><thead><tr><th>Week</th><th>Days</th><th>Self-check</th><th>Rating</th></tr></thead><tbody>';
    course.weeks.forEach(function (w) {
      var p = UI.weekProgress(course.id, w);
      h += '<tr' + (p.complete ? ' class="done"' : '') + '><td><a href="#/course/' + course.id + '/week/' + w.number + '">W' + w.number + '</a></td>' +
           '<td>' + p.daysDone + '/' + p.daysTotal + '</td>' +
           '<td>' + p.checksDone + '/' + p.checksTotal + '</td>' +
           '<td>' + (p.rating ? '★'.repeat(p.rating) : '—') + '</td></tr>';
    });
    h += '</tbody></table></div>';

    /* ---------- 2. session log ---------- */
    h += '<h2>Session log</h2>';
    h += '<div class="panel tight"><form id="sessform" class="miniform">' +
         '<div class="frow"><label>Date<input type="date" name="date" required></label>' +
         '<label>Week<select name="week"><option value="">—</option>' +
         course.weeks.map(function (w) { return '<option value="' + w.number + '">Week ' + w.number + '</option>'; }).join('') +
         '</select></label></div>' +
         '<label>What happened<textarea class="notes sm" name="note" placeholder="What he nailed, what fell apart, what to drill next time…" required></textarea></label>' +
         '<button class="btn primary wide" type="submit">Add session</button></form></div>';

    var sess = sessions();
    if (sess.length) {
      h += '<div class="panel">';
      sess.slice().reverse().forEach(function (s, i) {
        var realIdx = sess.length - 1 - i;
        h += '<div class="sessrow"><div class="sesshead"><strong>' + E(s.date) + '</strong>' +
             (s.week ? '<span class="badge tag-formality">Week ' + E(s.week) + '</span>' : '') +
             '<button class="linkbtn" data-delsess="' + realIdx + '">delete</button></div>' +
             '<p class="muted" style="margin:4px 0 0;white-space:pre-wrap">' + E(s.note) + '</p></div>';
      });
      h += '</div>';
    } else {
      h += '<div class="panel tight"><p class="muted" style="margin:0">No sessions logged yet.</p></div>';
    }

    /* ---------- 2b. test results ---------- */
    h += '<h2>Test results</h2><div class="panel">';
    var anyTest = false;
    Tests.list.forEach(function (tt) {
      var l = Tests.last(tt.id), b = Tests.best(tt.id), n = Tests.results(tt.id).length;
      if (l) anyTest = true;
      h += '<div class="weekrow"><span class="wnum">' + tt.icon + '</span>' +
           '<span class="wbody"><span class="wtitle">' + E(tt.title) + '</span>' +
           '<span class="wmeta">' + (l ? 'last ' + Math.round(l.score / Math.max(1, l.total) * 100) +
             '% (' + E(l.date) + ') · best ' + b + '% · ' + n + ' attempt' + (n > 1 ? 's' : '')
             : 'not taken yet') + '</span></span></div>';
    });
    if (!anyTest) h += '<p class="muted" style="margin:8px 0 0">No tests taken yet.</p>';
    h += '</div>';

    /* ---------- 2c. feedback summary (full inbox is its own page) ---------- */
    var openN = Feedback.openCount(), totalN = Feedback.all().length;
    h += '<h2>Feedback</h2><a class="panel tight" href="#/feedback" style="display:block">' +
         '<div class="crumb">Inbox</div>' +
         '<strong style="font-size:15px">' + (totalN ? openN + ' open · ' + totalN + ' total' : 'No notes yet') + '</strong>' +
         '<p class="muted" style="margin:4px 0 0">Every page has a \u270d\ufe0f Note button. Notes land here grouped by page \u2014 open the inbox to work through them or export the list.</p></a>';

    /* ---------- 3. verification queue ---------- */
    h += '<h2>Verification queue</h2>';
    Object.keys(D.flags).forEach(function (id) {
      var f = D.flags[id];
      var affected = cards.filter(function (c) { return (c.flags || []).indexOf(id) > -1; });
      var cls = f.status === 'open' ? 'tag-flag' : (f.status === 'partial' ? 'tag-partial' : 'tag-ok');
      var resolved = Store.get('flagres:' + id, '');
      h += '<div class="panel"><div class="vmeta" style="margin:0 0 7px">' +
           '<span class="badge ' + cls + '">' + E(f.label) + '</span>' +
           '<span class="badge tag-formality">' + E(f.status) + '</span></div>' +
           '<h3 style="font-size:15px;margin:0 0 4px">' + E(f.title) + '</h3>' +
           '<p class="muted" style="margin:0 0 8px">' + E(f.detail) + '</p>';
      if (f.caveat) h += '<p class="vnotes" style="margin:0 0 8px">Still to confirm: ' + E(f.caveat) + '</p>';
      if (f.source) h += '<p class="vnotes" style="margin:0 0 8px">Source: ' + E(f.source) + '</p>';
      if (affected.length) {
        h += '<p class="muted" style="margin:0 0 8px"><strong>On ' + affected.length + ' card' + (affected.length > 1 ? 's' : '') + ':</strong> ' +
             affected.map(function (c) { return E(c.en); }).join(' · ') + '</p>';
      }
      h += '<label class="flabel">What a local actually confirmed' +
           '<textarea class="notes sm" data-store-text="flagres:' + E(id) + '" ' +
           'placeholder="Write the answer here — it appears on every card carrying this flag.">' + E(resolved) + '</textarea></label>';
      h += '<p class="vnotes" style="margin:8px 0 0">Permanent changes go in <code>data/flags.js</code>.</p></div>';
    });

    /* ---------- 4. add your own phrase ---------- */
    var mine = UI.customCards();
    h += '<h2>Add your own phrase</h2>';
    h += '<div class="panel tight"><p class="muted" style="margin:0 0 10px">Anything you add appears in the Vocabulary library and in flashcards straight away — no code edit needed.</p>' +
         '<form id="cardform" class="miniform">' +
         '<label>English<input name="en" required placeholder="I am hungry"></label>' +
         '<label>Northern Darija (Arabic script)<input name="ar" dir="rtl" lang="ary" class="arin" required placeholder="فيا الجوع"></label>' +
         '<label>Pronunciation<input name="phon" required placeholder="FEE-ya j-JOO3"></label>' +
         '<label>When to use it<input name="use" placeholder="Ordering food, or being offered it"></label>' +
         '<div class="frow"><label>Week<select name="week"><option value="">—</option>' +
         course.weeks.map(function (w) { return '<option value="' + w.number + '">Week ' + w.number + '</option>'; }).join('') +
         '</select></label>' +
         '<label class="inline"><input type="checkbox" name="marker"> Distinctly northern ★</label></div>' +
         '<div class="frow"><label>National form (optional)<input name="natAr" dir="rtl" lang="ary" class="arin" placeholder="Arabic"></label>' +
         '<label>National pronunciation<input name="natPhon" placeholder="phonetic"></label></div>' +
         '<button class="btn primary wide" type="submit">Add phrase</button></form></div>';

    if (mine.length) {
      h += '<div class="panel">';
      mine.forEach(function (c, i) {
        h += '<div class="sessrow"><div class="sesshead"><strong>' + E(c.en) + '</strong>' +
             '<button class="linkbtn" data-delcard="' + i + '">delete</button></div>' +
             '<p class="muted" style="margin:4px 0 0"><span class="ar" style="font-size:19px;display:inline" dir="rtl">' + E(c.ar) + '</span> · ' + E(c.phon) +
             (c.week ? ' · Week ' + E(c.week) : '') + '</p></div>';
      });
      h += '</div>';
    }

    /* ---------- 5. week notes ---------- */
    h += '<h2>Week notes</h2>';
    course.weeks.forEach(function (w) {
      h += '<div class="panel tight"><div class="crumb">Week ' + w.number + ' — ' + E(w.title) + '</div>';
      if (w.teacherNote) h += '<p class="vnotes" style="margin:0 0 8px">' + E(w.teacherNote) + '</p>';
      h += '<textarea class="notes" data-store-text="' + Store.kNote(course.id, w.number) + '" ' +
           'placeholder="Notes for Week ' + w.number + '…">' + E(Store.get(Store.kNote(course.id, w.number), '')) + '</textarea></div>';
    });

    /* ---------- 6. drafted cards ---------- */
    var drafts = cards.filter(function (c) { return c.source === 'draft'; });
    var researched = cards.filter(function (c) { return c.source === 'research'; });
    h += '<h2>Content status</h2><div class="panel tight">' +
         '<p class="muted" style="margin:0 0 8px"><strong>' + researched.length + ' researched</strong> — corrected against dialectology sources, see the ' +
         '<a href="#/dialect">Northern guide</a>.</p>' +
         '<p class="muted" style="margin:0"><strong>' + drafts.length + ' drafted</strong> — written to fill out the lesson plan, not yet confirmed with a Tetouani speaker: ' +
         drafts.slice(0, 12).map(function (c) { return E(c.en); }).join(', ') + (drafts.length > 12 ? ', …' : '') + '</p></div>';

    /* ---------- 7. backup ---------- */
    h += '<h2>Backup</h2><div class="panel tight">' +
         '<p class="muted" style="margin:0 0 10px">Progress lives in this browser only. Copy this out to move it to another device, or paste a backup in to restore.</p>' +
         '<textarea class="notes mono" id="exportbox" readonly>' + E(JSON.stringify(Store.all())) + '</textarea>' +
         '<div class="btnrow" style="margin-top:9px"><button class="btn" id="copyexport">Copy</button>' +
         '<button class="btn" id="showimport">Restore from backup…</button></div>' +
         '<div id="importwrap" hidden style="margin-top:10px">' +
         '<textarea class="notes mono" id="importbox" placeholder="Paste a backup here"></textarea>' +
         '<button class="btn danger wide" id="doimport" style="margin-top:8px">Replace all progress with this</button></div>' +
         '<button class="btn danger wide" id="resetall" style="margin-top:14px">Reset all progress</button>' +
         '</div>';
    return h;
  }


  /* ===================== FEEDBACK INBOX (its own page) ===================== */
  function feedbackView() {
    var groups = Feedback.grouped();
    var openN = Feedback.openCount();
    var h = UI.banner('feedback') + '<h1>Feedback inbox' + (openN ? ' <span class="badge tag-flag">' + openN + ' open</span>' : '') + '</h1>';
    h += '<p class="sub">Everything you flagged, grouped by the page you flagged it on. Tick one off when it is fixed.</p>';

    if (!groups.length) {
      h += '<div class="panel"><p class="muted" style="margin:0">Nothing yet. Open any page, tap the \u270d\ufe0f Note button in the corner, and say what is wrong with it \u2014 bluntly. It lands here with the page it came from.</p></div>';
      return h;
    }

    var byKind = {};
    Feedback.all().forEach(function (n) { byKind[n.kind] = (byKind[n.kind] || 0) + 1; });
    h += '<div class="statrow">' + Feedback.KINDS.filter(function (k) { return byKind[k.id]; })
      .map(function (k) {
        return '<div class="stat"><span class="sv">' + byKind[k.id] + '</span><span class="sl">' + E(k.icon + ' ' + k.label) + '</span></div>';
      }).join('') + '</div>';

    groups.forEach(function (g) {
      h += '<div class="panel"><div class="crumb"><a href="' + E(g.route) + '">' + E(g.page) + '</a> \u00b7 ' +
           g.notes.length + ' note' + (g.notes.length > 1 ? 's' : '') + '</div>';
      g.notes.forEach(function (n) {
        var k = Feedback.KINDS.filter(function (x) { return x.id === n.kind; })[0];
        h += '<div class="fbrow' + (n.done ? ' done' : '') + '">' +
             '<label class="fbtick"><input type="checkbox" data-fbdone="' + n.id + '"' + (n.done ? ' checked' : '') + '></label>' +
             '<div class="fbbody"><div class="fbmeta">' +
             '<span class="badge tag-formality">' + (k ? k.icon + ' ' + E(k.label) : E(n.kind)) + '</span>' +
             '<span class="fbdate">' + E(n.date) + '</span>' +
             '<button class="linkbtn" data-fbdel="' + n.id + '">delete</button></div>' +
             '<p class="fbtext">' + E(n.text) + '</p></div></div>';
      });
      h += '</div>';
    });

    h += '<div class="panel tight"><div class="crumb">Export for handover</div>' +
         '<p class="muted" style="margin:0 0 9px">Copy this and paste it to me \u2014 it is a ready-made work list.</p>' +
         '<textarea class="notes mono" id="fbexport" readonly>' + E(Feedback.exportMarkdown()) + '</textarea>' +
         '<button class="btn wide" id="copyfb" style="margin-top:9px">Copy as markdown</button></div>';
    return h;
  }

  function stat(v, label) {
    return '<div class="stat"><span class="sv">' + E(v) + '</span><span class="sl">' + E(label) + '</span></div>';
  }

  /* --- event wiring specific to this page, called by app.js after render ---
     The root-level click handler must attach ONCE: app.js re-renders into the
     same element, so re-attaching would fire deletes twice, then three times… */
  var clickWired = false;

  function wire(root) {
    var f = root.querySelector('#sessform');
    if (f) f.addEventListener('submit', function (e) {
      e.preventDefault();
      var d = new FormData(f);
      var list = sessions();
      list.push({ date: d.get('date'), week: d.get('week'), note: d.get('note') });
      list.sort(function (a, b) { return a.date < b.date ? -1 : 1; });
      saveSessions(list);
      App.render();
    });

    var cf = root.querySelector('#cardform');
    if (cf) cf.addEventListener('submit', function (e) {
      e.preventDefault();
      var d = new FormData(cf);
      var list = UI.customCards().map(function (c) { return c; });
      /* monotonic counter, not list.length — deleting a card must never let a
         later card reuse an id and inherit its teacher note */
      var seq = (Store.get('customSeq', 0) || 0) + 1;
      Store.set('customSeq', seq);
      var card = {
        id: 'custom-' + seq + '-' + String(d.get('en')).replace(/\W+/g, '').slice(0, 12).toLowerCase(),
        en: d.get('en'), ar: d.get('ar'), phon: d.get('phon'),
        use: d.get('use') || '', formality: 'Neutral',
        week: d.get('week') ? +d.get('week') : null,
        marker: !!d.get('marker')
      };
      if (d.get('natAr')) card.national = { ar: d.get('natAr'), phon: d.get('natPhon') || '', note: 'Recorded by the teacher.' };
      list.push(card);
      UI.saveCustomCards(list);
      App.render();
    });

    if (clickWired) return;
    clickWired = true;

    root.addEventListener('change', function (e) {
      var t = e.target;
      if (t.dataset && t.dataset.fbdone !== undefined) {
        Feedback.toggleDone(+t.dataset.fbdone);
        Feedback.refreshBadge();
        t.closest('.fbrow').classList.toggle('done', t.checked);
      }
    });

    root.addEventListener('click', function (e) {
      var t = e.target;
      if (t.dataset && t.dataset.delsess !== undefined) {
        var list = sessions(); list.splice(+t.dataset.delsess, 1); saveSessions(list); App.render(); return;
      }
      if (t.dataset && t.dataset.delcard !== undefined) {
        var cl = UI.customCards(); cl.splice(+t.dataset.delcard, 1); UI.saveCustomCards(cl); App.render(); return;
      }
      if (t.dataset && t.dataset.fbdel !== undefined) {
        Feedback.remove(+t.dataset.fbdel); Feedback.refreshBadge(); App.render(); return;
      }
      if (t.id === 'copyfb') {
        var fb = root.querySelector('#fbexport');
        fb.removeAttribute('readonly'); fb.select(); fb.setSelectionRange(0, 999999);
        try { document.execCommand('copy'); t.textContent = 'Copied ✓'; } catch (err) { t.textContent = 'Select and copy'; }
        fb.setAttribute('readonly', '');
        return;
      }
      if (t.id === 'copyexport') {
        var box = root.querySelector('#exportbox');
        box.removeAttribute('readonly'); box.select(); box.setSelectionRange(0, 999999);
        try { document.execCommand('copy'); t.textContent = 'Copied ✓'; } catch (err) { t.textContent = 'Select and copy'; }
        box.setAttribute('readonly', '');
        return;
      }
      if (t.id === 'showimport') { root.querySelector('#importwrap').hidden = false; return; }
      if (t.id === 'doimport') {
        var raw = root.querySelector('#importbox').value.trim();
        if (!raw) return;
        try {
          var obj = JSON.parse(raw);
          if (!obj || typeof obj !== 'object') throw new Error('not an object');
          if (!confirm('Replace all progress on this device with the pasted backup?')) return;
          Store.replaceAll(obj);
          App.render();
        } catch (err) { alert('That is not a valid backup: ' + err.message); }
      }
    });
  }

  window.Views.teacher = teacherView;
  window.Views.feedback = feedbackView;
  window.Views.wireTeacher = wire;
})();
