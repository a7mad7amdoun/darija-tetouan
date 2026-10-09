/* Is every record kept, and does every one reach the server?

   Found by the October 2026 audit, and reproduced here against the real
   modules before they were fixed:
     - two test results in one session: two kept locally, ONE queued to upload
       (the recorder pushed onto the stored array, so the sync layer's "before"
       already held the new result and it looked like nothing had changed)
     - the 41st result silently removed the 1st (a slice(-40))
     - "last practised" read from list position; a list merged with the server
       comes back ordered by id, so it could report an older attempt
     - two of the teacher's devices adding an observation offline: the server
       keeps shared rows newest-wins, and the earlier note never got back to it

   Single-device checks use the normal harness. The two-device check loads the
   real modules into two separate sandboxes with a stand-in server that applies
   the same newest-wins rule as supabase/schema.sql. No network, no database. */
require(__dirname + '/boot.js');
const fs = require('fs'), vm = require('vm'), path = require('path');
const ROOT = path.resolve(__dirname, '..');
const tick = (ms = 15) => new Promise(r => setTimeout(r, ms));
const clone = x => JSON.parse(JSON.stringify(x));

async function queuedAppends(key) {
  const all = await DB.values('outbox');
  return all.filter(c => c.entityId === key && c.op === 'append')
            .reduce((ids, c) => ids.concat(c.payload.map(r => r.id)), []);
}

(async function () {
  await Storage.putProfile({ id: 'h', name: 'Hamza', role: 'student' });
  await Storage.load('h');

  console.log('1. EVERY TEST RESULT IN A SESSION IS QUEUED TO UPLOAD');
  Tests.record('hist-t', 1, 2, '2026-10-09');
  Tests.record('hist-t', 2, 2, '2026-10-09');
  await tick();
  const tIds = Tests.results('hist-t').map(r => r.id);
  const tQueued = await queuedAppends('testres:hist-t');
  ok(tIds.length === 2, 'two results are kept on the device');
  ok(tQueued.length === 2 && tIds.every(id => tQueued.includes(id)),
     'and both are queued for the server (it was one: ' + tQueued.length + ')');

  console.log('\n2. THE SAME FOR EXAMS');
  Exams.record('hist-e', 3, 5, '2026-10-09');
  Exams.record('hist-e', 5, 5, '2026-10-09');
  await tick();
  const eIds = Exams.results('hist-e').map(r => r.id);
  const eQueued = await queuedAppends('exam:hist-e');
  ok(eIds.length === 2 && eQueued.length === 2 && eIds.every(id => eQueued.includes(id)),
     'two exam results kept, and both queued (' + eQueued.length + ')');

  console.log('\n3. NOTHING IS EVER TRIMMED FROM A HISTORY');
  const firstBefore = JSON.stringify(Tests.results('hist-t')[0]);
  for (let i = 0; i < 43; i++) Tests.record('hist-t', i % 3, 2, '2026-10-09');
  for (let i = 0; i < 43; i++) Exams.record('hist-e', i % 5, 5, '2026-10-09');
  ok(Tests.results('hist-t').length === 45, 'forty-five test results are forty-five (was capped at 40)');
  ok(Exams.results('hist-e').length === 45, 'forty-five exam results are forty-five');
  ok(JSON.stringify(Tests.results('hist-t')[0]) === firstBefore,
     'and the first one is still there, byte for byte');
  ok(Tests.results('hist-t').every(r => r.id) && new Set(Tests.results('hist-t').map(r => r.id)).size === 45,
     'every result keeps its own stable id');
  ok(Validate.progress(Storage.currentDoc(), { manifest: false }).length === 0,
     'and the document still validates, with the new time stamp on each result');

  console.log('\n4. A RETRY UPLOADS NOTHING TWICE');
  const before4 = (await DB.values('outbox')).length;
  Store.set('testres:hist-t', Tests.results('hist-t').slice());   // same records, new array
  await tick();
  ok((await DB.values('outbox')).length === before4, 'writing the same records again queues nothing');

  console.log('\n5. A CALLER THAT STILL CHANGES THE LIST IN PLACE IS NOT LOST');
  /* the old pattern, kept here deliberately: read the stored array, push, write
     the same array back. The snapshot cannot see this; the sync layer is told. */
  Store.set('testres:hist-raw', []);
  const live = Store.get('testres:hist-raw', []);
  const raw = { id: 'raw-1', score: 1, total: 1, date: '2026-10-09' };
  live.push(raw);
  Store.set('testres:hist-raw', live);
  await tick();
  ok((await queuedAppends('testres:hist-raw')).includes('raw-1'),
     'a record pushed onto the stored array is still queued for upload');

  console.log('\n6. TWO DEVICES: EACH ONE\'S RESULTS SURVIVE THE MERGE');
  const mine = { id: 'dev-a', score: 1, total: 2, date: '2026-10-08', at: '2026-10-08T09:00:00.000Z' };
  const both = { id: 'dev-both', score: 2, total: 2, date: '2026-10-08', at: '2026-10-08T08:00:00.000Z' };
  const theirs = { id: 'dev-b', score: 0, total: 2, date: '2026-10-08', at: '2026-10-08T10:00:00.000Z' };
  Store.set('testres:hist-m', [both, mine]);
  await Sync.mergeRemote({ entries: { 'testres:hist-m': { value: [theirs, both], at: '2026-10-08T10:00:01.000Z' } } });
  const m = Tests.results('hist-m').map(r => r.id).sort();
  ok(JSON.stringify(m) === JSON.stringify(['dev-a', 'dev-b', 'dev-both']),
     'the union holds all three, each once');

  console.log('\n7. "LATEST" MEANS LATEST IN TIME, NOT LAST IN THE LIST');
  const newer = { id: 'n', at: '2026-10-09T12:00:00.000Z', task: 'produce', ok: true, assisted: false, sched: 'hold' };
  const older = { id: 'o', at: '2026-10-08T12:00:00.000Z', task: 'produce', ok: false, assisted: false, sched: 'hold' };
  const broken = { id: 'b', at: 'not a time', task: 'recognise', ok: false, assisted: false, sched: 'none' };
  Store.set('att:hist-w', [newer, older, broken]);          // server order: by id
  const snapshot = JSON.stringify(Store.get('att:hist-w'));
  const s = Attempts.summary('hist-w');
  ok(s.lastAt === newer.at, 'summary: last practised is the newer attempt (' + s.lastAt + ')');
  ok(s.lastOk === true, 'summary: and its outcome is the newer one\'s');
  ok(Attempts.lastAt('hist-w') === newer.at, 'lastAt agrees');
  ok(Attempts.last('hist-w', r => !r.ok).id === 'o',
     'the latest failure is the older dated one - an unreadable time is never "latest"');
  ok(s.total === 3 && s.failures === 2, 'every attempt is still counted');
  ok(JSON.stringify(Store.get('att:hist-w')) === snapshot, 'and the stored log was read, not reordered');

  Store.set('testres:hist-l', [
    { id: 'z', score: 2, total: 2, date: '2026-10-09', at: '2026-10-09T18:00:00.000Z' },
    { id: 'a', score: 0, total: 2, date: '2026-10-09', at: '2026-10-09T08:00:00.000Z' }]);
  ok(Tests.last('hist-l').id === 'z', 'Tests.last finds the newest result whatever its position');
  Store.set('testres:hist-legacy', [
    { id: 'p', score: 1, total: 2, date: '2026-10-07' },
    { id: 'q', score: 2, total: 2, date: '2026-10-05' }]);
  ok(Tests.last('hist-legacy').id === 'p', 'and older results without a time are ordered by their day');
  Store.set('exam:hist-l', [
    { id: 'y', score: 5, total: 5, date: '2026-10-09', pct: 100, at: '2026-10-09T18:00:00.000Z' },
    { id: 'x', score: 1, total: 5, date: '2026-10-09', pct: 20,  at: '2026-10-09T08:00:00.000Z' }]);
  ok(Exams.last('hist-l').id === 'y', 'Exams.last too');

  console.log('\n8. TWO OF THE TEACHER\'S DEVICES, EACH ADDING AN OBSERVATION OFFLINE');
  const server = {};                                         // shared rows: newest wins
  let seq = 0;
  function device(name) {
    const stores = {};
    const c = {
      console, Date, Math, JSON, Object, Array, Number, String, RegExp, Promise, Error, isNaN,
      parseInt, parseFloat, navigator: { onLine: false },
      setTimeout: () => 0, clearTimeout: () => {}, setInterval: () => 0,
      fetch: () => Promise.reject(new Error('tests must not use the network')),
      localStorage: { getItem: () => null, setItem: () => {}, removeItem: () => {} },
      DB: {
        available: () => true, uuid: () => name + '-' + (++seq),
        get: async (s, k) => (stores[s] && k in stores[s]) ? clone(stores[s][k]) : null,
        put: async (s, k, v) => { (stores[s] = stores[s] || {})[k] = clone(v); },
        del: async (s, k) => { if (stores[s]) delete stores[s][k]; },
        values: async (s) => Object.values(stores[s] || {}).map(clone)
      },
      DARIJA: {}, UI: { esc: x => x },
      Auth: { currentProfile: () => ({ id: 't', name: 'Ahmed', role: 'teacher', local: false }),
              configured: () => false }
    };
    c.window = c;
    vm.createContext(c);
    for (const f of ['js/storage.js', 'js/store.js', 'js/sync.js', 'js/weakspots.js'])
      vm.runInContext(fs.readFileSync(path.join(ROOT, f), 'utf8'), c, { filename: f });
    return { c, stores };
  }
  async function push(dev) {
    await tick(2);
    const changes = Object.values(dev.stores.outbox || {}).sort((a, b) => a.at < b.at ? -1 : 1);
    for (const ch of changes) {
      if (ch.profileId === '_shared') {
        const cur = server[ch.entityId];
        if (!cur || cur.at < ch.at) server[ch.entityId] = { value: clone(ch.payload.value), at: ch.at };
      }
      delete dev.stores.outbox[ch.id];
    }
  }
  async function pull(dev) {
    await dev.c.Sync.mergeRemote({ entries: {}, shared: clone(server) });
    await tick(2);
  }
  const ids = list => (list || []).map(o => o.id).sort();
  const phone = device('phone'), laptop = device('laptop');
  await phone.c.Storage.load('t');
  await laptop.c.Storage.load('t');
  const key = phone.c.Weak.obsKey('h', 'w1-hello');
  phone.c.Weak.observe('h', 'w1-hello', 'pronunciation', 'on the phone');
  await tick(5);
  laptop.c.Weak.observe('h', 'w1-hello', 'retrieval', 'on the laptop');
  await push(phone);
  await push(laptop);
  ok(server[key].value.length === 1,
     'the server alone keeps only the later list - this is the server\'s rule, and it stays');
  await pull(phone);   await push(phone);
  await pull(laptop);  await push(laptop);
  const want = ids(phone.c.Store.get(key, []).concat(laptop.c.Store.get(key, [])).filter((o, i, a) => a.findIndex(p => p.id === o.id) === i));
  ok(want.length === 2, 'two observations exist between the devices');
  ok(JSON.stringify(ids(server[key].value)) === JSON.stringify(want),
     'after each device syncs, the server holds both (it held only the later one)');
  ok(JSON.stringify(ids(laptop.c.Store.get(key, []))) === JSON.stringify(want),
     'and the device whose note was overwritten on the server gets the other one back');
  ok(JSON.stringify(ids(phone.c.Store.get(key, []))) === JSON.stringify(want), 'both devices agree');
  await pull(phone); await pull(laptop);
  ok(!Object.keys(phone.stores.outbox || {}).length && !Object.keys(laptop.stores.outbox || {}).length,
     'and once they agree, nothing more is sent - it does not loop');
  ok(phone.c.Weak.currentKind('h', 'w1-hello') === 'retrieval' &&
     laptop.c.Weak.currentKind('h', 'w1-hello') === 'retrieval',
     'the current kind is the most recent observation\'s, on both devices');

  done();
})().catch(e => { console.log('THREW: ' + e.message + '\n' + e.stack); process.exit(2); });
