/* Persistence — one localStorage key, flat map of string keys.
   Works offline; nothing leaves the device. */
(function () {
  var KEY = 'darija.tetouan.v1';
  var data = {};

  try { data = JSON.parse(localStorage.getItem(KEY) || '{}') || {}; } catch (e) { data = {}; }

  function save() {
    try { localStorage.setItem(KEY, JSON.stringify(data)); } catch (e) {}
  }

  window.Store = {
    get: function (k, dflt) { return Object.prototype.hasOwnProperty.call(data, k) ? data[k] : dflt; },
    set: function (k, v) { data[k] = v; save(); },
    toggle: function (k) { data[k] = !data[k]; save(); return data[k]; },
    countTrue: function (prefix) {
      var n = 0;
      for (var k in data) if (k.indexOf(prefix) === 0 && data[k] === true) n++;
      return n;
    },
    reset: function () { data = {}; save(); },
    replaceAll: function (obj) { data = obj || {}; save(); },
    all: function () { return data; },

    /* key builders — keep key formats in one place */
    kDay:   function (c, w, d) { return 'day:' + c + ':w' + w + ':d' + d; },
    kCheck: function (c, w, i) { return 'chk:' + c + ':w' + w + ':' + i; },
    kRate:  function (c, w)    { return 'rate:' + c + ':w' + w; },
    kTask:  function (c, i)    { return 'cp:' + c + ':' + i; },
    kCpStatus: function (c)    { return 'cpstatus:' + c; },
    kNote:  function (c, w)    { return 'note:' + c + ':w' + w; },
    kKnown: function (id)      { return 'known:' + id; },
    kRole:  'role'
  };
})();
