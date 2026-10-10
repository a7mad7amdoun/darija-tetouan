/* A believable learner, two weeks in, for the design preview only. Nothing
   here persists: localStorage is an in-memory stand-in on preview.html. */
(function () {
  var screen = document.documentElement.getAttribute('data-preview') || 'home';
  var cards = UI.allActiveCards().filter(function (c) { return c.courseId === 'month1'; });
  var today = Sched.todayStr();

  /* week 1 learned, week 2 underway */
  cards.filter(function (c) { return c.week === 1; }).forEach(function (c, i) {
    Store.set('seen:' + c.id, true);
    Store.set('fam:' + c.id, { r: 3 + (i % 4), w: i % 3 });
    Store.set('sched:' + c.id, { d: Sched.addDays(today, (i % 9) - 2), i: 3 + (i % 9),
                                 e: 250, n: 2 + (i % 3), l: i % 4 === 0 ? 1 : 0 });
  });
  for (var d = 0; d < 6; d++) Store.set('did:' + Sched.addDays(today, -d), true);
  [1, 2, 3, 4].forEach(function (n) { Store.set('day:month1:w1:d' + n, true); });

  var main = document.getElementById('app');
  var click = function (a, i) {
    var b = { dataset: { sess: a, i: i } };
    b.closest = function (s) { return s === '[data-sess]' ? b : null; };
    return Views.todayClick(b);
  };
  var stepTo = function (kind, revealed) {
    Views.resetToday();
    for (var g = 0; g < 60; g++) {
      var h = Views.today();
      var m = /class="sesskind (\w+)"/.exec(h);
      if (m && m[1] === kind) { if (revealed) click('reveal'); return Views.today(); }
      if (/Session done/.test(h)) return h;
      if (/data-sess="next"/.test(h)) click('next');
      else if (/data-sess="reveal"/.test(h)) { click('reveal'); click('got'); }
      else if (/data-sess="answer"/.test(h)) { click('answer', '0'); click('next'); }
      else if (/id="produceform"/.test(h)) { Views.todayProduced('x'); click('next'); }
      else break;
    }
    return Views.today();
  };
  if (screen === 'produce' || screen === 'fbok' || screen === 'fbno') {
    var c = cards.filter(function (c) { return c.week === 1; })[2];
    Store.set('sched:' + c.id, { d: Sched.addDays(today, -1), i: 8, e: 250, n: 4, l: 0 });
  }

  var html;
  switch (screen) {
    case 'session': Views.resetToday(); html = Views.today(); break;
    case 'recall':  html = stepTo('rev', false); break;
    case 'reveal':  html = stepTo('rev', true); break;
    case 'produce': html = stepTo('pro', false); break;
    /* the typed answer, answered: right, and not yet */
    case 'fbok':    var ph = stepTo('pro', false);
                    var asked = cards.filter(function (c) { return ph.indexOf('>' + UI.esc(c.en) + '<') >= 0; })[0];
                    if (asked) Views.todayProduced(asked.phon);
                    html = Views.today(); break;
    case 'fbno':    stepTo('pro', false); Views.todayProduced('xyz'); html = Views.today(); break;
    case 'done':    Views.resetToday();
                    for (var k = 0; k < 80 && !/Session done/.test(Views.today()); k++) {
                      var hh = Views.today();
                      if (/data-sess="next"/.test(hh)) click('next');
                      else if (/data-sess="reveal"/.test(hh)) { click('reveal'); click('got'); }
                      else if (/data-sess="answer"/.test(hh)) { click('answer','0'); click('next'); }
                      else if (/id="produceform"/.test(hh)) { Views.todayProduced('x'); click('next'); }
                      else break;
                    }
                    html = Views.today(); break;
    case 'vocab':   html = Views.vocab(); break;
    case 'mission': Views.missionAct('start', 'cafe'); html = Views.situation('cafe'); screen = 'situations'; break;
    case 'missionline': Views.missionAct('start', 'cafe'); Views.missionAct('begin'); Views.missionAct('next');
                    Views.missionAct('show', 'bghit atay'); html = Views.situation('cafe'); screen = 'situations'; break;
    case 'cards':   Views.vocabState.view = 'cards'; html = Views.vocab(); screen = 'vocab'; break;
    /* any learner page by its route: preview.html?screen=route&r=course/month1/week/2 */
    case 'route':   var rp = (new URLSearchParams(location.search).get('r') || '').split('/').filter(Boolean);
                    html = !rp.length ? Views.home()
                      : rp[0] === 'course' && rp[2] === 'week' ? Views.week(rp[1], +rp[3])
                      : rp[0] === 'course' ? Views.course(rp[1] || 'month1')
                      : rp[0] === 'situations' && rp[1] ? Views.situation(rp[1])
                      : rp[0] === 'tests' && rp[1] ? Views.test(rp[1])
                      : rp[0] === 'exam' && rp[1] ? Views.exam(rp[1])
                      : rp[0] === 'practice' ? Views.practice(false)
                      : rp[0] === 'account' ? Account.accountPanel({})
                      : (Views[rp[0]] ? Views[rp[0]]() : '<p>no view ' + rp[0] + '</p>');
                    screen = rp[0] || 'home'; break;
    case 'card':    html = '<div class="cardsolo">' + UI.vocabCard(cards[0]) + UI.vocabCard(cards[3]) + '</div>'; break;
    case 'library': html = Views.library(); break;
    case 'account': html = Account.accountPanel({}); break;
    /* the front page, in gate mode exactly as app.js paints it */
    case 'login':   document.body.dataset.gate = 'login'; html = Account.loginScreen(); break;
    case 'loginerr': document.body.dataset.gate = 'login';
                    html = Account.loginScreen('Invalid login credentials'); break;
    case 'teacher': document.body.dataset.role = 'teacher'; html = Views.teacher(); break;
    case 'week':    html = Views.week('month1', 1); break;
    default:        html = Views.home();
  }
  main.innerHTML = (UI.pageWash && !/^login/.test(screen) ? UI.pageWash(screen === 'home' ? 'home' : 'today') : '') + html;
  /* the same "you are here" rules as markNav in js/app.js */
  var sec = screen === 'card' ? 'vocab' : /session|recall|reveal|produce|done|fbok|fbno/.test(screen) ? 'today'
          : screen === 'week' ? 'course' : screen;
  var own = sec === 'exam' ? 'exams' : sec;
  /* the same categories as markCats in js/app.js */
  var CAT = { home: 'home', today: 'learn', course: 'learn', vocab: 'learn', practice: 'practise',
              situations: 'practise', dialogues: 'practise', sentences: 'practise', tests: 'check',
              exams: 'check', exam: 'check', progress: 'check', library: 'discover', dialect: 'discover' };
  var TCAT = { teacher: 'teach', feedback: 'teach', course: 'tcourse', vocab: 'tcourse', progress: 'tcourse',
               dialect: 'tlib', situations: 'tlib', dialogues: 'tlib', sentences: 'tlib', tests: 'tlib' };
  var cat = (document.body.dataset.role === 'teacher' ? TCAT : CAT)[sec] || '';
  document.body.dataset.cat = cat;
  document.querySelectorAll('.cats a').forEach(function (a) { a.classList.toggle('on', a.dataset.cat === cat); });
  document.querySelectorAll('.nav').forEach(function (nav) {
    var n = 0;
    nav.querySelectorAll('a').forEach(function (a) { a.hidden = a.dataset.cat !== cat; if (!a.hidden) n++; });
    nav.classList.toggle('empty', n < 2);
  });
  document.querySelectorAll('.nav').forEach(function (nav) {
    nav.querySelectorAll('a').forEach(function (a) { a.classList.toggle('on', a.dataset.sec === own); });
    var lit = nav.querySelector('a.on');
    if (lit && nav.scrollWidth > nav.clientWidth)
      nav.scrollLeft = Math.max(0, lit.offsetLeft - (nav.clientWidth - lit.offsetWidth) / 2);
  });
  document.querySelectorAll('.acctbtn').forEach(function (a) { a.classList.toggle('on', sec === 'account'); });
  if (!/^login/.test(screen)) document.body.dataset.sec =
    sec === 'today' ? 'today' : sec === 'home' ? 'home' : sec === 'course' ? 'course'
    : sec === 'account' ? 'account' : 'library';
  window.__ready = true;
})();
