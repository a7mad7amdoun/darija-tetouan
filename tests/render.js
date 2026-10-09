require(__dirname + '/boot.js');
(async function(){
  await Storage.putProfile({id:'h',name:'Hamza',role:'teacher'});
  await Storage.load('h');
  const V = Views;
  const jobs = [
    ['home',()=>V.home()], ['today',()=>V.today()], ['library',()=>V.library()],
    ['status',()=>V.statusStrip()], ['startcard',()=>V.startCard()],
    ['vocab',()=>V.vocab()], ['progress',()=>V.progress()],
    ['week m1w1',()=>V.week('month1',1)], ['week m3w12',()=>V.week('month3',12)],
    ['situations',()=>V.situations()], ['sentences',()=>V.sentences()],
    ['dialogues',()=>V.dialogues()], ['dialect',()=>V.dialect()],
    ['tests',()=>V.tests()], ['practice',()=>V.practice(false,null)],
    ['exams',()=>V.exams()], ['exam m1',()=>V.exam('m:month1')],
    ['teacher',()=>V.teacher()], ['verify',()=>V.verify()], ['feedback',()=>V.feedback()],
    ['account',()=>Account.accountPanel({})], ['login',()=>Account.loginScreen()]
  ];
  let bad=0;
  for (const [n,f] of jobs) {
    try { const h=f()||''; const len=h.length;
      console.log((len>150?'  ok  ':'  THIN'), n.padEnd(12), len);
      if (len<=150) bad++;
    } catch(e){ console.log('  THREW', n.padEnd(12), e.message); bad++; }
  }
  process.exit(bad?1:0);
})();
