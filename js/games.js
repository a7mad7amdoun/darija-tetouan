/* ---------------------------------------------------------------------------
   GAMES — five short games built from the course's own words and sentences.

     pairs   match English to Darija, six pairs at a time
     build   put a sentence's chunks back in order
     stress  tap the loud syllable (the course marks stress in capitals)
     odd     four words, one from another field: which?
     rush    forty-five seconds of English-to-Darija

   What a game writes: ONE result per finished round, through Tests.record,
   into the same append-only score history the tests use (testres:game:...).
   Never an attempt, a schedule, a familiarity count, a seen or done key: a
   game is practice and a score, not evidence that a word was produced cold
   (tests/games.js checks the document for exactly that).
   --------------------------------------------------------------------------- */
(function () {
  var D = function () { return window.DARIJA || {}; };
  var E = function (s) { return UI.esc(s); };

  function shuffle(a) {
    a = a.slice();
    for (var i = a.length - 1; i > 0; i--) { var j = Math.floor(Math.random() * (i + 1)), t = a[i]; a[i] = a[j]; a[j] = t; }
    return a;
  }
  function sample(a, n) { return shuffle(a).slice(0, n); }
  function form(c) { return UI.formFor ? UI.formFor(c) : c; }
  function today() { return Sched.todayStr(); }

  /* the words a game draws from: the field's, if one is chosen; words the
     learner has met first, the first month's if that is too few */
  function pool(fieldId) {
    var all = UI.allActiveCards();
    if (fieldId && window.Catalog) {
      var c = Catalog.contents(fieldId);
      if (c) all = c.cards;
    }
    var met = all.filter(function (c) { return Store.get('seen:' + c.id, false); });
    if (met.length >= 12) return met;
    var first = all.filter(function (c) { return c.courseId === (UI.activeCourses()[0] || {}).id; });
    return first.length >= 12 ? first : all;
  }
  function sentencePool(fieldId) {
    var all = UI.allSentences().filter(function (s) { return (s.parts || []).length >= 3 && (s.parts || []).length <= 7; });
    if (fieldId && window.Catalog) {
      var c = Catalog.contents(fieldId);
      if (c && c.sentences.length >= 4) all = c.sentences.filter(function (s) { return (s.parts || []).length >= 3 && s.parts.length <= 7; });
    }
    return all;
  }

  /* ---------- the games ---------- */
  var GAMES = [
    { id: 'pairs', icon: 'i-cards', title: 'Pairs', size: 3, blurb: 'Match the English to the Darija, six pairs at a time.',
      build: function (cards) {
        var out = [];
        for (var r = 0; r < 3; r++) {
          var six = sample(cards, 6);
          if (six.length < 6) break;
          out.push({ kind: 'pairs', cards: six,
            left: shuffle(six).map(function (c) { return { id: c.id, text: c.en }; }),
            right: shuffle(six).map(function (c) { return { id: c.id, phon: form(c).phon, ar: form(c).arv || form(c).ar }; }),
            matched: {}, pick: null, misses: 0 });
        }
        return out;
      } },
    { id: 'build', icon: 'i-layers', title: 'Build the sentence', size: 6, blurb: 'The chunks of a real sentence, shuffled. Put them back in order.',
      build: function (cards, sentences) {
        return sample(sentences, 6).map(function (s) {
          return { kind: 'build', s: s, order: shuffle(s.parts.map(function (p, i) { return i; })), chosen: [], checked: false };
        });
      } },
    { id: 'stress', icon: 'i-talk', title: 'Where is the stress?', size: 10, blurb: 'Tap the loud syllable. Getting the stress right is half of sounding Tetouani.',
      build: function (cards) {
        var ok = cards.filter(function (c) {
          var syl = form(c).phon.split(/[\s-]+/).filter(Boolean);
          var loud = syl.filter(function (x) { var l = x.replace(/[^A-Za-z]/g, ''); return l.length >= 2 && l === l.toUpperCase(); });
          return syl.length >= 2 && loud.length === 1;
        });
        return sample(ok, 10).map(function (c) {
          var syl = form(c).phon.split(/[\s-]+/).filter(Boolean);
          return { kind: 'stress', card: c, syl: syl,
            answer: syl.findIndex(function (x) { var l = x.replace(/[^A-Za-z]/g, ''); return l.length >= 2 && l === l.toUpperCase(); }),
            picked: -1 };
        });
      } },
    { id: 'odd', icon: 'i-target', title: 'Odd one out', size: 8, blurb: 'Four words. Three belong together. Which one is from somewhere else?',
      build: function (cards) {
        var byField = {};
        UI.allActiveCards().forEach(function (c) { var f = Catalog.fieldOfGroup(c.group); (byField[f] = byField[f] || []).push(c); });
        var out = [], tries = 0;
        while (out.length < 8 && tries++ < 60) {
          var c3 = sample(cards, 3);
          if (c3.length < 3) break;
          var f = Catalog.fieldOfGroup(c3[0].group);
          if (c3.some(function (c) { return Catalog.fieldOfGroup(c.group) !== f; })) continue;
          var others = Object.keys(byField).filter(function (k) { return k !== f; });
          var odd = sample(byField[others[Math.floor(Math.random() * others.length)]], 1)[0];
          if (!odd) continue;
          out.push({ kind: 'odd', options: shuffle(c3.concat([odd])), answer: odd.id, field: Catalog.byId(f).title,
                     oddField: Catalog.byId(Catalog.fieldOfGroup(odd.group)).title, picked: null });
        }
        return out;
      } },
    { id: 'rush', icon: 'i-door', title: 'Word rush', size: 0, seconds: 45, blurb: 'Forty-five seconds. English on top, three Darija below. How many can you get?',
      build: function (cards) {
        return shuffle(cards).slice(0, 40).map(function (c) {
          var wrong = sample(cards.filter(function (x) { return x.id !== c.id; }), 2);
          return { kind: 'rush', card: c, options: shuffle([c].concat(wrong)), picked: null };
        });
      } }
  ];
  function game(id) { return GAMES.filter(function (g) { return g.id === id; })[0] || null; }

  /* ---------- a run ---------- */
  var run = null, timer = null;

  function start(id, fieldId) {
    stop();
    var g = game(id); if (!g) return null;
    var qs = g.build(pool(fieldId), sentencePool(fieldId));
    run = { id: id, field: fieldId || '', qs: qs, i: 0, right: 0, answered: 0, done: !qs.length, recorded: false,
            left: g.seconds || 0, startedAt: Date.now() };
    if (g.seconds && qs.length) {
      timer = setInterval(function () {
        if (!run || run.done) { stop(); return; }
        run.left = Math.max(0, g.seconds - Math.round((Date.now() - run.startedAt) / 1000));
        var el = document.getElementById('gtime');
        if (el) el.textContent = run.left + 's';
        if (run.left <= 0) { finish(); if (window.App && App.render) App.render(); }
      }, 250);
    }
    return run;
  }
  function stop() { if (timer) { clearInterval(timer); timer = null; } }
  function reset() { stop(); run = null; }

  function finish() {
    if (!run || run.done) return;
    run.done = true; stop();
    var total = run.id === 'rush' ? run.answered : run.qs.length;
    if (total && !run.recorded) {
      run.recorded = true;
      Tests.record('game:' + run.id, run.right, total, today());
    }
  }

  function next() {
    if (!run) return;
    if (run.i + 1 < run.qs.length) run.i++; else finish();
  }

  /* one tap on one of a game's controls. Returns nothing; the view re-renders. */
  function click(b) {
    if (!run || run.done) return;
    var q = run.qs[run.i], act = b.dataset.g, v = b.dataset.v;
    if (q.kind === 'pairs') {
      if (act === 'next') { if (q.complete) next(); return; }
      if (act !== 'pick') return;
      var side = b.dataset.side, id = v;
      if (q.matched[id]) return;
      if (!q.pick) { q.pick = { side: side, id: id }; return; }
      if (q.pick.side === side) { q.pick = { side: side, id: id }; return; }
      if (q.pick.id === id) { q.matched[id] = 1; q.pick = null;
        if (Object.keys(q.matched).length === q.cards.length) { if (q.misses === 0) run.right++; q.complete = true; }
      } else { q.misses++; q.pick = null; q.shake = id; }
      return;
    }
    if (q.kind === 'build') {
      if (act === 'chunk' && !q.checked) { var k = +v; if (q.chosen.indexOf(k) < 0) q.chosen.push(k); return; }
      if (act === 'undo' && !q.checked) { q.chosen.pop(); return; }
      if (act === 'check' && !q.checked && q.chosen.length === q.s.parts.length) {
        q.checked = true; q.ok = q.chosen.every(function (k, i) { return k === i; });
        if (q.ok) run.right++; run.answered++; return;
      }
      if (act === 'next') next(); return;
    }
    if (q.kind === 'stress') {
      if (act === 'pick' && q.picked < 0) { q.picked = +v; run.answered++; if (q.picked === q.answer) run.right++; return; }
      if (act === 'next') next(); return;
    }
    if (q.kind === 'odd') {
      if (act === 'pick' && !q.picked) { q.picked = v; run.answered++; if (v === q.answer) run.right++; return; }
      if (act === 'next') next(); return;
    }
    if (q.kind === 'rush') {
      if (act === 'pick' && !q.picked) {
        q.picked = v; run.answered++; if (v === q.card.id) run.right++;
        if (run.i + 1 < run.qs.length) run.i++; else finish();
      }
      return;
    }
    if (act === 'next') next();
  }

  /* ---------- views ---------- */
  function listView(fieldId) {
    var f = fieldId && window.Catalog ? Catalog.byId(fieldId) : null;
    var h = UI.banner('practice') + '<h1>Games</h1>' +
      '<p class="sub">Short games on the words you have met' + (f ? ' in <b>' + E(f.title) + '</b>' : '') +
      '. Each one keeps a score history, like the tests, and none of them touches your reviews.</p>';
    if (f) h += '<p class="gfield">Playing on one field. <a href="#/games">All words instead</a></p>';
    h += '<div class="tiles">' + GAMES.map(function (g) {
      var last = Tests.last('game:' + g.id), best = Tests.best('game:' + g.id);
      return '<a class="tile" href="#/games/' + g.id + (f ? '?field=' + E(f.id) : '') + '">' +
        '<span class="ticon"><svg class="ico" aria-hidden="true"><use href="#' + g.icon + '"/></svg></span>' +
        '<span class="ttitle">' + E(g.title) + '</span><span class="tsub">' + E(g.blurb) + '</span>' +
        '<span class="tprog">' + (last ? 'last ' + Math.round(last.score / Math.max(1, last.total) * 100) + '% · best ' + best + '%' : 'not played yet') + '</span></a>';
    }).join('') + '</div>';
    h += '<h2>Also</h2><div class="tiles">' +
      '<a class="tile" href="#/tests"><span class="ticon"><svg class="ico" aria-hidden="true"><use href="#i-target"/></svg></span>' +
      '<span class="ttitle">Tests</span><span class="tsub">' + Tests.list.length + ' short tests: pictures, gaps, Tetouani or national, spoken</span></a></div>';
    return h;
  }

  function bar() {
    var n = run.qs.length;
    return '<div class="sesshead"><div class="sessbar"><span style="width:' + Math.round((run.i + (run.done ? 1 : 0)) / Math.max(1, n) * 100) + '%"></span></div>' +
      (run.id === 'rush' ? '<p class="sessstep" id="gtime">' + run.left + 's</p>' : '<p class="sessstep">' + Math.min(run.i + 1, n) + ' / ' + n + '</p>') + '</div>';
  }

  function playView(id, fieldId) {
    var g = game(id);
    if (!g) return '<p class="empty">No such game.</p>';
    if (!run || run.id !== id || (run.field || '') !== (fieldId || '')) start(id, fieldId);
    var h = '<div class="crumb"><a href="#/games' + (fieldId ? '?field=' + E(fieldId) : '') + '">Games</a></div>' +
      '<h1 class="gtitle">' + E(g.title) + '</h1>';
    if (!run.qs.length) return h + '<p class="empty">Not enough words met yet for this game. Do a few sessions first.</p>';
    if (run.done) {
      var total = run.id === 'rush' ? run.answered : run.qs.length;
      return h + '<div class="sess centred"><div class="sessdone"><svg viewBox="0 0 24 24" width="84" height="84" aria-hidden="true"><g fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"><path d="M5 21V11.4C5 8.2 7.3 6.3 9.8 5L12 3.6 14.2 5C16.7 6.3 19 8.2 19 11.4V21" stroke-width="1.1"/><path d="M3.5 21h17" stroke-width="1.1"/><path d="m9.3 14.6 1.9 1.9 3.6-4.1" stroke-width="1.4"/></g></svg></div>' +
        '<h2 class="sessdoneh">' + run.right + ' of ' + total + '</h2>' +
        '<p class="sub">' + (run.id === 'pairs' ? 'rounds with no misses' : run.id === 'rush' ? 'right in ' + g.seconds + ' seconds' : 'right') +
        '. Saved to your score history; your reviews are unchanged.</p>' +
        '<div class="btnrow"><button class="btn primary" type="button" data-g="again">Play again</button>' +
        '<a class="btn" href="#/games' + (fieldId ? '?field=' + E(fieldId) : '') + '">Other games</a></div></div>';
    }
    var q = run.qs[run.i];
    h += '<div class="sess game">' + bar();
    if (q.kind === 'pairs') h += pairsView(q);
    else if (q.kind === 'build') h += buildView(q);
    else if (q.kind === 'stress') h += stressView(q);
    else if (q.kind === 'odd') h += oddView(q);
    else if (q.kind === 'rush') h += rushView(q);
    return h + '</div>';
  }

  function pairsView(q) {
    var h = '<p class="sessq">Tap an English word, then its Darija.</p><div class="pairs">';
    h += '<div class="pcol">' + q.left.map(function (x) {
      var on = q.pick && q.pick.side === 'l' && q.pick.id === x.id, done = !!q.matched[x.id];
      return '<button type="button" class="ptile' + (done ? ' done' : '') + (on ? ' on' : '') + (q.shake === x.id ? ' shake' : '') +
        '" data-g="pick" data-side="l" data-v="' + E(x.id) + '" aria-pressed="' + !!on + '"' + (done ? ' disabled' : '') + '>' + E(x.text) + '</button>';
    }).join('') + '</div><div class="pcol">' + q.right.map(function (x) {
      var on = q.pick && q.pick.side === 'r' && q.pick.id === x.id, done = !!q.matched[x.id];
      return '<button type="button" class="ptile dar' + (done ? ' done' : '') + (on ? ' on' : '') + (q.shake === x.id ? ' shake' : '') +
        '" data-g="pick" data-side="r" data-v="' + E(x.id) + '" aria-pressed="' + !!on + '"' + (done ? ' disabled' : '') + '>' +
        '<span class="say">' + UI.sayHTML(x.phon) + '</span><span class="ar" lang="ary" dir="rtl">' + E(x.ar) + '</span></button>';
    }).join('') + '</div></div>';
    q.shake = null;
    if (q.complete) h += '<p class="sessfb ok" aria-live="polite">All six' + (q.misses ? ', with ' + q.misses + ' miss' + (q.misses === 1 ? '' : 'es') : ', no misses') + '.</p>' +
      '<div class="sessact"><button class="btn primary big" type="button" data-g="next">' + (run.i + 1 < run.qs.length ? 'Next six' : 'Finish') + '</button></div>';
    else h += '<p class="gmiss" aria-live="polite">' + (q.misses ? q.misses + ' miss' + (q.misses === 1 ? '' : 'es') : '') + '</p>';
    return h;
  }

  function buildView(q) {
    var s = q.s;
    var h = '<p class="sessq">Put the chunks in order</p><p class="gen">' + E(s.en) + '</p>';
    h += '<div class="gline" aria-live="polite">' + (q.chosen.length ? q.chosen.map(function (k) {
      return '<span class="gchunk on">' + E(s.parts[k].d) + '</span>'; }).join('') : '<span class="gempty">tap the chunks below</span>') + '</div>';
    h += '<div class="gchunks">' + q.order.map(function (k) {
      var used = q.chosen.indexOf(k) >= 0;
      return '<button type="button" class="gchunk" data-g="chunk" data-v="' + k + '"' + (used || q.checked ? ' disabled' : '') + '>' +
        E(s.parts[k].d) + '<small>' + E(s.parts[k].en) + '</small></button>';
    }).join('') + '</div>';
    if (q.checked) {
      h += '<p class="sessfb ' + (q.ok ? 'ok' : 'no') + '" aria-live="polite">' + (q.ok ? 'That is it.' : 'Not quite. The order is:') + '</p>' +
        '<div class="mreveal"><p class="say mbig">' + UI.sayHTML(s.phon) + '</p>' + UI.arabic(s.arv || s.ar) + '</div>' +
        '<div class="sessact"><button class="btn primary big" type="button" data-g="next">' + (run.i + 1 < run.qs.length ? 'Next sentence' : 'Finish') + '</button></div>';
    } else {
      h += '<div class="sessact"><div class="sesspair"><button class="btn" type="button" data-g="undo"' + (q.chosen.length ? '' : ' disabled') + '>Undo</button>' +
        '<button class="btn primary" type="button" data-g="check"' + (q.chosen.length === s.parts.length ? '' : ' disabled') + '>Check</button></div></div>';
    }
    return h;
  }

  function stressView(q) {
    var h = '<p class="sessq">Which syllable is loud?</p><p class="gen">' + E(q.card.en) + '</p>';
    h += '<div class="gsyl">' + q.syl.map(function (x, i) {
      var cls = 'gsylb' + (q.picked >= 0 ? (i === q.answer ? ' right' : i === q.picked ? ' wrong' : '') : '');
      return '<button type="button" class="' + cls + '" data-g="pick" data-v="' + i + '"' + (q.picked >= 0 ? ' disabled' : '') + '>' + E(x.toLowerCase()) + '</button>';
    }).join('') + '</div>';
    if (q.picked >= 0) {
      h += '<p class="sessfb ' + (q.picked === q.answer ? 'ok' : 'no') + '" aria-live="polite">' + (q.picked === q.answer ? 'That is it.' : 'Not quite.') + '</p>' +
        '<div class="mreveal"><p class="say mbig">' + UI.sayHTML(form(q.card).phon) + '</p>' + UI.arabic(form(q.card).arv || form(q.card).ar) + '</div>' +
        '<div class="sessact"><button class="btn primary big" type="button" data-g="next">' + (run.i + 1 < run.qs.length ? 'Next word' : 'Finish') + '</button></div>';
    }
    return h;
  }

  function oddView(q) {
    var h = '<p class="sessq">Three belong together. Which one is from another field?</p><div class="sessopts">';
    h += q.options.map(function (c) {
      var cls = 'sessopt' + (q.picked ? (c.id === q.answer ? ' right' : c.id === q.picked ? ' wrong' : '') : '');
      return '<button type="button" class="' + cls + '" data-g="pick" data-v="' + E(c.id) + '"' + (q.picked ? ' disabled' : '') + '>' +
        '<span class="oph">' + UI.sayHTML(form(c).phon) + '</span><span class="opa" lang="ary" dir="rtl">' + E(form(c).arv || form(c).ar) + '</span>' +
        '<small>' + E(c.en) + '</small></button>';
    }).join('') + '</div>';
    if (q.picked) {
      h += '<p class="sessfb ' + (q.picked === q.answer ? 'ok' : 'no') + '" aria-live="polite">' + (q.picked === q.answer ? 'That is it. ' : 'Not quite. ') +
        'Three are from <b>' + E(q.field) + '</b>; the odd one is from <b>' + E(q.oddField) + '</b>.</p>' +
        '<div class="sessact"><button class="btn primary big" type="button" data-g="next">' + (run.i + 1 < run.qs.length ? 'Next four' : 'Finish') + '</button></div>';
    }
    return h;
  }

  function rushView(q) {
    var h = '<p class="sessq">Score so far: ' + run.right + '</p><p class="gen big">' + E(q.card.en) + '</p><div class="sessopts">';
    h += q.options.map(function (c) {
      return '<button type="button" class="sessopt" data-g="pick" data-v="' + E(c.id) + '">' +
        '<span class="oph">' + UI.sayHTML(form(c).phon) + '</span><span class="opa" lang="ary" dir="rtl">' + E(form(c).arv || form(c).ar) + '</span></button>';
    }).join('') + '</div>';
    return h;
  }

  window.Games = { list: GAMES, game: game, start: start, stop: stop, reset: reset, finish: finish, click: click,
                   run: function () { return run; }, listView: listView, playView: playView, pool: pool };
})();
