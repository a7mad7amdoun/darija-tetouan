# Photographs

Save the six Tetouan photos here with exactly these names:

| File | Photo | Where it appears |
|---|---|---|
| `medina.jpg` | The white medina stacked up the hillside | Home hero |
| `boulevard.jpg` | Palms, the Centro de Arte, mountains behind | Course + week pages |
| `dove.jpg` | The white tower with the green winged sculpture | Vocabulary, Flashcards |
| `pools.jpg` | Mountain river pools with straw parasols | Situations, Tests |
| `tower.jpg` | Spanish-era octagonal tower with the Spanish flag | Tetouani dialect guide |
| `sunset.jpg` | Palms against the orange sunset over the sea | Progress, Feedback |

Then run, from the project root:

    ./optimise-photos.sh

It keeps your originals in `assets/photos/originals/` and writes web-sized
versions (2400px wide, quality 88) that stay sharp on a retina screen while
loading fast on a phone.

Anything missing just falls back to the solid brand colour — the site never breaks.
