/* ---------------------------------------------------------------------------
   ACCOUNT UI  —  the screens that gate the app, plus the account panel.

   Three gates, in this order, each blocking until resolved:
     1. sign in            (only when Supabase is configured)
     2. migration required (never runs on its own; waits for a button)
     3. the app
   --------------------------------------------------------------------------- */
(function () {
  var E = function (s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  };

  /* TetouTalk: the name, how to say it, and what it is - shown where someone
     arrives. Display text only; nothing stored, synced or routed is renamed. */
  var BRAND = {
    name: 'TetouTalk',
    say: 'teh-too-talk',
    tagline: 'Everyday Darija, the Tetouan way.',
    intro: 'Learn to speak in Tetouan through everyday conversations, local expressions, ' +
           'and practice with Ahmed.'
  };

  function brandBlock(compact) {
    return '<div class="gatebrand' + (compact ? ' compact' : '') + '">' +
      /* the compact form sits above a screen's own heading, so it is not one */
      (compact ? '<p' : '<h1') + ' class="wordmark-h"><svg class="logo" viewBox="0 0 501 134" role="img" aria-label="TetouTalk">' +
        '<use href="#logo"/></svg>' + (compact ? '</p>' : '</h1>') +
      (compact ? '' :
        '<p class="gatesay">' + E(BRAND.say) + '</p>' +
        '<p class="gatetag">' + E(BRAND.tagline) + '</p>' +
        '<p class="gateintro">' + E(BRAND.intro) + '</p>') +
      '</div>';
  }

  /* ---------------- sign in ---------------- */
  function loginScreen(msg, busy) {
    return '' +
      '<div class="gate">' +
        '<div class="gatecard">' +
          brandBlock() +
          '<p class="sub gatesign">Sign in to reach your own progress.</p>' +
          '<form id="loginform" class="miniform">' +
            '<label>Email<input name="email" type="email" autocomplete="username" required></label>' +
            '<label>Password<input name="password" type="password" autocomplete="current-password" required></label>' +
            (msg ? '<div class="gateerr">' + E(msg) + '</div>' : '') +
            '<button class="btn primary wide" type="submit"' + (busy ? ' disabled' : '') + '>' +
              (busy ? 'Signing in…' : 'Sign in') + '</button>' +
          '</form>' +
          '<p class="gatenote">Three accounts exist: Hamza, his wife, and the teacher. ' +
          'There is no public sign-up — accounts are created by the teacher.</p>' +
        '</div>' +
      '</div>';
  }

  function notConfiguredScreen() {
    return '' +
      '<div class="gate"><div class="gatecard">' +
        brandBlock(true) +
        '<h1 class="gateh">Running on this device only</h1>' +
        '<p class="sub">Supabase has not been configured yet, so there are no accounts and ' +
        'nothing syncs between devices. Everything else works, and progress is saved here.</p>' +
        '<div class="gateerr warn">Fill in <code>js/supabase-config.js</code> and follow ' +
        '<code>SUPABASE-SETUP.md</code> to turn on accounts and sync.</div>' +
        '<button class="btn primary wide" id="uselocal">Continue on this device</button>' +
      '</div></div>';
  }

  /* ---------------- migration gate ---------------- */
  function migrationScreen(info) {
    var h = '<div class="gate"><div class="gatecard wide">';
    h += '<h1>Your saved progress needs migrating</h1>';

    if (info.legacyPresent) {
      var p = info.legacyPreview || {};
      h += '<p class="sub">Progress from the previous version of this app was found on this ' +
           'device. It will not be changed until you say so.</p>';
      h += '<div class="migbox">' +
             '<div class="migrow"><span>Entries found</span><strong>' + (p.total || 0) + '</strong></div>' +
             '<div class="migrow"><span>Rewritten to stable ids</span><strong>' + ((p.moved || []).length) + '</strong></div>' +
             '<div class="migrow"><span>Carried across unchanged</span><strong>' + ((p.unchanged || []).length) + '</strong></div>' +
             '<div class="migrow"><span>Shared teacher entries</span><strong>' + (p.sharedCount || 0) + '</strong></div>' +
             '<div class="migrow' + ((p.failed || []).length ? ' bad' : '') + '"><span>Cannot be mapped</span><strong>' +
               ((p.failed || []).length) + '</strong></div>' +
           '</div>';

      if ((p.moved || []).length) {
        h += '<details class="fold"><summary>See what gets rewritten (' + p.moved.length + ')</summary><div class="foldbody">';
        p.moved.slice(0, 40).forEach(function (m) {
          h += '<div class="migmap"><code>' + E(m.from) + '</code><span>→</span><code>' + E(m.to) + '</code></div>';
        });
        if (p.moved.length > 40) h += '<p class="muted">… and ' + (p.moved.length - 40) + ' more</p>';
        h += '</div></details>';
      }
      if ((p.failed || []).length) {
        h += '<div class="gateerr">These entries cannot be matched to a known content item, ' +
             'so migration will refuse to run rather than guess:<br>';
        p.failed.slice(0, 8).forEach(function (f) {
          h += '<div><code>' + E(f.key) + '</code> — ' + E(f.reason) + '</div>';
        });
        h += '</div>';
      }
    } else {
      h += '<p class="sub">Saved data on this device is at schema v' + info.savedVersion +
           '. This version of the app expects v' + info.appVersion + '. ' +
           'Nothing has been changed.</p>';
    }

    h += '<p class="gatenote">A full backup is written before anything is touched. ' +
         'The migration runs on a copy, is validated, and only then replaces what is stored. ' +
         'If it fails, your original data is left exactly as it is.</p>';
    h += '<div class="btnrow">' +
           '<button class="btn" id="migbackup">Export a backup first</button>' +
           '<button class="btn primary" id="migrun"' +
             (info.legacyPreview && !info.legacyPreview.safe ? ' disabled' : '') + '>Migrate now</button>' +
         '</div>';
    h += '<button class="btn ghost wide" id="migskip" style="margin-top:10px">' +
         'Skip for now and start fresh on this device</button>';
    h += '</div></div>';
    return h;
  }

  /* ---------------- account panel ---------------- */
  function accountPanel(state) {
    state = state || {};
    var prof = window.Auth && Auth.currentProfile();
    var s = window.Sync ? Sync.status() : { state: 'idle', pending: 0, cloud: false };
    var snap = window.Storage ? Storage.snapshot() : {};
    var email = (window.Auth && Auth.currentSession() && Auth.currentSession().user &&
                 Auth.currentSession().user.email) || '';

    /* ---- who you are ---- */
    var h = '<h1>Account</h1>';
    h += '<div class="panel acctcard">' +
      '<div class="acctavatar">' + E((prof && prof.name ? prof.name : '?').slice(0, 1).toUpperCase()) + '</div>' +
      '<div class="acctwho">' +
        '<div class="acctname">' + E(prof ? prof.name : 'Not signed in') + '</div>' +
        (email ? '<div class="acctmail">' + E(email) + '</div>' : '') +
        '<div class="acctrole' + (prof && prof.role === 'teacher' ? ' teach' : '') + '">' +
          E(prof ? prof.role : '') + (prof && prof.local ? ' · this device only' : '') + '</div>' +
      '</div>' +
      (prof && !prof.local ? '<button class="btn" id="signout">Sign out</button>' : '') +
      '</div>';

    /* ---- your password ---- */
    if (prof && !prof.local) {
      h += '<h2>Password</h2><div class="panel">' +
        '<form id="pwform" class="miniform row">' +
          '<label>New password<input name="pw" type="password" autocomplete="new-password" ' +
            'minlength="8" required placeholder="at least 8 characters"></label>' +
          '<button class="btn primary" type="submit">Change it</button>' +
        '</form>' +
        (state.pwMsg ? '<p class="' + (state.pwOk ? 'okmsg' : 'errmsg') + '">' + E(state.pwMsg) + '</p>' : '') +
        '<p class="muted sm" style="margin:10px 0 0">This changes only the account you are signed in ' +
        'as. Nobody — not even the teacher — can change someone else’s password from this site; that ' +
        'needs the admin key, which is deliberately not shipped to the browser.</p>' +
      '</div>';
    }

    /* ---- sync ---- */
    h += '<h2>Sync</h2><div class="panel">' +
         '<div class="syncrow">' + syncBadge(s) + '</div>';
    if (s.cloud) {
      h += '<button class="btn wide" id="syncnow" style="margin-top:10px">Sync now</button>';
      h += '<p class="muted sm" style="margin:10px 0 0">Work is saved on this device first and ' +
           'uploaded when there is a connection, so being offline is normal rather than a problem. ' +
           (s.pending ? '<strong>' + s.pending + ' change' + (s.pending === 1 ? '' : 's') +
                        ' waiting to upload.</strong>' : 'Nothing is waiting.') + '</p>';
    } else {
      h += '<p class="muted sm" style="margin:10px 0 0">Not signed in to the cloud, so this device ' +
           'keeps its own copy and nothing syncs.</p>';
    }
    h += '<p class="muted" style="margin:12px 0 0;font-size:12px">' +
         'Schema v' + (snap.schemaVersion || '?') + ' · content v' + (snap.contentVersion || '?') +
         ' · ' + (snap.entryCount || 0) + ' entries' +
         (window.Store && Store.isFallback() ? ' · IndexedDB unavailable, using fallback storage' : '') +
         '</p></div>';

    /* ---- the other accounts (the teacher sees all three; a student sees one) ---- */
    if (state.people && state.people.length) {
      h += '<h2>' + (prof && prof.role === 'teacher' ? 'Everyone on the course' : 'Your profile') + '</h2>' +
           '<div class="panel">';
      state.people.forEach(function (p) {
        var isMe = prof && p.id === prof.id;
        h += '<div class="peoplerow">' +
          '<div class="acctavatar sm">' + E((p.name || '?').slice(0, 1).toUpperCase()) + '</div>' +
          '<form class="renameform" data-id="' + E(p.id) + '">' +
            '<input name="name" value="' + E(p.name) + '" aria-label="Name">' +
            '<button class="btn sm" type="submit">Save</button>' +
          '</form>' +
          '<span class="rolechip' + (p.role === 'teacher' ? ' teach' : '') + '">' + E(p.role) +
            (isMe ? ' · you' : '') + '</span>' +
        '</div>';
      });
      h += (state.peopleMsg ? '<p class="' + (state.peopleOk ? 'okmsg' : 'errmsg') + '">' +
              E(state.peopleMsg) + '</p>' : '') +
           '<p class="muted sm" style="margin:10px 0 0">Names only. Who is the teacher is decided in ' +
           'the database and cannot be changed from here — that is what stops a student promoting ' +
           'themselves.</p></div>';
    } else if (state.peopleErr) {
      h += '<h2>Accounts</h2><div class="panel"><p class="errmsg">' + E(state.peopleErr) + '</p></div>';
    }

    /* ---- backup ---- */
    /* ---- rebuilding the server from this device ---- */
    if (prof && !prof.local) {
      h += '<h2>Repair</h2><div class="panel">' +
        '<p class="muted" style="margin:0 0 12px">If work you did on this device is missing from ' +
        'the server — after a bad restore, or rows deleted by mistake — this sends everything this ' +
        'device holds back up. It only ever adds: it cannot delete anything, and running it twice ' +
        'is not the same as doing it twice, so it is safe to press again if you are unsure.</p>' +
        '<button class="btn" id="reupload">Re-upload everything from this device</button>' +
        (state.repairMsg ? '<p class="' + (state.repairOk ? 'okmsg' : 'errmsg') + '">' +
            E(state.repairMsg) + '</p>' : '') +
      '</div>';
    }

    h += '<h2>Backup</h2><div class="panel">' +
         '<p class="muted" style="margin:0 0 12px">A backup is a single JSON file holding your ' +
         'progress, the schema version it was written at, and the date. Import checks it and ' +
         'shows you what would change before anything is applied.</p>' +
         (prof && prof.role === 'teacher'
           ? '<p class="muted sm" style="margin:0 0 12px"><strong>Note.</strong> Because you are ' +
             'the teacher, your backup file also contains your private notes and your per-student ' +
             'observations, as plain readable text. Keep the file somewhere you would keep those ' +
             'notes — it is not protected by the sign-in.</p>'
           : '') +
         '<div class="btnrow">' +
           '<button class="btn primary" id="doexport">Export a backup</button>' +
           '<button class="btn" id="showimport">Import a backup…</button>' +
         '</div>' +
         '<div id="importwrap" hidden style="margin-top:12px">' +
           '<input type="file" id="importfile" accept="application/json,.json">' +
           '<div id="importpreview"></div>' +
         '</div></div>';
    return h;
  }

  function syncBadge(s) {
    if (!s.cloud) return '<span class="syncb local">Saved on this device</span>';
    if (!s.online) return '<span class="syncb off">Offline' +
      (s.pending ? ' — ' + s.pending + ' change' + (s.pending > 1 ? 's' : '') + ' waiting' : '') + '</span>';
    if (s.state === 'syncing') return '<span class="syncb work">Syncing…</span>';
    if (s.state === 'error') return '<span class="syncb bad">Sync error — will retry' +
      (s.lastError ? '<em>' + E(s.lastError) + '</em>' : '') + '</span>';
    if (s.pending) return '<span class="syncb work">' + s.pending + ' change' +
      (s.pending > 1 ? 's' : '') + ' waiting to sync</span>';
    return '<span class="syncb ok">Synced' +
      (s.lastSync ? ' · ' + new Date(s.lastSync).toLocaleTimeString() : '') + '</span>';
  }

  /* a compact badge for the header */
  function headerBadge() {
    var s = window.Sync ? Sync.status() : null;
    if (!s) return '';
    if (!s.cloud) return '';
    if (!s.online) return '<span class="hsync off" title="Offline">◷' + (s.pending || '') + '</span>';
    if (s.state === 'error') return '<span class="hsync bad" title="Sync error">⚠</span>';
    if (s.pending || s.state === 'syncing') return '<span class="hsync work" title="Syncing">◍' + (s.pending || '') + '</span>';
    return '<span class="hsync ok" title="Synced">✓</span>';
  }

  function importPreview(pv) {
    if (!pv.ok) {
      return '<div class="gateerr">This file cannot be imported:<br>' +
             E(Validate.describe(pv.errors)) + '</div>';
    }
    var c = pv.counts;
    var h = '<div class="migbox">' +
      '<div class="migrow"><span>New entries added</span><strong>' + c.added + '</strong></div>' +
      '<div class="migrow"><span>Existing entries overwritten</span><strong>' + c.changed + '</strong></div>' +
      '<div class="migrow"><span>Identical, no change</span><strong>' + c.same + '</strong></div>' +
      '<div class="migrow' + (c.removed ? ' bad' : '') + '"><span>Entries you have that the backup lacks</span><strong>' +
        c.removed + '</strong></div>' +
      (pv.needsMigration ? '<div class="migrow"><span>Older schema — will be migrated on import</span><strong>yes</strong></div>' : '') +
      '</div>';
    if (c.removed) {
      h += '<div class="gateerr warn">Importing replaces your progress with the backup’s. ' +
           c.removed + ' entr' + (c.removed > 1 ? 'ies' : 'y') + ' you currently have ' +
           'are not in this file and would be lost. A backup of your current state is written first.</div>';
    }
    if (pv.unknown && pv.unknown.length) {
      h += '<div class="gateerr warn">' + pv.unknown.length + ' entr' +
           (pv.unknown.length > 1 ? 'ies' : 'y') + ' refer to content this app does not know about. ' +
           'They will be kept, not deleted — they may be retired content.</div>';
    }
    h += '<div class="btnrow" style="margin-top:12px">' +
         '<button class="btn" id="importcancel">Cancel</button>' +
         '<button class="btn primary" id="importconfirm">Import and replace</button></div>';
    return h;
  }

  window.Account = {
    BRAND: BRAND,
    loginScreen: loginScreen, notConfiguredScreen: notConfiguredScreen,
    migrationScreen: migrationScreen, accountPanel: accountPanel,
    syncBadge: syncBadge, headerBadge: headerBadge, importPreview: importPreview
  };
})();
