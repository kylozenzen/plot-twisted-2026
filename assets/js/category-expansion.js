(() => {
  if (typeof CAT_META === 'undefined' || typeof CAT_ORDER === 'undefined') return;

  Object.assign(CAT_META, {
    Horror: {
      name: 'Horror',
      flick: '🔪',
      rated: 'R',
      blurb: 'Slashers, spirits, and choices nobody should make.'
    },
    Classics: {
      name: 'Classics',
      flick: '🎞️',
      rated: '60–99',
      blurb: 'Four decades of movies everyone swears you have seen.'
    }
  });

  const expandedOrder = [
    'Family',
    'Superhero',
    'SciFi',
    'Fantasy',
    'Horror',
    'Classics',
    'EmotionalDamage',
    'StreamingHits'
  ];

  CAT_ORDER.splice(0, CAT_ORDER.length, ...expandedOrder);

  const showingCount = document.querySelector('#lobby .lobby-details span:first-child b');
  if (showingCount) showingCount.textContent = String(expandedOrder.length);

  const clueCategory = document.querySelector('#fbClue select[name="clue_category"]');
  if (clueCategory) {
    const labels = Array.from(clueCategory.options, option => option.textContent);
    const fantasyOption = Array.from(clueCategory.options).find(option => option.textContent === 'Fantasy');
    const insertAfter = label => {
      if (labels.includes(label)) return;
      const option = document.createElement('option');
      option.textContent = label;
      if (fantasyOption?.nextSibling) clueCategory.insertBefore(option, fantasyOption.nextSibling);
      else clueCategory.appendChild(option);
      labels.push(label);
    };
    insertAfter('Classics');
    insertAfter('Horror');
  }

  const description = document.querySelector('meta[name="description"]');
  if (description) description.setAttribute('content', 'Guess the movie from one ridiculous plot summary. Five-question rounds, eight showings, and no account required.');

  const ogDescription = document.querySelector('meta[property="og:description"]');
  if (ogDescription) ogDescription.setAttribute('content', 'Guess the movie from one ridiculous summary. Five clues. Eight showings. Trust nobody, especially the hints.');

  if (typeof renderBoard === 'function') renderBoard();
})();
