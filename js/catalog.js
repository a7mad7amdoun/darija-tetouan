/* ---------------------------------------------------------------------------
   THE CATALOG — every word, sentence and situation, by the field of life it
   belongs to. "Where do you want your vocabulary from?"

   Nothing here is new content. A field is a grouping of the course's own
   word groups (card.group, written by the course authors), and a sentence or
   situation joins a field when it uses that field's words. The mapping is
   display only: no card, sentence or ID is changed, and every card lands in
   exactly one field (tests/catalog.js checks it). A group the mapping does not
   know goes to "Everyday words", never dropped.
   --------------------------------------------------------------------------- */
(function () {
  var D = function () { return window.DARIJA || {}; };
  var E = function (s) { return UI.esc(s); };

  var FIELDS = [
    { id: 'people', icon: 'i-user', title: 'Greetings & people', tint: 'mint',
      blurb: 'Meeting someone, politeness, family, being a guest.',
      groups: ['Greetings & politeness', 'Introducing yourself', 'Small talk', 'Respect & faith',
               'People & family', 'Family', 'Describing people', 'Being a guest'],
      situations: ['neighbour'] },
    { id: 'food', icon: 'i-talk', title: 'Café, food & market', tint: 'sand',
      blurb: 'Ordering, buying, haggling, the market and the table.',
      groups: ['Food & drink', 'Café & ordering', 'At the market', 'Haggling', 'Shopping & prices', 'Quantities'],
      situations: ['cafe', 'shop', 'market'] },
    { id: 'numbers', icon: 'i-chart', title: 'Numbers, money & time', tint: 'sky',
      blurb: 'Counting, prices, the clock, arranging to meet.',
      groups: ['Numbers', 'Time', 'When things happen', 'Talking about past time', 'Making arrangements'],
      situations: ['time'] },
    { id: 'around', icon: 'i-compass', title: 'Getting around Tetouan', tint: 'lilac',
      blurb: 'Directions, taxis, the places of the city.',
      groups: ['Directions', 'Getting around', 'Places in Tetouan'],
      situations: ['taxi', 'street'] },
    { id: 'home', icon: 'i-home', title: 'Home & health', tint: 'mint',
      blurb: 'The house, how you feel, when something goes wrong.',
      groups: ['Around the house', 'The house', 'Health', 'How you feel', 'When something goes wrong'],
      situations: [] },
    { id: 'talk', icon: 'i-convo', title: 'Keeping a conversation going', tint: 'sky',
      blurb: 'Opinions, questions, agreeing, and what to say when you are stuck.',
      groups: ['Saying what you think', 'Keeping a conversation going', 'When you are stuck',
               'Question words', 'Yes, no & agreeing'],
      situations: ['repair'] },
    { id: 'verbs', icon: 'i-layers', title: 'Verbs & tenses', tint: 'sand',
      blurb: 'What you do, did and will do, in order.',
      groups: ['Everyday verbs', 'The past — what I did', 'The future', 'Putting events in order'],
      situations: [] },
    { id: 'glue', icon: 'i-words', title: 'Describing & joining', tint: 'lilac',
      blurb: 'Describing things, comparing, and the small words that join ideas.',
      groups: ['Describing things', 'Comparing', 'Joining ideas', 'Everyday words'],
      situations: [] }
  ];
  var FALLBACK = 'glue';

  function fieldOfGroup(group) {
    for (var i = 0; i < FIELDS.length; i++) if (FIELDS[i].groups.indexOf(group) >= 0) return FIELDS[i].id;
    return FALLBACK;
  }
  function byId(id) { return FIELDS.filter(function (f) { return f.id === id; })[0] || null; }

  /* a word's bare shape, for matching a sentence chunk to a card:
     "a-TAY" and "atay" are the same word */
  function bare(s) { return String(s || '').toLowerCase().replace(/[^a-z0-9ʿʾ3']/g, ''); }

  function contents(fieldId) {
    var f = byId(fieldId);
    if (!f) return null;
    var cards = UI.allActiveCards().filter(function (c) { return fieldOfGroup(c.group) === f.id; });
    var forms = {};
    cards.forEach(function (c) { var b = bare(c.phon); if (b.length >= 3) forms[b] = 1; });
    var sentences = UI.allSentences().filter(function (s) {
      return (s.parts || []).some(function (p) { return forms[bare(p.d)]; });
    });
    var sits = (D().situations || []).filter(function (s) { return f.situations.indexOf(s.id) >= 0; });
    return { field: f, cards: cards, sentences: sentences, situations: sits };
  }

  function counts() {
    return FIELDS.map(function (f) {
      var c = contents(f.id);
      var seen = c.cards.filter(function (x) { return Store.get('seen:' + x.id, false); }).length;
      return { field: f, words: c.cards.length, seen: seen, sentences: c.sentences.length, situations: c.situations.length };
    });
  }

  /* ---------- views ---------- */
  function fieldTile(x) {
    var f = x.field;
    var pct = x.words ? Math.round(x.seen / x.words * 100) : 0;
    return '<a class="fieldtile ' + E(f.tint) + '" href="#/catalog/' + E(f.id) + '">' +
      '<span class="ficon"><svg class="ico" aria-hidden="true"><use href="#' + E(f.icon) + '"/></svg></span>' +
      '<span class="ftitle">' + E(f.title) + '</span>' +
      '<span class="fblurb">' + E(f.blurb) + '</span>' +
      '<span class="fmeta">' + x.words + ' words · ' + x.sentences + ' sentence' + (x.sentences === 1 ? '' : 's') +
        (x.situations ? ' · ' + x.situations + ' situation' + (x.situations === 1 ? '' : 's') : '') + '</span>' +
      '<span class="fbar" aria-label="' + x.seen + ' of ' + x.words + ' words met"><span style="width:' + pct + '%"></span></span>' +
      '<span class="fmet">' + (x.seen ? x.seen + ' of ' + x.words + ' met' : 'not started') + '</span>' +
      '</a>';
  }

  function catalogView() {
    var cs = counts();
    var total = cs.reduce(function (n, x) { return n + x.words; }, 0);
    var h = UI.banner('vocab') + '<h1>Fields</h1>' +
      '<p class="sub">Where do you want your words from? Every one of the course’s ' + total +
      ' words belongs to one of these eight fields, with its sentences and situations. Pick a field, ' +
      'read it, then practise just that.</p>';
    h += '<div class="fields">' + cs.map(fieldTile).join('') + '</div>';
    h += '<p class="muted" style="margin-top:18px;font-size:13.5px">The fields are a way of looking at the course, not a ' +
         'second course: the daily session still chooses what comes next.</p>';
    return h;
  }

  function fieldView(id) {
    var c = contents(id);
    if (!c) return '<p class="empty">No such field.</p>';
    var f = c.field;
    var seen = c.cards.filter(function (x) { return Store.get('seen:' + x.id, false); }).length;
    var h = '<div class="crumb"><a href="#/catalog">Fields</a></div>';
    h += '<section class="fieldhead ' + E(f.tint) + '">' +
      '<span class="ficon"><svg class="ico" aria-hidden="true"><use href="#' + E(f.icon) + '"/></svg></span>' +
      '<div><h1>' + E(f.title) + '</h1><p class="sub">' + E(f.blurb) + '</p>' +
      '<p class="fstat">' + c.cards.length + ' words, ' + seen + ' met · ' + c.sentences.length + ' sentences · ' +
        c.situations.length + ' situations</p></div></section>';

    h += '<div class="fieldacts">' +
      '<a class="btn primary" href="#/practice?set=f:' + E(f.id) + '">Flashcards for this field</a>' +
      '<a class="btn" href="#/games?field=' + E(f.id) + '">Games on this field</a></div>';

    if (c.situations.length) {
      h += '<h2>Situations</h2><div class="tiles">' + c.situations.map(function (s) {
        return '<a class="tile" href="#/situations/' + E(s.id) + '"><span class="ticon">' + s.icon + '</span>' +
          '<span class="ttitle">' + E(s.title) + '</span><span class="tsub">' + E(s.when) + '</span></a>';
      }).join('') + '</div>';
    }

    if (window.Notes) Notes.forField(f.id).forEach(function (n) { h += Notes.card(n, { inField: true }); });

    h += '<h2>Words</h2>';
    var groups = {};
    c.cards.forEach(function (x) { (groups[x.group] = groups[x.group] || []).push(x); });
    f.groups.concat(Object.keys(groups).filter(function (g) { return f.groups.indexOf(g) < 0; })).forEach(function (g) {
      var list = groups[g]; if (!list || !list.length) return;
      h += '<details class="vsection" open><summary><span class="sectitle">' + E(g) + '</span>' +
        '<span class="seccount">' + list.length + '</span></summary><div class="secbody">' +
        list.map(function (x) { return UI.vocabCard(x); }).join('') + '</div></details>';
    });

    if (c.sentences.length) {
      h += '<h2>Sentences that use these words</h2><div class="fsents">' + c.sentences.map(function (s) {
        return '<div class="scard"><p class="en">' + E(s.en) + '</p><p class="say">' + UI.sayHTML(s.phon) + '</p>' +
          UI.arabic(s.arv || s.ar) + (s.use ? '<p class="vuse">' + E(s.use) + '</p>' : '') + '</div>';
      }).join('') + '</div>';
    }
    return h;
  }

  window.Catalog = { FIELDS: FIELDS, fieldOfGroup: fieldOfGroup, contents: contents, counts: counts,
                     bare: bare, byId: byId, view: catalogView, field: fieldView };
})();
