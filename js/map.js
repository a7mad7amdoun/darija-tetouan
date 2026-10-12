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
  function proj(lon, lat) {
    var m = M(), c = m.centre, k = Math.cos(c[1] * Math.PI / 180);
    var x = (lon - c[0]) * 111320 * k, y = (lat - c[1]) * 110574;
    /* 1.55 km across the frame; the centre sits a little left and low, since
       the medina is east of Place Hassan II and the hill is north */
    var s = W / 2500;
    return { x: W * 0.5 + x * s, y: H * 0.34 - y * s };
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
    var pts = m.medina.map(function (p) { return proj(p[0], p[1]); });
    var poly = pts.map(function (p) { return p.x.toFixed(1) + ',' + p.y.toFixed(1); }).join(' ');
    var c = proj(m.centre[0], m.centre[1]);
    var h = '<svg class="tmap" viewBox="0 0 ' + W + ' ' + H + '" role="img" aria-label="A plan of Tetouan: the walled medina with its gates, the squares, the Ensanche to the west, the bus station to the south and Jbel Dersa to the north">';
    h += '<defs><pattern id="tmhatch" width="14" height="14" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><line x1="0" y1="0" x2="0" y2="14" stroke="currentColor" stroke-width="1" opacity=".12"/></pattern>' +
         '<radialGradient id="tmhill" cx="50%" cy="100%" r="80%"><stop offset="0" stop-color="currentColor" stop-opacity=".16"/><stop offset="1" stop-color="currentColor" stop-opacity="0"/></radialGradient></defs>';
    /* the hill: Dersa rises to the north-west */
    var d = m.places.filter(function (p) { return p.id === 'dersa'; })[0];
    var dp = d ? proj(d.lon, d.lat) : { x: 200, y: -200 };
    h += '<path class="tmhill" d="M-40 ' + (H * 0.34) + ' C ' + (W * 0.15) + ' ' + (H * 0.1) + ' ' + (W * 0.4) + ' ' + (H * 0.02) + ' ' + (W * 0.62) + ' ' + (H * 0.16) + ' S ' + (W * 0.9) + ' ' + (H * 0.3) + ' ' + (W + 40) + ' ' + (H * 0.2) + ' L ' + (W + 40) + ' -40 L -40 -40 Z" fill="url(#tmhill)"/>';
    h += '<path class="tmridge" d="M-40 ' + (H * 0.34) + ' C ' + (W * 0.15) + ' ' + (H * 0.1) + ' ' + (W * 0.4) + ' ' + (H * 0.02) + ' ' + (W * 0.62) + ' ' + (H * 0.16) + ' S ' + (W * 0.9) + ' ' + (H * 0.3) + ' ' + (W + 40) + ' ' + (H * 0.2) + '" fill="none" stroke="currentColor" stroke-width="1.5" stroke-dasharray="3 7" opacity=".35"/>';

    /* the Ensanche: a soft block west of Hassan II around Moulay el Mehdi */
    var me = m.places.filter(function (p) { return p.id === 'mehdi'; })[0];
    if (me) { var mp = proj(me.lon, me.lat);
      h += '<rect class="tmensanche" x="' + (mp.x - 150) + '" y="' + (mp.y - 110) + '" width="230" height="230" rx="22" fill="url(#tmhatch)"/>' +
           '<text class="tmarea" x="' + (mp.x - 135) + '" y="' + (mp.y + 108) + '">THE ENSANCHE</text>'; }
    /* the medina */
    h += '<polygon class="tmmedina" points="' + poly + '"/>';
    var mx = pts.reduce(function (s, p) { return s + p.x; }, 0) / pts.length, my = pts.reduce(function (s, p) { return s + p.y; }, 0) / pts.length;
    h += '<text class="tmarea big" x="' + mx + '" y="' + (my + 8) + '" text-anchor="middle">THE MEDINA</text>';
    /* roads out: arrows at the frame edge, with the distance */
    m.beyond.forEach(function (b) {
      var br = bearing(m.centre, b) * Math.PI / 180, r = Math.min(W, H) * 0.47;
      var ex = c.x + Math.sin(br) * r * (W / H), ey = c.y - Math.cos(br) * r;
      ex = Math.max(70, Math.min(W - 70, ex)); ey = Math.max(60, Math.min(H - 44, ey));
      if (b.id === 'tanger') { ex = 90; ey = H * 0.44; }
      h += '<g class="tmroad"><line x1="' + c.x + '" y1="' + c.y + '" x2="' + ex + '" y2="' + ey + '" stroke="currentColor" stroke-width="1.4" stroke-dasharray="2 8" opacity=".35"/>' +
           '<text x="' + ex + '" y="' + (ey - 10) + '" text-anchor="middle">' + E(b.name) + ' →</text>' +
           '<text class="tmkm" x="' + ex + '" y="' + (ey + 10) + '" text-anchor="middle">' + Math.round(km(m.centre, b)) + ' km</text></g>';
    });
    /* places */
    m.places.forEach(function (p, i) {
      var q = proj(p.lon, p.lat), on = sel === p.id;
      if (p.kind === 'mountain') { q.x = 300; q.y = 60; }
      h += '<g class="tmplace ' + E(p.kind) + (on ? ' on' : '') + (p.certainty === 'near' ? ' near' : '') + '" transform="translate(' + q.x.toFixed(1) + ' ' + q.y.toFixed(1) + ')">' +
        '<circle r="' + (on ? 22 : 17) + '" class="tmdot"/>' +
        '<svg class="tmico" x="-9" y="-9" width="18" height="18" viewBox="0 0 24 24"><use href="#' + KIND[p.kind] + '"/></svg>' +
        '<text class="tmlabel" x="' + (p.label === 'left' ? -26 : p.label === 'right' ? 26 : 0) + '" y="' + (p.label === 'left' || p.label === 'right' ? 5 : p.label === 'up' ? -26 : 34) + '" text-anchor="' + (p.label === 'left' ? 'end' : p.label === 'right' ? 'start' : 'middle') + '">' + E(p.name) + '</text>' +
        '<foreignObject x="-24" y="-24" width="48" height="48"><button xmlns="http://www.w3.org/1999/xhtml" type="button" class="tmhit" data-place="' + E(p.id) + '" aria-pressed="' + on + '" aria-label="' + E(p.name) + '"></button></foreignObject></g>';
    });
    /* compass and scale */
    h += '<g class="tmcompass" transform="translate(' + (W - 60) + ' 62)"><circle r="22"/><path d="M0-16 6 6 0 2-6 6z" fill="currentColor"/><text y="-26" text-anchor="middle">N</text></g>';
    var sk = (W / 1550) * 500;
    h += '<g class="tmscale" transform="translate(40 ' + (H - 30) + ')"><line x1="0" y1="0" x2="' + sk + '" y2="0" stroke="currentColor" stroke-width="2"/><line x1="0" y1="-5" x2="0" y2="5" stroke="currentColor" stroke-width="2"/><line x1="' + sk + '" y1="-5" x2="' + sk + '" y2="5" stroke="currentColor" stroke-width="2"/><text x="' + (sk / 2) + '" y="-9" text-anchor="middle">500 m</text></g>';
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

  function view(sel) {
    var m = M(); if (!m) return '<p class="empty">No map data.</p>';
    if (sel && m.places.some(function (p) { return p.id === sel; })) state.sel = sel;
    var cur = m.places.filter(function (p) { return p.id === state.sel; })[0] || m.places[0];
    var h = '<h1>Tetouan</h1><p class="sub">The city, drawn from OpenStreetMap: the walled medina and its gates, the two squares, the Ensanche, ' +
      'the bus station and the mountain. Tap a place to read about it and see what to say there.</p>';
    h += '<div class="tmwrap">' + svg(cur.id) + '</div>';
    h += placeCard(cur);
    h += '<div class="tmlist" role="list">' + m.places.map(function (p) {
      return '<button type="button" role="listitem" class="tmchip' + (p.id === cur.id ? ' on' : '') + '" data-place="' + E(p.id) + '" aria-pressed="' + (p.id === cur.id) + '">' +
        '<svg class="ico" aria-hidden="true"><use href="#' + KIND[p.kind] + '"/></svg>' + E(p.name) + '</button>';
    }).join('') + '</div>';
    h += '<h2>Beyond the city</h2><div class="tiles">' + m.beyond.map(function (b) {
      return '<a class="tile" href="' + E(b.osm) + '" target="_blank" rel="noopener"><span class="ticon"><svg class="ico" aria-hidden="true"><use href="#i-today"/></svg></span>' +
        '<span class="ttitle">' + E(b.name) + (b.ar ? ' <span class="ar sec sm" lang="ar" dir="rtl">' + E(b.ar) + '</span>' : '') + '</span>' +
        '<span class="tsub">' + Math.round(km(m.centre, b)) + ' km, ' + compass(bearing(m.centre, b)) + ' · ' + E(b.what) + '</span></a>';
    }).join('') + '</div>';
    h += '<p class="muted" style="font-size:13.5px">' + m.unplaced.map(function (u) { return '<b>' + E(u.name) + '.</b> ' + E(u.what); }).join(' ') +
      ' Medina outline: <a href="' + E(m.medinaSource) + '" target="_blank" rel="noopener">OpenStreetMap way 592208262</a>. ' +
      'Map data © <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">OpenStreetMap contributors</a>, ODbL.</p>';
    if (window.Notes) {
      h += '<h2>The city, in eight notes</h2>' + Notes.all().map(function (n) { return Notes.card(n, { compact: true }); }).join('');
    }
    return h;
  }
  function compass(b) { return ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'][Math.round(b / 45) % 8]; }

  window.TMap = { view: view, select: function (id) { state.sel = id; }, proj: proj, km: km, bearing: bearing, state: function () { return state; } };
})();
