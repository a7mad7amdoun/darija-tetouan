# TetouTalk: the brief for every tab

Written for whoever works on this site next, and for Ahmed to check against.
It says, tab by tab, what the page is for, what comes first, how its contents
are grouped, and what is folded away. It extends `BRIEF-EVERY-SCREEN.md`
(the five places and the ten rules) down to each page. Applied on 13 October
2026; the research it draws on is listed at the end.

## The rules that shape every tab

1. **A page is one question, answered in its first screen.** The title, one
   sentence, then the answer. Everything else is support.
2. **Group by what the learner wants, not by what the code has.** Games by
   what they train (words, sentences, numbers), tests by what they test,
   situations by the field of life they belong to, words by four questions
   (which month, how common, how Tetouani, which topic).
3. **Every group has a name and a count.** A heading says what the group is;
   a small number says how many are in it.
4. **The first item in a group is the one to start with.** Order by use, not
   by date added.
5. **Long pages get a way through them.** More than five sections means a
   jump row at the top, and headings with anchors.
6. **New knowledge arrives with its source and its limit.** A fact names where
   it was read; a dialect feature names who recorded it and when; a date two
   sources disagree on says so.
7. **The learner's own things come first in any list that mixes them with the
   course's:** mistakes before everyday words, teacher-added before extras.

## The tabs

### Home
*What do I do right now?* Start card · Find a word · Use it outside · streak
and words · Today's three · Missed this week · Words that keep slipping · When
your words come back · The last year · a note about Tetouan · Library.
Unchanged by this pass: the order is already the order of a visit.

### Learn → Today
*The session.* Unchanged: one card, one action.

### Learn → Course, Week
*Where am I in the plan?* Two columns on a laptop: the plan on the left, the
words and the can-do list on the right. Unchanged.

### Learn → Fields
*Where do I want my words from?* Eight tiles. Unchanged.

### Learn → Words
*Find a word.* The search first. Then the filters, **in four labelled rows**
instead of one unlabelled run of seventeen chips: **Month** (Month 1 · 2 · 3,
and the weeks of the month being taught) · **How common** (Everyday · Useful
· Extra · All) · **How Tetouani** (Tetouan only · Mdini · Shared with the
north · Has a national form) · **Topic** (the groups) · **For you** (Needs
work · Flagged · Teacher added · Spanish and extras). The list follows.

### Practise → Flashcards
*Say it, then reveal.* The set chips (Today's five · Needs work · Missed this
week · Everyday · All · Tetouani markers · weeks · a field). Unchanged.

### Practise → Games
*Play on the words I have met.* Nine games **in three groups**: **Words**
(Pairs · Odd one out · Word rush · Read the script · Where is the stress?),
**Sentences and conversations** (Build the sentence · Fill the chunk · Order
the conversation), **Numbers** (Price check). Then Tests, as a pointer.

### Practise → Situations
*Rehearse a real scene.* **"When you don't understand" first, on its own,**
because it is the one scene that rescues every other. Then the seven others
**grouped by field**: Café, food and market (café · shop · market) · Getting
around Tetouan (taxi · directions) · Greetings and people (a neighbour) ·
Numbers, money and time (arranging to meet). Each tile: its photograph's
icon, its lines, its week, the learner's level.

### Practise → Conversations, Sentences
Unchanged: by week, with the pieces shown.

### Check → Tests
*Test one thing.* Eight tests **in four groups**: **A quick round**
(Quickfire 10) · **Pictures** (Picture round · Match the pictures) · **The
Tetouani ear** (Tetouani or national? · Classical roots) · **Sentences and
speaking** (Fill the gap · Mind map · Say it out loud). The note under them
no longer says the pictures are emoji; they are the site's drawn symbols.

### Check → Quizzes, Progress
Unchanged: two columns on a laptop.

### Discover → Library
Mirrors the header. Unchanged.

### Discover → Tetouan (the map)
*Where is it, and what do I say there?* The level switch, the map, the place
card, the chips, beyond the city, the notes. Two places gain what the
research found: **Bab Okla** now tells the museum's story (the bastion of
about 1830, the museum founded 1928 and moved there in 1948, reopened
2022), and **Place Moulay el Mehdi** names the church on it (Notre-Dame des
Victoires, consecrated 1925 by the French Wikipedia's account; other sources
give 1917 and 1926, and the card says so).

### Discover → Gallery
Four albums. Unchanged.

### Discover → Tetouani guide
*What makes it Tetouani?* A plain summary, then the label key, then the ten
differences **in three groups with a jump row**: **Sounds** (ق · the soft r
· diphthongs) · **Pronouns and verbs** (ntina · māš · dən) · **Words**
(Spanish loanwords · shenni · fuyax · ṭlaʕ and hawwed). Then a new section,
**Also recorded in Tetouan**, with six features from the CORVAM corpus that
the guide did not yet carry, each in the corpus's own transcription (not a
learner spelling), each with its source: ق said as kh in some words; ž said
as g beside s and z, with younger speakers moving to d; ʕād / ʕa as an older
future marker now receding; the -wah ending of plurals; n for "to" a place;
and the shared northern words for window, boy and dog. Then the open
questions, then the sources, **with the recording described**: one speaker,
about 65, born in Tetouan, recorded in a house in the medina in October 2012
by Ángeles Vicente.

### Notes about Tetouan
Two new, sourced: **the museum at Bab Okla** (field: Getting around) and
**the church on the round square** (field: Describing and joining, with the
protectorate note). Ten notes in all.

### Teacher → Dashboard
*Run the course.* **A jump row at the top** (Where he is · Weak spots ·
Session log · Test results · Feedback · Verification · Add a phrase · Week
notes · Recordings · Content · Backup) and an anchor on every section, so
the long page is a page with a map. The order is the order of a lesson:
see the learner, see what is weak, log the session, check the results, then
the tools.

### Teacher → Feedback, Recordings, Curriculum, Content, Progress, Library
Unchanged.

## How a new fact or feature is added

- A city fact: `data/tetouan-notes.js`, with `source` and `url` of a page
  that was opened, and a `field`. A date two sources disagree on is written
  with both.
- A dialect feature: `data/dialect.js`. Into `contrasts` only with a Tetouan
  form, a national form, a scope and a confidence; into `documented` when it
  is a recorded feature with a source but not yet a teaching contrast. Source
  transcription stays as the source wrote it, labelled.
- Never a new word, translation or harakat: those are Ahmed's, through
  `design/review/VOCAB-REVIEW-QUEUE.md`.

## Research used in this pass

- CORVAM, Corpus oral de variedades magrebíes, University of Zaragoza:
  *Tetouan Arabic: Tetouan city* (Ángeles Vicente, 2012), the page opened on
  13 October 2026. <https://corvam.unizar.es/en/localities/tetouan/>
- Wikipedia, *Tetouan Ethnographic Museum*, opened 13 October 2026.
- Wikipédia (fr), *Tétouan*, opened 13 October 2026: the church, the mellah,
  the seven gates, Dar Sanaa by name.
- Wikipedia, *Tétouan*, opened 12 and 13 October 2026.
