require(__dirname + '/boot.js');
(async function(){
  await Storage.putProfile({id:'h',name:'Hamza',role:'student'});
  await Storage.load('h');
  const cards = UI.allActiveCards();
  const c = cards[0];

  console.log('1. WITH NO RECORDINGS, IT SAYS SO');
  ok(Audio2.count()===0,'the manifest is empty');
  ok(!Audio2.has(c.id),'no clip for any card');
  const b = Audio2.button(c.id, c);
  ok(/not recorded yet/.test(b),'the control says "not recorded yet"');
  ok(!/data-audio=/.test(b),'and is not clickable, so nothing can pretend to play');
  let threw=false;
  await Audio2.play(c.id,c).catch(()=>{threw=true;});
  ok(threw,'play() refuses rather than failing silently');

  console.log('2. A CLIP IS BOUND TO ONE CONTENT ID');
  DARIJA.audio.clips[c.id] = {file:c.id+'.m4a', speaker:'ahmed', scope:c.scope, verified:true, rev:1};
  ok(Audio2.has(c.id),'the recorded card has a clip');
  ok(!Audio2.has(cards[1].id),'the next card does not borrow it');
  ok(Audio2.url(c.id)==='assets/audio/'+c.id+'.m4a','the url is built from the id, not a guess');
  ok(Audio2.url(c.id).charAt(0)!=='/','the path is relative, so the /darija-tetouan/ subpath works');
  ok(Audio2.button(c.id,c).indexOf('data-audio="'+c.id+'"') >= 0,
     'the button carries that id');

  console.log('3. A CLIP RECORDED AGAINST OLDER WORDING IS NOT PLAYED');
  const revised = Object.assign({}, c, {audioRev: 2});
  ok(Audio2.isStale(c.id, revised),'the clip is stale once the card text is revised');
  ok(/out of date/.test(Audio2.button(c.id, revised)),'and the control says so');
  ok(!Audio2.playable(c.id, revised),'and it will not play');
  let threw2=false;
  await Audio2.play(c.id, revised).catch(()=>{threw2=true;});
  ok(threw2,'play() refuses a stale clip');

  console.log('4. A CLIP WHOSE SCOPE DISAGREES IS A CONTENT ERROR');
  DARIJA.audio.clips[c.id].scope = 'north';
  const tet = Object.assign({}, c, {scope:'tetouan'});
  ok(Audio2.mismatched(c.id, tet),'a north clip on a tetouan card is flagged');
  ok(!Audio2.playable(c.id, tet),'and refused');
  ok(/does not match/.test(Audio2.button(c.id, tet)),'with a message saying why');

  console.log('5. A MISSING OR UNAPPROVED CLIP IS NEVER STOOD IN FOR');
  /* behaviour, not a grep for English words in the source. The old version
     asserted that the strings "fallback" and "substitute" did not appear in a
     file, which any differently-named fallback would have passed. */
  DARIJA.audio.clips[c.id].verified = false;
  ok(!Audio2.playable(c.id, c), 'a clip awaiting approval will not play');
  ok(/awaiting approval/.test(Audio2.button(c.id, c)), 'and says it is awaiting approval');
  let refused = false;
  await Audio2.play(c.id, c).catch(()=>{refused=true;});
  ok(refused, 'play() refuses it');
  DARIJA.audio.clips[c.id].verified = true;
  const other = cards[5];
  ok(Audio2.url(other.id) === null, 'an unrecorded card resolves to no url at all');
  ok(Audio2.url(c.id) !== Audio2.url(other.id), 'so no clip can stand in for another card');

  console.log('6. MEDIA IS CACHED AWAY FROM PROGRESS');
  ok(Audio2.MEDIA_DB !== 'darija-tetouan','audio uses its own database');
  ok(Audio2.MEDIA_DB === 'darija-tetouan-media','named darija-tetouan-media');
  ok(typeof Audio2.cacheOne === 'undefined',
     'the unused cache functions are gone rather than implying offline audio works');

  console.log('7. THE CONTROL SITS UNDER THE WRITTEN FORMS, NEVER REPLACING THEM');
  DARIJA.audio.clips[c.id] = {file:c.id+'.m4a', speaker:'ahmed', scope:c.scope, verified:true, rev:1};
  const html = UI.vocabCard(c);
  const iEn = html.indexOf('class="en"'), iSay = html.indexOf('class="say"'), iAudio = html.indexOf('class="arow"');
  ok(iEn >= 0 && iSay > iEn, 'English comes before the Latin transcription');
  ok(iAudio > iSay, 'and the play control sits under both');

  console.log('\n8. THE EMPTY STATE GOES WHERE SOMEONE CAN ACT ON IT');
  delete DARIJA.audio.clips[c.id];
  Store.set('role','student');
  const asStudent = UI.vocabCard(c);
  ok(!/not recorded yet/.test(asStudent),
     'a student browsing the library is not shown a dead chip on every card');
  ok(asStudent.indexOf('class="arow"') === -1, 'and no empty row is rendered at all');
  Store.set('role','teacher');
  ok(/not recorded yet/.test(UI.vocabCard(c)),
     'the teacher IS shown it, because for him it is the recording queue');
  Store.set('role','student');
  ok(/not recorded yet/.test(Audio2.button(c.id, c)),
     'and it is still shown where a learner is working one word');
  ok(Audio2.button(c.id, c, { quiet: true }) === '', 'quiet mode renders nothing');

  done();
})().catch(e=>{console.log('THREW: '+e.message+'\n'+e.stack);process.exit(2);});
