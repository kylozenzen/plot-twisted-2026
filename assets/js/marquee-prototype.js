(() => {
  const FEEDBACK = {
    correct: [
      'Roll credits — that answer just won opening weekend.',
      'Spotlight on you. Correct, and with style.',
      'That landed like a third-act reveal.',
      'Box office confirmed: correct.',
      'Your watchlist is paying dividends.'
    ],
    wrong: [
      'Nice swing. Wrong screenplay.',
      'The director’s notes say: no.',
      'That guess had straight-to-streaming energy.',
      'Hard cut. That answer missed the franchise.',
      'The clue remains undefeated on that one.'
    ],
    skip: [
      'Strategic surrender logged.',
      'The clue wins this round. It happens.',
      'Your brain called in a stunt double.'
    ]
  };

  const pick = (pool) => pool[Math.floor(Math.random() * pool.length)];
  const LETTER_COST = 10;
  const START_VALUE = 100;
  const FLOOR_VALUE = 25;

  function currentQuestion() {
    return S.qs[S.i];
  }

  function resetPrototypeState() {
    S.typed = '';
    S.solving = false;
    S.guessedLetters = [];
    S.available = START_VALUE;
  }

  function maskTitle(title) {
    const guessed = new Set(S.guessedLetters || []);
    return [...title.toUpperCase()].map((ch) => {
      if (/[A-Z]/.test(ch)) return guessed.has(ch) ? ch : '_';
      if (/[0-9]/.test(ch)) return ch;
      if (ch === ' ') return '  ';
      return ch;
    }).join(' ');
  }

  function solvedByLetters(title) {
    const guessed = new Set(S.guessedLetters || []);
    return [...title.toUpperCase()].every((ch) => !/[A-Z]/.test(ch) || guessed.has(ch));
  }

  function scoreLabel() {
    const label = document.querySelector('#theater .screen-label');
    if (label) label.textContent = `— ${S.available} points on the line —`;
  }

  function actionButtons() {
    return [...document.querySelectorAll('#theater .actions .act')];
  }

  function syncActions() {
    const [solveBtn, speakBtn, skipBtn] = actionButtons();
    if (solveBtn) {
      solveBtn.disabled = !!S.locked;
      solveBtn.innerHTML = S.solving
        ? '<span class="ic">↩️</span>Cancel Solve<small>back to letters</small>'
        : `<span class="ic">🎬</span>Solve Movie<small>${S.available} pts</small>`;
      solveBtn.onclick = toggleSolveMode;
    }
    if (speakBtn) speakBtn.style.display = 'none';
    if (skipBtn) {
      skipBtn.innerHTML = '<span class="ic">⏭</span>Skip<small>0 pts</small>';
      skipBtn.onclick = skipQuestion;
    }
  }

  function syncSeatStates() {
    Object.entries(seatMap || {}).forEach(([key, el]) => {
      if (!el) return;
      el.classList.remove('hit');
      if (/^[A-Z]$/.test(key)) {
        const guessed = (S.guessedLetters || []).includes(key);
        el.disabled = !S.solving && guessed;
        if (!S.solving && guessed) el.classList.add('hit');
      } else if (key === ' ') {
        el.disabled = !S.solving;
        el.textContent = 'SPACE';
      } else if (key === 'Backspace') {
        el.disabled = !S.solving;
        el.textContent = '⌫ DEL';
      } else if (key === 'Enter') {
        el.disabled = false;
        el.textContent = S.solving ? '↵ ENTER' : '🎬 SOLVE';
        el.setAttribute('aria-label', S.solving ? 'Submit answer' : 'Solve movie');
      }
    });
  }

  renderTyped = function renderPrototypeAnswerLine() {
    const typed = document.getElementById('typed');
    const label = document.querySelector('#answerLine .caret-lbl');
    if (!typed) return;

    if (S.solving) {
      if (label) label.innerHTML = 'MOVIE&nbsp;TITLE';
      typed.style.fontFamily = '';
      typed.style.letterSpacing = '';
      typed.innerHTML = esc(S.typed) + '<span class="cur">▊</span>';
    } else {
      if (label) label.innerHTML = 'MARQUEE&nbsp;PUZZLE';
      typed.style.fontFamily = "'Space Mono', monospace";
      typed.style.letterSpacing = '.08em';
      typed.textContent = maskTitle(currentQuestion()?.title || '');
    }

    scoreLabel();
    syncActions();
    syncSeatStates();
  };

  loadQuestion = function loadPrototypeQuestion() {
    const q = currentQuestion();
    resetPrototypeState();
    S.locked = false;

    const ms = document.getElementById('movieScreen');
    ms.classList.remove('correct');
    ms.innerHTML = '<div class="clue" id="clue"></div>';
    document.getElementById('clue').textContent = q.clue;

    const sub = document.getElementById('subtitle');
    sub.classList.remove('wrong');
    sub.innerHTML = '<span class="lbl">100 pts</span>Pick letters or solve the movie now.';

    document.getElementById('hudQ').textContent = S.i + 1;
    document.getElementById('hudScore').textContent = S.score;
    renderPips();
    renderTyped();
  };

  function revealLetter(letter) {
    if (S.locked || S.solving || !/^[A-Z]$/.test(letter)) return;
    if ((S.guessedLetters || []).includes(letter)) return;

    S.guessedLetters.push(letter);
    S.available = Math.max(FLOOR_VALUE, START_VALUE - (S.guessedLetters.length * LETTER_COST));
    sfxType();

    const sub = document.getElementById('subtitle');
    const inTitle = currentQuestion().title.toUpperCase().includes(letter);
    sub.classList.toggle('wrong', !inTitle);
    sub.innerHTML = inTitle
      ? `<span class="lbl">${S.available} pts</span>${letter} is on the marquee.`
      : `<span class="lbl">${S.available} pts</span>No ${letter}. Keep rolling.`;

    renderTyped();

    if (solvedByLetters(currentQuestion().title)) {
      setTimeout(() => win(currentQuestion()), 180);
    }
  }

  function enterSolveMode() {
    if (S.locked) return;
    S.solving = true;
    S.typed = '';
    const sub = document.getElementById('subtitle');
    sub.classList.remove('wrong');
    sub.innerHTML = `<span class="lbl">${S.available} pts</span>Type the full movie title.`;
    renderTyped();
  }

  function cancelSolveMode() {
    if (S.locked) return;
    S.solving = false;
    S.typed = '';
    const sub = document.getElementById('subtitle');
    sub.classList.remove('wrong');
    sub.innerHTML = `<span class="lbl">${S.available} pts</span>Back to the marquee.`;
    renderTyped();
  }

  function toggleSolveMode() {
    if (S.solving) cancelSolveMode();
    else enterSolveMode();
  }

  typeChar = function prototypeTypeChar(ch) {
    if (S.locked) return;
    if (!S.solving) {
      revealLetter(String(ch).toUpperCase());
      return;
    }
    if (S.typed.length >= 40) return;
    S.typed += ch;
    sfxType();
    flashSeat(ch === ' ' ? ' ' : ch.toUpperCase());
    renderTyped();
  };

  backspace = function prototypeBackspace() {
    if (S.locked || !S.solving) return;
    S.typed = S.typed.slice(0, -1);
    flashSeat('Backspace');
    renderTyped();
  };

  submitAnswer = function submitPrototypeAnswer() {
    if (S.locked) return;
    if (!S.solving) {
      enterSolveMode();
      return;
    }

    const raw = S.typed.trim();
    const g = norm(raw);
    if (!g) {
      bump();
      return;
    }

    const q = currentQuestion();
    const correct = isMatch(g, buildPool(q)) || isPrefixMatch(words(raw), words(q.title));
    const titleN = norm(q.title);

    if (!correct) {
      if ((g === 'matrix' || g === 'thematrix') && !titleN.includes('matrix')) {
        eggMatrix();
        return;
      }
      if (g === 'mortalkombat' && !titleN.includes('mortalkombat')) {
        eggFatality();
        return;
      }
    }

    if (correct) win(q);
    else wrong();
  };

  function celebrate() {
    if (matchMedia('(prefers-reduced-motion:reduce)').matches) return;
    const icons = ['★', '🎬', '★', '🍿', '★'];
    for (let i = 0; i < 14; i++) {
      const bit = document.createElement('span');
      bit.textContent = icons[i % icons.length];
      Object.assign(bit.style, {
        position: 'fixed',
        left: '50%',
        top: '42%',
        zIndex: '9999',
        pointerEvents: 'none',
        fontSize: `${14 + Math.random() * 12}px`
      });
      document.body.appendChild(bit);
      const angle = (Math.PI * 2 * i) / 14;
      const dist = 70 + Math.random() * 110;
      bit.animate([
        { transform: 'translate(-50%, -50%) scale(.5)', opacity: 1 },
        { transform: `translate(calc(-50% + ${Math.cos(angle) * dist}px), calc(-50% + ${Math.sin(angle) * dist}px)) rotate(${Math.random() * 240 - 120}deg) scale(1)`, opacity: 0 }
      ], { duration: 650 + Math.random() * 250, easing: 'cubic-bezier(.2,.8,.2,1)' }).finished.finally(() => bit.remove());
    }
  }

  win = function winPrototype(q) {
    if (S.locked) return;
    S.locked = true;
    const gained = S.available;
    S.score += gained;
    S.correct++;
    S.results[S.i] = true;
    sfxCorrect();
    buzz(20);
    celebrate();
    renderPips();

    const ms = document.getElementById('movieScreen');
    ms.classList.add('correct');
    ms.innerHTML = '<div class="verdict">CORRECT!</div>';

    const sub = document.getElementById('subtitle');
    sub.classList.remove('wrong');
    sub.innerHTML = `<span class="lbl">+${gained}</span>${esc(q.title)} · ${esc(pick(FEEDBACK.correct))}`;
    document.getElementById('hudScore').textContent = S.score;
    syncActions();
    setTimeout(next, 1550);
  };

  wrong = function wrongPrototype() {
    sfxWrong();
    buzz([0, 30, 40, 30]);
    const line = document.getElementById('answerLine');
    line.classList.add('shake');
    setTimeout(() => line.classList.remove('shake'), 350);

    S.solving = false;
    S.typed = '';
    const sub = document.getElementById('subtitle');
    sub.classList.add('wrong');
    sub.innerHTML = `<span class="lbl">cut!</span>${esc(pick(FEEDBACK.wrong))}`;
    renderTyped();
  };

  useHint = toggleSolveMode;
  speakClue = toggleSolveMode;

  skipQuestion = function skipPrototypeQuestion() {
    if (S.locked) return;
    S.locked = true;
    const q = currentQuestion();
    const sub = document.getElementById('subtitle');
    sub.classList.remove('wrong');
    sub.innerHTML = `<span class="lbl">the answer was</span>${esc(q.title)} · ${esc(pick(FEEDBACK.skip))}`;
    S.results[S.i] = false;
    renderPips();
    syncActions();
    setTimeout(next, 1450);
  };

  onSeatDown = function prototypeSeatDown(e) {
    const seat = e.target.closest('.seat');
    if (!seat) return;
    e.preventDefault();
    if (S.locked || seat.disabled) return;
    const k = seat.dataset.key;
    if (k === 'Enter') submitAnswer();
    else if (k === 'Backspace') backspace();
    else typeChar(k);
  };

  const originalBuildSeats = buildSeats;
  buildSeats = function buildPrototypeSeats() {
    originalBuildSeats();
    syncSeatStates();
  };

  function patchStaticUI() {
    const soundSub = document.querySelector('#settings #setSound')?.closest('.set-row')?.querySelector('.set-sub');
    if (soundSub) soundSub.textContent = 'Sound effects during play';

    const tip = document.querySelector('.desktop-keyboard-tip');
    if (tip) tip.innerHTML = '<span>Type letters to reveal</span><i></i><span>Enter to solve</span><i></i><span>Escape to cancel solve</span>';

    syncActions();
  }

  document.addEventListener('keydown', (e) => {
    if (!document.getElementById('theater')?.classList.contains('active')) return;
    if (S.locked) return;
    if (e.key === 'Escape' && S.solving) {
      e.preventDefault();
      e.stopImmediatePropagation();
      cancelSolveMode();
    }
  }, true);

  patchStaticUI();
})();
