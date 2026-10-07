/* ---------------------------------------------------------------------------
   AUDIO MANIFEST

   THERE ARE NO RECORDINGS YET. This file is the index they will land in, and
   until Ahmed records them every lookup correctly reports "no clip", and the
   app says so rather than substituting anything.

   Nothing here may be generated. No speech synthesis, no "Tetouani-sounding"
   model, no Modern Standard Arabic stand-in, and no national-Darija clip used
   because it is close enough - the whole point of this course is that it is
   not close enough. A clip is either a recording of a Tetouani speaker Ahmed
   has approved, or it does not exist.

   One entry per recorded utterance, keyed by the SAME stable content id used
   everywhere else, so a clip can never drift onto a different card:

     'w1-hello': {
       file: 'w1-hello.m4a',    relative to AUDIO.base
       speaker: 'ahmed',        who said it
       scope: 'tetouan',        must match the card's own scope
       verified: true,          Ahmed has listened back and approved it
       rev: 1                   the transcript revision it was recorded against
     }

   'rev' is the safety catch. If a card's text is later corrected, bump the
   card's audioRev and this clip is shown as out of date rather than quietly
   teaching the old wording.
   --------------------------------------------------------------------------- */
window.DARIJA = window.DARIJA || {};
window.DARIJA.audio = {
  /* Where clips live. Relative, so it keeps working under /darija-tetouan/ and
     when index.html is opened straight off the disk.

     NOTE: anything under this path on GitHub Pages is PUBLIC - the login
     screen does not protect files, only the app. See AUDIO-RECORDING-CHECKLIST.md
     before putting private recordings here. */
  base: 'assets/audio/',

  /* Set by whoever records: 'local' while clips sit in the repo, or 'supabase'
     once private hosting is set up and reviewed. Nothing switches this on its
     own. */
  source: 'local',

  clips: {
    /* empty on purpose - see AUDIO-RECORDING-CHECKLIST.md */
  }
};
