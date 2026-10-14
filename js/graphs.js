/* ---------------------------------------------------------------------------
   GRAPHS — two honest pictures of practice, read from the attempt log.

     practisedPerDay   the last 14 local days: how many DISTINCT words had at
                       least one graded attempt that day. Events are deduped
                       by their id, first-exposure ("learn") events are left
                       out, and a word tried five times in a day counts once.
                       Assisted and self-graded attempts count: this measures
                       recorded activity, not mastery. A blank day means no
                       dated activity was recorded, nothing more.

     firstTypedByWeek  the last 4 calendar weeks: of the card-days whose FIRST
                       recorded event that day was an unaided typed answer
                       (task "produce", assisted false, not self-graded), how
                       many were right. A card-day whose first event was a
                       look, a hint or another task is left out, so a word
                       seen minutes earlier cannot pass as cold recall. This
                       still cannot rule out an exposure that was never
                       recorded; it is not "verified cold recall".

   Pure functions over copies: the stored log is never reordered or changed,
   and rendering writes nothing (tests/hundred.js checks it). Native SVG,
   with a table under every chart so colour and hover carry nothing alone.
   --------------------------------------------------------------------------- */
(function () {
  var E = function (s) { return UI.esc(s); };

  function localDay(iso) {
    var t = Date.parse(iso); if (isNaN(t)) return null;
    var d = new Date(t);
    return d.getFullYear() + '-' + ('0' + (d.getMonth() + 1)).slice(-2) + '-' + ('0' + d.getDate()).slice(-2);
  }
  function addDays(day, n) { var d = new Date(day + 'T12:00:00'); d.setDate(d.getDate() + n); return localDay(d.toISOString()); }
  /* the Monday that starts the week a day belongs to */
  function weekOf(day) { var d = new Date(day + 'T12:00:00'); var k = (d.getDay() + 6) % 7; d.setDate(d.getDate() - k); return localDay(d.toISOString()); }

  /* every valid, deduplicated event, with its card and local day */
  function events(cards) {
    var seen = {}, out = [];
    cards.forEach(function (c) {
      Attempts.all(c.id).forEach(function (r) {
        if (!r || !r.id || seen[r.id]) return;
        var day = localDay(r.at); if (!day) return;
        seen[r.id] = 1;
        out.push({ id: r.id, card: c.id, day: day, t: Date.parse(r.at), task: r.task || 'recognise', ok: !!r.ok, assisted: !!r.assisted, self: !!r.self });
      });
    });
    return out;
  }

  function practisedPerDay(cards, days) {
    days = days || 14;
    var today = Sched.todayStr(), by = {};
    events(cards).forEach(function (e) {
      if (e.task === 'learn') return;
      (by[e.day] = by[e.day] || {})[e.card] = 1;
    });
    var rows = [];
    for (var i = days - 1; i >= 0; i--) { var d = addDays(today, -i); rows.push({ day: d, n: Object.keys(by[d] || {}).length }); }
    return rows;
  }

  function firstTypedByWeek(cards, weeks) {
    weeks = weeks || 4;
    var first = {};
    events(cards).forEach(function (e) {
      var k = e.card + '|' + e.day;
      if (!first[k] || e.t < first[k].t) first[k] = e;
    });
    var by = {};
    Object.keys(first).forEach(function (k) {
      var e = first[k];
      if (e.task !== 'produce' || e.assisted || e.self) return;
      var w = weekOf(e.day); by[w] = by[w] || { ok: 0, n: 0 };
      by[w].n++; if (e.ok) by[w].ok++;
    });
    var thisWeek = weekOf(Sched.todayStr()), rows = [];
    for (var i = weeks - 1; i >= 0; i--) { var w = addDays(thisWeek, -7 * i); rows.push({ week: w, ok: (by[w] || {}).ok || 0, n: (by[w] || {}).n || 0 }); }
    return rows;
  }

  /* ---------- drawing ---------- */
  function bars(rows, opts) {
    var W = 560, H = 150, pad = 26, bw = (W - pad * 2) / rows.length;
    var max = Math.max.apply(null, rows.map(function (r) { return r.n; }).concat([1]));
    var h = '<svg class="gchart" viewBox="0 0 ' + W + ' ' + H + '" role="img" aria-label="' + E(opts.aria) + '">';
    var best = -1, bi = -1;
    if (opts.callout) rows.forEach(function (r, i) { var v = opts.rank ? opts.rank(r) : r.n; if (v > best) { best = v; bi = i; } });
    rows.forEach(function (r, i) {
      var x = pad + i * bw, bh = r.n ? Math.max(3, (H - 44) * r.n / max) : 0, y = H - 26 - bh, isBest = i === bi && r.n;
      h += '<rect class="gbar' + (r.n ? '' : ' empty') + (r.today ? ' today' : '') + (isBest ? ' best' : '') + '" x="' + (x + bw * 0.18).toFixed(1) + '" y="' + y.toFixed(1) + '" width="' + (bw * 0.64).toFixed(1) + '" height="' + (bh || 2).toFixed(1) + '" rx="' + (bw > 60 ? 8 : 3) + '"/>';
      if (isBest) {
        var tip = String(opts.val ? opts.val(r) : r.n), tw = Math.round(tip.length * 6.4 + 18), tx = Math.min(W - tw - 4, Math.max(4, x + bw / 2 - tw / 2)), ty = Math.max(2, y - 30);
        h += '<g class="callout"><rect x="' + tx.toFixed(1) + '" y="' + ty.toFixed(1) + '" width="' + tw + '" height="22" rx="7"/>' +
             '<text x="' + (tx + tw / 2).toFixed(1) + '" y="' + (ty + 15).toFixed(1) + '" text-anchor="middle">' + E(tip) + '</text></g>';
      } else if (r.n) h += '<text class="gval" x="' + (x + bw / 2).toFixed(1) + '" y="' + (y - 5).toFixed(1) + '" text-anchor="middle">' + E(opts.val ? opts.val(r) : r.n) + '</text>';
      if (!opts.label || opts.label(r, i)) h += '<text class="glab" x="' + (x + bw / 2).toFixed(1) + '" y="' + (H - 9) + '" text-anchor="middle">' + E(opts.lab(r, i)) + '</text>';
    });
    return h + '</svg>';
  }
  function smooth(pts) {
    if (pts.length < 3) return 'M' + pts.map(function (p) { return p[0].toFixed(1) + ' ' + p[1].toFixed(1); }).join(' L');
    var d = 'M' + pts[0][0].toFixed(1) + ' ' + pts[0][1].toFixed(1);
    for (var i = 0; i < pts.length - 1; i++) {
      var p0 = pts[i - 1] || pts[i], p1 = pts[i], p2 = pts[i + 1], p3 = pts[i + 2] || p2;
      d += ' C' + (p1[0] + (p2[0] - p0[0]) / 6).toFixed(1) + ' ' + (p1[1] + (p2[1] - p0[1]) / 6).toFixed(1) + ' ' +
           (p2[0] - (p3[0] - p1[0]) / 6).toFixed(1) + ' ' + (p2[1] - (p3[1] - p1[1]) / 6).toFixed(1) + ' ' + p2[0].toFixed(1) + ' ' + p2[1].toFixed(1);
    }
    return d;
  }
  /* a line over the days, dashed gridlines, a dot on every day with a tooltip
     on hover or focus, and the busiest day's tooltip shown from the start */
  function line(rows, opts) {
    var W = 560, H = 184, padL = 30, padR = 14, padT = 30, padB = 26, n = rows.length;
    var max = Math.max.apply(null, rows.map(function (r) { return r.n; }).concat([1]));
    var x = function (i) { return padL + (n === 1 ? (W - padL - padR) / 2 : i * (W - padL - padR) / (n - 1)); };
    var y = function (v) { return padT + (H - padT - padB) * (1 - v / max); };
    var pts = rows.map(function (r, i) { return [x(i), y(r.n)]; });
    var d = smooth(pts);
    var h = '<svg class="gchart" data-kind="line" viewBox="0 0 ' + W + ' ' + H + '" role="img" aria-label="' + E(opts.aria) + '">';
    [0, 0.5, 1].forEach(function (k) {
      var yy = y(max * k).toFixed(1);
      h += '<line class="ggrid" x1="' + padL + '" x2="' + (W - padR) + '" y1="' + yy + '" y2="' + yy + '"/>' +
           '<text class="glab" x="' + (padL - 6) + '" y="' + (+yy + 3.5) + '" text-anchor="end">' + Math.round(max * k) + '</text>';
    });
    h += '<path class="garea" d="' + d + ' L' + pts[n - 1][0].toFixed(1) + ' ' + y(0).toFixed(1) + ' L' + pts[0][0].toFixed(1) + ' ' + y(0).toFixed(1) + ' Z"/>';
    h += '<path class="gline" d="' + d + '" pathLength="1"/>';
    var step = n > 16 ? Math.ceil(n / 8) : n > 8 ? 2 : 1, peak = -1, best = -1;
    rows.forEach(function (r, i) { if (r.n > best) { best = r.n; peak = i; } });
    rows.forEach(function (r, i) {
      if (i % step === 0 || i === n - 1) h += '<text class="glab" x="' + x(i).toFixed(1) + '" y="' + (H - 8) + '" text-anchor="middle">' + E(opts.lab(r, i)) + '</text>';
    });
    rows.forEach(function (r, i) {
      var tip = (opts.tip ? opts.tip(r) : r.n + ' on ' + opts.lab(r, i)), tw = Math.round(tip.length * 6.4 + 18);
      var tx = Math.min(W - padR - tw, Math.max(padL, pts[i][0] - tw / 2)), ty = Math.max(2, pts[i][1] - 34);
      h += '<g class="lpt' + (i === peak && r.n ? ' peak' : '') + '" tabindex="0" aria-label="' + E(tip) + '">' +
           '<circle cx="' + pts[i][0].toFixed(1) + '" cy="' + pts[i][1].toFixed(1) + '" r="4.2"/>' +
           '<g class="ltip"><rect x="' + tx.toFixed(1) + '" y="' + ty.toFixed(1) + '" width="' + tw + '" height="22" rx="7"/>' +
           '<text x="' + (tx + tw / 2).toFixed(1) + '" y="' + (ty + 15).toFixed(1) + '" text-anchor="middle">' + E(tip) + '</text></g></g>';
    });
    return h + '</svg>';
  }

  function dayLabel(d) { return new Date(d + 'T12:00:00').toLocaleDateString('en-GB', { weekday: 'short' }).slice(0, 2); }
  function dateLabel(d) { return new Date(d + 'T12:00:00').toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }); }

  function practisedView(cards, days) {
    days = days || (window.Dash ? Dash.range() : 14);
    var rows = practisedPerDay(cards, days), today = Sched.todayStr();
    rows.forEach(function (r) { r.today = r.day === today; });
    var total = rows.reduce(function (s, r) { return s + r.n; }, 0), active = rows.filter(function (r) { return r.n; }).length;
    var h = '<section class="graph"><div class="qhead"><span class="crumb">Words practised per day</span><span class="qcount">' + active + ' of ' + days + ' days</span></div>';
    if (!total) return h + '<p class="muted" style="margin:0">No dated attempts in the last ' + days + ' days. Older progress may be kept without dates.</p></section>';
    h += line(rows, { aria: 'Words practised on each of the last ' + days + ' days', lab: function (r) { return days > 14 ? dateLabel(r.day) : dayLabel(r.day); },
      tip: function (r) { return r.n + ' word' + (r.n === 1 ? '' : 's') + ' \u00b7 ' + dateLabel(r.day); } });
    h += '<details class="gtable"><summary>As a table</summary><table><thead><tr><th>Day</th><th>Words</th></tr></thead><tbody>' +
      rows.map(function (r) { return '<tr><td>' + E(dateLabel(r.day)) + '</td><td>' + r.n + '</td></tr>'; }).join('') + '</tbody></table></details>';
    h += '<p class="dpnote">Distinct words with at least one graded attempt that day, first exposures left out, a word tried five times counting once. ' +
      'Assisted and self-graded attempts are in: this is recorded activity, not mastery. A blank day is a day with nothing dated.</p></section>';
    return h;
  }

  function typedView(cards) {
    var rows = firstTypedByWeek(cards, 4);
    var total = rows.reduce(function (s, r) { return s + r.n; }, 0);
    var h = '<section class="graph"><div class="qhead"><span class="crumb">First typed answers, by week</span><span class="qcount">' + total + ' in 4 weeks</span></div>';
    if (!total) return h + '<p class="muted" style="margin:0">No word has yet been typed from memory as the first thing done with it that day.</p></section>';
    var drawn = rows.map(function (r) { return { n: r.n, ok: r.ok, week: r.week }; });
    h += bars(drawn, { aria: 'Right out of first typed answers, for each of the last 4 weeks', lab: function (r) { return 'w/c ' + dateLabel(r.week); },
      val: function (r) { return r.ok + ' of ' + r.n; }, callout: true, rank: function (r) { return r.n ? r.ok / r.n + r.n / 1000 : -1; } });
    h += '<details class="gtable"><summary>As a table</summary><table><thead><tr><th>Week starting</th><th>Right</th><th>First typed answers</th></tr></thead><tbody>' +
      rows.map(function (r) { return '<tr><td>' + E(dateLabel(r.week)) + '</td><td>' + r.ok + '</td><td>' + r.n + (r.n && r.n < 5 ? ' <small>(few)</small>' : '') + '</td></tr>'; }).join('') + '</tbody></table></details>';
    h += '<p class="dpnote">Only card-days whose first recorded event was an unaided typed answer, not self-graded. A word looked at, hinted or recognised first that day is left out. ' +
      'An exposure that was never recorded cannot be ruled out, so this is not verified cold recall. Weeks with fewer than five are too few to read.</p></section>';
    return h;
  }

  window.Graphs = { practisedPerDay: practisedPerDay, firstTypedByWeek: firstTypedByWeek, practisedView: practisedView, typedView: typedView, line: line, bars: bars,
                    localDay: localDay, weekOf: weekOf, events: events };
})();
