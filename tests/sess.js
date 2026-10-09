require(__dirname + '/boot.js');
const clickSess=(a,i)=>{const b={dataset:{sess:a,i:i}};b.closest=s=>s==='[data-sess]'?b:null;return Views.todayClick(b);};
const walk = () => { let g=0;
  while(g++<300){ const h=Views.today(); if(/Session done/.test(h)) return true;
    if(/data-sess="next"/.test(h)) clickSess('next');
    else if(/id="produceform"/.test(h)) { const c=/class="sessen">([^<]+)</.exec(h); Views.todayProduced('zzz'); }
    else if(/data-sess="reveal"/.test(h)) clickSess('reveal');
    else if(/data-sess="got"/.test(h)) clickSess('got');
    else if(/data-sess="answer"/.test(h)) clickSess('answer','0');
    else return false; }
  return false; };
(async function(){
  await Storage.putProfile({id:'h',name:'Hamza',role:'student'});
  await Storage.load('h');

  console.log('1. A FIRST SESSION');
  let h0 = Views.today();
  /* the counter reads '1 / 29' since the redesign */
  ok(/class="sessstep">1 \/ \d+</.test(h0),'session starts at step 1');
  const steps = +(/class="sessstep">1 \/ (\d+)</.exec(h0)||[])[1];
  ok(steps>=4,'it has real content ('+steps+' steps)');
  ok(/New word/.test(h0),'it opens with something new');

  console.log('\n2. WALKING IT TO THE END');
  ok(walk(),'it reaches the done screen');
  const all = Storage.currentDoc().entries;
  const today = Sched.todayStr();
  ok(Object.keys(all).filter(k=>k.startsWith('seen:')).length>0,'words marked as introduced');
  ok(Object.keys(all).filter(k=>k.startsWith('sched:')).length>0,'words gained a review date');
  ok(all['did:'+today]===true,'today is recorded as done');
  ok(Views.streak()===1,'the streak reads 1');

  console.log('\n3. WORDS JUST ANSWERED ARE NOT ASKED AGAIN TODAY');
  Views.resetToday();
  const second = Views.today();
  if (/Nothing due/.test(second)) {
    ok(true,'nothing is due again today — correct, they come back tomorrow');
  } else {
    const dueNow = Views.todayPlan ? Views.todayPlan().due.length : 0;
    ok(!/From before/.test(second) || dueNow===0,'no word already answered today is offered back');
  }

  console.log('\n4. TOMORROW THEY COME BACK');
  const ids = Object.keys(all).filter(k=>k.startsWith('sched:')).map(k=>k.slice(6));
  ok(ids.length>0,ids.length+' words are on the calendar');
  const dueTomorrow = ids.filter(id=>Sched.isDue(id, Sched.addDays(today,1)));
  ok(dueTomorrow.length>0,dueTomorrow.length+' of them are due tomorrow');

  console.log('\n5. A MATURE WORD IS ASKED BY TYPING');
  /* two correct answers at a three-day gap, then wind the clock on */
  const card = UI.allActiveCards().filter(c=>c.freq==='core' && c.courseId==='month1')[0];
  Store.set('seen:'+card.id,true);
  Store.set('sched:'+card.id,{d:Sched.addDays(today,-1),i:5,e:250,n:3,l:0});
  ok(Sched.isMature(card.id),'the card counts as mature');
  Views.resetToday();
  let found=false, g=0;
  while(g++<300){ const h=Views.today();
    if(/Say it yourself/.test(h)){ found=true; break; }
    if(/Session done/.test(h)) break;
    if(/data-sess="next"/.test(h)) clickSess('next');
    else if(/data-sess="reveal"/.test(h)) clickSess('reveal');
    else if(/data-sess="got"/.test(h)) clickSess('got');
    else if(/data-sess="answer"/.test(h)) clickSess('answer','0');
    else break; }
  ok(found,'the session offers a typing step for it');
  ok(/id="produceform"/.test(Views.today()),'with a text box, not multiple choice');

  console.log('\n6. TYPING IS MARKED LENIENTLY');
  const want = UI.formFor(card).phon;
  ok(Views.todayProduced(want)===true,'an answer is accepted for grading');
  ok(/That is it/.test(Views.today()),'the exact phonetic form is right: '+want);

  Views.resetToday();
  Store.set('sched:'+card.id,{d:Sched.addDays(today,-1),i:5,e:250,n:3,l:0});
  let g2=0, at=false;
  while(g2++<300){ const h=Views.today(); if(/Say it yourself/.test(h)){at=true;break;}
    if(/Session done/.test(h))break;
    if(/data-sess="next"/.test(h)) clickSess('next');
    else if(/data-sess="reveal"/.test(h)) clickSess('reveal');
    else if(/data-sess="got"/.test(h)) clickSess('got');
    else if(/data-sess="answer"/.test(h)) clickSess('answer','0');
    else break; }
  if (at) {
    const sloppy = want.replace(/-/g,' ').toLowerCase().replace(/kh/g,'x');
    Views.todayProduced(sloppy);
    ok(/That is it/.test(Views.today()),'dashes, case and kh/x spelling do not fail it');
  } else { ok(false,'could not reach the typing step a second time'); }

  console.log('\n7. GIVING UP COUNTS AS NOT KNOWN');
  Views.resetToday();
  Store.set('sched:'+card.id,{d:Sched.addDays(today,-1),i:9,e:250,n:4,l:0});
  const easeBefore = Sched.get(card.id).e;
  let g3=0;
  while(g3++<300){ const h=Views.today(); if(/Say it yourself/.test(h)){ clickSess('giveup'); break; }
    if(/Session done/.test(h))break;
    if(/data-sess="next"/.test(h)) clickSess('next');
    else if(/data-sess="reveal"/.test(h)) clickSess('reveal');
    else if(/data-sess="got"/.test(h)) clickSess('got');
    else if(/data-sess="answer"/.test(h)) clickSess('answer','0');
    else break; }
  ok(Sched.get(card.id).i===0,'the interval reset');
  ok(Sched.get(card.id).e===easeBefore-20,'and the ease dropped');

  console.log('\n8. THE STATUS STRIP AND THE EMPTY STATE');
  const strip = Views.statusStrip();
  ok(/in a row/.test(strip) && /class="streakn">\d+</.test(strip),'the strip shows a streak');
  ok(/class="wordsn"/.test(strip) && /met/.test(strip),'and how many words have been met and are due');
  done();
})().catch(e=>{console.log('THREW: '+e.message+'\n'+e.stack);process.exit(2);});
