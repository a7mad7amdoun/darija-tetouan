/* ---------------------------------------------------------------------------
   COURSE REGISTRY

   TO ADD MONTH 2 (or any later course):
     1. Copy data/month1.js to data/month2.js, change the id/order/title,
        and replace the weeks array with the new content.
     2. Add <script src="data/month2.js"></script> to index.html.
     3. Replace the `status:'locked'` stub below with: window.DARIJA.month2
   Nothing else changes. Every page reads from this list.
   --------------------------------------------------------------------------- */
window.DARIJA = window.DARIJA || {};

window.DARIJA.courses = [

  window.DARIJA.month1,

  window.DARIJA.month2,

  window.DARIJA.month3
];

/* Variety tag definitions. 'national' is defined but unused in Month 1 —
   it exists so a later national-Darija tag renders in a clearly different colour
   and can never be mistaken for Northern/Tetouani content. */
window.DARIJA.varieties = {
  northern: { label: 'Northern / Tetouani', short: 'Northern', className: 'tag-northern' },
  national: { label: 'National Moroccan',   short: 'National', className: 'tag-national' }
};

/* The order sections appear in the library. Anything not listed falls to the
   end, so adding a new group never breaks the page — it just appears last. */
window.DARIJA.sectionOrder = [
  'Greetings & politeness',
  'Introducing yourself',
  'Respect & faith',
  'People & family',
  'When you are stuck',
  'Yes, no & agreeing',
  'Question words',
  'Numbers',
  'Time',
  'Shopping & prices',
  'Food & drink',
  'How you feel',
  'Directions',
  'Getting around',
  'Places in Tetouan',
  'Around the house',
  'Everyday words'
];

/* Sections that are long and repetitive start folded. */
window.DARIJA.sectionFolded = { 'Numbers': true };
