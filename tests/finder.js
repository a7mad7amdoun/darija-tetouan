/* The vocabulary finder. The defect: the page was rendered from month 1 only,
   so the Month 2 and Month 3 filters compared courseId against a pool that
   contained none of them and the page said "Nothing matches" about 202 words
   that exist. */
require(__dirname + '/boot.js');
const V = Views;
const setq = q => { V.vocabState.q = q; };
const setf = f => { V.vocabState.filter = f; };
(async function(){
  await Storage.putProfile({id:'t',name:'Ahmed',role:'teacher'});
  await Storage.load('t');
  const pool = () => UI.allActiveCards();

  console.log('1. THE POOL HOLDS EVERY MONTH, EACH CARD ONCE');
  const p = pool(), ids = p.map(c=>c.id);
  ok(new Set(ids).size === p.length, 'no duplicate ids in the pool ('+p.length+')');
  ['month1','month2','month3'].forEach(m => {
    const n = p.filter(c=>c.courseId===m).length;
    ok(n > 0, m + ' contributes ' + n + ' cards');
  });

  console.log('\n2. EVERY MONTH FILTER NOW RETURNS ITS OWN CARDS');
  setq('');
  ['month1','month2','month3'].forEach(m => {
    setf('c:'+m);
    const html = V.vocabList(pool(), false);
    ok(!/Nothing/.test(html), 'Month filter '+m+' returns results');
    ok(/vsection|vcard|drill|vgrid/.test(html), '  and renders cards');
  });

  console.log('\n3. A TEACHER CARD APPEARS ONCE, NOT ONCE PER MONTH');
  Store.set('customCards',[{id:'custom-9-tahuna',en:'windmill',phon:'ta-HU-na',
                            ar:'طاحونة',freq:'useful',custom:true}]);
  const withCustom = pool().filter(c=>c.id==='custom-9-tahuna');
  ok(withCustom.length === 1, 'exactly one copy');
  ok(withCustom[0].courseId === null, 'and it is not stamped with a month it was never part of');
  setf('mine'); setq('');
  ok(/windmill/.test(V.vocabList(pool(), true)), 'the Teacher added filter finds it');

  console.log('\n4. SEARCH REACHES ENGLISH, LATIN AND ARABIC');
  setf('all');
  setq('windmill');  ok(/windmill/.test(V.vocabList(pool(),true)), 'English matches');
  setq('ta-HU');     ok(/windmill/.test(V.vocabList(pool(),true)), 'the Latin form matches');
  setq('طاحونة');     ok(/windmill/.test(V.vocabList(pool(),true)), 'Arabic matches');

  console.log('\n5. ARABIC TYPED WITHOUT HARAKAT FINDS A VOCALISED ENTRY');
  const voc = pool().filter(c => /[ً-ْ]/.test(c.arv || ''))[0];
  ok(!!voc, 'found a card with vocalised Arabic: ' + (voc && voc.en));
  const bare = String(voc.ar || voc.arv).replace(/[ؐ-ًؚ-ٰٟۖ-ۭـ]/g,'');
  setq(bare);
  ok(V.vocabList(pool(),true).indexOf(voc.en) > -1,
     'searching the unvocalised form “'+bare+'” finds it');
  const card = pool().filter(c=>c.id===voc.id)[0];
  ok(card.ar === voc.ar && card.arv === voc.arv,
     'and the stored Arabic is untouched - stripping happens only in the index');

  console.log('\n6. TWO DIFFERENT EMPTY STATES, NOT ONE');
  setf('c:month3'); setq('windmill');          // exists, but not in month 3
  let html = V.vocabList(pool(), true);
  ok(/elsewhere in the course/.test(html), 'a too-narrow filter says the word exists elsewhere');
  ok(/vsearchall/.test(html), 'and offers an explicit way to look past the filter');
  setq('zzzznotaword');
  html = V.vocabList(pool(), true);
  ok(/Nothing in the course matches/.test(html), 'a word we do not teach says so plainly');
  ok(!/vsearchall/.test(html), 'and does not offer a pointless wider search');

  console.log('\n7. THE SCOPE AND COUNT ARE STATED');
  setf('core'); setq('');
  const sum = V.vocabScopeSummary(pool());
  ok(/Everyday/.test(sum), 'the active scope is named: ' + sum.replace(/<[^>]*>/g,''));
  ok(/of 3\d\d/.test(sum), 'and the total it is drawn from is shown');
  setf('c:month2');
  ok(/Month 2/.test(V.vocabScopeSummary(pool())), 'it follows the filter');

  console.log('\n8. ID COLLISIONS ARE REPORTED, NOT RESOLVED SILENTLY');
  const real = pool().filter(c=>c.courseId==='month1')[0].id;
  Store.set('customCards',[{id:real,en:'a clashing card',phon:'x',ar:'x',custom:true}]);
  pool();
  ok(UI.conflictingIds().indexOf(real) > -1, 'the clash is reported: ' + real);
  setq(''); setf('all');
  ok(/share an id with another/.test(V.vocab()), 'and the page says so rather than hiding it');
  Store.set('customCards',[]);

  console.log('\n9. FINDING A WORD NEVER GRADES IT');
  await Storage.load('t');
  await Storage.replaceAll({});
  setf('all'); setq('hello');
  V.vocabList(pool(), true); V.vocab(); V.vocabScopeSummary(pool());
  setf('weak'); V.vocabList(pool(), true);
  ok(Object.keys(Storage.currentDoc().entries).length === 0,
     'searching, filtering and rendering wrote nothing to progress');
  done();
})().catch(e=>{console.log('THREW: '+e.message+'\n'+e.stack);process.exit(2);});
