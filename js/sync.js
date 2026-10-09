/* ---------------------------------------------------------------------------
   SYNC  —  offline-first, outbox based.

       local write -> IndexedDB -> outbox -> (online) -> Supabase -> mark synced

   Every mutation is recorded as a change with a UUID, so a change is never
   identified by its timestamp and never applied twice.

   CONFLICT RULES, chosen for explainability over cleverness. Three users.

     vocabulary counters   sent as INCREMENTS (+1 right, +1 wrong), never as a
                           total. Two devices practising the same card offline
                           both land, instead of one silently overwriting the
                           other.
     booleans (ticks)      a newer true beats an older false, but an older
                           false NEVER un-ticks a newer true. Un-ticking is
                           supported, but only from a strictly newer change.
     ratings               last write wins, by explicit change timestamp.
     exam/test results     append-only records keyed by result id. Merged by
                           union — no result is ever lost.
     teacher notes         last write wins by timestamp, and the loser is kept
                           in a conflicts log rather than discarded.
   --------------------------------------------------------------------------- */
(function () {
  var status = { state: 'idle', pending: 0, lastSync: null, lastError: null };
  var listeners = [];
  var running = false;

  function notify() { listeners.forEach(function (f) { try { f(statusOf()); } catch (e) {} }); }
  function onChange(fn) { listeners.push(fn); }
  function statusOf() {
    return {
      state: navigator.onLine ? status.state : 'offline',
      online: navigator.onLine,
      pending: status.pending,
      lastSync: status.lastSync,
      lastError: status.lastError,
      cloud: !!(window.Auth && Auth.configured() && Auth.currentProfile() && !Auth.currentProfile().local)
    };
  }

  /* ---------------- what kind of change is this? ---------------- */
  function classify(key) {
    if (/^fam:/.test(key))            return 'counter';
    if (/^(exam|testres|att):/.test(key)) return 'append';
    if (/^(note:|cardnote:|flagres:|vans:)/.test(key)) return 'text';
    if (/^rate:|^sitlevel:|^sched:/.test(key))return 'lww';
    if (/^(day|chk|cp|spoken|sitdone|known|seen|did):/.test(key)) return 'bool';
    return 'lww';
  }

  /* Record one local mutation. Called by Storage.set. */
  function record(m) {
    if (!window.DB || !DB.available()) return;
    var kind = classify(m.key);
    var change = {
      id: DB.uuid(),
      profileId: m.profileId,
      entityType: kind,
      entityId: m.key,
      op: 'set',
      at: new Date().toISOString(),
      status: 'pending',
      payload: null
    };

    if (kind === 'counter') {
      /* store the DELTA, not the total */
      var before = m.before || { r: 0, w: 0 };
      var after  = m.value  || { r: 0, w: 0 };
      change.op = 'increment';
      change.payload = { r: (after.r || 0) - (before.r || 0), w: (after.w || 0) - (before.w || 0) };
      if (!change.payload.r && !change.payload.w) return;   /* nothing moved */
    } else if (kind === 'append') {
      /* only the records that are new in this write - unless the caller
         changed the stored list in place, in which case `before` already holds
         them and cannot be trusted: send every record, and let the server's
         union by id keep the ones it already has exactly once */
      var had = {};
      if (!m.sameRef) {
        (Array.isArray(m.before) ? m.before : []).forEach(function (x) { if (x && x.id) had[x.id] = 1; });
      }
      var added = (Array.isArray(m.value) ? m.value : []).filter(function (x) { return x && x.id && !had[x.id]; });
      if (!added.length) return;
      change.op = 'append';
      change.payload = added;
    } else {
      change.payload = { value: m.value };
    }

    DB.put('outbox', change.id, change).then(countPending);
  }

  function countPending() {
    return DB.values('outbox').then(function (all) {
      status.pending = (all || []).filter(function (c) { return c.status === 'pending'; }).length;
      notify();
      return status.pending;
    });
  }

  /* ---------------- pushing to Supabase ---------------- */
  function push() {
    if (running) return Promise.resolve(statusOf());
    if (!navigator.onLine) { notify(); return Promise.resolve(statusOf()); }
    var prof = window.Auth && Auth.currentProfile();
    if (!prof || prof.local || !Auth.configured()) { notify(); return Promise.resolve(statusOf()); }

    running = true; status.state = 'syncing'; status.lastError = null; notify();

    return DB.values('outbox').then(function (all) {
      var pending = (all || []).filter(function (c) { return c.status === 'pending'; })
                               .sort(function (a, b) { return a.at < b.at ? -1 : 1; });
      if (!pending.length) return { sent: 0 };
      return Auth.getClient().then(function (c) {
        /* one RPC applies the batch server-side so the merge rules live in one
           place and run inside a transaction. See supabase/schema.sql. */
        return c.rpc('apply_changes', { changes: pending });
      }).then(function (r) {
        if (r.error) throw new Error(r.error.message);
        var accepted = (r.data && r.data.accepted) || pending.map(function (p) { return p.id; });
        return Promise.all(accepted.map(function (id) {
          var ch = pending.filter(function (p) { return p.id === id; })[0];
          if (!ch) return null;
          ch.status = 'synced'; ch.syncedAt = new Date().toISOString();
          return DB.put('outbox', ch.id, ch);
        })).then(function () { return { sent: accepted.length }; });
      });
    }).then(function (res) {
      status.state = 'idle';
      running = false;
      /* A push can be merged server-side: a counter adds onto what another
         device already sent, so what landed is not what this device sent. Pull
         the whole state straight back, or this device would keep showing its
         own half of the total. 'since' is deliberately ignored here - the rows
         we need were changed by our own push and may share its timestamp. */
      return (res.sent ? pull({ full: true }) : Promise.resolve(null))
        .then(countPending)
        .then(function () { return Object.assign(statusOf(), res); });
    }).catch(function (e) {
      status.state = 'error'; status.lastError = e.message; running = false;
      notify();
      return statusOf();
    });
  }

  /* ---------------- pulling from Supabase ---------------- */
  function pull(opts) {
    var full = !!(opts && opts.full);
    var prof = window.Auth && Auth.currentProfile();
    if (!navigator.onLine || !prof || prof.local || !Auth.configured()) return Promise.resolve(null);
    return Auth.getClient().then(function (c) {
      return c.rpc('read_state', { since: full ? null : status.lastSync });
    }).then(function (r) {
      if (r.error) throw new Error(r.error.message);
      var data = r.data || {};
      return Promise.resolve(mergeRemote(data)).then(function (out) {
        /* Track the SERVER's clock, not this device's. A phone whose clock runs
           fast would otherwise set a 'since' in the future and quietly skip
           every change made in between. */
        if (data.serverTime) status.lastSync = data.serverTime;
        notify();
        return out;
      });
    }).catch(function (e) {
      status.lastError = e.message; notify(); return null;
    });
  }

  /* ---------------- rebuilding the server from this device ----------------
     For when the server has lost rows this device still holds - a bad restore,
     a mistaken delete, a project rebuilt. It reads the local document and sends
     every entry as a 'restore'.

     A restore is not a replay. The server merges it by max for counters, union
     for results, true-wins for ticks and newer-wins for text, so sending the
     same thing twice cannot inflate anything. That is also why it deliberately
     does not go through the idempotency ledger: the ledger is append-only and
     may well have outlived whatever destroyed the progress rows, and it must
     not be able to block a repair.

     It only ever adds. It cannot delete a row, and it cannot pull a counter
     back down or un-tick something done on another device since. */
  function reupload() {
    var prof = window.Auth && Auth.currentProfile();
    if (!prof || prof.local || !Auth.configured())
      return Promise.reject(new Error('Not signed in to the cloud.'));
    if (!navigator.onLine)
      return Promise.reject(new Error('No connection — try again once you are back online.'));
    var doc = Storage.currentDoc();
    if (!doc) return Promise.reject(new Error('No progress loaded.'));
    if (Storage.viewing())
      return Promise.reject(new Error('Stop looking at a student first — this uploads your own device.'));

    var at = doc.updatedAt || new Date().toISOString();
    var changes = Object.keys(doc.entries).map(function (k) {
      var v = doc.entries[k], kind = classify(k);
      var ch = { id: DB.uuid(), profileId: prof.id, entityType: kind, entityId: k,
                 op: 'restore', at: at, payload: { value: v } };
      if (kind === 'counter') ch.payload = { r: (v && v.r) || 0, w: (v && v.w) || 0 };
      else if (kind === 'append') ch.payload = Array.isArray(v) ? v : [];
      return ch;
    });
    if (!changes.length) return Promise.resolve({ sent: 0 });

    return Auth.getClient().then(function (c) {
      return c.rpc('apply_changes', { changes: changes });
    }).then(function (r) {
      if (r.error) throw new Error(r.error.message);
      var n = ((r.data && r.data.accepted) || []).length;
      status.lastSync = null;          /* force the next pull to fetch everything */
      return pull({ full: true }).then(function () { return { sent: n, queued: changes.length }; });
    });
  }

  /* ---------------- fetching one student, for the teacher ----------------
     Read-only and never merged into anyone's document. The server decides
     whether there is anything to return: a student asking about the other
     student gets an empty object back. */
  function pullStudent(profileId) {
    var prof = window.Auth && Auth.currentProfile();
    if (!prof || prof.local || !Auth.configured())
      return Promise.reject(new Error('Not signed in to the cloud.'));
    if (!navigator.onLine)
      return Promise.reject(new Error('No connection — showing the last copy fetched.'));
    return Auth.getClient().then(function (c) {
      return c.rpc('read_student', { target: profileId });
    }).then(function (r) {
      if (r.error) throw new Error(r.error.message);
      var d = r.data || {};
      var flat = {};
      Object.keys(d.entries || {}).forEach(function (k) { flat[k] = d.entries[k].value; });
      var snap = { profileId: profileId, entries: flat, at: d.serverTime || new Date().toISOString() };
      /* cached so the teacher can still look while offline */
      return DB.put('meta', 'peer:' + profileId, snap).then(function () { return snap; });
    });
  }

  function cachedStudent(profileId) {
    return DB.get('meta', 'peer:' + profileId).then(function (s) { return s || null; });
  }

  /* Remember that this key now holds the server's value as of the server's
     timestamp, so a later pull does not re-apply the same change and a local
     write afterwards correctly counts as newer. */
  function touch(doc, key, at) {
    if (!doc) return;
    if (!doc.at) doc.at = {};
    doc.at[key] = at || new Date().toISOString();
  }

  /* read_state returns { entries, shared, serverTime } and 'shared' was never
     read anywhere in the codebase. Consequences: the teacher's card corrections
     never reached either student, and - once per-student observations were added
     - those became write-only, surviving in Postgres but lost from the app on any
     second device, reinstall or cleared browser storage.

     What comes down is already filtered by the server: read_state returns a
     shared row only when the caller is the teacher or the row is marked
     student-visible, and observations are not. So merging this is safe, and NOT
     merging it was the bug. */
  function hasId(x) { return !!(x && x.id); }

  /* The same allow-list the server uses in shared_is_student_visible(). This is
     NOT a security check - Row Level Security is, and it is correct. It is a
     blast-radius limit: until this week the client threw remote.shared away, so
     a wrong line in that SQL function, or one hand-written insert with
     student_visible = true, was inert. Now such a row would land in a student's
     document, and the role toggle is only a local preference, so a student can
     render the teacher's views locally. Refusing here costs nothing and means a
     server mistake has to get past two doors. */
  function studentMayHold(key) {
    return /^cardnote:/.test(key) || /^flagres:/.test(key) ||
           key === 'customCards' || key === 'customSeq';
  }

  function mergeShared(remote) {
    var sh = Storage.currentShared();
    if (!sh || !remote.shared) return 0;
    var isTeacher = !!(window.Auth && Auth.currentProfile() &&
                       Auth.currentProfile().role === 'teacher');
    var n = 0, sharedConflicts = [], refused = 0;
    Object.keys(remote.shared).forEach(function (k) {
      if (!isTeacher && !studentMayHold(k)) { refused++; return; }
      var incoming = remote.shared[k];
      var mine = sh.entries[k];
      if (mine === undefined) {
        sh.entries[k] = incoming.value; touch(sh, k, incoming.at); n++; return;
      }
      /* Union arrays by id - but ONLY when every element on both sides actually
         has one. The teacher's session log is an array of {date, week, note}
         with no ids at all, so this branch built an empty index, produced an
         empty array, saw that the length had changed and replaced the log with
         [] on the first pull after it had ever synced. It destroyed the exact
         data it was written to protect. Anything without ids falls through to
         the timestamp rule, where a whole-value comparison is correct. */
      if (Array.isArray(mine) && Array.isArray(incoming.value) &&
          mine.every(hasId) && incoming.value.every(hasId)) {
        var byId = {};
        mine.concat(incoming.value).forEach(function (x) { byId[x.id] = x; });
        var merged = Object.keys(byId).map(function (i) { return byId[i]; });
        /* The server keeps shared rows newest-wins. Two of the teacher's
           devices that each add an observation offline both push, and the
           server keeps only the later list - so the earlier device's note
           survived only on that device, and the other never saw it. When the
           union here holds something the server's copy lacks, send the union
           back. Each device adds what only it has, so they converge, and
           nothing loops: a device holding nothing new sends nothing.
           Observations only - they are append-only by design. Other shared
           lists (custom cards) can be deleted from, and re-sending a union
           would bring a deleted one back. */
        if (isTeacher && /^obs:/.test(k)) {
          var onServer = {};
          incoming.value.forEach(function (x) { onServer[x.id] = 1; });
          if (merged.some(function (x) { return !onServer[x.id]; })) {
            Storage.set(k, merged); n++;
            return;
          }
        }
        if (merged.length !== mine.length) {
          sh.entries[k] = merged; touch(sh, k, incoming.at); n++;
        }
        return;
      }

      /* An array without ids is still a log, and last-write-wins is the wrong
         rule for a log: a device holding three lesson notes against a server
         holding one is not the stale one, it is the one with the notes. Union
         by content instead, which can only add. The cost is that deleting an
         entry does not propagate - and losing a lesson note is far worse than
         having to delete one twice. */
      if (Array.isArray(mine) && Array.isArray(incoming.value)) {
        var seen = {}, union = [];
        mine.concat(incoming.value).forEach(function (x) {
          var sig = JSON.stringify(x);
          if (!seen[sig]) { seen[sig] = 1; union.push(x); }
        });
        if (union.length !== mine.length) {
          sh.entries[k] = union; touch(sh, k, incoming.at); n++;
        }
        return;
      }

      /* Per-key timestamps, for the same reason as mergeRemote: this compared
         against the whole shared document's updatedAt, so one local edit to any
         note blocked every incoming note older than it - permanently, since
         lastSync advances past the dropped row. And unlike mergeRemote it kept
         no record, so a superseded note simply vanished. */
      var mineAt = Storage.keyTime(sh, k);
      if (incoming.at && mineAt && incoming.at > mineAt &&
          JSON.stringify(mine) !== JSON.stringify(incoming.value)) {
        sharedConflicts.push({ key: k, kept: incoming.value, superseded: mine,
                               at: new Date().toISOString() });
        sh.entries[k] = incoming.value; touch(sh, k, incoming.at); n++;
      }
    });
    if (refused) {
      /* recorded, not silent: if this ever fires it means the server offered a
         student something only the teacher should hold, and somebody should look */
      DB.get('meta', 'refusedShared').then(function (log) {
        return DB.put('meta', 'refusedShared',
          (log || []).concat([{ at: new Date().toISOString(), count: refused }]));
      });
    }
    if (n) Storage.persist();
    /* conflicts are RETURNED, not written here: mergeRemote already makes one
       awaited write of the conflict log, and a second fire-and-forget write
       could fail silently and could not be tested. */
    return { applied: n, conflicts: sharedConflicts, refused: refused };
  }

  /* Apply remote entries under the conflict rules above. */
  function mergeRemote(remote) {
    var doc = Storage.currentDoc();
    if (!doc || !remote.entries) return null;
    var sharedResult = mergeShared(remote);
    var applied = (sharedResult && sharedResult.applied) || 0;
    var conflicts = (sharedResult && sharedResult.conflicts) || [];
    Object.keys(remote.entries).forEach(function (k) {
      var incoming = remote.entries[k];
      var mine = doc.entries[k];
      var kind = classify(k);

      if (mine === undefined) {
        doc.entries[k] = incoming.value; touch(doc, k, incoming.at); applied++; return;
      }

      if (kind === 'append' && Array.isArray(mine) && Array.isArray(incoming.value)) {
        var byId = {};
        mine.concat(incoming.value).forEach(function (x) { if (x && x.id) byId[x.id] = x; });
        doc.entries[k] = Object.keys(byId).map(function (i) { return byId[i]; });
        touch(doc, k, incoming.at); applied++; return;
      }
      if (kind === 'counter') {
        /* the server holds the authoritative sum of all increments */
        doc.entries[k] = incoming.value; touch(doc, k, incoming.at); applied++; return;
      }
      /* Compare against when THIS KEY was last written here, not when the
         document was last touched. It used to be doc.updatedAt, so a single
         local write to any key blocked every incoming update to every other
         key - two devices could never converge on a schedule, a rating or a
         note. */
      var mineAt = Storage.keyTime(doc, k);

      if (kind === 'bool') {
        if (incoming.value === true && mine !== true) {
          doc.entries[k] = true; touch(doc, k, incoming.at); applied++; return;
        }
        if (incoming.value === false && mine === true) {
          /* only a strictly newer change may un-tick */
          if (incoming.at && mineAt && incoming.at > mineAt) {
            doc.entries[k] = false; touch(doc, k, incoming.at); applied++;
          }
          return;
        }
        return;
      }
      /* text and lww: newer wins, and a losing note is kept */
      if (incoming.at && mineAt && incoming.at > mineAt) {
        if (kind === 'text' && mine && mine !== incoming.value) {
          conflicts.push({ key: k, kept: incoming.value, superseded: mine, at: new Date().toISOString() });
        }
        doc.entries[k] = incoming.value; touch(doc, k, incoming.at); applied++;
      }
    });
    var jobs = [Storage.persist()];
    if (conflicts.length) {
      jobs.push(DB.get('meta', 'conflicts').then(function (log) {
        return DB.put('meta', 'conflicts', (log || []).concat(conflicts));
      }));
    }
    return Promise.all(jobs).then(function () { return { applied: applied, conflicts: conflicts.length }; });
  }

  function syncNow() { return push().then(function () { return pull(); }).then(function () { return statusOf(); }); }

  function start() {
    if (!window.DB || !DB.available()) return;
    countPending();
    window.addEventListener('online', function () { status.state = 'idle'; notify(); syncNow(); });
    window.addEventListener('offline', notify);
    /* a modest interval; three users generate almost no traffic */
    setInterval(function () { if (navigator.onLine && status.pending) syncNow(); }, 60000);
    if (navigator.onLine) syncNow();
  }

  function conflicts() { return DB.get('meta', 'conflicts').then(function (l) { return l || []; }); }

  window.Sync = {
    record: record, push: push, pull: pull, syncNow: syncNow, start: start,
    status: statusOf, onChange: onChange, countPending: countPending,
    classify: classify, conflicts: conflicts,
    /* exported so the merge rules can be tested directly. They are the most
       consequential logic in the project and were previously reachable only
       through a network round trip, which is how a comparison against the wrong
       timestamp survived in them. */
    mergeRemote: mergeRemote, mergeShared: mergeShared,
    pullStudent: pullStudent, cachedStudent: cachedStudent, reupload: reupload
  };
})();
