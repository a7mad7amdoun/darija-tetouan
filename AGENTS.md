# Working on TetouTalk

Read this first. It is for any coding agent working in this repository (Codex,
Claude, or another), and for Ahmed, who owns it.

TetouTalk is a private course in **Tetouani Darija** for exactly three people:
Hamza (an American living in Tetouan), his wife, and Ahmed, their teacher. It
is not a product for a market. Live at
<https://a7mad7amdoun.github.io/darija-tetouan/>.

**This repository is public.** Anything committed here can be read by anyone,
including in git history after it is deleted.

## Run it

```
python3 serve.py 8000
```

- <http://localhost:8000/index.html> is the real app. Not signed in, it shows
  the front page; signing in needs an account (see Accounts).
- <http://localhost:8000/preview.html?screen=home> shows any screen with sample
  data, no account and no database. Use it for design work. Screens: `home`,
  `session`, `recall`, `reveal`, `produce`, `done`, `vocab`, `card`, `library`,
  `account`, `teacher`, `week`, `login`, `loginerr`, `fbok` and `fbno` (a typed
  answer, right and not yet). Any learner page by its route:
  `screen=route&r=course/month1/week/2` (or `library`, `progress`,
  `situations/cafe`...). Add `&theme=dark`.
  After changing `index.html`, rebuild it: `python3 design/build-preview.py`.

Use `serve.py`, not `python3 -m http.server`: it stops the browser serving
stale CSS and JS.

## Test it

```
node tests/run.js
```

608 checks across twenty-one suites. They load the real `js/` and `data/` files
into Node with an in-memory IndexedDB, and **block the network**, so they can
never reach the live database. Run them before and after a change. New
behaviour gets a new check in the same style; a check must be able to fail
(run it against the old code once to prove it).

Look at what you change. Screenshot the preview at 390px and 1280px wide, in
light and dark, before saying a screen works. Headless Chrome will not make a
window narrower than 500px; use the DevTools protocol
(`Emulation.setDeviceMetricsOverride`) for true phone widths.

## Accounts

- Ahmed gives you a **test account of your own** (a student) in the chat.
  Never write its password into any file.
- Never sign in as Ahmed, Hamza or his wife, and never ask for their
  passwords. The teacher account can read the learners' progress.
- Never handle the Supabase access token (`sbp_...`), the database password
  or the service-role key. The browser may hold only the project URL and the
  public anon key, which are in `js/supabase-config.js` by design.

## Rules that do not bend

1. **Never lose a learner's progress.** No migrations, no deletes, no
   destructive SQL against the live database. A database change is written
   into `supabase/schema.sql` and left for Ahmed to run.
2. **Authorization is enforced by the database** (Row Level Security), never
   by what the browser says. Do not move a permission check into JavaScript
   and call it security.
3. **No secrets in code**, no fake authentication, no stored plaintext
   passwords.
4. **Do not rename stable things:** card and course IDs, storage keys,
   IndexedDB names, routes. Progress is keyed on them.
5. **Content order on every word:** English, then Tetouani Darija in Latin
   letters (stress in capitals), then Arabic with verified harakat, then any
   broader Moroccan form, explicitly labelled as such.
6. **Keep the scopes apart:** `mdini` (traditional Tetouani), `tetouan`,
   `north` (shared with Tangier and the Jebala), and national Moroccan. The
   colour code: Tetouani green, Moroccan indigo, north grey.
7. **Do not invent** linguistic claims, translations, recordings, or
   verification by a local speaker. If it is not in the data or a source you
   opened, it does not go on the page.
8. Vanilla HTML, CSS and JS. No build step, framework or npm dependency for
   the site. All asset paths relative (the site lives under `/darija-tetouan/`).
9. When you change CSS or JS that ships, bump the `?v=` stamp on every
   asset in `index.html`, then rebuild the preview.

## Where things are

| Path | What |
|---|---|
| `index.html` | the shell, the icon and logo sprite, script order |
| `js/app.js` | router, gates (front page, sign-in), event handlers |
| `js/views*.js`, `js/components.js` | the screens |
| `js/views-today.js` | the daily session |
| `js/catalog.js` | the eight fields: every word in exactly one (display only) |
| `js/games.js` | fifteen games; each writes one score to `testres:game:*`, nothing else |
| `js/recorder.js` | the teacher's recorder; kept clips live in the media database, never progress |
| `js/mix.js` | Darija and Fusha side by side, from each card's own `fusha` note; reads only |
| `js/say.js` | "Say it": a finder over the course's own sentences, lines and words; never generates; reads only |
| `js/graphs.js` | words practised per day (a line with a tooltip on every day); first typed answers by week (bars, a callout on the best): pure functions over copies, SVG with a table |
| `js/dash.js` | the dashboard pieces: four numbers with sparklines over a 7/14/30-day range kept in memory, the ring of word states, bars by field, the scope bar, this month's calendar, the last attempts, the account numbers; reads only |
| `js/habits.js` | rest days, today's three, mistakes, memory hooks (`hook:<id>`, text), the year, leeches; reads only otherwise |
| `js/map.js`, `data/map.js` | the map of Tetouan: an SVG plan drawn from OpenStreetMap coordinates, each place with its OSM object |
| `js/gallery.js`, `data/gallery.js` | the gallery and photo viewer; the manifest is generated by `design/photos/grade.py` |
| `js/schedule.js`, `js/attempts.js` | spaced repetition and the answer record |
| `js/storage.js`, `js/sync.js`, `js/db.js`, `js/auth.js` | progress, sync, sign-in: change with great care |
| `data/month*.js`, `data/dialect.js` | the course content and the dialect guide; `dialect.defaults`, `heard`, `who`, `listen`, `disagree` are the sourced research, every quote with its URL; `documented` carries Singer 1953 and Vicente 2017 features |
| `data/contact.js` | the other languages in Tetouani (Spanish, French, Tarifit, Jebli, Fusha, Haketia, English): sourced facts and examples in the source's transcription, never cards |
| `data/tetouan-notes.js` | short sourced notes about the city, one at a time on Home and the fields |
| `design/research/` | the evidence logs behind `contact.js` and the usage sections: what was opened, what was not found |
| `design/review/RESEARCH-CANDIDATES.md` | forms from those logs that Ahmed may turn into cards; nothing there is published as a word |
| `data/photos.js`, `assets/photos/CREDITS.md` | photographs, alt text and credits |
| `assets/styles.css` | all styles; identity tokens at the top |
| `design/identity/` | Ahmed's visual identity: palette, fonts, logo |
| `design/photos/grade.py` | the colour grade applied to the photographs |
| `supabase/schema.sql` | the database and its access rules |
| `tests/` | the test suites |
| `design/BRIEF-EVERY-SCREEN.md` | the five places, their order, and what every screen owes the person opening it |
| `design/BRIEF-TABS.md` | tab by tab: purpose, order, grouping, what is folded, and how a new fact or dialect feature is added |
| `NEXT-MOVES.md`, `RESEARCH-LOG.md` | what to build next, and why |

## Working alongside another agent

Claude also works in this repository. To avoid treading on each other:

- Pull before you start. Work on a branch named `codex/<topic>`, commit in
  small steps, and open a pull request. **Do not push to `main`**; Ahmed
  decides what goes live.
- Do not reformat or rewrite files you are not changing.
- Write commit messages that say what changed and why, and what was and was
  not tested.
