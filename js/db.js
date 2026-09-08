/* ---------------------------------------------------------------------------
   IndexedDB — a small promise wrapper. No dependencies, no build step.

   Object stores:
     state    one record per profile, holding that profile's whole progress
              document. key: profileId
     shared   teacher/shared documents. key: docId
     outbox   pending mutations awaiting sync. key: changeId (uuid)
     meta     app-level singletons: active profile, last sync, backups
   --------------------------------------------------------------------------- */
(function () {
  /* selftest.html sets DARIJA_DB_NAME so the test suite runs against a
     throwaway database and can never touch anyone's real progress. */
  var DB_NAME = window.DARIJA_DB_NAME || 'darija-tetouan';
  var DB_VERSION = 1;
  var STORES = ['state', 'shared', 'outbox', 'meta'];
  var dbp = null;

  function open() {
    if (dbp) return dbp;
    dbp = new Promise(function (resolve, reject) {
      if (!window.indexedDB) { reject(new Error('IndexedDB unavailable')); return; }
      var req = indexedDB.open(DB_NAME, DB_VERSION);
      req.onupgradeneeded = function (e) {
        var db = e.target.result;
        STORES.forEach(function (s) {
          if (!db.objectStoreNames.contains(s)) db.createObjectStore(s);
        });
        /* outbox is read in insertion order and filtered by sync status */
        var tx = e.target.transaction;
        var ob = tx.objectStore('outbox');
        if (!ob.indexNames.contains('by_status')) ob.createIndex('by_status', 'status');
        if (!ob.indexNames.contains('by_profile')) ob.createIndex('by_profile', 'profileId');
      };
      req.onsuccess = function () { resolve(req.result); };
      req.onerror = function () { reject(req.error); };
    });
    return dbp;
  }

  /* An IndexedDB transaction is only active for the task in which it was
     created. Returning the object store through a promise and using it in a
     later microtask throws TransactionInactiveError — so the request must be
     issued in the SAME synchronous block as the transaction. */
  function op(store, mode, fn) {
    return open().then(function (db) {
      return new Promise(function (resolve, reject) {
        var t, s;
        try {
          t = db.transaction(store, mode);
          s = t.objectStore(store);
        } catch (e) { reject(e); return; }
        var req;
        try { req = fn(s); } catch (e) { reject(e); return; }
        req.onsuccess = function () { resolve(req.result); };
        req.onerror   = function () { reject(req.error); };
        t.onabort     = function () { reject(t.error || new Error('transaction aborted')); };
      });
    });
  }

  function get(store, key)        { return op(store, 'readonly',  function (s) { return s.get(key); }); }
  function put(store, key, value) { return op(store, 'readwrite', function (s) { return s.put(value, key); }); }
  function del(store, key)        { return op(store, 'readwrite', function (s) { return s.delete(key); }); }
  function keys(store)            { return op(store, 'readonly',  function (s) { return s.getAllKeys(); }); }
  function values(store)          { return op(store, 'readonly',  function (s) { return s.getAll(); }); }
  function clear(store)           { return op(store, 'readwrite', function (s) { return s.clear(); }); }

  /* uuid without a dependency; falls back where crypto.randomUUID is absent */
  function uuid() {
    if (window.crypto && crypto.randomUUID) return crypto.randomUUID();
    if (window.crypto && crypto.getRandomValues) {
      var b = crypto.getRandomValues(new Uint8Array(16));
      b[6] = (b[6] & 0x0f) | 0x40; b[8] = (b[8] & 0x3f) | 0x80;
      var h = [].map.call(b, function (x) { return ('0' + x.toString(16)).slice(-2); }).join('');
      return [h.slice(0,8), h.slice(8,12), h.slice(12,16), h.slice(16,20), h.slice(20)].join('-');
    }
    return 'uuid-' + Date.now() + '-' + Math.random().toString(16).slice(2, 10);
  }

  function available() { return !!window.indexedDB; }

  window.DB = {
    open: open, get: get, put: put, del: del,
    keys: keys, values: values, clear: clear,
    uuid: uuid, available: available, NAME: DB_NAME
  };
})();
