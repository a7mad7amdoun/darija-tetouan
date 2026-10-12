/* ---------------------------------------------------------------------------
   THE MAP: a drawn plan of Tetouan from the OpenStreetMap coordinates in
   data/map.js, as one SVG. No tiles, no library, nothing fetched. Every
   marker is a button; choosing one shows the place, what it is, what to say
   there, and the OSM object it was placed from. Reading the map writes
   nothing.
   --------------------------------------------------------------------------- */
(function () {
  var E = function (s) { return UI.esc(s); };
  var M = function () { return (window.DARIJA && DARIJA.map) || null; };
  var W = 1000, H = 760;

  /* a flat projection around the centre: metres east and north */
  /* world space: metres east and north of Place Hassan II */
  function world(lon, lat) {
    var m = M(), c = m.centre, k = Math.cos(c[1] * Math.PI / 180);
    return { x: (lon - c[0]) * 111320 * k, y: -(lat - c[1]) * 110574 };
  }
  /* the view: metres across the frame, and where its centre is */
  var CITY = { span: 2500, cx: 0, cy: 240 };             /* the medina and the Ensanche */
  var NORTH = { span: 290000, cx: 40000, cy: 30000 };    /* Tangier to Al Hoceima, Ceuta to Ouezzane */
  var vp = { span: CITY.span, cx: CITY.cx, cy: CITY.cy };
  function proj(lon, lat) {
    var w = world(lon, lat), s = W / vp.span;
    return { x: W / 2 + (w.x - vp.cx) * s, y: H / 2 + (w.y - vp.cy) * s };
  }
  function level() { return vp.span > 25000 ? 'north' : 'city'; }
  function zoomTo(which) { var v = which === 'north' ? NORTH : CITY; vp.span = v.span; vp.cx = v.cx; vp.cy = v.cy; }
  function zoom(factor) {
    vp.span = Math.max(900, Math.min(300000, vp.span * factor));
  }
  function pan(dxPx, dyPx) {
    var s = W / vp.span; vp.cx -= dxPx / s; vp.cy -= dyPx / s;
  }
  function km(a, b) {
    var R = 6371, dLat = (b.lat - a[1]) * Math.PI / 180, dLon = (b.lon - a[0]) * Math.PI / 180;
    var la1 = a[1] * Math.PI / 180, la2 = b.lat * Math.PI / 180;
    var h = Math.sin(dLat / 2) * Math.sin(dLat / 2) + Math.cos(la1) * Math.cos(la2) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
    return 2 * R * Math.asin(Math.sqrt(h));
  }
  function bearing(a, b) {
    var la1 = a[1] * Math.PI / 180, la2 = b.lat * Math.PI / 180, dLon = (b.lon - a[0]) * Math.PI / 180;
    var y = Math.sin(dLon) * Math.cos(la2), x = Math.cos(la1) * Math.sin(la2) - Math.sin(la1) * Math.cos(la2) * Math.cos(dLon);
    return (Math.atan2(y, x) * 180 / Math.PI + 360) % 360;
  }
  var KIND = { gate: 'i-gate', square: 'i-fields', museum: 'i-shelf', transport: 'i-scene', mountain: 'i-today' };
  var KINDLABEL = { gate: 'Gate', square: 'Square', museum: 'Museum', transport: 'Bus station', mountain: 'Mountain' };

  var state = { sel: null };

  function svg(sel) {
    var m = M(); if (!m) return '';
    var lv = level(), s = W / vp.span;
    var h = '<svg class="tmap ' + lv + '" viewBox="0 0 ' + W + ' ' + H + '" role="img" aria-label="' +
      (lv === 'city' ? 'A plan of Tetouan: the walled medina with its gates, the squares, the Ensanche, the bus station and Jbel Dersa'
                     : 'The north of Morocco around Tetouan: the towns that share its speech, from Tangier to Al Hoceima, with the coast') + '">';
    h += '<defs><pattern id="tmhatch" width="14" height="14" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><line x1="0" y1="0" x2="0" y2="14" stroke="currentColor" stroke-width="1" opacity=".12"/></pattern>' +
         '<radialGradient id="tmhill" cx="50%" cy="100%" r="80%"><stop offset="0" stop-color="currentColor" stop-opacity=".16"/><stop offset="1" stop-color="currentColor" stop-opacity="0"/></radialGradient>' +
         '<linearGradient id="tmsea" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="currentColor" stop-opacity=".18"/><stop offset="1" stop-color="currentColor" stop-opacity=".06"/></linearGradient></defs>';
    h += '<rect class="tmpan" x="0" y="0" width="' + W + '" height="' + H + '" fill="transparent"/>';

    if (lv === 'north') {
      /* the sea: the Strait along the top, the Mediterranean down the east, from real points */
      /* the land, as one polygon: up the Atlantic shore, across the Strait, down the Mediterranean shore */
      var land = [[-6.5,34.6],[-6.2,34.9],[-6.14,35.18],[-6.10,35.45],[-5.93,35.46],[-5.92,35.60],[-5.81,35.79],[-5.60,35.83],[-5.45,35.90],[-5.36,35.92],[-5.30,35.84],[-5.33,35.70],[-5.29,35.62],[-5.26,35.55],[-5.10,35.44],[-4.95,35.38],[-4.75,35.30],[-4.40,35.19],[-4.10,35.22],[-3.90,35.27],[-3.70,35.24],[-3.50,35.20],[-3.5,34.5],[-6.5,34.5]];
      var ls = land.map(function (c) { return proj(c[0], c[1]); });
      h += '<rect class="tmwater" x="-80" y="-80" width="' + (W + 160) + '" height="' + (H + 160) + '" fill="url(#tmsea)"/>';
      h += '<path class="tmland" d="M' + ls.map(function (q) { return q.x.toFixed(0) + ' ' + q.y.toFixed(0); }).join(' L ') + ' Z"/>';
      var med = proj(-4.6, 35.62), atl = proj(-6.38, 35.25);
      h += '<text class="tmarea" x="' + med.x + '" y="' + med.y + '" text-anchor="middle">MEDITERRANEAN</text>' +
           '<text class="tmarea" x="' + atl.x + '" y="' + atl.y + '" text-anchor="middle">ATLANTIC</text>';
      /* the Rif: a soft band through the middle */
      var r1 = proj(-5.5, 34.95), r2 = proj(-4.0, 34.95);
      h += '<path class="tmhill" d="M' + (r1.x - 60) + ' ' + (r1.y + 120) + ' Q ' + ((r1.x + r2.x) / 2) + ' ' + (r1.y - 160) + ' ' + (r2.x + 60) + ' ' + (r2.y + 100) + ' Z" fill="url(#tmhill)" opacity=".7"/>';
      h += '<text class="tmarea big" x="' + ((r1.x + r2.x) / 2) + '" y="' + (r1.y - 20) + '" text-anchor="middle">THE RIF · THE JEBALA</text>';
      /* the towns */
      m.region.forEach(function (t) {
        var q = proj(t.lon, t.lat), on = sel === t.id, big = t.id === 'tetouan' || t.id === 'tanger';
        var lx = t.label === 'left' ? -16 : t.label === 'right' ? 16 : 0;
        var ly = t.label === 'left' || t.label === 'right' ? 5 : t.label === 'up' ? -16 : (big ? 32 : 26);
        var la = t.label === 'left' ? 'end' : t.label === 'right' ? 'start' : 'middle';
        h += '<g class="tmtown ' + E(t.speech) + (on ? ' on' : '') + '" transform="translate(' + q.x.toFixed(1) + ' ' + q.y.toFixed(1) + ')">' +
          '<circle r="' + (on ? 14 : big ? 11 : 7) + '" class="tmdot"/>' +
          '<text class="tmlabel' + (big ? ' big' : '') + '" x="' + lx + '" y="' + ly + '" text-anchor="' + la + '">' + E(t.name) + '</text>' +
          '<foreignObject x="-22" y="-22" width="44" height="44"><button xmlns="http://www.w3.org/1999/xhtml" type="button" class="tmhit" data-town="' + E(t.id) + '" aria-pressed="' + on + '" aria-label="' + E(t.name) + '"></button></foreignObject></g>';
      });
      /* the key */
      h += '<g class="tmkey" transform="translate(28 ' + (H - 92) + ')">' +
        '<rect x="-12" y="-22" width="300" height="86" rx="12"/>' +
        '<circle cx="4" cy="0" r="7" class="k tetouan"/><text x="20" y="5">Tetouani speech</text>' +
        '<circle cx="4" cy="26" r="7" class="k north"/><text x="20" y="31">Northern: shared with Tetouan, not its own</text>' +
        '<circle cx="4" cy="52" r="7" class="k edge"/><text x="20" y="57">The edge of the north</text></g>';
    } else {
      var pts = m.medina.map(function (p) { return proj(p[0], p[1]); });
      var poly = pts.map(function (p) { return p.x.toFixed(1) + ',' + p.y.toFixed(1); }).join(' ');
      var c = proj(m.centre[0], m.centre[1]);
      var top = proj(-5.372, 35.582).y;
      h += '<path class="tmhill" d="M-40 ' + (top + 60) + ' C ' + (W * 0.15) + ' ' + (top - 90) + ' ' + (W * 0.4) + ' ' + (top - 150) + ' ' + (W * 0.62) + ' ' + (top - 60) + ' S ' + (W * 0.9) + ' ' + (top + 30) + ' ' + (W + 40) + ' ' + (top - 30) + ' L ' + (W + 40) + ' -40 L -40 -40 Z" fill="url(#tmhill)"/>';
      h += '<path class="tmridge" d="M-40 ' + (top + 60) + ' C ' + (W * 0.15) + ' ' + (top - 90) + ' ' + (W * 0.4) + ' ' + (top - 150) + ' ' + (W * 0.62) + ' ' + (top - 60) + ' S ' + (W * 0.9) + ' ' + (top + 30) + ' ' + (W + 40) + ' ' + (top - 30) + '" fill="none" stroke="currentColor" stroke-width="1.5" stroke-dasharray="3 7" opacity=".35"/>';
      var me = m.places.filter(function (p) { return p.id === 'mehdi'; })[0];
      if (me) { var mp = proj(me.lon, me.lat), es = 230 * (2500 / vp.span);
        h += '<rect class="tmensanche" x="' + (mp.x - es * 0.65) + '" y="' + (mp.y - es * 0.48) + '" width="' + es + '" height="' + es + '" rx="22" fill="url(#tmhatch)"/>' +
             '<text class="tmarea" x="' + (mp.x - es * 0.58) + '" y="' + (mp.y + es * 0.47) + '">THE ENSANCHE</text>'; }
      h += '<polygon class="tmmedina" points="' + poly + '"/>';
      var mx = pts.reduce(function (s2, p) { return s2 + p.x; }, 0) / pts.length, my = pts.reduce(function (s2, p) { return s2 + p.y; }, 0) / pts.length;
      h += '<text class="tmarea big" x="' + mx + '" y="' + (my + 8) + '" text-anchor="middle">THE MEDINA</text>';
      m.beyond.forEach(function (b) {
        var br = bearing(m.centre, b) * Math.PI / 180, r = Math.min(W, H) * 0.47;
        var ex = c.x + Math.sin(br) * r * (W / H), ey = c.y - Math.cos(br) * r;
        ex = Math.max(70, Math.min(W - 70, ex)); ey = Math.max(60, Math.min(H - 44, ey));
        if (b.id === 'tanger') { ex = 90; ey = H * 0.5; }
        h += '<g class="tmroad"><line x1="' + c.x + '" y1="' + c.y + '" x2="' + ex + '" y2="' + ey + '" stroke="currentColor" stroke-width="1.4" stroke-dasharray="2 8" opacity=".35"/>' +
             '<foreignObject x="' + (ex - 60) + '" y="' + (ey - 24) + '" width="120" height="48"><button xmlns="http://www.w3.org/1999/xhtml" type="button" class="tmroadbtn" data-zoom="north" aria-label="' + E(b.name) + ', ' + Math.round(km(m.centre, b)) + ' km: see the north">' +
             '<b>' + E(b.name) + ' \u2192</b><small>' + Math.round(km(m.centre, b)) + ' km</small></button></foreignObject></g>';
      });
      m.places.forEach(function (p) {
        var q = proj(p.lon, p.lat), on = sel === p.id;
        if (p.kind === 'mountain') { q.x = 300; q.y = 60; }
        if (q.x < -40 || q.x > W + 40 || q.y < -40 || q.y > H + 40) return;
        h += '<g class="tmplace ' + E(p.kind) + (on ? ' on' : '') + (p.certainty === 'near' ? ' near' : '') + '" transform="translate(' + q.x.toFixed(1) + ' ' + q.y.toFixed(1) + ')">' +
          '<circle r="' + (on ? 22 : 17) + '" class="tmdot"/>' +
          '<svg class="tmico" x="-9" y="-9" width="18" height="18" viewBox="0 0 24 24"><use href="#' + KIND[p.kind] + '"/></svg>' +
          '<text class="tmlabel" x="' + (p.label === 'left' ? -26 : p.label === 'right' ? 26 : 0) + '" y="' + (p.label === 'left' || p.label === 'right' ? 5 : p.label === 'up' ? -26 : 34) + '" text-anchor="' + (p.label === 'left' ? 'end' : p.label === 'right' ? 'start' : 'middle') + '">' + E(p.name) + '</text>' +
          '<foreignObject x="-24" y="-24" width="48" height="48"><button xmlns="http://www.w3.org/1999/xhtml" type="button" class="tmhit" data-place="' + E(p.id) + '" aria-pressed="' + on + '" aria-label="' + E(p.name) + '"></button></foreignObject></g>';
      });
    }
    /* compass, scale, zoom */
    h += '<g class="tmcompass" transform="translate(' + (W - 60) + ' 62)"><circle r="22"/><path d="M0-16 6 6 0 2-6 6z" fill="currentColor"/><text y="-26" text-anchor="middle">N</text></g>';
    var scaleM = lv === 'city' ? (vp.span > 4000 ? 1000 : 500) : (vp.span > 120000 ? 50000 : 20000);
    var sk = s * scaleM;
    h += '<g class="tmscale" transform="translate(40 ' + (H - 30) + ')"><line x1="0" y1="0" x2="' + sk + '" y2="0" stroke="currentColor" stroke-width="2"/><line x1="0" y1="-5" x2="0" y2="5" stroke="currentColor" stroke-width="2"/><line x1="' + sk + '" y1="-5" x2="' + sk + '" y2="5" stroke="currentColor" stroke-width="2"/><text x="' + (sk / 2) + '" y="-9" text-anchor="middle">' + (scaleM >= 1000 ? (scaleM / 1000) + ' km' : scaleM + ' m') + '</text></g>';
    return h + '</svg>';
  }

  function placeCard(p) {
    var m = M();
    var ge = window.Gallery && p.photo ? Gallery.entry(p.photo) : null;
    var ph = ge ? '<button type="button" class="notephoto" data-photo="' + E(p.photo) + '" aria-label="Open the photograph"><img src="' + E(ge.md) + '" alt="' + E(ge.alt) + '" loading="lazy"></button>' : '';
    var sit = (window.DARIJA.situations || []).filter(function (s) { return s.id === p.situation; })[0];
    var note = p.note && window.Notes ? Notes.all().filter(function (n) { return n.id === p.note; })[0] : null;
    return '<section class="tmcard" aria-live="polite">' + ph + '<div class="tmbody">' +
      '<span class="crumb">' + E(KINDLABEL[p.kind] || p.kind) + (p.certainty === 'near' ? ' · position approximate' : '') + '</span>' +
      '<h2>' + E(p.name) + (p.ar ? ' <span class="ar sec" lang="ar" dir="rtl">' + E(p.ar) + '</span>' : '') + '</h2>' +
      '<p>' + E(p.what) + '</p>' +
      (p.say ? '<p class="tmsay"><b>What to say here.</b> ' + E(p.say) + (sit ? ' <a href="#/situations/' + E(sit.id) + '">' + E(sit.title) + ' →</a>' : '') + '</p>' : '') +
      (note ? '<p class="tmsay"><a href="#/catalog/' + E(note.field) + '">' + E(note.title) + ' →</a></p>' : '') +
      '<p class="notesrc">Placed from <a href="' + E(p.osm) + '" target="_blank" rel="noopener">OpenStreetMap</a>' +
      (p.certainty === 'near' ? ', from the nearest object named after it' : '') + '. Map data © OpenStreetMap contributors.</p>' +
      '</div></section>';
  }

  var SPEECH = { tetouan: 'Tetouani speech', north: 'Northern speech: shared with Tetouan, not the city\u2019s own', edge: 'The edge of the north' };
  function townCard(t) {
    var m = M();
    return '<section class="tmcard" aria-live="polite"><div class="tmbody">' +
      '<span class="crumb ' + E(t.speech) + '">' + E(SPEECH[t.speech]) + '</span>' +
      '<h2>' + E(t.name) + (t.ar ? ' <span class="ar sec" lang="ar" dir="rtl">' + E(t.ar) + '</span>' : '') + '</h2>' +
      '<p>' + E(t.what) + '</p>' +
      (t.id !== 'tetouan' ? '<p class="tmsay">' + Math.round(km(m.centre, t)) + ' km ' + compass(bearing(m.centre, t)) + ' of Tetouan.</p>' : '') +
      '<p class="tmsay"><a href="#/dialect">How Tetouani differs from the rest of the north \u2192</a></p>' +
      '<p class="notesrc">Placed from <a href="' + E(t.osm) + '" target="_blank" rel="noopener">OpenStreetMap</a>. Map data \u00a9 OpenStreetMap contributors. ' +
      'The speech labels are the course\u2019s own scope labels (tetouan / north) applied to places; see the Tetouani guide for the sources.</p>' +
      '</div></section>';
  }

  function controls() {
    var lv = level();
    return '<div class="tmctl">' +
      '<div class="tmlevels" role="group" aria-label="What to show">' +
        '<button type="button" data-zoom="city" aria-pressed="' + (lv === 'city') + '">The city</button>' +
        '<button type="button" data-zoom="north" aria-pressed="' + (lv === 'north') + '">The north</button></div>' +
      '<div class="tmzoom" role="group" aria-label="Zoom and move">' +
        '<button type="button" class="iconbtn" data-zoom="in" aria-label="Zoom in">+</button>' +
        '<button type="button" class="iconbtn" data-zoom="out" aria-label="Zoom out">\u2212</button>' +
        '<button type="button" class="iconbtn tmarrow" data-pan="l" aria-label="Move west">\u2190</button>' +
        '<button type="button" class="iconbtn tmarrow" data-pan="r" aria-label="Move east">\u2192</button>' +
        '<button type="button" class="iconbtn tmarrow" data-pan="u" aria-label="Move north">\u2191</button>' +
        '<button type="button" class="iconbtn tmarrow" data-pan="d" aria-label="Move south">\u2193</button></div></div>' +
      '<p class="tmhint">Drag the map with a mouse, or use the arrows. Zoom with the buttons, or Ctrl + wheel.</p>';
  }

  function view(sel) {
    var m = M(); if (!m) return '<p class="empty">No map data.</p>';
    if (sel && m.places.some(function (p) { return p.id === sel; })) state.sel = sel;
    var lv = level();
    var cur = lv === 'city'
      ? (m.places.filter(function (p) { return p.id === state.sel; })[0] || m.places[0])
      : (m.region.filter(function (t) { return t.id === state.town; })[0] || m.region[0]);
    var h = '<h1>Tetouan and the north</h1><p class="sub">' + (lv === 'city'
      ? 'The city, drawn from OpenStreetMap: the medina and its gates, the squares, the Ensanche, the Kasbah, the bus station. Tap a place to read about it and see what to say there; zoom out for the whole north.'
      : 'The north of Morocco: the towns that share Tetouan\u2019s speech and the ones at its edge, from Tangier to Al Hoceima. Tap a town; zoom in for the city.') + '</p>';
    h += controls();
    h += '<div class="tmwrap" id="tmwrap">' + svg(cur.id) + '</div>';
    h += lv === 'city' ? placeCard(cur) : townCard(cur);
    h += '<div class="tmlist" role="list">' + (lv === 'city' ? m.places.map(function (p) {
      return '<button type="button" role="listitem" class="tmchip' + (p.id === cur.id ? ' on' : '') + '" data-place="' + E(p.id) + '" aria-pressed="' + (p.id === cur.id) + '">' +
        '<svg class="ico" aria-hidden="true"><use href="#' + KIND[p.kind] + '"/></svg>' + E(p.name) + '</button>';
    }).join('') : m.region.map(function (t) {
      return '<button type="button" role="listitem" class="tmchip ' + E(t.speech) + (t.id === cur.id ? ' on' : '') + '" data-town="' + E(t.id) + '" aria-pressed="' + (t.id === cur.id) + '">' + E(t.name) + '</button>';
    }).join('')) + '</div>';
    h += '<p class="muted" style="font-size:13.5px">' + m.unplaced.map(function (u) { return '<b>' + E(u.name) + '.</b> ' + E(u.what); }).join(' ') +
      ' Medina outline: <a href="' + E(m.medinaSource) + '" target="_blank" rel="noopener">OpenStreetMap way 592208262</a>. ' +
      'Map data © <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">OpenStreetMap contributors</a>, ODbL.</p>';
    if (window.Notes) {
      h += '<h2>The city, in eight notes</h2>' + Notes.all().map(function (n) { return Notes.card(n, { compact: true }); }).join('');
    }
    return h;
  }
  function compass(b) { return ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'][Math.round(b / 45) % 8]; }

  function selectTown(id) { state.town = id; }
  function act(what) {
    if (what === 'l') pan(W * 0.25, 0); else if (what === 'r') pan(-W * 0.25, 0);
    else if (what === 'u') pan(0, H * 0.25); else if (what === 'd') pan(0, -H * 0.25);
    if (what === 'city' || what === 'north') zoomTo(what);
    else if (what === 'in') zoom(1 / 1.6);
    else if (what === 'out') zoom(1.6);
  }

  /* drag to pan, wheel to zoom, pinch on a phone: wired once, on the document */
  var drag = null;
  document.addEventListener('pointerdown', function (e) {
    var w = e.target.closest && e.target.closest('#tmwrap'); if (!w || e.target.closest('button')) return;
    if (e.pointerType === 'touch') return;          /* a finger scrolls the page; pan with the arrows */
    drag = { x: e.clientX, y: e.clientY, moved: false, w: w }; w.setPointerCapture && w.setPointerCapture(e.pointerId);
  });
  document.addEventListener('pointermove', function (e) {
    if (!drag) return;
    var dx = e.clientX - drag.x, dy = e.clientY - drag.y;
    if (Math.abs(dx) + Math.abs(dy) < 3 && !drag.moved) return;
    drag.moved = true;
    var k = W / drag.w.getBoundingClientRect().width;
    pan(dx * k, dy * k); drag.x = e.clientX; drag.y = e.clientY;
    var s = drag.w.querySelector('svg'); if (s) drag.w.innerHTML = svg(level() === 'city' ? state.sel : state.town);
  });
  document.addEventListener('pointerup', function () { if (drag && drag.moved && window.App) App.render(); drag = null; });
  /* the wheel scrolls the page, as everywhere else. Zoom with the buttons, or
     hold Ctrl (or Cmd) and wheel - the convention every map site uses, so a
     reader can scroll past the map without it swallowing the gesture. A pinch
     on a trackpad arrives as a ctrl+wheel too. */
  document.addEventListener('wheel', function (e) {
    var w = e.target.closest && e.target.closest('#tmwrap'); if (!w) return;
    if (!(e.ctrlKey || e.metaKey)) return;
    e.preventDefault(); zoom(e.deltaY > 0 ? 1.25 : 0.8); if (window.App) App.render();
  }, { passive: false });

  window.TMap = { view: view, select: function (id) { state.sel = id; }, selectTown: selectTown, act: act, zoomTo: zoomTo, level: level,
                  proj: proj, world: world, km: km, bearing: bearing, state: function () { return state; }, viewState: function () { return vp; } };
})();
