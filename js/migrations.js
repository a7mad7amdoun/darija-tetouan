/* ---------------------------------------------------------------------------
   MIGRATIONS

   Two separate jobs live here:

     1. LEGACY IMPORT     the old localStorage key 'darija.tetouan.v1' into a
                          profile document. Includes the index -> stable id
                          conversion, using the FROZEN manifest in
                          js/legacy-manifest.js. Never guesses.
     2. SCHEMA MIGRATION  an ordered chain of transformations between schema
                          versions.

   Both are EXPLICIT. Nothing here runs on its own. The app detects that
   migration is needed, shows a gate, and waits for the person to press the
   button. Then, in this order, every time:

       back up  ->  clone  ->  migrate the clone  ->  validate  ->  swap in

   If any step fails the original is left exactly as it was.
   --------------------------------------------------------------------------- */
(function () {
  var TARGET = 2;   /* keep in step with Storage.SCHEMA_VERSION */

  /* ======================= index -> stable id ======================= */

  /* One legacy key in, one new key out — or a refusal.
     Returns { ok:true, key } or { ok:false, reason } */
  function remapLegacyKey(key) {
    var L = window.DARIJA.legacy;
    var m;

    /* chk:<course>:w<week>:<index> */
    if ((m = /^chk:([^:]+):w([^:]+):(\d+)$/.exec(key))) {
      var short = L.courseShort[m[1]] || m[1];
      var table = L.checks[short + ':w' + m[2]];
      if (!table) return { ok: false, reason: 'no frozen check table for ' + short + ':w' + m[2] };
      var id = table[+m[3]];
      if (!id) return { ok: false, reason: 'index ' + m[3] + ' is outside the frozen table for ' + short + ':w' + m[2] };
      return { ok: true, key: 'chk:' + m[1] + ':w' + m[2] + ':' + id };
    }

    /* cp:<course>:<index> */
    if ((m = /^cp:([^:]+):(\d+)$/.exec(key))) {
      var t2 = L.checkpoints[m[1]];
      if (!t2) return { ok: false, reason: 'no frozen checkpoint table for ' + m[1] };
      var id2 = t2[+m[2]];
      if (!id2) return { ok: false, reason: 'index ' + m[2] + ' is outside the frozen checkpoint table for ' + m[1] };
      return { ok: true, key: 'cp:' + m[1] + ':' + id2 };
    }

    /* spoken:<examId>:<index>  — examId may itself contain colons (m:month2) */
    if ((m = /^spoken:(.+):(\d+)$/.exec(key))) {
      var exam = m[1], idx = +m[2], id3 = null;
      if (exam === 'six') {
        id3 = (L.spoken.six || [])[idx];
      } else {
        var mm = /^m:(.+)$/.exec(exam);
        if (mm && L.checkpoints[mm[1]]) id3 = L.checkpoints[mm[1]][idx];
      }
      if (!id3) return { ok: false, reason: 'cannot map spoken index ' + idx + " for exam '" + exam + "'" };
      return { ok: true, key: 'spoken:' + exam + ':' + id3 };
    }

    return { ok: true, key: key };   /* not index-based; passes through */
  }

  /* ======================= legacy localStorage ======================= */

  var LEGACY_KEY = 'darija.tetouan.v1';

  function readLegacy() {
    try {
      var raw = localStorage.getItem(LEGACY_KEY);
      if (!raw) return null;
      var o = JSON.parse(raw);
      return (o && typeof o === 'object') ? o : null;
    } catch (e) { return null; }
  }
  function legacyPresent() {
    var o = readLegacy();
    return !!(o && Object.keys(o).length);
  }

  /* A dry run. Reports exactly what would happen and refuses nothing yet. */
  function previewLegacy() {
    var src = readLegacy();
    if (!src) return { present: false };
    var moved = [], unchanged = [], failed = [], localOnly = [], shared = [];
    Object.keys(src).forEach(function (k) {
      if (window.Storage && Storage.isLocalOnly(k)) { localOnly.push(k); return; }
      var r = remapLegacyKey(k);
      if (!r.ok) { failed.push({ key: k, reason: r.reason }); return; }
      if (r.key !== k) moved.push({ from: k, to: r.key });
      else unchanged.push(k);
      if (window.Storage && Storage.isShared(k)) shared.push(k);
    });
    return {
      present: true,
      total: Object.keys(src).length,
      moved: moved, unchanged: unchanged, failed: failed,
      localOnly: localOnly, sharedCount: shared.length,
      safe: failed.length === 0
    };
  }

  /* The real thing. Refuses outright if any key cannot be mapped. */
  function migrateLegacy(profileId) {
    var src = readLegacy();
    if (!src) return Promise.reject(new Error('no legacy data found'));

    var pv = previewLegacy();
    if (!pv.safe) {
      return Promise.reject(new Error(
        'Refusing to migrate: ' + pv.failed.length + ' key(s) cannot be mapped to a stable id.\n' +
        pv.failed.slice(0, 8).map(function (f) { return '  ' + f.key + ' — ' + f.reason; }).join('\n') +
        '\nYour legacy data has not been touched.'
      ));
    }

    return backup('before-legacy-migration').then(function () {
      var mine = {}, shared = {}, local = {};
      Object.keys(src).forEach(function (k) {
        var v = src[k];
        if (Storage.isLocalOnly(k)) { local[k] = v; return; }
        var nk = remapLegacyKey(k).key;
        /* exam and test results become append-only records with ids */
        if (/^(exam|testres):/.test(nk) && Array.isArray(v)) {
          v = v.map(function (r) {
            return r && r.id ? r : Object.assign({}, r, { id: DB.uuid() });
          });
        }
        (Storage.isShared(k) ? shared : mine)[nk] = v;
      });

      var doc = Storage.emptyDoc(profileId);
      doc.entries = mine;
      var sh = Storage.emptyDoc(Storage.SHARED_ID);
      sh.entries = shared;

      /* validate the clone before anything is written */
      var e1 = Validate.progress(doc, { manifest: true });
      var hard = e1.filter(function (x) { return !/refers to unknown/.test(x.message); });
      if (hard.length) {
        return Promise.reject(new Error(
          'Migration produced invalid data and was abandoned. Nothing was changed.\n' +
          Validate.describe(hard)));
      }

      return Promise.all([
        DB.put('state', profileId, doc),
        DB.put('shared', Storage.SHARED_ID, sh),
        DB.put('meta', 'legacyArchive', {
          archivedAt: new Date().toISOString(),
          note: 'Verbatim copy of localStorage ' + LEGACY_KEY + ' as it was before migration. ' +
                'The original key is left in place until you clear it explicitly.',
          data: src
        })
      ]).then(function () {
        return {
          migrated: pv.moved.length + pv.unchanged.length,
          remapped: pv.moved.length,
          softWarnings: e1.length - hard.length,
          localOnly: Object.keys(local)
        };
      });
    });
  }

  /* Only ever called when the person explicitly asks. */
  function clearLegacy() {
    try { localStorage.removeItem(LEGACY_KEY); return true; } catch (e) { return false; }
  }

  /* ======================= schema migrations ======================= */

  /* Each takes a document and returns the next one. One logical change each.
     Each sets its own schemaVersion. None discards data. */
  var migrations = {
    1: function v1_to_v2(doc) {
      var next = JSON.parse(JSON.stringify(doc));
      var entries = {}, failed = [];
      Object.keys(next.entries || {}).forEach(function (k) {
        var r = remapLegacyKey(k);
        if (!r.ok) { failed.push({ key: k, reason: r.reason }); return; }
        var v = next.entries[k];
        if (/^(exam|testres):/.test(r.key) && Array.isArray(v)) {
          v = v.map(function (x) { return x && x.id ? x : Object.assign({}, x, { id: DB.uuid() }); });
        }
        entries[r.key] = v;
      });
      if (failed.length) {
        var err = new Error('v1→v2 cannot map ' + failed.length + ' key(s) to stable ids');
        err.unmapped = failed;
        throw err;
      }
      next.entries = entries;
      next.schemaVersion = 2;
      return next;
    }
  };

  function migrateState(doc, target) {
    target = target || TARGET;
    var v = doc.schemaVersion;
    var out = doc;
    var applied = [];
    while (v < target) {
      var step = migrations[v];
      if (!step) throw new Error('No migration registered from schema v' + v + ' to v' + (v + 1));
      out = step(out);
      if (out.schemaVersion <= v) throw new Error('Migration from v' + v + ' did not advance schemaVersion');
      applied.push('v' + v + '→v' + out.schemaVersion);
      v = out.schemaVersion;
    }
    if (v > target) throw new Error('Saved data is NEWER (v' + v + ') than this app expects (v' + target + '). Refusing to downgrade.');
    return { doc: out, applied: applied };
  }

  /* backup -> clone -> migrate -> validate -> swap, for one profile */
  function runMigration(profileId) {
    return DB.get('state', profileId).then(function (doc) {
      if (!doc) throw new Error('nothing stored for that profile');
      if (doc.schemaVersion === TARGET) return { alreadyCurrent: true };
      return backup('before-schema-migration').then(function (backupId) {
        var clone = JSON.parse(JSON.stringify(doc));      /* never mutate the original */
        var result = migrateState(clone, TARGET);          /* throws on any problem */
        var errs = Validate.progress(result.doc, { manifest: true })
                     .filter(function (x) { return !/refers to unknown/.test(x.message); });
        if (errs.length) throw new Error('Migrated data failed validation; original left untouched.\n' + Validate.describe(errs));
        return DB.put('state', profileId, result.doc).then(function () {
          return { applied: result.applied, backupId: backupId, from: doc.schemaVersion, to: result.doc.schemaVersion };
        });
      });
    });
  }

  /* what the gate needs to know, without changing anything */
  function inspect(profileId) {
    return Promise.all([DB.get('state', profileId), Promise.resolve(legacyPresent())])
      .then(function (r) {
        var doc = r[0], legacy = r[1];
        return {
          hasDoc: !!doc,
          savedVersion: doc ? doc.schemaVersion : null,
          appVersion: TARGET,
          needsSchemaMigration: !!(doc && doc.schemaVersion !== TARGET),
          legacyPresent: legacy,
          legacyPreview: legacy ? previewLegacy() : null
        };
      });
  }

  /* ======================= backups ======================= */
  function backup(reason) {
    var id = 'backup:' + new Date().toISOString().replace(/[:.]/g, '-') + ':' + (reason || 'manual');
    return Promise.all([DB.values('state'), DB.get('shared', Storage.SHARED_ID), DB.get('meta', 'profiles')])
      .then(function (r) {
        return DB.put('meta', id, {
          id: id, reason: reason, createdAt: new Date().toISOString(),
          state: r[0] || [], shared: r[1] || null, profiles: r[2] || {},
          legacy: readLegacy()
        });
      }).then(function () { return id; });
  }
  function listBackups() {
    return DB.keys('meta').then(function (ks) {
      return (ks || []).filter(function (k) { return /^backup:/.test(k); }).sort().reverse();
    });
  }

  window.Migrations = {
    TARGET: TARGET,
    remapLegacyKey: remapLegacyKey,
    legacyPresent: legacyPresent, previewLegacy: previewLegacy,
    migrateLegacy: migrateLegacy, clearLegacy: clearLegacy,
    migrateState: migrateState, runMigration: runMigration, inspect: inspect,
    backup: backup, listBackups: listBackups,
    registry: migrations
  };
})();
