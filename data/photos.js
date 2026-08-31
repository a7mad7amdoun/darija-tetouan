/* ---------------------------------------------------------------------------
   PHOTOGRAPHS OF TETOUAN

   Every page carries its own photograph — as a banner at the top, and again
   very faintly behind the whole page, so the city is present without ever
   competing with the text.

   focal: background-position, so the subject survives cropping on a phone
   scrim: how heavy the overlay needs to be for white text to stay readable
   --------------------------------------------------------------------------- */
window.DARIJA = window.DARIJA || {};

window.DARIJA.photos = {
  'whitecity': { file: 'whitecity.jpg', focal: '50% 55%', scrim: 'heavy',
    alt: 'The white medina stacked against a hard blue sky',
    caption: 'The white city' },
  'arch': { file: 'arch.jpg', focal: '50% 50%', scrim: 'medium',
    alt: 'A Moorish arch framing the medina, minaret and kasbah',
    caption: 'Through the arch' },
  'panorama': { file: 'panorama.jpg', focal: '50% 60%', scrim: 'medium',
    alt: 'Tetouan spread below the Rif mountains',
    caption: 'The city under the Rif' },
  'plaza': { file: 'plaza.jpg', focal: '50% 55%', scrim: 'medium',
    alt: 'The main square seen from above the rooftops',
    caption: 'The square from above' },
  'alley': { file: 'alley.jpg', focal: '50% 45%', scrim: 'medium',
    alt: 'A narrow medina lane with a minaret at the end',
    caption: 'A lane in the medina' },
  'zellij-street': { file: 'zellij-street.jpg', focal: '50% 50%', scrim: 'medium',
    alt: 'Zellij tilework and a red car on a medina street',
    caption: 'Tilework and a red car' },
  'spanish-tower': { file: 'spanish-tower.jpg', focal: '50% 42%', scrim: 'medium',
    alt: 'The protectorate tower with its green and blue tiles',
    caption: 'The protectorate tower' },
  'ensanche': { file: 'ensanche.jpg', focal: '50% 45%', scrim: 'medium',
    alt: 'A white colonial facade with green shutters',
    caption: 'The Ensanche' },
  'street-life': { file: 'street-life.jpg', focal: '50% 60%', scrim: 'light',
    alt: 'A woman in a pink djellaba below the white medina',
    caption: 'An ordinary afternoon' },
  'kasbah-street': { file: 'kasbah-street.jpg', focal: '50% 55%', scrim: 'medium',
    alt: 'A street climbing toward the kasbah',
    caption: 'Up toward the kasbah' },
  'avenue': { file: 'avenue.jpg', focal: '50% 60%', scrim: 'medium',
    alt: 'The avenue running out toward the mountains',
    caption: 'The avenue' },
  'minaret': { file: 'minaret.jpg', focal: '50% 45%', scrim: 'medium',
    alt: 'A minaret and the Moroccan flag above the street',
    caption: 'The minaret' },
  'goldenhour': { file: 'goldenhour.jpg', focal: '50% 55%', scrim: 'light',
    alt: 'The city turning gold at the end of the day',
    caption: 'Golden hour' },
  'coast': { file: 'coast.jpg', focal: '50% 55%', scrim: 'light',
    alt: 'The bay at dawn, mist over the mountains',
    caption: 'The bay at dawn' },
  'bluedoors': { file: 'bluedoors.jpg', focal: '50% 50%', scrim: 'medium',
    alt: 'Blue doors opening onto the beach pavilions',
    caption: 'The blue doors' },
  'medina': { file: 'medina.jpg', focal: '50% 78%', scrim: 'heavy',
    alt: 'The white medina of Tetouan stacked up the hillside',
    caption: 'The medina' },
  'boulevard': { file: 'boulevard.jpg', focal: '50% 70%', scrim: 'medium',
    alt: 'Palms along the boulevard, the Rif behind',
    caption: 'The boulevard' },
  'dove': { file: 'dove.jpg', focal: '50% 45%', scrim: 'medium',
    alt: 'The winged sculpture set into a white tower',
    caption: 'The dove of Tetouan' },
  'pools': { file: 'pools.jpg', focal: '50% 75%', scrim: 'medium',
    alt: 'River pools and straw parasols in the mountains',
    caption: 'The pools in the mountains' },
  'tower': { file: 'tower.jpg', focal: '50% 45%', scrim: 'medium',
    alt: 'Spanish-era octagonal tower with a Spanish flag',
    caption: 'The Spanish tower' },
  'sunset': { file: 'sunset.jpg', focal: '50% 60%', scrim: 'light',
    alt: 'Palms against an orange sunset over the sea',
    caption: 'Sunset on the coast' },
};

/* Which photograph leads which page. Every surface gets its own. */
window.DARIJA.pagePhoto = {
  'home':       'whitecity',
  'course':     'plaza',
  'week':       'alley',
  'vocab':      'dove',
  'situations': 'street-life',
  'sentences':  'zellij-street',
  'dialogues':  'avenue',
  'tests':      'ensanche',
  'exams':      'ensanche',
  'practice':   'minaret',
  'progress':   'goldenhour',
  'dialect':    'spanish-tower',
  'teacher':    'panorama',
  'feedback':   'coast'
};

/* A different photograph for each week, so the twelve weeks feel like a
   journey through the city rather than twelve copies of one page. */
window.DARIJA.weekPhoto = {
  'month1:1': 'medina',      'month1:2': 'plaza',        'month1:3': 'alley',
  'month1:4': 'arch',
  'month2:5': 'zellij-street','month2:6': 'street-life',  'month2:7': 'bluedoors',
  'month2:8': 'minaret',
  'month3:9': 'kasbah-street','month3:10': 'avenue',      'month3:11': 'panorama',
  'month3:12': 'goldenhour'
};
