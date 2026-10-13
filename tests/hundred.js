/* Six more games, three more tests, Darija and Fusha, Say it, the graphs, the
   titles and the brand. The rule as ever: none of it writes a learning record. */
require(__dirname + '/boot.js');
const fs = require('fs'), path = require('path');
global.document.getElementById = () => null;
const docJSON = () => JSON.stringify(Storage.currentDoc().entries);
const keysNow = () => Object.keys(Storage.currentDoc().entries).sort();
(async function () {
  await Storage.putProfile({ id: 'h', name: 'Hamza', role: 'student' }); await Storage.load('h');
  const cards = UI.allActiveCards();
  cards.filter(c => c.courseId === 'month1').slice(0, 60).forEach(c => Store.set('seen:' + c.id, true));
  cards.filter(c => c.courseId === 'month3').slice(0, 12).forEach(c => Store.set('seen:' + c.id, true));

  console.log('1. FIFTEEN GAMES, EVERY NEW ONE BUILDS AND SCORES ONLY');
  ok(Games.list.length === 15, Games.list.length + ' games');
  const nu = ['rrush', 'fusha', 'smatch', 'scene', 'dlines', 'levels'];
  nu.forEach(id => { const r = Games.start(id, ''); ok(r.qs.length > 0, id + ': builds ' + r.qs.length + ' rounds'); Games.reset(); });
  const f = Games.start('fusha', '');
  ok(f.qs.every(q => q.options.length === 2 && q.options.some(o => o.id === 'darija') && q.card.fusha && q.card.fusha.ar), 'Darija or Fusha: two Arabic forms, one Tetouani, from the card\'s own fusha note');
  ok(f.qs.every(q => q.options.find(o => o.id === 'fusha').ar !== q.options.find(o => o.id === 'darija').ar), 'and they differ');
  Games.reset();
  const lv = Games.start('levels', '');
  ok(lv.qs.every(q => q.rungs.length === q.l.mix.length + 2 && q.rungs[0] === q.l.en && q.rungs[q.rungs.length - 1] === q.l.full.phon), 'Mix levels: English first, full Darija last');
  Games.reset();
  Store.set('seen:' + cards.filter(c => c.courseId === 'month3')[0].id, false);
  cards.filter(c => c.courseId === 'month3').forEach(c => Store.set('seen:' + c.id, false));
  ok(Games.start('dlines', '').qs.length === 0, 'Conversation lines builds nothing until a Month 3 word has been met');
  Games.reset();

  console.log('\n2. ELEVEN TESTS, THE THREE NEW ONES ASK REAL QUESTIONS');
  ok(Tests.list.length === 11, Tests.list.length + ' tests');
  const rv = Tests.build('reverse'); ok(rv.questions.length === 10 && rv.questions.every(q => q.kind === 'pick-english' && q.options.filter(o => o.correct).length === 1), 'The other way: ten Darija-to-English questions, one right answer each');
  const ar = Tests.build('arabic'); ok(ar.questions.length === 10 && ar.questions.every(q => q.promptAr && !q.promptPhon), 'Arabic only: the prompt is the script alone');
  const fd = Tests.build('fields'); ok(fd.questions.length === 10 && fd.questions.every(q => q.options.length === 4 && q.options.find(o => o.correct).text === Catalog.byId(Catalog.fieldOfGroup(q.card.group)).title), 'Which field: the right option is the word\'s own field');

  console.log('\n3. DARIJA AND FUSHA');
  const rows = Mix.rows();
  ok(rows.length === cards.filter(c => c.fusha && c.fusha.ar).length, 'every card with a fusha note is on the page (' + rows.length + ')');
  ok(rows.filter(r => !r.same).length > 200, rows.filter(r => !r.same).length + ' where the forms differ');
  const mv = Mix.view('');
  ok(mv.split('class="mixrow').length - 1 === rows.length, 'all of them rendered');
  Mix.setQuery('tea'); ok(/Tea</.test(Mix.view()) && Mix.view().split('class="mixrow').length - 1 < rows.length, 'and the search narrows them');
  Mix.setQuery('');

  console.log('\n4. SAY IT ANSWERS ONLY FROM THE COURSE');
  const s1 = Say.search('I want a tea without sugar');
  ok(s1.length && s1[0].kind === 'sentence' && /SOK-kar/.test(s1[0].phon), 'the café sentence comes first for its English');
  const s2 = Say.search('atay');
  ok(s2.length && s2.some(x => x.kind === 'word' && /a-TAY/.test(x.phon)), 'a Darija query finds the word');
  const s3 = Say.search('سلام');
  ok(s3.length && s3.some(x => /sa-LAM/.test(x.phon)), 'an Arabic query finds it too');
  ok(Say.search('quantum chromodynamics').length === 0, 'and something the course cannot say returns nothing, not an invention');
  ok(/Ask Ahmed for this phrase/.test(Say.view('zzz')) && /Nothing is machine-translated/.test(Say.view('')), 'the page says so and points to Ahmed');

  console.log('\n5. THE GRAPHS READ COPIES AND COUNT HONESTLY');
  const T = Sched.todayStr(), d1 = Sched.addDays(T, -1), d9 = Sched.addDays(T, -9);
  const [a, b, c] = cards;
  const at = (d, h) => d + 'T' + h + ':00:00.000Z';
  Store.set('att:' + a.id, [
    { id: 'e2', at: at(T, '12'), task: 'recall', ok: true, assisted: false, sched: 'advance' },
    { id: 'e1', at: at(T, '10'), task: 'produce', ok: true, assisted: false, sched: 'advance' },   /* first today: typed, right */
    { id: 'e1', at: at(T, '10'), task: 'produce', ok: true, assisted: false, sched: 'advance' },   /* a duplicate id: counted once */
    { id: 'e0', at: at(d1, '10'), task: 'learn', ok: true, assisted: false, sched: 'none' },        /* first exposure: not practice */
    { id: 'e3', at: at(d1, '11'), task: 'produce', ok: false, assisted: false, sched: 'lapse' },    /* not first that day (learn was) */
    { id: 'ex', at: 'not a time', task: 'produce', ok: true, assisted: false, sched: 'none' }       /* invalid: ignored */
  ]);
  Store.set('att:' + b.id, [
    { id: 'f1', at: at(d9, '09'), task: 'produce', ok: true, assisted: true, sched: 'hold' },       /* assisted: not cold */
    { id: 'f2', at: at(T, '09'), task: 'produce', ok: false, assisted: false, sched: 'lapse', self: true } /* self-graded: not cold */
  ]);
  Store.set('att:' + c.id, [{ id: 'g1', at: at(T, '13'), task: 'produce', ok: false, assisted: false, sched: 'lapse' }]);
  const snap = JSON.stringify([Store.get('att:' + a.id), Store.get('att:' + b.id)]);
  const pd = Graphs.practisedPerDay([a, b, c], 14);
  ok(pd.length === 14 && pd[13].day === T, '14 rows ending today');
  ok(pd[13].n === 3, 'today: three distinct words practised, a tried twice counting once (' + pd[13].n + ')');
  ok(pd[12].n === 1, 'yesterday: one (the learn event left out, the produce counted)');
  ok(pd.find(r => r.day === d9).n === 1, 'nine days ago: the assisted attempt still counts as activity');
  const ft = Graphs.firstTypedByWeek([a, b, c], 4);
  const tw = ft[3];
  ok(ft.length === 4 && tw.n === 2 && tw.ok === 1, 'this week: two first-typed card-days (a right, c wrong), b\'s self-graded one and yesterday\'s post-learn one left out (' + tw.ok + ' of ' + tw.n + ')');
  ok(JSON.stringify([Store.get('att:' + a.id), Store.get('att:' + b.id)]) === snap, 'the stored logs were not reordered or changed');
  const kb = keysNow();
  Graphs.practisedView(cards); Graphs.typedView(cards);
  ok(JSON.stringify(keysNow()) === JSON.stringify(kb), 'rendering both graphs writes nothing');
  ok(/<svg class="gchart"/.test(Graphs.practisedView(cards)) && /As a table/.test(Graphs.typedView(cards)), 'each graph has a table under it');

  console.log('\n6. THE BRAND AND THE TITLES');
  const idx = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
  ok(/<footer class="sitefoot"/.test(idx) && /TetouTalk<sup class="tm"/.test(idx), 'a site footer with the TetouTalk™ mark');
  ok(UI.titleFor('vocab') === 'Words \u00b7 TetouTalk' && UI.titleFor('map') === 'Tetouan \u00b7 TetouTalk' && UI.titleFor('nope') === 'TetouTalk' && UI.titleFor('course', ['course', 'month1', 'week', '2']) === 'Week 2 \u00b7 Month 1 \u00b7 TetouTalk', 'every page is titled "Page \u00b7 TetouTalk"');

  console.log('\n7. ALL OF IT TOGETHER WROTE NOTHING BUT THE FIXTURES');
  const before = docJSON();
  Views.home(); Views.library(); Views.catalog && Views.catalog(); Games.listView(''); Views.tests(); Views.situations();
  ok(docJSON() === before, 'rendering the pages writes nothing');
  done();
})().catch(e => { console.log('THREW: ' + e.message + '\n' + e.stack); process.exit(2); });
