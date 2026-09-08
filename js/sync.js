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
    if (/^(exam|testres):/.test(key)) return 'append';
    if (/^(note:|cardnote:|flagres:|vans:)/.test(key)) return 'text';
    if (/^rate:|^sitlevel:/.test(key))return 'lww';
    if (/^(day|chk|cp|spoken|sitdone|known):/.test(key)) return 'bool';
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
      /* only the records that are new in this write */
      var had = {};
      (Array.isArray(m.before) ? m.before : []).forEach(function (x) { if (x && x.id) had[x.id] = 1; });
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
      status.state = 'idle'; status.lastSync = new Date().toISOString();
      running = false;
      return countPending().then(function () { return Object.assign(statusOf(), res); });
    }).catch(function (e) {
      status.state = 'error'; status.lastError = e.message; running = false;
      notify();
      return statusOf();
    });
  }

  /* ---------------- pulling from Supabase ---------------- */
  function pull() {
    var prof = window.Auth && Auth.currentProfile();
    if (!navigator.onLine || !prof || prof.local || !Auth.configured()) return Promise.resolve(null);
    return Auth.getClient().then(function (c) {
      return c.rpc('read_state', { since: status.lastSync });
    }).then(function (r) {
      if (r.error) throw new Error(r.error.message);
      return mergeRemote(r.data || {});
    }).catch(function (e) {
      status.lastError = e.message; notify(); return null;
    });
  }

  /* Apply remote entries under the conflict rules above. */
  function mergeRemote(remote) {
    var doc = Storage.currentDoc();
    if (!doc || !remote.entries) return null;
    var applied = 0, conflicts = [];
    Object.keys(remote.entries).forEach(function (k) {
      var incoming = remote.entries[k];
      var mine = doc.entries[k];
      var kind = classify(k);

      if (mine === undefined) { doc.entries[k] = incoming.value; applied++; return; }

      if (kind === 'append' && Array.isArray(mine) && Array.isArray(incoming.value)) {
        var byId = {};
        mine.concat(incoming.value).forEach(function (x) { if (x && x.id) byId[x.id] = x; });
        doc.entries[k] = Object.keys(byId).map(function (i) { return byId[i]; });
        applied++; return;
      }
      if (kind === 'counter') {
        /* the server holds the authoritative sum of all increments */
        doc.entries[k] = incoming.value; applied++; return;
      }
      if (kind === 'bool') {
        if (incoming.value === true && mine !== true) { doc.entries[k] = true; applied++; return; }
        if (incoming.value === false && mine === true) {
          /* only a strictly newer change may un-tick */
          if (incoming.at && doc.updatedAt && incoming.at > doc.updatedAt) { doc.entries[k] = false; applied++; }
          return;
        }
        return;
      }
      /* text and lww: newer wins, and a losing note is kept */
      if (incoming.at && doc.updatedAt && incoming.at > doc.updatedAt) {
        if (kind === 'text' && mine && mine !== incoming.value) {
          conflicts.push({ key: k, kept: incoming.value, superseded: mine, at: new Date().toISOString() });
        }
        doc.entries[k] = incoming.value; applied++;
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
    classify: classify, conflicts: conflicts
  };
})();
