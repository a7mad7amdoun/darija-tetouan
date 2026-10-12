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
    { id: 'hassan2', kind: 'square', name: 'Place Hassan II', ar: '', lat: 35.5703779, lon: -5.3689925, certainty: 'exact', label: 'right',
      osm: 'https://www.openstreetmap.org/way/292009193', photo: 'tetouan-feddan-square',
      what: 'The open square in front of the Royal Palace, at the western edge of the medina. It was al-Feddan, and older Tetouanis still call it that. The meeting point between the old city and the Ensanche.',
      say: 'Arrange to meet here: the time words, and a place every taxi driver knows.', situation: 'time', note: 'feddan' },
    { id: 'mehdi', kind: 'square', name: 'Place Moulay el Mehdi', ar: '', lat: 35.5701819, lon: -5.3741454, certainty: 'exact',
      osm: 'https://www.openstreetmap.org/relation/7130325',
      what: 'The round plaza at the heart of the Ensanche, the Spanish-built quarter west of the medina. Cafés around it, the church on one side: this is where the modern city was laid out from 1913.',
      say: 'Order a tea at a terrace here: the café words.', situation: 'cafe', note: 'protectorate' },
    { id: 'saida', kind: 'gate', name: 'Bab Saida', ar: '', lat: 35.5732485, lon: -5.3633396, certainty: 'exact',
      osm: 'https://www.openstreetmap.org/node/5519451385',
      what: 'A gate in the medina’s eastern wall. The medina has seven gates, closed every night until the early 20th century.',
      say: 'Ask the way to a gate by name: "fin kayen Bab Saida?"', situation: 'street', note: 'gates' },
    { id: 'jiaf', kind: 'gate', name: 'Bab Jiaf', ar: '', lat: 35.5738227, lon: -5.3652481, certainty: 'exact',
      osm: 'https://www.openstreetmap.org/node/5519451393',
      what: 'A gate in the northern wall, on the Chourafa side, towards the hill.',
      say: 'Up or down: the city climbs, so directions here come with "fuq" and "taht".', situation: 'street', note: 'gates' },
    { id: 'okla', kind: 'gate', name: 'Bab Okla', ar: 'باب العقلة', lat: 35.5704535, lon: -5.3634643, certainty: 'near',
      osm: 'https://www.openstreetmap.org/node/8188220733',
      what: 'The best-known gate, on the east side: the way in from the Martil road, with the ethnographic museum beside it and the craft school nearby. Position taken from the bus stop that carries its name.',
      say: 'Take a taxi here: "l-Bab Okla, afak."', situation: 'taxi', note: 'gates' },
    { id: 'tout', kind: 'gate', name: 'Bab Tout', ar: 'باب التوت', lat: 35.5707694, lon: -5.3714621, certainty: 'near', label: 'up',
      osm: 'https://www.openstreetmap.org/node/8676572915',
      what: 'The gate on the western side, where the medina meets the Ensanche near Place Hassan II. Position taken from the pharmacy that carries its name.',
      say: 'The shop words: the small shops begin right inside.', situation: 'shop', note: 'gates' },
    { id: 'nouader', kind: 'gate', name: 'Bab Nouader', ar: '', lat: 35.5735956, lon: -5.3760871, certainty: 'near',
      osm: 'https://www.openstreetmap.org/way/400043714',
      what: 'The north-western gate, with the souk named after it just outside. Position taken from Souk Bab Nouader.',
      say: 'The market words, and the numbers for haggling.', situation: 'market', note: 'crafts' },
    { id: 'remouz', kind: 'gate', name: 'Bab Remouz', ar: '', lat: 35.5677825, lon: -5.3667436, certainty: 'near',
      osm: 'https://www.openstreetmap.org/way/576910094',
      what: 'The southern gate, down the slope. Position taken from the street that carries its name.',
      say: '"Straight ahead, then left": the lanes here turn and turn.', situation: 'street', note: 'gates' },
    { id: 'museum', kind: 'museum', name: 'Archaeological Museum', ar: '', lat: 35.5706357, lon: -5.3706670, certainty: 'exact', label: 'left',
      osm: 'https://www.openstreetmap.org/node/2197267043',
      what: 'Just outside the medina on the Ensanche side: Roman mosaics from Lixus and Tamuda, the ancient site a few kilometres from the city.',
      say: '"How much is the ticket?": bshhal.', situation: 'shop', note: 'arts' },
    { id: 'gare', kind: 'transport', name: 'Gare routière', ar: '', lat: 35.5607175, lon: -5.3720002, certainty: 'exact',
      osm: 'https://www.openstreetmap.org/way/140089128',
      what: 'The bus station, south of the centre on Avenue 9 Avril. Buses to Tangier, Chefchaouen, Fnideq and the coast; grands taxis beside it.',
      say: 'The taxi and travel words, and the time: "when does it leave?"', situation: 'taxi', note: null },
    { id: 'dersa', kind: 'mountain', name: 'Jbel Dersa', ar: 'جبل درسة', lat: 35.5965680, lon: -5.3893477, certainty: 'exact',
      osm: 'https://www.openstreetmap.org/node/3060093842',
      what: 'The mountain the city climbs. A kasbah stands at the top; from there the whole white city, the valley and the sea.',
      say: 'Near and far, up and down.', situation: 'street', note: 'mountains' }
  ],
  /* gates the map knows of but could not place from OSM: listed, not drawn */
  unplaced: [{ name: 'Bab Mkabar', what: 'The seventh gate, by the cemetery on the north side. Not found in OpenStreetMap by that name, so it is not drawn.' }],
  /* where the roads go: distance in a straight line, from Place Hassan II */
  beyond: [
    { id: 'martil', name: 'Martil', ar: 'مرتيل', lat: 35.6174410, lon: -5.2741540, osm: 'https://www.openstreetmap.org/relation/2464645', what: 'The beach town, the city’s own seaside.' },
    { id: 'ceuta', name: 'Ceuta', ar: '', lat: 35.8944220, lon: -5.3558174, osm: 'https://www.openstreetmap.org/relation/1822781', what: 'The Spanish enclave, due north.' },
    { id: 'tanger', name: 'Tangier', ar: 'طنجة', lat: 35.7625681, lon: -5.8295062, osm: 'https://www.openstreetmap.org/relation/2758781', what: 'Northern Darija’s other city.' },
    { id: 'chaouen', name: 'Chefchaouen', ar: 'شفشاون', lat: 35.1700832, lon: -5.2766583, osm: 'https://www.openstreetmap.org/relation/4666456', what: 'The blue town in the Rif.' }
  ]
};
