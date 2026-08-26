/* ---------------------------------------------------------------------------
   PHOTOGRAPHS OF TETOUAN

   Each photo is matched to the page whose meaning it carries — the Spanish-era
   tower sits on the dialect guide because that page is about the protectorate
   layer in the language; the white medina carries the home page because it is
   the city itself.

   Drop the files into assets/photos/ with these names. Any that are missing
   simply fall back to the solid brand colour — nothing breaks.

   focal:  background-position, so the subject survives cropping on a phone
   scrim:  how heavy the overlay needs to be for text to stay readable
   --------------------------------------------------------------------------- */
window.DARIJA = window.DARIJA || {};

window.DARIJA.photos = {
  medina: {
    file: 'medina.jpg', focal: '50% 78%', scrim: 'heavy',
    alt: 'The white medina of Tetouan stacked up the hillside',
    caption: 'The medina — الحمامة البيضاء, the white dove'
  },
  boulevard: {
    file: 'boulevard.jpg', focal: '50% 70%', scrim: 'medium',
    alt: 'Palms along the boulevard, the Centro de Arte and the Rif behind',
    caption: 'The boulevard, and the Rif behind the city'
  },
  dove: {
    file: 'dove.jpg', focal: '50% 45%', scrim: 'medium',
    alt: 'The winged sculpture set into a white tower in Tetouan',
    caption: 'The dove of Tetouan'
  },
  pools: {
    file: 'pools.jpg', focal: '50% 75%', scrim: 'medium',
    alt: 'River pools and straw parasols in the mountains above Tetouan',
    caption: 'The pools in the mountains — where half these conversations happen'
  },
  tower: {
    file: 'tower.jpg', focal: '50% 45%', scrim: 'medium',
    alt: 'Spanish-era octagonal tower with zellij banding and a Spanish flag',
    caption: 'The protectorate tower — the Spanish layer, still standing'
  },
  sunset: {
    file: 'sunset.jpg', focal: '50% 60%', scrim: 'light',
    alt: 'Palms silhouetted against an orange sunset over the Mediterranean',
    caption: 'The Mediterranean, from the coast at Tetouan'
  }
};

/* which photo leads which page */
window.DARIJA.pagePhoto = {
  'home':       'medina',
  'course':     'boulevard',
  'week':       'boulevard',
  'vocab':      'dove',
  'situations': 'pools',
  'dialect':    'tower',
  'tests':      'pools',
  'practice':   'dove',
  'progress':   'sunset',
  'teacher':    'tower',
  'feedback':   'sunset'
};
