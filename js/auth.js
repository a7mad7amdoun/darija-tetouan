/* ---------------------------------------------------------------------------
   AUTHENTICATION  —  Supabase Auth, loaded from a CDN as an ES module.

   No build step: the client is imported dynamically the first time it is
   needed, so a static file on GitHub Pages can use it directly.

   Design points that matter:

   - The role is NEVER trusted from the browser. It is read from the profiles
     table, and every table is protected by Row Level Security, so a student
     who edits their own JavaScript still cannot read the other student's
     progress. The role in memory is for deciding what to DRAW, nothing more.

   - If Supabase is not configured, the app runs in LOCAL mode with a single
     local profile. Everything works except cross-device sync. It does not
     pretend to be authenticated.
   --------------------------------------------------------------------------- */
(function () {
  var client = null;
  var session = null;
  var profile = null;
  var mode = 'unknown';     /* 'cloud' | 'local' */
  var listeners = [];

  function configured() {
    var c = window.SUPABASE_CONFIG || {};
    return !!(c.url && c.anonKey);
  }

  function getClient() {
    if (client) return Promise.resolve(client);
    if (!configured()) return Promise.reject(new Error('Supabase is not configured'));
    return import(window.SUPABASE_CLIENT_URL).then(function (mod) {
      client = mod.createClient(SUPABASE_CONFIG.url, SUPABASE_CONFIG.anonKey, {
        auth: { persistSession: true, autoRefreshToken: true, storageKey: 'darija.auth' }
      });
      client.auth.onAuthStateChange(function (_evt, s) {
        session = s;
        if (!s) { profile = null; }
        notify();
      });
      return client;
    });
  }

  /* ---------------- boot ---------------- */
  function init() {
    if (!configured()) {
      mode = 'local';
      profile = { id: 'local', name: 'This device', role: 'student', local: true };
      notify();
      return Promise.resolve({ mode: mode, profile: profile });
    }
    mode = 'cloud';
    return getClient()
      .then(function (c) { return c.auth.getSession(); })
      .then(function (r) {
        session = r && r.data ? r.data.session : null;
        if (!session) { notify(); return { mode: mode, profile: null }; }
        return loadProfile().then(function () { return { mode: mode, profile: profile }; });
      })
      .catch(function (e) {
        /* a network failure at boot must not lock a returning user out of
           their own offline data */
        mode = 'cloud-offline';
        notify();
        throw e;
      });
  }

  /* The role comes from the database, never from the browser. */
  function loadProfile() {
    if (!session) { profile = null; return Promise.resolve(null); }
    return getClient().then(function (c) {
      return c.from('profiles').select('id,name,role').eq('id', session.user.id).single();
    }).then(function (r) {
      if (r.error) throw new Error('Signed in, but no profile row exists for this user. ' +
                                   'See SUPABASE-SETUP.md step 3.');
      profile = { id: r.data.id, name: r.data.name, role: r.data.role };
      notify();
      return profile;
    });
  }

  function signIn(email, password) {
    if (!configured()) return Promise.reject(new Error('Supabase is not configured — see SUPABASE-SETUP.md'));
    return getClient()
      .then(function (c) { return c.auth.signInWithPassword({ email: email, password: password }); })
      .then(function (r) {
        if (r.error) throw new Error(friendly(r.error.message));
        session = r.data.session;
        return loadProfile();
      });
  }

  function signOut() {
    var done = configured() && client
      ? client.auth.signOut().catch(function () {})
      : Promise.resolve();
    return done.then(function () {
      session = null; profile = null;
      notify();
    });
  }

  function friendly(msg) {
    if (/invalid login/i.test(msg)) return 'That email and password do not match an account.';
    if (/email not confirmed/i.test(msg)) return 'That account has not been confirmed yet.';
    if (/failed to fetch|network/i.test(msg)) return 'No connection — cannot sign in right now.';
    return msg;
  }

  function currentProfile() { return profile; }
  function currentSession() { return session; }
  function isTeacher() { return !!(profile && profile.role === 'teacher'); }
  function accessToken() { return session ? session.access_token : null; }
  function getMode() { return mode; }
  function onChange(fn) { listeners.push(fn); }
  function notify() {
    var s = { mode: mode, profile: profile, signedIn: !!(profile), configured: configured() };
    listeners.forEach(function (f) { try { f(s); } catch (e) {} });
  }

  /* Change your own password. Supabase checks the session, so this only ever
     changes the account that is signed in - there is no way to aim it at
     someone else, and the teacher cannot reset a student's password from the
     browser. That needs the admin key, which must never be shipped here. */
  function changePassword(next) {
    if (!next || String(next).length < 8)
      return Promise.reject(new Error('Use at least 8 characters.'));
    return getClient().then(function (c) {
      return c.auth.updateUser({ password: String(next) });
    }).then(function (r) {
      if (r.error) throw new Error(r.error.message);
      return true;
    });
  }

  /* Who else is on this course. RLS decides what comes back: a student sees
     only themselves, the teacher sees all three. */
  function listProfiles() {
    return getClient().then(function (c) {
      return c.from('profiles').select('id,name,role').order('role', { ascending: false });
    }).then(function (r) {
      if (r.error) throw new Error(r.error.message);
      return r.data || [];
    });
  }

  /* Rename someone. The database allows your own row always, and any row if you
     are the teacher - and pins role either way, so this cannot promote anyone. */
  function rename(id, name) {
    name = String(name || '').trim();
    if (!name) return Promise.reject(new Error('A name cannot be empty.'));
    return getClient().then(function (c) {
      return c.from('profiles').update({ name: name }).eq('id', id).select();
    }).then(function (r) {
      if (r.error) throw new Error(r.error.message);
      if (!r.data || !r.data.length) throw new Error('The database refused that change.');
      return r.data[0];
    });
  }

  window.Auth = {
    init: init, signIn: signIn, signOut: signOut,
    configured: configured, getClient: getClient,
    currentProfile: currentProfile, currentSession: currentSession,
    isTeacher: isTeacher, accessToken: accessToken, mode: getMode,
    onChange: onChange, loadProfile: loadProfile,
    changePassword: changePassword, listProfiles: listProfiles, rename: rename
  };
})();
