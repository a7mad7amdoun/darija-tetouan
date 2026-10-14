/* The dashboard pieces: four numbers with their lines, the ring, the fields,
   the scope bar, the month, the last attempts. Every number comes from what
   is recorded; the range lives in memory; drawing writes nothing. */
require(__dirname + '/boot.js');
global.document.getElementById = () => null;
const docJSON = () => JSON.stringify(Storage.currentDoc().entries);
(async function () {
  await Storage.putProfile({ id: 'h', name: 'Hamza', role: 'student' }); await Storage.load('h');
  const cards = UI.allActiveCards(), T = Sched.todayStr();
  const at = (d, h) => Sched.addDays(T, d) + 'T' + ('0' + h).slice(-2) + ':00:00.000Z';
  const [a, b, c, d] = cards;
  [a, b, c].forEach(x => Store.set('seen:' + x.id, true));
  Store.set('fam:' + a.id, { r: 5, w: 0 }); Store.set('fam:' + b.id, { r: 1, w: 1 }); Store.set('fam:' + c.id, { r: 0, w: 2 });
  Store.set('sched:' + a.id, { d: T, i: 3, e: 250, n: 2 }); Store.set('sched:' + b.id, { d: Sched.addDays(T, 3), i: 3, e: 250, n: 2 }); Store.set('sched:' + c.id, { d: Sched.addDays(T, -2), i: 1, e: 250, n: 1 });
  Store.set('att:' + a.id, [
    { id: 'a1', at: at(0, 10), task: 'produce', ok: true, assisted: false, sched: 'advance' },
    { id: 'a2', at: at(-1, 10), task: 'produce', ok: false, assisted: false, sched: 'lapse' },
    { id: 'a3', at: at(-20, 10), task: 'recall', ok: true, assisted: false, sched: 'advance' }
  ]);
  Store.set('att:' + b.id, [{ id: 'b1', at: at(-3, 9), task: 'recognise', ok: true, assisted: false, sched: 'hold' }]);
  Store.set('att:' + c.id, [{ id: 'c1', at: at(-16, 9), task: 'produce', ok: true, assisted: false, sched: 'advance' }]);
  [0, 1, 3].forEach(k => Store.set('did:' + Sched.addDays(T, -k), true));
  Store.set('testres:' + Tests.list[0].id, [{ id: 't1', score: 7, total: 10, date: Sched.addDays(T, -1), at: at(-1, 12) }]);
  const before = docJSON();

  console.log('1. THE RANGE LIVES IN MEMORY AND ONLY TAKES 7, 14 OR 30');
  ok(Dash.range() === 14, 'fourteen days by default');
  Dash.setRange(7); ok(Dash.range() === 7, 'seven'); Dash.setRange('30'); ok(Dash.range() === 30, 'thirty, even as a string');
  Dash.setRange(9); ok(Dash.range() === 14, 'anything else falls back to fourteen');
  ok(/data-range="7"/.test(Dash.rangePick()) && /data-range="14" aria-pressed="true"/.test(Dash.rangePick()), 'the picker marks the current range pressed');
  ok(docJSON() === before, 'and none of that wrote anything');

  console.log('\n2. FOUR NUMBERS, EACH FROM THE RECORD');
  Dash.setRange(14);
  const k = Dash.kpis(cards);
  ok(k.practised.n === 2, 'two distinct words practised in the last 14 days, the learn-free rule applied (' + k.practised.n + ')');
  ok(k.practised.delta === 0, 'the window before had two as well (the 16-day-old typed answer and the 20-day-old recall), so the change is 0 (' + k.practised.delta + ')');
  ok(k.due.n === 2 && k.due.series[3] === 1, 'two due now (today and the overdue one), one more in three days');
  ok(k.streak.n >= 2 && k.streak.series.length === 14 && k.streak.series.filter(Boolean).length === 3, 'the streak and three practised days in the fortnight');
  ok(k.typed.n === 2 && k.typed.ok === 1 && k.typed.pct === 50, 'two first-typed card-days, one right: 50%');
  ok(k.typed.prevPct === 100 && k.typed.series.length === 14, 'the window before had one typed answer, right: 100%');
  Dash.setRange(7);
  const k7 = Dash.kpis(cards);
  ok(k7.practised.n === 2 && k7.practised.delta === null, 'at seven days the window before has no dated record, so no change is claimed');
  Dash.setRange(14);
  const row = Dash.kpiRow(cards);
  ok(row.split('<article class="kpi').length - 1 === 4 && row.split('<svg class="spark"').length - 1 === 4, 'four tiles, four sparklines');
  ok(/kpid flat">0 vs the 14 days before/.test(row) && /kpid down">-50 pts vs the 14 days before/.test(row) && /Dated attempts only/.test(row), 'the change is stated against the window before (flat words, typed down 50 points), and the row says it counts dated attempts only');
  ok(/pathLength="1"/.test(row), 'the sparkline draws itself in');

  console.log('\n3. THE RING, THE FIELDS, THE SCOPE, THE MONTH, THE LAST ATTEMPTS');
  const ws = Dash.wordStates(cards);
  ok(ws.solid === 1 && ws.ok === 1 && ws.shaky === 1 && ws.solid + ws.ok + ws.shaky + ws.unseen === cards.length, 'one solid, one getting there, one shaky, the rest not yet met');
  const dn = Dash.wordsDonut(cards);
  ok(dn.split('class="dseg').length - 1 === 4 && /3 of \d+ met/.test(dn) && /--len:/.test(dn), 'four segments drawn from the four counts');
  const fb = Dash.fieldsBars(cards);
  ok(fb.split('<li>').length - 1 === Catalog.FIELDS.filter(f => cards.some(c => Catalog.fieldOfGroup(c.group) === f.id)).length && /href="#\/catalog\//.test(fb), 'one bar per field, each a link to it');
  const sb = Dash.scopeBar(cards);
  const widths = (sb.match(/width:([\d.]+)%/g) || []).map(s => parseFloat(s.slice(6)));
  ok(Math.abs(widths.reduce((s, w) => s + w, 0) - 100) < 0.1 && /no scope recorded/.test(sb), 'the scope bar adds up to the whole course and names the unknown');
  const cal = Dash.calendar();
  ok(/class="cd on[^"]*today"|class="cd[^"]*today/.test(cal) && cal.split('class="cd on').length - 1 >= 1 && /class="dt"/.test(cal), 'today is ringed, practised days are marked, the test day has its dot');
  const rl = Dash.recentList(cards, 3);
  const order = (rl.match(/<b>[^<]+<\/b>/g) || []).map(s => s.replace(/<\/?b>/g, ''));
  ok(order[0] === UI.esc(a.en) && /✓ right/.test(rl) && /✗ missed/.test(rl), 'newest first, with right and missed told apart');
  ok(/class="pstats"/.test(Dash.profileStats(cards)) && /words met/.test(Dash.profileStats(cards)), 'the account numbers');

  console.log('\n4. THE LINE AND THE CALLOUT');
  const pv = Graphs.practisedView(cards);
  ok(/<svg class="gchart" data-kind="line"/.test(pv) && pv.split('class="lpt').length - 1 === 14 && /class="lpt peak"/.test(pv) && /class="ltip"/.test(pv), 'a line with fourteen points, each with a tooltip, the busiest marked');
  ok(/As a table/.test(pv), 'and the table is still under it');
  const tv = Graphs.typedView(cards);
  ok(/class="gbar[^"]*best"/.test(tv) && /class="callout"/.test(tv), 'the best week carries the callout');

  console.log('\n5. THE PAGES CARRY THE PIECES, WITHOUT REPEATING THEMSELVES');
  const home = Views.home(), prog = Views.progress(), acct = Account.accountPanel({});
  ok(/class="kpirow"/.test(home) && /class="dashhead"/.test(home) && home.indexOf('class="status"') < 0 && /id="findword"/.test(home), 'Home: the head, the four numbers, the finder; the old status strip gone');
  ok(/class="donut"/.test(prog) && /class="calgrid"/.test(prog) && /class="hbars"/.test(prog) && /class="stackbar"/.test(prog) && prog.indexOf('class="kpirow"') < 0, 'Progress: the ring, the month, the fields and the scope, and not the four numbers again');
  ok(/class="pstats"/.test(acct) && /class="ptag/.test(acct), 'Account: the profile numbers and the fields');
  await Storage.putProfile({ id: 't', name: 'Ahmed', role: 'teacher' }); await Storage.load('t');
  const tv2 = Views.teacher();
  ok(/class="kpirow"/.test(tv2) && /Last attempts/.test(tv2) && /Not started|In progress|Done/.test(tv2), 'Teacher: the four numbers, the last attempts (none dated for this profile), status pills on the weeks');
  await Storage.load('h');
  const b2 = docJSON();
  Views.home(); Views.progress(); Views.teacher(); Account.accountPanel({}); Dash.kpiRow(cards); Dash.calendar();
  ok(docJSON() === b2, 'rendering every piece writes nothing');
  done();
})().catch(e => { console.log('THREW: ' + e.message + '\n' + e.stack); process.exit(2); });
