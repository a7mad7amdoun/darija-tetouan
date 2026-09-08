/* ---------------------------------------------------------------------------
   CONTENT MANIFEST

   One index of every content item that progress can point at, built from the
   data files at boot. Its job is to answer two questions:

     - is this ID something we know about?
     - what kind of thing is it?

   It deliberately separates three things the old format conflated:

       IDENTITY      the id. Permanent. Never reused, never renumbered.
       DISPLAY ORDER the position. Free to change at any time.
       DISPLAY TEXT  the wording. Free to change at any time.

   Changing order or text must never change identity, which is why progress
   references only ever store the id.
   --------------------------------------------------------------------------- */
(function () {
  var D = window.DARIJA;

  /* every progress-bearing kind, and how to find its items */
  var index = null;

  function build() {
    var m = {
      card:        {},   /* vocabulary */
      check:       {},   /* week self-check items */
      checkpoint:  {},   /* month checkpoint tasks */
      spoken:      {},   /* spoken exam tasks */
      situation:   {},
      sentence:    {},
      dialogue:    {},
      week:        {},
      course:      {},
      exam:        {},
      test:        {},
      flag:        {},
      verify:      {}
    };

    (D.courses || []).forEach(function (c) {
      if (c.status !== 'active') return;
      m.course[c.id] = { id: c.id, kind: 'course', order: c.order, text: c.title };

      (c.weeks || []).forEach(function (w) {
        var wkey = c.id + ':w' + w.number;
        m.week[wkey] = { id: wkey, kind: 'week', order: w.number, text: w.title, courseId: c.id };

        (w.vocab || []).forEach(function (v, i) {
          m.card[v.id] = { id: v.id, kind: 'card', order: i, text: v.en, courseId: c.id, week: w.number };
        });
        (w.selfCheck || []).forEach(function (s, i) {
          m.check[s.id] = { id: s.id, kind: 'check', order: i, text: s.text, courseId: c.id, week: w.number };
        });
        (w.sentences || []).forEach(function (s, i) {
          m.sentence[s.id] = { id: s.id, kind: 'sentence', order: i, text: s.en, courseId: c.id, week: w.number };
        });
      });

      (c.extras || []).forEach(function (v, i) {
        m.card[v.id] = { id: v.id, kind: 'card', order: i, text: v.en, courseId: c.id, week: null };
      });

      (c.dialogues || []).forEach(function (d, i) {
        m.dialogue[d.id] = { id: d.id, kind: 'dialogue', order: i, text: d.title, courseId: c.id };
      });

      if (c.checkpoint) {
        (c.checkpoint.tasks || []).forEach(function (t, i) {
          m.checkpoint[t.id] = { id: t.id, kind: 'checkpoint', order: i, text: t.text, courseId: c.id };
        });
        /* the monthly exam's spoken part reuses the checkpoint tasks */
        m.exam['m:' + c.id] = { id: 'm:' + c.id, kind: 'exam', order: c.order, text: c.label + ' final' };
        (c.weeks || []).forEach(function (w) {
          var k = 'w:' + c.id + ':' + w.number;
          m.exam[k] = { id: k, kind: 'exam', order: w.number, text: 'Week ' + w.number + ' quiz' };
        });
      }
    });

    (D.situations || []).forEach(function (s, i) {
      m.situation[s.id] = { id: s.id, kind: 'situation', order: i, text: s.title };
    });

    /* the six-month exam and its spoken tasks live in the exam engine */
    m.exam.six = { id: 'six', kind: 'exam', order: 99, text: 'Six-month final' };
    if (window.Exams && Exams.sixMonth) {
      var six = Exams.sixMonth();
      ((six && six.spoken && six.spoken.tasks) || []).forEach(function (t, i) {
        m.spoken[t.id] = { id: t.id, kind: 'spoken', order: i, text: t.text, examId: 'six' };
      });
    }

    Object.keys(D.flags || {}).forEach(function (k) {
      m.flag[k] = { id: k, kind: 'flag', order: 0, text: D.flags[k].title };
    });
    (D.verify || []).forEach(function (v, i) {
      m.verify[v.id] = { id: v.id, kind: 'verify', order: i, text: v.topic };
    });
    (window.Tests && Tests.list || []).forEach(function (t, i) {
      m.test[t.id] = { id: t.id, kind: 'test', order: i, text: t.title };
    });

    return m;
  }

  function all() { if (!index) index = build(); return index; }

  function has(kind, id) { var k = all()[kind]; return !!(k && k[id]); }
  function get(kind, id)  { var k = all()[kind]; return k ? k[id] || null : null; }
  function ids(kind)      { return Object.keys(all()[kind] || {}); }
  function count(kind)    { return ids(kind).length; }

  /* Is this the id of a checkpoint task that a monthly exam's spoken part
     uses? The monthly spoken part borrows the checkpoint task ids. */
  function spokenTaskIds(examId) {
    if (examId === 'six') return ids('spoken');
    var m = /^m:(.+)$/.exec(examId);
    if (!m) return [];
    var c = (D.courses || []).filter(function (x) { return x.id === m[1]; })[0];
    return c && c.checkpoint ? c.checkpoint.tasks.map(function (t) { return t.id; }) : [];
  }

  function summary() {
    var a = all(), out = {};
    Object.keys(a).forEach(function (k) { out[k] = Object.keys(a[k]).length; });
    return out;
  }

  /* Reset the cache — only needed if content is added at runtime, e.g. a
     teacher-created card. */
  function invalidate() { index = null; }

  window.Manifest = {
    all: all, has: has, get: get, ids: ids, count: count,
    spokenTaskIds: spokenTaskIds, summary: summary, invalidate: invalidate
  };
})();
