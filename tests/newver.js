/* The catalog, the games and the gallery.

   The rule, again: none of this is evidence. A game writes one score to the
   tests' own history and nothing else; opening a field, a photograph or the
   viewer writes nothing. Checked against the real modules by comparing the
   stored document before and after, key by key. */
require(__dirname + '/boot.js');
const fs = require('fs'), path = require('path');
const ROOT = path.resolve(__dirname, '..');
const tick = (ms = 15) => new Promise(r => setTimeout(r, ms));
const keysNow = () => Object.keys(Storage.currentDoc().entries).sort();
const docJSON = () => JSON.stringify(Storage.currentDoc().entries);
global.document.getElementById = () => null;      /* no DOM: the rush timer paints nothing */

(async function () {
  await Storage.putProfile({ id: 'h', name: 'Hamza', role: 'student' });
  await Storage.load('h');
  const cards = UI.allActiveCards();
  /* a learner some weeks in: the first 60 words met */
  cards.slice(0, 60).forEach(c => Store.set('seen:' + c.id, true));
  cards.filter(c => c.courseId === 'month3').slice(0, 5).forEach(c => Store.set('seen:' + c.id, true));
  await tick();

  console.log('1. THE CATALOG: EVERY WORD IN EXACTLY ONE FIELD');
  const per = Catalog.FIELDS.map(f => Catalog.contents(f.id).cards.map(c => c.id));
  const all = per.flat();
  ok(all.length === cards.length, 'the fields hold ' + all.length + ' words, the course has ' + cards.length);
  ok(new Set(all).size === all.length, 'and no word is in two fields');
  ok(Catalog.fieldOfGroup('A group nobody has heard of') === 'glue', 'an unknown group lands in a field, never nowhere');
  const food = Catalog.contents('food');
  ok(food.cards.some(c => c.group === 'Café & ordering'), 'café words are in the food field');
  ok(food.sentences.some(s => s.parts.some(p => p.d === 'atay')), 'a sentence that orders tea joins it through its chunks');
  ok(food.situations.map(s => s.id).includes('cafe'), 'and so does the café situation');
  const before1 = docJSON();
  Catalog.view(); Catalog.field('food'); Catalog.counts();
  ok(docJSON() === before1, 'reading the catalog writes nothing');
  ok(/<a class="fieldtile/.test(Catalog.view()) && Catalog.view().split('fieldtile').length - 1 === Catalog.FIELDS.length, 'eight field tiles');

  console.log('\n2. FLASHCARDS CAN BE LIMITED TO A FIELD');
  Views.practice(false, 'f:food');
  ok(Views.flash.filter === 'f:food', 'the set is taken from the link');
  ok(Views.flash.pool.length === food.cards.length && Views.flash.pool.every(c => Catalog.fieldOfGroup(c.group) === 'food'),
     'the pool is the field\'s ' + food.cards.length + ' words and nothing else');

  console.log('\n3. EACH GAME: ONE SCORE, AND NOTHING ELSE');
  const gate = cards.slice(0, 60).map(c => Attempts.hasProduced(c.id));
  for (const g of Games.list) {
    const kb = keysNow(), run = Games.start(g.id, '');
    ok(run.qs.length > 0, g.title + ': builds ' + run.qs.length + ' rounds from the words met');
    /* play it straight through, answering whatever is asked */
    let guard = 0;
    while (!run.done && guard++ < 400) {
      const q = run.qs[run.i];
      if (q.kind === 'pairs') {
        if (!q.complete) {
          const id = q.cards.find(c => !q.matched[c.id]).id;
          if (guard === 1) { Games.click({ dataset: { g: 'pick', side: 'l', v: id } }); Games.click({ dataset: { g: 'pick', side: 'r', v: q.cards.find(c => c.id !== id).id } }); }
          Games.click({ dataset: { g: 'pick', side: 'l', v: id } }); Games.click({ dataset: { g: 'pick', side: 'r', v: id } });
        } else Games.click({ dataset: { g: 'next' } });
      } else if (q.kind === 'build') {
        if (!q.checked) { q.s.parts.forEach((p, i) => Games.click({ dataset: { g: 'chunk', v: String(i) } })); Games.click({ dataset: { g: 'check' } }); }
        else Games.click({ dataset: { g: 'next' } });
      } else if (q.kind === 'stress') {
        if (q.picked < 0) Games.click({ dataset: { g: 'pick', v: String(q.answer) } }); else Games.click({ dataset: { g: 'next' } });
      } else if (q.kind === 'odd') {
        if (!q.picked) Games.click({ dataset: { g: 'pick', v: q.answer } }); else Games.click({ dataset: { g: 'next' } });
      } else if (q.kind === 'rush') {
        Games.click({ dataset: { g: 'pick', v: q.card.id } });
      } else if (q.kind === 'price' || q.kind === 'chunk' || q.kind === 'script') {
        if (!q.picked) Games.click({ dataset: { g: 'pick', v: q.answer } }); else Games.click({ dataset: { g: 'next' } });
      } else if (q.kind === 'rrush') {
        Games.click({ dataset: { g: 'pick', v: q.card.id } });
      } else if (q.kind === 'fusha') {
        if (!q.picked) Games.click({ dataset: { g: 'pick', v: q.answer } }); else Games.click({ dataset: { g: 'next' } });
      } else if (q.kind === 'levels') {
        if (!q.checked) { q.rungs.forEach((r, i) => Games.click({ dataset: { g: 'chunk', v: String(i) } })); Games.click({ dataset: { g: 'check' } }); }
        else Games.click({ dataset: { g: 'next' } });
      } else if (q.kind === 'order') {
        if (!q.checked) { q.s.lines.forEach((l, i) => Games.click({ dataset: { g: 'chunk', v: String(i) } })); Games.click({ dataset: { g: 'check' } }); }
        else Games.click({ dataset: { g: 'next' } });
      }
    }
    await tick();
    ok(run.done && run.recorded, g.title + ': runs to the end and records once');
    const added = keysNow().filter(k => kb.indexOf(k) < 0);
    ok(JSON.stringify(added) === JSON.stringify(['testres:game:' + g.id]),
       g.title + ': the only new key is its score (' + added.join(', ') + ')');
    const res = Tests.results('game:' + g.id);
    ok(res.length === 1 && res[0].total > 0 && res[0].score <= res[0].total, g.title + ': one result, ' + res[0].score + ' of ' + res[0].total);
    if (g.id === 'pairs') ok(res[0].score === run.qs.length - 1, 'pairs: the round with a miss did not count as clean');
    if (g.id === 'rush' || g.id === 'rrush') ok(res[0].total === run.answered, g.id + ': the total is what was answered, not what was queued');
  }
  ok(JSON.stringify(cards.slice(0, 60).map(c => Attempts.hasProduced(c.id))) === JSON.stringify(gate),
     'no word gained "produced" evidence from any game');
  ok(!keysNow().some(k => /^(att|sched|fam):/.test(k)), 'no attempt, schedule or familiarity key was ever written');
  Games.reset();
  ok(Games.run() === null, 'reset clears the run and its timer');

  console.log('\n3b. THE NEWER GAMES ASK REAL QUESTIONS');
  ok(Games.list.length === 15, 'fifteen games');
  const pr = Games.start('price', ''); ok(pr.qs.every(q => typeof q.n === 'number' && q.options.length === 4 && q.options.some(c => c.id === q.answer)), 'price: a number in figures, four number words, the right one among them');
  const od = Games.start('order', ''); ok(od.qs.length >= 5 && od.qs.every(q => q.s.id !== 'repair'), 'order: real situations, not the repair phrases');
  const ck = Games.start('chunk', ''); ok(ck.qs.every(q => q.i > 0 && q.options.length === 4 && !q.options.some((o, i) => q.options.findIndex(p => p.id === o.id) !== i)), 'chunk: never the first chunk, four distinct options');
  ok(ck.qs.every(q => q.options.filter(o => o.id !== q.answer).every(o => !q.s.parts.some(p => p.d === o.d))), 'chunk: no wrong option is another chunk of the same sentence');
  const sc = Games.start('script', ''); ok(sc.qs.every(q => q.options.length === 3) && /lang="ary" dir="rtl"/.test(Games.playView('script', '')), 'script: Arabic shown right-to-left, three spellings');
  Games.reset();
  ok(Notes.all().length >= 8 && Notes.all().every(n => /^https:\/\//.test(n.url) && n.source && n.title && n.text), 'every Tetouan note has a title, a text and a source URL');
  ok(Notes.all().every(n => Catalog.byId(n.field) && window.DARIJA.gallery[n.photo]), 'and belongs to a real field with a real photograph');
  const bn = docJSON(); Notes.card(Notes.todays()); Views.home(); Catalog.field('around');
  ok(docJSON() === bn, 'notes on Home and on a field write nothing');
  ok(/class="note/.test(Views.home()) && /Source: <a href="https:/.test(Views.home()), 'Home shows the day\'s note with its source');

  console.log('\n4. THE STRESS GAME READS THE COURSE\'S OWN MARKING');
  const sr = Games.start('stress', '');
  ok(sr.qs.every(q => { const l = q.syl[q.answer].replace(/[^A-Za-z]/g, ''); return l === l.toUpperCase(); }),
     'the answer is always the syllable the course wrote in capitals');
  Games.reset();

  console.log('\n5. THE GALLERY: REAL FILES, REAL SIZES, HONEST PLACES');
  const es = Gallery.entries();
  ok(es.length === Object.keys(window.DARIJA.gallery).length, es.length + ' photographs, every manifest entry shown');
  const missing = es.flatMap(e => [e.md, e.sm, e.xl].filter(f => !fs.existsSync(path.join(ROOT, f))));
  ok(missing.length === 0, 'every thumbnail, medium and large file exists' + (missing.length ? ': missing ' + missing.join(', ') : ''));
  ok(es.every(e => Math.max(e.w, e.h) <= Math.max(e.master[0], e.master[1])), 'no large image is bigger than its master (nothing upscaled)');
  ok(es.every(e => /4K-class/.test(Gallery.sizeNote(e)) === (Math.max(e.w, e.h) >= 3800)), '"4K-class" is said only of images that are');
  ok(['pools', 'coast', 'bluedoors', 'sunset'].every(k => /not confirmed/.test(Gallery.entry(k).place)), 'the four unplaced photographs say so');
  ok(/CC0/.test(Gallery.entry('tetouan-feddan-square').credit), 'the public-domain photograph carries its credit');
  const gv = Gallery.view();
  ok(gv.split('data-photo="').length - 1 === es.length, 'one open control per photograph');
  ok(Gallery.aboutButton('no-such-photo') === '' && /data-photo="medina"/.test(Gallery.aboutButton('medina')), 'the banner control exists only for a real photograph');
  const before5 = docJSON();
  Gallery.view(); Gallery.entries();
  ok(docJSON() === before5, 'the gallery writes nothing');

  console.log('\n6. THE PAGES RENDER');
  ['catalog', 'food', 'games', 'gallery'].forEach(() => {});
  ok(Games.listView('').indexOf('Pairs') > 0 && Games.listView('food').indexOf('Café, food') > 0, 'the games list, plain and for a field');
  ok(Catalog.field('around').indexOf('Taking a taxi') > 0, 'a field page lists its situations');
  done();
})().catch(e => { console.log('THREW: ' + e.message + '\n' + e.stack); process.exit(2); });
