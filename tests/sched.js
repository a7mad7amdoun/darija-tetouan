require(__dirname + '/boot.js');
const T = Sched.todayStr();
const plus = n => Sched.addDays(T, n);
/* A review ladder is measured in DAYS. The scheduler now refuses to advance a
   card twice in one day, so a test that grades the same card repeatedly has to
   move the clock on between answers or it is testing a different thing. */
const nextDay = id => {
  const s = Sched.get(id); if (s) { s.a = null; Store.set('sched:'+id, s); }
  Store.set('att:'+id, Attempts.all(id).map(r =>
    Object.assign({}, r, { at: new Date(Date.parse(r.at) - 86400000).toISOString() })));
};
(async function(){
  await Storage.putProfile({id:'h',name:'Hamza',role:'student'});
  await Storage.load('h');

  console.log('1. THE BUG THIS REPLACES');
  const id='w1-hello';
  UI.markFam(id,true); UI.markFam(id,true);
  ok(UI.strength(id)===3,'two right answers still make it read as solid');
  ok(Sched.isTracked(id),'but it is now scheduled rather than retired');
  ok(Sched.get(id).d > T,'and it has a future due date');

  console.log('\n2. THE LADDER GROWS');
  const a='w1-labas';
  /* graded by production each time, so the recognition cap never applies */
  const g = () => Sched.grade(a,true,{task:'produce'});
  g();
  ok(Sched.get(a).i===1,'first correct -> 1 day');
  ok(Sched.get(a).d===plus(1),'due tomorrow');
  nextDay(a); g();
  ok(Sched.get(a).i===3,'second correct -> 3 days');
  nextDay(a); g();
  ok(Sched.get(a).i===Math.round(3*2.5),'third correct -> 3 x ease = '+Sched.get(a).i+' days');
  const before=Sched.get(a).i;
  nextDay(a); g();
  ok(Sched.get(a).i>before,'it keeps growing ('+Sched.get(a).i+' days)');

  console.log('\n2b. BUT NOT TWICE IN ONE DAY');
  const held = JSON.parse(JSON.stringify(Sched.get(a)));
  g(); g();
  ok(Sched.get(a).i===held.i && Sched.get(a).d===held.d,
     'two more correct answers the same day leave the calendar alone');

  console.log('\n3. FAILING TO PRODUCE IT BRINGS IT BACK, AND COSTS EASE');
  const easeBefore=Sched.get(a).e;
  Sched.grade(a,false,{task:'produce'});
  ok(Sched.get(a).d===plus(1),'a wrong answer puts it back tomorrow');
  ok(Sched.get(a).i===0,'the interval resets');
  ok(Sched.get(a).e===easeBefore-20,'and the ease drops, so future gaps are shorter');
  ok(Sched.get(a).l===1,'the lapse is recorded');

  console.log('\n3b. BUT A MIS-TAPPED MULTIPLE CHOICE DOES NOT');
  const soft='x-bokadyo';
  Store.set('sched:'+soft,{d:T,i:20,e:250,n:5,l:0});
  Sched.grade(soft,false,{task:'recognise'});
  const sv=Sched.get(soft);
  ok(sv.l===0,'a wrong option records no lapse');
  ok(sv.e===250,'and costs no ease - one of four options is weak evidence');
  ok(sv.i===10,'it just halves the gap and comes back tomorrow (i='+sv.i+')');
  ok(sv.d===plus(1),'due tomorrow');

  console.log('\n4. EASE HAS A FLOOR');
  for (let i=0;i<20;i++) { nextDay(a); Sched.grade(a,false,{task:'produce'}); }
  ok(Sched.get(a).e===130,'ease bottoms out at 1.30 rather than reaching zero');

  console.log('\n5. INTERVALS ARE CAPPED AT THE COURSE LENGTH');
  const b='w1-bikhir';
  for (let i=0;i<40;i++) { nextDay(b); Sched.grade(b,true,{task:'produce'}); }
  ok(Sched.get(b).i<=180,'capped at 180 days (got '+Sched.get(b).i+')');

  console.log('\n6. DUE MEANS DUE');
  const c1='x-tabla';
  Sched.grade(c1,true,{task:'produce'});
  ok(!Sched.isDue(c1),'a word due tomorrow is not due today');
  ok(Sched.isDue(c1, plus(1)),'it is due tomorrow');
  ok(Sched.isDue(c1, plus(9)),'and still due if they skip a week');
  ok(Sched.nextIn(c1)===1,'it reports coming back in 1 day');

  console.log('\n7. THE MOST OVERDUE COMES FIRST');
  const mk=(id,days)=>{ Store.set('sched:'+id,{d:Sched.addDays(T,-days),i:5,e:250,n:3,l:0}); };
  mk('x-furnu',30); mk('x-kuzina',1); mk('x-fishta',10);
  const order = Sched.dueCards([{id:'x-kuzina'},{id:'x-furnu'},{id:'x-fishta'}]).map(c=>c.id);
  ok(JSON.stringify(order)==='["x-furnu","x-fishta","x-kuzina"]','30 days late before 10 before 1');

  console.log('\n8. NOTHING IS EVER RETIRED');
  const far='x-qamija';
  for (let i=0;i<40;i++) { nextDay(far); Sched.grade(far,true,{task:'produce'}); }
  ok(Sched.get(far).d > T,'a long-known word still has a date');
  ok(Sched.isDue(far, Sched.addDays(T,181)),'and it does come back, just much later');

  console.log('\n9. MATURE WORDS GET ASKED FOR BY PRODUCTION');
  const m='x-kama';
  Sched.grade(m,true,{task:'produce'});
  ok(!Sched.isMature(m),'one correct answer is not maturity');
  nextDay(m); Sched.grade(m,true,{task:'produce'});
  ok(Sched.isMature(m),'two, on separate days, at a three-day gap, is');
  Sched.grade(m,false,{task:'produce'});
  ok(!Sched.isMature(m),'a lapse takes it out of maturity until it is relearned');

  console.log('\n10. IT SYNCS AND VALIDATES');
  ok(Sync.classify('sched:w1-hello')==='lww',"'sched:' classifies for sync");
  const errs = Validate.progress(Storage.currentDoc(),{manifest:true});
  ok(errs.length===0,'the document validates clean'+(errs.length?': '+Validate.describe(errs).slice(0,200):''));
  const bad={schemaVersion:2,contentVersion:1,profileId:'x',entries:{
    'sched:w1-hello':{d:'not-a-date',i:-1,e:9999,n:-2}}};
  ok(Validate.progress(bad,{manifest:false}).length>=4,'a malformed schedule is reported');
  ok(bad.entries['sched:w1-hello'].e===9999,'and not silently repaired');
  done();
})().catch(e=>{console.log('THREW: '+e.message+'\n'+e.stack);process.exit(2);});
