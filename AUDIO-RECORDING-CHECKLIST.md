# Audio recording checklist

**Status: no recordings exist yet.** The app is wired for audio and every card
shows *"not recorded yet"* until clips land. Nothing is synthesised and nothing
is substituted, so there is no wrong pronunciation being taught in the meantime
— just silence where the audio will go.

## Why it cannot be generated

Text-to-speech reads Modern Standard Arabic. A card that says `sa-LAM` would be
read in a register nobody speaks in Tetouan, and Hamza would learn it that way
and have to unlearn it. A national-Darija clip is no better: the difference
between national and Tetouani is the entire reason this course exists. So a clip
is either a Tetouani speaker you have approved, or it does not exist.

## How to record

Anything that records to `.m4a` or `.mp3` is fine — Voice Memos on a phone is
fine. You do not need a studio.

1. Say each line **twice**, at normal conversational speed, with a short pause
   between. Not slowly: Hamza needs to recognise it at the speed it is said on
   the stairs.
2. One file per line. Name the file exactly the **ID** in the table below plus
   the extension, e.g. `w1-hello.m4a`.
3. Put them in `assets/audio/`.
4. Tell me, and I will add them to `data/audio.js` with your name as the
   speaker and `verified: true`. **Listen back to each one first** — once it is
   marked verified the app teaches it as correct.

## Before you put private recordings in the repository

`assets/audio/` on GitHub Pages is **publicly retrievable**. The login screen
protects the app, not the files — anyone with the URL can download them. For
these 32 everyday phrases that is probably fine; it is vocabulary, not private
material.

If you would rather they were not public, the alternative is Supabase Storage
with a policy restricting reads to signed-in users. I have **not** set that up
and will not without you asking — it changes production infrastructure. The
prepared step is in `supabase/audio-storage.sql`, for you to review and run
yourself if you want it.

## Scope

The scope column is the card's own. If a line is marked **mdini** and you would
not say it that way yourself, say so rather than recording the version you use —
that is a content correction, and I would rather fix the card than have the
audio and the text disagree.

## The lines

32 utterances: the core of Month 1, weighted to weeks 1 and 2 because those are
the phrases said on day one in Tetouan.

| # | ID | English | Say | Arabic | Scope | When it is used |
|---|---|---|---|---|---|---|
| 01 | `w1-hello` | Hello | **sa-LAM** | السَّلام | (unscoped) | Universal greeting — works with anyone, any time of day. |
| 02 | `w1-marhba` | Welcome / you're welcome | **MERH-ba** | مَرْحْبا | (unscoped) | Answering a thank-you, or receiving someone. Extremely common as a warm filler. |
| 03 | `w1-labas` | How are you? | **LA-bas** | لاباس | (unscoped) | The standard second beat of any greeting. Also answers itself — "labas" back means "I am f |
| 04 | `w1-ntina` | You (to anyone) | **n-TEE-na** | نْتِينا | tetouan — the city | The northern "you". One word for a man or a woman — no gender choice to get wrong. |
| 05 | `w1-kif-ntina` | How are you? (northern form) | **KEEF n-TEE-na** | كِيف نْتِينا | tetouan — the city | The follow-up turn after salam/labas. Works with anybody. |
| 06 | `w1-bikhir` | I'm well / fine | **b-KHEER** | بْخِير | (unscoped) | Answering labas or kif ntina. Pair it with hamdullah. |
| 07 | `w1-smiti` | My name is... | **SMEE-tee** | سْمِيتِي | (unscoped) | Introducing yourself, any setting. |
| 08 | `w1-smitek` | What is your name? (to a man) | **SHEN-ni SMEE-tek** | شْنِي سْمِيتَك | tetouan — the city | Asking a man his name, after you have given yours. |
| 09 | `w1-ismek` | What is your name? (to a woman) | **SHEN-ni IS-mek** | شْنِي اسْمَك | tetouan — the city | Asking a woman her name. A genuinely different word, not smitek with a different vowel. |
| 10 | `w1-from` | I am from America | **A-na men am-REE-ka** | أنا مْن أمْرِيكا | (unscoped) | Answering the question everyone asks in the first thirty seconds. |
| 11 | `w1-mnin` | Where are you from? | **m-NEEN n-TEE-na** | مْنِين نْتِينا | tetouan — the city | The natural return question after saying where you are from. |
| 12 | `w1-please` | Please | **a-FAK** | عافاك | (unscoped) | Attach it to any request. Doing without it sounds like an order. |
| 13 | `w1-thanks` | Thank you | **SHOOK-ran** | شُكْراً | (unscoped) | Any thanks, any register. |
| 14 | `w1-bye` | Goodbye | **bes-la-MA** | بْسْلامة | (unscoped) | Closing any interaction, warm and safe everywhere. |
| 15 | `w1-mezyan` | Good / nice | **mez-YAN** | مْزْيان | tetouan — the city | The all-purpose "good". Answers half the questions he will be asked. |
| 16 | `w1-mafhemtsh` | I don't understand | **ma f-HEMT-sh** | ما فْهَمْتْش | tetouan — the city | The most important phrase of month one. He says this instead of switching to English. |
| 17 | `w1-3awed` | Say it again | **3A-wed** | عاوَد | tetouan — the city | Keeps a conversation alive when he missed it. Pair it with 3afak. |
| 18 | `w1-bshwiya` | Slowly | **b-SHWEE-ya** | بْشْوِيَّة | tetouan — the city | Asking someone to slow down — more useful than any single vocabulary word. |
| 19 | `w1-bismillah` | In the name of God | **bis-MIL-lah** | بِسْمِ الله | tetouan — the city | Said before eating, drinking, driving, or starting anything. |
| 20 | `w1-hamdulillah` | Thanks be to God | **l-ham-doo-LI-lah** | الْحَمْدُ لله | tetouan — the city | The answer to "how are you", and what you say after eating or when anything goes well. |
| 21 | `w1-inshallah` | God willing | **in-sha-ALLAH** | إِنْ شاءَ الله | tetouan — the city | Attach it to anything in the future. Leaving it out sounds oddly certain. |
| 22 | `w1-mashallah` | How lovely | **ma-sha-ALLAH** | ما شاءَ الله | tetouan — the city | Say it when you admire a child, a house, a meal. Admiring without it can read as the evil  |
| 23 | `w1-tbarkallah` | Well done / bless it | **tba-rak-ALLAH** | تْبارَك الله | tetouan — the city | Praise for someone's work, cooking or children. Warmer than a plain compliment. |
| 24 | `w1-barakallah` | Thank you (blessing) | **ba-rak-al-LA-hu FEEK** | بارَك الله فِيك | tetouan — the city | A warmer, more respectful thank-you than shukran. Good with elders. |
| 25 | `w3-fin` | Where is...? | **FEEN KA-yen** | فِين كايَن | (unscoped) | The core location question. Open it with 3afak to a stranger. |
| 26 | `w3-nishan` | Straight ahead | **nee-SHAN** | نِيشان | (unscoped) | Giving or understanding the first step of almost every direction. |
| 27 | `w3-limen` | Right | **LEE-men** | لِيمَن | (unscoped) | Turning right, or which side something is on. |
| 28 | `w3-shmal` | Left | **SH-MAL** | شْمال | tetouan — the city | Turning left, or which side something is on. Confirmed by a Tetouani speaker. |
| 29 | `w3-qrib` | Near | **q-REEB** | قْرِيب | tetouan — the city | Judging whether to walk or take a taxi. |
| 30 | `w3-b3id` | Far | **b-3EED** | بْعِيد | (unscoped) | Judging whether to walk or take a taxi. |
| 31 | `w3-hna` | Here | **HNA** | هْنا | (unscoped) | Pointing out a location — including telling a taxi where to stop. |
| 32 | `w3-smehli` | Excuse me | **SMEH LEE-ya** | سْمَح لِيَّا | (unscoped) | Opening with a stranger before you ask anything. Never skip it. |

## After these

Once these 32 are in and working, the next most useful recordings are the
**8 situations** (`#/situations`) as whole scenes rather than single words, and
the **6 dialogues** in Month 3 with both sides. Those need two voices, or you
reading both parts clearly labelled. Single words first, though — they are what
the daily session uses.
