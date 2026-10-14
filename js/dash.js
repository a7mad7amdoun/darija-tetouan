/* ---------------------------------------------------------------------------
   THE DASHBOARD PIECES.

   Small, honest pictures of a learner's progress, drawn from what the course
   actually records: the attempt log (dated), the schedule (dates saved now),
   the seen/strength marks, the days practised, the test results. Nothing here
   is a forecast and nothing here is a score the course did not record.

     kpiRow        four tiles with a sparkline each: words practised in the
                   chosen range, words due now (and the next seven days), the
                   streak, and typed-from-memory answers in the range, with
                   the change against the window before when that window has
                   any dated record at all.
     wordsDonut    every word in the course by its state: solid, getting
                   there, shaky, not yet met.
     fieldsBars    each of the eight fields: words met of words in it.
     scopeBar      the course by scope: mdini, Tetouan, northern, unscoped.
     calendar      this month: a dot on each day with a session, a second
                   dot on a day with a test.
     recentList    the last attempts, newest first, for the teacher.
     profileStats  three numbers and the fields for the account page.

   The range (7, 14 or 30 days) lives in memory only. Reading and drawing
   writes nothing (tests/dash.js checks it).
   --------------------------------------------------------------------------- */
(function () {
  var E = function (s) { return UI.esc(s); };
  var state = { days: 14 };
  function setRange(n) { n = +n; state.days = (n === 7 || n === 30) ? n : 14; }
  function range() { return state.days; }

  function seen(id) { return Store.get('seen:' + id, false) === true; }
  function win(days, back) {
    var today = Sched.todayStr();
    var to = Sched.addDays(today, -back * days), from = Sched.addDays(to, -(days - 1));
    return { from: from, to: to };
  }
  function inWin(e, w) { return e.day >= w.from && e.day <= w.to; }

  /* distinct words with a graded (non-learn) dated attempt in the window */
  function practisedIn(cards, w) {
    var by = {}, any = false;
    Graphs.events(cards).forEach(function (e) {
      if (!inWin(e, w)) return;
      any = true;
      if (e.task === 'learn') return;
      by[e.card] = 1;
    });
    return { n: Object.keys(by).length, any: any };
  }
  /* card-days whose first dated event was an unaided typed answer */
  function firstTyped(cards, w) {
    var first = {};
    Graphs.events(cards).forEach(function (e) {
      if (!inWin(e, w)) return;
      var k = e.card + '|' + e.day;
      if (!first[k] || e.t < first[k].t) first[k] = e;
    });
    var out = { ok: 0, n: 0, byDay: {} };
    Object.keys(first).forEach(function (k) {
      var e = first[k];
      if (e.task !== 'produce' || e.assisted || e.self) return;
      out.n++; if (e.ok) out.ok++;
      var d = out.byDay[e.day] = out.byDay[e.day] || { ok: 0, n: 0 };
      d.n++; if (e.ok) d.ok++;
    });
    return out;
  }
  /* words due today or overdue, and the counts saved for each of the next seven days */
  function dueSeries(cards) {
    var today = Sched.todayStr(), rows = [], now = 0;
    for (var i = 0; i < 7; i++) rows.push({ day: Sched.addDays(today, i), n: 0 });
    cards.forEach(function (c) {
      var s = Sched.get(c.id); if (!s || !s.d) return;
      if (s.d <= today) { now++; rows[0].n++; return; }
      var k = Sched.daysBetween(today, s.d);
      if (k >= 1 && k < 7) rows[k].n++;
    });
    return { now: now, rows: rows };
  }

  function kpis(cards) {
    var days = state.days, cur = win(days, 0), prev = win(days, 1);
    var per = Graphs.practisedPerDay(cards, days);
    var pr = practisedIn(cards, cur), ppr = practisedIn(cards, prev);
    var ft = firstTyped(cards, cur), pft = firstTyped(cards, prev);
    var due = dueSeries(cards);
    var st = window.Habits ? Habits.streak() : { days: 0, rests: 0 };
    var did = per.map(function (r) { return Store.get('did:' + r.day, false) === true ? 1 : 0; });
    var pct = function (o) { return o.n ? Math.round(o.ok / o.n * 100) : null; };
    return {
      days: days,
      practised: { n: pr.n, series: per.map(function (r) { return r.n; }), delta: ppr.any ? pr.n - ppr.n : null },
      due: { n: due.now, series: due.rows.map(function (r) { return r.n; }), later: due.rows.slice(1).reduce(function (s, r) { return s + r.n; }, 0) },
      streak: { n: st.days, rests: st.rests || 0, series: did },
      typed: { ok: ft.ok, n: ft.n, pct: pct(ft), prevPct: pct(pft),
               series: per.map(function (r) { var d = ft.byDay[r.day]; return d ? d.ok : 0; }) }
    };
  }

  /* ---------- drawing ---------- */
  function smooth(pts) {
    if (pts.length < 3) return 'M' + pts.map(function (p) { return p[0].toFixed(1) + ' ' + p[1].toFixed(1); }).join(' L');
    var d = 'M' + pts[0][0].toFixed(1) + ' ' + pts[0][1].toFixed(1);
    for (var i = 0; i < pts.length - 1; i++) {
      var p0 = pts[i - 1] || pts[i], p1 = pts[i], p2 = pts[i + 1], p3 = pts[i + 2] || p2;
      var c1x = p1[0] + (p2[0] - p0[0]) / 6, c1y = p1[1] + (p2[1] - p0[1]) / 6;
      var c2x = p2[0] - (p3[0] - p1[0]) / 6, c2y = p2[1] - (p3[1] - p1[1]) / 6;
      d += ' C' + c1x.toFixed(1) + ' ' + c1y.toFixed(1) + ' ' + c2x.toFixed(1) + ' ' + c2y.toFixed(1) + ' ' + p2[0].toFixed(1) + ' ' + p2[1].toFixed(1);
    }
    return d;
  }
  function spark(vals, aria) {
    var W = 120, H = 36, pad = 3, n = vals.length;
    if (!n) return '';
    var max = Math.max.apply(null, vals.concat([1]));
    var pts = vals.map(function (v, i) { return [pad + (n === 1 ? W / 2 : i * (W - pad * 2) / (n - 1)), H - pad - (v / max) * (H - pad * 2)]; });
    var d = smooth(pts);
    var area = d + ' L' + pts[n - 1][0].toFixed(1) + ' ' + (H - 1) + ' L' + pts[0][0].toFixed(1) + ' ' + (H - 1) + ' Z';
    var last = pts[n - 1];
    return '<svg class="spark" viewBox="0 0 ' + W + ' ' + H + '" role="img" aria-label="' + E(aria) + '" preserveAspectRatio="none">' +
      '<path class="sparea" d="' + area + '"/>' +
      '<path class="spline" d="' + d + '" pathLength="1"/>' +
      '<circle class="spdot" cx="' + last[0].toFixed(1) + '" cy="' + last[1].toFixed(1) + '" r="2.6"/></svg>';
  }

  function tile(o) {
    var delta = '';
    if (o.delta != null) {
      var cls = o.delta > 0 ? 'up' : o.delta < 0 ? 'down' : 'flat';
      delta = '<p class="kpid ' + cls + '">' + (o.delta > 0 ? '+' : '') + o.delta + (o.deltaUnit || '') + ' ' + E(o.deltaNote) + '</p>';
    } else if (o.deltaNote) delta = '<p class="kpid none">' + E(o.deltaNote) + '</p>';
    return '<article class="kpi' + (o.cls ? ' ' + o.cls : '') + '">' +
      '<div class="kpihead"><span class="kpil">' + E(o.label) + '</span>' + (o.icon ? '<span class="kpiico">' + UI.icon(o.icon) + '</span>' : '') + '</div>' +
      '<div class="kpiv"><b class="countn">' + E(String(o.value)) + '</b>' + (o.unit ? '<small>' + E(o.unit) + '</small>' : '') + '</div>' +
      (o.series ? spark(o.series, o.aria) : '') + delta + '</article>';
  }

  function kpiRow(cards) {
    var k = kpis(cards), d = k.days;
    var h = '<section class="kpirow" aria-label="At a glance">';
    h += tile({ label: 'Words practised', icon: 'i-find', value: k.practised.n, unit: 'in ' + d + ' days', series: k.practised.series,
      aria: 'words practised on each of the last ' + d + ' days', delta: k.practised.delta,
      deltaNote: k.practised.delta == null ? 'no dated record for the ' + d + ' days before' : 'vs the ' + d + ' days before' });
    h += tile({ label: 'Due now', icon: 'i-today', value: k.due.n, unit: k.due.later ? k.due.later + ' more this week' : 'this week clear', series: k.due.series,
      aria: 'words due today and on each of the next six days', cls: k.due.n ? 'due' : '', deltaNote: 'dates saved now; every answer moves them' });
    h += tile({ label: 'Streak', icon: 'i-rise', value: k.streak.n, unit: 'day' + (k.streak.n === 1 ? '' : 's') + (k.streak.rests ? ' · ' + k.streak.rests + ' rest' : ''), series: k.streak.series,
      aria: 'days practised in the last ' + d + ' days', deltaNote: k.streak.series.filter(Boolean).length + ' of the last ' + d + ' days' });
    h += tile({ label: 'Typed from memory', icon: 'i-pen', value: k.typed.pct == null ? '—' : k.typed.pct + '%', unit: k.typed.n ? k.typed.ok + ' of ' + k.typed.n + ' right' : 'none yet in this range',
      series: k.typed.series, aria: 'typed answers right on each of the last ' + d + ' days',
      delta: (k.typed.pct != null && k.typed.prevPct != null) ? k.typed.pct - k.typed.prevPct : null, deltaUnit: ' pts',
      deltaNote: (k.typed.pct != null && k.typed.prevPct != null) ? 'vs the ' + d + ' days before' : 'first unaided typed answer of a day; not verified cold recall' });
    h += '</section><p class="kpinote">Dated attempts only: older progress kept without dates is not in these four.</p>';
    return h;
  }

  function rangePick() {
    return '<div class="rangepick" role="group" aria-label="Range">' + [7, 14, 30].map(function (n) {
      return '<button type="button" data-range="' + n + '" aria-pressed="' + (state.days === n) + '">' + n + ' days</button>';
    }).join('') + '</div>';
  }

  /* ---------- the words, as a ring ---------- */
  function wordStates(cards) {
    var o = { solid: 0, ok: 0, shaky: 0, unseen: 0 };
    cards.forEach(function (c) {
      if (!seen(c.id)) { o.unseen++; return; }
      var s = UI.strength(c.id);
      if (s === 3) o.solid++; else if (s === 2) o.ok++; else o.shaky++;
    });
    return o;
  }
  function donut(parts, centre, sub, aria) {
    var total = parts.reduce(function (s, p) { return s + p.n; }, 0) || 1, off = 0;
    var h = '<svg class="donut" viewBox="0 0 120 120" role="img" aria-label="' + E(aria) + '">' +
      '<circle class="dring" cx="60" cy="60" r="46"/>';
    parts.forEach(function (p) {
      var len = p.n / total * 100;
      if (!p.n) return;
      h += '<circle class="dseg ' + p.cls + '" cx="60" cy="60" r="46" pathLength="100" style="--len:' + len.toFixed(2) + ';--off:' + (-off).toFixed(2) + '"/>';
      off += len;
    });
    h += '<text class="dnum" x="60" y="58" text-anchor="middle">' + E(String(centre)) + '</text>' +
      '<text class="dsub" x="60" y="74" text-anchor="middle">' + E(sub) + '</text></svg>';
    return h;
  }
  function wordsDonut(cards) {
    var w = wordStates(cards), met = w.solid + w.ok + w.shaky;
    var parts = [{ n: w.solid, cls: 's3', label: 'solid' }, { n: w.ok, cls: 's2', label: 'getting there' },
                 { n: w.shaky, cls: 's1', label: 'shaky' }, { n: w.unseen, cls: 's0', label: 'not yet met' }];
    return '<section class="graph ring"><div class="qhead"><span class="crumb">Where your words stand</span><span class="qcount">' + met + ' of ' + cards.length + ' met</span></div>' +
      '<div class="ringwrap">' + donut(parts, met, 'met', w.solid + ' solid, ' + w.ok + ' getting there, ' + w.shaky + ' shaky, ' + w.unseen + ' not yet met') +
      '<ul class="ringkey">' + parts.map(function (p) {
        return '<li><i class="' + p.cls + '"></i><b>' + p.n + '</b><span>' + E(p.label) + '</span><small>' + Math.round(p.n / Math.max(1, cards.length) * 100) + '%</small></li>';
      }).join('') + '</ul></div>' +
      '<p class="dpnote">Solid means right at least four times in five and twice overall; shaky, right less than half the time. A word met once and never asked again stays shaky until it is.</p></section>';
  }

  /* ---------- the fields, as bars ---------- */
  function fieldsBars(cards) {
    if (!window.Catalog) return '';
    var rows = Catalog.FIELDS.map(function (f) {
      var mine = cards.filter(function (c) { return Catalog.fieldOfGroup(c.group) === f.id; });
      var met = mine.filter(function (c) { return seen(c.id); }).length;
      return { f: f, n: mine.length, met: met };
    }).filter(function (r) { return r.n; });
    return '<section class="graph"><div class="qhead"><span class="crumb">By field</span><span class="qcount">words met of words in it</span></div><ul class="hbars">' +
      rows.map(function (r) {
        var pct = Math.round(r.met / r.n * 100);
        return '<li><a href="#/catalog/' + E(r.f.id) + '"><span class="hico">' + UI.icon(r.f.icon) + '</span><span class="hlab">' + E(r.f.title) + '</span>' +
          '<span class="hbar" role="img" aria-label="' + pct + ' percent"><i style="width:' + pct + '%"></i></span><span class="hpct">' + r.met + ' of ' + r.n + '</span></a></li>';
      }).join('') + '</ul></section>';
  }

  /* ---------- the course by scope ---------- */
  function scopeBar(cards) {
    var o = { mdini: 0, tetouan: 0, north: 0, none: 0 };
    cards.forEach(function (c) { var s = c.scope; if (s === 'mdini' || s === 'tetouan' || s === 'north') o[s]++; else o.none++; });
    var total = Math.max(1, cards.length);
    var parts = [['mdini', 'mdini, the old city’s own'], ['tetouan', 'Tetouan'], ['north', 'northern, shared'], ['none', 'no scope recorded']];
    return '<section class="graph"><div class="qhead"><span class="crumb">What the course is made of</span><span class="qcount">' + cards.length + ' words</span></div>' +
      '<div class="stackbar" role="img" aria-label="' + parts.map(function (p) { return o[p[0]] + ' ' + p[1]; }).join(', ') + '">' +
      parts.map(function (p) { return o[p[0]] ? '<i class="sc-' + p[0] + '" style="width:' + (o[p[0]] / total * 100).toFixed(2) + '%"></i>' : ''; }).join('') + '</div>' +
      '<ul class="stackkey">' + parts.map(function (p) { return '<li><i class="sc-' + p[0] + '"></i><b>' + o[p[0]] + '</b> ' + E(p[1]) + '</li>'; }).join('') + '</ul>' +
      '<p class="dpnote">A missing scope is unknown, not national. The labels are the course’s; see the Tetouani guide for what each means.</p></section>';
  }

  /* ---------- this month ---------- */
  function testDays() {
    var days = {};
    if (!window.Tests) return days;
    Tests.list.forEach(function (t) { Tests.results(t.id).forEach(function (r) { if (r && r.date) days[String(r.date).slice(0, 10)] = 1; }); });
    return days;
  }
  function calendar() {
    var today = Sched.todayStr(), y = +today.slice(0, 4), m = +today.slice(5, 7);
    var first = new Date(y, m - 1, 1), nDays = new Date(y, m, 0).getDate();
    var lead = (first.getDay() + 6) % 7, tests = testDays(), done = 0, tested = 0;
    var h = '<section class="graph cal"><div class="qhead"><span class="crumb">' + E(first.toLocaleDateString('en-GB', { month: 'long', year: 'numeric' })) + '</span>';
    var cells = '';
    ['M', 'T', 'W', 'T', 'F', 'S', 'S'].forEach(function (d) { cells += '<i class="dow">' + d + '</i>'; });
    for (var i = 0; i < lead; i++) cells += '<span class="cd pad"></span>';
    for (var d = 1; d <= nDays; d++) {
      var day = y + '-' + ('0' + m).slice(-2) + '-' + ('0' + d).slice(-2);
      var on = Store.get('did:' + day, false) === true, t = !!tests[day];
      if (on) done++; if (t) tested++;
      cells += '<span class="cd' + (on ? ' on' : '') + (t ? ' test' : '') + (day === today ? ' today' : '') + (day > today ? ' future' : '') + '"' +
        ' aria-label="' + day + (on ? ', practised' : '') + (t ? ', test taken' : '') + '"><b>' + d + '</b>' +
        (on || t ? '<span class="dots">' + (on ? '<i class="ds"></i>' : '') + (t ? '<i class="dt"></i>' : '') + '</span>' : '') + '</span>';
    }
    h += '<span class="qcount">' + done + ' day' + (done === 1 ? '' : 's') + (tested ? ' · ' + tested + ' test' + (tested === 1 ? '' : 's') : '') + '</span></div>' +
      '<div class="calgrid" role="img" aria-label="' + done + ' days practised this month">' + cells + '</div>' +
      '<p class="calkey"><i class="ds"></i> a session <i class="dt"></i> a test</p></section>';
    return h;
  }

  /* ---------- the last attempts, for the teacher ---------- */
  function ago(t) {
    var s = Math.max(0, (Date.now() - t) / 1000);
    if (s < 3600) return Math.max(1, Math.round(s / 60)) + ' min ago';
    if (s < 86400) return Math.round(s / 3600) + ' h ago';
    return Math.round(s / 86400) + ' d ago';
  }
  function recentList(cards, n) {
    var by = {}; cards.forEach(function (c) { by[c.id] = c; });
    var ev = Graphs.events(cards).sort(function (a, b) { return b.t - a.t; }).slice(0, n || 8);
    if (!ev.length) return '<section class="graph"><div class="qhead"><span class="crumb">Last attempts</span></div><p class="muted" style="margin:0">No dated attempts yet.</p></section>';
    return '<section class="graph"><div class="qhead"><span class="crumb">Last attempts</span><span class="qcount">newest first</span></div><ul class="recent">' +
      ev.map(function (e) {
        var c = by[e.card], en = c ? c.en : e.card;
        var task = e.task === 'produce' ? 'typed' : e.task === 'recall' ? 'recalled' : e.task === 'learn' ? 'met' : 'recognised';
        return '<li><span class="ravatar">' + E(String(en).slice(0, 1).toUpperCase()) + '</span><span class="rbody"><b>' + E(en) + '</b>' +
          '<small>' + task + (e.assisted ? ', with help' : '') + (e.self ? ', self-marked' : '') + ' · ' + ago(e.t) + '</small></span>' +
          '<span class="rres ' + (e.task === 'learn' ? 'met' : e.ok ? 'ok' : 'no') + '">' + (e.task === 'learn' ? 'new' : e.ok ? '✓ right' : '✗ missed') + '</span></li>';
      }).join('') + '</ul></section>';
  }

  /* ---------- the account page ---------- */
  function profileStats(cards) {
    var met = cards.filter(function (c) { return seen(c.id); }).length;
    var y = window.Habits ? Habits.year().days : 0;
    var tests = 0; if (window.Tests) Tests.list.forEach(function (t) { tests += Tests.results(t.id).length; });
    var h = '<div class="pstats"><div><b class="countn">' + met + '</b><small>words met</small></div>' +
      '<div><b class="countn">' + y + '</b><small>days this year</small></div>' +
      '<div><b class="countn">' + tests + '</b><small>tests taken</small></div></div>';
    if (window.Catalog) {
      h += '<div class="ptags">' + Catalog.FIELDS.map(function (f) {
        var mine = cards.filter(function (c) { return Catalog.fieldOfGroup(c.group) === f.id; });
        if (!mine.length) return '';
        var k = mine.filter(function (c) { return seen(c.id); }).length;
        return '<a class="ptag' + (k ? ' on' : '') + '" href="#/catalog/' + E(f.id) + '">' + UI.icon(f.icon) + E(f.title) + '<small>' + k + '/' + mine.length + '</small></a>';
      }).join('') + '</div>';
    }
    return h;
  }

  window.Dash = { setRange: setRange, range: range, kpis: kpis, kpiRow: kpiRow, rangePick: rangePick,
                  spark: spark, donut: donut, wordStates: wordStates, wordsDonut: wordsDonut,
                  fieldsBars: fieldsBars, scopeBar: scopeBar, calendar: calendar, recentList: recentList,
                  profileStats: profileStats, firstTyped: firstTyped, practisedIn: practisedIn, dueSeries: dueSeries, win: win };
})();
