const { makeShim } = require(__dirname + '/idb-shim.js');
const fs = require('fs');
const P = require('path').resolve(__dirname, '..') + '/';
global.window = global;
/* Tests never touch the network: the live database holds real people's
   progress. Anything that tries fails loudly here instead of reaching it. */
global.fetch = () => Promise.reject(new Error('tests must not use the network'));
global.indexedDB = makeShim();
/* Node >=21 ships a built-in `navigator` behind a getter, so assigning a whole
   new object is silently dropped. Define the property instead. */
Object.defineProperty(globalThis,'navigator',{value:{onLine:true},writable:true,configurable:true});
global.crypto = require('crypto').webcrypto;
const mem = {};
global.localStorage = { getItem:k=>k in mem?mem[k]:null, setItem:(k,v)=>{mem[k]=String(v)},
  removeItem:k=>{delete mem[k]}, clear:()=>{for(const k in mem)delete mem[k]} };
const el = () => ({ style:{}, dataset:{}, classList:{toggle(){},add(){},remove(){},contains:()=>false},
  addEventListener(){}, appendChild(){}, remove(){}, click(){}, setAttribute(){}, removeAttribute(){},
  querySelector:()=>null, querySelectorAll:()=>[], innerHTML:'', textContent:'' });
global.document = { getElementById:()=>el(), querySelector:()=>el(), querySelectorAll:()=>[],
  addEventListener(){}, createElement:el, body:el(), documentElement:Object.assign(el(),{clientWidth:900}), title:'' };
global.addEventListener = () => {}; global.setInterval = () => 0;
global.location = { hash:'#/', search:'', href:'http://x/' };
global.matchMedia = () => ({ matches:false, addEventListener(){} });
['data/photos.js','data/verify.js','data/flags.js','data/dialect.js','data/situations.js',
 'data/month1.js','data/month2.js','data/month3.js','data/courses.js','data/audio.js','data/photo-library.js',
 'js/db.js','js/legacy-manifest.js','js/validation.js','js/supabase-config.js','js/auth.js',
 'js/storage.js','js/audio.js','js/attempts.js','js/schedule.js','js/store.js','js/migrations.js','js/sync.js','js/backup.js',
 'js/tests.js','js/exams.js','js/components.js','js/content-manifest.js',
 'js/views.js','js/views-tests.js','js/views-today.js','js/views-exams.js','js/views-account.js',
 'js/feedback.js','js/weakspots.js','js/teacher.js'].forEach(f => eval(fs.readFileSync(P+f,'utf8')));
let pass=0, fail=0;
global.ok = (c,m)=>{ c ? (pass++, console.log('  PASS  '+m)) : (fail++, console.log('  FAIL  '+m)); };
global.done = () => { console.log('\n=== '+pass+' passed, '+fail+' failed ==='); process.exit(fail?1:0); };
