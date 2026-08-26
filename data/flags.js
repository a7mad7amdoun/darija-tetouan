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
    label: 'Needs verification',
    status: 'open',
    title: 'Exact Tetouani pronunciation of right and left',
    detail: 'limen and lisser are the northern forms and derive transparently from Classical yam\u012bn and yas\u0101r. What is not settled is the precise Tetouani realisation \u2014 whether the l- prefix is heard as li-, l-, or \u02BFla l-, and how much the final consonant is reduced in ordinary speech.',
    caveat: 'Worth one minute with a local: ask them to point and say it twice, and write down what you actually hear.'
  },

  'fem-smitek': {
    label: 'Verified',
    status: 'partial',
    title: 'Female form of "what is your name"',
    detail: 'Northern Moroccan (Jebli, Tanjawi, Tetouani) uses ntina for "you" to both men and women — there is no nta/nti split. So there is no separate female form to learn.',
    caveat: 'The pronoun is well attested. That the possessive suffix -ek is therefore also gender-neutral (smitek to anyone) follows from the pattern but was not directly attested — worth one confirmation from a local.',
    source: 'Wikipedia: Moroccan Arabic (regional pronouns); Jebli Arabic'
  },

  'labas-followup': {
    label: 'Needs verification',
    status: 'open',
    title: 'Tetouani follow-up to "labas"',
    detail: 'Research found no second-turn greeting specific to Tetouan beyond the national labas / kif ntina / bikhir. The northern touch is using ntina in the follow-up, not a different phrase.',
    caveat: 'Still the one item best answered by standing in a Tetouan café for ten minutes. Ask a local what actually follows "labas".'
  },

  'spanish-loanwords': {
    label: 'Verified',
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
    caveat: 'Correction: an earlier version of this app said Tetouan preserves [q] and that the glottal stop was Fessi-only. That was wrong \u2014 traditional Tetouani uses it too.',
    source: 'CORVAM Tetouan corpus (Univ. Zaragoza); Singer 1958; Vicente'
  }
};
