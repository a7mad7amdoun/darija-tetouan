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
  `account`, `teacher`, `week`, `login`, `loginerr`. Add `&theme=dark`.
  After changing `index.html`, rebuild it: `python3 design/build-preview.py`.

Use `serve.py`, not `python3 -m http.server`: it stops the browser serving
stale CSS and JS.

## Test it

```
node tests/run.js
```

279 checks across twelve suites. They load the real `js/` and `data/` files
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
| `js/schedule.js`, `js/attempts.js` | spaced repetition and the answer record |
| `js/storage.js`, `js/sync.js`, `js/db.js`, `js/auth.js` | progress, sync, sign-in: change with great care |
| `data/month*.js`, `data/dialect.js` | the course content and the dialect guide |
| `data/photos.js`, `assets/photos/CREDITS.md` | photographs, alt text and credits |
| `assets/styles.css` | all styles; identity tokens at the top |
| `design/identity/` | Ahmed's visual identity: palette, fonts, logo |
| `design/photos/grade.py` | the colour grade applied to the photographs |
| `supabase/schema.sql` | the database and its access rules |
| `tests/` | the test suites |
| `NEXT-MOVES.md`, `RESEARCH-LOG.md` | what to build next, and why |

## Working alongside another agent

Claude also works in this repository. To avoid treading on each other:

- Pull before you start. Work on a branch named `codex/<topic>`, commit in
  small steps, and open a pull request. **Do not push to `main`**; Ahmed
  decides what goes live.
- Do not reformat or rewrite files you are not changing.
- Write commit messages that say what changed and why, and what was and was
  not tested.
