/* ---------------------------------------------------------------------------
   Store — the synchronous facade the UI talks to.

   The UI calls Store.get / Store.set in about sixty places and expects an
   immediate answer. So Storage hydrates the active profile into memory before
   the first render, Store reads and writes that in-memory document, and
   Storage persists asynchronously to IndexedDB and appends to the sync outbox.

   Nothing in the UI had to change for this, with one deliberate exception:
   the three key builders that used to take an array INDEX now take a stable
   content id. Those call sites were updated. See js/legacy-manifest.js for
   why the change was necessary and how old data is carried across.

   If IndexedDB is unavailable (a locked-down browser, a private window that
   blocks it) Store falls back to the old single-localStorage-key behaviour so
   the app still runs. That fallback is read-write but does not sync.
   --------------------------------------------------------------------------- */
(function () {
  var FALLBACK_KEY = 'darija.tetouan.fallback';
  var fallback = null;          /* used only when Storage is unavailable */

  function usingStorage() {
    return !!(window.Storage && Storage.snapshot().ready);
  }

  function loadFallback() {
    if (fallback) return fallback;
    try { fallback = JSON.parse(localStorage.getItem(FALLBACK_KEY) || '{}') || {}; }
    catch (e) { fallback = {}; }
    return fallback;
  }
  function saveFallback() {
    try { localStorage.setItem(FALLBACK_KEY, JSON.stringify(loadFallback())); } catch (e) {}
  }

  window.Store = {
    get: function (key, dflt) {
      if (usingStorage()) return Storage.get(key, dflt);
      var d = loadFallback();
      return Object.prototype.hasOwnProperty.call(d, key) ? d[key] : dflt;
    },

    set: function (key, value) {
      if (usingStorage()) return Storage.set(key, value);
      loadFallback()[key] = value; saveFallback(); return value;
    },

    toggle: function (key) {
      var next = !this.get(key, false);
      this.set(key, next);
      return next;
    },

    countTrue: function (prefix) {
      var d = usingStorage() ? Storage.all() : loadFallback(), n = 0;
      for (var k in d) if (k.indexOf(prefix) === 0 && d[k] === true) n++;
      return n;
    },

    all: function () { return usingStorage() ? Storage.all() : loadFallback(); },

    reset: function () {
      if (usingStorage()) return Storage.reset();
      fallback = {}; saveFallback();
      return Promise.resolve();
    },

    replaceAll: function (obj) {
      if (usingStorage()) return Storage.replaceAll(obj);
      fallback = obj || {}; saveFallback();
      return Promise.resolve();
    },

    /* ---- key builders. Content identity only; never an array index. ---- */
    kDay:      function (c, w, d)  { return 'day:' + c + ':w' + w + ':d' + d; },
    kCheck:    function (c, w, id) { return 'chk:' + c + ':w' + w + ':' + id; },
    kRate:     function (c, w)     { return 'rate:' + c + ':w' + w; },
    kTask:     function (c, id)    { return 'cp:' + c + ':' + id; },
    kSpoken:   function (examId, id) { return 'spoken:' + examId + ':' + id; },
    kCpStatus: function (c)        { return 'cpstatus:' + c; },
    kNote:     function (c, w)     { return 'note:' + c + ':w' + w; },
    kKnown:    function (id)       { return 'known:' + id; },
    kRole:     'role',

    /* true when running without IndexedDB, so the UI can say so */
    isFallback: function () { return !usingStorage(); }
  };
})();
