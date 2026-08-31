/* The exam runner: weekly quizzes, monthly finals, and the six-month assessment. */
(function () {
  var E = UI.esc;
  var run = null;

  function today() { return new Date().toISOString().slice(0, 10); }

  function build(key) {
    var p = key.split(':');
    if (p[0] === 'w') return Exams.weekly(p[1], p[2]);
    if (p[0] === 'm') return Exams.monthly(p[1]);
    if (p[0] === 'six') return Exams.sixMonth();
    return null;
  }

  function start(key) {
    var ex = build(key);
    if (!ex || !ex.questions.length) return null;
    run = { key: key, ex: ex, i: 0, answered: false, chosen: -1, score: 0, done: false, missed: [] };
    return run;
  }

  /* ---------- the index of everything assessable ---------- */
  function examsIndex() {
    var h = '<h1>Quizzes and tests</h1><p class="sub">A short quiz at the end of every week, a bigger test at ' +
            'the end of every month, and one assessment across the whole six months. Every test pulls about ' +
            'half its questions from earlier material, so nothing is ever really finished with.</p>';

    UI.activeCourses().forEach(function (c) {
      var m = Exams.last('m:' + c.id);
      h += '<h2>' + E(c.label) + '</h2><div class="panel">';
      (c.weeks || []).forEach(function (w) {
        var r = Exams.last('w:' + c.id + ':' + w.number);
        h += '<a class="weekrow' + (r && r.pct >= 70 ? ' complete' : '') + '" href="#/exam/w:' + c.id + ':' + w.number + '">' +
             '<span class="wnum">' + w.number + '</span>' +
             '<span class="wbody"><span class="wtitle">Week ' + w.number + ' quiz</span>' +
             '<span class="wmeta">' + (r ? 'last ' + r.pct + '% · ' + E(r.date) : 'not taken') +
             ' · 5 vocabulary + 3 culture</span></span><span class="chev">›</span></a>';
      });
      h += '<a class="weekrow final' + (Exams.passed('m:' + c.id) ? ' complete' : '') + '" href="#/exam/m:' + c.id + '">' +
           '<span class="wnum">★</span>' +
           '<span class="wbody"><span class="wtitle">' + E(c.label) + ' final test</span>' +
           '<span class="wmeta">' + (m ? 'last ' + m.pct + '% · best ' + Exams.best('m:' + c.id) + '%' : 'not taken') +
           ' · 15 vocabulary (half review) + 5 culture + spoken</span></span><span class="chev">›</span></a>';
      h += '</div>';
    });

    var s = Exams.last('six');
    h += '<h2>The whole six months</h2>' +
         '<a class="panel" href="#/exam/six" style="display:block">' +
         '<div class="crumb">Final assessment</div>' +
         '<h3 style="font-size:17px;margin:0 0 5px">Six-month final</h3>' +
         '<p class="muted" style="margin:0">25 vocabulary questions weighted toward the earliest months, ' +
         '8 culture questions, and a five-minute unscripted conversation. ' +
         (s ? 'Last attempt ' + s.pct + '%.' : 'Not taken yet.') + '</p></a>';
    return h;
  }

  /* ---------- running one ---------- */
  function examView(key) {
    if (!run || run.key !== key) {
      if (!start(key)) return '<p class="empty">Not enough content for this test yet.</p>';
    }
    var ex = run.ex;
    var h = '<div class="crumb"><a href="#/exams">Quizzes and tests</a></div><h1>' + E(ex.title) + '</h1>';

    if (run.done) return h + resultBlock();

    var q = ex.questions[run.i];
    h += '<div class="tprogress"><div class="bar"><span style="width:' +
         Math.round(run.i / ex.questions.length * 100) + '%"></span></div>' +
         '<p class="counter">Question ' + (run.i + 1) + ' of ' + ex.questions.length +
         ' · score ' + run.score + '</p></div>';

    h += '<div class="qcard"><p class="qsub">' + E(q.promptSub) + '</p>';
    h += '<p class="qprompt">' + E(q.prompt) + '</p>';
    h += '<div class="qopts' + (q.kind === 'tf' ? ' two' : '') + '">';
    q.options.forEach(function (o, i) {
      var cls = 'qopt';
      if (run.answered) {
        if (o.correct) cls += ' right';
        else if (i === run.chosen) cls += ' wrong';
      }
      h += '<button class="' + cls + '" data-ex="' + i + '"' + (run.answered ? ' disabled' : '') + '>';
      if (o.ar) h += '<span class="ar sm" dir="rtl">' + E(o.ar) + '</span>' +
                     '<span class="qphon">' + E(o.phon) + '</span>';
      else h += '<span class="qtext">' + E(o.text) + '</span>';
      h += '</button>';
    });
    h += '</div>';

    if (run.answered) {
      var ok = (q.options[run.chosen] || {}).correct;
      h += '<div class="qfeed ' + (ok ? 'ok' : 'no') + '"><strong>' + (ok ? '✓ Right' : '✗ Not that one') + '</strong>';
      if (q.card) {
        h += '<p><strong>' + E(q.card.phon) + '</strong> · <span class="ar sm" dir="rtl">' +
             E(q.card.arv || q.card.ar) + '</span> — ' + E(q.card.en) + '</p>';
        if (q.card.use) h += '<p class="quse">Use it when: ' + E(q.card.use) + '</p>';
      }
      if (q.explain) h += '<p>' + E(q.explain) + '</p>';
      h += '</div><button class="btn primary wide" id="exnext">' +
           (run.i + 1 >= ex.questions.length ? 'See result' : 'Next ›') + '</button>';
    }
    return h + '</div>';
  }

  function resultBlock() {
    var ex = run.ex, pct = Math.round(run.score / ex.questions.length * 100);
    var verdict = pct >= 85 ? 'Strong.' : pct >= 70 ? 'Passed.' : 'Below the bar — worth another pass.';
    var h = '<div class="panel result"><div class="rpct">' + pct + '%</div>' +
            '<p class="muted" style="margin:0 0 4px">' + run.score + ' of ' + ex.questions.length + ' — ' + verdict + '</p>' +
            '<p class="muted" style="margin:0;font-size:12px">Pass mark is 70%.</p>';
    if (run.missed.length) {
      h += '<div class="crumb" style="margin-top:16px">Worth revisiting</div>';
      run.missed.forEach(function (c) {
        h += '<div class="missrow"><span class="ar sm" dir="rtl">' + E(c.arv || c.ar) + '</span>' +
             '<span><strong>' + E(c.en) + '</strong><br><span class="muted">' + E(c.phon) + '</span></span></div>';
      });
    }
    h += '</div>';

    if (ex.spoken) {
      var sp = ex.spoken;
      h += '<h2>Spoken part</h2><div class="panel"><div class="crumb">' + E(sp.format || 'Spoken · self-marked') + '</div>' +
           '<h3 style="font-size:17px;margin:2px 0 6px">' + E(sp.title) + '</h3>' +
           '<p class="muted" style="margin:0 0 4px">' + E(sp.intro) + '</p></div><div class="panel">';
      sp.tasks.forEach(function (t, i) {
        var k = 'spoken:' + ex.id + ':' + i, on = Store.get(k, false);
        h += '<label class="check"><input type="checkbox" data-store="' + k + '"' + (on ? ' checked' : '') + '>' +
             '<span class="ctext">' + E(t) + '</span></label>';
      });
      h += '</div><div class="panel tight"><div class="crumb">Pass bar</div>' +
           '<p class="muted" style="margin:0">' + E(sp.passBar) + '</p></div>';
    }

    h += '<div class="btnrow"><button class="btn" id="exagain">Take it again</button>' +
         '<a class="btn primary" href="#/exams">Back to tests</a></div>';
    return h;
  }

  function handleClick(t) {
    if (!run) return false;
    var q = run.ex.questions[run.i];
    var opt = t.closest('[data-ex]');
    if (opt && !run.answered) {
      run.chosen = +opt.dataset.ex;
      run.answered = true;
      var right = q.options[run.chosen].correct;
      if (right) run.score++;
      else if (q.card) run.missed.push(q.card);
      if (q.card) UI.markFam(q.card.id, right);
      return true;
    }
    if (t.id === 'exnext') {
      if (run.i + 1 >= run.ex.questions.length) {
        run.done = true;
        Exams.record(run.ex.id, run.score, run.ex.questions.length, today());
      } else { run.i++; run.answered = false; run.chosen = -1; }
      return true;
    }
    if (t.id === 'exagain') { start(run.key); return true; }
    return false;
  }

  function reset() { run = null; }

  window.Views.exams = examsIndex;
  window.Views.exam = examView;
  window.Views.examClick = handleClick;
  window.Views.resetExam = reset;
})();
