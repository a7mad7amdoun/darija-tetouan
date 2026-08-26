/* ---------------------------------------------------------------------------
   FEEDBACK — a note button on every page, collected into one teacher inbox.

   Each note records WHERE it was written (route + page title), so a month of
   scattered observations turns into an ordered list of fixes per page.
   Everything is local; the Export button produces markdown to hand over.
   --------------------------------------------------------------------------- */
(function () {
  var KINDS = [
    { id: 'wrong',   label: 'This is wrong',    icon: '❌' },
    { id: 'missing', label: 'Something missing', icon: '➕' },
    { id: 'unclear', label: 'Unclear / confusing', icon: '❓' },
    { id: 'idea',    label: 'Idea',             icon: '💡' },
    { id: 'hamza',   label: 'Hamza struggled here', icon: '🎯' }
  ];

  function all() {
    var raw = Store.get('feedback', null);
    if (!raw) return [];
    try { return typeof raw === 'string' ? JSON.parse(raw) : raw; } catch (e) { return []; }
  }
  function save(list) { Store.set('feedback', list); }

  function add(note) {
    var list = all();
    note.id = (Store.get('fbSeq', 0) || 0) + 1;
    Store.set('fbSeq', note.id);
    note.done = false;
    list.push(note);
    save(list);
    return note;
  }
  function toggleDone(id) {
    var list = all();
    list.forEach(function (n) { if (n.id === id) n.done = !n.done; });
    save(list);
  }
  function remove(id) { save(all().filter(function (n) { return n.id !== id; })); }

  function openCount() { return all().filter(function (n) { return !n.done; }).length; }

  function forRoute(route) {
    return all().filter(function (n) { return n.route === route; });
  }

  /* group by page for the inbox */
  function grouped() {
    var g = {}, order = [];
    all().slice().reverse().forEach(function (n) {
      if (!g[n.route]) { g[n.route] = { route: n.route, page: n.page, notes: [] }; order.push(n.route); }
      g[n.route].notes.push(n);
    });
    return order.map(function (r) { return g[r]; });
  }

  function exportMarkdown() {
    var out = ['# Darija site — teacher feedback', ''];
    var groups = grouped();
    if (!groups.length) return '# Darija site — teacher feedback\n\n_No notes yet._\n';
    groups.forEach(function (g) {
      out.push('## ' + g.page + '  `' + g.route + '`', '');
      g.notes.forEach(function (n) {
        var k = KINDS.filter(function (x) { return x.id === n.kind; })[0];
        out.push('- [' + (n.done ? 'x' : ' ') + '] **' + (k ? k.label : n.kind) + '** — ' +
                 String(n.text).replace(/\n/g, ' ') + '  _(' + n.date + ')_');
      });
      out.push('');
    });
    return out.join('\n');
  }

  /* ---------- the floating button + sheet ---------- */
  function currentPage() {
    var h1 = document.querySelector('#app h1');
    /* take only the heading's own text — an h1 may carry a live count badge
       ("Feedback inbox [2 open]") and the stored page name must not drift */
    var name = 'Home';
    if (h1) {
      name = '';
      Array.prototype.forEach.call(h1.childNodes, function (n) {
        if (n.nodeType === 3) name += n.textContent;
      });
      name = (name.trim() || h1.textContent.trim()).slice(0, 60);
    }
    return { route: location.hash || '#/', page: name };
  }

  function mount() {
    var btn = document.createElement('button');
    btn.className = 'fbbtn';
    btn.id = 'fbbtn';
    btn.type = 'button';
    btn.innerHTML = '<span class="fbicon">✍️</span><span class="fblabel">Note</span>';
    document.body.appendChild(btn);

    var sheet = document.createElement('div');
    sheet.className = 'fbsheet';
    sheet.id = 'fbsheet';
    sheet.hidden = true;
    document.body.appendChild(sheet);

    btn.addEventListener('click', function () { openSheet(sheet); });

    sheet.addEventListener('click', function (e) {
      if (e.target === sheet || e.target.id === 'fbcancel') { close(sheet); return; }
      var k = e.target.closest('.fbkinds button');
      if (k) {
        Array.prototype.forEach.call(k.parentNode.children, function (b) {
          b.setAttribute('aria-pressed', String(b === k));
        });
        return;
      }
    });

    sheet.addEventListener('submit', function (e) {
      e.preventDefault();
      var form = e.target;
      var kindBtn = sheet.querySelector('.fbkinds button[aria-pressed="true"]');
      var txt = form.querySelector('#fbtext').value.trim();
      if (!txt) return;
      var pg = JSON.parse(sheet.dataset.page);
      add({
        kind: kindBtn ? kindBtn.dataset.k : 'idea',
        text: txt, route: pg.route, page: pg.page,
        date: new Date().toISOString().slice(0, 10)
      });
      close(sheet);
      refreshBadge();
      if (location.hash.indexOf('#/feedback') === 0 || location.hash.indexOf('#/teacher') === 0) App.render();
    });
  }

  function openSheet(sheet) {
    var pg = currentPage();
    sheet.dataset.page = JSON.stringify(pg);
    var existing = forRoute(pg.route);
    sheet.innerHTML =
      '<form class="fbcard"><div class="fbhead"><strong>Note on this page</strong>' +
      '<button type="button" id="fbcancel" class="linkbtn">close</button></div>' +
      '<p class="muted" style="margin:0 0 12px;font-size:12.5px">' + UI.esc(pg.page) +
      ' <code>' + UI.esc(pg.route) + '</code></p>' +
      '<div class="fbkinds">' + KINDS.map(function (k, i) {
        return '<button type="button" data-k="' + k.id + '" aria-pressed="' + (i === 0) + '">' +
               k.icon + ' ' + k.label + '</button>';
      }).join('') + '</div>' +
      '<textarea class="notes" id="fbtext" placeholder="What needs fixing here? Be as blunt as you like — this is a to-do list, not a review."></textarea>' +
      '<button class="btn primary wide" type="submit" style="margin-top:10px">Save note</button>' +
      (existing.length ? '<div class="fbprev"><div class="crumb">' + existing.length +
        ' note' + (existing.length > 1 ? 's' : '') + ' already on this page</div>' +
        existing.slice(-3).map(function (n) {
          return '<p class="fbprevrow">' + (n.done ? '✓ ' : '• ') + UI.esc(n.text.slice(0, 90)) + '</p>';
        }).join('') + '</div>' : '') +
      '</form>';
    sheet.hidden = false;
    var ta = sheet.querySelector('#fbtext');
    if (ta) ta.focus();
  }
  function close(sheet) { sheet.hidden = true; }

  function refreshBadge() {
    var btn = document.getElementById('fbbtn');
    if (!btn) return;
    var n = openCount();
    btn.classList.toggle('has', n > 0);
    var lbl = btn.querySelector('.fblabel');
    if (lbl) lbl.textContent = n > 0 ? 'Note · ' + n : 'Note';
  }

  window.Feedback = {
    KINDS: KINDS, all: all, add: add, toggleDone: toggleDone, remove: remove,
    grouped: grouped, exportMarkdown: exportMarkdown, openCount: openCount,
    forRoute: forRoute, mount: mount, refreshBadge: refreshBadge
  };
})();
