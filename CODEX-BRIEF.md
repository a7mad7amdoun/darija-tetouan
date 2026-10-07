# Brief: Tetouani Darija learning site

You are joining a working project, not starting one. Read this before touching
anything. Then read `README.md` for the content model and `SUPABASE-SETUP.md`
for the backend.

**Repo:** https://github.com/a7mad7amdoun/darija-tetouan
**Live:** https://a7mad7amdoun.github.io/darija-tetouan/
**Run locally:** `python3 serve.py 8000` → http://localhost:8000
(`serve.py` sends `Cache-Control: no-store`; plain `http.server` serves stale
files and makes edits look like they never happened.)

---

## 1. What this is

A private site teaching **Tetouani Moroccan Darija** to exactly three people:
Hamza (an American living in Tetouan), his wife, and Ahmed (their teacher, and
the owner of this repo). It is a six-month course. Three months are built.

It is **not** a general Darija app and must never become one. Tetouan is a
pre-Hilalian city dialect with an Andalusi substrate and a Spanish-protectorate
loanword layer. It differs from the national Moroccan Darija that every other
app and resource teaches. That difference is the entire reason this exists.

### The content priority order, fixed by the teacher
1. **English** — explanations, always, in plain English
2. **Tetouan Darija** — in Latin letters first
3. **Arabic script** — with harakat, so beginners can read it
4. **National Darija** — shown only as a labelled contrast, never merged in

Every claim carries a `scope`: `mdini` (traditional medina speech),
`tetouan` (attested for the city), or `north` (correct here but shared with
Tangier and the Jebala, so *not* the city's own). "Northern" is not a synonym
for Tetouani and must never be treated as one.

---

## 2. Hard constraints — do not violate these

**No build step, ever.** Vanilla HTML/CSS/JS, hash-router SPA. You must NOT
introduce React, Vue, Angular, Next.js, a Node backend, Express, an ORM, a
bundler, TypeScript compilation, or any npm dependency requiring a build. The
teacher must be able to open `index.html` and have it work.

**Static hosting on GitHub Pages at `/darija-tetouan/`.** Every path is
relative. Never write a root-relative path like `/js/app.js` — it breaks the
subpath deployment.

**Security.** Authorisation is enforced by Postgres Row Level Security, not by
the browser. The browser may contain only the Supabase project URL and the
anon key (both public by design). It must NEVER contain the service-role key,
the database password, or a JWT secret. Frontend role checks decide which
buttons to draw; they are not security. A student must not be able to read or
write the other student's progress, write teacher data, or change their own
role.

**Never lose progress.** This is the project's first principle, and it has
already been violated once at real cost. Specifically:
- Never silently overwrite, migrate, delete, or reinterpret a record.
- Content is addressed by **stable ids**, never by array position. Inserting a
  self-check in the middle of a week must not move anyone's ticks onto a
  different item. `js/legacy-manifest.js` freezes the old index→id tables and
  is **never regenerated** from current content.
- Migrations never run automatically. They back up, clone, migrate the clone,
  validate, then swap — and abort with the original byte-identical rather than
  guess at a key they cannot map.
- Validation reports problems; it never silently repairs them, and never drops
  an entry pointing at content it does not recognise.
- **Never run `delete from student_progress` or any unscoped delete against the
  live database.** Tests use the `selftest@darija-tetouan.com` account and
  delete only the specific keys they wrote.

---

## 3. How it is put together

```
index.html            one page, every script tag, ?v= cache stamps
serve.py              no-cache dev server
assets/styles.css     ~1030 lines, token-based, real dark mode
data/month1..3.js     the course content (see README for the card shape)
data/situations.js    English→Darija sentence ladders
data/dialect.js       researched Tetouani vs national contrasts, with sources
data/flags.js         open verification questions
js/db.js              IndexedDB promise wrapper
js/storage.js         profile-scoped state; student doc vs shared teacher doc
js/store.js           synchronous facade the UI calls (~64 call sites)
js/schedule.js        spaced repetition (SM-2, two grades)
js/sync.js            outbox, merge rules, push/pull, repair
js/auth.js            Supabase auth; role read from the DB, never the browser
js/migrations.js      ordered, explicit, user-triggered
js/validation.js      per-kind checks that report and never repair
js/content-manifest.js  identity / order / text kept separate
js/views*.js          the pages
js/teacher.js         teacher workspace
supabase/schema.sql   4 tables, 11 RLS policies, 4 functions
selftest.html         55 checks; open in a real browser
```

**Storage model.** Progress lives in IndexedDB, one document per person, plus
a separate shared document for teacher data (notes, card corrections, feedback,
session log, custom cards). Writes queue in an **outbox** and sync when there is
a connection — offline is the normal path, not an error path.

**Merge rules** (in `supabase/schema.sql`, `apply_changes`):
| kind | rule |
|---|---|
| practice counters | deltas are added, so two offline devices both land |
| test/exam results | append-only by UUID, nothing is ever lost |
| day/self-check ticks | newer *true* wins; an older *false* never un-ticks |
| ratings, notes, text | last write wins by timestamp; superseded text is kept |

Every change carries a client UUID and the server records applied ones, so a
retry cannot double-count an increment.

**Spaced repetition** (`js/schedule.js`). Every word has a due date. Right
answer, the gap grows (1 day, 3, then × ease). Wrong, it returns tomorrow with
a lower ease. Capped at 180 days. Nothing is ever retired. It hangs off
`UI.markFam`, so answers in the session, tests and exams all move the schedule.

---

## 4. Where it stands

- **Content:** 338 vocabulary cards (253 core, 73 useful, 12 extra), 76
  sentences, 6 dialogues, 8 situations, 10 dialect contrasts, 8 test formats.
  **Months 1–3 built; months 4–6 not written.**
- **Tested:** 68 checks across four Node suites plus 55 in `selftest.html`.
- **Verified live against the database:** RLS blocks cross-student reads and
  self-promotion; counters from two offline devices add rather than overwrite;
  a replayed batch is not counted twice.

### Known gaps, roughly in the order the teacher ranks them
1. **No audio at all.** This is a *spoken* dialect and the biggest hole. Browser
   speech synthesis is not an answer — it reads Modern Standard Arabic and would
   actively teach the wrong pronunciation. The honest version is the teacher
   recording the core words, which needs file storage and a recording UI.
2. **No search** across the 338 cards.
3. **No weak-spots view** for the teacher — which words each student keeps
   lapsing on.
4. **Months 4–6 unwritten**, and an open question about whether to realign
   months 2–3 to the teacher's original six-month theme plan.
5. **One open dialect flag:** no Tetouan-specific follow-up to `labas` has been
   found. It needs a local speaker, not more searching.

---

## 5. What I want from you first

**Research, before you write code.** Find what the best language-learning tools
actually do that this does not, and be specific and critical. I am interested in:

- **Spaced repetition done well.** Anki, SuperMemo's later algorithms, FSRS.
  Is SM-2 with two grades leaving real retention on the table here, given a
  learner doing one short session a day for six months?
- **Teaching a spoken, low-resource dialect.** Not Duolingo's gamified tree —
  look at how serious tools handle a language with no standard orthography:
  shadowing, minimal pairs, listening-first sequences, pronunciation feedback.
  What do Glossika, Pimsleur, Language Transfer, Lingq actually do mechanically?
- **Dialect-specific resources.** What exists for Moroccan Darija specifically
  (and, if anything exists at all, for northern/Tetouani varieties)? Dictionary
  projects, corpora, transliteration conventions, open datasets. Name sources.
- **Production vs recognition.** Evidence on typed recall, cloze, and
  self-graded spoken production for a learner who needs to *speak* in Tetouan
  next week.
- **Teacher-facing tooling.** What do the good tutor platforms give a teacher
  that a dashboard of ticks does not?

For each finding I want: what the tool does, the mechanism, whether the evidence
is real or marketing, and **what specifically we should steal** given the hard
constraints in §2. A proposal that needs a build step or an npm dependency is
not a proposal — it is a rewrite, and the answer is no.

Rank what you find by learning value per hour of work. Do not give me a list of
twenty ideas; give me the three you would actually do, with the reasoning.

**Then, when we build:** small, tested changes. Add checks to the Node suites in
the same style as the existing ones, and to `selftest.html`. Do not claim
something works because it parses — this project has a history of bugs that only
a running browser revealed, and of my own tests passing against the wrong thing.
If you cannot verify something, say so plainly rather than implying you did.
