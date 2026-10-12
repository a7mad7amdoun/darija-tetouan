/* The recorder. No microphone in Node, so what is tested is everything around
   it: the batch is the checklist's 32 real cards; the manifest entry a kept
   clip earns matches the audio module's gate; the zip it writes is a valid
   zip (Python's zipfile reads it back byte for byte); and nothing the page
   does touches the progress document. */
require(__dirname + '/boot.js');
const fs = require('fs'), path = require('path'), cp = require('child_process');
const docJSON = () => JSON.stringify(Storage.currentDoc().entries);
(async function () {
  await Storage.putProfile({ id: 't', name: 'Ahmed', role: 'teacher' });
  await Storage.load('t');
  Store.set(Store.kRole, 'teacher');
  const by = {}; UI.allActiveCards().forEach(c => { by[c.id] = c; });

  console.log('1. THE FIRST BATCH IS THE CHECKLIST, AND EVERY LINE IS A REAL CARD');
  ok(Recorder.BATCH.length === 32, '32 lines');
  const missing = Recorder.BATCH.filter(id => !by[id]);
  ok(missing.length === 0, 'every id is a card in the course' + (missing.length ? ': ' + missing.join(', ') : ''));
  const md = fs.readFileSync(path.join(__dirname, '..', 'AUDIO-RECORDING-CHECKLIST.md'), 'utf8');
  ok(Recorder.BATCH.every(id => md.indexOf('`' + id + '`') >= 0), 'and each is in AUDIO-RECORDING-CHECKLIST.md');

  console.log('\n2. A KEPT CLIP EARNS EXACTLY THE ENTRY THE AUDIO GATE WANTS');
  const c = by['w1-ntina'];
  const m = Recorder.manifestEntry(c, { ext: 'm4a', at: '2026-10-12T10:00:00.000Z' });
  ok(m.file === 'w1-ntina.m4a' && m.verified === true && m.scope === c.scope && m.rev === (c.audioRev || 1), 'file by id, verified, the card\'s scope and revision');
  DARIJA.audio.clips[c.id] = { file: m.file, speaker: m.speaker, scope: m.scope, verified: m.verified, rev: m.rev };
  ok(Audio2.playable(c.id, c), 'the audio module accepts it as playable');
  ok(!Audio2.mismatched(c.id, c) && !Audio2.isStale(c.id, c), 'not mismatched, not stale');
  delete DARIJA.audio.clips[c.id];
  const snip = Recorder.manifestSnippet(by, { 'w1-hello': { ext: 'webm', at: '2026-10-12T10:00:00.000Z' }, 'nope': { ext: 'm4a', at: '' } });
  ok(/'w1-hello': \{ file: 'w1-hello\.webm'/.test(snip) && snip.indexOf('nope') < 0, 'the snippet lists kept cards only, by id');

  console.log('\n3. THE ZIP IS A REAL ZIP');
  const enc = new TextEncoder();
  const bytes = Recorder.zip([{ name: 'w1-hello.m4a', data: enc.encode('not really audio, but bytes') },
                              { name: 'audio-manifest-snippet.js', data: enc.encode(snip) }]);
  const tmp = path.join(require('os').tmpdir(), 'tt-rec-' + process.pid + '.zip');
  fs.writeFileSync(tmp, bytes);
  let listing = '';
  try { listing = cp.execFileSync('python3', ['-I', '-c', 'import zipfile,sys;z=zipfile.ZipFile(sys.argv[1]);print(z.testzip());[print(i.filename,i.file_size,z.read(i.filename).decode()[:12]) for i in z.infolist()]', tmp]).toString(); }
  catch (e) { listing = 'ERR ' + e.message; }
  fs.unlinkSync(tmp);
  ok(/^None\n/.test(listing), 'Python\'s zipfile finds no corrupt entry');
  ok(/w1-hello\.m4a 27 not really/.test(listing) && /audio-manifest-snippet\.js/.test(listing), 'both files read back with their names and sizes');
  ok(Recorder.crc32(enc.encode('123456789')) === 0xCBF43926, 'crc32 of "123456789" is the standard check value');

  console.log('\n4. THE PAGE');
  const before = docJSON();
  const v = Recorder.view();
  ok(/Record the course/.test(v) && v.split('data-rec="record"').length - 1 >= 32, 'a record control for every batch line');
  ok(/data-rec="export"[^>]*disabled/.test(v), 'download is disabled while nothing is kept');
  Recorder.search('tea');
  ok(/w2-atay/.test(Recorder.view()), 'any word can be found and recorded');
  ok(docJSON() === before, 'rendering and searching write nothing to progress');
  Store.set(Store.kRole, 'student');
  ok(/for the teacher/.test(Recorder.view()), 'a student sees nothing to record');
  ok(Recorder.MEDIA_DB === Audio2.MEDIA_DB && Recorder.MEDIA_DB !== 'darija-tetouan', 'clips go to the media database, not the progress one');
  done();
})().catch(e => { console.log('THREW: ' + e.message + '\n' + e.stack); process.exit(2); });
