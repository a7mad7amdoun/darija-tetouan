/* ---------------------------------------------------------------------------
   TETOUAN DARIJA — researched contrast set.

   SCOPE is the important field. "Northern" is not precise enough:
     'mdini'  — traditional Tetouan city speech (mdini), the original Tetouani
                form. Older speakers, the medina families. This is the target.
     'tetouan'— attested for Tetouan specifically, both traditional and modern
     'north'  — shared across northern varieties INCLUDING Tangier and Jebli;
                real, useful, but NOT Tetouan's own
   Anything marked 'north' is flagged in the UI as not Tetouan-exclusive.

   confidence: 'high' | 'medium' | 'open'
   --------------------------------------------------------------------------- */
window.DARIJA = window.DARIJA || {};

window.DARIJA.dialect = {

  headline: 'Tetouan was re-founded in 1485 by Sidi al-Mandari with refugees from Granada, and took a second wave after the fall of Granada in 1492. Its Arabic is a sedentary, pre-Hilalian city dialect carrying an Andalusi substrate — closer to Classical Arabic than the Casablanca koine, and unlike any other Moroccan city including Tangier.',

  intro: [
    'Tetouan has two living varieties, and the difference matters for what you teach. The mdini variety is the traditional speech of long-settled Tetouani families — conservative, Andalusi-descended, receding among the young. The urban variety is what younger Tetouanis speak: the old city dialect levelled toward general Moroccan, with features absorbed from rural Jebli migrants.',
    'Teach the urban forms as the working default — that is what Hamza will hear from people his own age. Teach the mdini forms so he recognises them from older speakers, and so he understands what Tetouani actually is rather than "northern Moroccan" in general.',
    'Spanish loanwords are described by researchers as a sign of Tetouani identity — three separate historical layers: Hakitía (Judeo-Spanish, from the 1492 expulsions), Morisco Spanish (16th–17th century), and Protectorate Spanish (1912–1956).'
  ],

  contrasts: [
    {
      id: 'qaf',
      title: 'ق — glottal stop in mdini, q in urban speech, never g',
      scope: 'tetouan', confidence: 'high',
      north: "mdini: ka-nʔul (I say) · urban: ka-nqul",
      national: 'ka-ngul — Casablanca and the Hilalian south',
      why: 'Tetouan is pre-Hilalian, so the Hilalian q→g shift never happened here. Within the city, traditional mdini speakers realise ق as a glottal stop [ʔ] — ʔalb (heart), fʔih (Koran teacher) — while younger urban speakers use [q]. The q→g form belongs to Casablanca.',
      teach: 'Teach [q] as the working default — it is what younger Tetouanis say and it is always understood. Then let him hear the mdini glottal stop so an older Tetouani saying ka-nʔul does not throw him. Saying "gal" is the one thing that is straightforwardly wrong here.',
      correction: 'Earlier this guide said Tetouan preserves [q] and that the glottal stop was Fessi-only. That was wrong: traditional Tetouani mdini speech uses the glottal stop too. Corrected against the CORVAM Tetouan corpus.'
    },
    {
      id: 'ntina',
      title: 'ntina — one "you" for a man or a woman',
      scope: 'tetouan', confidence: 'high',
      north: 'nṭina (نتينا) — everyone',
      national: 'nta (m) / nti (f)',
      why: 'Documented for Tetouan specifically as a regional marker: the 2nd person singular does not differentiate gender. The verb follows suit — one form for "you know" (ṭəʕrəf), one imperative (kul!, eat).',
      teach: 'The highest-value thing in Month 1. One pronoun, no gender decision, and it is genuinely Tetouani rather than generic northern.',
      example: { north: 'kif nṭina?', national: 'kif nta? / kif nti?', en: 'How are you?' }
    },
    {
      id: 'mash',
      title: 'māš — the traditional Tetouani future',
      scope: 'mdini', confidence: 'high',
      north: 'māš nqul lək — "I\'ll tell you"',
      national: 'ghadi / gha-nqul lik',
      why: 'māš marks the immediate future in traditional Tetouani speech. Younger Tetouanis increasingly use ġa- instead, following the general Moroccan pattern.',
      teach: 'Recognition first, production second. He will hear māš from older speakers; ġa- is safe to say. This is a mdini form — genuinely Tetouan\'s own, not shared with Tangier.',
      correction: 'This replaces the earlier "ha-" claim, which came from a general statement about northern Morocco rather than from Tetouan data.'
    },
    {
      id: 'r',
      title: 'The soft r — [ɹ] rather than a rolled r',
      scope: 'mdini', confidence: 'high',
      north: 'dkəɹ (child), ɹukba (knee) — an approximant, close to English r',
      national: 'A trilled/tapped [r]',
      why: 'Traditional Tetouani speakers use an approximant [ɹ]. Younger speakers are shifting to the standard Moroccan trill.',
      teach: 'Good news for an English speaker: the traditional Tetouani r is closer to his own r than to the rolled Arabic one. Let him use it — it sounds local rather than foreign.'
    },
    {
      id: 'diphthong',
      title: 'Preserved diphthongs — ḥawma, ṣayf',
      scope: 'mdini', confidence: 'high',
      north: 'l-ḥăwma (the neighbourhood), ṣăyf (summer)',
      national: 'l-ḥuma, ṣif — the diphthong collapsed to a long vowel',
      why: 'Conservative Tetouani keeps the aw/ay diphthongs that most Moroccan dialects have monophthongised. The corpus notes this distinction is beginning to disappear.',
      teach: 'A listening skill more than a speaking one, but ḥawma is worth saying properly — it is the word for the neighbourhood he lives in.'
    },
    {
      id: 'den',
      title: 'dən — the mdini relative pronoun',
      scope: 'mdini', confidence: 'high',
      north: 'n-nəjjār dənnu jāb — "the carpenter who brought"',
      national: 'lli — used by urban Tetouanis too',
      why: 'Traditional Tetouani uses dən (doubling the n before a suffix) where the rest of Morocco, and younger Tetouanis, use lli.',
      teach: 'Month 3 material — it needs sentence-building. Listed here so it is on the map, not because Hamza should drill it now.'
    },
    {
      id: 'spanish',
      title: 'Spanish loanwords as Tetouani identity',
      scope: 'tetouan', confidence: 'high',
      north: 'paiya (paella), buskūču (sponge cake), simana, kuzina, blaya, kama',
      national: 'French-derived or Arabic equivalents',
      why: 'Researchers describe Spanish loanwords as the most obvious difference between Tetouani and central/southern Moroccan Arabic, and explicitly as a marker of local identity. Three layers: Hakitía, Morisco Spanish, and Protectorate Spanish.',
      teach: 'Use them deliberately. This is the fastest way for Hamza to sound like he is from Tetouan rather than a visitor who learned Darija from an app.'
    },
    {
      id: 'shenni',
      title: '"What?" — shenni / shennu',
      scope: 'north', confidence: 'high',
      north: 'shenni / shennu',
      national: 'ashnu / shnu / ash',
      why: 'Documented for northern Morocco. Shared with Tangier and the Jebala — useful and correct in Tetouan, but not Tetouan-exclusive.',
      teach: 'Safe and natural in Tetouan. Just do not present it as a Tetouani signature; it is a northern one.'
    },
    {
      id: 'fuyax',
      title: '"When?" — fuyax',
      scope: 'north', confidence: 'medium',
      north: 'fuyax',
      national: 'fuqash (most regions), imta, weqtash',
      why: 'Documented for the Tangier–Tetouan northwest as a region, not for Tetouan city specifically.',
      teach: 'Worth teaching, but check it against a Tetouani ear before calling it local — the source groups Tetouan with Tangier here.'
    },
    {
      id: 'updown',
      title: 'ṭlaʕ / hawwed — up and down the medina',
      scope: 'north', confidence: 'high',
      north: 'ṭlaʕ (go up), hawwed (go down), taqa (window)',
      national: 'Understood everywhere, but these are the northern everyday forms',
      why: 'Recorded as common lexical features of the northern varieties including Tetouan.',
      teach: 'Tetouan\'s medina is built on a slope — directions here are genuinely given as "go up" and "go down" rather than by compass or street name. High-frequency in practice.'
    }
  ],

  open: [
    { title: 'A distinct Tetouani follow-up to "labas"',
      detail: 'Still nothing found in the Tetouan-specific literature. The Tetouani touch is using nṭina in the follow-up, not a different phrase. Best answered by listening in a café.' },
    { title: 'Which mdini forms are still worth producing in 2026',
      detail: 'The corpus is explicit that mdini features (glottal stop, [ɹ], diphthongs, dən, māš) are receding among younger speakers. Whether Hamza should produce them or only recognise them is a judgement call for you as his teacher, and depends on who he actually talks to.' },
    { title: 'Numbers 11–19 in Tetouani pronunciation',
      detail: 'Still no Tetouan-specific realisations found. Treated as general Moroccan and marked draft.' },
    { title: 'Everyday mdini vocabulary beyond the corpus samples',
      detail: 'The academic sources give phonology and morphology in depth but relatively few everyday words. The Tetouani lexicon taught here is what is attested; expanding it needs a local informant, which is exactly what the feedback page is for.' }
  ],

  sources: [
    { title: 'CORVAM — Corpus oral de variedades magrebíes: Tetouan (Univ. Zaragoza)', url: 'https://corvam.unizar.es/en/localities/tetouan/', key: true },
    { title: 'Singer, Hans-Rudolf (1958) — foundational phonology/morphology of Tetouan', url: 'https://corvam.unizar.es/en/localities/tetouan/' },
    { title: 'Vicente, Ángeles (2009–2018) — sociolinguistics of Tetouan and NW Morocco', url: 'https://corvam.unizar.es/en/localities/tetouan/' },
    { title: 'Moroccan Arabic — regional variation and pronouns (Wikipedia)', url: 'https://en.wikipedia.org/wiki/Moroccan_Arabic' },
    { title: 'Jebli Arabic — the rural variety that has spread into the city', url: 'https://en.wikipedia.org/wiki/Jebli_Arabic' },
    { title: 'Andalusi Arabic — the substrate Granada brought in 1485/1492', url: 'https://en.wikipedia.org/wiki/Andalusi_Arabic' },
    { title: 'Loanwords in Moroccan Arabic — Spanish list', url: 'https://lingualid.com/loanwords-in-moroccan-arabic/' }
  ],

  scopes: {
    mdini:   { label: 'Mdini · traditional Tetouani', cls: 'scope-mdini',   note: 'The original Tetouan city speech.' },
    tetouan: { label: 'Tetouan',                      cls: 'scope-tetouan', note: 'Attested for Tetouan specifically.' },
    north:   { label: 'Northern · shared',            cls: 'scope-north',   note: 'Shared with Tangier and the Jebala — correct here, but not Tetouan\'s own.' }
  }
};
