/* Tests page + the running test itself. */
(function () {
  var D = window.DARIJA, E = UI.esc;

  /* live run state — deliberately not persisted; a test is one sitting */
  var run = null;

  function today() { return new Date().toISOString().slice(0, 10); }

  function testsIndex() {
    var h = UI.banner('tests') + '<h1>Tests</h1><p class="sub">Short and low-stakes. Every test is built from the cards themselves, so nothing goes stale when content changes.</p>';
    h += '<div class="tiles">';
    Tests.list.forEach(function (t) {
      var b = Tests.best(t.id), l = Tests.last(t.id);
      h += '<a class="tile" href="#/tests/' + t.id + '"><span class="ticon">' + t.icon + '</span>' +
           '<span class="ttitle">' + E(t.title) + '</span>' +
           '<span class="tsub">' + E(t.blurb) + '</span>' +
           (l ? '<span class="tprog">last ' + Math.round(l.score / Math.max(1, l.total) * 100) + '% · best ' + b + '%</span>'
              : '<span class="tprog">not taken</span>') +
           '</a>';
    });
    h += '</div>';
    h += '<div class="panel tight"><div class="crumb">Why these formats</div><p class="muted" style="margin:0">' +
         'Darija is spoken, so nothing here is a written exam. The picture round uses emoji rather than photographs ' +
         'so the site stays offline and instant — swap in real images later if you want them. ' +
         '<strong>Tetouani or national?</strong> is the one to watch: it tests the thing this whole course is for.</p></div>';
    return h;
  }

  function startTest(id) {
    var built = Tests.build(id);
    if (!built || !built.questions.length) return null;
    run = { id: id, test: built.test, qs: built.questions, i: 0, answered: false, chosen: -1,
            score: 0, done: false, match: null };
    return run;
  }

  function testView(id) {
    if (!run || run.id !== id) {
      if (!startTest(id)) return '<p class="empty">Not enough content for this test yet.</p>';
    }
    var t = run.test;
    var h = '<div class="crumb"><a href="#/tests">Tests</a></div>';
    h += '<h1>' + t.icon + ' ' + E(t.title) + '</h1>';

    if (run.done) return h + resultBlock();

    var q = run.qs[run.i];
    h += '<div class="tprogress"><div class="bar"><span style="width:' +
         Math.round(run.i / run.qs.length * 100) + '%"></span></div>' +
         '<p class="counter">Question ' + (run.i + 1) + ' of ' + run.qs.length +
         ' · score ' + run.score + '</p></div>';

    h += '<div class="qcard">';
    h += '<p class="qsub">' + E(q.promptSub) + '</p>';

    if (q.kind === 'picture') h += '<div class="qemoji">' + q.emoji + '</div>';
    else if (q.kind === 'cluster') {
      h += '<div class="mindmap"><div class="mmnode">' + q.emoji +
           '<span>' + E(q.prompt) + '</span></div><div class="mmbranches">' +
           q.branches.map(function (b) { return '<span class="mmbranch">' + E(b) + '</span>'; }).join('') +
           '</div></div>';
    }
    else if (q.kind === 'match') { h += matchBoard(q); }
    else if (q.kind === 'gap') {
      h += '<p class="lsent">' + gapSentence(q) + '</p>';
      h += '<p class="len">' + E(q.en) + '</p>';
    } else if (q.promptAr) {
      h += UI.arabic(q.promptAr) + '<p class="phon">' + E(q.promptPhon) + '</p>';
    } else {
      h += '<p class="qprompt">' + E(q.prompt) + '</p>';
    }

    if (q.kind === 'speak') {
      h += speakBlock(q);
    } else if (q.kind === 'match') {
      /* the board is the whole question */
    } else {
      h += '<div class="qopts">';
      q.options.forEach(function (o, i) {
        var cls = 'qopt';
        if (run.answered) {
          if (o.correct) cls += ' right';
          else if (i === run.chosen) cls += ' wrong';
        }
        h += '<button class="' + cls + '" data-opt="' + i + '"' + (run.answered ? ' disabled' : '') + '>';
        if (o.ar) h += '<span class="ar sm" dir="rtl">' + E(o.ar) + '</span>' +
                       '<span class="qphon">' + E(o.phon) + '</span>';
        else h += '<span class="qtext">' + E(o.text) + '</span>';
        if (run.answered && o.tag) h += '<span class="badge ' + (o.correct ? 'tag-northern' : 'tag-national') + '">' + E(o.tag) + '</span>';
        h += '</button>';
      });
      h += '</div>';
    }

    if (run.answered) {
      var q2 = q, ok;
      if (q2.kind === 'speak') ok = run.lastSelf;
      else if (q2.kind === 'match') ok = true;
      else ok = (q2.options[run.chosen] || {}).correct;
      h += '<div class="qfeed ' + (ok ? 'ok' : 'no') + '">' +
           '<strong>' + (ok ? '✓ Right' : '✗ Not that one') + '</strong>';
      if (q2.card) {
        h += '<p><strong>' + E(q2.card.phon) + '</strong> · <span class="ar sm" dir="rtl">' +
             E(q2.card.arv || q2.card.ar) + '</span> — ' + E(q2.card.en) + '</p>';
        /* the one thing that always appears: where to use it */
        if (q2.card.use) h += '<p class="quse">Use it when: ' + E(q2.card.use) + '</p>';
      }
      if (q2.explain) h += '<p>' + E(q2.explain) + '</p>';
      h += '</div>';
      h += '<button class="btn primary wide" id="qnext">' +
           (run.i + 1 >= run.qs.length ? 'See result' : 'Next question ›') + '</button>';
    }
    h += '</div>';
    return h;
  }

  function gapSentence(q) {
    return q.parts.map(function (p) {
      if (typeof p === 'string') return '<span class="epart">' + E(p) + '</span>';
      if (p.ar === q.blankAr) return '<span class="dpart blank">?</span>';
      return '<span class="dpart"><span class="dphon">' + E(p.d) + '</span>' +
             '<span class="dar" lang="ary" dir="rtl">' + E(p.ar) + '</span></span>';
    }).join('');
  }

  function matchBoard(q) {
    var st = run.match || (run.match = { picked: null, done: {}, wrong: null });
    var h = '<div class="mgrid">';
    q.pics.forEach(function (p) {
      var cls = 'mcell pic' + (st.done[p.id] ? ' paired' : '') + (st.picked === p.id ? ' picked' : '');
      h += '<button class="' + cls + '" data-mpic="' + E(p.id) + '"' + (st.done[p.id] ? ' disabled' : '') + '>' +
           '<span class="memoji">' + p.emoji + '</span></button>';
    });
    h += '</div><div class="mgrid words">';
    q.words.forEach(function (w) {
      var cls = 'mcell word' + (st.done[w.id] ? ' paired' : '') + (st.wrong === w.id ? ' shake' : '');
      h += '<button class="' + cls + '" data-mword="' + E(w.id) + '"' + (st.done[w.id] ? ' disabled' : '') + '>' +
           '<span class="mphon">' + E(w.phon) + '</span>' +
           '<span class="ar sm" dir="rtl">' + E(w.ar) + '</span></button>';
    });
    h += '</div>';
    var n = Object.keys(st.done).length;
    h += '<p class="counter">' + n + ' of ' + q.pics.length + ' paired</p>';
    return h;
  }

  function speakBlock(q) {
    if (!run.revealed) {
      return '<div class="qopts"><button class="qopt reveal" id="qreveal">Tap when you have said it</button></div>';
    }
    return '<div class="qanswer">' + UI.arabic(q.answerAr) +
           '<p class="phon">' + E(q.answerPhon) + '</p></div>' +
           '<div class="qopts two"><button class="qopt selfno" data-self="0">Not quite</button>' +
           '<button class="qopt selfyes" data-self="1">I said it right</button></div>';
  }

  function resultBlock() {
    var pct = Math.round(run.score / run.qs.length * 100);
    var verdict = pct >= 80 ? 'Solid.' : pct >= 55 ? 'Getting there.' : 'Worth another pass.';
    var h = '<div class="panel result"><div class="rpct">' + pct + '%</div>' +
            '<p class="muted" style="margin:0 0 4px">' + run.score + ' of ' + run.qs.length + ' — ' + verdict + '</p>';
    if (run.missed && run.missed.length) {
      h += '<div class="crumb" style="margin-top:14px">Missed</div>';
      run.missed.forEach(function (c) {
        h += '<div class="missrow"><span class="ar sm" dir="rtl">' + E(c.ar) + '</span>' +
             '<span><strong>' + E(c.en) + '</strong><br><span class="muted">' + E(c.phon) + '</span></span></div>';
      });
    }
    h += '</div>';
    h += '<div class="btnrow"><button class="btn" id="qagain">Again</button>' +
         '<a class="btn primary" href="#/tests">Back to tests</a></div>';
    return h;
  }

  /* ---- interaction, called from app.js ---- */
  function handleClick(t) {
    if (!run) return false;
    var q = run.qs[run.i];
    var opt = t.closest('.qopt[data-opt]');
    /* 'speak' questions carry no options — never treat a stray click as an answer */
    if (opt && !run.answered && q.options && q.options[+opt.dataset.opt]) {
      run.chosen = +opt.dataset.opt;
      run.answered = true;
      var right = q.options[run.chosen].correct;
      if (q.card) UI.markFam(q.card.id, right);
      if (right) run.score++;
      else { run.missed = run.missed || []; if (q.card) run.missed.push(q.card); }
      return true;
    }
    if (t.id === 'qreveal' && !run.revealed) { run.revealed = true; return true; }

    /* matching board: tap a picture, then its word */
    var mp = t.closest('[data-mpic]');
    if (mp) { run.match = run.match || { picked: null, done: {}, wrong: null };
              run.match.picked = mp.dataset.mpic; run.match.wrong = null; return true; }
    var mw = t.closest('[data-mword]');
    if (mw && run.match && run.match.picked) {
      var st = run.match;
      if (mw.dataset.mword === st.picked) {
        st.done[st.picked] = true; UI.markFam(st.picked, true); st.picked = null; st.wrong = null;
        if (Object.keys(st.done).length === q.pics.length) {
          run.answered = true;
          if (!run.matchMissed) run.score++;   /* a clean board only */
        }
      } else { UI.markFam(mw.dataset.mword, false); st.wrong = mw.dataset.mword; st.picked = null; run.matchMissed = true; }
      return true;
    }
    var self = t.closest('[data-self]');
    if (self && !run.answered) {
      run.lastSelf = self.dataset.self === '1';
      run.answered = true;
      if (run.qs[run.i].card) UI.markFam(run.qs[run.i].card.id, run.lastSelf);
      if (run.lastSelf) run.score++;
      else { run.missed = run.missed || []; if (run.qs[run.i].card) run.missed.push(run.qs[run.i].card); }
      return true;
    }
    if (t.id === 'qnext') {
      if (run.i + 1 >= run.qs.length) {
        run.done = true;
        Tests.record(run.id, run.score, run.qs.length, today());
      } else {
        run.i++; run.answered = false; run.chosen = -1; run.revealed = false;
        run.match = null; run.matchMissed = false;
      }
      return true;
    }
    if (t.id === 'qagain') { startTest(run.id); return true; }
    return false;
  }

  function reset() { run = null; }

  window.Views.tests = testsIndex;
  window.Views.test = testView;
  window.Views.testClick = handleClick;
  window.Views.resetTest = reset;
})();
