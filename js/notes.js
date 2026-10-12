/* A short, sourced note about Tetouan: one on Home (a different one each day),
   and each field's own notes on its page. Reading one writes nothing. */
(function () {
  var E = function (s) { return UI.esc(s); };
  function all() { return (window.DARIJA && DARIJA.tetouanNotes) || []; }
  function todays() {
    var n = all(); if (!n.length) return null;
    var d = Sched.todayStr(), day = Math.round(Date.parse(d + 'T12:00:00') / 86400000);
    return n[((day % n.length) + n.length) % n.length];
  }
  function forField(fieldId) { return all().filter(function (x) { return x.field === fieldId; }); }
  function card(x, opts) {
    if (!x) return '';
    opts = opts || {};
    var g = (window.DARIJA.gallery || {})[x.photo], ph = (window.DARIJA.photos || {})[x.photo];
    var ge = window.Gallery && g ? Gallery.entry(x.photo) : null;
    var img = ge ? '<button type="button" class="notephoto" data-photo="' + E(x.photo) + '" aria-label="Open the photograph">' +
      '<img src="' + E(ge.md) + '" alt="' + E(ph ? ph.alt : x.title) + '" loading="lazy" decoding="async"' +
      (ph ? ' style="object-position:' + E(ph.focal || '50% 50%') + '"' : '') + '></button>' : '';
    var f = window.Catalog && Catalog.byId(x.field);
    return '<aside class="note' + (opts.compact ? ' compact' : '') + '">' + img + '<div class="notebody">' +
      '<span class="crumb">Tetouan</span><h3>' + E(x.title) + '</h3><p>' + E(x.text) + '</p>' +
      (x.tie ? '<p class="notetie">' + E(x.tie) + (f && !opts.inField ? ' <a href="#/catalog/' + E(f.id) + '">' + E(f.title) + ' →</a>' : '') + '</p>' : '') +
      '<p class="notesrc">Source: <a href="' + E(x.url) + '" target="_blank" rel="noopener">' + E(x.source) + '</a></p>' +
      '</div></aside>';
  }
  window.Notes = { all: all, todays: todays, forField: forField, card: card };
})();
