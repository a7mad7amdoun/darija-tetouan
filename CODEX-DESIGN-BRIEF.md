# Design brief: make this feel worth opening every day

You are the **design and experience lead** on a working private website. Read
`CODEX-BRIEF.md` first for what the project is and what you may not break, then
`README.md`, then open the site and use it.

**Repo:** https://github.com/a7mad7amdoun/darija-tetouan
**Run it:** `python3 serve.py 8000` → http://localhost:8000 (that server sends
`Cache-Control: no-store`; plain `http.server` serves stale files and makes your
edits look like they never happened)
**Signing in:** ask Ahmed for an account. Credentials are shared privately and
never written into this repository, which is public.

Three people use this: Hamza, an American living in Tetouan; his wife; and
Ahmed, their Moroccan teacher. It is a six-month course in **Tetouani** Darija.
Not an app for a market. Design it for three named people, one of whom you can
ask questions.

---

## 1. The job

Make it feel **premium, inhabited and worth returning to**, and make studying on
it a pleasure rather than a duty. The content is strong and the learning
mechanics were just rebuilt. What is missing is craft: atmosphere, pacing,
typographic care, moments that reward attention.

**"Entertainment" here does not mean gamification.** No points, no leaderboards,
no badges, no mascot, no confetti. There are two learners and their teacher sees
their work — a leaderboard between a husband and wife is a bad idea, and extrinsic
rewards are exactly the wrong instrument when the real reward is being understood
by your neighbour on the stairs. What it *does* mean: a session that feels good in
the hand, transitions that make sense of where you are, a reveal that lands, a
finish that feels earned, and a site that looks like Tetouan rather than like a
language app.

**"Inspiration" means the city.** Someone should open this and want to go
outside and talk to someone.

---

## 2. Research, in this order

Do this before designing. Record what you find, with sources, in
`RESEARCH-LOG.md` (follow the format already there — it has a status vocabulary
and you should use it).

**1. Tetouani Darija.** The speech itself is the atmosphere. Read `data/dialect.js`
and `data/month*.js`. Understand what makes this dialect its own thing:
pre-Hilalian city speech, Andalusi substrate, a Spanish-protectorate loanword
layer, `ق` preserved rather than shifted. Learn what the `scope` field means
(`mdini` / `tetouan` / `north`) and why it must never be flattened.

**2. Tetouan.** The place, properly. The medina, the white and ochre walls, the
Andalusi gardens, the Hispano-Moorish ironwork, the particular blue, the
Riffian backdrop, Martil and the coast, the Spanish colonial grid outside the
walls, the artisan schools, zellij and carved plaster. What does an ordinary
Tuesday there look like? Find real references, not stock "Morocco".

**3. Moroccan Darija.** What the students will hear from visitors and media, and
how it differs. This is context, not the target.

**4. Morocco.** Broadest context, least weight — and the easiest place to go
wrong, because the visual clichés of "Morocco" are not Tetouan.

**Then research the craft:** what makes a learning product feel expensive rather
than busy. Look at how serious reading, music and reference products handle
typography, rhythm, restraint and motion. Name specific products and say what
exactly you would take. Distinguish what is demonstrated from what is taste.

---

## 3. What is already decided, and is not yours to redo

This has been designed once already, deliberately, after an explicit instruction
not to produce the generic AI-design default (warm cream background, serif
display face, terracotta accent). **Do not drift back toward it.**

Keep, and build on:
- The token system in `assets/styles.css`. Tokens on `:root`, redefined for dark.
- **Dark mode as a real second design**, not an inversion. Both must be good.
- The single typeface (Space Grotesk) + Noto Naskh Arabic for Arabic.
- The signature motif: the overlaid square/diamond mark.
- The Tetouan photographs already in `assets/`, used as washes rather than decoration.
- Phone-first bottom bar, laptop sidebar.
- **The content order, which is a teaching decision and not a layout one:**
  1. plain-English explanation 2. Tetouani in Latin letters 3. Arabic with
  harakat 4. broader Moroccan form, clearly labelled. Audio sits *under* the
  written forms; it never replaces them.

Hard technical limits, from `CODEX-BRIEF.md`:
- **No build step, no npm, no framework, no bundler, no TypeScript.**
- Every path relative — GitHub Pages serves this under `/darija-tetouan/`.
- Opening `index.html` straight off the disk must keep working.
- Must stay usable offline.
- Accessible: real focus states, keyboard reachable, sufficient contrast in both
  themes, no meaning carried by colour alone, respects
  `prefers-reduced-motion`.

---

## 4. Where to spend your effort

Ranked. The first is worth more than the rest together.

**1. The session screen (`#/today`).** This is the screen they see every day and
the only one where polish compounds. It currently walks: new word → cover-recall
→ typed production → quick check → done. Make it feel like one continuous thing
rather than a slideshow of states. Pay attention to:
- how it reads at arm's length, on a phone, while saying words out loud
- the reveal moment, which is the emotional beat of the whole product
- the typed step on a phone keyboard. Typing transliterated Darija on iOS is
  genuinely unpleasant. Consider tap-to-assemble from syllables instead of free
  text — but check with Ahmed before changing what counts as a correct answer.
- the finish. It should feel earned and then get out of the way.

**2. Audio, when it arrives.** `AUDIO-RECORDING-CHECKLIST.md` has 32 utterances
awaiting Ahmed. **There are no recordings yet, and you must not fake any** — no
speech synthesis, no stand-in clips. Design the play control, the listening
state, and what a card looks like when sound is the primary thing. Design it so
it activates when clips land rather than requiring a second pass.

**3. The card.** 338 of them, and `UI.vocabCard` renders every one. Small
improvements multiply. Four scripts and registers on one card is a real
typographic problem; it is currently solved adequately and could be solved well.

**4. Reading and listening pages** — `#/situations`, `#/dialogues`,
`#/sentences`. Long-form, and currently the least considered. The dialogues in
particular want to feel like overhearing a conversation.

**5. The teacher workspace.** Ahmed uses it weekly, not daily. Dense is fine;
confusing is not.

---

## 5. Rules

- **Small, independently reviewable changes.** Not a wholesale redesign. If you
  find yourself rewriting `assets/styles.css`, stop.
- **Do not invent linguistic content.** No new words, translations, harakat,
  claims about Tetouan usage, or "a local would say". If a design idea needs
  content that does not exist, write it down as a request for Ahmed.
- **Stay out of these files** — they are owned elsewhere and are being worked on:
  `js/storage.js`, `js/schedule.js`, `js/attempts.js`, `js/sync.js`,
  `js/migrations.js`, `js/validation.js`, `js/db.js`, `supabase/*`. If a design
  change needs something from one of them, say so rather than editing it.
- **Verify in a real browser, on a phone viewport, in both themes.** Passing a
  unit test is not evidence that a page looks right. Say explicitly which
  screens you actually looked at and which you did not — this project has lost
  real user data to a confident claim that was not checked.
- Run the existing suites before you finish:
  `node <harness>/render.js` plus the others, and open `selftest.html`.

## 6. Finish with

What you changed and why · what you researched, with sources and what each
supports · which screens you verified in a browser and which you did not · what
you deliberately left alone · anything you need from Ahmed, listed precisely.
