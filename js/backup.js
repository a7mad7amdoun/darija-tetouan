/* ---------------------------------------------------------------------------
   BACKUP  —  export and import.

   Import never overwrites first and asks later. The order is always:

     parse -> validate structure -> validate versions -> validate ids ->
     PREVIEW what would change -> back up what is there now -> confirm ->
     apply -> validate -> save

   A student cannot import into another person's account. The check is here for
   the sake of a clear message; Row Level Security is what actually enforces it.
   --------------------------------------------------------------------------- */
(function () {

  function exportBackup() {
    var prof = window.Auth && Auth.currentProfile();
    var doc = Storage.currentDoc();
    var shared = Storage.currentShared();
    var payload = {
      kind: 'darija-tetouan-backup',
      formatVersion: 1,
      schemaVersion: Storage.SCHEMA_VERSION,
      contentVersion: Storage.CONTENT_VERSION,
      exportedAt: new Date().toISOString(),
      exportedBy: prof ? { id: prof.id, name: prof.name, role: prof.role } : null,
      profiles: {},
      progress: {},
      shared: shared ? shared.entries : {},
      local: {}
    };
    if (prof) payload.profiles[prof.id] = { id: prof.id, name: prof.name, role: prof.role };
    if (doc)  payload.progress[doc.profileId] = doc.entries;
    ['theme', 'role', 'learner'].forEach(function (k) {
      var v = Store.get(k, null); if (v !== null) payload.local[k] = v;
    });
    return payload;
  }

  function filename() {
    var prof = window.Auth && Auth.currentProfile();
    var who = prof ? String(prof.name).toLowerCase().replace(/\W+/g, '-') : 'device';
    return 'darija-tetouan-' + who + '-' + new Date().toISOString().slice(0, 10) + '.json';
  }

  function download() {
    var json = JSON.stringify(exportBackup(), null, 2);
    var blob = new Blob([json], { type: 'application/json' });
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url; a.download = filename();
    document.body.appendChild(a); a.click();
    setTimeout(function () { URL.revokeObjectURL(url); a.remove(); }, 1000);
    return filename();
  }

  /* ---------------- import: inspect first ---------------- */
  function inspect(text) {
    var parsed;
    try { parsed = JSON.parse(text); }
    catch (e) { return { ok: false, errors: [{ path: '', message: 'Not valid JSON: ' + e.message }] }; }

    var errs = Validate.backup(parsed);
    if (errs.length) return { ok: false, errors: errs, parsed: parsed };

    if (parsed.schemaVersion > Storage.SCHEMA_VERSION) {
      return { ok: false, parsed: parsed, errors: [{ path: 'schemaVersion',
        message: 'This backup is from a NEWER version of the app (v' + parsed.schemaVersion +
                 ' vs v' + Storage.SCHEMA_VERSION + '). Update the app before importing it.' }] };
    }

    var prof = window.Auth && Auth.currentProfile();
    /* the account the data is actually loaded under is the authority here;
       the auth profile is only a fallback for the message text */
    var targetId = Storage.activeProfileId() || (prof ? prof.id : 'local');
    var backupProfileIds = Object.keys(parsed.progress || {});
    var foreign = backupProfileIds.filter(function (id) { return id !== targetId; });
    var isTeacher = !!(prof && prof.role === 'teacher');

    if (foreign.length && !isTeacher) {
      return { ok: false, parsed: parsed, errors: [{ path: 'progress',
        message: 'This backup belongs to a different account (' + foreign.join(', ') +
                 '). Only the teacher can restore another person’s data.' }] };
    }

    /* what would actually change */
    var incoming = parsed.progress[targetId] || (isTeacher && foreign.length ? parsed.progress[foreign[0]] : {}) || {};
    var current = (Storage.currentDoc() || { entries: {} }).entries;
    var added = [], changed = [], removed = [], same = 0;
    Object.keys(incoming).forEach(function (k) {
      if (!(k in current)) added.push(k);
      else if (JSON.stringify(current[k]) !== JSON.stringify(incoming[k])) changed.push(k);
      else same++;
    });
    Object.keys(current).forEach(function (k) { if (!(k in incoming)) removed.push(k); });

    var unknown = Validate.unknownReferences({ entries: incoming });

    /* schema older than the app: it can be imported, but only through the
       migration path, not by dropping it straight in */
    var needsMigration = parsed.schemaVersion < Storage.SCHEMA_VERSION;

    return {
      ok: true, parsed: parsed, targetId: targetId,
      needsMigration: needsMigration,
      counts: { added: added.length, changed: changed.length, removed: removed.length, same: same },
      added: added.slice(0, 20), changed: changed.slice(0, 20), removed: removed.slice(0, 20),
      unknown: unknown,
      sharedKeys: Object.keys(parsed.shared || {}).length,
      restoresTeacherData: isTeacher && Object.keys(parsed.shared || {}).length > 0
    };
  }

  /* ---------------- import: apply, only after confirmation ---------------- */
  function apply(preview, opts) {
    opts = opts || {};
    if (!preview || !preview.ok) return Promise.reject(new Error('nothing valid to import'));

    return Migrations.backup('before-import').then(function (backupId) {
      var parsed = preview.parsed;
      var incoming = parsed.progress[preview.targetId] ||
                     parsed.progress[Object.keys(parsed.progress)[0]] || {};

      var doc = Storage.emptyDoc(preview.targetId);
      doc.entries = JSON.parse(JSON.stringify(incoming));
      doc.schemaVersion = parsed.schemaVersion;
      doc.contentVersion = parsed.contentVersion;

      /* an older backup goes through the same explicit migration chain */
      if (preview.needsMigration) {
        var r = Migrations.migrateState(doc, Storage.SCHEMA_VERSION);
        doc = r.doc;
      }

      var errs = Validate.progress(doc, { manifest: true })
                   .filter(function (x) { return !/refers to unknown/.test(x.message); });
      if (errs.length) {
        throw new Error('The imported data failed validation and was not applied. ' +
                        'Nothing changed.\n' + Validate.describe(errs));
      }

      var jobs = [DB.put('state', preview.targetId, doc)];
      if (opts.includeShared && parsed.shared && Object.keys(parsed.shared).length) {
        var sh = Storage.emptyDoc(Storage.SHARED_ID);
        sh.entries = JSON.parse(JSON.stringify(parsed.shared));
        jobs.push(DB.put('shared', Storage.SHARED_ID, sh));
      }
      return Promise.all(jobs).then(function () {
        return Storage.load(preview.targetId).then(function () {
          return { backupId: backupId, entries: Object.keys(doc.entries).length,
                   migrated: !!preview.needsMigration };
        });
      });
    });
  }

  function restoreBackup(backupId) {
    return DB.get('meta', backupId).then(function (b) {
      if (!b) throw new Error('backup not found');
      return Migrations.backup('before-restore').then(function () {
        var jobs = (b.state || []).map(function (d) { return DB.put('state', d.profileId, d); });
        if (b.shared) jobs.push(DB.put('shared', Storage.SHARED_ID, b.shared));
        if (b.profiles) jobs.push(DB.put('meta', 'profiles', b.profiles));
        return Promise.all(jobs);
      });
    });
  }

  window.Backup = {
    exportBackup: exportBackup, download: download, filename: filename,
    inspect: inspect, apply: apply, restoreBackup: restoreBackup
  };
})();
