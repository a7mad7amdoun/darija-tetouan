/* ---------------------------------------------------------------------------
   SITUATIONS — English→Darija sentence ladders (code-switch drills)

   Each line climbs a ladder:
       step 0  all English
       step 1  one Darija word swapped in
       step 2  two Darija words
       step 3  three words / a whole phrase
       step 4  full Darija (built from `full`)

   AUTHORING: write only the middle rungs in `mix`. Each rung is an array of
   parts; a part is either a plain English string or a Darija chunk:
       { d: 'phonetic', ar: 'عربي' }
   The app counts the chunks itself to label the rung, so you never have to
   keep counts in sync. Adding a line is three fields — that is the whole point.
   --------------------------------------------------------------------------- */
window.DARIJA = window.DARIJA || {};

window.DARIJA.situations = [

{ id: 'cafe', icon: '☕', title: 'In the café', week: 1,
  when: 'Sitting down, ordering, paying, leaving. The most repeatable interaction in Tetouan.',
  lines: [
    { en: 'Hello, how are you?',
      mix: [
        ['Hello, how are ', { d: 'ntina', ar: 'نتينا' }, '?'],
        [{ d: 'Salam', ar: 'السلام' }, ', how are ', { d: 'ntina', ar: 'نتينا' }, '?'],
        [{ d: 'Salam', ar: 'السلام' }, ', ', { d: 'kif', ar: 'كيف' }, ' ', { d: 'ntina', ar: 'نتينا' }, '?']
      ],
      full: { ar: 'السلام، كيف نتينا؟', phon: 'sa-LAM, KEEF n-TEE-na?' } },

    { en: 'I want a tea, please.',
      mix: [
        ['I want a tea, ', { d: '3afak', ar: 'عافاك' }, '.'],
        [{ d: 'Bghit', ar: 'بغيت' }, ' a tea, ', { d: '3afak', ar: 'عافاك' }, '.'],
        [{ d: 'Bghit', ar: 'بغيت' }, ' ', { d: 'atay', ar: 'أتاي' }, ', ', { d: '3afak', ar: 'عافاك' }, '.']
      ],
      full: { ar: 'بغيت أتاي عافاك', phon: 'BGHEET a-TAY a-FAK' } },

    { en: 'How much is it?',
      mix: [
        ['How much is it, ', { d: '3afak', ar: 'عافاك' }, '?'],
        [{ d: 'Bshhal', ar: 'بشحال' }, ', ', { d: '3afak', ar: 'عافاك' }, '?']
      ],
      full: { ar: 'بشحال عافاك؟', phon: 'bsh-HAL a-FAK?' } },

    { en: 'Thank you, goodbye.',
      mix: [
        [{ d: 'Shukran', ar: 'شكرا' }, ', goodbye.'],
        [{ d: 'Shukran', ar: 'شكرا' }, ', ', { d: 'bslama', ar: 'بسلامة' }, '.']
      ],
      full: { ar: 'شكرا، بسلامة', phon: 'SHOOK-ran, bes-la-MA' } }
  ] },

{ id: 'shop', icon: '🥖', title: 'The small shop / bakery', week: 2,
  when: 'Buying bread, water, anything small. Short, fast, repeated daily.',
  lines: [
    { en: 'Do you have bread?',
      mix: [
        ['Do you have ', { d: 'khobz', ar: 'خبز' }, '?'],
        [{ d: 'Wash', ar: 'واش' }, ' you have ', { d: 'khobz', ar: 'خبز' }, '?'],
        [{ d: 'Wash', ar: 'واش' }, ' ', { d: '3endek', ar: 'عندك' }, ' ', { d: 'khobz', ar: 'خبز' }, '?']
      ],
      full: { ar: 'واش عندك خبز؟', phon: 'WASH 3en-DEK KHOBZ?' } },

    { en: 'Give me two, please.',
      mix: [
        ['Give me two, ', { d: '3afak', ar: 'عافاك' }, '.'],
        ['Give me ', { d: 'juj', ar: 'جوج' }, ', ', { d: '3afak', ar: 'عافاك' }, '.'],
        [{ d: '3tini', ar: 'عطيني' }, ' ', { d: 'juj', ar: 'جوج' }, ', ', { d: '3afak', ar: 'عافاك' }, '.']
      ],
      full: { ar: 'عطيني جوج عافاك', phon: '3-TEE-ni ZHOOZH a-FAK' } },

    { en: 'How much is this?',
      mix: [
        ['How much is ', { d: 'hadi', ar: 'هادي' }, '?'],
        [{ d: 'Bshhal', ar: 'بشحال' }, ' ', { d: 'hadi', ar: 'هادي' }, '?']
      ],
      full: { ar: 'بشحال هادي؟', phon: 'bsh-HAL HA-di?' } },

    { en: 'Okay, thank you.',
      mix: [
        [{ d: 'Wakha', ar: 'واخا' }, ', thank you.'],
        [{ d: 'Wakha', ar: 'واخا' }, ', ', { d: 'shukran', ar: 'شكرا' }, '.']
      ],
      full: { ar: 'واخا، شكرا', phon: 'WA-kha, SHOOK-ran' } }
  ] },

{ id: 'taxi', icon: '🚕', title: 'Taking a taxi', week: 3,
  when: 'Petit taxis in Tetouan are shared — knowing "is there a seat" matters as much as the destination.',
  lines: [
    { en: 'Is there a seat?',
      mix: [
        ['Is there a ', { d: 'blasa', ar: 'بلاصة' }, '?'],
        [{ d: 'Wash', ar: 'واش' }, ' there a ', { d: 'blasa', ar: 'بلاصة' }, '?'],
        [{ d: 'Wash', ar: 'واش' }, ' ', { d: 'kayn', ar: 'كاين' }, ' ', { d: 'blasa', ar: 'بلاصة' }, '?']
      ],
      full: { ar: 'واش كاين بلاصة؟', phon: 'WASH KA-yen BLA-sa?' } },

    { en: 'Take me to the old medina, please.',
      mix: [
        ['Take me to the old medina, ', { d: '3afak', ar: 'عافاك' }, '.'],
        [{ d: 'Dini', ar: 'ديني' }, ' to the old medina, ', { d: '3afak', ar: 'عافاك' }, '.'],
        [{ d: 'Dini', ar: 'ديني' }, ' l-', { d: 'mdina l-qdima', ar: 'المدينة القديمة' }, ', ', { d: '3afak', ar: 'عافاك' }, '.']
      ],
      full: { ar: 'ديني للمدينة القديمة عافاك', phon: 'DEE-ni l-m-DEE-na l-q-DEE-ma a-FAK' } },

    { en: 'How much to the beach?',
      mix: [
        ['How much to the ', { d: 'blaya', ar: 'بلايا' }, '?'],
        [{ d: 'Bshhal', ar: 'بشحال' }, ' to the ', { d: 'blaya', ar: 'بلايا' }, '?']
      ],
      full: { ar: 'بشحال للبلايا؟', phon: 'bsh-HAL l-BLA-ya?' } },

    { en: 'Stop here, please.',
      mix: [
        ['Stop here, ', { d: '3afak', ar: 'عافاك' }, '.'],
        ['Stop ', { d: 'hna', ar: 'هنا' }, ', ', { d: '3afak', ar: 'عافاك' }, '.'],
        [{ d: 'Wqef', ar: 'وقف' }, ' ', { d: 'hna', ar: 'هنا' }, ', ', { d: '3afak', ar: 'عافاك' }, '.']
      ],
      full: { ar: 'وقف هنا عافاك', phon: 'W-QEF HNA a-FAK' } }
  ] },

{ id: 'street', icon: '🧭', title: 'Asking directions in the street', week: 3,
  when: 'Tetouan navigates by landmarks, not street names. Open politely, then name a landmark.',
  lines: [
    { en: 'Excuse me, where is the market?',
      mix: [
        ['Excuse me, where is ', { d: 's-suq', ar: 'السوق' }, '?'],
        [{ d: 'Smeh liya', ar: 'سمح ليا' }, ', where is ', { d: 's-suq', ar: 'السوق' }, '?'],
        [{ d: 'Smeh liya', ar: 'سمح ليا' }, ', ', { d: 'fin kayn', ar: 'فين كاين' }, ' ', { d: 's-suq', ar: 'السوق' }, '?']
      ],
      full: { ar: 'سمح ليا، فين كاين السوق؟', phon: 'SMEH LEE-ya, FEEN KA-yen s-SOOQ?' } },

    { en: 'Is it near or far?',
      mix: [
        ['Is it ', { d: 'qrib', ar: 'قريب' }, ' or far?'],
        ['Is it ', { d: 'qrib', ar: 'قريب' }, ' or ', { d: 'b3id', ar: 'بعيد' }, '?'],
        [{ d: 'Wash', ar: 'واش' }, ' ', { d: 'qrib', ar: 'قريب' }, ' wla ', { d: 'b3id', ar: 'بعيد' }, '?']
      ],
      full: { ar: 'واش قريب ولا بعيد؟', phon: 'WASH q-REEB oo-la b-3EED?' } },

    { en: 'Straight ahead, then right.',
      mix: [
        [{ d: 'Nishan', ar: 'نيشان' }, ', then right.'],
        [{ d: 'Nishan', ar: 'نيشان' }, ', then ', { d: '3la limen', ar: 'على ليمن' }, '.']
      ],
      full: { ar: 'نيشان، من بعد على ليمن', phon: 'nee-SHAN, men B3ED 3-la LEE-men' } },

    { en: 'Thank you very much.',
      mix: [
        [{ d: 'Shukran', ar: 'شكرا' }, ' very much.'],
        [{ d: 'Shukran', ar: 'شكرا' }, ' ', { d: 'bzaf', ar: 'بزاف' }, '.']
      ],
      full: { ar: 'شكرا بزاف', phon: 'SHOOK-ran b-ZAF' } }
  ] },

{ id: 'neighbour', icon: '🏠', title: 'Meeting a neighbour', week: 1,
  when: 'On the stairs, at the door, in the street. Short, warm, and repeated every single day.',
  lines: [
    { en: 'Hello, how are you?',
      mix: [
        ['Hello, how are ', { d: 'ntina', ar: 'نتينا' }, '?'],
        [{ d: 'Salam', ar: 'السلام' }, ', ', { d: 'labas', ar: 'لاباس' }, '?'],
        [{ d: 'Salam', ar: 'السلام' }, ', ', { d: 'kif', ar: 'كيف' }, ' ', { d: 'ntina', ar: 'نتينا' }, '?']
      ],
      full: { ar: 'السلام، كيف نتينا؟', phon: 'sa-LAM, KEEF n-TEE-na?' } },

    { en: "I'm well, thank God.",
      mix: [
        [{ d: 'Bikhir', ar: 'بخير' }, ', thank God.'],
        [{ d: 'Bikhir', ar: 'بخير' }, ' ', { d: 'l-hamdulillah', ar: 'الحمد لله' }, '.']
      ],
      full: { ar: 'بخير الحمد لله', phon: 'b-KHEER l-ham-doo-LI-lah' } },

    { en: 'What is your name?',
      mix: [
        ['What is your ', { d: 'smitek', ar: 'سميتك' }, '?'],
        [{ d: 'Shenni', ar: 'شني' }, ' ', { d: 'smitek', ar: 'سميتك' }, '?']
      ],
      full: { ar: 'شني سميتك؟', phon: 'SHEN-ni SMEE-tek?' } },

    { en: 'My name is Hamza, I am from America.',
      mix: [
        [{ d: 'Smiti', ar: 'سميتي' }, ' Hamza, I am from America.'],
        [{ d: 'Smiti', ar: 'سميتي' }, ' Hamza, ', { d: 'ana men', ar: 'انا من' }, ' America.'],
        [{ d: 'Smiti', ar: 'سميتي' }, ' Hamza, ', { d: 'ana men', ar: 'انا من' }, ' ', { d: 'Amrika', ar: 'أمريكا' }, '.']
      ],
      full: { ar: 'سميتي حمزة، انا من أمريكا', phon: 'SMEE-tee HAM-za, A-na men am-REE-ka' } }
  ] },

{ id: 'time', icon: '🕐', title: 'Time and arranging to meet', week: 2,
  when: 'Asking the time, asking when something opens, agreeing to meet later.',
  lines: [
    { en: 'Excuse me, what time is it?',
      mix: [
        ['Excuse me, what time is it, ', { d: '3afak', ar: 'عافاك' }, '?'],
        [{ d: '3afak', ar: 'عافاك' }, ', what time is it?'],
        [{ d: '3afak', ar: 'عافاك' }, ', ', { d: 'shhal', ar: 'شحال' }, ' ', { d: 'fessa3a', ar: 'فالساعة' }, '?']
      ],
      full: { ar: 'عافاك، شحال فالساعة؟', phon: 'a-FAK, sh-HAL fes-SA-3a?' } },

    { en: 'When does it open?',
      mix: [
        [{ d: 'Fuyax', ar: 'فوياخ' }, ' does it open?'],
        [{ d: 'Fuyax', ar: 'فوياخ' }, ' ', { d: 'kayhell', ar: 'كيحل' }, '?']
      ],
      full: { ar: 'فوياخ كيحل؟', phon: 'foo-YAKH kay-HELL?' } },

    { en: 'It is half past two.',
      mix: [
        ['It is ', { d: 'juj', ar: 'جوج' }, ' and half.'],
        ['It is ', { d: 'juj', ar: 'جوج' }, ' u ', { d: 'nos', ar: 'نص' }, '.'],
        [{ d: 'Essa3a', ar: 'الساعة' }, ' ', { d: 'juj', ar: 'جوج' }, ' u ', { d: 'nos', ar: 'نص' }, '.']
      ],
      full: { ar: 'الساعة جوج ونص', phon: 'es-SA-3a ZHOOZH oo NOS' } },

    { en: 'See you later.',
      mix: [
        ['See you ', { d: 'men be3d', ar: 'من بعد' }, '.'],
        [{ d: 'Nshufek', ar: 'نشوفك' }, ' ', { d: 'men be3d', ar: 'من بعد' }, '.']
      ],
      full: { ar: 'نشوفك من بعد', phon: 'n-shoo-FEK men B3ED' } }
  ] },

{ id: 'repair', icon: '🛟', title: "When you don't understand", week: 1,
  when: 'The most important situation on this page. These four lines keep a conversation alive instead of collapsing into English.',
  lines: [
    { en: "I don't understand.",
      mix: [
        ["I don't ", { d: 'fhemt', ar: 'فهمت' }, '.'],
        [{ d: 'Ma fhemtsh', ar: 'ما فهمتش' }, '.']
      ],
      full: { ar: 'ما فهمتش', phon: 'ma f-HEMT-sh' } },

    { en: 'Slowly, please.',
      mix: [
        ['Slowly, ', { d: '3afak', ar: 'عافاك' }, '.'],
        [{ d: 'B-shwiya', ar: 'بشوية' }, ', ', { d: '3afak', ar: 'عافاك' }, '.']
      ],
      full: { ar: 'بشوية عافاك', phon: 'b-SHWEE-ya a-FAK' } },

    { en: 'Say it again, please.',
      mix: [
        ['Say it again, ', { d: '3afak', ar: 'عافاك' }, '.'],
        [{ d: '3awed', ar: 'عاود' }, ', ', { d: '3afak', ar: 'عافاك' }, '.']
      ],
      full: { ar: 'عاود عافاك', phon: '3A-wed a-FAK' } },

    { en: 'What does that mean?',
      mix: [
        ['What does that ', { d: 'ma3naha', ar: 'معناها' }, '?'],
        [{ d: 'Shenni', ar: 'شني' }, ' ', { d: 'ma3naha', ar: 'معناها' }, '?']
      ],
      full: { ar: 'شني معناها؟', phon: 'SHEN-ni ma3-NA-ha?' } }
  ] },

{ id: 'market', icon: '🛒', title: 'The market — asking and haggling', week: 2,
  when: 'Small purchases where a little negotiation is expected. Keep it light and smiling.',
  lines: [
    { en: 'How much is this?',
      mix: [
        ['How much is ', { d: 'hadi', ar: 'هادي' }, '?'],
        [{ d: 'Bshhal', ar: 'بشحال' }, ' ', { d: 'hadi', ar: 'هادي' }, '?']
      ],
      full: { ar: 'بشحال هادي؟', phon: 'bsh-HAL HA-di?' } },

    { en: 'That is very expensive.',
      mix: [
        ['That is very ', { d: 'ghali', ar: 'غالي' }, '.'],
        [{ d: 'Ghali', ar: 'غالي' }, ' ', { d: 'bzaf', ar: 'بزاف' }, '.']
      ],
      full: { ar: 'غالي بزاف', phon: 'GHA-li b-ZAF' } },

    { en: 'Come down a little, please.',
      mix: [
        ['Come down a little, ', { d: '3afak', ar: 'عافاك' }, '.'],
        [{ d: 'Neqqes', ar: 'نقص' }, ' a little, ', { d: '3afak', ar: 'عافاك' }, '.'],
        [{ d: 'Neqqes', ar: 'نقص' }, ' ', { d: 'shwiya', ar: 'شوية' }, ', ', { d: '3afak', ar: 'عافاك' }, '.']
      ],
      full: { ar: 'نقص شوية عافاك', phon: 'ne-QES SHWEE-ya a-FAK' } },

    { en: 'Okay, give me this one.',
      mix: [
        [{ d: 'Wakha', ar: 'واخا' }, ', give me this one.'],
        [{ d: 'Wakha', ar: 'واخا' }, ', ', { d: '3tini', ar: 'عطيني' }, ' this one.'],
        [{ d: 'Wakha', ar: 'واخا' }, ', ', { d: '3tini', ar: 'عطيني' }, ' ', { d: 'hadi', ar: 'هادي' }, '.']
      ],
      full: { ar: 'واخا، عطيني هادي', phon: 'WA-kha, 3-TEE-ni HA-di' } }
  ] }

];
