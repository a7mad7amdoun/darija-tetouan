/* ---------------------------------------------------------------------------
   THE RECORDER — Ahmed records the course in his own voice, on his phone.

   For each line: press Record, say it, press Stop, listen back, Keep or Redo.
   A kept clip is one he has listened to and approved - that is the approval
   the audio module's gate requires (verified: true). Kept clips live in the
   media database ('darija-tetouan-media', store 'clips'), NEVER in the
   progress database: nothing here can touch anyone's learning record.

   A clip reaches the learners by being published: "Download everything" gives
   a zip holding every kept clip, named by its content id, plus the manifest
   entries for data/audio.js. Once those files are in assets/audio/ and the
   manifest is in the repository, every card with a clip gets a real play
   button, on every device. Until then the app keeps saying "not recorded yet".

   Nothing is synthesised, nothing is generated, nothing is downloaded from
   anywhere: a clip exists only because Ahmed said it into this page.
   --------------------------------------------------------------------------- */
(function () {
  var D = function () { return window.DARIJA || {}; };
  var E = function (s) { return UI.esc(s); };
  var MEDIA_DB = 'darija-tetouan-media', STORE = 'clips';

  /* the first batch: the 32 lines of AUDIO-RECORDING-CHECKLIST.md, in its order */
  var BATCH = ['w1-hello', 'w1-marhba', 'w1-labas', 'w1-ntina', 'w1-kif-ntina', 'w1-bikhir', 'w1-smiti', 'w1-smitek',
    'w1-ismek', 'w1-from', 'w1-mnin', 'w1-please', 'w1-thanks', 'w1-bye', 'w1-mezyan', 'w1-mafhemtsh', 'w1-3awed',
    'w1-bshwiya', 'w1-bismillah', 'w1-hamdulillah', 'w1-inshallah', 'w1-mashallah', 'w1-tbarkallah', 'w1-barakallah',
    'w3-fin', 'w3-nishan', 'w3-limen', 'w3-shmal', 'w3-qrib', 'w3-b3id', 'w3-hna', 'w3-smehli'];

  /* ---------- the media database: its own, never the progress one ---------- */
  var dbp = null;
  function open() {
    if (dbp) return dbp;
    dbp = new Promise(function (resolve, reject) {
      if (!window.indexedDB) { reject(new Error('IndexedDB unavailable')); return; }
      var req = indexedDB.open(MEDIA_DB, 1);
      req.onupgradeneeded = function (e) { var db = e.target.result; if (!db.objectStoreNames.contains(STORE)) db.createObjectStore(STORE); };
      req.onsuccess = function () { resolve(req.result); };
      req.onerror = function () { reject(req.error); };
    });
    return dbp;
  }
  function op(mode, fn) {
    return open().then(function (db) {
      return new Promise(function (resolve, reject) {
        var t = db.transaction(STORE, mode), req = fn(t.objectStore(STORE));
        req.onsuccess = function () { resolve(req.result); };
        req.onerror = function () { reject(req.error); };
      });
    });
  }
  function getKept(id) { return op('readonly', function (s) { return s.get(id); }); }
  function allKept() {
    return open().then(function (db) {
      return new Promise(function (resolve, reject) {
        var out = {}, req = db.transaction(STORE, 'readonly').objectStore(STORE).openCursor();
        req.onsuccess = function (e) { var c = e.target.result; if (c) { out[c.key] = c.value; c.continue(); } else resolve(out); };
        req.onerror = function () { reject(req.error); };
      });
    });
  }
  function keep(id, rec) { return op('readwrite', function (s) { return s.put(rec, id); }); }
  function discard(id) { return op('readwrite', function (s) { return s.delete(id); }); }

  /* ---------- recording ---------- */
  var mimes = [['audio/mp4', 'm4a'], ['audio/webm;codecs=opus', 'webm'], ['audio/webm', 'webm'], ['audio/ogg;codecs=opus', 'ogg']];
  function pickMime() {
    if (!window.MediaRecorder) return null;
    for (var i = 0; i < mimes.length; i++) if (MediaRecorder.isTypeSupported(mimes[i][0])) return { mime: mimes[i][0], ext: mimes[i][1] };
    return { mime: '', ext: 'webm' };
  }
  function supported() { return !!(window.MediaRecorder && navigator.mediaDevices && navigator.mediaDevices.getUserMedia); }

  var state = { kept: {}, loaded: false, takes: {}, recording: null, error: '', q: '', stream: null, rec: null, chunks: [], startedAt: 0 };
  var player = null;

  function load() {
    if (state.loaded) return Promise.resolve(state.kept);
    return allKept().then(function (k) { state.kept = k; state.loaded = true; return k; })
      .catch(function (e) { state.error = 'The media store could not be opened: ' + e.message; state.loaded = true; return {}; });
  }

  function startRecording(id) {
    if (!supported()) { state.error = 'This browser cannot record. Safari on iPhone, Chrome on Android, or any desktop browser can.'; return Promise.resolve(); }
    var m = pickMime();
    return navigator.mediaDevices.getUserMedia({ audio: true }).then(function (stream) {
      state.stream = stream; state.chunks = []; state.error = '';
      var rec = new MediaRecorder(stream, m.mime ? { mimeType: m.mime } : undefined);
      state.rec = rec; state.recording = id; state.startedAt = Date.now();
      rec.ondataavailable = function (e) { if (e.data && e.data.size) state.chunks.push(e.data); };
      rec.onstop = function () {
        var blob = new Blob(state.chunks, { type: rec.mimeType || m.mime });
        state.takes[id] = { blob: blob, mime: rec.mimeType || m.mime, ext: m.ext, ms: Date.now() - state.startedAt, at: new Date().toISOString() };
        stream.getTracks().forEach(function (t) { t.stop(); });
        state.stream = null; state.rec = null; state.recording = null;
        if (window.App) App.render();
      };
      rec.start();
      if (window.App) App.render();
    }).catch(function (e) {
      state.error = e.name === 'NotAllowedError' ? 'The microphone was not allowed. Allow it for this site and try again.'
                  : 'Could not start recording: ' + e.message;
      state.recording = null;
      if (window.App) App.render();
    });
  }
  function stopRecording() { if (state.rec && state.rec.state !== 'inactive') state.rec.stop(); }

  function playTake(id) {
    var t = state.takes[id] || state.kept[id]; if (!t) return;
    if (player) { try { player.pause(); URL.revokeObjectURL(player.src); } catch (e) {} }
    player = new Audio(URL.createObjectURL(t.blob));
    player.play();
  }

  /* the manifest entry a kept clip earns: the card's own scope and revision,
     verified because Ahmed listened back before he pressed Keep */
  function manifestEntry(card, rec) {
    return { file: card.id + '.' + rec.ext, speaker: rec.speaker || 'ahmed', scope: card.scope || '',
             verified: true, rev: (card.audioRev || 1), recorded: (rec.at || '').slice(0, 10) };
  }
  function manifestSnippet(cardsById, kept) {
    var ids = Object.keys(kept).sort();
    var lines = ids.map(function (id) {
      var c = cardsById[id]; if (!c) return null;
      var m = manifestEntry(c, kept[id]);
      return "    '" + id + "': { file: '" + m.file + "', speaker: '" + m.speaker + "', scope: '" + m.scope +
             "', verified: true, rev: " + m.rev + ", recorded: '" + m.recorded + "' }";
    }).filter(Boolean);
    return '/* paste inside clips: { } in data/audio.js */\n' + lines.join(',\n') + (lines.length ? '\n' : '');
  }

  /* ---------- a zip, store-only, no library ---------- */
  var CRC = (function () { var t = [], c; for (var n = 0; n < 256; n++) { c = n; for (var k = 0; k < 8; k++) c = (c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1); t[n] = c >>> 0; } return t; })();
  function crc32(u8) { var c = 0xFFFFFFFF; for (var i = 0; i < u8.length; i++) c = CRC[(c ^ u8[i]) & 0xFF] ^ (c >>> 8); return (c ^ 0xFFFFFFFF) >>> 0; }
  function zip(files) {               /* files: [{name, data: Uint8Array}] */
    var enc = new TextEncoder(), parts = [], central = [], offset = 0;
    function le(n, b) { var a = new Uint8Array(b); for (var i = 0; i < b; i++) a[i] = (n >>> (8 * i)) & 0xFF; return a; }
    files.forEach(function (f) {
      var name = enc.encode(f.name), crc = crc32(f.data), size = f.data.length;
      var local = [le(0x04034b50, 4), le(20, 2), le(0x0800, 2), le(0, 2), le(0, 2), le(0x21, 2), le(crc, 4), le(size, 4), le(size, 4), le(name.length, 2), le(0, 2), name, f.data];
      var cen = [le(0x02014b50, 4), le(20, 2), le(20, 2), le(0x0800, 2), le(0, 2), le(0, 2), le(0x21, 2), le(crc, 4), le(size, 4), le(size, 4), le(name.length, 2), le(0, 2), le(0, 2), le(0, 2), le(0, 2), le(0, 4), le(offset, 4), name];
      local.forEach(function (p) { parts.push(p); offset += p.length; });
      cen.forEach(function (p) { central.push(p); });
    });
    var cstart = offset, clen = central.reduce(function (n, p) { return n + p.length; }, 0);
    central.forEach(function (p) { parts.push(p); });
    [le(0x06054b50, 4), le(0, 2), le(0, 2), le(files.length, 2), le(files.length, 2), le(clen, 4), le(cstart, 4), le(0, 2)].forEach(function (p) { parts.push(p); });
    var total = parts.reduce(function (n, p) { return n + p.length; }, 0), out = new Uint8Array(total), pos = 0;
    parts.forEach(function (p) { out.set(p, pos); pos += p.length; });
    return out;
  }

  function cardsById() { var m = {}; UI.allActiveCards().forEach(function (c) { m[c.id] = c; }); return m; }

  function download(name, blob) {
    var a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = name;
    document.body.appendChild(a); a.click(); setTimeout(function () { URL.revokeObjectURL(a.href); a.remove(); }, 1000);
  }
  function exportAll() {
    var by = cardsById();
    return allKept().then(function (kept) {
      var ids = Object.keys(kept).filter(function (id) { return by[id]; }).sort();
      return Promise.all(ids.map(function (id) { return kept[id].blob.arrayBuffer(); })).then(function (bufs) {
        var files = ids.map(function (id, i) { return { name: id + '.' + kept[id].ext, data: new Uint8Array(bufs[i]) }; });
        files.push({ name: 'audio-manifest-snippet.js', data: new TextEncoder().encode(manifestSnippet(by, kept)) });
        download('tetoutalk-recordings-' + new Date().toISOString().slice(0, 10) + '.zip', new Blob([zip(files)], { type: 'application/zip' }));
        return ids.length;
      });
    });
  }

  /* ---------- the page ---------- */
  function row(c) {
    var kept = state.kept[c.id], take = state.takes[c.id], rec = state.recording === c.id, pub = window.Audio2 && Audio2.has(c.id);
    var status = pub ? '<span class="rstat pub">published</span>'
      : kept ? '<span class="rstat kept">kept · ' + E((kept.at || '').slice(0, 10)) + '</span>'
      : take ? '<span class="rstat take">recorded · listen back</span>'
      : '<span class="rstat none">not recorded</span>';
    var h = '<div class="rrow' + (rec ? ' live' : '') + '" id="r-' + E(c.id) + '">' +
      '<div class="rtext"><span class="ren">' + E(c.en) + '</span><span class="say rsay">' + UI.sayHTML(c.phon) + '</span>' +
      UI.arabic(c.arv || c.ar, 'sec sm') + status + '</div><div class="ract">';
    if (rec) h += '<span class="rdot" aria-hidden="true"></span><button class="btn primary" type="button" data-rec="stop" data-id="' + E(c.id) + '">Stop</button>';
    else {
      if (take) h += '<button class="btn" type="button" data-rec="play" data-id="' + E(c.id) + '">▶ Listen</button>' +
        '<button class="btn primary" type="button" data-rec="keep" data-id="' + E(c.id) + '">Keep</button>' +
        '<button class="btn ghost sm" type="button" data-rec="redo" data-id="' + E(c.id) + '">Redo</button>';
      else if (kept) h += '<button class="btn" type="button" data-rec="play" data-id="' + E(c.id) + '">▶ Listen</button>' +
        '<button class="btn ghost sm" type="button" data-rec="record" data-id="' + E(c.id) + '">Record again</button>' +
        '<button class="btn ghost sm" type="button" data-rec="discard" data-id="' + E(c.id) + '">Discard</button>';
      else h += '<button class="btn primary" type="button" data-rec="record" data-id="' + E(c.id) + '"' + (state.recording ? ' disabled' : '') + '>● Record</button>';
    }
    return h + '</div></div>';
  }

  function view() {
    if (!UI.isTeacher()) return '<h1>Recordings</h1><p class="empty">This page is for the teacher.</p>';
    load().then(function () { if (!state.rendered) { state.rendered = true; if (window.App) App.render(); } });
    var by = cardsById();
    var batch = BATCH.map(function (id) { return by[id]; }).filter(Boolean);
    var keptN = Object.keys(state.kept).length;
    var h = '<h1>Record the course</h1>' +
      '<p class="sub">Your voice, line by line. Press Record, say the line <b>twice at normal speed</b> with a short pause between, ' +
      'press Stop, listen back, then Keep. A kept clip is one you have approved. Nothing is published until you download the ' +
      'set and send it to be added to the site.</p>';
    if (!supported()) h += '<p class="rerr">This browser cannot record audio. Open this page in Safari on your iPhone or Chrome on Android, or on a laptop.</p>';
    if (state.error) h += '<p class="rerr" role="alert">' + E(state.error) + '</p>';
    h += '<div class="rbar"><span><b>' + keptN + '</b> kept · <b>' + batch.filter(function (c) { return !state.kept[c.id] && !(window.Audio2 && Audio2.has(c.id)); }).length + '</b> of the first batch still to record</span>' +
      '<button class="btn primary" type="button" data-rec="export"' + (keptN ? '' : ' disabled') + '>Download everything (' + keptN + ')</button></div>';
    h += '<p class="muted" style="font-size:13.5px;margin:0 0 18px">Clips stay on this device until you download them. The zip holds every kept clip ' +
      'named by its word, and the lines to add to <code>data/audio.js</code>. Send it to Claude and the words get their play button.</p>';
    h += '<h2>The first batch · 32 lines</h2><div class="rlist">' + batch.map(row).join('') + '</div>';
    h += '<h2>Any other word</h2><form class="findword" id="recfind" role="search"><label for="recq">Find a word to record</label>' +
      '<div class="findrow"><input id="recq" type="search" autocomplete="off" value="' + E(state.q) + '" placeholder="English, Darija or Arabic"><button class="btn" type="submit">Find</button></div></form>';
    if (state.q) {
      var q = state.q.toLowerCase(), hits = UI.allActiveCards().filter(function (c) {
        return c.en.toLowerCase().indexOf(q) >= 0 || c.phon.toLowerCase().indexOf(q) >= 0 || (c.ar || '').indexOf(state.q) >= 0;
      }).slice(0, 20);
      h += '<div class="rlist">' + (hits.length ? hits.map(row).join('') : '<p class="empty">Nothing matches.</p>') + '</div>';
    }
    return h;
  }

  function act(b) {
    var id = b.dataset.id, a = b.dataset.rec, by = cardsById();
    if (a === 'record') return startRecording(id);
    if (a === 'stop') { stopRecording(); return Promise.resolve(); }
    if (a === 'play') { playTake(id); return Promise.resolve(); }
    if (a === 'redo') { delete state.takes[id]; return Promise.resolve(); }
    if (a === 'keep') {
      var t = state.takes[id], c = by[id]; if (!t || !c) return Promise.resolve();
      var rec = { blob: t.blob, mime: t.mime, ext: t.ext, ms: t.ms, at: t.at, speaker: 'ahmed', scope: c.scope || '', rev: c.audioRev || 1 };
      return keep(id, rec).then(function () { state.kept[id] = rec; delete state.takes[id]; })
        .catch(function (e) { state.error = 'Could not keep the clip: ' + e.message; });
    }
    if (a === 'discard') return discard(id).then(function () { delete state.kept[id]; });
    if (a === 'export') return exportAll().then(function (n) { state.error = n ? '' : 'Nothing kept yet.'; })
      .catch(function (e) { state.error = 'The download failed: ' + e.message; });
    return Promise.resolve();
  }
  function search(q) { state.q = String(q || '').trim(); }

  window.Recorder = { BATCH: BATCH, view: view, act: act, search: search, zip: zip, crc32: crc32,
                      manifestEntry: manifestEntry, manifestSnippet: manifestSnippet, supported: supported,
                      pickMime: pickMime, MEDIA_DB: MEDIA_DB, state: function () { return state; } };
})();
