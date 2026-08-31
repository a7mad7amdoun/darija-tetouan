/* ---------------------------------------------------------------------------
   VERIFICATION LIST

   What to read to a Tetouani speaker, and where to write down what they say.

   Each item either points at real cards — so what you read aloud is exactly
   what the site teaches, and cannot drift from it — or asks an open question
   where the site has nothing yet and guessing would risk inventing something.

   status is recorded per item in the browser: open / confirmed / corrected.
   --------------------------------------------------------------------------- */
window.DARIJA = window.DARIJA || {};

window.DARIJA.verifyIntro =
  'Read a few at a time — do not hand over the whole list. Useful framing: ' +
  '"I have written out phrases for teaching. Which of these sound like how people ' +
  'actually talk in Tetouan, and which sound like Darija from a book?"';

window.DARIJA.verify = [

  /* ---------------- highest value first ---------------- */
  { id: 'v-shenni', priority: 'high', month: 'Month 1', topic: 'The word for "what"',
    cards: ['w2-shenni'],
    ask: 'Which does he say for "what" — shenni, shennu, or ashnu? Ask him to say "what is this?" naturally, twice.',
    why: 'The site teaches shenni as the northern form and treats ashnu as national. If Tetouanis actually say ashnu, that claim is wrong and appears on dozens of pages.' },

  { id: 'v-qaf', priority: 'high', month: 'Month 1', topic: 'How ق is really pronounced',
    cards: ['w3-qrib', 'm3-qult', 'w3-wqef'],
    ask: 'Ask him to say qrib, qult, wqef. Listen for a hard q from the throat, a glottal catch, or a g. Then ask whether his grandparents said it differently.',
    why: 'Research says Tetouan never shifts q to g, and that traditional mdini speakers use a glottal stop while younger ones use q. Worth hearing which he uses.' },

  { id: 'v-ntina', priority: 'high', month: 'Month 1', topic: 'ntina for both genders',
    cards: ['w1-ntina', 'w1-kif-ntina'],
    ask: 'Ask him to say "how are you?" to a man, then to a woman. Does the word for "you" change?',
    why: 'The whole course rests on ntina being gender-free in Tetouan. It is well documented, but it is the single most load-bearing claim here.' },

  { id: 'v-mash', priority: 'high', month: 'Month 3', topic: 'mash or ghadi for the future',
    cards: ['m3-mash', 'm3-ghadi'],
    ask: 'Ask him to say "I am going to go to the market." Does he say mash nemshi or ghadi nemshi? Then ask what his parents say.',
    why: 'The Tetouan corpus records mash as traditional and receding under pressure from ghadi. The site teaches ghadi as default and shows mash alongside.' },

  { id: 'v-past-ti', priority: 'high', month: 'Month 3', topic: 'The past-tense you-ending',
    cards: ['m3-mshiti'],
    ask: 'Ask him to say "where did you go yesterday?" to a man, then to a woman. Does mshiti change?',
    why: 'Taught as gender-free to match ntina. That follows logically but was never directly attested — this is an inference, not a fact.' },

  /* ---------------- Month 2 ---------------- */
  { id: 'v-hsab', priority: 'normal', month: 'Month 2', topic: 'Asking for the bill',
    cards: ['m2-hsab'],
    ask: 'How does he ask for the bill in a Tetouan cafe? Is l-hsab 3afak what he would actually say, or something else?' },

  { id: 'v-close-deal', priority: 'normal', month: 'Month 2', topic: 'Closing a deal',
    cards: ['m2-wakha-safi', 'm2-akhir-taman'],
    ask: 'After agreeing a price at a stall, what does he actually say to seal it? Is wakha safi right, or is there something more local?' },

  { id: 'v-problem', priority: 'normal', month: 'Month 2', topic: 'Flagging a problem politely',
    cards: ['m2-mushkil', 'm2-makhdamsh'],
    ask: 'If a waiter brings the wrong thing, or something is missing, how would he say it without sounding rude? Ask for his exact words.',
    why: 'The site has no phrase for "something is missing from my order" — it goes straight to mushkil. If there is a softer standard phrasing, it should be taught instead.' },

  { id: 'v-neighbour-greet', priority: 'normal', month: 'Month 2', topic: 'Greeting a neighbour',
    cards: ['m2-kif-lhal', 'm2-kif-khedma', 'w1-kif-ntina'],
    ask: 'Running into a neighbour on the stairs — what does he say, in order, for the first three things out of his mouth?' },

  { id: 'v-jles', priority: 'normal', month: 'Month 2', topic: 'jles or gles for "sit down"',
    cards: ['m2-jles'],
    ask: 'Ask him to say "sit down" to a guest. Is it jles with a soft j, or gles?',
    why: 'Taught as jles on the reasoning that northern pre-Hilalian keeps the j. Not directly attested for Tetouan.' },

  /* ---------------- Month 3 ---------------- */
  { id: 'v-kayn', priority: 'normal', month: 'Month 3', topic: 'kayn and makaynsh',
    cards: ['w2-kayn', 'w2-makaynsh'],
    ask: 'Ask him to say "is there bread?" and "there is no bread." Confirm kayn l-khobz and ma kaynsh l-khobz sound right.' },

  { id: 'v-negation', priority: 'normal', month: 'Month 3', topic: 'Negating khassni',
    cards: ['m2-khassni', 'm2-manqdersh'],
    ask: 'How does he say "I do not need it"? Is it ma khassnish, or does the word change?',
    why: 'The site teaches khassni for need and the ma-...-sh wrapper for negation, but never shows the two combined.' },

  { id: 'v-fillers', priority: 'normal', month: 'Month 3', topic: 'What he says while thinking',
    cards: [],
    ask: 'Listen for a whole conversation and note what he says while thinking, agreeing, or changing the subject. Do not ask directly — people cannot report this about themselves.',
    why: 'No Tetouan-specific fillers were found in any source. This can only come from listening.' },

  /* ---------------- content not yet built ---------------- */
  { id: 'v-feel', priority: 'normal', month: 'Not yet built', topic: 'Saying how you feel',
    cards: ['w2-3yyan', 'w2-fer7an'],
    ask: 'How does he say "I am worried", "I am bored", "I am comfortable"? The site only has tired, ill, happy, hungry.',
    why: 'Needed before the opinions and feelings week can be written honestly.' },

  { id: 'v-like', priority: 'normal', month: 'Not yet built', topic: 'Liking and disliking',
    cards: ['m3-3jebni', 'm3-kanbghi'],
    ask: 'Ask what he says for "I like this" about a thing, and about a person. Is 3jebni right for both, or does it change?' },

  { id: 'v-storytelling', priority: 'normal', month: 'Not yet built', topic: 'Storytelling connectors',
    cards: ['m3-mor', 'm3-awwel', 'm3-fi-lakhir'],
    ask: 'Ask him to tell you about his day. Write down the exact words he uses to move between events — then, after, once, suddenly.',
    why: 'The site teaches mor, awwel and fi l-akhir. Whether a Tetouani reaches for those or something else is unconfirmed.' },

  /* ---------------- the one that needs him, not me ---------------- */
  { id: 'v-pairs', priority: 'high', month: 'The national bridge', topic: 'Words where Tetouan differs',
    cards: [],
    ask: 'This one needs him rather than the site. Ask: which everyday words do Tetouanis say differently from Casablanca? ' +
         'Prompt with categories rather than words — food, family, money, the street, time of day — and write down whatever comes.',
    why: 'The site already has a handful (shenni/ashnu, simana/usbu3, blaya/shate, mash/ghadi, den/lli). A month of the course is meant to be built on these pairs, ' +
         'and inventing them would be worse than having none. Four or five real ones from him is enough to build the week.' }
];
