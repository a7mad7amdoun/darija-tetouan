# Next moves — the engineering and evidence half

Design and experience are being handed to a separate agent
(`CODEX-DESIGN-BRIEF.md`). This is the other half, and the two must not collide:
**design owns the views and the stylesheet; this owns storage, scheduling, sync,
evidence and the teacher's instruments.** Where they meet, say so rather than
reaching across.

Ranked by expected learning value per hour of work, which is the project's
stated criterion. Not by how interesting it is.

---

## 1. Two devices still will not agree about a schedule  *(correctness)*

**The defect.** `Sync.mergeRemote` decides whether to accept an incoming
last-write-wins value by comparing `incoming.at` against **`doc.updatedAt` — the
whole document's timestamp**, not the key's. Any local write to any key
therefore blocks every incoming update to every other key. Two devices never
converge on `sched:`, `rate:` or teacher text.

Found during independent review of this session's work, verified by reading, and
left unfixed on purpose because half-fixing a merge rule is worse than leaving a
known one. It is now the most important thing outstanding.

**Why it matters more than it looks.** Schedules are now the backbone of the
course. A phone and a laptop that disagree about when a word is due means the
word is either drilled twice or missed, silently, on whichever device lost.

**Acceptance.** Per-key timestamps, stored without changing the meaning of any
existing entry and without a migration that rewrites progress. Two simulated
devices, each writing different keys offline, converge after both sync. A device
that wrote nothing accepts everything. An older value never beats a newer one.
No existing document becomes invalid.

**Risk.** This is the one item here that touches the data model. Backup →
validate → test before anything else.

---

## 2. Tell Ahmed whether the app is lying to him  *(instrument)*

**The question.** Every number the app shows rests on a learner's self-report:
"I had it", after the answer was on screen. The research is unkind — L2
self-assessment of speech correlates about r ≈ .44 with what a listener actually
hears, and the weakest speakers overestimate most. If that signal is bad, every
interval in the system is built on a fiction, and nobody would know.

**The measurement, from data already collected.** For each card, find pairs
where a self-graded `recall` marked "I had it" was later followed by a
machine-checked `produce` attempt. Compute
`P(typed produce correct | prior self-graded "I had it")`.
Near 0.9 and the self-grades are trustworthy. Near 0.5 and they are not.

**Acceptance.** A small panel in the teacher workspace, per student, that states
the figure, the sample size, and — when the sample is too small to mean
anything — says so instead of showing a number. It must never present a
self-report as verified pronunciation. It must be honest that this measures
agreement between two of the app's own signals, not speaking ability: only Ahmed
measures that.

**Why this ranks second.** It costs little, and it is the only thing in the
project that can tell us the rest of the project is working.

---

## 3. Let the teacher's judgement reach the learner's queue  *(closes the loop)*

The weak-spots view now shows Ahmed what to teach next, and he can mark whether a
word is a retrieval, listening, pronunciation or content problem. **Nothing
happens with that.** The daily session cannot see it.

**Acceptance.** Ahmed can mark a word as a target for the next session; that
word is pulled forward into the learner's queue, labelled as the teacher's pick
rather than the algorithm's; marking it does not corrupt the schedule or fabricate
review history; a target is per student, stays teacher-only, and clears when it
has been practised. Targets append rather than replace, like observations.

---

## 4. The dialect sources have never been audited  *(evidence)*

`data/dialect.js` carries ten contrasts, each with a cited source and a
confidence level. **Nobody has checked that the sources say what the claims say.**
The agent assigned to it stalled before reporting, and I will not pretend
otherwise. Open question Q4 in `RESEARCH-LOG.md`.

**Acceptance.** Every claim either confirmed against a locatable source, or
downgraded and flagged in the file. No new linguistic content invented to fill a
gap. Note the `labas` follow-up is **already resolved** in `data/flags.js` by a
native Tetouani speaker via Ahmed — my earlier briefs called it open and were
stale. Preserve that status and its attribution; do not re-search it, and do not
restate a local confirmation as something I verified.

---

## 5. Not now, and why

- **Months 4–6.** Until this week the scheduler would have shown Hamza about
  half of months 1–3. Content was never the constraint.
- **FSRS.** Its published advantage is prediction accuracy on logged reviews,
  not a measured learning outcome, and the part that creates the advantage needs
  per-user optimisation — a toolchain this project has ruled out, and more review
  history than two learners will generate in six months.
- **Anything needing a browser.** Still blocked: headless Chrome here cannot open
  IndexedDB. State it every time rather than implying otherwise.
- **Audio content.** Blocked on Ahmed. The infrastructure is built and waiting.

---

## Standing rules for this work

Small, independently reviewable changes. Add checks to the existing Node suites
in their style and to `selftest.html`. Never claim something works because it
parses or because tests pass — four tests in this project passed while testing
nothing, and one of them stood behind a claim that was false. Never run an
unscoped delete against the live database; the test suites use the
`selftest@darija-tetouan.com` account and clean only their own keys. Do not push
or deploy. Keep uncertainty visible in `RESEARCH-LOG.md`.
