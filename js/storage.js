/* ---------------------------------------------------------------------------
   STORAGE  —  the new persistence layer.

   Shape of what is stored
   -----------------------
   IndexedDB 'state'   one document per profile:
       { schemaVersion, contentVersion, profileId, entries: { key: value },
         updatedAt }
   IndexedDB 'shared'  teacher/shared documents, same shape, profileId '_shared'
   IndexedDB 'meta'    { activeProfileId }, sync bookkeeping, backups

   Why a document per profile rather than a row per item
   -----------------------------------------------------
   Three users and a few thousand entries. A document read is one call, the
   whole thing fits in memory, and the existing synchronous UI keeps working
   unchanged. The SERVER model is normalised (see supabase/schema.sql); the
   local model is a cache of it. Those are allowed to differ.

   Store, the synchronous facade
   -----------------------------
   The existing UI calls Store.get / Store.set ~64 times and expects them to
   be synchronous. So Storage hydrates the active profile into memory at boot,
   Store reads and writes that, and every write is persisted asynchronously
   plus appended to the outbox for sync. Nothing in the UI had to change.
   --------------------------------------------------------------------------- */
(function () {
  var SCHEMA_VERSION  = 2;   /* structure of stored data */
  var CONTENT_VERSION = 1;   /* version of the curriculum content */
  var SHARED_ID = '_shared';

  /* which keys are shared teacher data rather than a student's own progress */
  /* 'obs:' is the teacher's private, per-student assessment of one card. It is
     shared data - it belongs to the teacher, not to the student being assessed -
     and the server does NOT mark it student-visible, so neither student can read
     what is written about them or about each other. See
     shared_is_student_visible() in supabase/schema.sql; that policy, not this
     regex, is what enforces it. */
  var SHARED_PREFIX = /^(note:|cardnote:|flagres:|vans:|vst:|obs:|target:|feedback$|fbSeq$|customCards$|customSeq$|sessions$)/;
  /* which keys are per-device preference, not progress, and never sync */
  var LOCAL_ONLY = /^(theme|role|learner)$/;

  var state = {
    profileId: null,
    doc: null,        /* active profile's progress document */
    shared: null,     /* shared teacher document */
    local: {},        /* per-device preferences, kept in localStorage */
    ready: false,
    dirty: false,
    /* When the teacher is looking at a student, this holds a READ-ONLY copy of
       that student's progress, fetched from the server. It is never persisted
       into the 'state' store and never written to, so looking at someone's work
       cannot alter it - not theirs, and not the teacher's own. */
    viewing: null
  };

  var LOCAL_PREF_KEY = 'darija.tetouan.local';
  var listeners = [];

  function emptyDoc(profileId) {
    return {
      schemaVersion: SCHEMA_VERSION,
      contentVersion: CONTENT_VERSION,
      profileId: profileId,
      entries: {},
      /* When each key was last written on THIS device, key -> ISO timestamp.
         A sibling of entries rather than a change to them, so every existing
         document stays valid and no migration has to touch anyone's progress.
         A document written before this existed simply has no 'at' map, and the
         merge falls back to the old whole-document comparison for those keys -
         the previous behaviour, not a worse one. */
      at: {},
      updatedAt: new Date().toISOString()
    };
  }

  function loadLocalPrefs() {
    try { state.local = JSON.parse(localStorage.getItem(LOCAL_PREF_KEY) || '{}') || {}; }
    catch (e) { state.local = {}; }
  }
  function saveLocalPrefs() {
    try { localStorage.setItem(LOCAL_PREF_KEY, JSON.stringify(state.local)); } catch (e) {}
  }

  /* ---------------- profiles ---------------- */
  function profiles() {
    return DB.get('meta', 'profiles').then(function (p) { return p || {}; });
  }
  function putProfile(profile) {
    var errs = Validate.profile(profile);
    if (errs.length) return Promise.reject(new Error('invalid profile: ' + Validate.describe(errs)));
    return profiles().then(function (all) {
      all[profile.id] = profile;
      return DB.put('meta', 'profiles', all).then(function () { return profile; });
    });
  }
  function activeProfileId() { return state.profileId; }

  /* ---------------- loading a profile in ---------------- */
  function load(profileId) {
    return Promise.all([
      DB.get('state', profileId),
      DB.get('shared', SHARED_ID)
    ]).then(function (r) {
      var doc = r[0], shared = r[1];

      /* A document at an older schema is NOT touched here. Migration is
         explicit and user-triggered — see migrations.js. */
      if (doc && doc.schemaVersion !== SCHEMA_VERSION) {
        state.ready = false;
        return { needsMigration: true, found: doc.schemaVersion, expected: SCHEMA_VERSION };
      }
      state.profileId = profileId;
      state.doc = doc || emptyDoc(profileId);
      state.shared = shared || emptyDoc(SHARED_ID);
      state.ready = true;
      loadLocalPrefs();
      notify();
      return { needsMigration: false };
    });
  }

  function unload() {
    /* logout must not leave the previous person's progress in memory */
    state.viewing = null;
    state.profileId = null;
    state.doc = null;
    state.shared = null;
    state.ready = false;
    notify();
  }

  /* ---------------- reading and writing ---------------- */
  function docFor(key) {
    if (LOCAL_ONLY.test(key)) return null;              /* handled separately */
    if (SHARED_PREFIX.test(key)) return state.shared;   /* teacher data, always their own */
    return state.viewing ? state.viewing : state.doc;
  }

  function get(key, fallback) {
    if (LOCAL_ONLY.test(key)) {
      return Object.prototype.hasOwnProperty.call(state.local, key) ? state.local[key] : fallback;
    }
    var d = docFor(key);
    if (!d) return fallback;
    return Object.prototype.hasOwnProperty.call(d.entries, key) ? d.entries[key] : fallback;
  }

  function set(key, value) {
    if (LOCAL_ONLY.test(key)) { state.local[key] = value; saveLocalPrefs(); return value; }
    var d = docFor(key);
    if (!d) return value;
    /* Looking at a student is looking, not editing. Refuse rather than write
       into a copy that would be thrown away, or worse, into the wrong person. */
    if (d === state.viewing) return d.entries[key];
    /* A SNAPSHOT, not the live value. Several callers read a stored array or
       object, mutate it in place and then write it back - Tests.record and
       Exams.record both push onto the array they were handed. Capturing the
       live reference here meant the sync layer compared the new value with
       itself, found no change and dropped it, so only the FIRST test result and
       the FIRST exam result ever left the device. Fixing this once here is
       worth more than fixing each getter, because the next one will do it too. */
    var live = d.entries[key];
    var before = (live && typeof live === 'object')
      ? JSON.parse(JSON.stringify(live)) : live;
    var now = new Date().toISOString();
    d.entries[key] = value;
    if (!d.at) d.at = {};
    d.at[key] = now;
    d.updatedAt = now;
    state.dirty = true;
    schedulePersist();
    if (window.Sync) Sync.record({
      profileId: d === state.shared ? SHARED_ID : state.profileId,
      key: key, before: before, value: value
    });
    return value;
  }

  function all() {
    /* a merged read-only view, as the old flat map looked */
    var out = {};
    if (state.shared) Object.keys(state.shared.entries).forEach(function (k) { out[k] = state.shared.entries[k]; });
    var progress = state.viewing || state.doc;
    if (progress) Object.keys(progress.entries).forEach(function (k) { out[k] = progress.entries[k]; });
    Object.keys(state.local).forEach(function (k) { out[k] = state.local[k]; });
    return out;
  }

  function reset() {
    if (state.doc) { state.doc.entries = {}; state.doc.at = {}; }
    if (state.shared) { state.shared.entries = {}; state.shared.at = {}; }
    state.dirty = true;
    return persist();
  }

  function replaceAll(entries) {
    /* used by import, after validation and confirmation */
    if (!state.doc) return Promise.reject(new Error('no profile loaded'));
    var mine = {}, shared = {};
    Object.keys(entries || {}).forEach(function (k) {
      if (LOCAL_ONLY.test(k)) return;
      (SHARED_PREFIX.test(k) ? shared : mine)[k] = entries[k];
    });
    state.doc.entries = mine;
    state.shared.entries = shared;
    /* imported wholesale: no per-key history survives, so clear rather than
       leave timestamps pointing at values that are gone */
    state.doc.at = {};
    state.shared.at = {};
    state.dirty = true;
    return persist();
  }

  /* ---------------- persistence ---------------- */
  var persistTimer = null;
  function schedulePersist() {
    if (persistTimer) return;
    persistTimer = setTimeout(function () { persistTimer = null; persist(); }, 250);
  }
  function persist() {
    if (!state.ready) return Promise.resolve();
    var jobs = [];
    if (state.doc)    jobs.push(DB.put('state', state.profileId, state.doc));
    if (state.shared) jobs.push(DB.put('shared', SHARED_ID, state.shared));
    state.dirty = false;
    return Promise.all(jobs).then(function () { notify(); });
  }

  function flush() { if (persistTimer) { clearTimeout(persistTimer); persistTimer = null; } return persist(); }

  /* ---------------- observers ---------------- */
  function onChange(fn) { listeners.push(fn); }
  function notify() { listeners.forEach(function (f) { try { f(snapshot()); } catch (e) {} }); }
  function snapshot() {
    return {
      ready: state.ready,
      profileId: state.profileId,
      dirty: state.dirty,
      schemaVersion: state.doc ? state.doc.schemaVersion : null,
      contentVersion: state.doc ? state.doc.contentVersion : null,
      viewing: state.viewing ? { profileId: state.viewing.profileId, name: state.viewing.name } : null,
      entryCount: state.doc ? Object.keys(state.doc.entries).length : 0,
      sharedCount: state.shared ? Object.keys(state.shared.entries).length : 0
    };
  }

  /* ---------------- looking at someone else's progress (teacher only) ----------
     The fence is the database: read_student returns nothing to a student asking
     about the other student. This is only the local side of that. */
  function viewAs(peer) {
    if (!peer) { state.viewing = null; notify(); return null; }
    state.viewing = {
      profileId: peer.profileId,
      name: peer.name || '',
      at: peer.at || new Date().toISOString(),
      entries: peer.entries || {}
    };
    notify();
    return state.viewing;
  }
  function stopViewing() { return viewAs(null); }
  function viewing() { return state.viewing; }

  /* When was this key last written here? Falls back to the document's own
     timestamp for keys written before per-key tracking existed. */
  function keyTime(doc, key) {
    if (!doc) return null;
    if (doc.at && doc.at[key]) return doc.at[key];
    return doc.updatedAt || null;
  }

  function currentDoc()   { return state.doc; }
  function currentShared(){ return state.shared; }
  function isShared(key)  { return SHARED_PREFIX.test(key); }
  function isLocalOnly(k) { return LOCAL_ONLY.test(k); }

  window.Storage = {
    SCHEMA_VERSION: SCHEMA_VERSION,
    CONTENT_VERSION: CONTENT_VERSION,
    SHARED_ID: SHARED_ID,
    profiles: profiles, putProfile: putProfile, activeProfileId: activeProfileId,
    load: load, unload: unload,
    get: get, set: set, all: all, reset: reset, replaceAll: replaceAll,
    persist: persist, flush: flush, emptyDoc: emptyDoc,
    onChange: onChange, snapshot: snapshot,
    viewAs: viewAs, stopViewing: stopViewing, viewing: viewing, keyTime: keyTime,
    currentDoc: currentDoc, currentShared: currentShared,
    isShared: isShared, isLocalOnly: isLocalOnly
  };
})();
