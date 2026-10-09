require(__dirname + '/boot.js');
(async function(){
  const TEACHER='t-uuid', HAMZA='h-uuid';
  await Storage.putProfile({id:TEACHER,name:'Ahmed',role:'teacher'});
  await Storage.load(TEACHER);
  global.Auth.currentProfile = () => ({id:TEACHER,name:'Ahmed',role:'teacher',local:false});

  console.log('1. THE TEACHER OWN STATE');
  Store.set('day:month1:w1:d1', true);
  Store.set('note:month1:w1', 'he mixes up left and right');
  await Storage.flush();
  ok(Store.get('day:month1:w1:d1',false)===true,'the teacher has their own day tick');
  ok(Store.get('note:month1:w1','')==='he mixes up left and right','and their own week note');

  console.log('\n2. LOOKING AT A STUDENT');
  Storage.viewAs({ profileId:HAMZA, name:'Hamza', at:new Date().toISOString(), entries:{
    'day:month1:w1:d1':true,'day:month1:w1:d2':true,'day:month1:w1:d3':true,
    'chk:month1:w1:chk-m1-w1-greet-ask-using-ntina':true,
    'rate:month1:w1':5,'fam:w1-hello':{r:9,w:1},'seen:w1-hello':true }});
  ok(Storage.viewing().profileId===HAMZA,'the overlay is on');
  ok(Store.get('day:month1:w1:d2',false)===true,"his day 2 shows, which the teacher never ticked");
  ok(Store.get('rate:month1:w1',0)===5,"his rating shows, not the teacher's");

  console.log('\n3. TEACHER DATA STILL COMES FROM THE TEACHER');
  ok(Store.get('note:month1:w1','')==='he mixes up left and right','the week note is still the teacher own');
  Store.set('note:month1:w1','drill limen and shmal');
  ok(Storage.currentShared().entries['note:month1:w1']==='drill limen and shmal','and writing a note still works');

  console.log('\n4. LOOKING IS NOT EDITING');
  const before = JSON.stringify(Storage.viewing().entries);
  Store.set('day:month1:w1:d4',true); Store.set('rate:month1:w1',1);
  ok(JSON.stringify(Storage.viewing().entries)===before,"the student's copy was not modified");
  ok(Storage.currentDoc().entries['day:month1:w1:d4']===undefined,"nor the teacher's own document");

  console.log('\n5. THE TEACHER GETS THEIR NUMBERS BACK');
  Storage.stopViewing();
  ok(Storage.viewing()===null,'the overlay is off');
  ok(Store.get('day:month1:w1:d2',false)===false,"the student's day 2 is gone");
  ok(Store.get('day:month1:w1:d1',false)===true,"the teacher's own tick survived");
  ok(Store.get('note:month1:w1','')==='drill limen and shmal','the note written while looking survived');

  console.log('\n6. SIGNING OUT DROPS IT');
  Storage.viewAs({profileId:HAMZA,name:'Hamza',entries:{'day:month1:w1:d9':true}});
  Storage.unload();
  ok(Storage.viewing()===null,'unload clears the overlay too');

  console.log('\n7. THE DASHBOARD SAYS WHOSE PROGRESS IT IS');
  await Storage.load(TEACHER);
  Views.teacherPeople().list=[{id:TEACHER,name:'Ahmed',role:'teacher'},
    {id:HAMZA,name:'Hamza',role:'student'},{id:'w-uuid',name:'Student',role:'student'}];
  let h = Views.teacher();
  ok(/Where you are/.test(h),'it says it is showing the teacher by default');
  ok(/data-peek="h-uuid"/.test(h) && /data-peek="w-uuid"/.test(h),'both students are offered');
  ok(!/data-peek="t-uuid"/.test(h),'the teacher is not listed as a student to peek at');
  Storage.viewAs({profileId:HAMZA,name:'Hamza',at:new Date().toISOString(),entries:{
    'day:month1:w1:d1':true,'day:month1:w1:d2':true,'rate:month1:w1':5}});
  h = Views.teacher();
  ok(/Where Hamza is/.test(h),'it names the student once one is picked');
  ok(/Read-only copy of Hamza/.test(h),'and says the copy is read-only');
  ok(/★★★★★/.test(h),"the table shows the student's rating");
  done();
})().catch(e=>{console.log('THREW: '+e.message+'\n'+e.stack);process.exit(2);});
