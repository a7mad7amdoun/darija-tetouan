# Northern Darija — Tetouan

A private, two-person learning site: one student (Hamza), one teacher. No build step, no
dependencies, no accounts. Plain HTML/CSS/JS — open `index.html` and it works, online or off.

**All content is Tetouan / Northern Moroccan Darija.** Every card is tagged `Northern / Tetouani`.
The tag system already supports a second variety (`National Moroccan`, amber) so that if national
forms are ever added they render in a visibly different colour and can never be mistaken for
Northern content. No national-tagged content exists today.

## Running it

Open `index.html` directly, or serve the folder:

    cd darija-tetouan && python3 -m http.server 8000     # → http://localhost:8000

To use it on Hamza's phone, drop the folder on any static host (GitHub Pages, Netlify,
Cloudflare Pages — no configuration needed).

## Pages

| Route | What it is |
|---|---|
| `#/` | Dashboard — current week, progress strip, quick links |
| `#/course/month1` | Month 1 overview, week list, checkpoint link, locked Months 2–3 |
| `#/course/month1/week/1..4` | Objective, Days 1–7, that week's cards, self-check, self-rating |
| `#/vocab` | Every card, searchable, filterable by week / flagged / extras |
| `#/situations` | 8 real scenes, each a set of English→Darija sentence ladders |
| `#/dialect` | What makes it Tetouani — contrasts scoped to the city, with sources |
| `#/tests` | Six short test formats, all generated from the card data |
| `#/practice` | Flashcards (English → tap to reveal Darija) and the Month 1 checkpoint |
| `#/progress` | All weeks and months, self-marked status over time |
| `#/teacher` | Teacher dashboard — progress, test results, session log, verification queue, add-your-own-phrase, week notes, backup |
| `#/feedback` | Feedback inbox — every note you left, grouped by page, exportable as markdown |

The **Student / Teacher** toggle sits in the header and switches the whole app, not just a few
extras. Each role gets its own bottom navigation and its own home:

- **Student:** Home · Course · Talk · Vocab · Tests · Progress
- **Teacher:** Dashboard · Feedback · Curriculum · Tetouani · Content · Progress

Teacher mode also adds per-week notes, a correction box on every card, "draft · unsigned" chips on
unconfirmed entries, and the reset/backup controls.

## Scope: Tetouan, not "northern"

"Northern" covers Tangier and the Jebala too, so every researched claim carries a **scope**:

| Badge | Meaning |
|---|---|
| **Mdini · traditional Tetouani** | The original Tetouan city speech — medina families, older speakers |
| **Tetouan** | Attested for Tetouan specifically |
| **Northern · shared** | Correct in Tetouan but shared with Tangier and the Jebala — *not* the city's own |

Anything scoped `north` is visibly marked as not Tetouan-exclusive, on the card and in the guide.
Tetouan is a sedentary pre-Hilalian city dialect with an Andalusi substrate: the city was re-founded
in 1485 by Sidi al-Mandari with refugees from Granada, and took a second wave after 1492. The corpus
distinguishes two living varieties — **mdini** (traditional, receding) and **urban** (younger
speakers, levelled toward general Moroccan). Both are taught, and labelled.

## Classical Arabic line

Every card shows its Classical Arabic (فصحى) root with the English directly underneath. Tetouani is
a conservative dialect, so the resemblance is often exact — *labas* really is لا بَأْسَ, *mnin* really
is مِنْ أَيْنَ, *qrib* is قَرِيب unchanged. Where a word is **not** Arabic (Spanish *simana*, *blaya*,
*kama*) the block says so plainly, which is itself the lesson.

## Tests

Six formats at `#/tests`, all **generated from the card data** — add Month 2 and the whole suite
covers it with no new test authoring:

| Test | What it does |
|---|---|
| Quickfire 10 | Mixed multiple choice across everything |
| Picture round | Emoji prompt, no English — say it, then pick it |
| Tetouani or national? | Two real forms, one Tetouani. The test this course exists for |
| Classical roots | Match the Tetouani word to its فصحى origin |
| Fill the gap | A real line from a real scene with one word blanked |
| Say it out loud | No multiple choice — say it, reveal, self-mark |

The picture round uses **emoji, not photographs**, so the site stays offline-capable and instant.
Swap in real images later if you want them.

## Feedback

Every page carries a ✍️ **Note** button. It records what you wrote, which page you wrote it on, the
kind (wrong / missing / unclear / idea / Hamza struggled), and the date. Notes collect in the
**Feedback inbox** grouped by page, with a tick-off list and a **Copy as markdown** export — a
ready-made work list to hand over.

## Data model

All content lives in `data/`. The app reads it and never hard-codes a lesson.

- `data/flags.js` — the four verification questions and their current status
  (`open` / `partial` / `resolved`). Edit here once; every card carrying the flag updates.
- `data/dialect.js` — the researched Northern↔National contrast set, with a confidence level
  and sources. Drives the Dialect Guide page.
- `data/situations.js` — the situational sentence ladders. Adding a line is three fields:
  the English, the middle rungs, and the full Darija.
- `data/month1.js` — the course: weeks → days, vocab cards, self-checks, extras, checkpoint.
  The card shape is documented at the top of the file.
- `data/courses.js` — the registry. Month 2 and Month 3 are listed as locked stubs.

### Adding Month 2

1. Copy `data/month1.js` → `data/month2.js`; change `id`, `order`, `label`, `title`, `goal`;
   replace the `weeks` array with the new content.
2. Add `<script src="data/month2.js"></script>` to `index.html` (there is a comment marking the spot).
3. In `data/courses.js`, replace the `month2` locked stub with `window.DARIJA.month2`.

Nothing else changes. Home, Vocabulary, Practice, and Progress all pick it up automatically.

Adding a **week**, a **card**, or a **self-check item** is the same idea — edit the array, done.
A later "Sentence Patterns" module drops in as another course object.

## Sentence ladders

The Situations pages teach by code-switching rather than by memorising. Each line climbs:

    0  All English          "Hello, how are you?"
    1  One Darija word      "Hello, how are ntina?"
    2  Two Darija words     "Salam, how are ntina?"
    3  Three Darija words   "Salam, kif ntina?"
    4  Full Darija          السلام، كيف نتينا؟

Set the level for a whole scene, or step one line at a time. Hamza speaks a complete sentence from
the first minute instead of waiting until a full phrase is memorised.

Authoring is deliberately cheap — you write only the middle rungs, and the app counts the Darija
chunks itself to label each one:

```js
{ en: 'I want a tea, please.',
  mix: [
    ['I want a tea, ', { d: '3afak', ar: 'عافاك' }, '.'],
    [{ d: 'Bghit', ar: 'بغيت' }, ' a tea, ', { d: '3afak', ar: 'عافاك' }, '.']
  ],
  full: { ar: 'بغيت أتاي عافاك', phon: 'BGHEET a-TAY a-FAK' } }
```

## Content status

Content is marked by provenance, visible in Teacher view:

- **`source: 'brief'`** — supplied, confirmed.
- **`source: 'research'`** — corrected against dialectology sources; see the Dialect Guide, which
  lists every source and a confidence level per claim.
- **`source: 'draft'`** — written to fill out the lesson plan, not yet confirmed with a Tetouani
  speaker. Shows a "draft · unsigned" chip; the Teacher page lists them together.

Research resolved three of the four original flags:

| Flag | Status | Finding |
|---|---|---|
| Female form of "what is your name" | **partial** | Northern uses `ntina` for both genders — there is no female form. The pronoun is attested; the matching `-ek` suffix is inferred. |
| Follow-up to "labas" | **open** | Nothing Tetouan-specific found. Still needs a local ear. |
| Spanish loanwords | **resolved** | Confirmed and promoted into taught vocabulary. |
| ق → g shift | **resolved** | Tetouan does **not** shift q→g. It is pre-Hilalian and preserves /q/. |

Cards that carry a distinctly northern form are badged **★ Northern marker** and can be filtered
on their own in the Vocabulary library and drilled on their own in flashcards. Cards whose national
equivalent differs show an amber **National** contrast row, so the two are visible together and
never merge.

## Teacher workspace

`#/teacher`, reachable in Teacher view from Home or Progress:

- **Where Hamza is** — weeks/self-checks/ratings table, scenes fluent, checkpoint status.
- **Session log** — dated entries with what happened, kept newest-first.
- **Verification queue** — each flag with its research status, plus a box for what a local actually
  confirmed. Whatever you type there appears on every card carrying that flag.
- **Add your own phrase** — English, Arabic, phonetics, week, optional national form. It appears in
  the Vocabulary library and flashcards immediately, no code edit.
- **Per-card correction box** — every card in Teacher view has one; it renders on the card.
- **Week notes** — all four weeks in one place.
- **Backup** — copy the whole state out as JSON, or paste one back in to restore on another device.

## Storage

Progress is `localStorage` on the device, under one key (`darija.tetouan.v1`): day ticks,
self-check ticks, star ratings, checkpoint tasks and status, situation levels, session log,
teacher notes, card corrections and custom phrases. Nothing leaves the device, and the app still
renders correctly if storage is blocked (private browsing). Teacher workspace → *Reset all
progress* clears it; use *Backup* first.
