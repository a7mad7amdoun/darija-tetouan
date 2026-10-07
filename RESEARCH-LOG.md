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

**Decision.** Replaced with dated scheduling (SM-2, two grades, 180-day cap).
**Status:** implemented, 29 automated checks.
**Still open:** whether SM-2's steps suit one short daily session over six
months — under review by the learning-design agent. FSRS is explicitly out of
scope for this round.

---

## R2 · Was one day's practice counting as several reviews?

**Problem.** `Sched.grade` advanced the interval on every correct answer, with
no same-day guard. Answering in the session and again in a test an hour later
advanced the card twice.

**Evidence.** Reproduced: four correct answers in one process advanced the
interval four times. Eight call sites feed one schedule.

**Decision.** A card advances at most once per calendar day; later answers the
same day are recorded as attempts with `sched: 'hold'`.
**Status:** implemented, verified by test.
**Risk, visible not hidden:** the guard uses the device's local calendar day.
Travel or a clock change could in principle allow a second advance. Judged
acceptable for two learners in one city; noted here rather than papered over.

---

## R3 · Does recognition prove production?

**Problem.** Picking the right option from four advanced a card exactly as much
as producing it cold. Nothing distinguished them.

**Evidence.** Mechanically true in the old code: `markFam(id, correct)` took no
task argument. Whether recognition *transfers* to production is a research
question, not a code question — **under review**.

**Decision, provisional.** Attempts now record how a word was asked. A card
whose successes are all recognition has its interval capped at 21 days until one
unaided production success is on record.
**Status:** implemented. **The 21-day figure is `unverified`** — it is a
judgement, not a finding, and is the first thing to revise if the evidence says
otherwise.

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

## Open questions

| # | Question | Status |
|---|---|---|
| Q1 | Is a Tetouan-specific follow-up to `labas` attested? | **awaiting Ahmed** — searching has failed repeatedly; needs a local speaker, not more searching |
| Q2 | Do the SM-2 steps suit one short session a day for six months? | under review |
| Q3 | Is the 21-day recognition cap defensible, or invented? | under review |
| Q4 | Do data/dialect.js's cited sources support their claims? | under audit |
| Q5 | Which general-Moroccan forms would cause *misunderstanding*, not just a foreign accent? | under review |

## Backlog, ranked by expected learning value per hour of work

Not authorised; recorded so it is not re-derived each time.

1. **Listening discrimination** between Tetouani and general Moroccan forms —
   needs R4 recordings first.
2. **Teacher-set lesson targets** carried from the weak-spots view into the next
   session's queue.
3. **Situations as whole recorded scenes**, rather than single words.
4. **Cloze on real sentences** using the existing 76-sentence bank.
5. Months 4–6 — explicitly out of scope without a separate instruction.
