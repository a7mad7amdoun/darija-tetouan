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
      group: 'sounds',
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
      group: 'verbs',
      title: 'ntina — one "you" for a man or a woman',
      scope: 'tetouan', confidence: 'high',
      north: 'nṭina (نتينا) — everyone',
      national: 'nta (m) / nti (f)',
      why: 'Documented for Tetouan specifically as a regional marker: the 2nd person singular does not differentiate gender. The verb follows suit — one form for "you know" (ṭəʕrəf), one imperative (kul!, eat).',
      teach: 'The highest-value thing in Month 1. One pronoun, no gender decision, and it is genuinely Tetouani rather than generic northern. But do not over-generalise it: a Tetouani speaker confirmed that "what is your name" still splits into smitek for a man and ismek for a woman. A gender-free pronoun is not a gender-free language.',
      example: { north: 'kif nṭina?', national: 'kif nta? / kif nti?', en: 'How are you?' }
    },
    {
      id: 'mash',
      group: 'verbs',
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
      group: 'sounds',
      title: 'The soft r — [ɹ] rather than a rolled r',
      scope: 'mdini', confidence: 'high',
      north: 'dkəɹ (child), ɹukba (knee) — an approximant, close to English r',
      national: 'A trilled/tapped [r]',
      why: 'Traditional Tetouani speakers use an approximant [ɹ]. Younger speakers are shifting to the standard Moroccan trill.',
      teach: 'Good news for an English speaker: the traditional Tetouani r is closer to his own r than to the rolled Arabic one. Let him use it — it sounds local rather than foreign.'
    },
    {
      id: 'diphthong',
      group: 'sounds',
      title: 'Preserved diphthongs — ḥawma, ṣayf',
      scope: 'mdini', confidence: 'high',
      north: 'l-ḥăwma (the neighbourhood), ṣăyf (summer)',
      national: 'l-ḥuma, ṣif — the diphthong collapsed to a long vowel',
      why: 'Conservative Tetouani keeps the aw/ay diphthongs that most Moroccan dialects have monophthongised. The corpus notes this distinction is beginning to disappear.',
      teach: 'A listening skill more than a speaking one, but ḥawma is worth saying properly — it is the word for the neighbourhood he lives in.'
    },
    {
      id: 'den',
      group: 'verbs',
      title: 'dən — the mdini relative pronoun',
      scope: 'mdini', confidence: 'high',
      north: 'n-nəjjār dənnu jāb — "the carpenter who brought"',
      national: 'lli — used by urban Tetouanis too',
      why: 'Traditional Tetouani uses dən (doubling the n before a suffix) where the rest of Morocco, and younger Tetouanis, use lli.',
      teach: 'Month 3 material — it needs sentence-building. Listed here so it is on the map, not because Hamza should drill it now.'
    },
    {
      id: 'spanish',
      group: 'words',
      title: 'Spanish loanwords as Tetouani identity',
      scope: 'tetouan', confidence: 'high',
      north: 'paiya (paella), buskūču (sponge cake), simana, kuzina, blaya, kama',
      national: 'French-derived or Arabic equivalents',
      why: 'Researchers describe Spanish loanwords as the most obvious difference between Tetouani and central/southern Moroccan Arabic, and explicitly as a marker of local identity. Three layers: Hakitía, Morisco Spanish, and Protectorate Spanish.',
      teach: 'Use them deliberately. This is the fastest way for Hamza to sound like he is from Tetouan rather than a visitor who learned Darija from an app.'
    },
    {
      id: 'shenni',
      group: 'words',
      title: '"What?" — shenni / shennu',
      scope: 'north', confidence: 'high',
      north: 'shenni / shennu',
      national: 'ashnu / shnu / ash',
      why: 'Documented for northern Morocco. Shared with Tangier and the Jebala — useful and correct in Tetouan, but not Tetouan-exclusive.',
      teach: 'Safe and natural in Tetouan. Just do not present it as a Tetouani signature; it is a northern one.'
    },
    {
      id: 'fuyax',
      group: 'words',
      title: '"When?" — fuyax',
      scope: 'north', confidence: 'medium',
      north: 'fuyax',
      national: 'fuqash (most regions), imta, weqtash',
      why: 'Documented for the Tangier–Tetouan northwest as a region, not for Tetouan city specifically.',
      teach: 'Worth teaching, but check it against a Tetouani ear before calling it local — the source groups Tetouan with Tangier here.'
    },
    {
      id: 'updown',
      group: 'words',
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
    { title: 'Tetouani proverbs',
      detail: 'Mohamed Daoud’s collection of the popular proverbs of Tetouan (1999, several volumes) exists, but no page online shows a single proverb from it, and Peregrín’s 1947 Moroccan collection printed in Tetouan is likewise unseen. If Ahmed has either book, proverbs can come in with their source.' },
    { title: 'How Tetouanis say the city’s own name',
      detail: 'Arabic Wikipedia says تطاون is how "all the people of the city" say it in ordinary speech; the CORVAM corpus transcribes the name [țǝṭwān]. The two sources differ, and the answer is Ahmed’s.' },
    { title: 'Everyday greetings beyond one exchange',
      detail: 'The only greeting recorded in Tetouan that any opened source gives is Singer’s good-morning exchange of 1958. No Tetouan-attributed list of salam, labas or bslama was found; the greetings in this course rest on Ahmed.' },
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
  },
  /* Features recorded in Tetouan that the contrasts above do not yet teach:
     from the CORVAM corpus page (University of Zaragoza, Ángeles Vicente),
     opened 13 October 2026. The form is the corpus's own transcription, kept
     as the source wrote it; it is not a learner spelling and not a card.
     Ahmed decides whether any of these becomes a contrast or a word. */
  documented: [
    { id: 'q-as-x', group: 'sounds', scope: 'tetouan', title: 'ق said as kh in some words',
      form: 'CORVAM: /q/ → /x/',
      what: 'In a few words the q is pronounced as a kh, in traditional and urban speech alike. The corpus calls it "a common trait in both varieties".',
      source: 'CORVAM, Tetouan', url: 'https://corvam.unizar.es/en/localities/tetouan/' },
    { id: 'zh-as-g', group: 'sounds', scope: 'tetouan', title: 'ž said as g next to s and z',
      form: 'CORVAM: /ž/ → /g/ "in contact with sibilant phonemes"',
      what: 'Where ž (the j of "jour") stands beside an s or z sound, Tetouanis say g instead. Younger speakers are starting to say d there, "towards the more common pronunciation".',
      source: 'CORVAM, Tetouan', url: 'https://corvam.unizar.es/en/localities/tetouan/' },
    { id: 'aad-future', group: 'verbs', scope: 'mdini', title: 'ʕād / ʕa: an older way to say "going to"',
      form: 'CORVAM: ʕād / ʕa + imperfective',
      what: 'Beside māš, the traditional city speech also marked the future with ʕād or ʕa. The corpus says it "is in clear regression, especially in the urban variety": you may hear it from older people, you need not say it.',
      source: 'CORVAM, Tetouan', url: 'https://corvam.unizar.es/en/localities/tetouan/' },
    { id: 'wah-plural', group: 'verbs', scope: 'tetouan', title: 'The -wah ending',
      form: 'CORVAM: suffix -wăh with plural imperfectives',
      what: 'When a plural verb takes the third-person object ("they see him"), the ending is -wah rather than the -uh heard elsewhere.',
      source: 'CORVAM, Tetouan', url: 'https://corvam.unizar.es/en/localities/tetouan/' },
    { id: 'n-direction', group: 'words', scope: 'tetouan', title: 'n for "to" a place',
      form: 'CORVAM: the preposition n "is often used for direction"',
      what: 'Going to the market, to Martil: a short n does the job of the l- you would hear further south.',
      source: 'CORVAM, Tetouan', url: 'https://corvam.unizar.es/en/localities/tetouan/' },
    { id: 'north-words', group: 'words', scope: 'north', title: 'Window, boy, dog: northern words',
      form: 'CORVAM: tāqa (window), ʕāyəl (boy), žru (dog)',
      what: 'The corpus lists these with ṭlăʕ and hăwwəd as items shared across the north: correct in Tetouan, not the city\u2019s own. tāqa and ʕāyəl are already cards; žru is not yet.',
      source: 'CORVAM, Tetouan', url: 'https://corvam.unizar.es/en/localities/tetouan/' }
  ],
  /* ------------------------------------------------------------------------
     Added 13 October 2026 from the everyday-usage research log
     (design/research/2026-10-13-everyday-usage.md). Every quote was read on a
     page that was opened; forms are the researchers' own transcription and
     are not spellings to learn. The "say" line in each default is the
     course's reading of the quoted sources, for Ahmed to confirm.
     ------------------------------------------------------------------------ */
  defaults: [
    { feature: 'q, or the old-city glottal stop', contrast: 'qaf',
      hear: 'A glottal stop from older medina speakers, women especially: Ɂūl li, băɁlāwa, Ɂălb. A q from the young and most of the city: ka-nqūl. In a few fixed words both say x: wăxţ "time", fūyāx "when".',
      say: 'Say q. Recognise the glottal stop; do not imitate it unless Ahmed models it, because the sources tie it to a closed social group.',
      says: [
        { quote: 'Glottal pronunciation /ʔ/ … by speakers of mdini variety, for example: ka-nʔūl "I say". In contrast, in the urban Tetouan variety, the most common pronunciation is velar, voiceless /q/', source: 'CORVAM, Tetouan', url: 'https://corvam.unizar.es/en/localities/tetouan/' },
        { quote: 'Tetouan (Vicente 2009) or Branes (Larej 2017: 292) it is linked to sociolects associated with women', source: 'Benítez Fernández 2024, AIDA Granada (on the glottal q)', url: 'https://puz.unizar.es/img/cms/LIBRES/9788413408347.pdf' },
        { quote: 'the informants consider the realisation *ka-dʔul impossible in the traditional variety of the city, but ka-dqūl is possible (translated from Spanish)', source: 'Naciri-Azzouz 2021, thesis, note 219', url: 'https://zaguan.unizar.es/record/124490/files/TESIS-2023-055.pdf' } ] },
    { feature: 'ntina, one "you" for everyone', contrast: 'ntina',
      hear: 'nţīna, or nţīnak, to men and to women, from every age, all over the north. The verb has one form for both as well: ţəʕrəf "you know", kūl "eat!", ktǝbţi "you wrote".',
      say: 'Say ntina to everyone and use the single form of the verb. Outside the north people say nta to a man and nti to a woman.',
      says: [
        { quote: 'nţīna (or the allomorph nţīnak) "you", while in other varieties in Morocco gender differentiation exists: nta "you (M)" and nti "you (F)"', source: 'CORVAM, Tetouan', url: 'https://corvam.unizar.es/en/localities/tetouan/' },
        { quote: 'does not distinguish the gender of the 2nd person singular of the independent personal pronoun: nţīna "you (m./f.)"', source: 'Aguadé & Salim 2024, on Tangier', url: 'https://puz.unizar.es/img/cms/LIBRES/9788413408347.pdf' } ] },
    { feature: 'ġadi or māš for the future', contrast: 'mash',
      hear: 'ġa- or ġādi from the young: ġa-nkəmmlu. māš from older and rural speakers: māš nqūl lək. ʕa- from a few older people. In Tangier, ha among the young.',
      say: 'Say ġa- or ġādi, which is understood everywhere. Recognise māš, ʕa and ha. In Tangier māš now sounds rural; ask Ahmed how it sounds in Tetouan before adopting it.',
      says: [
        { quote: 'where it seems to be disappearing in the speech of younger speakers because of the pressure of the particle ġādi', source: 'CORVAM, Tetouan, on māš', url: 'https://corvam.unizar.es/en/localities/tetouan/' },
        { quote: 'Today most speakers tend to use ġa instead of māšši/māš (which is now stigmatised as a rural feature)', source: 'Aguadé & Salim 2024, on Tangier', url: 'https://puz.unizar.es/img/cms/LIBRES/9788413408347.pdf' } ] },
    { feature: 'lli, or the old-city dən', contrast: 'den',
      hear: 'lli from almost everyone. dən, or dǝnnu with a suffix, now and then from old-city and rural speakers: n-nǝdǧār dǝnnu žāb līna l-table, "the carpenter who brought us the table".',
      say: 'Say lli. Recognise dən.',
      says: [
        { quote: 'The relative pronoun in the mdini variety is sometimes dən, with duplication of the final nūn when a suffix pronoun is added … while the speaker of the urban variety would have used lli', source: 'CORVAM, Tetouan', url: 'https://corvam.unizar.es/en/localities/tetouan/' } ] },
    { feature: 'The soft r of the old city', contrast: 'r',
      hear: 'A soft, untrilled r from older city families: l-mɹa, ɹ-ɹāžəl, țāɹīx. The ordinary rolled r from the young: ḥŏrra, l-qrāya. The two sources describe the old sound differently, as an approximant and as a uvular fricative.',
      say: 'Say the rolled r. Treat the soft r as a mark of old Tetouan to recognise.',
      says: [
        { quote: 'The pronunciation approximant alveolar /ɹ/ of the trill, alveolar phoneme /r/ is also a feature of the mdini variety', source: 'CORVAM, Tetouan', url: 'https://corvam.unizar.es/en/localities/tetouan/' },
        { quote: 'the voiced trill /r/ is never realised as a voiced uvular fricative /ʁ/ in Tangier, as in Tetouan or Chaouen', source: 'Aguadé & Salim 2024', url: 'https://puz.unizar.es/img/cms/LIBRES/9788413408347.pdf' } ] },
    { feature: 'ḍ said as ṭ',
      hear: 'mrīṭa "sick", băyṭa "egg", ṭăhri from everyone, old and young; the countryside’s young copy it from the city.',
      say: 'Expect ṭ. A ḍ will still be understood: it is the form in the rest of Morocco.',
      says: [
        { quote: 'The voiceless pronunciation /ṭ/ of the voiced phoneme /ḍ/ is a common trait in both varieties', source: 'CORVAM, Tetouan', url: 'https://corvam.unizar.es/en/localities/tetouan/' },
        { quote: 'among the youngest, the most widespread realisation in all of Ghomara is /ṭ/, through levelling toward the prestigious northern variety (translated from Spanish)', source: 'Naciri-Azzouz 2021, thesis', url: 'https://zaguan.unizar.es/record/124490/files/TESIS-2023-055.pdf' } ] },
    { feature: 'ž said as g beside s and z',
      hear: 'gŭwwəzt sīmāna "I spent a week" from most; dŭwwəzt from some of the young.',
      say: 'Recognise both.',
      says: [
        { quote: 'āna gŭwwəzt sīmāna ḥămqa "I have had a mad week" … changes in the sociolect of youngsters towards … /d/, are beginning to appear', source: 'CORVAM, Tetouan', url: 'https://corvam.unizar.es/en/localities/tetouan/' } ] },
    { feature: 'The older diphthongs', contrast: 'diphthong',
      hear: 'l-ḥăwma, băyṭa, bīxăyr from older speakers; l-ḥūma, bīxīr from the young.',
      say: 'Recognise them; either is fine to say.',
      says: [
        { quote: 'l-ḥăwma as opposed to l-ḥūma "the district" … it is beginning to disappear and /ăy/>/ī/, /ăw/>/ū/', source: 'CORVAM, Tetouan', url: 'https://corvam.unizar.es/en/localities/tetouan/' } ] },
    { feature: 'n for "to" a place', contrast: 'updown',
      hear: 'n ṭanža, n ǝl-ḥăwma; hăwwədti n bulvar? "did you go down to the boulevard?"',
      say: 'Use n for "to" a place, and ṭlăʕ and hăwwəd for going up and down.',
      says: [
        { quote: 'The preposition for direction often is n–', source: 'CORVAM, Tetouan', url: 'https://corvam.unizar.es/en/localities/tetouan/' } ] },
    { feature: 'The Spanish words', contrast: 'spanish',
      hear: 'sīmāna "week", estudio, bulvar, buskūču, paiya, every day; karretēra and trawzez in the countryside.',
      say: 'Expect them and use the ones Ahmed teaches: the corpus calls them "a sign of identity".',
      says: [
        { quote: 'Another feature to highlight is the presence of numerous Spanish loanwords … the most obvious difference between the Arabic of Tetouan and that of other Moroccan varieties spoken in the center and south', source: 'CORVAM, Tetouan', url: 'https://corvam.unizar.es/en/localities/tetouan/' } ] },
    { feature: 'ku … xŭdd-, the "if I had" marker',
      hear: 'Counterfactual sentences, "if I had done that": a marker documented only for Tetouan and the Ghomara.',
      say: 'Recognise only. Advanced.',
      says: [
        { quote: 'this marker ku...xŭdd-/ ka...xŭdd- has only been documented for Tetouan and Ghomara so far', source: 'Aguadé & Salim 2024', url: 'https://puz.unizar.es/img/cms/LIBRES/9788413408347.pdf' } ] }
  ],

  /* phrases and words recorded from Tetouanis, in the researchers' transcription */
  heard: [
    { form: 'ṣbaḥ ǝl-xayr ā si moḥammad, kīf ṣbaḥto? — b-xayr ǝlḥamdli-ḷḷāh u ntīnak?', meaning: 'Good morning, Si Mohammed, how did you sleep? Fine, thank God, and you? The honorific plural ("did you, plural, sleep") has fallen out of use.', who: 'Singer’s Tetouan corpus of 1958, as quoted by Herrero 2008', source: 'Herrero Muñoz-Cobo 2008, EDNA 12', url: 'https://journals.uco.es/edna/article/download/8692/8196' },
    { form: 'ā l-ʕāyl(a)', meaning: '"hey, boy", "hey, girl": a northern way to call a young person', who: 'Herrero 2008, on Tetouan and the north', source: 'Herrero Muñoz-Cobo 2008', url: 'https://journals.uco.es/edna/article/download/8692/8196' },
    { form: 'mma ʕayno', meaning: 'what a Tetouani calls a grandmother; Herrero counts such forms as "marks of the prestige variety"', who: 'Tetouan', source: 'Herrero Muñoz-Cobo 2008', url: 'https://journals.uco.es/edna/article/download/8692/8196' },
    { form: 'xtīti', meaning: 'what older Jebala women call an elder sister: the hills, not the city', who: 'the Jebala', source: 'Herrero Muñoz-Cobo 2008', url: 'https://journals.uco.es/edna/article/download/8692/8196' },
    { form: 'mūlāy ǝṣ-ṣōlṭān', meaning: '"his majesty the sultan": said only to the groom on his wedding day', who: 'Tetouan', source: 'Herrero Muñoz-Cobo 2008', url: 'https://journals.uco.es/edna/article/download/8692/8196' },
    { form: 'Torres → Torresa', meaning: 'a wife known by the feminine of the family name: Tetouan "makes women visible" this way, says Herrero', who: 'Tetouan', source: 'Herrero Muñoz-Cobo 2008', url: 'https://journals.uco.es/edna/article/download/8692/8196' },
    { form: 'bīxăyr / ʕla xăyr', meaning: '"fine": the older form of the reply, with the diphthong; the young say bīxīr / ʕla xīr', who: 'Singer 1958, in the corpus', source: 'CORVAM, Tetouan', url: 'https://corvam.unizar.es/en/localities/tetouan/' },
    { form: 'wāš fāyǝn? wāš fīha?', meaning: '"is it okay?": among the words "we can find also in other northern varieties"', who: 'Tetouan and the north', source: 'CORVAM, Tetouan', url: 'https://corvam.unizar.es/en/localities/tetouan/' },
    { form: 'fhəmţi nţīna?', meaning: '"have you understood?": the 65-year-old’s check, repeated all through the recording as fhǝmți?', who: 'a man of 65, the medina, 2012', source: 'CORVAM, Tetouan', url: 'https://corvam.unizar.es/en/localities/tetouan/' },
    { form: 'a xāy', meaning: '"brother", as a call: dŭwwəzt sīmāna mḍăxxma a xāy, "I’ve had a great week, brother"', who: 'a young Tetouani', source: 'CORVAM, Tetouan', url: 'https://corvam.unizar.es/en/localities/tetouan/' },
    { form: 'šmən qbīla nţīna?', meaning: '"what tribe do you belong to?"', who: 'Singer 1958, in the corpus', source: 'CORVAM, Tetouan', url: 'https://corvam.unizar.es/en/localities/tetouan/' },
    { form: 'xăɹɹāza u dǝbbāġa u nǝžžāɹa, w-ǝl-ḥǝddāda', meaning: 'shoemakers, tanners, carpenters and smiths: ž-žmāʕa d ṣnāyʕĭyya, "the artisans", in the old man’s words; a master craftsman is a mʕăllǝm', who: 'a man of 65, the medina, 2012', source: 'CORVAM, Tetouan', url: 'https://corvam.unizar.es/en/localities/tetouan/' },
    { form: 'l-ʕyūn, ṭ-ṭălʕa, sūq ǝl-fūqi, bāb ǝl-ʕoqla', meaning: 'three quarters of the old medina, and the gate he also calls la pueɹta ɹeina', who: 'the same speaker', source: 'CORVAM, Tetouan', url: 'https://corvam.unizar.es/en/localities/tetouan/' },
    { form: 'băɁlāwa, mlūža, l-qṭāyǝf, ḥlāwĭyyāț, buskūču', meaning: 'baklava, said with the old-city glottal stop; mlouja; qatayef; sweets; bizcocho: the sweets he says came with the Algerians', who: 'the same speaker', source: 'CORVAM, Tetouan', url: 'https://corvam.unizar.es/en/localities/tetouan/' },
    { form: 'ʕăndna ka-nʔūlu mātāl', meaning: '"amongst us there is a proverb": a medina speaker of 60, with the Fusha word for proverb', who: 'a man of 60, the medina', source: 'CORVAM, Tetouan', url: 'https://corvam.unizar.es/en/localities/tetouan/' }
  ],

  /* who speaks which variety: the social picture, sourced */
  who: [
    { text: 'Two varieties "competing for social prestige" live in the city.', source: 'CORVAM, Tetouan', url: 'https://corvam.unizar.es/en/localities/tetouan/' },
    { text: 'The traditional mdini speech belongs to "the families considered the older dwellers of Tétouan, the “pure” Tétouan people, regardless of the district in which they live", and "usually survives only amongst adults and older generations".', source: 'CORVAM, Tetouan', url: 'https://corvam.unizar.es/en/localities/tetouan/' },
    { text: 'Some of those speakers are earlier rural migrants who "probably levelled towards this variety, the prestigious one at the time".', source: 'CORVAM, Tetouan', url: 'https://corvam.unizar.es/en/localities/tetouan/' },
    { text: 'The urban variety "is used mostly by young people, who are leading the accommodation and levelling process".', source: 'CORVAM, Tetouan', url: 'https://corvam.unizar.es/en/localities/tetouan/' },
    { text: 'Tetouan and Tangier are "the reference variety" of the north-west, l-haḍra š-šamāliya, "the northern speech", toward which the countryside levels; Tetouan in turn is pulled toward the Casablanca-based koine.', source: 'Naciri-Azzouz 2021; Moscoso 2006, reviewing Vicente', url: 'https://zaguan.unizar.es/record/124490/files/TESIS-2023-055.pdf' },
    { text: 'The glottal stop in Tetouan "is linked to sociolects associated with women" (Vicente 2009, as cited). In Tangier, older women keep it and "this realisation is decreasing".', source: 'Benítez Fernández 2024; Aguadé & Salim 2024', url: 'https://puz.unizar.es/img/cms/LIBRES/9788413408347.pdf' },
    { text: 'The prestige variety of the north, "especially in Tetouan", has "a greater presence of vowels in the conjugation" than rural speech (translated from Spanish).', source: 'Naciri-Azzouz 2021, note 225', url: 'https://zaguan.unizar.es/record/124490/files/TESIS-2023-055.pdf' },
    { text: 'A Tetouan-raised writer: some count themselves "tetuaníes puros", descendants of the Andalusi émigrés, and "then come the less Tetouani: those from the Jebala and the Rif". Tetouanis are "of a great reserve, almost distrustful and not very welcoming toward the outsider", so newcomers "often confess to struggling to be integrated even after many years" (translated from Spanish).', source: 'Benchekroun 2013, Cuentos populares de Tetuán (sample)', url: 'https://editorial.ugr.es/media/ugr/files/sample-132310.pdf' },
    { text: 'The 2024 census gives 97.2% of the city Arabic as a native language, 2.5% Berber; Jebli speech "is predominant since people from the neighboring rural areas settled in the city".', source: 'Wikipedia, Tétouan', url: 'https://en.wikipedia.org/wiki/T%C3%A9touan' },
    { text: 'The dedicated study, Vicente & Naciri-Azzouz, "The social value of linguistic practices in Tetouan and Ghomara" (Routledge, 2018), cannot be read online. Its second author writes that she is "a native speaker of the Tetouan dialect".', source: 'UGR record; Naciri-Azzouz 2021, note 23', url: 'https://produccioncientifica.ugr.es/documentos/67212fb03cd7fa33b002b80a?lang=fr' }
  ],

  /* leads for hearing real Tetouanis: links out, nothing copied, not yet reviewed by Ahmed */
  listen: [
    { title: 'CORVAM: Tetouan city, 5 minutes 38 seconds', who: 'Mohamed, about 65, born and raised in Tetouan, in a house in the medina, 2012',
      why: 'The one recording with a full transcription and translation on the page, so a learner can follow it word by word. The grammar of this guide comes from it.',
      terms: 'Copyright CORVAM, all rights reserved: listen on their page.', url: 'https://corvam.unizar.es/en/localities/tetouan/' },
    { title: 'CORVAM: Jbala and Ghomara', who: 'Villagers of the Anjra, Branès and Ghzawa tribes; women of Oued Laou and Qāʕ Asrās, one of them two years in Tetouan',
      why: 'The countryside whose speech is flowing into the city, with transcriptions. Hear what young Tetouanis grew up beside.',
      terms: 'Copyright CORVAM, all rights reserved.', url: 'https://corvam.unizar.es/en/localities/jbala/' },
    { title: 'Le360: Tétouan, le dernier carré de la tannerie (2019)', who: 'Lahcen Bouzid and other tanners of Dar Edbagh, in the medina, at work',
      why: 'Craftsmen of the old city speaking in their own workshop: the trades the corpus speaker lists, in situ.',
      terms: 'Le360’s article with its film; no reuse licence shown.', url: 'https://fr.le360.ma/societe/video-tetouan-le-dernier-carre-de-la-tannerie-194369/' },
    { title: 'Radio Régionale de Tétouan (SNRT)', who: 'Presenters and guests from the city; a regional station "essentially for the Tetouan public"',
      why: 'Everyday public speech, every day. Its "Story of a place" series covered Ma’ es-Segundo, Dar Edbagh, Dar Sanaa and the old station.',
      terms: 'Public broadcaster. 96.1 FM by one listing, 93.7 by another; no stream address was found on an opened page.', url: 'https://haca.ma/sites/default/files/upload/documents/RG_tetouan.pdf' },
    { title: 'Jebli & Beldi, the sketches', who: 'Comedians playing a hill-country character against a townsman, in Tetouan, sponsored by Tetouani businesses',
      why: 'Not a model to copy: a performed stereotype. Useful for hearing what the city mocks, which tells you what it hears as rural.',
      terms: 'Online video; no licence shown. Described by Benítez Fernández & Guerrero 2022.', url: 'https://www.youtube.com/watch?v=JxvlirMCjUI' }
  ],

  recording: {
    title: 'Tetouan Arabic: Tetouan city',
    who: 'Mohamed, a man of about 65, born and mostly raised in Tetouan',
    when: 'October 2012', where: 'a private house in the medina of Tetouan',
    by: 'Ángeles Vicente (recording, transcription, Spanish translation)',
    length: '5 minutes 38 seconds, from a 43-minute recording',
    note: 'His speech has "the characteristic features of the traditional Arabic variety" of the city. The grammar on the corpus page comes from him, a second medina speaker of 60, and younger speakers of 15 to 20.',
    url: 'https://corvam.unizar.es/en/localities/tetouan/'
  }
};
