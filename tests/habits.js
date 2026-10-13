/* Habits: rest days, quests, mistakes, hooks, the year, leeches. Nothing here
   may write a learning record; only hook:<id> is written, as text. */
require(__dirname + '/boot.js');
const tick = (ms = 15) => new Promise(r => setTimeout(r, ms));
const keysNow = () => Object.keys(Storage.currentDoc().entries).sort();
const day = n => Sched.addDays(Sched.todayStr(), n);
(async function () {
  await Storage.putProfile({ id: 'h', name: 'Hamza', role: 'student' }); await Storage.load('h');
  const cards = UI.allActiveCards();

  console.log('1. A STREAK SURVIVES ONE REST DAY IN SEVEN');
  [0, -1, -2, -4, -5, -6, -7, -8].forEach(n => Store.set('did:' + day(n), true));   // -3 missed
  let s = Habits.streak();
  ok(s.days === 8 && s.rests === 1, '8 days with one rest day forgiven (' + s.days + ', rests ' + s.rests + ')');
  Store.set('did:' + day(-2), false);                                               // now -2 and -3 missed
  s = Habits.streak();
  ok(s.days === 2, 'two missed days in a row is a break: the run stops at today and yesterday (' + s.days + ')');
  Store.set('did:' + day(-2), true);
  [-10, -11, -12].forEach(n => Store.set('did:' + day(n), true));                  // -9 missed: a second rest within 7 of the first?
  s = Habits.streak();
  ok(s.days === 8 && s.rests === 1, 'a second missed day within seven of the first is not forgiven (' + s.days + ')');
  ok(Habits.milestone(7) === 7 && Habits.milestone(8) === 0 && Habits.milestone(30) === 30, 'milestones at 3, 7, 14, 30…');

  console.log('\n2. QUESTS COME FROM THE DAY\'S RECORDS');
  let q = Habits.quests();
  ok(q.list.length === 3 && q.list[0].done === true, 'three quests; the session one is done because today is done');
  ok(q.list[1].done === false && q.list[1].n === 0, 'typing: 0 of 3');
  for (let i = 0; i < 3; i++) Attempts.record(cards[i].id, { task: 'produce', ok: true, assisted: false, sched: 'advance' });
  q = Habits.quests();
  ok(q.list[1].done === true, 'three unaided typed answers complete the typing quest');
  Tests.record('game:pairs', 2, 3, Sched.todayStr());
  q = Habits.quests();
  ok(q.list[2].done === true && q.done === 3, 'a game today completes the third; 3 of 3');

  console.log('\n3. MISTAKES AND LEECHES');
  Attempts.record(cards[5].id, { task: 'recall', ok: false, assisted: false, sched: 'lapse' });
  Attempts.record(cards[5].id, { task: 'recall', ok: false, assisted: false, sched: 'lapse' });
  const m = Habits.mistakes(7);
  ok(m.length === 1 && m[0].card.id === cards[5].id && m[0].misses === 2, 'one word missed twice this week');
  for (let i = 0; i < 4; i++) Attempts.record(cards[5].id, { task: 'recall', ok: false, assisted: false, sched: 'lapse' });
  ok(Habits.leeches().length === 1 && Habits.leeches()[0].misses === 6, 'six misses in 30 days flags a leech');
  ok(Habits.leeches().every(x => x.misses >= Habits.LEECH), 'and nothing below the threshold is flagged');
  Views.practice(false, 'mistakes');
  ok(Views.flash.filter === 'mistakes' && Views.flash.pool.length === 1 && Views.flash.pool[0].id === cards[5].id, 'flashcards can be limited to this week\'s mistakes');

  console.log('\n4. HOOKS ARE THE ONLY THING WRITTEN');
  const kb = keysNow();
  Habits.setHook(cards[0].id, '  the bread is round like the sun  ');
  ok(Habits.hook(cards[0].id) === 'the bread is round like the sun', 'a hook is kept, trimmed');
  const added = keysNow().filter(k => kb.indexOf(k) < 0);
  ok(JSON.stringify(added) === JSON.stringify(['hook:' + cards[0].id]), 'the only new key is hook:<id>');
  ok(Sync.classify('hook:' + cards[0].id) === 'text', 'and it syncs as text');
  ok(/the bread is round/.test(Habits.hookShow(cards[0].id)) && Habits.hookShow(cards[1].id) === '', 'shown on its word, nothing on others');

  console.log('\n5. VIEWS READ AND WRITE NOTHING');
  const kb2 = keysNow();
  const home = Views.home(); Habits.questsView(); Habits.mistakesView(); Habits.yearView(); Habits.streakView();
  await tick();
  ok(JSON.stringify(keysNow()) === JSON.stringify(kb2), 'rendering Home with everything writes nothing');
  ok(/Today’s three|Today’s three/.test(home) && /Missed this week/.test(home) && /The last year/.test(home), 'Home shows the quests, the mistakes and the year');
  ok(Habits.year().cells.length === 365 && Habits.year().days >= 11, 'the year has 365 cells and counts the days done');
  done();
})().catch(e => { console.log('THREW: ' + e.message + '\n' + e.stack); process.exit(2); });
