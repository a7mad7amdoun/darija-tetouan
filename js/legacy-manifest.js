/* ---------------------------------------------------------------------------
   FROZEN LEGACY MANIFEST  —  DO NOT EDIT, EVER.

   The old storage format addressed self-checks, checkpoint tasks and spoken
   tasks by their POSITION in an array:

       chk:<course>:w<week>:<index>
       cp:<course>:<index>
       spoken:<examId>:<index>

   Position is not identity. If an item is inserted, every later index silently
   comes to mean a different statement. These tables are the ONLY safe way to
   read that old data: they record which item occupied which position at the
   moment the format was retired.

   HOW THIS WAS DERIVED  (not guessed — see the evidence below)

   Every index-addressed array was checked against every revision in git that
   touched it:

     data/month1.js   106186d b4c83ed 49b7bef 33c841b 056cfc1 eeb7fa3 995f9a4
     data/month2.js   introduced e430c6d
     data/month3.js   introduced 8740d84
     js/exams.js      introduced 33c841b, never changed since

   Result: in every array, across every revision, items only ever had their
   WORDING changed (third person to first person in b4c83ed). No item was
   inserted, removed, reordered, or renumbered. Counts never changed. The item
   at index N has therefore always meant the same thing, so a single frozen
   table is sufficient and unambiguous.

   If that had NOT been true, this file would need one table per legacy
   content version and the migration would have to know which version wrote
   each key. It is worth keeping that in mind before ever reordering content
   again: from now on IDs are stable, so it cannot recur.

   RULES
     - Never regenerate this file from current content. Current content moves;
       this must not.
     - Never remove an entry. A retired item still needs to be readable.
     - If a key cannot be mapped here, the migration MUST stop and report it
       rather than guess.
   --------------------------------------------------------------------------- */
window.DARIJA = window.DARIJA || {};

window.DARIJA.legacy = {

  /* the schema version this manifest describes */
  describesSchemaVersion: 1,

  /* chk:<course>:w<week>:<index>   keyed '<courseShort>:w<week>' */
  checks: {
    'm1:w1': [
      'chk-m1-w1-greet-ask-using-ntina',
      'chk-m1-w1-say-name-ask-theirs',
      'chk-m1-w1-say-am-ask',
      'chk-m1-w1-say-please-thank-goodbye',
      'chk-m1-w1-use-ntina-man-woman',
    ],
    'm1:w2': [
      'chk-m1-w2-count-20-understand-numbers',
      'chk-m1-w2-ask-much-understand-answer',
      'chk-m1-w2-tell-time-ask-time',
      'chk-m1-w2-ask-question-wash-understand',
      'chk-m1-w2-use-shenni-fuyax-instead',
    ],
    'm1:w3': [
      'chk-m1-w3-i-can-ask-where',
      'chk-m1-w3-understand-basic-directions-given',
      'chk-m1-w3-tell-taxi-driver-am',
      'chk-m1-w3-ask-stranger-help-politely',
      'chk-m1-w3-hold-q-qrib-wqef',
    ],
    'm1:w4': [
      'chk-m1-w4-run-full-greeting-question',
      'chk-m1-w4-switch-between-price-time',
      'chk-m1-w4-hold-10-minutes-conversation',
      'chk-m1-w4-handle-topic-change-see',
      'chk-m1-w4-keep-ntina-q-intact',
    ],
    'm2:w5': [
      'chk-m2-w5-order-drink-modify-sugar',
      'chk-m2-w5-answer-kif-l-khedma',
      'chk-m2-w5-give-reason-hit-instead',
      'chk-m2-w5-ask-permission-wash-nqder',
      'chk-m2-w5-join-ideas-sentence-pausing',
    ],
    'm2:w6': [
      'chk-m2-w6-ask-price-specific-quantity',
      'chk-m2-w6-say-want-want',
      'chk-m2-w6-judge-goods-loud-fresh',
      'chk-m2-w6-make-conditional-offer-ila',
      'chk-m2-w6-know-use-ma-sh',
    ],
    'm2:w7': [
      'chk-m2-w7-greet-door-ask-after',
      'chk-m2-w7-refuse-food-giving-offence',
      'chk-m2-w7-compliment-meal-expected-way',
      'chk-m2-w7-describe-using-lli',
      'chk-m2-w7-leave-politely-reason-next',
    ],
    'm2:w8': [
      'chk-m2-w8-say-hurts-ask',
      'chk-m2-w8-explain-broken-ask-fix',
      'chk-m2-w8-ask-stranger-help-reason',
      'chk-m2-w8-hold-fifteen-minutes-conversation',
      'chk-m2-w8-build-sentence-hit-ila',
    ],
    'm3:w10': [
      'chk-m3-w10-say-am-going-mash',
      'chk-m3-w10-fix-meeting',
      'chk-m3-w10-hedge-plan-imken-waqila',
      'chk-m3-w10-decline-invitation-reason',
      'chk-m3-w10-use-mazal-plus-negative',
    ],
    'm3:w11': [
      'chk-m3-w11-state-opinion-kanshuf-belli',
      'chk-m3-w11-say-liked',
      'chk-m3-w11-compare-things-hsen-men',
      'chk-m3-w11-describe-person-adjectives',
      'chk-m3-w11-disagree-causing-offence',
    ],
    'm3:w12': [
      'chk-m3-w12-ask-say-darija-mid',
      'chk-m3-w12-recover-lose-thread-switching',
      'chk-m3-w12-introduce-myself-clauses',
      'chk-m3-w12-tell-story-past-give',
      'chk-m3-w12-hold-twenty-minutes-conversation',
    ],
    'm3:w9': [
      'chk-m3-w9-say-yesterday-past-tense',
      'chk-m3-w9-put-events-order-awwel',
      'chk-m3-w9-ask-ti-ending',
      'chk-m3-w9-set-scene-kunt-say',
      'chk-m3-w9-tell-short-story-reason',
    ],
  },

  /* cp:<course>:<index>   and   spoken:m:<course>:<index>   keyed by course id */
  checkpoints: {
    'month1': [
      'cp-m1-greet-stranger-introduce-yourself',
      'cp-m1-ask-price-understand-answer',
      'cp-m1-ask-time',
      'cp-m1-ask-directions-understand-basic',
      'cp-m1-say-goodbye-politely',
    ],
    'month2': [
      'cp-m2-order-cafe-modify-order',
      'cp-m2-answer-work-question-ask',
      'cp-m2-buy-weight-negotiate-price',
      'cp-m2-accept-invitation-compliment-food',
      'cp-m2-explain-problem-ask-help',
      'cp-m2-leave-politely-reason-next',
    ],
    'month3': [
      'cp-m3-introduce-yourself-clauses-live',
      'cp-m3-tell-story-happened-least',
      'cp-m3-say-thought',
      'cp-m3-make-plan-next-week',
      'cp-m3-decline-reason',
      'cp-m3-recover-misunderstanding-using-english',
      'cp-m3-compare-places-know',
    ],
  },

  /* spoken:<examId>:<index>   keyed by exam id */
  spoken: {
    'six': [
      'spk-six-greeting-runs-one-turn',
      'spk-six-want-need-stated-explained',
      'spk-six-something-happened-past',
      'spk-six-opinion-reason-attached',
      'spk-six-short-story-events-order',
    ],
  },

  /* the old course ids, as they appeared in legacy keys, mapped to the short
     form used in the tables above */
  courseShort: { month1: 'm1', month2: 'm2', month3: 'm3' }
};
