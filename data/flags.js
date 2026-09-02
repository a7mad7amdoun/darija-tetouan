/* ---------------------------------------------------------------------------
   VERIFICATION FLAGS

   status: 'open'     -> red "Needs verification" badge, teacher must confirm
           'resolved' -> green "Verified" badge, shows the finding
           'partial'  -> amber, resolved in principle but with a caveat

   Attach to any card with:  flags: ['qaf-shift']
   Edit here once; every card, the Teacher page and the Dialect Guide update.
   --------------------------------------------------------------------------- */
window.DARIJA = window.DARIJA || {};

window.DARIJA.flags = {

  'limen-lisser': {
    label: 'Confirmed locally', status: 'resolved',
    title: 'Right and left in Tetouan',
    detail: 'Answered by a Tetouani speaker: limen for right, shmal for left. The site previously taught lisser for left, which was drafted from general Darija and is not what people say here. Corrected.',
    source: 'Native Tetouani speaker, via the teacher'
  },

  'word-order-bghit': {
    label: 'Needs verification', status: 'open',
    title: 'Word order of "bghit ___ 3afak" in Tetouani speech',
    detail: 'Taught here as bghit + noun + 3afak. What is unconfirmed is whether Tetouanis more naturally front the 3afak, or use a different softener entirely for a request of this kind.',
    caveat: 'Listen for where the politeness marker actually lands in a real cafe order.'
  },

  'present-prefix': {
    label: 'Needs verification', status: 'partial',
    title: 'Present-tense prefix in Tetouani pronunciation',
    detail: 'ka- is documented as the northern preverb (ta- is southern), and the 2nd person prefix in the north is d- rather than t-, gender-neutral. Both are taught here on that basis.',
    caveat: 'The general pattern is attested; the precise Tetouani realisation of ka-n-, ka-d-, ka-y- in fast speech is worth checking by ear before drilling it as a rule.',
    source: 'Wikipedia: Moroccan Arabic (preverbs); CORVAM Tetouan'
  },

  'past-suffix': {
    label: 'Needs verification', status: 'partial',
    title: 'Past-tense suffix forms in Tetouani speech',
    detail: 'Taught here as -t for I, -ti for you (gender-neutral, matching ntina), bare for he, -at for she. The gender-free 2nd person follows from the documented ntina pattern.',
    caveat: 'The ntina pronoun is attested for Tetouan; that the past -ti ending is likewise gender-free follows logically but was not directly attested. Confirm with a local before teaching it as a rule.'
  },

  'fillers': {
    label: 'Needs verification', status: 'open',
    title: 'Tetouan-specific conversational fillers',
    detail: 'No filler words specific to Tetouan were found in the sources consulted. safi, wakha, yallah and zid are general Moroccan and are taught as such.',
    caveat: 'Worth an hour of listening: note what people actually say while thinking, agreeing, or changing subject.'
  },

  'feel-constructions': {
    label: 'Needs verification', status: 'open',
    title: 'Most natural Tetouani phrasing for "I feel..."',
    detail: 'Taught here as ana + adjective (ana 3yyan, ana fer7an) and fiya + noun (fiya l-ju3). Whether Tetouanis prefer one construction over the other, or use something else for emotional states, is unconfirmed.',
    caveat: 'Ask how someone would say I am worried, I am bored, I am comfortable — the answers will show the pattern.'
  },

  'fem-smitek': {
    label: 'Confirmed locally', status: 'resolved',
    title: 'The female form of "what is your name"',
    detail: 'Answered: to a woman it is ismek, a different word rather than smitek with a shifted vowel. Both forms are now taught separately.',
    caveat: 'Worth holding in mind: the pronoun ntina genuinely does not change for gender, but this question does. A gender-free pronoun does not make the whole language gender-free, and the site now says so on the card.',
    source: 'Native Tetouani speaker, via the teacher'
  },

  'labas-followup': {
    label: 'Confirmed locally', status: 'resolved',
    title: 'A distinct Tetouani follow-up to "labas"',
    detail: 'Answered: there is not one. The national standard is what Tetouanis use, so labas and kif ntina are fine as taught. The Tetouani colour comes from ntina, not from a different phrase.',
    source: 'Native Tetouani speaker, via the teacher'
  },

  'spanish-loanwords': {
    label: 'Confirmed locally',
    status: 'resolved',
    title: 'Spanish loanwords in daily Tetouani speech',
    detail: 'Confirmed and now taught as real vocabulary. Spanish borrowing is concentrated in the northern protectorate zone (Tangier, Tetouan, Chefchaouen). Documented everyday items: simana (semana), kuzina (cocina), blaya (playa), kama (cama — recorded as northern-only), rwida (rueda), manta, kurda (cuerda), blasa (plaza), bokadyo (bocadillo), fabor (favor).',
    source: 'Lingualid loanword list; Imminent/Translated; Wikipedia: Jebli Arabic'
  },

  'qaf-shift': {
    label: 'Verified',
    status: 'resolved',
    title: 'How ق is really pronounced in Tetouan',
    detail: 'Settled, and more interesting than a yes/no. Tetouan never had the q\u2192g shift \u2014 it is pre-Hilalian, so "gal" is simply Casablanca. Inside the city there are two realisations: traditional mdini speakers use a glottal stop (ka-n\u0294ul "I say", \u0294alb "heart"), while younger urban speakers use [q] (ka-nqul). Teach [q] as the working default and let him recognise the glottal stop from older Tetouanis.',
    caveat: 'Confirmed locally, with a refinement the corpus did not give: plain q is the standard everyday pronunciation, and the older glottal-stop version survives among some older medina residents but reads as old-fashioned to younger speakers. So teach the q and treat the glottal stop as recognition only.',
    source: 'CORVAM Tetouan corpus; confirmed by a native Tetouani speaker'
  }
};
