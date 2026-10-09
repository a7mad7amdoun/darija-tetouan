# Research log

One entry per question that changed, or failed to change, a decision. Entries
are updated in place rather than appended to, so this stays a current picture
and not a diary. Each records what the evidence supported, what it did not, and
what is still unverified.

**Status vocabulary**
`attested` — a source directly supports it · `inferred` — reasoned from
something attested · `awaiting Ahmed` — needs a local speaker · `unverified` —
asserted by nobody credible yet, including me.

---

## R1 · Was the review schedule retiring words?

**Problem.** The session chose review items with `strength < 3`, and two correct
answers made a word "solid". A word was therefore retired on the day it was
first learned.

**Evidence.** Read directly from the code, not inferred: `views-today.js`
`plan()` filtered on `UI.strength(c.id) < 3`, and `components.js` `strength()`
returned 3 at `rate >= 0.8 && r >= 2`. Confirmed by test: two correct answers
produced strength 3 and the card never reappeared.

**Decision.** Replaced with dated scheduling (SM-2, two grades).
**Status:** implemented, 33 automated checks.
**Revised after review:** the 180-day cap was itself a retirement mechanism —
an interval of 180 days inside a 180-day course removes a word for good, which
is the failure this entry was written to fix, reached by another route. Cepeda
et al. (2008) put the useful study gap at roughly 10–20% of the retention
interval, about 18–36 days for a six-month horizon. **Cap now 60 days.**
**Also fixed:** ease could only ever fall — `EASE_DROP` on every lapse with no
path upward, so a word that was hard in week 2 stayed punished for six months.
Ease now recovers by 0.10 after four consecutive successes, to a ceiling of its
starting value.
**Rejected:** porting FSRS. Its published advantage is prediction accuracy on
logged reviews, not a measured learning outcome; the part that creates the
advantage is per-user parameter optimisation, which needs a toolchain this
project has ruled out and far more review history than two learners will
produce in six months.

---

## R2 · Was one day's practice counting as several reviews?

**Problem.** `Sched.grade` advanced the interval on every correct answer, with
no same-day guard. Answering in the session and again in a test an hour later
advanced the card twice.

**Evidence.** Reproduced: four correct answers in one process advanced the
interval four times. Eight call sites feed one schedule.

**Decision.** A card advances at most once per calendar day; later answers the
same day are recorded as attempts with `sched: 'hold'`.
**Supported by evidence:** Nakata (2016, *SSLA*, N=98, two-week delayed
posttest) compared 1, 3, 5 and 7 retrievals within a session: more retrievals
meant more absolute learning, but **with time-on-task controlled, one retrieval
gave the largest gain**. Extra same-session repetition is poor value per minute.
**Status:** implemented, verified by test.
**Two defects found in the first version and fixed:**
- the guard was `answeredToday(id) && s.a === today`, an AND of two conditions
  either of which going stale re-opened double advancing. An empty attempt log
  with an intact schedule let a 180-day card advance again the same day.
  Now `s.a === today` alone, which is self-contained.
- every date was UTC while Tetouan runs UTC+1, so 00:00–01:00 local counted as
  the previous day — enough to allow a second advance and to miscredit a streak.
  All dates now go through one local-day function.
**Also fixed, an asymmetry:** success was capped at once a day while *failure*
was uncapped, so the least diagnostic task in the system — a mis-tapped
multiple-choice option — could lapse a card, drop its ease permanently and reset
it to zero, including a word taught ninety seconds earlier. A failed
recognition, match, listen or exam item now halves the gap and returns the card
tomorrow **without** recording a lapse or touching ease. Only a failure to
produce is a full lapse.

---

## R3 · Does recognition prove production?

**Problem.** Picking the right option from four advanced a card exactly as much
as producing it cold. Nothing distinguished them.

**Evidence.** Mechanically true in the old code: `markFam(id, correct)` took no
task argument. Whether recognition *transfers* to production is a research
question, not a code question — **under review**.

**Decision, provisional.** Attempts now record how a word was asked. A card
whose successes are all recognition has its interval capped at 21 days until one
*checked* production success is on record.

**What the evidence says.** The recognition/production asymmetry is real and
well documented — Webb (2005, *SSLA*) shows the direction of practice determines
which aspects of word knowledge develop. **But no study was found testing a
format-gated interval**; searches turned up only vendor blog content. The gate
is a plausible mechanism, not a demonstrated effect. One directly on-point study
cuts the other way: Terai, Yamashita & Pasich (2021, *SSLA* 43(5), N=28) found
that for *lower-proficiency* learners receptive retrieval was **more** effective
than productive, the productive advantage appearing only at higher proficiency.
Hamza and his wife are beginners. Small N, one study — but it points away from
penalising recognition early.

**Status:** `unverified by evidence`, retained as a judgement, and now
honestly implemented. The 21 days remains a guess.

**A serious defect found and fixed.** The gate was inert, and worse than inert.
The cover-reveal step recorded `task: 'recall'` with no `assisted` flag, and
`recall` counted as production — so tapping "Show me →" and then "I had it",
*with the answer on screen*, registered as an unaided production success on the
first review of every card and lifted the cap forever. By `attempts.js`'s own
definition of `assisted` ("the answer was shown … before answering") every such
verdict is assisted. It is now recorded as assisted, and only the **typed**
production step — which something other than the learner checks — lifts the cap.
**Existing cards are grandfathered:** a card carrying reps from before attempts
were recorded is not capped, because capping it would silently rewrite an
interval that was legitimately earned. Without that, a 90-day interval collapsed
to 21 on its next review.

**Related, on self-grading.** Trofimovich et al. (2016) found L2 self-assessment
of speech largely miscalibrated, weakest speakers overestimating most, and
**uncorrelated with listener ratings for accentedness**. Li & Zhang (2021,
meta-analysis, 67 studies) put self-assessment/performance at r ≈ .44 for
speaking. A self-report is worth recording; it is not worth letting it decide
that a word is mastered. Response latency is now logged on every attempt — an
objective signal that costs one integer and cannot be recovered retrospectively.

---

## R4 · Audio: can any of it be generated?

**Question.** The course has no audio, which is the largest gap in teaching a
spoken dialect. Could speech synthesis fill it?

**Finding.** No, and this is not a close call. Arabic TTS voices read Modern
Standard Arabic. Tetouani is a pre-Hilalian city dialect; MSA pronunciation of a
Tetouani phrase teaches a register nobody speaks in Tetouan, which the learner
would then have to unlearn. A national-Darija clip is no better: the gap between
national and Tetouani is the reason this course exists.

**Decision.** Real recordings from an approved Tetouani speaker, or nothing.
Missing clips are shown as missing. **Status:** infrastructure implemented and
tested; **no recordings exist**. `AUDIO-RECORDING-CHECKLIST.md` lists 32
utterances for Ahmed.

---

## R5 · Where can private recordings safely live?

**Finding.** `assets/` on GitHub Pages is publicly retrievable. The sign-in
screen protects the application, not the files.

**Decision.** For 32 everyday phrases, a public path is judged acceptable —
this is vocabulary, not private material. The alternative (Supabase Storage,
private bucket, read restricted to signed-in users) is **prepared and not run**
in `supabase/audio-storage.sql`, because it changes production infrastructure
and that is Ahmed's decision. **Status:** awaiting Ahmed.

---

## R6 · Could a teacher's note about one student reach the other?

**Problem.** Per-student assessments are new. Teacher data lives in one shared
document, and `shared_data` rows can be marked student-visible.

**Evidence.** `shared_is_student_visible()` returns true only for `cardnote:%`,
`flagres:%`, `customCards`, `customSeq`. `obs:` and `target:` are not in that
list, so `read_state()` does not return them to a student.

**Decision.** Per-student observations keyed `obs:<studentId>:<cardId>`, routed
to the teacher's own document, and the schema now says in a comment that
anything added to the visible list is readable by both students.
**Status:** implemented; isolation covered by tests and **under independent
review**. Note the fence is the RLS policy, not the client routing.

---

## R7 · Does the course actually finish?

**Problem.** Found by simulating the real `grade()` and `plan()` over 180 days,
not by reading the code. The backlog thresholds added in this round —
`BACKLOG_SLOW = 6`, `BACKLOG_PAUSE = 12` against `REVIEW_PER_SESSION = 10` —
were sized for a deck of a few dozen cards. Against 326 drillable cards they
self-lock: new words first blocked around day 14 and blocked or slowed for most
of the course.

| | introduced by day 180 | days new words blocked |
|---|---|---|
| before the fix, 85% accuracy | **182 / 326** | 95 of 180 |
| before the fix, 75% accuracy | **110 / 326** | 129 of 180 |
| now, 95% accuracy | 326 / 326 | 0 |
| now, 85% accuracy | 326 / 326 | 2 |
| now, 75% accuracy | **241 / 326** | 91 |

Three months of written content, and the learner would have met about half of
it. **Months 4–6 were never the bottleneck; the scheduler was.**

**Decision.** `NEW 5 / REVIEW 25 / SLOW 25 / PAUSE 50`, read by the simulation
directly from the shipping source so the two cannot drift apart.

**Honest limit, not tuned away.** At 75% accuracy a quarter of the course is
still not reached, because review correctly takes priority over new material —
that is the trade-off working as intended, not a bug, but Ahmed should watch for
it. The simulation also does not model the new in-session retrieval, which adds
load. **Status:** fixed and simulated; `unverified` in real use.

---

## R8 · Does presenting a word teach it?

**Problem.** The `learn` step showed a word and asked nothing. Its only possible
retrieval that day was the closing check, which drew 4 questions at random from
~14 cards — so roughly three of every four new words were never retrieved at all
on the day they were taught.

**Evidence.** The testing effect, plus within-session spacing; Nakata (2016)
again for one retrieval being where the value lies, and Nakata & Suzuki (2019,
*MLJ*) for not placing it adjacent — interleaving lost on the immediate
posttest and won on the delayed one, which is the usual trap.

**Decision.** Every new word now gets exactly one retrieval later in the same
session, spaced about five items away rather than immediately after.
**Status:** implemented. **Expect the session to feel harder** — on this
evidence that is the sign it is working, not a regression.

---

## R9 · Two devices could not agree about a schedule

**Problem.** `mergeRemote` decided whether to accept an incoming
last-write-wins value by comparing its timestamp against **`doc.updatedAt` — the
whole document's** — rather than the key's. Any local write to any key therefore
blocked every incoming update to every other key, for as long as the learner
kept using the app at all.

**The precise failure**, now a test: key B arrives from the phone at 10:00; the
laptop writes key A at 12:00; the phone sends a newer B from 11:00. It is newer
than the laptop's B and must win, but 11:00 looked stale against the document's
12:00, so it was rejected. Schedules, ratings and teacher notes never converged.

**Decision.** Per-key write times in `doc.at`, a **sibling of `entries`** rather
than a change to them — so no existing document becomes invalid and no migration
touches anyone's progress. A key written before this existed has no entry in the
map and falls back to the document timestamp, which is the previous behaviour
rather than a worse one.

**Status:** fixed, 19 checks, including that the test fails if the fix is
reverted. `mergeRemote` and `mergeShared` are now exported: they are the most
consequential logic in the project and were previously reachable only through a
network round trip, which is how a comparison against the wrong timestamp
survived in them.

**Known limit:** a backup carries `entries` but not `at`, so a restored document
falls back to document-wide comparison until each key is next written. Judged
acceptable — timestamps are metadata, not progress — and recorded rather than
hidden.

---

## R10 · Three ways the course could not finish, and only one was the one I fixed

**What I claimed.** That the backlog thresholds self-locked the course, measured
by "simulating the real `grade()` and `plan()`".

**What was true.** The 202-of-326 figure was real. The cause was not. The
simulation reimplemented the scheduler inside the test file — a copy of the
*pre-fix* `grade()`, with no soft failures, no recognition cap, no ease
recovery, no same-day hold — and drew from all 326 cards rather than the 51 a
session can actually reach. It would have passed with `schedule.js` deleted.
Independent review caught this. **The thresholds were never binding: blocked
days were zero at every accuracy.**

**The three real constraints, all found by driving the real code:**

1. `pool()` applied the course-and-week filter to **review** as well as new
   material. The day the learner reached month 2, all 125 month-1 cards left
   the review pool for good — schedules going overdue forever, the teacher's
   weak-spots view still ranking them, the session unable to serve them.
   "Nothing is ever retired" was true of the scheduler and false one layer above
   it. Review is now drawn from everything introduced, from any month.
2. New words were gated on the **week** advancing, which needs day and
   self-check ticks made on the Week pages. The session does not make those. A
   learner who only opened the session stayed on week 1 for six months.
3. New words were gated on the **course** advancing, the same way. A learner
   finished month 1 and then drew new words from nowhere — 125 of 326.

Both gates now pace themselves by what has actually been introduced. The week
and course ticks remain what they were, the learner's and teacher's own record
of having worked through a week; they no longer decide what can be taught.

**Measured, now honestly:** 326/326 at 95% and 85% accuracy, at 14 and 20
reviews a day, no blocked days. 267/326 at 75%.

**And a seam that mattered.** Reassigning `Sched.todayStr` from a test did not
reach the module's internal calls, so a 180-day simulation had been measuring a
single day 180 times. `Sched.setClock()` now exists for exactly this. The most
consequential logic in the project was not simulable, which is how a scheduling
claim went unchecked in the first place.

---

## R11 · Five more ways progress was being lost

All found by independent review of the previous round. All verified by probe
before being changed.

1. **The teacher's session log was destroyed on the first pull.** The array-union
   branch I added indexed elements by `id`; session entries are
   `{date, week, note}` with no id, so the index came out empty, the array came
   out empty, and the log was replaced with `[]`. It destroyed exactly the data
   it was written to protect. Arrays without ids now union by content, because
   last-write-wins is the wrong rule for a log — a device holding three lesson
   notes against a server holding one is not the stale one.
2. **Only the first test result and the first exam result ever synced.**
   `Tests.results()` and `Exams.results()` hand back the stored array and
   `record()` pushes onto it, so `Storage.set` captured "before" and "after" as
   the same object and the sync layer found no change. Fixing `fam()` last round
   fixed one of four such getters. `Storage.set` now snapshots, which fixes the
   class rather than the instances.
3. **`mergeShared` had the same whole-document timestamp bug** I had just fixed
   in `mergeRemote`, and kept no conflict record, so a superseded teacher note
   vanished with no trace.
4. **Grandfathering lasted one review.** It read the attempt log, and
   `Attempts.record` runs after the schedule is written, so a 90-day interval
   became 60 on one review and 21 on the next. It is now a durable flag on the
   record.
5. **The new interval ceiling rewrote existing long intervals.** 180 → 60 is
   well argued, but applying it to an earned 150-day interval is the same silent
   reinterpretation. The ceiling now caps growth and never shortens what is
   already there.

Also: soft failures were uncapped, so five mis-taps took a 53-day card to 2 in
one sitting. Ease recovery said "consecutive" and counted reps, so alternating
wrong and right climbed back to maximum while failing half the answers. The new
first retrieval of a word gave it a full lapse on the day it was taught. All
fixed, all covered.

---

## R12 · A phoneme I should not have collapsed

`normalise()` mapped `gh → r` so that typed answers would accept either
spelling. غ and ر are **different phonemes, distinguished in Tetouani**.
Accepting one for the other is not leniency about spelling, it is accepting a
different word — and since the typed step is now the only thing that lifts the
production cap, it is the one place leniency has scheduling consequences.

**Removed.** `kh/x`, `sh/ch/c` and `9/q` remain: those are one sound written two
ways, and the learners see the French-influenced spellings on every menu in
Morocco. **Status: `awaiting Ahmed`** — whether any further leniency is right is
a dialect judgement, not mine.

---

## R13 · The vocabulary finder had the same bug for the third time

**Problem.** `js/views.js` rendered the vocabulary page from
`UI.allCards(UI.activeCourses()[0])` — month 1 only — while the month chips
below it were built from a different course object. Selecting **Month 2** or
**Month 3** compared `courseId` against a pool containing none of them, so the
page said *"Nothing matches"* about 202 words that exist. `js/app.js` repeated
the same pool when the search box changed, so typing silently narrowed results
to one month.

Reported by Codex from an isolated browser session; reproduced here before any
change. **This is the third instance of one mistake** — the teacher's weak-spots
panel and the daily session's pool had it too, found in earlier rounds. A
course-scoped accessor was being used where a whole-course one was needed.

**A trap I was warned off, and verified.** `UI.allActiveCards()` could not just
be substituted: `allCards(course)` appends the teacher's added cards, so calling
it per course emitted **every teacher card three times**, stamped month1, month2
and month3 in turn. Measured: one custom card, three copies, 341 records for 339
distinct ids. Anything looking a card up by id took whichever came first — which
includes my own audio click handler and weak-spots panel.

**Decision.** `courseCards(course)` holds a course's own cards; `allCards`
remains course-plus-teacher for single-course listings; `allActiveCards()`
deduplicates by stable id, keeps the teacher's cards once with their own
affiliation rather than a borrowed month, and **reports colliding ids** instead
of silently preferring the first record — a collision means two pieces of
content claim one identity, which is a content problem, not a display problem.

**Also in the finder:** search now reaches Arabic, with harakat and tatweel
stripped **in a throwaway index only** — the stored text is never altered and no
transliteration convention is imposed on the query. Distinct letters are not
folded. The empty state now distinguishes *"no match under this filter, but N
elsewhere"* from *"nothing in the course matches this"*, the first offering an
explicit widening action rather than silently changing what the learner chose.
The active scope and count are stated in words next to the box.

**Status:** fixed, 29 checks, including that searching and filtering write
nothing to progress.

---

## R14 · One status badge, two shells, one id

`index.html` carried `id="syncbadge"` twice — once in the laptop rail, once in
the phone topbar — and `paintSyncBadge` used `getElementById`, which returns the
first. Whichever shell was in use on a phone showed a sync status that never
changed. Reported by Codex from source inspection; confirmed by count. Both are
now marked with a data attribute and all of them are painted.

---

## R15 · A correction from outside: the `labas` question was already answered

`data/flags.js` records `labas-followup` as **resolved**, attributed to a native
Tetouani speaker via Ahmed: *there is no distinct Tetouani follow-up; the
national form is what Tetouanis use, and the Tetouani colour comes from `ntina`
rather than a different phrase.*

**I had it listed as open in three separate documents** — `CODEX-BRIEF.md`,
`NEXT-MOVES.md` and this log — and had twice told Ahmed it needed a local
speaker it had already had. All three are corrected. The status and its
attribution are preserved as recorded; a local confirmation is real evidence and
is also not independent verification by me, and it should be neither reopened
nor strengthened.

---

## R16 · The photograph library, and what it obliges

Twelve photographs curated from 248 candidates, each with a teaching purpose,
crop guidance and alt text. Recorded in `data/photo-library.js`.

**One is installed.** Feddan Square, Tetouan, CC0 — a named landmark the course
can use for directions, and public domain so it carries no obligation. Served as
800px and 1600px derivatives; the original is kept separately.

**Eleven are links only** — recorded, not downloaded, marked `local: null`, and
not referenced from any page. The valuable half are the situational ones the
existing 21 photographs do not cover: a café, a taxi, a market, a bakery, mint
tea, a meal, a craftsman, lanterns.

**Why I installed only one.** The second available download, the Spanish
quarter, duplicates `ensanche` and `spanish-tower` already in the repository,
and its own record warns its sky is heavily processed. The library's
instructions warn against image repetition, so near-duplicates were not added.

**The licensing is a decision for Ahmed, not a design choice.** Eight of the
twelve are **CC BY-SA 4.0**: attribution *and* share-alike, and a cropped,
resized copy in a public repository is an adaptation. Nothing carrying a
share-alike obligation has been installed. `assets/photos/CREDITS.md` records
all of it — and did not exist before, which was an oversight for the 21
photographs already shipping.

**A standing caution.** A place label says where a photograph was taken. It is
not linguistic evidence. A bakery in Fes illustrates buying bread; it attests
nothing about how bread is asked for in Tetouan. The northern market's city is
unconfirmed in its own source record and must never be captioned Tetouan.

---

## Open questions

| # | Question | Status |
|---|---|---|
| Q1 | Is a Tetouan-specific follow-up to `labas` attested? | **CLOSED — there is none.** A native Tetouani speaker confirmed through Ahmed that the national form is what Tetouanis use, and the Tetouani colour comes from `ntina`. Recorded in `data/flags.js` as resolved. I had this listed as open across three documents; that was stale and the correction came from outside |
| Q2 | Do the SM-2 steps suit one short session a day for six months? | **answered** — steps fine, the 180-day ceiling was not (R1) |
| Q3 | Is the 21-day recognition cap defensible, or invented? | **answered: invented.** No study found testing a format-gated interval, and the one on-point study points the other way for beginners. Kept as a judgement, labelled as one (R3) |
| Q4 | Do data/dialect.js's cited sources support their claims? | **not done** — the agent assigned to it stalled before reporting. Unaudited |
| Q5 | Which general-Moroccan forms would cause *misunderstanding*, not just a foreign accent? | **not done** — same stalled agent |
| Q6 | What is P(typed produce correct \| a prior self-graded "I had it")? | **next up** — the instrument is item 2 in `NEXT-MOVES.md`. If ≈0.9 the self-grades are fine; if ≈0.5 every interval rests on a fiction |
| Q7 | Does the app's picture of a word match what Ahmed hears? | only the teacher can answer this. Nothing in the app measures speaking |
| Q8 | Should typed answers accept any further spelling variation? | **awaiting Ahmed** — `gh/r` was removed as a phoneme collapse (R12) |
| Q9 | Do students' own feedback notes ever reach the server? | **open defect** — `apply_changes` refuses a non-teacher writing shared data without marking the change accepted, so it retries forever and `pending` never clears. Needs a schema change, prepared not applied |

## Backlog, ranked by expected learning value per hour of work

Not authorised; recorded so it is not re-derived each time.

1. **Listening discrimination** between Tetouani and general Moroccan forms —
   needs R4 recordings first.
2. **Teacher-set lesson targets** carried from the weak-spots view into the next
   session's queue.
3. **Situations as whole recorded scenes**, rather than single words.
4. **Cloze on real sentences** using the existing 76-sentence bank.
5. Months 4–6 — explicitly out of scope without a separate instruction.
