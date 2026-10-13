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

  /* drawn pictures for concrete words: one symbol per word in the site's own
     icon set (index.html), so the picture tests look like TetouTalk and not
     like a phone keyboard. Still no image files: the site stays offline-
     capable and instant. */
  var PICTURES = {
    'w2-n1': 'p-1',
    'w2-n2': 'p-2',
    'w2-n3': 'p-3',
    'w2-n4': 'p-4',
    'w2-n5': 'p-5',
    'w2-n6': 'p-6',
    'w2-n7': 'p-7',
    'w2-n8': 'p-8',
    'w2-n9': 'p-9',
    'w2-n10': 'p-10',
    'w2-sa3a': 'p-clock',
    'w2-nos': 'p-half',
    'w2-simana': 'p-week',
    'w2-daba': 'p-now',
    'w3-limen': 'p-right',
    'w3-shmal': 'p-left',
    'w3-nishan': 'p-straight',
    'w3-taxi': 'p-taxi',
    'w3-blaya': 'p-beach',
    'w3-medina': 'p-medina',
    'w3-tla3': 'p-up',
    'w3-hawwed': 'p-down',
    'w3-taqa': 'p-window',
    'w3-hawma': 'p-houses',
    'w3-hna': 'p-here',
    'x-kuzina': 'p-kitchen',
    'x-kama': 'p-bed',
    'x-rwida': 'p-wheel',
    'x-manta': 'p-blanket',
    'x-kurda': 'p-rope',
    'x-bokadyo': 'p-sandwich',
    'x-paiya': 'p-paella',
    'x-buskuchu': 'p-cake',
    'x-qtayef': 'p-pancake',
    'w1-3ayel': 'p-child',
    'w2-yes': 'p-yes',
    'w2-no': 'p-no',
    'w1-hello': 'p-wave',
    'w1-bye': 'p-wave',
    'w1-thanks': 'p-thanks',
    'w2-ghali': 'p-money',
    'w2-lma': 'p-water',
    'w2-khobz': 'p-bread',
    'w2-atay': 'p-tea',
    'w2-qahwa': 'p-coffee',
    'w2-lyum': 'p-today',
    'w2-ghedda': 'p-tomorrow',
    'w2-bzaf': 'p-more',
    'w2-shwiya': 'p-less',
    'w2-3yyan': 'p-tired',
    'w2-mrid': 'p-sick',
    'w2-fer7an': 'p-happy',
    'w2-jay3': 'p-hungry',
    'w2-mzewwej': 'p-ring',
    'w1-hammam': 'p-bath',
    'w1-drari': 'p-family',
    'w1-weldi': 'p-boy',
    'w1-jara': 'p-houses',
    'w1-khti': 'p-woman',
    'w1-khoya': 'p-man',
    'w1-lalla': 'p-lalla',
    'w1-sidi': 'p-sidi',
    'w1-mabruk': 'p-party',
    'w1-bsahha': 'p-yum',
    'w1-llahyshafi': 'p-pill',
    'w1-mezyan': 'p-thumb',
    'w1-mafhemtsh': 'p-shrug',
    'w1-bshwiya': 'p-slow',
    'w3-shkun': 'p-who',
    'w3-3lash': 'p-why',
    'w2-kayn': 'p-there',
    'w2-makaynsh': 'p-none',
    'w1-rajli': 'p-husband',
    'w1-mrati': 'p-wife'
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
      promptSub: sit.title + ' — fill the gap',
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
    { id: 'quickfire', group: 'quick', icon: 'i-lantern', title: 'Quickfire 10', size: 10,
      blurb: 'Ten mixed questions from everything you have met. The default warm-up.',
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

    { id: 'pictures', group: 'pictures', icon: 'i-picture', title: 'Picture round', size: 8,
      blurb: 'A picture, no English. Say the word before you pick it.',
      build: function (cards) {
        var all = cards;
        return shuffle(cards.filter(function (c) { return PICTURES[c.id]; }))
          .slice(0, 8).map(function (c) { return qPicture(c, all); }).filter(Boolean);
      } },

    { id: 'tetouani', group: 'ear', icon: 'i-twoarch', title: 'Tetouani or national?', size: 9,
      blurb: 'Two real forms, one Tetouani. The test that matters most for this course.',
      build: function (cards) {
        return shuffle(cards.filter(function (c) { return c.national; }))
          .map(qTetouani).filter(Boolean).slice(0, 9);
      } },

    { id: 'roots', group: 'ear', icon: 'i-scroll', title: 'Classical roots', size: 8,
      blurb: 'Match the Tetouani word to the Classical Arabic it came from.',
      build: function (cards) {
        var all = cards;
        return shuffle(cards.filter(function (c) { return c.fusha; }))
          .slice(0, 8).map(function (c) { return qFusha(c, all); }).filter(Boolean);
      } },

    { id: 'gaps', group: 'sentences', icon: 'i-gap', title: 'Fill the gap', size: 8,
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

    { id: 'mindmap', group: 'sentences', icon: 'i-net', title: 'Mind map', size: 8,
      blurb: 'A scene in the middle, four words around it. Pick the one that belongs.',
      build: function (cards) {
        return shuffle(D.situations.slice()).map(function (s2) { return qCluster(s2, cards); })
          .filter(Boolean).slice(0, 8);
      } },

    { id: 'match', group: 'pictures', icon: 'i-fields', title: 'Match the pictures', size: 5,
      blurb: 'Four pictures, four words, pair them up. No English at all.',
      build: function (cards) {
        var out = [];
        for (var i = 0; i < 5; i++) { var q = qMatch(cards); if (q) out.push(q); }
        return out;
      } },

    { id: 'speak', group: 'sentences', icon: 'i-say', title: 'Say it out loud', size: 10,
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
  /* A NEW list, never the stored one pushed onto. The sync layer finds what to
     upload by comparing the stored list before and after this write; a list
     changed in place has no "before", so the second result of a session never
     left the device. And nothing is dropped: this used to keep only the last
     40, which made the history shorter every time it grew. */
  function record(id, score, total, dateStr) {
    var rec = {
      id: (window.DB && DB.uuid) ? DB.uuid() : 'r-' + Date.now() + '-' + Math.random().toString(16).slice(2, 8),
      score: score, total: total, date: dateStr,
      at: new Date().toISOString()
    };
    Store.set('testres:' + id, results(id).concat([rec]));
  }
  /* When a result happened, for ordering only: its timestamp, else its day,
     else unknown. A list that has been through the server comes back ordered
     by id, not by time, so "the last one" is found by reading the times, never
     by position or by reordering the stored list. */
  function when(r) {
    if (!r) return -Infinity;
    var t = Date.parse(r.at);
    if (isNaN(t)) t = Date.parse(r.date);
    return isNaN(t) ? -Infinity : t;
  }
  function newest(list) {
    var best = null, bt = -Infinity;
    for (var i = 0; i < list.length; i++) {
      var t = when(list[i]);
      if (best === null || t >= bt) { best = list[i]; bt = t; }   /* ties: the later one, as before */
    }
    return best;
  }
  function best(id) {
    return results(id).reduce(function (m, r) {
      return Math.max(m, Math.round(r.score / Math.max(1, r.total) * 100));
    }, 0);
  }
  function last(id) { return newest(results(id)); }

  window.Tests = {
    list: TESTS, byId: byId, build: build,
    results: results, record: record, best: best, last: last,
    pictures: PICTURES
  };
})();
