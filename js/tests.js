/* ---------------------------------------------------------------------------
   TESTS — short, varied, low-stakes checks.

   Every test is GENERATED from the card and situation data, so Month 2 gets the
   same test suite for free the moment its content file is added. No test content
   is authored by hand.

   Formats:
     pick-darija    English prompt  -> choose the Tetouani form
     pick-english   Tetouani prompt -> choose the English
     picture        emoji prompt    -> choose the Tetouani form
     tetouani       two real forms  -> which one is Tetouani, which national
     gap            a situation line with one word missing
     fusha          Darija form     -> choose its Classical Arabic root
     speak          say it out loud -> self-marked (spoken language, not written)
   --------------------------------------------------------------------------- */
(function () {
  var D = window.DARIJA;

  /* emoji prompts for concrete words — deliberately emoji, not photographs:
     the site ships no image files so it stays offline-capable and instant. */
  var PICTURES = {
    'w2-n1': '1️⃣', 'w2-n2': '2️⃣', 'w2-n3': '3️⃣', 'w2-n4': '4️⃣', 'w2-n5': '5️⃣',
    'w2-n6': '6️⃣', 'w2-n7': '7️⃣', 'w2-n8': '8️⃣', 'w2-n9': '9️⃣', 'w2-n10': '🔟',
    'w2-sa3a': '🕐', 'w2-nos': '🕜', 'w2-simana': '📅', 'w2-daba': '⏱️',
    'w3-limen': '➡️', 'w3-lisser': '⬅️', 'w3-nishan': '⬆️', 'w3-taxi': '🚕',
    'w3-blaya': '🏖️', 'w3-medina': '🏛️', 'w3-tla3': '⬆️🏔️', 'w3-hawwed': '⬇️',
    'w3-taqa': '🪟', 'w3-hawma': '🏘️', 'w3-hna': '📍',
    'x-kuzina': '🍳', 'x-kama': '🛏️', 'x-rwida': '🛞', 'x-manta': '🛌',
    'x-kurda': '🪢', 'x-bokadyo': '🥪', 'x-paiya': '🥘', 'x-buskuchu': '🍰',
    'x-qtayef': '🥞', 'w1-3ayel': '🧒', 'w2-yes': '✅', 'w2-no': '❌',
    'w1-hello': '👋', 'w1-bye': '👋', 'w1-thanks': '🙏', 'w2-ghali': '💸',
    'w2-lma': '💧', 'w2-khobz': '🥖', 'w2-atay': '🍵', 'w2-qahwa': '☕',
    'w2-lyum': '📆', 'w2-ghedda': '🌅', 'w2-bzaf': '🔺', 'w2-shwiya': '🔻',
    'w2-3yyan': '😴', 'w2-mrid': '🤒', 'w2-fer7an': '😊', 'w2-jay3': '🍽️', 'w2-mzewwej': '💍',
    'w1-hammam': '🛁', 'w1-drari': '👨‍👩‍👧', 'w1-weldi': '👦', 'w1-jara': '🏘️',
    'w1-khti': '👩', 'w1-khoya': '👨', 'w1-lalla': '🧕', 'w1-sidi': '🧔',
    'w1-mabruk': '🎉', 'w1-bsahha': '😋', 'w1-llahyshafi': '💊', 'w1-mezyan': '👍',
    'w1-mafhemtsh': '🤷', 'w1-bshwiya': '🐢', 'w3-shkun': '❓', 'w3-3lash': '🤔',
    'w2-kayn': '✔️', 'w2-makaynsh': '🚫', 'w1-rajli': '🤵', 'w1-mrati': '👰'
  };

  function shuffle(a) {
    for (var i = a.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1)), t = a[i]; a[i] = a[j]; a[j] = t;
    }
    return a;
  }
  function sample(arr, n, exclude) {
    var pool = arr.filter(function (x) { return x !== exclude; });
    return shuffle(pool.slice()).slice(0, n);
  }

  /* Tests draw on the everyday and useful bands. The 'extra' band — cultural and
     rare items — is excluded so a test never turns on a word he will not meet. */
  function pool() {
    var out = UI.allActiveCards();
    var main = out.filter(function (c) { return c.freq !== 'extra'; });
    return main.length >= 12 ? main : out;
  }

  /* ---------- question builders ---------- */
  function qPickDarija(c, all) {
    var wrong = sample(all.filter(function (x) { return x.ar !== c.ar; }), 3);
    if (wrong.length < 3) return null;
    return {
      kind: 'pick-darija', card: c,
      prompt: c.en, promptSub: 'Which is the Tetouani form?',
      options: shuffle([c].concat(wrong)).map(function (x) {
        return { ar: x.ar, phon: x.phon, correct: x.id === c.id };
      })
    };
  }
  function qPickEnglish(c, all) {
    var wrong = sample(all.filter(function (x) { return x.en !== c.en; }), 3);
    if (wrong.length < 3) return null;
    return {
      kind: 'pick-english', card: c,
      promptAr: c.ar, promptPhon: c.phon, promptSub: 'What does it mean?',
      options: shuffle([c].concat(wrong)).map(function (x) {
        return { text: x.en, correct: x.id === c.id };
      })
    };
  }
  function qPicture(c, all) {
    if (!PICTURES[c.id]) return null;
    var wrong = sample(all.filter(function (x) { return x.ar !== c.ar; }), 3);
    if (wrong.length < 3) return null;
    return {
      kind: 'picture', card: c,
      emoji: PICTURES[c.id], promptSub: 'Say it, then pick it.',
      options: shuffle([c].concat(wrong)).map(function (x) {
        return { ar: x.ar, phon: x.phon, correct: x.id === c.id };
      })
    };
  }
  /* the one that matters most: can he tell Tetouani from national? */
  function qTetouani(c) {
    if (!c.national) return null;
    return {
      kind: 'tetouani', card: c,
      prompt: c.en, promptSub: 'Which one would a Tetouani say?',
      options: shuffle([
        { ar: c.ar, phon: c.phon, correct: true, tag: 'Tetouani' },
        { ar: c.national.ar, phon: c.national.phon, correct: false, tag: 'National' }
      ]),
      explain: c.national.note || ''
    };
  }
  function qFusha(c, all) {
    if (!c.fusha) return null;
    var wrong = sample(all.filter(function (x) { return x.fusha && x.fusha.ar !== c.fusha.ar; }), 3);
    if (wrong.length < 3) return null;
    return {
      kind: 'fusha', card: c,
      promptAr: c.ar, promptPhon: c.phon,
      promptSub: 'Which Classical Arabic word is this from?',
      options: shuffle([c].concat(wrong)).map(function (x) {
        return { ar: x.fusha.ar, phon: x.fusha.translit, correct: x.id === c.id };
      }),
      explain: c.fusha.gloss
    };
  }
  function qGap(line, sit, all) {
    var full = line.mix[line.mix.length - 1];
    var chunks = full.filter(function (p) { return typeof p === 'object'; });
    if (!chunks.length) return null;
    var target = chunks[Math.floor(Math.random() * chunks.length)];
    var wrong = sample(all.filter(function (x) { return x.ar !== target.ar; }), 3);
    if (wrong.length < 3) return null;
    return {
      kind: 'gap', sit: sit,
      parts: full, blankAr: target.ar,
      promptSub: sit.icon + ' ' + sit.title + ' — fill the gap',
      en: line.en,
      options: shuffle([{ ar: target.ar, phon: target.d, correct: true }].concat(
        wrong.map(function (x) { return { ar: x.ar, phon: x.phon, correct: false }; })))
    };
  }
  /* mind map — which word belongs under this theme?
     Builds the semantic cluster instead of drilling word-by-word. */
  function qCluster(sit, all) {
    var inSit = {};
    sit.lines.forEach(function (l) {
      l.mix[l.mix.length - 1].forEach(function (p) { if (typeof p === 'object') inSit[p.ar] = p.d; });
    });
    var belongs = all.filter(function (c) { return inSit[c.ar]; });
    if (!belongs.length) return null;
    var target = belongs[Math.floor(Math.random() * belongs.length)];
    var outside = all.filter(function (c) { return !inSit[c.ar] && c.ar !== target.ar; });
    var wrong = sample(outside, 3);
    if (wrong.length < 3) return null;
    return {
      kind: 'cluster', card: target, sit: sit,
      emoji: sit.icon, prompt: sit.title,
      promptSub: 'Which one belongs to this scene?',
      branches: belongs.slice(0, 4).map(function (c) { return c.phon; }),
      options: shuffle([target].concat(wrong)).map(function (x) {
        return { ar: x.arv || x.ar, phon: x.phon, correct: x.id === target.id };
      }),
      explain: 'It belongs to ' + sit.title + '.'
    };
  }

  /* match four pictures to four words in one screen */
  function qMatch(all) {
    var pics = all.filter(function (c) { return PICTURES[c.id]; });
    if (pics.length < 4) return null;
    var four = sample(pics, 4);
    if (four.length < 4) return null;
    return {
      kind: 'match', cards: four,
      promptSub: 'Tap a picture, then its word',
      pics: four.map(function (c) { return { id: c.id, emoji: PICTURES[c.id] }; }),
      words: shuffle(four.slice()).map(function (c) { return { id: c.id, phon: c.phon, ar: c.arv || c.ar }; })
    };
  }

  function qSpeak(c) {
    return { kind: 'speak', card: c, prompt: c.en, promptSub: 'Say it out loud, then check yourself.',
             answerAr: c.ar, answerPhon: c.phon };
  }

  /* ---------- the test definitions ---------- */
  var TESTS = [
    { id: 'quickfire', icon: '⚡', title: 'Quickfire 10', size: 10,
      blurb: 'Ten mixed questions from everything he has met. The default warm-up.',
      build: function (cards) {
        var all = cards, out = [];
        shuffle(cards.slice()).forEach(function (c) {
          if (out.length >= 10) return;
          var makers = [qPickDarija, qPickEnglish, qFusha];
          var q = makers[Math.floor(Math.random() * makers.length)](c, all);
          if (q) out.push(q);
        });
        return out;
      } },

    { id: 'pictures', icon: '🖼️', title: 'Picture round', size: 8,
      blurb: 'A picture, no English. Say the word before you pick it.',
      build: function (cards) {
        var all = cards;
        return shuffle(cards.filter(function (c) { return PICTURES[c.id]; }))
          .slice(0, 8).map(function (c) { return qPicture(c, all); }).filter(Boolean);
      } },

    { id: 'tetouani', icon: '🎯', title: 'Tetouani or national?', size: 9,
      blurb: 'Two real forms, one Tetouani. The test that matters most for this course.',
      build: function (cards) {
        return shuffle(cards.filter(function (c) { return c.national; }))
          .map(qTetouani).filter(Boolean).slice(0, 9);
      } },

    { id: 'roots', icon: '📜', title: 'Classical roots', size: 8,
      blurb: 'Match the Tetouani word to the Classical Arabic it came from.',
      build: function (cards) {
        var all = cards;
        return shuffle(cards.filter(function (c) { return c.fusha; }))
          .slice(0, 8).map(function (c) { return qFusha(c, all); }).filter(Boolean);
      } },

    { id: 'gaps', icon: '🧩', title: 'Fill the gap', size: 8,
      blurb: 'A real line from a real scene, with one word missing.',
      build: function (cards) {
        var out = [];
        shuffle(D.situations.slice()).forEach(function (s) {
          shuffle(s.lines.slice()).forEach(function (l) {
            if (out.length >= 8) return;
            var q = qGap(l, s, cards);
            if (q) out.push(q);
          });
        });
        return out;
      } },

    { id: 'mindmap', icon: '🕸️', title: 'Mind map', size: 8,
      blurb: 'A scene in the middle, four words around it. Pick the one that belongs.',
      build: function (cards) {
        return shuffle(D.situations.slice()).map(function (s2) { return qCluster(s2, cards); })
          .filter(Boolean).slice(0, 8);
      } },

    { id: 'match', icon: '🧠', title: 'Match the pictures', size: 5,
      blurb: 'Four pictures, four words, pair them up. No English at all.',
      build: function (cards) {
        var out = [];
        for (var i = 0; i < 5; i++) { var q = qMatch(cards); if (q) out.push(q); }
        return out;
      } },

    { id: 'speak', icon: '🗣️', title: 'Say it out loud', size: 10,
      blurb: 'No multiple choice. Say it, reveal, mark yourself honestly. This is a spoken language.',
      build: function (cards) {
        return shuffle(cards.slice()).slice(0, 10).map(qSpeak);
      } }
  ];

  function byId(id) {
    for (var i = 0; i < TESTS.length; i++) if (TESTS[i].id === id) return TESTS[i];
    return null;
  }
  function build(id) {
    var t = byId(id);
    if (!t) return null;
    var qs = t.build(pool()).filter(Boolean);
    return { test: t, questions: qs };
  }

  /* ---------- score history ---------- */
  function results(id) {
    var raw = Store.get('testres:' + id, null);
    if (!raw) return [];
    try { return typeof raw === 'string' ? JSON.parse(raw) : raw; } catch (e) { return []; }
  }
  function record(id, score, total, dateStr) {
    var list = results(id);
    list.push({ score: score, total: total, date: dateStr });
    if (list.length > 40) list = list.slice(-40);
    Store.set('testres:' + id, list);
  }
  function best(id) {
    return results(id).reduce(function (m, r) {
      return Math.max(m, Math.round(r.score / Math.max(1, r.total) * 100));
    }, 0);
  }
  function last(id) {
    var l = results(id);
    return l.length ? l[l.length - 1] : null;
  }

  window.Tests = {
    list: TESTS, byId: byId, build: build,
    results: results, record: record, best: best, last: last,
    pictures: PICTURES
  };
})();
