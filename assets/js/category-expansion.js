/* Focused category patch: make Horror + Classics first-class showings without touching core game behavior. */
CAT_META.Horror={name:"Horror",flick:"🔪",rated:"R",blurb:"Slashers, spirits, and choices nobody should make."};
CAT_META.Classics={name:"Classics",flick:"🎞️",rated:"60–99",blurb:"Four decades of movies everyone swears you have seen."};

CAT_ORDER.splice(0,CAT_ORDER.length,
  "Family","Superhero","SciFi","Fantasy",
  "Horror","Classics","EmotionalDamage","StreamingHits"
);

// Re-render in case the core boot sequence finished before this small patch loaded.
if(document.getElementById('board')) renderBoard();
