/* ---------------------------------------------------------------------------
   THE GALLERY and the photo viewer.

   Every photograph of Tetouan the site holds, at its real size: the viewer
   shows the largest version there is (up to 3840px on the long edge, cut
   from the master, never enlarged) and says what size that is. Each one
   carries its caption, where it was taken as far as the collection records
   it, and its credit, from data/photos.js and the generated data/gallery.js.

   The viewer is a native <dialog>: Escape closes it, focus stays inside while
   it is open and returns to the control that opened it. Arrow keys move
   between photographs. Opening a photograph records nothing.
   --------------------------------------------------------------------------- */
(function () {
  var D = function () { return window.DARIJA || {}; };
  var E = function (s) { return UI.esc(s); };

  /* the gallery's order: the city first, then its surroundings */
  function entries() {
    var ph = D().photos || {}, g = D().gallery || {};
    var keys = Object.keys(ph).filter(function (k) { return g[k]; });
    if (g['tetouan-feddan-square']) keys.push('tetouan-feddan-square');
    var near = function (k) { return /not confirmed/.test((g[k] || {}).place || ''); };
    keys.sort(function (a, b) { return (near(a) - near(b)); });
    return keys.map(function (k) { return entry(k); }).filter(Boolean);
  }
  function entry(key) {
    var g = (D().gallery || {})[key];
    if (!g) return null;
    var ph = (D().photos || {})[key] || (key === 'tetouan-feddan-square' ? {
      file: 'tetouan-feddan-square-1600.jpg', focal: '50% 62%', caption: 'Feddan Square',
      alt: 'Feddan Square in Tetouan, with the white medina rising behind it' } : null);
    if (!ph) return null;
    var base = 'assets/photos/' + ph.file.replace(/\.jpg$/, '').replace(/-1600$/, '');
    var isCommons = key === 'tetouan-feddan-square';
    return { key: key, caption: ph.caption, alt: ph.alt, focal: ph.focal || '50% 50%',
             md: isCommons ? 'assets/photos/tetouan-feddan-square-800.jpg' : base + '-md.jpg',
             sm: isCommons ? 'assets/photos/tetouan-feddan-square-1600.jpg' : base + '-sm.jpg',
             xl: g.xl, w: g.w, h: g.h, master: g.master, place: g.place, credit: g.credit };
  }

  function sizeNote(e) {
    var long = Math.max(e.w, e.h);
    var tag = long >= 3800 ? '4K-class' : long >= 1900 ? 'above full HD' : '';
    return e.w + ' × ' + e.h + ' px' + (tag ? ' · ' + tag : '') +
      (e.master[0] !== e.w || e.master[1] !== e.h ? ' · from a ' + e.master[0] + ' × ' + e.master[1] + ' original' : ' · the original size');
  }

  /* ---------- the page ---------- */
  function view() {
    var list = entries();
    var h = '<h1>Gallery</h1><p class="sub">' + list.length + ' photographs of Tetouan and around it, each at its real size. ' +
      'Open one to see it large, with where it was taken and whose it is.</p>';
    h += '<div class="gallery">' + list.map(function (e, i) {
      return '<figure class="gph' + (e.h > e.w ? ' tall' : '') + '">' +
        '<button type="button" class="gphbtn" data-photo="' + E(e.key) + '" aria-label="Open: ' + E(e.caption) + '">' +
        '<img src="' + E(e.md) + '" srcset="' + E(e.md) + ' 800w, ' + E(e.sm) + ' 1200w" sizes="(min-width:900px) 30vw, 46vw" ' +
        'alt="' + E(e.alt) + '" loading="' + (i < 6 ? 'eager' : 'lazy') + '" decoding="async" style="object-position:' + E(e.focal) + '"></button>' +
        '<figcaption><b>' + E(e.caption) + '</b><span>' + E(e.place) + '</span></figcaption></figure>';
    }).join('') + '</div>';
    h += '<p class="muted" style="margin-top:18px;font-size:13.5px">Photographs from Ahmed’s own collection, and one public-domain ' +
      'photograph of Feddan Square (RACHID BAYA, CC0). Colour-graded to the site’s palette; nothing added or removed. ' +
      'Credits: <code>assets/photos/CREDITS.md</code>.</p>';
    return h;
  }

  /* ---------- the viewer ---------- */
  var dlg = null, current = null, trigger = null;

  function ensure() {
    if (dlg) return dlg;
    dlg = document.createElement('dialog');
    dlg.className = 'lightbox';
    dlg.setAttribute('aria-label', 'Photograph');
    dlg.innerHTML =
      '<div class="lbframe"><img class="lbimg" alt=""><p class="lbload" aria-live="polite"></p></div>' +
      '<div class="lbbar">' +
        '<div class="lbtext"><b class="lbcap"></b><span class="lbplace"></span><span class="lbmeta"></span></div>' +
        '<div class="lbctl">' +
          '<button type="button" class="iconbtn" data-lb="prev" aria-label="Previous photograph">‹</button>' +
          '<span class="lbcount" aria-live="polite"></span>' +
          '<button type="button" class="iconbtn" data-lb="next" aria-label="Next photograph">›</button>' +
          '<button type="button" class="btn lbclose" data-lb="close">Close</button>' +
        '</div></div>';
    document.body.appendChild(dlg);
    dlg.addEventListener('click', function (e) {
      var b = e.target.closest('[data-lb]');
      if (b) { if (b.dataset.lb === 'close') close(); else step(b.dataset.lb === 'next' ? 1 : -1); return; }
      if (e.target === dlg) close();            /* the backdrop */
    });
    dlg.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowRight') { step(1); e.preventDefault(); }
      else if (e.key === 'ArrowLeft') { step(-1); e.preventDefault(); }
    });
    dlg.addEventListener('close', function () {
      var img = dlg.querySelector('.lbimg'); img.removeAttribute('src'); img.removeAttribute('srcset');
      if (trigger && trigger.focus) trigger.focus();
      trigger = null; current = null;
    });
    return dlg;
  }

  function show(key) {
    var e = entry(key); if (!e) return false;
    current = key;
    var d = ensure(), img = d.querySelector('.lbimg'), load = d.querySelector('.lbload');
    img.alt = e.alt;
    img.style.objectPosition = e.focal;
    load.textContent = 'Loading the large image…';
    img.onload = function () { load.textContent = ''; };
    img.onerror = function () { load.textContent = 'The large image did not load. Check your connection and try again.'; };
    img.srcset = e.sm + ' 1200w, ' + e.xl + ' ' + e.w + 'w';
    img.sizes = '100vw';
    img.src = e.xl;
    d.querySelector('.lbcap').textContent = e.caption;
    d.querySelector('.lbplace').textContent = e.place;
    d.querySelector('.lbmeta').textContent = e.credit + ' · ' + sizeNote(e);
    var list = entries(), i = list.findIndex(function (x) { return x.key === key; });
    d.querySelector('.lbcount').textContent = (i + 1) + ' / ' + list.length;
    return true;
  }

  function open(key, fromEl) {
    if (!show(key)) return;
    trigger = fromEl || document.activeElement;
    if (!dlg.open) { if (dlg.showModal) dlg.showModal(); else dlg.setAttribute('open', ''); }
    var c = dlg.querySelector('.lbclose'); if (c) c.focus();
  }
  function close() { if (dlg && dlg.open) { if (dlg.close) dlg.close(); else dlg.removeAttribute('open'); } }
  function step(dir) {
    var list = entries(), i = list.findIndex(function (x) { return x.key === current; });
    if (i < 0) return;
    show(list[(i + dir + list.length) % list.length].key);
  }

  /* a small control beside a page banner: "About this photo" */
  function aboutButton(key) {
    return (D().gallery || {})[key]
      ? '<button type="button" class="phabout" data-photo="' + E(key) + '" aria-label="About this photograph">' +
        '<svg class="ico" aria-hidden="true"><use href="#i-cards"/></svg>About this photo</button>'
      : '';
  }

  window.Gallery = { entries: entries, entry: entry, view: view, open: open, close: close, step: step,
                     aboutButton: aboutButton, sizeNote: sizeNote, current: function () { return current; } };
})();
