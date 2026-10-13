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
    rows.forEach(function (r, i) {
      var x = pad + i * bw, bh = r.n ? Math.max(3, (H - 44) * r.n / max) : 0, y = H - 26 - bh;
      h += '<rect class="gbar' + (r.n ? '' : ' empty') + (r.today ? ' today' : '') + '" x="' + (x + bw * 0.18).toFixed(1) + '" y="' + y.toFixed(1) + '" width="' + (bw * 0.64).toFixed(1) + '" height="' + (bh || 2).toFixed(1) + '" rx="3"/>';
      if (r.n) h += '<text class="gval" x="' + (x + bw / 2).toFixed(1) + '" y="' + (y - 5).toFixed(1) + '" text-anchor="middle">' + E(opts.val ? opts.val(r) : r.n) + '</text>';
      if (!opts.label || opts.label(r, i)) h += '<text class="glab" x="' + (x + bw / 2).toFixed(1) + '" y="' + (H - 9) + '" text-anchor="middle">' + E(opts.lab(r, i)) + '</text>';
    });
    return h + '</svg>';
  }
  function dayLabel(d) { return new Date(d + 'T12:00:00').toLocaleDateString('en-GB', { weekday: 'short' }).slice(0, 2); }
  function dateLabel(d) { return new Date(d + 'T12:00:00').toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }); }

  function practisedView(cards) {
    var rows = practisedPerDay(cards, 14), today = Sched.todayStr();
    rows.forEach(function (r) { r.today = r.day === today; });
    var total = rows.reduce(function (s, r) { return s + r.n; }, 0), active = rows.filter(function (r) { return r.n; }).length;
    var h = '<section class="graph"><div class="qhead"><span class="crumb">Words practised per day</span><span class="qcount">' + active + ' of 14 days</span></div>';
    if (!total) return h + '<p class="muted" style="margin:0">No dated attempts in the last two weeks. Older progress may be kept without dates.</p></section>';
    h += bars(rows, { aria: 'Words practised on each of the last 14 days', lab: function (r) { return dayLabel(r.day); } });
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
      val: function (r) { return r.ok + ' of ' + r.n; } });
    h += '<details class="gtable"><summary>As a table</summary><table><thead><tr><th>Week starting</th><th>Right</th><th>First typed answers</th></tr></thead><tbody>' +
      rows.map(function (r) { return '<tr><td>' + E(dateLabel(r.week)) + '</td><td>' + r.ok + '</td><td>' + r.n + (r.n && r.n < 5 ? ' <small>(few)</small>' : '') + '</td></tr>'; }).join('') + '</tbody></table></details>';
    h += '<p class="dpnote">Only card-days whose first recorded event was an unaided typed answer, not self-graded. A word looked at, hinted or recognised first that day is left out. ' +
      'An exposure that was never recorded cannot be ruled out, so this is not verified cold recall. Weeks with fewer than five are too few to read.</p></section>';
    return h;
  }

  window.Graphs = { practisedPerDay: practisedPerDay, firstTypedByWeek: firstTypedByWeek, practisedView: practisedView, typedView: typedView,
                    localDay: localDay, weekOf: weekOf, events: events };
})();
