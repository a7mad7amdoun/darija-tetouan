/* Phase A: Home's next action, the unscored mission, the whole-course count.

   The rule that matters most here: supported practice must never become
   evidence. The mission and Home are walked end to end and the stored
   document and the outbox are compared byte for byte before and after - and
   Attempts.hasProduced, the gate that lets an interval grow past the
   recognition cap, must not move. */
require(__dirname + '/boot.js');
const tick = (ms = 15) => new Promise(r => setTimeout(r, ms));
const snap = async () => JSON.stringify(Storage.currentDoc().entries) + '|' +
  JSON.stringify((await DB.values('outbox')).map(c => c.id).sort());

(async function () {
  await Storage.putProfile({ id: 'h', name: 'Hamza', role: 'student' });
  await Storage.load('h');
  const cards = UI.allActiveCards();
  const T = Sched.todayStr();

  console.log('1. "WHEN YOUR WORDS COME BACK" COUNTS SAVED DATES, AND ONLY THOSE');
  const [a, b, c, d, e, f] = cards;
  [a, b, c, d, e].forEach(x => Store.set('seen:' + x.id, true));
  Store.set('sched:' + a.id, { d: Sched.addDays(T, -3), i: 4, e: 250, n: 2, l: 0 });   // overdue
  Store.set('sched:' + b.id, { d: T, i: 1, e: 250, n: 1, l: 0 });                       // today
  Store.set('sched:' + c.id, { d: Sched.addDays(T, 3), i: 3, e: 250, n: 1, l: 0 });    // in 3 days
  Store.set('sched:' + d.id, { d: Sched.addDays(T, 20), i: 20, e: 250, n: 3, l: 0 });  // later
  Store.set('sched:' + e.id, { d: 'not-a-date', i: 1, e: 250, n: 1, l: 0 });           // invalid
  Store.set('sched:' + f.id, { d: T, i: 1, e: 250, n: 1, l: 0 });                       // not introduced
  Store.set('sched:no-such-card', { d: T, i: 1, e: 250, n: 1, l: 0 });                  // unmatched
  await tick();
  const before1 = await snap();
  const sc = Views.scheduleCounts();
  ok(sc.overdue === 1, 'one overdue');
  ok(sc.days[0].n === 1, 'one today (a word never introduced is not counted)');
  ok(sc.days[3].n === 1, 'one in three days');
  ok(sc.later === 1, 'one further out than a week');
  ok(sc.invalid === 1, 'an unreadable date is reported, not counted as a day');
  ok(sc.unmatched === 1, 'a schedule for a word not in the course is reported, not counted');
  ok(sc.days.length === 8 && sc.days[0].date === T, 'today plus the next seven local days');

  console.log('\n2. HOME READS AND WRITES NOTHING');
  Attempts.record(a.id, { task: 'recall', ok: false, assisted: false, sched: 'lapse' });
  Attempts.record(a.id, { task: 'recall', ok: false, assisted: false, sched: 'lapse' });
  await tick();
  const before2 = await snap();
  const home = Views.home();
  await tick();
  ok(await snap() === before2, 'rendering Home leaves the document and the outbox byte-identical');
  ok(home.indexOf('id="findword"') > 0 && /<label for="findq">Find a word<\/label>/.test(home), 'a labelled Find a word box');
  ok(home.indexOf('class="outside"') > 0 && /#\/situations\/[a-z]+/.test(home), 'a Use it outside link to a real situation');
  ok(home.indexOf('Words that keep slipping') > 0 && home.indexOf(UI.esc(a.en)) > 0 &&
     home.indexOf('2 missed in the last 30 days') > 0, 'the slipping word, with its evidence as a count');
  ok(home.indexOf('When your words come back') > 0 && home.indexOf('not a forecast') > 0,
     'the schedule chart, and it says what it is not');
  ok(/<th scope="row">Overdue<\/th>/.test(home), 'the chart is a real table, readable without colour');

  console.log('\n3. THE MISSION IS REHEARSAL, AND LEAVES NO EVIDENCE');
  const sid = 'cafe';
  const sit = window.DARIJA.situations.find(s => s.id === sid);
  const lineCards = cards.filter(x => sit.lines.some(l => l.full.phon.indexOf(x.phon) >= 0));
  const gateBefore = lineCards.map(x => Attempts.hasProduced(x.id));
  const before3 = await snap();
  Views.missionAct('start', sid);
  let page = Views.situation(sid);
  ok(page.indexOf(UI.esc(sit.when)) > 0, 'the goal is shown in English');
  ok(page.indexOf('waiting for Ahmed to approve') > 0, 'the missing other side is said to be pending, not invented');
  Views.missionAct('begin');
  for (let i = 0; i < sit.lines.length; i++) {
    page = Views.situation(sid);
    ok(page.indexOf(UI.esc(sit.lines[i].en)) > 0 && page.indexOf(UI.esc(sit.lines[i].full.ar)) < 0,
       'line ' + (i + 1) + ': the cue in English, the Darija hidden');
    Views.missionAct('show', i === 0 ? 'bghit atay' : '');
    page = Views.situation(sid);
    ok(page.indexOf(UI.esc(sit.lines[i].full.ar)) > 0, 'line ' + (i + 1) + ': the model, after answering');
    Views.missionAct('next');
  }
  page = Views.situation(sid);
  ok(Views.missionState().step === 'done' && page.indexOf('Mission rehearsed') > 0, 'it runs to the end');
  ok(page.indexOf('one detail changed') > 0, 'and the changed-detail run is shown as pending');
  await tick();
  ok(await snap() === before3, 'the whole mission left the document and the outbox byte-identical');
  ok(JSON.stringify(lineCards.map(x => Attempts.hasProduced(x.id))) === JSON.stringify(gateBefore),
     'and no word gained "produced" evidence from it');
  Views.missionAct('start', sid); Views.missionAct('begin');
  ok(Views.situation(sid).indexOf('Help me continue') > 0 &&
     Views.situation(sid).indexOf('ma f-') > 0, 'Help me continue offers the course\'s own repair phrases');
  Views.missionAct('exit');
  ok(Views.situation(sid).indexOf('levelpick') > 0, 'leaving returns to the scene as it was');

  console.log('\n4. THE SCORED PATH STILL RECORDS, ONCE');
  const n0 = Attempts.all(b.id).length;
  UI.markFam(b.id, true, { task: 'recall', assisted: false });
  ok(Attempts.all(b.id).length === n0 + 1, 'an answer in the daily session still records exactly one attempt');

  console.log('\n5. LIBRARY COUNTS WHAT IT SAYS IT COUNTS');
  const lib = Views.library();
  ok(lib.indexOf(cards.length + ' in all') > 0, 'the Words tile counts every month (' + cards.length + '), not the current one');

  done();
})().catch(e => { console.log('THREW: ' + e.message + '\n' + e.stack); process.exit(2); });
