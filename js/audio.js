/* ---------------------------------------------------------------------------
   AUDIO  —  playback of real recordings, and an honest gap where there are none.

   Rules this enforces, not just documents:
     * a clip is only ever played for the content id it was recorded for
     * nothing is synthesised, and nothing is substituted
     * a missing clip is shown as missing wherever someone can act on it -
       in the session, and to the teacher; a learner browsing the library is
       not given an empty state on every one of 338 cards
     * a clip recorded against an older wording is shown as out of date
     * playback is always user-initiated

   Media caching deliberately uses its OWN IndexedDB database. Progress lives in
   'darija-tetouan'; audio lives in 'darija-tetouan-media'. Clearing, evicting or
   corrupting the cache therefore cannot reach anyone's progress.
   --------------------------------------------------------------------------- */
(function () {
  var MEDIA_DB = 'darija-tetouan-media';
  var el = null;          /* one shared <audio>, so a second tap stops the first */
  var playingId = null;

  function manifest() { return (window.DARIJA && DARIJA.audio) || { clips: {}, base: '' }; }

  function clip(id) {
    var m = manifest();
    return (m.clips && m.clips[id]) || null;
  }

  function has(id) { return !!clip(id); }

  /* The clip is stale if the card's text has been revised since it was recorded. */
  function isStale(id, card) {
    var c = clip(id);
    if (!c) return false;
    var want = (card && card.audioRev) || 1;
    return (c.rev || 1) < want;
  }

  function url(id) {
    var c = clip(id);
    if (!c) return null;
    return manifest().base + c.file;
  }

  /* A clip whose scope disagrees with its card is a content error, not a
     playback problem - we refuse to play it rather than teach the wrong thing. */
  function mismatched(id, card) {
    var c = clip(id);
    if (!c || !card || !card.scope) return false;
    return !!c.scope && c.scope !== card.scope;
  }

  /* 'verified' means Ahmed has listened back and approved the clip. It was
     documented as the gate and never actually tested, while play()'s rejection
     message already said 'no approved recording'. */
  function isApproved(id) {
    var c = clip(id);
    return !!(c && c.verified === true);
  }

  function playable(id, card) {
    return has(id) && isApproved(id) && !isStale(id, card) && !mismatched(id, card);
  }

  function stop() {
    if (el) { try { el.pause(); } catch (e) {} }
    playingId = null;
  }

  function play(id, card) {
    if (!playable(id, card)) return Promise.reject(new Error('no approved recording'));
    stop();
    if (!el) {
      el = document.createElement('audio'); el.preload = 'none';
      el.addEventListener('ended', function () { playingId = null; });
      el.addEventListener('error', function () { playingId = null; });
    }
    el.src = url(id);
    playingId = id;
    var p = el.play();
    return (p && p.then) ? p : Promise.resolve();
  }

  function nowPlaying() { return playingId; }

  /* ---- the control ----
     Four states, and each one says what is true:
       play      there is an approved recording
       none      nothing recorded yet
       stale     recorded against older wording
       mismatch  the clip's scope disagrees with the card's  */
  /* opts.quiet: render nothing rather than an empty state.

     Saying "not recorded yet" is the right thing to do where a learner is
     working on one word and would otherwise wonder. It is the wrong thing to do
     87 times down a vocabulary list, which is what it did - a row of dead chips
     advertising a feature that does not exist. Quiet in the library, honest in
     the session, and always shown to the teacher, for whom it is a to-do list. */
  function button(id, card, opts) {
    opts = opts || {};
    var label = opts.label || 'Hear it';
    if (!has(id)) {
      if (opts.quiet) return '';
      return '<span class="audio none" title="No recording yet — this is waiting on the teacher">' +
             '<span class="aico">\u266a</span>not recorded yet</span>';
    }
    if (!isApproved(id)) {
      return '<span class="audio stale" title="Recorded, but not yet approved by the teacher">' +
             '<span class="aico">\u266a</span>awaiting approval</span>';
    }
    if (isStale(id, card)) {
      return '<span class="audio stale" title="The wording changed after this was recorded">' +
             '<span class="aico">♪</span>recording out of date</span>';
    }
    if (mismatched(id, card)) {
      return '<span class="audio stale" title="This clip is scoped differently from the card">' +
             '<span class="aico">♪</span>recording does not match this card</span>';
    }
    return '<button class="audio play" data-audio="' + UI.esc(id) + '" type="button">' +
           '<span class="aico">▶</span>' + UI.esc(label) + '</button>';
  }

  /* OFFLINE CACHING IS NOT IMPLEMENTED.
     There was a cacheOne()/cached() pair here with no callers anywhere in the
     app - code that never ran, described in a commit message as a working
     safety property. It is removed rather than left to imply something false.
     The decision it encoded is kept and still correct: when caching is built it
     must use its own IndexedDB database (MEDIA_DB below), never the progress
     one, so evicting or corrupting media cannot reach anyone's progress.
     Until there are recordings there is nothing to cache. */

  function ids() { return Object.keys(manifest().clips || {}); }
  function count() { return ids().length; }

  window.Audio2 = {
    has: has, url: url, play: play, stop: stop, button: button,
    isStale: isStale, mismatched: mismatched, playable: playable,
    clip: clip, ids: ids, count: count, nowPlaying: nowPlaying,
    isApproved: isApproved, MEDIA_DB: MEDIA_DB
  };
})();
