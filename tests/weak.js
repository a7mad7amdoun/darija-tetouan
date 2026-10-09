require(__dirname + '/boot.js');
const TEACHER='t-uuid', A='stu-a', B='stu-b';
(async function(){
  await Storage.putProfile({id:TEACHER,name:'Ahmed',role:'teacher'});
  await Storage.load(TEACHER);
  global.Auth.currentProfile = () => ({id:TEACHER,name:'Ahmed',role:'teacher',local:false});
  const cards = UI.allCards(UI.activeCourses()[0]);
  const c1=cards[0].id, c2=cards[1].id, c3=cards[2].id;
  const now = new Date().toISOString();
  const old = new Date(Date.now()-200*86400000).toISOString();
  const uid = () => require('crypto').randomUUID();

  console.log('1. NOTHING IS CLAIMED WITHOUT EVIDENCE');
  ok(/Pick a student/.test(Weak.panel(null,null,cards)),'with no student picked it says so');
  Storage.viewAs({profileId:A,name:'Hamza',at:now,entries:{}});
  ok(/Nothing is failing yet/.test(Weak.panel(A,'Hamza',cards)),'an empty student shows no invented targets');

  console.log('\n2. RECENCY IS NEVER INFERRED FROM A LIFETIME COUNTER');
  Storage.viewAs({profileId:A,name:'Hamza',at:now,entries:{
    ['fam:'+c1]:{r:1,w:7},                                  // old-style only
    ['att:'+c2]:[{id:uid(),at:now,task:'produce',ok:false,assisted:false,sched:'lapse'},
                 {id:uid(),at:now,task:'produce',ok:false,assisted:false,sched:'lapse'},
                 {id:uid(),at:now,task:'recognise',ok:true,assisted:false,sched:'advance'}],
    ['att:'+c3]:[{id:uid(),at:old,task:'recognise',ok:false,assisted:false,sched:'lapse'}]
  }});
  const p = Weak.panel(A,'Hamza',cards);
  ok(/historical only/.test(p),'the counter-only card is labelled historical only');
  ok(/when, and how it was asked, is not recorded/.test(p),'and says plainly what is unknown');
  ok(Attempts.evidence(c1)==='historical','evidence() agrees');
  ok(Attempts.evidence(c3)==='thin','a single 200-day-old attempt is thin, not recent');
  ok(/2 failed of 3 in the last 30 days/.test(p),'dated failures are counted from real timestamps');

  console.log('\n3. PRODUCTION FAILURES OUTRANK RECOGNITION ONES');
  ok(Weak.score(c2) > Weak.score(c3),'a card failed twice at production outranks one old recognition miss');
  const order = Weak.targets(cards,8).map(t=>t.card.id);
  ok(order[0]===c2,'it is ranked first');
  const c1row = (Weak.panel(A,'Hamza',cards).split('data-ws="'+c1+'"')[1]||'').split('</div></div>')[0];
  ok(/historical only/.test(c1row),'the counter-only card says its evidence is historical');
  ok(!/in the last 30 days/.test(c1row),'and does NOT state a recent failure count it cannot know');

  console.log('\n4. A STUCK WORD IS A TARGET EVEN WITHOUT FAILURES');
  const c4=cards[3].id;
  Storage.viewAs({profileId:A,name:'Hamza',at:now,entries:{
    ['sched:'+c4]:{d:'2030-01-01',i:21,e:250,n:5,l:0},
    ['att:'+c4]:[{id:uid(),at:now,task:'recognise',ok:true,assisted:false,sched:'advance'}]
  }});
  ok(Sched.cappedByRecognition(c4),'recognised repeatedly but never produced = capped');
  ok(Weak.score(c4)>0,'so it still shows up as worth teaching');
  ok(/stuck — recognised but never produced/.test(Weak.panel(A,'Hamza',cards)),'and says why');

  console.log('\n5. OBSERVATIONS ARE APPENDED, NEVER REPLACED');
  Weak.observe(A,c2,'retrieval','froze on it twice');
  Weak.observe(A,c2,'pronunciation','says the q as a g');
  const obs = Weak.observations(A,c2);
  ok(obs.length===2,'both observations are kept');
  ok(obs[0].note==='froze on it twice','the first one is unchanged');
  ok(Weak.currentKind(A,c2)==='pronunciation','the latest kind is the current one');
  ok(obs.every(o=>o.id && o.at),'each carries an id and a timestamp');

  console.log('\n6. OBSERVATIONS ARE PER STUDENT');
  Weak.observe(B,c2,'listening','confuses it with shhal');
  ok(Weak.observations(A,c2).length===2,"writing about one student does not touch the other's record");
  ok(Weak.currentKind(B,c2)==='listening','and each has their own');
  ok(Weak.obsKey(A,c2)!==Weak.obsKey(B,c2),'they are different keys');

  console.log('\n7. THEY ARE TEACHER-ONLY, AND SURVIVE LOOKING AT A STUDENT');
  ok(Storage.isShared(Weak.obsKey(A,c2)),'an observation is shared (teacher) data, not student data');
  ok(Storage.currentShared().entries[Weak.obsKey(A,c2)]!==undefined,"it lives in the teacher's own document");
  ok(Storage.viewing().entries[Weak.obsKey(A,c2)]===undefined,"and never in the student's copy");
  Storage.stopViewing();
  ok(Store.get(Weak.obsKey(A,c2),null)!==null,'it is still there after leaving the student view');

  console.log('\n8. THE TEACHER PAGE SHOWS IT');
  Views.teacherPeople().list=[{id:TEACHER,name:'Ahmed',role:'teacher'},{id:A,name:'Hamza',role:'student'}];
  Storage.viewAs({profileId:A,name:'Hamza',at:now,entries:{
    ['att:'+c2]:[{id:uid(),at:now,task:'produce',ok:false,assisted:false,sched:'lapse'}]}});
  const tv = Views.teacher();
  ok(/What to teach Hamza next/.test(tv),'the panel is on the teacher page, named for the student');
  ok(/data-wskind="pronunciation"/.test(tv),'with the four kinds of problem offered');
  ok(/wsnoteform/.test(tv),'and somewhere to write what happened');
  done();
})().catch(e=>{console.log('THREW: '+e.message+'\n'+e.stack);process.exit(2);});
