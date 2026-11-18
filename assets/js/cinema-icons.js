/* Plot Twisted showing icons: one hand-drawn line set shared by the game board and the landing page.
   Each icon is a 48x48 stroke drawing that inherits currentColor. */
(function () {
  const wrap = (body) => `<svg viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">${body}</svg>`;

  const ICONS = {
    // Balloon bunch: parties, sing-alongs, the whole row.
    Family: wrap('<circle cx="16.5" cy="15" r="7.5"/><circle cx="31.5" cy="13" r="6.5"/><circle cx="24.5" cy="25" r="6.8"/><path d="M16.5 22.5 23 41M31.5 19.5 24.5 41M24.5 31.8V41"/><path d="M20 41h9"/>'),
    // Domino mask.
    Superhero: wrap('<path d="M5 19.5c5.5-5.2 13-6 19-2.6 6-3.4 13.5-2.6 19 2.6-.6 8.6-5.7 13.6-11 12.6-4.4-.8-5.5-5-8-5s-3.6 4.2-8 5C10.7 33.1 5.6 28.1 5 19.5Z"/><path d="M12.5 22.6c1.6-1.6 4.4-1.8 6.4-.3M35.5 22.6c-1.6-1.6-4.4-1.8-6.4-.3"/>'),
    // Ringed planet with a passing star.
    SciFi: wrap('<circle cx="22" cy="26" r="10"/><path d="M11.8 30.4C5.9 33.6 3.2 37 4.6 39c2 2.9 12.2.3 22.8-6s17.6-13.6 15.6-16.5c-1.3-1.9-6-1.6-12.3.6"/><path d="M38 6v6M35 9h6"/>'),
    // Wizard hat with a spark.
    Fantasy: wrap('<path d="M7 40h34"/><path d="M12 40 21.5 8l13 10.5-6.2 1.6L34 40"/><path d="M14.6 31.2c6.2 1.6 12.6 1.6 18.4 0"/><path d="M37 26.5v5M34.5 29h5"/>'),
    // Sheet ghost.
    Horror: wrap('<path d="M13 41V22a11 11 0 0 1 22 0v19l-3.7-3-3.6 3-3.7-3-3.7 3-3.6-3Z"/><circle cx="19.5" cy="22.5" r="1.6" fill="currentColor" stroke="none"/><circle cx="28.5" cy="22.5" r="1.6" fill="currentColor" stroke="none"/><path d="M21.5 29.5c1.6 1.1 3.4 1.1 5 0"/>'),
    // Film reel with a trailing strip.
    Classics: wrap('<circle cx="21" cy="21" r="15"/><circle cx="21" cy="21" r="2.6"/><circle cx="21" cy="11.5" r="3.6"/><circle cx="30" cy="18.2" r="3.6"/><circle cx="26.6" cy="29" r="3.6"/><circle cx="15.4" cy="29" r="3.6"/><circle cx="12" cy="18.2" r="3.6"/><path d="M33 31.5c3 2.5 6.6 3.6 10 3.6"/>'),
    // Cracked heart.
    EmotionalDamage: wrap('<path d="M24 41 8.8 26.4A9.6 9.6 0 0 1 24 13.6a9.6 9.6 0 0 1 15.2 12.8Z"/><path d="m24 13.6-3 7.4 5.4 3.2-4.2 6.4 2.4 3.8"/>'),
    // TV with a play button.
    StreamingHits: wrap('<rect x="5.5" y="13" width="37" height="25" rx="4.5"/><path d="M17 6.5 24 13l7-6.5M16 43h16"/><path d="m21 20.5 8 4.5-8 4.5Z" fill="currentColor"/>'),

    // Coming attractions.
    Gaming: wrap('<path d="M14.5 15h19c5.5 0 9.4 4.6 9 10.6l-.6 7.6c-.4 4.6-5.6 6.8-9 3.6L28.6 33h-9.2l-4.3 3.8c-3.4 3.2-8.6 1-9-3.6l-.6-7.6c-.4-6 3.5-10.6 9-10.6Z"/><path d="M15.5 21.5v7M12 25h7"/><circle cx="31" cy="23" r="1.5" fill="currentColor" stroke="none"/><circle cx="35" cy="27" r="1.5" fill="currentColor" stroke="none"/>'),
    Action: wrap('<path d="m24 4 4.4 10.2 10.8-3.6-3.8 10.6L45 26l-10.4 3.9 3.2 10.9-10.4-4.6L24 46l-3.4-9.8-10.4 4.6 3.2-10.9L3 26l9.6-4.8-3.8-10.6 10.8 3.6Z"/><path d="M24 19v8M24 31.5v.5"/>'),
    Binge: wrap('<rect x="9" y="15" width="32" height="22" rx="4"/><path d="M13 11h24M17 7h16M19 43h12"/><path d="M15.5 26h7M15.5 31h12"/>'),
    NeedleDrop: wrap('<circle cx="21" cy="27" r="15"/><circle cx="21" cy="27" r="4"/><path d="M21 17a10 10 0 0 1 10 10"/><path d="m44 5-9.5 12-4 9"/><circle cx="44" cy="5" r=".8" fill="currentColor"/>')
  };

  window.PT_ICONS = ICONS;
  window.ptIcon = (key) => ICONS[key] || ICONS.Classics;
})();
