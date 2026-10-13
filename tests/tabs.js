/* The tabs, organised: every game and test in a named group, situations by
   field with the rescue scene first, the word filters in labelled rows, the
   guide in groups with a jump row and its documented features sourced, the
   teacher page with anchors, and the notes and map cards extended. Reading
   any of it writes nothing. */
require(__dirname + '/boot.js');
const docJSON = () => JSON.stringify(Storage.currentDoc().entries);
(async function () {
  await Storage.putProfile({ id: 'h', name: 'Hamza', role: 'student' }); await Storage.load('h');
  const before = docJSON();

  console.log('1. GAMES AND TESTS ARE GROUPED, AND NOTHING IS LEFT OUT');
  ok(Games.list.every(g => /^(words|sentences|numbers)$/.test(g.group)), 'every game has one of three groups');
  const gv = Games.listView('');
  ok(['Words', 'Sentences and conversations', 'Numbers'].every(t => gv.indexOf('>' + t + '<small>') > 0), 'the games page shows the three group headings');
  ok(gv.split('href="#/games/').length - 1 === Games.list.length, 'every game is listed once');
  ok(Tests.list.every(t => /^(quick|pictures|ear|sentences)$/.test(t.group)), 'every test has one of four groups');
  const tv = Views.tests();
  ok(['A quick round', 'Pictures', 'The Tetouani ear', 'Sentences and speaking'].every(t => tv.indexOf('>' + t + '<small>') > 0), 'the tests page shows the four group headings');
  ok(tv.split('href="#/tests/').length - 1 === Tests.list.length, 'every test is listed once');
  ok(tv.indexOf('emoji') < 0, 'the note no longer calls the pictures emoji');

  console.log('\n2. SITUATIONS: THE RESCUE SCENE FIRST, THEN BY FIELD');
  const sv = Views.situations();
  const ids = [...sv.matchAll(/href="#\/situations\/([a-z]+)"/g)].map(m => m[1]);
  ok(ids[0] === 'repair', 'the first tile is "when you don\'t understand"');
  ok(new Set(ids).size === window.DARIJA.situations.length && ids.length === window.DARIJA.situations.length, 'all eight situations appear, each once');
  ok(sv.indexOf('Start here') > 0 && /Café, food (&amp;|&) market/.test(sv) && sv.indexOf('Getting around Tetouan') > 0, 'grouped under the field headings');

  console.log('\n3. WORD FILTERS IN LABELLED ROWS');
  const wv = Views.vocab();
  ok(['For you', 'Month', 'How common', 'How Tetouani', 'Topic'].every(l => wv.indexOf('<span class="chiplab">' + l + '</span>') > 0), 'five labelled rows');
  ok(wv.indexOf('data-f="weak"') > 0 && wv.indexOf('data-f="c:month1"') > 0 && wv.indexOf('data-f="tetouan"') > 0, 'the chips still carry their filters');
  ok((wv.match(/data-f="/g) || []).length >= 14, 'no filter was lost (' + (wv.match(/data-f="/g) || []).length + ' chips)');

  console.log('\n4. THE GUIDE: GROUPS, A JUMP ROW, DOCUMENTED FEATURES WITH SOURCES');
  const dl = window.DARIJA.dialect;
  ok(dl.contrasts.every(c => /^(sounds|verbs|words)$/.test(c.group)), 'every contrast has a group');
  ok(dl.documented.length === 6 && dl.documented.every(x => /^https:\/\/corvam/.test(x.url) && x.form && x.what && dl.scopes[x.scope]), 'six documented features, each with its CORVAM source, form, explanation and a real scope');
  ok(dl.recording && /2012/.test(dl.recording.when) && /Vicente/.test(dl.recording.by), 'the recording is described');
  const dv = Views.dialect();
  ok(dv.indexOf('data-jump="dg-sounds"') > 0 && dv.indexOf('id="dg-sounds"') > 0 && dv.indexOf('id="dg-more"') > 0 && dv.indexOf('id="dg-sources"') > 0, 'the jump row points at anchors that exist');
  ok(dv.split('class="panel documented"').length - 1 === 6, 'the six features are on the page');
  ok(dv.indexOf('not a spelling to learn') > 0, 'and the page says the form is the corpus\'s transcription, not a spelling to learn');
  ok(dv.indexOf('Listen and read it at CORVAM') > 0 && dv.indexOf('not copied here') > 0, 'the recording links out and says the audio is not copied');

  console.log('\n5. NOTES AND MAP CARDS');
  ok(Notes.all().length === 10 && Notes.all().every(n => /^https:\/\//.test(n.url) && window.DARIJA.gallery[n.photo] && Catalog.byId(n.field)), 'ten notes, each sourced, with a real photo and field');
  const okla = window.DARIJA.map.places.find(p => p.id === 'okla'), mehdi = window.DARIJA.map.places.find(p => p.id === 'mehdi');
  ok(okla.note === 'museum' && /1948/.test(okla.what), 'Bab Okla tells the museum\'s story');
  ok(mehdi.note === 'church' && /1917 or 1926/.test(mehdi.what), 'Place Moulay el Mehdi names the church and says the year is disputed');
  ok(Notes.all().find(n => n.id === 'church').text.indexOf('uncertain') > 0, 'the church note says the year is uncertain');

  console.log('\n6. THE TEACHER PAGE HAS A MAP');
  Store.set(Store.kRole, 'teacher');
  const tp = Views.teacher();
  const anchors = [...tp.matchAll(/<h2 id="(t-[a-z0-9-]+)">/g)].map(m => m[1]);
  ok(anchors.length >= 8, anchors.length + ' sections with anchors');
  ok(anchors.every(a => tp.indexOf('data-jump="' + a + '"') > 0), 'and a jump button for each');
  ok(tp.indexOf('class="jumprow"') < tp.indexOf('<h2 id='), 'the jump row comes before the first section');
  Store.set(Store.kRole, 'student');

  console.log('\n7. NONE OF IT WROTE ANYTHING');
  Store.set(Store.kRole, 'student');
  ok(docJSON() === before.replace(/"role":"student"/, '"role":"student"'), 'the document is unchanged by rendering every tab');
  done();
})().catch(e => { console.log('THREW: ' + e.message + '\n' + e.stack); process.exit(2); });
