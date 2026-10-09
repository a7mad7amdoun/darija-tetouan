/* Does the course finish?
   This drives the REAL Sched.grade and the REAL pool/plan selection, with the
   clock shimmed forward a day at a time. The previous version reimplemented
   grade() inside the test file - a pre-fix copy that modelled no soft failures,
   no recognition cap, no ease recovery and no same-day hold - and simulated
   every card in the course rather than the ones the session can actually reach.
   It would have passed unchanged with schedule.js deleted. */
require(__dirname + '/boot.js');

const base = Date.parse('2026-01-01T12:00:00Z');
/* wind the module's own clock, not a copy of its accessor */
function shiftClock(n) { Sched.setClock(() => new Date(base + n * 86400000)); }

async function simulate(accuracy, days, seed) {
  let x = seed || 1;
  const rand = () => (x = (x * 1103515245 + 12345) & 0x7fffffff) / 0x7fffffff;
  await Storage.load('sim');
  await Storage.replaceAll({});
  Views.resetToday();

  let reviews = 0, blocked = 0, lapses = 0;
  for (let d = 0; d < days; d++) {
    shiftClock(d);
    Views.resetToday();
    const p = Views.todayPlan();
    if (p.newAllowance === 0) blocked++;
    p.fresh.forEach(c => {
      Store.set('seen:' + c.id, true);
      Attempts.record(c.id, { task: 'learn', ok: true, assisted: true, sched: 'none' });
    });
    p.due.forEach(c => {
      reviews++;
      const ok = rand() < accuracy;
      if (!ok) lapses++;
      /* the real mix: mature cards are typed, the rest are cover-recall */
      const task = Sched.isMature(c.id) ? 'produce' : 'recall';
      UI.markFam(c.id, ok, { task: task, assisted: task === 'recall' });
    });
    Store.set('did:' + Sched.todayStr(), true);
  }
  const introduced = UI.allActiveCards()
    .filter(c => c.freq !== 'extra' && Store.get('seen:' + c.id, false)).length;
  const total = UI.allActiveCards().filter(c => c.freq !== 'extra').length;
  return { introduced, total, blocked, lapses, perDay: +(reviews / days).toFixed(1) };
}

(async function () {
  await Storage.putProfile({ id: 'sim', name: 'Sim', role: 'student' });

  console.log('driving the real Sched.grade and the real session selection\n');
  const r95 = await simulate(0.95, 180, 11);
  console.log('   @95%:', JSON.stringify(r95));
  const r75 = await simulate(0.75, 180, 3);
  console.log('   @75%:', JSON.stringify(r75));
  /* 85% runs LAST so the sections below inspect the state it left */
  const r85 = await simulate(0.85, 180, 7);
  console.log('   @85%:', JSON.stringify(r85));

  console.log('\n1. THE COURSE REACHES ITS CONTENT');
  ok(r85.introduced === r85.total,
     'every drillable card is introduced within 180 days at 85% (' + r85.introduced + '/' + r85.total + ')');
  ok(r95.introduced === r95.total, 'and at 95%');

  console.log('\n2. THE SESSION STAYS A SESSION');
  ok(r85.perDay <= 30, r85.perDay + ' reviews a day at 85% is still a short sitting');
  ok(r85.perDay >= 3, 'and it is not trivially small (' + r85.perDay + ')');

  console.log('\n3. NOTHING INTRODUCED BECOMES UNREACHABLE');
  /* inspect the state the 85% run just left - do NOT reload, which would read
     back whatever the debounced persist had managed to write */
  await Storage.flush();
  const m1 = UI.allActiveCards().filter(c => c.courseId === 'month1' && c.freq !== 'extra');
  ok(m1.length > 0, 'month 1 has ' + m1.length + ' drillable cards');
  const stillSeen = m1.filter(c => Store.get('seen:' + c.id, false)).length;
  ok(stillSeen === m1.length,
     'all of them were still introduced after six months on later months (' + stillSeen + '/' + m1.length + ')');
  const m1due = m1.filter(c => Sched.isDue(c.id)).length;
  ok(m1due >= 0 && Views.todayPlan().due.some(c => c.courseId === 'month1') || m1due === 0,
     'and month-1 words are still served once the learner is past month 1');
  const plan = Views.todayPlan();
  ok(plan.all.length === r85.total, 'and the review pool still spans every course');

  console.log('\n4. NEW WORDS DO NOT NEED A WEEK BOX TICKED');
  await Storage.load('sim');
  await Storage.replaceAll({});
  Views.resetToday();
  const w1 = UI.allActiveCards().filter(c => c.courseId === 'month1' && c.week === 1 && c.freq !== 'extra');
  w1.forEach(c => Store.set('seen:' + c.id, true));
  const after = Views.todayPlan();
  ok(after.frontier >= 2, 'learning week 1 moves the frontier on without any week box (frontier ' + after.frontier + ')');

  console.log('\n5. AT A LOW ACCURACY REVIEW TAKES PRIORITY - A KNOWN TRADE-OFF');
  console.log('   @75% reached', r75.introduced + '/' + r75.total, 'with', r75.blocked, 'blocked days');
  ok(r75.introduced <= r85.introduced,
     'struggling means less new material, by design, not by accident');

  console.log('\n6. THE CEILING DOES NOT RETIRE WORDS INSIDE THE COURSE');
  const MAXI = +(/var MAX_INTERVAL = (\d+)/.exec(
    require('fs').readFileSync(require('path').resolve(__dirname, '../js/schedule.js'),'utf8'))||[])[1];
  ok(MAXI < 180, 'the interval cap (' + MAXI + 'd) is shorter than the course');
  ok(MAXI >= 30, 'but long enough to be a real gap');
  Sched.setClock(null);
  done();
})().catch(e => { console.log('THREW: ' + e.message + '\n' + e.stack); process.exit(2); });
