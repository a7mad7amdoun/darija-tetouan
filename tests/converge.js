/* Do two devices end up agreeing? The merge rule used to compare an incoming
   value against the whole DOCUMENT's timestamp, so one local write anywhere
   blocked every incoming update everywhere. */
require(__dirname + '/boot.js');
const iso = ms => new Date(ms).toISOString();
const T0 = Date.parse('2026-10-08T10:00:00Z');
(async function(){
  await Storage.putProfile({id:'h',name:'Hamza',role:'student'});
  await Storage.load('h');

  console.log('1. PER-KEY TIMES ARE RECORDED, AND ONLY FOR WHAT WAS WRITTEN');
  Store.set('rate:month1:w1', 3);
  const doc = Storage.currentDoc();
  ok(!!doc.at && !!doc.at['rate:month1:w1'], 'writing a key records when it was written');
  ok(doc.at['rate:month1:w2'] === undefined, 'and does not invent a time for keys never written');
  ok(Storage.keyTime(doc,'rate:month1:w1') === doc.at['rate:month1:w1'], 'keyTime reads it back');

  console.log('\n2. A KEY WRITTEN BEFORE THIS EXISTED FALLS BACK, NOT FAILS');
  const legacy = { schemaVersion:2, contentVersion:1, profileId:'h', entries:{'rate:month1:w3':2},
                   updatedAt: iso(T0) };
  ok(Storage.keyTime(legacy,'rate:month1:w3') === iso(T0),
     'with no per-key map it uses the document timestamp - the previous behaviour');
  ok(Validate.progress(legacy,{manifest:false}).length === 0, 'and such a document still validates');

  console.log('\n3. THE BUG, EXACTLY: A LOCAL WRITE TO ONE KEY BLOCKED ANOTHER');
  /* The precise failure. Key B arrived from the phone at 10:00. We then wrote
     key A locally at 12:00. The phone sends a newer B, from 11:00. It is newer
     than our B (10:00) and must be accepted - but the old rule compared it
     against the DOCUMENT's timestamp, which our 12:00 write to A had bumped, so
     11:00 looked stale and B was rejected. Forever, as long as we kept writing
     anything at all. */
  await Storage.load('h');
  await Storage.replaceAll({});
  const A = 'rate:month1:w1', B = 'rate:month1:w2';
  await Sync.mergeRemote({ entries: { [B]: { value: 3, at: iso(T0) } } });     // B at 10:00
  ok(Store.get(B,0) === 3, 'B arrived from the other device');
  const doc3 = Storage.currentDoc();
  doc3.at[A] = iso(T0 + 2*3600000);                                            // we wrote A at 12:00
  doc3.entries[A] = 9;
  doc3.updatedAt = iso(T0 + 2*3600000);
  /* what the OLD rule would have decided, computed explicitly so this test
     fails if the fix is ever reverted */
  const incomingAt = iso(T0 + 3600000);                                        // 11:00
  ok(!(incomingAt > doc3.updatedAt), 'under the old document-wide comparison this update looked stale');
  ok(incomingAt > Storage.keyTime(doc3, B), 'but against B\'s own time it is genuinely newer');
  await Sync.mergeRemote({ entries: { [B]: { value: 5, at: incomingAt } } });
  ok(Store.get(B,0) === 5, 'and it is now accepted (the old rule rejected it)');
  ok(Store.get(A,0) === 9, 'while our own newer write to A is left alone');

  console.log('\n4. AN OLDER SERVER VALUE STILL LOSES');
  Store.set('rate:month1:w4', 4);
  await Sync.mergeRemote({ entries: {
    'rate:month1:w4': { value: 1, at: iso(Date.now() - 600000) }
  }});
  ok(Store.get('rate:month1:w4', 0) === 4, 'an older incoming value does not overwrite a newer local one');

  console.log('\n5. A NEWER TEACHER NOTE WINS - FOR THE TEACHER, AND NOBODY ELSE');
  /* teacher notes are shared data, and the client refuses to hold shared keys a
     student has no business holding even if the server offers them */
  global.Auth = { currentProfile: () => ({ id:'t', name:'Ahmed', role:'teacher', local:false }) };
  Store.set('note:month1:w1', 'mine, written first');
  await Sync.mergeRemote({ entries: {}, shared: {
    'note:month1:w1': { value: 'theirs, written later', at: iso(Date.now() + 60000) }
  }});
  ok(Storage.currentShared().entries['note:month1:w1'] === 'theirs, written later',
     'a newer teacher note from another of the teacher\'s devices is accepted');
  const log = await DB.get('meta','conflicts');
  ok((log||[]).some(c => c.key === 'note:month1:w1' && c.superseded === 'mine, written first'),
     'and the value it replaced is kept in the conflict log rather than vanishing');

  global.Auth = { currentProfile: () => ({ id:'h', name:'Hamza', role:'student', local:false }) };
  Storage.currentShared().entries['note:month1:w1'] = 'local';
  await Sync.mergeRemote({ entries: {}, shared: {
    'obs:someone:w1-hello': { value: [{id:'o1', note:'private'}], at: iso(Date.now()+90000) },
    'note:month1:w1': { value: 'should not arrive', at: iso(Date.now() + 90000) }
  }});
  ok(Storage.currentShared().entries['obs:someone:w1-hello'] === undefined,
     'a student is refused an observation even if the server offers it');
  ok(Storage.currentShared().entries['note:month1:w1'] === 'local',
     'and refused a private teaching note');

  console.log('\n6. TWO DEVICES WRITING DIFFERENT KEYS BOTH LAND');
  await Storage.load('h');
  await Storage.replaceAll({});
  Store.set('rate:month1:w1', 2);                       // this device
  await Sync.mergeRemote({ entries: {                   // the other device
    'rate:month1:w2': { value: 3, at: iso(Date.now() + 1000) },
    'rate:month1:w3': { value: 4, at: iso(Date.now() + 1000) }
  }});
  ok(Store.get('rate:month1:w1',0) === 2 && Store.get('rate:month1:w2',0) === 3 &&
     Store.get('rate:month1:w3',0) === 4, 'all three keys are present - neither device lost work');

  console.log('\n7. A TICK IS NEVER UN-TICKED BY AN OLDER FALSE');
  Store.set('day:month1:w1:d1', true);
  await Sync.mergeRemote({ entries: {
    'day:month1:w1:d1': { value: false, at: iso(Date.now() - 600000) }
  }});
  ok(Store.get('day:month1:w1:d1',false) === true, 'an older false cannot un-tick a newer true');
  await Sync.mergeRemote({ entries: {
    'day:month1:w1:d1': { value: false, at: iso(Date.now() + 600000) }
  }});
  ok(Store.get('day:month1:w1:d1',true) === false, 'but a genuinely newer false may');

  console.log('\n8. PULLING THE SAME THING TWICE CHANGES NOTHING');
  const snap = JSON.stringify(Storage.currentDoc().entries);
  const payload = { entries: { 'rate:month1:w5': { value: 5, at: iso(Date.now()+2000) } } };
  await Sync.mergeRemote(payload);
  const after1 = JSON.stringify(Storage.currentDoc().entries);
  await Sync.mergeRemote(payload);
  ok(JSON.stringify(Storage.currentDoc().entries) === after1, 'a repeated pull is a no-op');
  ok(after1 !== snap, 'the first one did apply');

  console.log('\n9. SCHEDULES CONVERGE - THE POINT OF ALL THIS');
  await Storage.load('h');
  UI.markFam('w1-hello', true, {task:'produce'});       // this device schedules it
  const localSched = JSON.stringify(Store.get('sched:w1-hello',null));
  await Sync.mergeRemote({ entries: {
    'sched:w1-hello': { value: {d:'2026-12-01',i:40,e:250,n:8,l:0}, at: iso(Date.now()+60000) }
  }});
  const merged = Store.get('sched:w1-hello',null);
  ok(merged.i === 40, 'a newer schedule from the other device is taken (was '+JSON.parse(localSched).i+'d, now '+merged.i+'d)');
  ok(Validate.progress(Storage.currentDoc(),{manifest:true}).length === 0, 'and the document still validates');
  done();
})().catch(e=>{console.log('THREW: '+e.message+'\n'+e.stack);process.exit(2);});
