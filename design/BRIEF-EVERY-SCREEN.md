# TetouTalk: the brief for every screen

Written for whoever works on this site next, Claude or Codex, and for Ahmed
to check against. It says what each category is for, what order things come
in, and the rules that make every screen worth opening. Read it with
`AGENTS.md`, which holds the rules that do not bend.

## The five places, and why in this order

The header is five places. The order is the order of a learner's day.

| # | Place | Its question | Pages, in order |
|---|---|---|---|
| 1 | **Home** | What do I do right now? | Home · Account |
| 2 | **Learn** | What am I learning, and where are my words? | Today · Course · Fields · Words |
| 3 | **Practise** | How do I make it mine? | Flashcards · Games · Situations · Conversations · Sentences |
| 4 | **Check** | How is it going? | Tests · Quizzes · Progress |
| 5 | **Discover** | What is the city behind the words? | Library · Tetouan · Gallery · Tetouani guide |

The teacher sees three: **Teach** (Dashboard · Feedback · Recordings · Account),
**Course** (Curriculum · Content · Progress) and **Library** (the guide,
situations, conversations, sentences, tests, fields, games, gallery, map).

Rules for the header:
- One place lit, one page underlined. Never both rows empty.
- Within a place, pages run from "do this today" to "look this up". Today
  before Course; Flashcards before Sentences; Tests before Progress.
- A page lives in exactly one place. The Library mirrors the header with the
  same icons in the same order, so the two can never disagree.
- Every icon is a piece of Tetouan, in the two-tone set. The sheet is
  `design/identity/icon/icon-sheet.html`. No emoji in navigation or tiles.

## What every screen owes the person opening it

1. **One purpose, stated in the first line.** The `h1` says what the page is;
   the `.sub` under it says what to do here, in one sentence. If a page
   cannot say that, it should not exist.
2. **The first tap is the right tap.** The most useful action sits first and
   is the only filled green button on the screen. On Home that is the start
   card. On a situation it is "Start the mission". On a game it is the
   answer.
3. **Nothing hidden, nothing padded.** Progressive disclosure for detail
   (`<details>`), never for the thing the page is for. No section exists to
   fill space; no space is left empty on a laptop when a second column has
   real content for it.
4. **The reading order is the course's order.** English, then Tetouani in
   Latin letters with stress in capitals, then Arabic with harakat, then any
   broader Moroccan form, labelled. Every card, every game, every line.
5. **Honest numbers.** A count says what it counts ("44 of 326 met", "2
   missed in the last 30 days (no dates kept)"). A chart says what it is not
   ("not a forecast"). A photo says its real size. A place says if its
   position is approximate.
6. **Reading never writes.** Opening a page, a photo, a map, a note or a
   field changes nothing in the learner's record. Games write one score;
   missions write nothing; only the daily session and the tests count.
7. **Every touch is at least 44px**, keyboard reaches everything, Escape
   closes anything that opened over the page, focus returns where it was.
8. **Every screen works at 320px and uses 1440px.** One column on a phone, in
   source order. Two columns on a laptop when the page has a list and its
   support: list on the left, support on the right.
9. **Motion explains, never decorates.** The background drifts; a revealed
   answer rises; the stressed syllable is marked. During recall nothing moves.
   Reduced motion gets the same information, still.
10. **Light and dark are both designed.** Check both before saying a screen
    works.

## The layout grammar

- `h1` + `.sub`, then the body. Banners are 110px on a phone, 124px on a
  laptop, and carry "About this photo".
- `.twocol` → `.colmain` (7/12) + `.colside` (5/12) from 900px; 3/5 + 2/5 from
  1280px. Below 900px the wrapper is inert.
- `.tiles` are 2 across on a phone, 3 from 900px, 4 from 1280px; `.tiles.one`
  stays single in a side column.
- Reading text keeps a measure of about 60 characters; lists and tiles may
  go wider.
- Soft tints: mint for Home and Today, sky for Course, sand for Library,
  lilac for Account. Emerald owns the one principal action. Crimson is rare.

## How to check a screen before it ships

```
node tests/run.js                       # must pass; add a check for new behaviour
python3 design/build-preview.py         # after any change to index.html
```
Then screenshot the preview at **320, 390 and 1440px, light and dark**, and
look at it. Count the `<div`s against the `</div>`s on any page whose markup
you rewrote. Walk it with the keyboard once. Only then publish.

## What is still open

- The vocabulary batch (12 targets) and the café mission's other side wait on
  Ahmed's Darija: `design/review/VOCAB-REVIEW-QUEUE.md`.
- Recordings wait on Ahmed's voice: Teach → Recordings.
- Bab Mkabar is not on the map; it needs a pin from someone who knows.
- The two teacher graphs (words practised per day; first typed attempts) are
  designed, not built.
