const { makeShim } = require(__dirname + '/idb-shim.js');
const fs = require('fs');
const P = require('path').resolve(__dirname, '..') + '/';
global.window = global; global.indexedDB = makeShim();
/* Tests never touch the network: the live database holds real people's
   progress. Anything that tries fails loudly here instead of reaching it. */
global.fetch = () => Promise.reject(new Error('tests must not use the network'));
Object.defineProperty(globalThis,'navigator',{value:{onLine:true},writable:true,configurable:true});
global.crypto = require('crypto').webcrypto;
const mem = {};
global.localStorage = { getItem:k=>k in mem?mem[k]:null, setItem:(k,v)=>{mem[k]=String(v)},
  removeItem:k=>{delete mem[k]}, clear:()=>{for(const k in mem)delete mem[k]} };
const el = () => ({ style:{}, dataset:{}, classList:{toggle(){},add(){},remove(){}},
  addEventListener(){}, appendChild(){}, remove(){}, click(){} });
global.document = { getElementById:()=>null, querySelector:()=>null, querySelectorAll:()=>[],
  addEventListener(){}, createElement:el, body:el(), documentElement:el() };
global.addEventListener = () => {}; global.setInterval = () => 0;

localStorage.setItem('darija.tetouan.v1', JSON.stringify({
  'chk:month1:w1:0': true, 'chk:month1:w1:2': true, 'cp:month1:4': true,
  'spoken:six:1': true, 'fam:w1-hello': { r: 3, w: 1 }, 'rate:month1:w1': 4,
  'exam:m:month1': [{ score: 12, total: 20, date: '2026-09-01', pct: 60 }],
  'day:month1:w1:d1': true, 'note:month1:w1': 'he mixed up left and right', 'theme': 'dark' }));

['data/photos.js','data/verify.js','data/flags.js','data/dialect.js','data/situations.js',
 'data/month1.js','data/month2.js','data/month3.js','data/courses.js','data/audio.js',
 'js/db.js','js/legacy-manifest.js','js/validation.js','js/supabase-config.js','js/auth.js',
 'js/storage.js','js/audio.js','js/attempts.js','js/schedule.js','js/store.js',
 'js/migrations.js','js/sync.js','js/backup.js','js/tests.js','js/exams.js',
 'js/components.js','js/content-manifest.js'].forEach(f => eval(fs.readFileSync(P+f,'utf8')));

let pass=0, fail=0;
const ok=(c,m)=>{c?(pass++,console.log('  PASS  '+m)):(fail++,console.log('  FAIL  '+m));};
(async function(){
 try{
  console.log('1. LEGACY DETECTION');
  ok(Migrations.legacyPresent(),'legacy data detected');
  const pv = Migrations.previewLegacy();
  ok(pv.total===10,'preview sees 10 entries'); ok(pv.safe,'preview reports it is safe');
  ok(pv.moved.length===4,'4 index keys to rewrite');
  ok(localStorage.getItem('darija.tetouan.v1')!==null,'preview left the original alone');

  console.log('\n2. MIGRATION');
  await Storage.putProfile({id:'hamza',name:'Hamza',role:'student'});
  const res = await Migrations.migrateLegacy('hamza');
  ok(res.migrated===9,'9 entries migrated, theme excluded');
  ok(res.remapped===4,'4 rewritten to stable ids');
  ok(!!(await DB.get('meta','legacyArchive')),'verbatim archive kept');
  ok((await Migrations.listBackups()).length>=1,'a backup was written first');

  console.log('\n3. READ BACK THROUGH THE UI STORE');
  await Storage.load('hamza');
  const w1 = DARIJA.month1.weeks[0];
  const id0=w1.selfCheck[0].id, id1=w1.selfCheck[1].id, id2=w1.selfCheck[2].id;
  ok(Store.get(Store.kCheck('month1',1,id0),false)===true,'tick 0 survived as '+id0);
  ok(Store.get(Store.kCheck('month1',1,id2),false)===true,'tick 2 survived');
  ok(Store.get(Store.kCheck('month1',1,id1),false)===false,'tick 1 correctly still off');
  ok(JSON.stringify(Store.get('fam:w1-hello',null))==='{"r":3,"w":1}','counter intact');

  console.log('\n4. SHARED vs STUDENT, INCLUDING THE NEW KEYS');
  ok(Storage.currentShared().entries['note:month1:w1']==='he mixed up left and right','teacher note is shared');
  ok(Storage.currentDoc().entries['note:month1:w1']===undefined,'teacher note NOT in student doc');
  ok(Storage.isShared('obs:stu-a:w1-hello'),'a per-student observation is teacher data');
  ok(!Storage.isShared('att:w1-hello'),'an attempt log is the student\'s own');
  ok(!Storage.isShared('sched:w1-hello'),'so is a schedule');

  console.log('\n5. PERSISTENCE ACROSS RELOAD');
  Store.set(Store.kDay('month1',1,2),true);
  UI.markFam('w1-labas',true,{task:'produce'});
  await Storage.flush(); Storage.unload();
  ok(Storage.snapshot().ready===false,'unload cleared memory');
  await Storage.load('hamza');
  ok(Store.get(Store.kDay('month1',1,2),false)===true,'write survived reload');
  ok(Attempts.all('w1-labas').length===1,'the attempt survived reload');
  ok(!!Sched.get('w1-labas'),'and so did its schedule');

  console.log('\n6. PROFILE ISOLATION');
  await Storage.putProfile({id:'wife',name:'Wife',role:'student'});
  await Storage.load('wife');
  ok(Store.get(Store.kCheck('month1',1,id0),false)===false,"wife cannot see Hamza's tick");
  ok(Attempts.all('w1-labas').length===0,"nor his attempts");
  await Storage.load('hamza');
  ok(Attempts.all('w1-labas').length===1,"and his are unaffected");

  console.log('\n7. SYNC OUTBOX');
  const box = await DB.values('outbox');
  ok(box.length>0,'changes queued ('+box.length+')');
  ok(box.some(c=>c.op==='increment'),'counters recorded as increments');
  ok(box.filter(c=>c.entityId.startsWith('att:')).every(c=>c.op==='append'),'attempt logs queued as appends');
  ok(box.every(c=>/^[0-9a-f]{8}-/.test(c.id)),'every change has a uuid');

  console.log('\n8. BACKUP ROUND TRIP, WITH THE NEW KEYS');
  const before = JSON.stringify(Storage.currentDoc().entries);
  const bk = Backup.exportBackup();
  ok(bk.kind==='darija-tetouan-backup','export well formed');
  const pv2 = Backup.inspect(JSON.stringify(bk));
  ok(pv2.ok && pv2.counts.changed===0 && pv2.counts.added===0,'own export imports as a no-op');
  await Storage.replaceAll({});
  ok(Object.keys(Storage.currentDoc().entries).length===0,'progress wiped');
  await Backup.apply(Backup.inspect(JSON.stringify(bk)),{includeShared:false});
  ok(JSON.stringify(Storage.currentDoc().entries)===before,'import restored it exactly');
  ok(Attempts.all('w1-labas').length===1,'including the attempt log');
  ok(!!Sched.get('w1-labas'),'and the schedule');

  console.log('\n9. IMPORT REFUSALS');
  ok(!Backup.inspect('not json').ok,'non-JSON refused');
  ok(!Backup.inspect(JSON.stringify({kind:'other'})).ok,'wrong kind refused');
  const pvf = Backup.inspect(JSON.stringify(Object.assign({},bk,{schemaVersion:99})));
  ok(!pvf.ok && /NEWER/i.test(pvf.errors[0].message),'newer-schema backup refused');

  console.log('\n10. VALIDATION DOES NOT REPAIR');
  const bad={schemaVersion:2,contentVersion:1,profileId:'x',entries:{
    'fam:w1-hello':{r:-1,w:0},'rate:month1:w1':9,'day:x:y:z':'not boolean'}};
  const errs=Validate.progress(bad,{manifest:false});
  ok(errs.length>=3,'reported '+errs.length+' problems');
  ok(bad.entries['rate:month1:w1']===9,'did NOT silently repair');

  console.log('\n11. FAILED MIGRATION LEAVES DATA ALONE');
  localStorage.setItem('darija.tetouan.v1', JSON.stringify({'chk:month1:w1:0':true,'chk:month1:w1:42':true}));
  const snap = localStorage.getItem('darija.tetouan.v1');
  let threw=false;
  try { await Migrations.migrateLegacy('hamza'); } catch(e){ threw=/cannot be mapped/i.test(e.message); }
  ok(threw,'refused an unmappable key');
  ok(localStorage.getItem('darija.tetouan.v1')===snap,'legacy data untouched after refusal');

  console.log('\n=== '+pass+' passed, '+fail+' failed ===');
  process.exit(fail?1:0);
 } catch(e){ console.log('\nSUITE THREW: '+e.message+'\n'+e.stack); process.exit(2); }
})();
