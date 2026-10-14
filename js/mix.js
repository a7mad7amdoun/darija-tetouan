/* ---------------------------------------------------------------------------
   DARIJA AND FUSHA, SIDE BY SIDE.

   Every card in the course carries, beside its Tetouani form, the Classical
   / Modern Standard Arabic form it relates to (card.fusha: the Arabic, a
   transliteration, and a one-line gloss written by the course). Tetouanis
   read and write Fusha at school and hear it on the news; they speak Darija.
   This page puts the two next to each other for every word, so the learner
   sees the mix instead of being confused by it. Nothing here is new content;
   it is the course's own data read a second way. Reading it writes nothing.
   --------------------------------------------------------------------------- */
(function () {
  var E = function (s) { return UI.esc(s); };
  var bare = function (s) { return String(s || '').replace(/[ً-ْٰـ]/g, '').replace(/\s+/g, ' ').trim(); };
  var state = { q: '' };

  function rows() {
    return UI.allActiveCards().filter(function (c) { return c.fusha && c.fusha.ar; }).map(function (c) {
      var f = UI.formFor(c);
      return { card: c, form: f, same: bare(c.fusha.ar) === bare(f.ar) };
    });
  }
  function matches(r, q) {
    if (!q) return true;
    var hay = [r.card.en, r.form.phon, r.form.ar, r.form.arv, r.card.fusha.ar, r.card.fusha.translit, r.card.fusha.gloss, r.card.group].join(' ').toLowerCase();
    return hay.indexOf(q) >= 0 || bare(hay).indexOf(bare(q)) >= 0;
  }

  function rowHTML(r) {
    var c = r.card, f = r.form, fu = c.fusha;
    return '<article class="mixrow' + (r.same ? ' same' : '') + '">' +
      '<p class="men">' + E(c.en) + '</p>' +
      '<div class="mixcols">' +
        '<div class="mixcol tet"><span class="crumb">Tetouan says</span><p class="say">' + UI.sayHTML(f.phon) + '</p>' +
          '<p class="ar" lang="ary" dir="rtl">' + E(f.arv || f.ar) + '</p></div>' +
        '<div class="mixcol fus"><span class="crumb">Fusha writes</span><p class="say fuslat">' + E(fu.translit || '') + '</p>' +
          '<p class="ar" lang="ar" dir="rtl">' + E(fu.ar) + '</p></div>' +
      '</div>' +
      (fu.gloss ? '<p class="mixgloss">' + E(fu.gloss) + '</p>' : '') +
      '<p class="mixmeta">' + (r.same ? 'The same word in both' : 'A different word, or a changed one') + ' · ' + E(c.group) + '</p>' +
      '</article>';
  }

  function view(q) {
    if (typeof q === 'string') state.q = q.trim().toLowerCase();
    var all = rows(), diff = all.filter(function (r) { return !r.same; }).length;
    var list = all.filter(function (r) { return matches(r, state.q); });
    var h = UI.banner('dialect') + '<h1>Darija and Fusha</h1>' +
      '<p class="sub">Every word in the course beside the Fusha it relates to: ' + all.length + ' words, ' + diff +
      ' a different word or a changed one, ' + (all.length - diff) + ' the same in both.</p>' +
      '<details class="fold tight"><summary>Why both</summary><p class="muted" style="margin:10px 0 0">Tetouanis read and write Fusha, the Arabic of school, books and the news. They speak Darija. ' +
      'Seeing the two side by side shows the mix instead of letting it confuse you. The Fusha forms and glosses are the course\u2019s own notes on each card.</p></details>';
    h += '<form class="findword" id="mixfind" role="search"><label for="mixq">Find a word</label>' +
      '<div class="findrow"><input id="mixq" type="search" autocomplete="off" autocorrect="off" autocapitalize="none" spellcheck="false" ' +
      'value="' + E(state.q) + '" placeholder="English, Darija, Arabic or Fusha"><button class="btn" type="submit">Find</button></div></form>';
    h += '<p class="vscope" aria-live="polite">' + list.length + ' of ' + all.length + (state.q ? ' match “' + E(state.q) + '”' : '') + '</p>';
    /* by month, then by the card's own group, the course's order */
    UI.activeCourses().forEach(function (course) {
      var mine = list.filter(function (r) { return r.card.courseId === course.id; });
      if (!mine.length) return;
      h += '<h2 class="libsec">' + E(course.label) + '<small>' + mine.length + '</small></h2>';
      var groups = {}; var order = [];
      mine.forEach(function (r) { if (!groups[r.card.group]) { groups[r.card.group] = []; order.push(r.card.group); } groups[r.card.group].push(r); });
      order.forEach(function (g) {
        h += '<details class="vsection"' + (state.q ? ' open' : '') + '><summary><span class="sectitle">' + E(g) + '</span><span class="seccount">' + groups[g].length + '</span></summary>' +
          '<div class="secbody mixbody">' + groups[g].map(rowHTML).join('') + '</div></details>';
      });
    });
    if (!list.length) h += '<p class="empty">Nothing matches. Try the English, or a few letters of the Darija.</p>';
    h += '<p class="muted" style="font-size:13.5px;margin-top:18px">The Fusha forms and the glosses are the course’s own notes on each card. ' +
      'For the sounds and grammar that set Tetouani apart from the rest of Morocco, see the <a href="#/dialect">Tetouani guide</a>.</p>';
    return h;
  }

  window.Mix = { view: view, rows: rows, setQuery: function (q) { state.q = String(q || '').trim().toLowerCase(); } };
})();
