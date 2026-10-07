/* ---------------------------------------------------------------------------
   VALIDATION

   Invalid data produces an explicit error. Nothing is ever silently repaired,
   because a silent repair is indistinguishable from silent data loss.
   --------------------------------------------------------------------------- */
(function () {
  var ROLES = { student: 1, teacher: 1 };

  function err(list, path, msg) { list.push({ path: path, message: msg }); }

  function isPlain(o) { return o && typeof o === 'object' && !Array.isArray(o); }
  function isInt(n)   { return typeof n === 'number' && isFinite(n) && Math.floor(n) === n; }
  function isDate(s)  { return typeof s === 'string' && /^\d{4}-\d{2}-\d{2}/.test(s); }

  /* ---- a whole progress document for one profile ---- */
  function validateProgress(doc, opts) {
    opts = opts || {};
    var e = [];
    if (!isPlain(doc)) { err(e, '', 'progress must be an object'); return e; }
    if (!isInt(doc.schemaVersion))  err(e, 'schemaVersion', 'must be an integer');
    if (!isInt(doc.contentVersion)) err(e, 'contentVersion', 'must be an integer');
    if (typeof doc.profileId !== 'string' || !doc.profileId)
      err(e, 'profileId', 'must be a non-empty string');
    if (!isPlain(doc.entries)) { err(e, 'entries', 'must be an object'); return e; }

    Object.keys(doc.entries).forEach(function (k) {
      var v = doc.entries[k];
      var p = 'entries.' + k;

      if (/^fam:/.test(k)) {
        if (!isPlain(v)) { err(e, p, 'vocabulary counter must be an object'); return; }
        if (!isInt(v.r) || v.r < 0) err(e, p + '.r', 'right count must be a non-negative integer');
        if (!isInt(v.w) || v.w < 0) err(e, p + '.w', 'wrong count must be a non-negative integer');
        return;
      }
      if (/^(exam|testres):/.test(k)) {
        if (!Array.isArray(v)) { err(e, p, 'results must be an array'); return; }
        v.forEach(function (r, i) {
          var rp = p + '[' + i + ']';
          if (!isPlain(r)) { err(e, rp, 'result must be an object'); return; }
          if (!isInt(r.score) || r.score < 0) err(e, rp + '.score', 'must be a non-negative integer');
          if (!isInt(r.total) || r.total <= 0) err(e, rp + '.total', 'must be a positive integer');
          if (isInt(r.score) && isInt(r.total) && r.score > r.total)
            err(e, rp, 'score exceeds total');
          if (!isDate(r.date)) err(e, rp + '.date', 'must be an ISO date');
          if (!r.id) err(e, rp + '.id', 'result needs a stable id (append-only records)');
        });
        return;
      }
      if (/^att:/.test(k)) {
        if (!Array.isArray(v)) { err(e, p, 'an attempt log must be an array'); return; }
        v.forEach(function (r, i) {
          var rp = p + '[' + i + ']';
          if (!isPlain(r)) { err(e, rp, 'an attempt must be an object'); return; }
          if (!r.id) err(e, rp + '.id', 'an attempt needs a stable id (append-only records)');
          if (!r.at || isNaN(Date.parse(r.at))) err(e, rp + '.at', 'must be an ISO timestamp');
          if (typeof r.ok !== 'boolean') err(e, rp + '.ok', 'must be a boolean');
          if (!r.task) err(e, rp + '.task', 'must say how it was asked');
        });
        return;
      }
      if (/^sched:/.test(k)) {
        if (!isPlain(v)) { err(e, p, 'a schedule entry must be an object'); return; }
        if (!/^\d{4}-\d{2}-\d{2}$/.test(v.d || '')) err(e, p + '.d', 'due date must be YYYY-MM-DD');
        if (!isInt(v.i) || v.i < 0) err(e, p + '.i', 'interval must be a non-negative integer');
        if (!isInt(v.e) || v.e < 100 || v.e > 400) err(e, p + '.e', 'ease must be between 100 and 400');
        if (!isInt(v.n) || v.n < 0) err(e, p + '.n', 'reps must be a non-negative integer');
        return;
      }
      if (/^sitlevel:/.test(k)) {
        if (!isInt(v) || v < 0 || v > 6) err(e, p, 'situation level must be 0-6');
        return;
      }
      if (/^rate:/.test(k)) {
        if (!isInt(v) || v < 0 || v > 5) err(e, p, 'rating must be 0-5');
        return;
      }
      if (/^(day|chk|cp|spoken|sitdone|known|seen|did):/.test(k)) {
        if (typeof v !== 'boolean') err(e, p, 'must be a boolean');
        return;
      }
      if (/^cpstatus:/.test(k)) {
        if (v !== '' && v !== 'passed' && v !== 'retry')
          err(e, p, "must be '', 'passed' or 'retry'");
        return;
      }
    });

    /* every content reference must point at something we know about */
    if (opts.manifest !== false && window.Manifest) {
      unknownReferences(doc).forEach(function (u) {
        err(e, 'entries.' + u.key, 'refers to unknown ' + u.kind + " '" + u.id + "'");
      });
    }
    return e;
  }

  /* Progress keys whose content id the manifest does not recognise. Reported,
     never deleted — an unknown id may be retired content we must keep. */
  function unknownReferences(doc) {
    var out = [];
    if (!window.Manifest) return out;
    Object.keys(doc.entries || {}).forEach(function (k) {
      var m;
      if ((m = /^(?:fam|seen|sched|att):(.+)$/.exec(k)) && !Manifest.has('card', m[1]))
        out.push({ key: k, kind: 'card', id: m[1] });
      else if ((m = /^chk:(?:[^:]+):w[^:]+:(.+)$/.exec(k)) && !Manifest.has('check', m[1]))
        out.push({ key: k, kind: 'check', id: m[1] });
      else if ((m = /^cp:(?:[^:]+):(.+)$/.exec(k)) && !Manifest.has('checkpoint', m[1]))
        out.push({ key: k, kind: 'checkpoint', id: m[1] });
      else if ((m = /^sit(?:level|done):(.+)$/.exec(k)) && !Manifest.has('situation', m[1]))
        out.push({ key: k, kind: 'situation', id: m[1] });
    });
    return out;
  }

  function validateProfile(p) {
    var e = [];
    if (!isPlain(p)) { err(e, '', 'profile must be an object'); return e; }
    if (typeof p.id !== 'string' || !p.id) err(e, 'id', 'must be a non-empty string');
    if (typeof p.name !== 'string' || !p.name) err(e, 'name', 'must be a non-empty string');
    if (!ROLES[p.role]) err(e, 'role', "must be 'student' or 'teacher'");
    return e;
  }

  function validateBackup(b) {
    var e = [];
    if (!isPlain(b)) { err(e, '', 'backup must be an object'); return e; }
    if (b.kind !== 'darija-tetouan-backup') err(e, 'kind', 'not a Darija Tetouani backup file');
    if (!isInt(b.schemaVersion))  err(e, 'schemaVersion', 'missing or not an integer');
    if (!isInt(b.contentVersion)) err(e, 'contentVersion', 'missing or not an integer');
    if (!isDate(b.exportedAt))    err(e, 'exportedAt', 'missing or not an ISO date');
    if (!isPlain(b.profiles))     err(e, 'profiles', 'must be an object');
    if (!isPlain(b.progress))     err(e, 'progress', 'must be an object keyed by profile id');
    return e;
  }

  function describe(errors) {
    if (!errors.length) return 'valid';
    return errors.slice(0, 12).map(function (x) {
      return (x.path ? x.path + ': ' : '') + x.message;
    }).join('\n') + (errors.length > 12 ? '\n… and ' + (errors.length - 12) + ' more' : '');
  }

  window.Validate = {
    progress: validateProgress, profile: validateProfile, backup: validateBackup,
    unknownReferences: unknownReferences, describe: describe
  };
})();
