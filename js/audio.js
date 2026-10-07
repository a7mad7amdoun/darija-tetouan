/* ---------------------------------------------------------------------------
   AUDIO  —  playback of real recordings, and an honest gap where there are none.

   Rules this enforces, not just documents:
     * a clip is only ever played for the content id it was recorded for
     * nothing is synthesised, and nothing is substituted
     * a missing clip is shown as missing, never silently skipped
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

  function playable(id, card) {
    return has(id) && !isStale(id, card) && !mismatched(id, card);
  }

  function stop() {
    if (el) { try { el.pause(); } catch (e) {} }
    playingId = null;
  }

  function play(id, card) {
    if (!playable(id, card)) return Promise.reject(new Error('no approved recording'));
    stop();
    if (!el) { el = document.createElement('audio'); el.preload = 'none'; }
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
  function button(id, card, opts) {
    opts = opts || {};
    var label = opts.label || 'Hear it';
    if (!has(id)) {
      return '<span class="audio none" title="No recording yet — this is waiting on the teacher">' +
             '<span class="aico">♪</span>not recorded yet</span>';
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

  /* ---- offline cache, in its own database ---- */
  function openMedia() {
    return new Promise(function (resolve, reject) {
      if (!window.indexedDB) { reject(new Error('IndexedDB unavailable')); return; }
      var req = indexedDB.open(MEDIA_DB, 1);
      req.onupgradeneeded = function (e) {
        var db = e.target.result;
        if (!db.objectStoreNames.contains('clips')) db.createObjectStore('clips');
      };
      req.onsuccess = function () { resolve(req.result); };
      req.onerror = function () { reject(req.error); };
    });
  }

  function cacheOne(id) {
    var u = url(id);
    if (!u) return Promise.reject(new Error('no clip'));
    return fetch(u).then(function (r) {
      if (!r.ok) throw new Error('could not fetch ' + u);
      return r.blob();
    }).then(function (blob) {
      return openMedia().then(function (db) {
        return new Promise(function (resolve, reject) {
          var t = db.transaction('clips', 'readwrite');
          var rq = t.objectStore('clips').put(blob, id);
          rq.onsuccess = function () { resolve(true); };
          rq.onerror = function () { reject(rq.error); };
        });
      });
    });
  }

  function cached(id) {
    return openMedia().then(function (db) {
      return new Promise(function (resolve) {
        var t = db.transaction('clips', 'readonly');
        var rq = t.objectStore('clips').get(id);
        rq.onsuccess = function () { resolve(rq.result || null); };
        rq.onerror = function () { resolve(null); };
      });
    }).catch(function () { return null; });
  }

  function ids() { return Object.keys(manifest().clips || {}); }
  function count() { return ids().length; }

  window.Audio2 = {
    has: has, url: url, play: play, stop: stop, button: button,
    isStale: isStale, mismatched: mismatched, playable: playable,
    clip: clip, ids: ids, count: count, nowPlaying: nowPlaying,
    cacheOne: cacheOne, cached: cached, MEDIA_DB: MEDIA_DB
  };
})();
