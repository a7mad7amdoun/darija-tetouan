/* ---------------------------------------------------------------------------
   THE MAP OF TETOUAN: every place with its coordinates from OpenStreetMap,
   looked up on 12 October 2026, with the OSM object it came from. Nothing
   here is placed by guesswork: a place is 'exact' when OSM has the thing
   itself (a city gate, a square, a museum), 'near' when OSM has something
   named after it beside it (a bus stop or shop called "Bab El Okla"), and a
   gate the map could not find is listed, not drawn.
   Map data © OpenStreetMap contributors, ODbL. https://www.openstreetmap.org/copyright
   --------------------------------------------------------------------------- */
window.DARIJA = window.DARIJA || {};
window.DARIJA.map = {
  /* the walled medina, as OSM draws it (way 592208262, "Médina de Tétouan (ancienne Titawin)") */
  medina: [[-5.3755504,35.5724812],[-5.3708275,35.5708044],[-5.3678959,35.5673261],[-5.3651322,35.5680669],
           [-5.3635711,35.5700261],[-5.363083,35.5730805],[-5.3642368,35.5745855],[-5.3675258,35.5730172],
           [-5.3687702,35.5741074],[-5.3714229,35.5734457],[-5.37386,35.5747662]],
  medinaSource: 'https://www.openstreetmap.org/way/592208262',
  centre: [-5.3689925, 35.5703779],     /* Place Hassan II */
  places: [
    { id: 'hassan2', album: 'medina', kind: 'square', name: 'Place Hassan II', ar: '', lat: 35.5703779, lon: -5.3689925, certainty: 'exact', label: 'right',
      osm: 'https://www.openstreetmap.org/way/292009193', photo: 'tetouan-feddan-square',
      what: 'The open square in front of the Royal Palace, at the western edge of the medina. It was al-Feddan, and older Tetouanis still call it that. The meeting point between the old city and the Ensanche.',
      say: 'Arrange to meet here: the time words, and a place every taxi driver knows.', situation: 'time', note: 'feddan' },
    { id: 'mehdi', album: 'ensanche', kind: 'square', name: 'Place Moulay el Mehdi', ar: '', lat: 35.5701819, lon: -5.3741454, certainty: 'exact',
      osm: 'https://www.openstreetmap.org/relation/7130325',
      what: 'The round plaza at the heart of the Ensanche, the Spanish-built quarter west of the medina. Cafés around it, and on one side the church of Notre-Dame des Victoires (consecrated 1925, by one account; 1917 or 1926 by others): this is where the modern city was laid out from 1913.',
      say: 'Order a tea at a terrace here: the café words.', situation: 'cafe', note: 'church' },
    { id: 'saida', album: 'medina', kind: 'gate', name: 'Bab Saida', ar: '', lat: 35.5732485, lon: -5.3633396, certainty: 'exact',
      osm: 'https://www.openstreetmap.org/node/5519451385',
      what: 'A gate in the medina’s eastern wall. The medina has seven gates, closed every night until the early 20th century.',
      say: 'Ask the way to a gate by name: "fin kayen Bab Saida?"', situation: 'street', note: 'gates' },
    { id: 'jiaf', album: 'medina', kind: 'gate', name: 'Bab Jiaf', ar: '', lat: 35.5738227, lon: -5.3652481, certainty: 'exact',
      osm: 'https://www.openstreetmap.org/node/5519451393',
      what: 'A gate in the northern wall, on the Chourafa side, towards the hill.',
      say: 'Up or down: the city climbs, so directions here come with "fuq" and "taht".', situation: 'street', note: 'gates' },
    { id: 'okla', album: 'medina', kind: 'gate', name: 'Bab Okla', ar: 'باب العقلة', lat: 35.5704535, lon: -5.3634643, certainty: 'near',
      osm: 'https://www.openstreetmap.org/node/8188220733',
      what: 'The best-known gate, on the east side: the way in from the Martil road. Beside it, in a bastion built around 1830, is the Ethnographic Museum: founded 1928, here since 1948, reopened 2022. Position taken from the bus stop that carries its name.',
      say: 'Take a taxi here: "l-Bab Okla, afak."', situation: 'taxi', note: 'museum' },
    { id: 'tout', album: 'medina', kind: 'gate', name: 'Bab Tout', ar: 'باب التوت', lat: 35.5707694, lon: -5.3714621, certainty: 'near', label: 'up',
      osm: 'https://www.openstreetmap.org/node/8676572915',
      what: 'The gate on the western side, where the medina meets the Ensanche near Place Hassan II. Position taken from the pharmacy that carries its name.',
      say: 'The shop words: the small shops begin right inside.', situation: 'shop', note: 'gates' },
    { id: 'nouader', album: 'medina', kind: 'gate', name: 'Bab Nouader', ar: '', lat: 35.5735956, lon: -5.3760871, certainty: 'near',
      osm: 'https://www.openstreetmap.org/way/400043714',
      what: 'The north-western gate, with the souk named after it just outside. Position taken from Souk Bab Nouader.',
      say: 'The market words, and the numbers for haggling.', situation: 'market', note: 'crafts' },
    { id: 'remouz', album: 'medina', kind: 'gate', name: 'Bab Remouz', ar: '', lat: 35.5677825, lon: -5.3667436, certainty: 'near',
      osm: 'https://www.openstreetmap.org/way/576910094',
      what: 'The southern gate, down the slope. Position taken from the street that carries its name.',
      say: '"Straight ahead, then left": the lanes here turn and turn.', situation: 'street', note: 'gates' },
    { id: 'museum', album: 'ensanche', kind: 'museum', name: 'Archaeological Museum', ar: '', lat: 35.5706357, lon: -5.3706670, certainty: 'exact', label: 'left',
      osm: 'https://www.openstreetmap.org/node/2197267043',
      what: 'Just outside the medina on the Ensanche side: Roman mosaics from Lixus and Tamuda, the ancient site a few kilometres from the city.',
      say: '"How much is the ticket?": bshhal.', situation: 'shop', note: 'arts' },
    { id: 'gare', album: 'ensanche', kind: 'transport', name: 'Gare routière', ar: '', lat: 35.5607175, lon: -5.3720002, certainty: 'exact',
      osm: 'https://www.openstreetmap.org/way/140089128',
      what: 'The bus station, south of the centre on Avenue 9 Avril. Buses to Tangier, Chefchaouen, Fnideq and the coast; grands taxis beside it.',
      say: 'The taxi and travel words, and the time: "when does it leave?"', situation: 'taxi', note: null },
    { id: 'kasbah', album: 'medina', kind: 'museum', name: 'The Kasbah', ar: 'القصبة', lat: 35.5743413, lon: -5.3719913, certainty: 'exact', label: 'up',
      osm: 'https://www.openstreetmap.org/node/7105378286',
      what: 'The fortress at the top of the medina, on the slope of Dersa. The Marinids built the first kasbah here in the 13th century; the Andalusians rebuilt the city below it.',
      say: 'Up, down, near and far: the city climbs to this point.', situation: 'street', note: 'andalus' },
    { id: 'dersa', album: 'mountains', kind: 'mountain', name: 'Jbel Dersa', ar: 'جبل درسة', lat: 35.5965680, lon: -5.3893477, certainty: 'exact',
      osm: 'https://www.openstreetmap.org/node/3060093842',
      what: 'The mountain the city climbs. A kasbah stands at the top; from there the whole white city, the valley and the sea.',
      say: 'Near and far, up and down.', situation: 'street', note: 'mountains' }
  ],
  /* gates the map knows of but could not place from OSM: listed, not drawn */
  unplaced: [{ name: 'Bab Mkabar', what: 'The seventh gate, by the cemetery on the north side. Not found in OpenStreetMap by that name, so it is not drawn.' }],
  /* THE NORTH: the towns around Tetouan, each with how its Arabic sits
     beside Tetouan's, as the course's own dialect guide puts it. 'tetouan'
     is the city itself; 'north' is the shared northern (Jebli / Tangier)
     speech the course marks as north - correct here, not the city's own;
     'edge' is where the north meets other varieties. These are the
     course's scope labels applied to places, not new linguistic claims:
     the guide's note on each is the source. */
  region: [
    { id: 'tetouan', name: 'Tetouan', ar: 'تطوان', lat: 35.5759706, lon: -5.3612649, speech: 'tetouan', label: 'left', osm: 'https://www.openstreetmap.org/relation/2464649',
      what: 'The city. Its Arabic is the old sedentary dialect this course teaches.' },
    { id: 'martil', name: 'Martil', ar: 'مرتيل', lat: 35.6174410, lon: -5.2741540, speech: 'tetouan', label: 'right', osm: 'https://www.openstreetmap.org/relation/2464645',
      what: 'Tetouan\u2019s beach, 10 km away. The same speech as the city; half of Tetouan is here in summer.' },
    { id: 'mdiq', name: 'M\u2019diq', ar: 'المضيق', lat: 35.6833598, lon: -5.3232161, speech: 'tetouan', label: 'left', osm: 'https://www.openstreetmap.org/relation/2464647',
      what: 'The fishing port and resort north of Martil. Tetouani speech, with the coast\u2019s own fish words.' },
    { id: 'cabonegro', name: 'Cabo Negro', ar: '', lat: 35.6667004, lon: -5.2883716, speech: 'tetouan', label: 'right', osm: 'https://www.openstreetmap.org/node/1596535213',
      what: 'The headland between Martil and M\u2019diq, with its beaches and golf.' },
    { id: 'fnideq', name: 'Fnideq', ar: 'الفنيدق', lat: 35.8392089, lon: -5.3614246, speech: 'north', label: 'right', osm: 'https://www.openstreetmap.org/relation/2504445',
      what: 'The border town before Ceuta. Northern speech, with Spanish close at hand.' },
    { id: 'ceuta', name: 'Ceuta', ar: 'سبتة', lat: 35.8944220, lon: -5.3558174, speech: 'edge', label: 'right', osm: 'https://www.openstreetmap.org/relation/1822781',
      what: 'The Spanish enclave, 36 km north. Spanish is the language; the Darija spoken there is northern.' },
    { id: 'tanger', name: 'Tangier', ar: 'طنجة', lat: 35.7625681, lon: -5.8295062, speech: 'north', osm: 'https://www.openstreetmap.org/relation/2758781',
      what: 'The north\u2019s big city. Shares the northern features the course marks "north", but it is not Tetouani: Tangier has its own old city speech and a great deal of newcomers\u2019 Darija.' },
    { id: 'asilah', name: 'Asilah', ar: 'أصيلة', lat: 35.4555716, lon: -5.9216889, speech: 'north', osm: 'https://www.openstreetmap.org/relation/4778595',
      what: 'The small walled town on the Atlantic, south of Tangier.' },
    { id: 'chaouen', name: 'Chefchaouen', ar: 'شفشاون', lat: 35.1700832, lon: -5.2766583, speech: 'north', osm: 'https://www.openstreetmap.org/relation/4666456',
      what: 'The blue town in the Rif, 45 km south. Jebli (mountain) northern speech: close to Tetouan\u2019s, with its own country words.' },
    { id: 'ouedlaou', name: 'Oued Laou', ar: 'واد لو', lat: 35.4504920, lon: -5.0930290, speech: 'north', osm: 'https://www.openstreetmap.org/relation/2480069',
      what: 'The coast road south-east of Tetouan: fishing villages, Jebli speech.' },
    { id: 'larache', name: 'Larache', ar: 'العرائش', lat: 35.1814673, lon: -6.1342775, speech: 'edge', osm: 'https://www.openstreetmap.org/relation/2754034',
      what: 'On the Atlantic to the south-west. The northern features thin out here towards the speech of the plains.' },
    { id: 'ouezzane', name: 'Ouezzane', ar: 'وزان', lat: 34.7978847, lon: -5.5819262, speech: 'edge', osm: 'https://www.openstreetmap.org/relation/2753083',
      what: 'The southern edge of the Jebala. Beyond it, the Darija of the interior.' },
    { id: 'alhoceima', name: 'Al Hoceima', ar: 'الحسيمة', lat: 35.2361380, lon: -3.9433141, speech: 'edge', osm: 'https://www.openstreetmap.org/relation/2431058',
      what: 'The eastern Rif. Tarifit (Berber) country: Darija here is a second language, and not northern.' }
  ],
  /* where the roads go: distance in a straight line, from Place Hassan II */
  beyond: [
    { id: 'martil', name: 'Martil', ar: 'مرتيل', lat: 35.6174410, lon: -5.2741540, osm: 'https://www.openstreetmap.org/relation/2464645', what: 'The beach town, the city’s own seaside.' },
    { id: 'ceuta', name: 'Ceuta', ar: '', lat: 35.8944220, lon: -5.3558174, osm: 'https://www.openstreetmap.org/relation/1822781', what: 'The Spanish enclave, due north.' },
    { id: 'tanger', name: 'Tangier', ar: 'طنجة', lat: 35.7625681, lon: -5.8295062, osm: 'https://www.openstreetmap.org/relation/2758781', what: 'Northern Darija’s other city.' },
    { id: 'chaouen', name: 'Chefchaouen', ar: 'شفشاون', lat: 35.1700832, lon: -5.2766583, osm: 'https://www.openstreetmap.org/relation/4666456', what: 'The blue town in the Rif.' }
  ]
};
