/* ---------------------------------------------------------------------------
   SAY IT IN TETOUANI: a translator that only ever answers from the course.

   Type what you want to say, in English (or in Darija or Arabic to go the
   other way), and the closest things the course already has come back: the
   words, the sentences, the lines of the situations, the turns of the
   conversations - each in the course's order, English, Tetouani in Latin
   letters, Arabic. Nothing is generated and nothing is fetched: if the
   course does not have it, the page says so and points to Ahmed, because an
   invented Tetouani sentence is worse than none. Reading it writes nothing.
   --------------------------------------------------------------------------- */
(function () {
  var E = function (s) { return UI.esc(s); };
  var D = function () { return window.DARIJA || {}; };
  var state = { q: '' };
  var STOP = { i: 1, a: 1, an: 1, the: 1, to: 1, of: 1, is: 1, it: 1, in: 1, on: 1, and: 1, for: 1, me: 1, my: 1, you: 1, your: 1, do: 1, can: 1, please: 1, want: 1, would: 1, like: 1 };

  /* lower-case, no harakat, no hyphens (a-TAY and atay are one word), no punctuation */
  function norm(s) { return String(s || '').toLowerCase().replace(/[ً-ْٰـ]/g, '').replace(/-/g, '').replace(/[^\p{L}\p{N}\s'’]/gu, ' ').replace(/\s+/g, ' ').trim(); }
  function tokens(s) { return norm(s).split(' ').filter(Boolean); }

  /* everything the course can say, flattened once per query */
  function pool() {
    var out = [];
    UI.allActiveCards().forEach(function (c) {
      var f = UI.formFor(c);
      out.push({ kind: 'word', id: c.id, en: c.en, phon: f.phon, ar: f.arv || f.ar, href: '#/vocab', extra: c.use || '',
                 text: [c.en, f.phon, f.ar, f.arv].join(' ') });
      if (c.example && c.example.phon) out.push({ kind: 'example', id: c.id + ':ex', en: c.example.en || '', phon: c.example.phon, ar: c.example.ar || '', href: '#/vocab',
                 text: [c.example.en, c.example.phon, c.example.ar].join(' ') });
    });
    UI.allSentences().forEach(function (s) {
      out.push({ kind: 'sentence', id: s.id, en: s.en, phon: s.phon, ar: s.arv || s.ar, href: '#/sentences', extra: s.pattern || '',
                 text: [s.en, s.phon, s.ar, s.arv, (s.parts || []).map(function (p) { return p.en + ' ' + p.d; }).join(' ')].join(' ') });
    });
    (D().situations || []).forEach(function (s) {
      s.lines.forEach(function (l, i) {
        out.push({ kind: 'line', id: s.id + ':' + i, en: l.en, phon: l.full.phon, ar: l.full.ar, href: '#/situations/' + s.id, extra: s.title,
                   text: [l.en, l.full.phon, l.full.ar].join(' ') });
      });
    });
    UI.allDialogues().forEach(function (d) {
      d.turns.forEach(function (t, i) {
        out.push({ kind: 'turn', id: d.id + ':' + i, en: t.en, phon: t.phon, ar: t.arv || t.ar, href: '#/dialogues', extra: d.title,
                   text: [t.en, t.phon, t.ar, t.arv].join(' ') });
      });
    });
    return out;
  }

  function score(item, qt, qn) {
    var t = norm(item.text), s = 0;
    if (t.indexOf(qn) >= 0) s += 6;                               /* the whole phrase, somewhere */
    var words = t.split(' ');
    qt.forEach(function (w) {
      if (STOP[w]) { if (words.indexOf(w) >= 0) s += 0.25; return; }
      if (words.indexOf(w) >= 0) s += 2;
      else if (w.length >= 4 && words.some(function (x) { return x.indexOf(w) === 0 || w.indexOf(x) === 0 && x.length >= 4; })) s += 1;
    });
    /* shorter answers first when the score ties: a word before a whole dialogue */
    return s ? s + Math.max(0, 1 - words.length / 40) : 0;
  }

  function search(q) {
    var qn = norm(q), qt = tokens(q).filter(Boolean);
    if (!qt.length) return [];
    return pool().map(function (it) { return { it: it, s: score(it, qt, qn) }; })
      .filter(function (x) { return x.s > 0; })
      .sort(function (a, b) { return b.s - a.s; })
      .slice(0, 12).map(function (x) { return x.it; });
  }

  var KIND = { word: 'A word', example: 'An example on a card', sentence: 'A sentence', line: 'A line from a situation', turn: 'A turn in a conversation' };

  function item(it) {
    return '<a class="sayhit ' + E(it.kind) + '" href="' + E(it.href) + '"><span class="crumb">' + E(KIND[it.kind]) + (it.extra ? ' · ' + E(it.extra) : '') + '</span>' +
      '<p class="men">' + E(it.en) + '</p><p class="say">' + UI.sayHTML(it.phon) + '</p>' +
      (it.ar ? '<p class="ar" lang="ary" dir="rtl">' + E(it.ar) + '</p>' : '') + '</a>';
  }

  function view(q) {
    if (typeof q === 'string') state.q = q.trim();
    var hits = state.q ? search(state.q) : [];
    var h = '<h1>Say it in Tetouani</h1>' +
      '<p class="sub">Type what you want to say. What comes back is what the course already has for it: a word, a sentence, a line of a scene, ' +
      'a turn of a conversation, in the course’s order. Nothing is machine-translated: if it is not here, Ahmed is the one to ask.</p>';
    h += '<form class="findword sayform" id="sayfind" role="search"><label for="sayq">What do you want to say?</label>' +
      '<div class="findrow"><input id="sayq" type="search" autocomplete="off" autocorrect="off" autocapitalize="none" spellcheck="false" ' +
      'value="' + E(state.q) + '" placeholder="e.g. I want a tea without sugar"><button class="btn primary" type="submit">Find it</button></div></form>';
    if (state.q) {
      h += '<p class="vscope" aria-live="polite">' + (hits.length ? hits.length + ' thing' + (hits.length === 1 ? '' : 's') + ' the course can say for “' + E(state.q) + '”' : 'Nothing in the course matches “' + E(state.q) + '” yet') + '</p>';
      h += '<div class="sayhits">' + hits.map(item).join('') + '</div>';
      h += '<div class="panel tight sayask"><span class="crumb">Not what you meant?</span><p class="muted" style="margin:4px 0 10px">The course cannot invent a sentence, and should not. ' +
        'Tell Ahmed what you wanted to say and he adds the real Tetouani for it.</p><a class="btn" href="#/feedback">Ask Ahmed for this phrase</a></div>';
    } else {
      h += '<div class="saytry"><span class="crumb">Try</span>' + ['I want a tea', 'how much is it', 'where is the market', 'I don’t understand', 'thank you very much', 'see you tomorrow', 'atay', 'سلام']
        .map(function (t) { return '<button type="button" class="tmchip" data-say="' + E(t) + '">' + E(t) + '</button>'; }).join('') + '</div>';
    }
    return h;
  }

  window.Say = { view: view, search: search, setQuery: function (q) { state.q = String(q || '').trim(); } };
})();
