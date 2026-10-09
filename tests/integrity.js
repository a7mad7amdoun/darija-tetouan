require(__dirname + '/boot.js');
const T = Sched.todayStr();
(async function(){
  await Storage.putProfile({id:'h',name:'Hamza',role:'student'});
  await Storage.load('h');

  console.log('1. NO INTERVAL INFLATION FROM REPEAT ANSWERS THE SAME DAY');
  const id='w1-hello';
  UI.markFam(id,true,{task:'produce'});           // first correct
  const after1 = JSON.parse(JSON.stringify(Sched.get(id)));
  UI.markFam(id,true,{task:'recognise'});          // again, minutes later
  UI.markFam(id,true,{task:'match'});              // and again
  UI.markFam(id,true,{task:'exam'});               // and in an exam
  const after4 = Sched.get(id);
  ok(after4.i===after1.i,'four correct answers in one day = one advance (i='+after4.i+')');
  ok(after4.d===after1.d,'the due date did not move');
  ok(after4.n===after1.n,'the rep count did not move');
  ok(Attempts.all(id).length===4,'but all four attempts were recorded');
  ok(Attempts.all(id).filter(r=>r.sched==='hold').length===3,'three of them are marked as held');

  console.log('\n2. RECOGNITION CANNOT BUY A LONG INTERVAL');
  const r='w1-labas';
  for (let k=0;k<12;k++){
    Store.set('sched:'+r, Object.assign(Sched.get(r)||{d:T,i:0,e:250,n:0,l:0},{a:null}));
    Store.set('att:'+r, (Attempts.all(r)||[]).map(x=>Object.assign({},x,{at:'2020-01-01T00:00:00Z'})));
    UI.markFam(r,true,{task:'recognise'});
  }
  ok(Sched.get(r).i<=Sched.RECOGNITION_CAP,'recognition-only interval capped at '+Sched.RECOGNITION_CAP+' days (got '+Sched.get(r).i+')');
  ok(Sched.cappedByRecognition(r),'and the card reports that it is being held back');
  ok(!Attempts.hasProduced(r),'no unaided production success is on record');

  console.log('\n3. PRODUCTION LIFTS THE CAP');
  Store.set('sched:'+r, Object.assign(Sched.get(r),{a:null}));
  Store.set('att:'+r,(Attempts.all(r)).map(x=>Object.assign({},x,{at:'2020-01-01T00:00:00Z'})));
  UI.markFam(r,true,{task:'produce'});
  ok(Attempts.hasProduced(r),'an unaided typed answer counts as production');
  Store.set('sched:'+r, Object.assign(Sched.get(r),{a:null}));
  Store.set('att:'+r,(Attempts.all(r)).map(x=>Object.assign({},x,{at:'2020-01-01T00:00:00Z'})));
  UI.markFam(r,true,{task:'recognise'});
  ok(Sched.get(r).i>Sched.RECOGNITION_CAP,'now the gap may grow past the cap ('+Sched.get(r).i+' days)');

  console.log('\n4. A SELF-GRADE WITH THE ANSWER ON SCREEN IS NOT PRODUCTION');
  const a='w1-bikhir';
  /* the case that actually matters: SUCCESS, but assisted. The old test used
     ok:false, so hasProduced rejected it on the ok check and never reached the
     assisted check at all - it would have passed with that clause deleted. */
  UI.markFam(a,true,{task:'produce',assisted:true});
  ok(Attempts.all(a)[0].ok===true && Attempts.all(a)[0].assisted===true,
     'the record is a SUCCESS that was assisted');
  ok(!Attempts.hasProduced(a),'and it still does not count as production');
  /* and the cover-reveal self-grade, which is how the app actually records it */
  const a2='m2-atay-n3na3';
  UI.markFam(a2,true,{task:'recall',assisted:true});
  ok(Attempts.all(a2)[0].self===true,'a cover-reveal verdict is marked as self-graded');
  ok(!Attempts.hasProduced(a2),'and does not lift the recognition cap');
  ok(Attempts.hasSelfReportedProduction(a2),'but is still visible as self-reported production');

  console.log('\n5. A FAILURE IS NOT ERASED BY GETTING IT RIGHT A MINUTE LATER');
  const f='x-tabla';
  Store.set('sched:'+f,{d:T,i:40,e:250,n:6,l:0});
  UI.markFam(f,false,{task:'produce'});
  const lapsed = JSON.parse(JSON.stringify(Sched.get(f)));
  ok(lapsed.i===0 && lapsed.l===1,'the lapse reset the interval and was counted');
  ok(lapsed.e===230,'the ease dropped');
  UI.markFam(f,true,{task:'produce'});
  const back = Sched.get(f);
  ok(back.i===1,'getting it right again gives the short step, not the old 40 days (i='+back.i+')');
  ok(back.l===1,'the lapse is still on the record');
  ok(back.e===230,'and the ease stays reduced');
  ok(Attempts.all(f).filter(x=>!x.ok).length===1,'the failed attempt is still there');

  console.log('\n6. EVIDENCE IS DATED, NOT INFERRED');
  ok(Attempts.evidence('x-tabla')==='thin' || Attempts.evidence('x-tabla')==='recent','a practised card has dated evidence');
  /* a real card that has lifetime counters but no dated attempts - exactly the
     state every existing card is in right now */
  const OLD = UI.allActiveCards().filter(c=>c.courseId==='month3')[0].id;
  Store.set('fam:'+OLD,{r:3,w:9});
  ok(Attempts.evidence(OLD)==='historical','a card with only lifetime counters is labelled historical, not recent');
  ok(Attempts.evidence(UI.allActiveCards().filter(c=>c.courseId==='month3')[1].id)==='none','an untouched card is none');
  const sum = Attempts.summary('w1-hello');
  ok(sum.total===4 && sum.production===1 && sum.recognition===3,'the summary splits production from recognition');

  console.log('\n7. ATTEMPTS MERGE LIKE RESULTS: UNION BY UUID');
  ok(Sync.classify('att:w1-hello')==='append','attempt logs classify as append-only');
  const box = await DB.values('outbox');
  const attChange = box.filter(c=>c.entityId.startsWith('att:')).pop();
  ok(attChange && attChange.op==='append','queued as an append, not a set');
  ok(attChange.payload.every(x=>/^[0-9a-f]{8}-/.test(x.id)),'every queued attempt carries a uuid');

  console.log('\n8. IT ALL VALIDATES');
  const errs = Validate.progress(Storage.currentDoc(),{manifest:true});
  ok(errs.length===0,'the document validates clean'+(errs.length?': '+Validate.describe(errs).slice(0,300):''));
  const bad={schemaVersion:2,contentVersion:1,profileId:'x',entries:{'att:w1-hello':[{at:'nope',ok:'yes'}]}};
  const be=Validate.progress(bad,{manifest:false});
  ok(be.length>=3,'a malformed attempt log is reported ('+be.length+' problems)');
  ok(bad.entries['att:w1-hello'][0].ok==='yes','and not silently repaired');

  console.log('\n9. OLD PROGRESS IS NOT REWRITTEN OR INVENTED');
  ok(Store.get('fam:'+OLD,null).r===3,'existing lifetime counters keep their values');
  ok(Attempts.all(OLD).length===0,'no review history was fabricated from them');
  done();
})().catch(e=>{console.log('THREW: '+e.message+'\n'+e.stack);process.exit(2);});
