/* ---------------------------------------------------------------------------
   WEAK SPOTS  —  what to actually teach next, and the evidence behind it.

   The teacher page could already show how many weeks were ticked. That tells
   you someone turned up; it does not tell you what to put in Thursday's lesson.

   This ranks the cards worth teaching next for ONE student, and for each one
   shows the evidence rather than a score: how many recent attempts failed, how
   it was asked, when it was last practised, and - importantly - whether we know
   anything recent at all, or are only looking at a lifetime counter from before
   attempts were recorded. A lifetime lapse count cannot tell you recency, and
   this must never pretend otherwise.

   Ahmed then says what KIND of problem it is, because the app cannot know:
   retrieval, listening, pronunciation, or content that is simply wrong. Those
   observations are appended, never replaced, so the history of what he thought
   in September survives what he thinks in November.

   Everything here reads the selected student's progress through the read-only
   overlay in storage.js. Writes go to the teacher's own shared document under
   'obs:' and 'target:', which the server does not mark student-visible.
   --------------------------------------------------------------------------- */
(function () {
  var E = UI.esc;

  var KINDS = [
    { id: 'retrieval',   label: 'Cannot retrieve it', hint: 'knows it when shown, cannot produce it' },
    { id: 'listening',   label: 'Cannot hear it',     hint: 'confuses it with something that sounds close' },
    { id: 'pronunciation', label: 'Says it wrong',    hint: 'produces it, but not the Tetouani sound' },
    { id: 'content',     label: 'The card is wrong',  hint: 'our text or translation needs fixing' }
  ];

  function obsKey(studentId, cardId) { return 'obs:' + studentId + ':' + cardId; }

  function observations(studentId, cardId) {
    var v = Store.get(obsKey(studentId, cardId), null);
    return Array.isArray(v) ? v : [];
  }

  /* Append, never replace: what he thought last month is evidence too. */
  function observe(studentId, cardId, kind, note) {
    var list = observations(studentId, cardId).concat([{
      id: (window.DB && DB.uuid) ? DB.uuid() : String(Date.now()),
      at: new Date().toISOString(),
      kind: kind || '', note: note || ''
    }]);
    Store.set(obsKey(studentId, cardId), list);
    return list;
  }

  /* the kind of his most recent observation - by its time, not its place in a
     list that may have been merged from two devices */
  function currentKind(studentId, cardId) {
    var best = null, bt = -Infinity;
    observations(studentId, cardId).forEach(function (o) {
      var t = Date.parse(o && o.at); if (isNaN(t)) t = -Infinity;
      if (best === null || t >= bt) { best = o; bt = t; }
    });
    return best ? best.kind : '';
  }

  /* ---- ranking ---- */
  function score(cardId) {
    var s = Attempts.summary(cardId);
    var ev = Attempts.evidence(cardId);
    var sch = Sched.get(cardId);
    var lapses = sch ? (sch.l || 0) : 0;

    /* Dated failures count most, because they are the only thing we know is
       true now. A lifetime counter is a hint, never a ranking. */
    var n = s.recentFailures * 10
          + s.productionFailures * 4
          + lapses * 2
          + (ev === 'historical' ? Math.min(3, (UI.fam(cardId).w || 0)) : 0);

    /* a word being held back for want of production evidence is a teaching
       target even without failures - it is stuck */
    if (Sched.cappedByRecognition && Sched.cappedByRecognition(cardId)) n += 3;
    return n;
  }

  function targets(cards, limit) {
    var scored = cards.map(function (c) { return { card: c, n: score(c.id) }; })
                      .filter(function (x) { return x.n > 0; });
    scored.sort(function (a, b) { return b.n - a.n; });
    return scored.slice(0, limit || 8);
  }

  /* ---- rendering ---- */
  function ago(iso) {
    if (!iso) return 'never';
    var mins = Math.round((Date.now() - new Date(iso).getTime()) / 60000);
    if (mins < 60) return mins + 'm ago';
    var hrs = Math.round(mins / 60);
    if (hrs < 24) return hrs + 'h ago';
    var d = Math.round(hrs / 24);
    if (d < 30) return d + ' day' + (d === 1 ? '' : 's') + ' ago';
    return new Date(iso).toISOString().slice(0, 10);
  }

  function evidenceChip(ev) {
    if (ev === 'recent')     return '<span class="evchip ok">recent evidence</span>';
    if (ev === 'thin')       return '<span class="evchip thin">thin evidence</span>';
    if (ev === 'historical') return '<span class="evchip hist">historical only — no dated attempts</span>';
    return '<span class="evchip none">no evidence</span>';
  }

  function row(studentId, card) {
    var s = Attempts.summary(card.id);
    var ev = Attempts.evidence(card.id);
    var kind = currentKind(studentId, card.id);
    var obs = observations(studentId, card.id);
    var capped = Sched.cappedByRecognition && Sched.cappedByRecognition(card.id);
    var f = UI.formFor(card);

    var h = '<div class="wsrow" data-ws="' + E(card.id) + '">';
    h += '<div class="wshead">' +
           '<div class="wsword"><strong>' + E(card.en) + '</strong>' +
             '<span class="wssay">' + UI.sayHTML(f.phon) + '</span>' +
             '<span class="ar sm" dir="rtl">' + E(f.arv || card.ar) + '</span></div>' +
           evidenceChip(ev) +
         '</div>';

    h += '<div class="wsev">';
    if (ev === 'historical') {
      var fam = UI.fam(card.id);
      h += '<span>' + fam.w + ' wrong of ' + (fam.r + fam.w) + ', lifetime</span>' +
           '<span class="muted">when, and how it was asked, is not recorded for these</span>';
    } else if (ev === 'none') {
      h += '<span class="muted">nothing recorded yet</span>';
    } else {
      h += '<span>' + s.recentFailures + ' failed of ' + s.recent + ' in the last 30 days</span>';
      if (s.production) {
        h += '<span>production: ' + s.productionFailures + ' failed of ' + s.production + '</span>';
      } else {
        h += '<span class="muted">never asked to produce it</span>';
      }
      h += '<span>last practised ' + E(ago(s.lastAt)) + '</span>';
    }
    if (capped) h += '<span class="wsstuck">stuck — recognised but never produced, so the gap cannot grow</span>';
    h += '</div>';

    h += '<div class="wskinds">';
    KINDS.forEach(function (k) {
      h += '<button class="kindbtn' + (kind === k.id ? ' on' : '') + '" ' +
           'data-wskind="' + k.id + '" data-wscard="' + E(card.id) + '" title="' + E(k.hint) + '">' +
           E(k.label) + '</button>';
    });
    h += '</div>';

    if (obs.length) {
      h += '<div class="wsobs">';
      obs.slice().reverse().slice(0, 4).forEach(function (o) {
        h += '<div class="wsob"><span class="wsobwhen">' + E(ago(o.at)) + '</span>' +
             (o.kind ? '<span class="wsobkind">' + E((KINDS.filter(function(x){return x.id===o.kind;})[0]||{}).label || o.kind) + '</span>' : '') +
             (o.note ? '<span class="wsobnote">' + E(o.note) + '</span>' : '') + '</div>';
      });
      if (obs.length > 4) h += '<div class="muted sm">' + (obs.length - 4) + ' earlier observation' +
                               (obs.length - 4 === 1 ? '' : 's') + ' kept.</div>';
      h += '</div>';
    }

    h += '<form class="wsnoteform" data-wscard="' + E(card.id) + '">' +
           '<input name="note" placeholder="What happened in the lesson…" autocomplete="off">' +
           '<button class="btn sm" type="submit">Add</button>' +
         '</form>';
    h += '</div>';
    return h;
  }

  function panel(studentId, studentName, cards) {
    var h = '<h2>What to teach ' + E(studentName || 'them') + ' next</h2><div class="panel">';

    if (!studentId) {
      return h + '<p class="muted" style="margin:0">Pick a student above to see their weak spots. ' +
             'This is per-student, and private to you.</p></div>';
    }
    var list = targets(cards, 8);
    if (!list.length) {
      return h + '<p class="muted" style="margin:0">Nothing is failing yet. Once there are ' +
             'attempts on record, the words worth re-drilling appear here with the evidence ' +
             'behind them.</p></div>';
    }

    h += '<p class="muted" style="margin:0 0 14px">Ranked by recent failures, then by failures ' +
         'when producing it, then by lapses. Words marked <em>historical only</em> come from the ' +
         'old lifetime counters — we know they went wrong, but not when, and not how they were ' +
         'asked. Your notes here are private to you and are never replaced.</p>';
    list.forEach(function (t) { h += row(studentId, t.card); });
    h += '</div>';
    return h;
  }

  window.Weak = {
    KINDS: KINDS, panel: panel, targets: targets, score: score,
    observe: observe, observations: observations, currentKind: currentKind,
    obsKey: obsKey, ago: ago
  };
})();
