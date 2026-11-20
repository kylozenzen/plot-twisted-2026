/* Plot Twisted — what the theater says back.
   Edit freely: add, cut or rewrite lines. Keep them short (about 50 characters) so they fit the phone card.
   Wrong-answer lines show after a "cut!" / "take 2" label, so they shouldn't start with "Cut" or "Take".
   ptLine(kind) deals lines like a shuffled deck: nothing repeats until every line in that list has been used. */
(() => {
  const LINES = {
    correct: [
      'Roll credits — that answer just won opening weekend.',
      'Spotlight on you. Correct, and with style.',
      'That landed like a third-act reveal.',
      'Box office confirmed: correct.',
      'Your watchlist is paying dividends.',
      'The clue never stood a chance.',
      'Nailed it in one take.',
      'The critics are calling it a masterpiece.',
      'Two thumbs up. Possibly three.',
      "That's a wrap on that one.",
      'Certified fresh.',
      'The projectionist nodded approvingly.',
      'Somebody get this person a director’s chair.',
      'Instant classic.',
      'Straight to the highlight reel.',
      'The usher is clapping. Ushers never clap.',
      'You saw that twist coming a mile away.',
      'Award season starts now.',
      'Popcorn earned.',
      'Fade in: a genius.',
      "That's going in the trailer.",
      'Clean cut. No reshoots needed.',
      'Your film degree is showing.',
      'The front row is on its feet.',
      'Brilliant. Absolutely no notes.',
      'Cue the swelling orchestra.',
      'That answer deserves a sequel.',
      'Five stars from the balcony.',
      'Pure cinema.',
      "The plot thickens, and you're still ahead of it.",
      'Hollywood called. They want you back.',
      'Even the end credits are impressed.',
      'Lights, camera, correct.',
      "You've seen this one. Probably twice.",
      'Directed, produced and solved by you.',
      "Your popcorn hand didn't even shake.",
      "That's the kind of take they frame.",
      'A performance for the ages.',
      'The reel is yours.',
      'Smooth, like a perfect tracking shot.'
    ],
    wrong: [
      'Not that one. Roll it again.',
      'Wrong reel. The projectionist saw that.',
      'Bold guess. Wrong movie.',
      'That movie exists. Just not here.',
      'The front row gasped. Not in a good way.',
      'Plot twist: that was wrong.',
      'Even the popcorn knew that one.',
      'Close? Maybe. Correct? No.',
      'Somewhere, a film critic sighed.',
      'Swing and a miss. Stay in your seat.',
      "That's not the movie. That's not even the genre.",
      'The projector just sighed.',
      'That guess is going straight to DVD.',
      'Rotten. Try again.',
      'The usher is shining a flashlight at you.',
      'Interesting choice. Wrong, but interesting.',
      'Plot hole detected. In your answer.',
      'Not quite. The sequel might be better.',
      'Left on the cutting room floor.',
      'Wrong theater, friend.',
      "That's a different movie entirely.",
      'Nope. Rewind and try again.',
      'That answer needs a rewrite.',
      'The audience is throwing popcorn.',
      'Your guess walked out halfway through.',
      'Boo. Respectfully.',
      'Back to first positions.',
      'Reshoot required.',
      'Roll the blooper reel.',
      "That's a hard pass from the studio.",
      'The test audience did not like that.',
      'Not the movie. Maybe the knockoff version.',
      "Even the trailer would've given you more.",
      'Try again. The clue believes in you.',
      "Spoiler: that wasn't it.",
      'Places, everyone. Again.',
      'That answer is stuck in development hell.',
      'The subtitles say no.',
      'Somebody check the gate. That was blurry.',
      'Great energy. Wrong film.'
    ],
    skip: [
      'We’ll pretend you went for popcorn.',
      'Your brain called in a stunt double.',
      'A strategic retreat. Very cinematic.',
      'The clue survives another screening.',
      'This one is leaving the theater without you.',
      'Skipped. Your Letterboxd account has been notified.',
      'Walked out early. No judgment. Some judgment.',
      'That one goes on the watch-later list.',
      'Intermission called. Bathroom break granted.',
      'The clue wins this round.',
      "That's what the rewind button is for.",
      'Fast-forwarded right past it.',
      'The movie will remember this.',
      'Your queue just got one longer.',
      'No points, no regrets. A few regrets.',
      'Even critics skip the occasional screening.',
      'The answer was right there on the poster. Probably.',
      'Leaving before the post-credits scene, huh?',
      "Straight to the I'll-Google-it-later pile.",
      'Exit, stage left.',
      'Ticket stub saved. Dignity pending.',
      'Not every film is for everyone.',
      'The clue walks free.',
      'Next showing, please.',
      'Sometimes the best move is the exit.',
      'Pause. Then play the next one.'
    ]
  };

  const decks = {};
  const last = {};
  function shuffled(list) {
    const a = list.slice();
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

  window.PT_LINES = LINES;
  window.ptLine = function ptLine(kind) {
    const list = LINES[kind] || [];
    if (!list.length) return '';
    if (!decks[kind] || !decks[kind].length) {
      decks[kind] = shuffled(list);
      // Don't let a fresh deck open with the line that closed the last one.
      const top = decks[kind].length - 1;
      if (top > 0 && decks[kind][top] === last[kind]) [decks[kind][0], decks[kind][top]] = [decks[kind][top], decks[kind][0]];
    }
    last[kind] = decks[kind].pop();
    return last[kind];
  };
})();
