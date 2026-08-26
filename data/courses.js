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

  /* ---- expansion slots: visible, not built ---- */
  {
    id: 'month2', order: 2, label: 'Month 2', status: 'locked',
    title: 'Café, Market & Neighbours (Tetouan)',
    variety: 'northern',
    goal: 'Northern-only. Everyday transactional talk in the places Hamza actually goes. Still no sentence-building.',
    weeks: [], extras: []
  },
  {
    id: 'month3', order: 3, label: 'Month 3', status: 'locked',
    title: 'Sentence Patterns (Stage 3)',
    variety: 'northern',
    goal: 'The first module where phrases become constructions he can vary himself.',
    weeks: [], extras: []
  }
];

/* Variety tag definitions. 'national' is defined but unused in Month 1 —
   it exists so a later national-Darija tag renders in a clearly different colour
   and can never be mistaken for Northern/Tetouani content. */
window.DARIJA.varieties = {
  northern: { label: 'Northern / Tetouani', short: 'Northern', className: 'tag-northern' },
  national: { label: 'National Moroccan',   short: 'National', className: 'tag-national' }
};
