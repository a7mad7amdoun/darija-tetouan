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

## Open questions

| # | Question | Status |
|---|---|---|
| Q1 | Is a Tetouan-specific follow-up to `labas` attested? | **awaiting Ahmed** — searching has failed repeatedly; needs a local speaker, not more searching |
| Q2 | Do the SM-2 steps suit one short session a day for six months? | **answered** — steps fine, the 180-day ceiling was not (R1) |
| Q3 | Is the 21-day recognition cap defensible, or invented? | **answered: invented.** No study found testing a format-gated interval, and the one on-point study points the other way for beginners. Kept as a judgement, labelled as one (R3) |
| Q4 | Do data/dialect.js's cited sources support their claims? | **not done** — the agent assigned to it stalled before reporting. Unaudited |
| Q5 | Which general-Moroccan forms would cause *misunderstanding*, not just a foreign accent? | **not done** — same stalled agent |
| Q6 | What is P(typed produce correct \| a prior self-graded "I had it")? | measurable from the attempt log once there is data. If ≈0.9 the self-grades are fine; if ≈0.5 every interval rests on a fiction |
| Q7 | Does the app's picture of a word match what Ahmed hears? | only the teacher can answer this. Nothing in the app measures speaking |

## Backlog, ranked by expected learning value per hour of work

Not authorised; recorded so it is not re-derived each time.

1. **Listening discrimination** between Tetouani and general Moroccan forms —
   needs R4 recordings first.
2. **Teacher-set lesson targets** carried from the weak-spots view into the next
   session's queue.
3. **Situations as whole recorded scenes**, rather than single words.
4. **Cloze on real sentences** using the existing 76-sentence bank.
5. Months 4–6 — explicitly out of scope without a separate instruction.
