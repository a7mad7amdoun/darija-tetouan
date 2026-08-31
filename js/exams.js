/* ---------------------------------------------------------------------------
   EXAMS — the assessment spine of the curriculum.

     Weekly quiz     5 multiple-choice (English shown, pick the Tetouani form)
                     + 3 true/false on that week's culture note. Day 6.
     Monthly final   15 multiple-choice, roughly half from the current month and
                     half from everything before it, + 5 true/false + the spoken
                     checklist.
     Six-month final 25 multiple-choice weighted TOWARD earlier months, so it
                     tests retention rather than recent memory, + 8 true/false
                     + a 5-minute unscripted conversation.

   Nothing here is authored by hand: questions are generated from the vocabulary
   and the culture notes, so a new month brings its own assessment with it.
   --------------------------------------------------------------------------- */
(function () {
  var D = window.DARIJA;

  function shuffle(a) {
    for (var i = a.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1)), t = a[i]; a[i] = a[j]; a[j] = t;
    }
    return a;
  }
  function take(arr, n) { return shuffle(arr.slice()).slice(0, n); }

  function courseById(id) {
    for (var i = 0; i < D.courses.length; i++) if (D.courses[i].id === id) return D.courses[i];
    return null;
  }
  function cardsOf(course) {
    var out = [];
    (course.weeks || []).forEach(function (w) {
      (w.vocab || []).forEach(function (c) { out.push(Object.assign({}, c, { week: w.number })); });
    });
    (course.extras || []).forEach(function (c) { out.push(Object.assign({}, c, { week: null })); });
    return out.filter(function (c) { return c.freq !== 'extra'; });
  }
  /* every card from the months BEFORE this one — the review half */
  function priorCards(course) {
    var out = [];
    D.courses.forEach(function (c) {
      if (c.status === 'active' && c.order < course.order) out = out.concat(cardsOf(c));
    });
    return out;
  }
  function allCulture(uptoOrder) {
    var out = [];
    D.courses.forEach(function (c) {
      if (c.status !== 'active' || (uptoOrder && c.order > uptoOrder)) return;
      (c.weeks || []).forEach(function (w) {
        if (!w.culture) return;
        w.culture.truefalse.forEach(function (t) {
          out.push(Object.assign({}, t, { courseLabel: c.label, week: w.number }));
        });
      });
    });
    return out;
  }

  /* one multiple-choice question: English prompt, four Tetouani options */
  function mcq(card, pool) {
    var wrong = take(pool.filter(function (x) { return x.ar !== card.ar; }), 3);
    if (wrong.length < 3) return null;
    return {
      kind: 'mcq', card: card, prompt: card.en,
      promptSub: 'Pick the Tetouani form',
      options: shuffle([card].concat(wrong)).map(function (x) {
        return { ar: x.arv || x.ar, phon: x.phon, correct: x.id === card.id };
      })
    };
  }
  function tf(item) {
    return {
      kind: 'tf', prompt: item.q, promptSub: 'True or false?',
      options: [{ text: 'True', correct: item.a === true },
                { text: 'False', correct: item.a === false }],
      explain: item.why
    };
  }

  /* ---------------- weekly quiz ---------------- */
  function weekly(courseId, weekNum) {
    var course = courseById(courseId);
    if (!course) return null;
    var week = (course.weeks || []).filter(function (w) { return w.number === +weekNum; })[0];
    if (!week) return null;
    var pool = cardsOf(course).concat(priorCards(course));
    var mine = (week.vocab || []).filter(function (c) { return c.freq !== 'extra'; });
    var qs = take(mine, 5).map(function (c) { return mcq(c, pool); }).filter(Boolean);
    if (week.culture) qs = qs.concat(take(week.culture.truefalse, 3).map(tf));
    return {
      id: 'w:' + courseId + ':' + weekNum,
      title: 'Week ' + weekNum + ' quiz',
      blurb: '5 vocabulary questions and 3 on the culture note. Under five minutes.',
      questions: qs
    };
  }

  /* ---------------- monthly final ---------------- */
  function monthly(courseId) {
    var course = courseById(courseId);
    if (!course) return null;
    var mine = cardsOf(course), prior = priorCards(course);
    var pool = mine.concat(prior);
    /* half current month, half everything before — the anti-forgetting rule */
    var nPrior = prior.length ? Math.min(7, prior.length) : 0;
    var nMine = 15 - nPrior;
    var picked = take(mine, nMine).concat(take(prior, nPrior));
    var qs = shuffle(picked).map(function (c) { return mcq(c, pool); }).filter(Boolean);
    qs = qs.concat(take(allCulture(course.order), 5).map(tf));
    return {
      id: 'm:' + courseId,
      title: course.label + ' final test',
      blurb: '15 vocabulary questions — about half from ' + course.label +
             ' and half from earlier months — plus 5 culture questions. Then the spoken checklist.',
      questions: qs,
      spoken: course.checkpoint || null,
      courseId: courseId
    };
  }

  /* ---------------- six-month final ---------------- */
  function sixMonth() {
    var act = D.courses.filter(function (c) { return c.status === 'active'; });
    if (!act.length) return null;
    var pool = [], picked = [];
    /* weighted toward earlier months: the earliest gets the largest share */
    var weights = act.map(function (_, i) { return act.length - i; });
    var total = weights.reduce(function (a, b) { return a + b; }, 0);
    act.forEach(function (c, i) {
      var cards = cardsOf(c);
      pool = pool.concat(cards);
      picked = picked.concat(take(cards, Math.round(25 * weights[i] / total)));
    });
    var qs = shuffle(picked).slice(0, 25).map(function (c) { return mcq(c, pool); }).filter(Boolean);
    qs = qs.concat(take(allCulture(), 8).map(tf));
    return {
      id: 'six',
      title: 'Six-month final assessment',
      blurb: '25 vocabulary questions across every month — weighted toward the earliest, ' +
             'so it tests what stuck rather than what is fresh — plus 8 culture questions.',
      questions: qs,
      spoken: {
        title: 'Five-minute unscripted conversation',
        format: 'Spoken - self-marked - about 5 minutes - no English',
        intro: 'One continuous conversation, not a list of tasks. It has to contain all five of these.',
        tasks: ['A greeting that runs more than one turn.',
                'A want or a need, stated and explained.',
                'Something that happened in the past.',
                'An opinion, with a reason attached.',
                'A short story with events in order.'],
        passBar: 'Five minutes with no English, containing all five elements.'
      }
    };
  }

  /* ---------------- results ---------------- */
  function results(id) {
    var raw = Store.get('exam:' + id, null);
    if (!raw) return [];
    try { return typeof raw === 'string' ? JSON.parse(raw) : raw; } catch (e) { return []; }
  }
  function record(id, score, total, date) {
    var l = results(id);
    l.push({ score: score, total: total, date: date, pct: Math.round(score / Math.max(1, total) * 100) });
    if (l.length > 30) l = l.slice(-30);
    Store.set('exam:' + id, l);
  }
  function last(id) { var l = results(id); return l.length ? l[l.length - 1] : null; }
  function best(id) { return results(id).reduce(function (m, r) { return Math.max(m, r.pct); }, 0); }
  function passed(id) { return best(id) >= 70; }

  window.Exams = {
    weekly: weekly, monthly: monthly, sixMonth: sixMonth,
    results: results, record: record, last: last, best: best, passed: passed,
    cardsOf: cardsOf, priorCards: priorCards
  };
})();
