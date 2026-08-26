/* Shared renderers. Every page builds vocabulary out of these, so a change to
   the card shape lands everywhere at once. */
(function () {
  var D = window.DARIJA;

  function esc(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function arabic(text, cls) {
    return '<span class="ar' + (cls ? ' ' + cls : '') + '" lang="ary" dir="rtl">' + esc(text) + '</span>';
  }

  /* The phonetics already mark stress with capitals. Make it visible, so the
     eye lands on the loud syllable without anyone having to explain it. */
  function sayHTML(phon) {
    return String(phon == null ? '' : phon).split(/([ \-])/).map(function (tok) {
      if (tok === ' ' || tok === '-' || !tok) return esc(tok);
      var letters = tok.replace(/[^A-Za-z]/g, '');
      if (letters.length >= 2 && letters === letters.toUpperCase()) {
        return '<b class="st">' + esc(tok) + '</b>';
      }
      return esc(tok);
    }).join('');
  }

  /* ---- how well is a card known? fed by the tests ---- */
  function fam(id) {
    var f = Store.get('fam:' + id, null);
    if (!f) return { r: 0, w: 0 };
    try { return typeof f === 'string' ? JSON.parse(f) : f; } catch (e) { return { r: 0, w: 0 }; }
  }
  function markFam(id, correct) {
    if (!id) return;
    var f = fam(id);
    if (correct) f.r++; else f.w++;
    Store.set('fam:' + id, f);
  }
  /* 0 unseen · 1 shaky · 2 getting there · 3 solid */
  function strength(id) {
    var f = fam(id), n = f.r + f.w;
    if (!n) return 0;
    var rate = f.r / n;
    if (rate >= 0.8 && f.r >= 2) return 3;
    if (rate >= 0.5) return 2;
    return 1;
  }
  function strengthDot(id) {
    var s2 = strength(id);
    var label = ['not yet seen', 'shaky', 'getting there', 'solid'][s2];
    return '<span class="sdot s' + s2 + '" title="' + label + '" aria-label="' + label + '">' +
           '<i></i><i></i><i></i></span>';
  }

  function varietyBadge(v) {
    var def = D.varieties[v || 'northern'] || D.varieties.northern;
    return '<span class="badge ' + def.className + '">' + esc(def.label) + '</span>';
  }

  /* flag badge colour follows the flag's status */
  function flagBadges(card) {
    if (!card.flags || !card.flags.length) return '';
    var seen = {};
    return card.flags.map(function (id) {
      var f = D.flags[id];
      if (!f || seen[f.status]) return '';
      seen[f.status] = 1;
      var cls = f.status === 'open' ? 'tag-flag' : (f.status === 'partial' ? 'tag-partial' : 'tag-ok');
      return '<span class="badge ' + cls + '">' + esc(f.label) + '</span>';
    }).join('');
  }

  function flagBoxes(card) {
    if (!card.flags || !card.flags.length) return '';
    return card.flags.map(function (id) {
      var f = D.flags[id];
      if (!f) return '';
      var cls = f.status === 'open' ? 'flagbox' : (f.status === 'partial' ? 'flagbox partial' : 'flagbox ok');
      var icon = f.status === 'open' ? '⚑' : (f.status === 'partial' ? '◐' : '✓');
      var h = '<div class="' + cls + '"><b>' + icon + ' ' + esc(f.title) + '</b>' + esc(f.detail);
      if (f.caveat) h += '<span class="caveat">Still to confirm: ' + esc(f.caveat) + '</span>';
      var res = Store.get('flagres:' + id, '');
      if (res) h += '<span class="caveat confirmed">Confirmed locally: ' + esc(res) + '</span>';
      return h + '</div>';
    }).join('');
  }

  /* teacher's own correction, stored locally, overrides nothing but shows on the card */
  function teacherBox(card) {
    var note = Store.get('cardnote:' + card.id, '');
    if (!note) return '';
    return '<div class="flagbox teacher"><b>✍️ Teacher correction</b>' + esc(note) + '</div>';
  }

  /* the national form — folded; Tetouani is the lesson, this is just context */
  function contrastRow(card) {
    if (!card.national) return '';
    var n = card.national;
    return '<details class="fold natl"><summary>How the rest of Morocco says it</summary>' +
      '<div class="foldbody">' +
      '<p class="say natl">' + sayHTML(n.phon) + '</p>' + arabic(n.ar, 'sec sm') +
      (n.note ? '<p class="cnote">' + esc(n.note) + '</p>' : '') +
      '</div></details>';
  }

  /* how Tetouan-specific is this form? */
  function scopeBadge(card) {
    if (!card.scope) return '';
    var sc = (D.dialect.scopes || {})[card.scope];
    if (!sc) return '';
    return '<span class="badge ' + sc.cls + '">' + esc(sc.label) + '</span>';
  }

  /* Classical Arabic root — folded away; the English gloss is the point */
  function fushaBlock(card) {
    if (!card.fusha) return '';
    var f = card.fusha;
    return '<details class="fold fusha"><summary>Where it comes from in Classical Arabic</summary>' +
      '<div class="foldbody">' + arabic(f.ar, 'fu') +
      (f.translit ? '<p class="translit">' + esc(f.translit) + '</p>' : '') +
      (f.gloss ? '<p class="fgloss">' + esc(f.gloss) + '</p>' : '') +
      '</div></details>';
  }

  var FREQ = {
    core:   { label: 'Everyday', cls: 'freq-core' },
    useful: { label: 'Useful',   cls: 'freq-useful' },
    extra:  { label: 'Extra',    cls: 'freq-extra' }
  };

  /* Full vocabulary card.
     Order follows the teaching priority: English first, then the Latin-letter
     form he actually says, then the Arabic he can read but not yet parse.
     Classical Arabic and the national form are present but folded away — they
     are reference, not the lesson. */
  function vocabCard(card, opts) {
    opts = opts || {};
    var openFlag = (card.flags || []).some(function (id) {
      return D.flags[id] && D.flags[id].status === 'open';
    });
    var cls = 'vcard' + (openFlag ? ' flagged' : '') + (card.marker ? ' marker' : '');
    var h = '<article class="' + cls + '" id="c-' + esc(card.id) + '">';

    if (card.marker) {
      var scm = (D.dialect.scopes || {})[card.scope];
      h += '<div class="markerflag">★ ' + esc(scm ? scm.label : 'Tetouani') + '</div>';
    }

    /* 1 — English */
    h += '<p class="en">' + esc(card.en) + '</p>';

    /* 2 — say it: Latin letters, the primary form */
    var pf = formFor(card);
    h += '<p class="say">' + sayHTML(pf.phon) + '</p>';

    /* 3 — Arabic with harakat, so it can actually be read */
    h += arabic(pf.arv || pf.ar, 'sec');

    /* both gendered forms when the speaker's gender changes the word */
    h += speakerForms(card);

    /* 4 — English explanation */
    if (card.use) h += '<p class="vuse">' + esc(card.use) + '</p>';
    if (card.notes) h += '<p class="vnotes">' + esc(card.notes) + '</p>';

    h += '<div class="vmeta">' + strengthDot(card.id);
    if (card.freq && FREQ[card.freq]) h += '<span class="badge ' + FREQ[card.freq].cls + '">' + FREQ[card.freq].label + '</span>';
    h += scopeBadge(card);
    if (card.formality) h += '<span class="badge tag-formality">' + esc(card.formality) + '</span>';
    if (card.group) h += '<span class="badge tag-formality">' + esc(card.group) + '</span>';
    h += flagBadges(card);
    if (opts.teacher && card.source === 'draft') h += '<span class="badge tag-draft">draft</span>';
    if (opts.teacher && card.source === 'research') h += '<span class="badge tag-draft">researched</span>';
    h += '</div>';

    /* example — Latin first here too */
    if (card.example) {
      h += '<div class="vex"><div class="crumb">Example</div>' +
           '<p class="say sm">' + sayHTML(card.example.phon) + '</p>' +
           arabic(card.example.arv || card.example.ar, 'sec sm') +
           '<p class="exen">' + esc(card.example.en) + '</p></div>';
    }

    /* folded reference — priority 3 and 4 */
    h += fushaBlock(card);
    h += contrastRow(card);

    h += flagBoxes(card);
    h += teacherBox(card);

    if (opts.teacher) {
      h += '<div class="cardedit"><label>Teacher correction / note for this card' +
           '<textarea class="notes sm" data-store-text="cardnote:' + esc(card.id) + '" ' +
           'placeholder="What a local actually said…">' + esc(Store.get('cardnote:' + card.id, '')) + '</textarea></label></div>';
    }
    return h + '</article>';
  }

  /* Every card in a course, weeks + extras + the teacher's own additions. */
  function allCards(course) {
    var out = [];
    (course.weeks || []).forEach(function (w) {
      (w.vocab || []).forEach(function (c) {
        out.push(Object.assign({}, c, { week: w.number, courseId: course.id }));
      });
    });
    (course.extras || []).forEach(function (c) {
      out.push(Object.assign({}, c, { week: null, courseId: course.id }));
    });
    customCards().forEach(function (c) { out.push(c); });
    return out;
  }

  /* teacher-added cards, kept in localStorage so no code edit is needed */
  function customCards() {
    var raw = Store.get('customCards', null);
    if (!raw) return [];
    try {
      return (typeof raw === 'string' ? JSON.parse(raw) : raw).map(function (c) {
        return Object.assign({ variety: 'northern', source: 'teacher', week: null, custom: true }, c);
      });
    } catch (e) { return []; }
  }
  function saveCustomCards(list) { Store.set('customCards', list); }

  function activeCourses() {
    return D.courses.filter(function (c) { return c.status === 'active'; });
  }

  /* --- progress maths, shared by Home / Week / Progress / Teacher --- */
  function weekProgress(courseId, week) {
    var days = (week.days || []).filter(function (d) { return !d.rest; });
    var daysDone = days.filter(function (d) {
      return Store.get(Store.kDay(courseId, week.number, d.n), false);
    }).length;
    var checks = week.selfCheck || [];
    var checksDone = checks.filter(function (_, i) {
      return Store.get(Store.kCheck(courseId, week.number, i), false);
    }).length;
    return {
      daysDone: daysDone, daysTotal: days.length,
      checksDone: checksDone, checksTotal: checks.length,
      rating: Store.get(Store.kRate(courseId, week.number), 0),
      complete: checks.length > 0 && checksDone === checks.length,
      pct: Math.round(((daysDone + checksDone) / Math.max(1, days.length + checks.length)) * 100)
    };
  }

  function courseProgress(course) {
    var weeks = course.weeks || [];
    var done = weeks.filter(function (w) { return weekProgress(course.id, w).complete; }).length;
    return { weeksDone: done, weeksTotal: weeks.length,
             pct: weeks.length ? Math.round((done / weeks.length) * 100) : 0 };
  }

  function currentWeek(course) {
    var weeks = course.weeks || [];
    for (var i = 0; i < weeks.length; i++) {
      if (!weekProgress(course.id, weeks[i]).complete) return weeks[i];
    }
    return weeks[weeks.length - 1] || null;
  }

  function bar(pct) { return '<div class="bar"><span style="width:' + pct + '%"></span></div>'; }

  /* circular progress — inherits currentColor so it works on the hero and on cards */
  function ring(pct, size) {
    size = size || 62;
    var sw = 5, r = (size - sw) / 2, c = 2 * Math.PI * r, off = c * (1 - Math.max(0, Math.min(100, pct)) / 100);
    return '<svg class="ring" width="' + size + '" height="' + size + '" viewBox="0 0 ' + size + ' ' + size + '">' +
      '<circle class="rbg" cx="' + size / 2 + '" cy="' + size / 2 + '" r="' + r + '" fill="none" stroke-width="' + sw + '"/>' +
      '<circle class="rfg" cx="' + size / 2 + '" cy="' + size / 2 + '" r="' + r + '" fill="none" stroke-width="' + sw + '" ' +
      'stroke-dasharray="' + c.toFixed(1) + '" stroke-dashoffset="' + off.toFixed(1) + '" ' +
      'transform="rotate(-90 ' + size / 2 + ' ' + size / 2 + ')"/>' +
      '<text x="50%" y="50%" text-anchor="middle" dominant-baseline="central">' + pct + '%</text></svg>';
  }
  /* A photograph banner for a page. Falls back to a plain tinted panel when the
     file is not there yet, so the layout never depends on the images. */
  /* a phone in the street should not download a 2400px photograph */
  function photoSrc(ph) {
    var dpr = window.devicePixelRatio || 1;
    var need = (window.innerWidth || 400) * Math.min(dpr, 2);
    var f = ph.file;
    return 'assets/photos/' + (need <= 1300 ? f.replace(/\.jpg$/, '-sm.jpg') : f);
  }

  function banner(key) {
    var pk = (D.pagePhoto || {})[key];
    var ph = pk && (D.photos || {})[pk];
    if (!ph) return '';
    return '<div class="phead' + (ph.scrim === 'light' ? ' light' : '') + '" ' +
      'style="background-image:url(' + esc(photoSrc(ph)) + ');background-position:' + esc(ph.focal) + '" ' +
      'role="img" aria-label="' + esc(ph.alt) + '">' +
      '<p class="pcap">' + esc(ph.caption) + '</p></div>';
  }

  function heroPhoto() {
    var pk = (D.pagePhoto || {}).home;
    var ph = pk && (D.photos || {})[pk];
    return ph ? ' hasphoto" style="background-image:linear-gradient(180deg,rgba(8,66,57,.42) 0%,rgba(8,66,57,.58) 38%,rgba(8,66,57,.86) 100%),url(' +
      esc(photoSrc(ph)) + ');background-position:' + esc(ph.focal) + '"' : '"';
  }

  function isTeacher() { return Store.get(Store.kRole, 'student') === 'teacher'; }

  /* who is speaking — some words change with the speaker's own gender */
  function learner() { return Store.get('learner', 'm') === 'f' ? 'f' : 'm'; }

  /* the card's primary form for the current learner */
  function formFor(card) {
    if (card.speaker && card.speaker[learner()]) return card.speaker[learner()];
    return { ar: card.ar, arv: card.arv, phon: card.phon };
  }

  function learnerBar() {
    var l = learner();
    return '<div class="learnerbar"><span class="lbl">Some words change with who is speaking</span>' +
      '<div class="learnerpick" id="learnerpick">' +
      '<button data-l="m" aria-pressed="' + (l === 'm') + '">He</button>' +
      '<button data-l="f" aria-pressed="' + (l === 'f') + '">She</button></div></div>';
  }

  /* both forms, side by side, the learner's own highlighted */
  function speakerForms(card) {
    if (!card.speaker) return '';
    var l = learner();
    return '<div class="forms">' + ['m', 'f'].map(function (g) {
      var f = card.speaker[g];
      return '<div class="form' + (g === l ? ' on' : '') + '">' +
        '<p class="fwho">' + (g === 'm' ? 'A man says' : 'A woman says') + '</p>' +
        '<p class="say">' + sayHTML(f.phon) + '</p>' +
        '<span class="ar" lang="ary" dir="rtl">' + esc(f.arv || f.ar) + '</span></div>';
    }).join('') + '</div>';
  }

  window.UI = {
    esc: esc, arabic: arabic, vocabCard: vocabCard, allCards: allCards,
    customCards: customCards, saveCustomCards: saveCustomCards,
    activeCourses: activeCourses, weekProgress: weekProgress, courseProgress: courseProgress,
    currentWeek: currentWeek, bar: bar, ring: ring, isTeacher: isTeacher, varietyBadge: varietyBadge,
    contrastRow: contrastRow, scopeBadge: scopeBadge, fushaBlock: fushaBlock,
    learner: learner, learnerBar: learnerBar, formFor: formFor,
    banner: banner, heroPhoto: heroPhoto,
    sayHTML: sayHTML, fam: fam, markFam: markFam, strength: strength, strengthDot: strengthDot
  };
})();
