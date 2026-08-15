(() => {
  const FEEDBACK = {
    correct: [
      'Roll credits — that answer just won opening weekend.',
      'Spotlight on you. Correct, and with style.',
      'The clue tipped its hat. You earned it.',
      'That landed like a third-act reveal.',
      'Box office confirmed: correct.',
      'Your watchlist is paying dividends.'
    ],
    wrong: [
      'Hard cut. That answer missed the franchise.',
      'The clue remains undefeated on that one.',
      'Nice swing, wrong screenplay.',
      'Your guess had reboot energy. Not the good kind.',
      'That answer has strong direct-to-streaming energy.',
      "The director's notes say: no."
    ],
    skip: [
      'Strategic surrender logged.',
      'The clue wins this round. It happens.',
      'You exited before the third act.',
      'Your brain called in a stunt double.'
    ],
    letterMiss: [
      'Bold letter. Wrong movie.',
      'That letter missed its cue.',
      'Not in this cut.',
      'The marquee says absolutely not.'
    ]
  };

  const pick = (pool) => pool[Math.floor(Math.random() * pool.length)];
  const VOWELS = new Set(['A', 'E', 'I', 'O', 'U']);
  const MAX_POT = 500;
  const LETTER_COST = 30;
  const MIN_POT = 50;
  const MAX_STRIKES = 3;

  function currentQuestion() {
    return S.qs[S.i];
  }

  function cleanDisplayTitle(title) {
    return String(title || '').trim();
  }

  function resetPrototypeState() {
    S.typed = '';
    S.solving = false;
    S.guessedLetters = [];
    S.revealedIdx = [];
    S.pot = MAX_POT;

    const title = cleanDisplayTitle(currentQuestion()?.title).toUpperCase();
    [...title].forEach((ch, i) => {
      if (/[0-9]/.test(ch)) S.revealedIdx.push(i);
    });
  }

  function ensureRoundState() {
    if (!Number.isFinite(S.strikes)) S.strikes = MAX_STRIKES;
  }

  function titleMetrics() {
    const title = cleanDisplayTitle(currentQuestion()?.title).toUpperCase();
    let total = 0;
    let revealed = 0;
    [...title].forEach((ch, i) => {
      if (/[A-Z0-9]/.test(ch)) {
        total++;
        if (S.revealedIdx.includes(i)) revealed++;
      }
    });
    return { title, total, revealed, hidden: Math.max(0, total - revealed) };
  }

  function getMult() {
    const { total, hidden } = titleMetrics();
    if (!total) return 1;
    const pctHidden = hidden / total;
    return pctHidden >= 0.8 ? 1.5 : pctHidden >= 0.5 ? 1.25 : 1;
  }

  function availableScore() {
    return Math.round(S.pot * getMult());
  }

  function letterInTitle(letter) {
    return titleMetrics().title.includes(letter);
  }

  function solvedByLetters() {
    const { total, revealed } = titleMetrics();
    return total > 0 && total === revealed;
  }

  function revealAllLetters() {
    const { title } = titleMetrics();
    [...title].forEach((ch, i) => {
      if (/[A-Z0-9]/.test(ch) && !S.revealedIdx.includes(i)) S.revealedIdx.push(i);
    });
  }

  function scoreLabel() {
    const label = document.querySelector('#theater .screen-label');
    if (!label) return;
    const mult = getMult();
    const multText = mult > 1 ? ` ×${mult}` : '';
    label.textContent = `— POT ${S.pot}${multText} · ${availableScore()} PTS · ${S.strikes} STRIKE${S.strikes === 1 ? '' : 'S'} —`;
  }

  function renderPuzzleInto(typed) {
    const { title } = titleMetrics();
    let absolute = 0;
    const chunks = title.split(/(\s+)/).map((chunk) => {
      if (/^\s+$/.test(chunk)) {
        absolute += chunk.length;
        return '<span class="pt-word-gap" aria-hidden="true"></span>';
      }

      const start = absolute;
      absolute += chunk.length;
      const letters = [...chunk].map((ch, offset) => {
        const i = start + offset;
        if (/[A-Z0-9]/.test(ch)) {
          const shown = S.revealedIdx.includes(i);
          return `<span class="pt-letter ${shown ? 'shown' : 'hidden'}">${shown ? esc(ch) : '_'}</span>`;
        }
        return `<span class="pt-letter punct">${esc(ch)}</span>`;
      }).join('');
      return `<span class="pt-word">${letters}</span>`;
    }).join('');

    typed.innerHTML = chunks;
    const count = title.replace(/[^A-Z0-9]/g, '').length;
    typed.classList.toggle('pt-long', count > 20);
    typed.classList.toggle('pt-xlong', count > 28);
  }

  function hideLegacyActions() {
    const actions = document.querySelector('#theater .actions');
    if (actions) actions.classList.add('pt-hidden-actions');
  }

  function rebuildBottomRow() {
    const wrap = document.getElementById('seating');
    if (!wrap) return;
    const rows = wrap.querySelectorAll('.seat-row');
    const last = rows[rows.length - 1];
    if (!last) return;

    if (!last.querySelector('[data-key="Skip"]')) {
      const skip = document.createElement('button');
      skip.className = 'seat wide pt-skip-seat';
      skip.dataset.key = 'Skip';
      skip.setAttribute('aria-label', 'Skip question');
      skip.textContent = '⏭ SKIP';
      last.prepend(skip);
    }

    seatMap = {};
    wrap.querySelectorAll('.seat').forEach((el) => {
      seatMap[el.dataset.key] = el;
    });
    wrap.classList.add('pt-marquee-seating');
  }

  function syncSeatStates() {
    rebuildBottomRow();
    Object.entries(seatMap || {}).forEach(([key, el]) => {
      if (!el) return;

      el.classList.remove('pt-letter-hit', 'pt-letter-miss');
      el.style.display = '';

      if (/^[A-Z]$/.test(key)) {
        const guessed = (S.guessedLetters || []).includes(key);
        el.disabled = !S.solving && guessed;
        if (!S.solving && guessed) el.classList.add(letterInTitle(key) ? 'pt-letter-hit' : 'pt-letter-miss');
      } else if (key === ' ') {
        el.disabled = !S.solving;
        el.textContent = 'SPACE';
        if (!S.solving) el.style.display = 'none';
      } else if (key === 'Backspace') {
        el.disabled = !S.solving;
        el.textContent = '⌫ DEL';
        if (!S.solving) el.style.display = 'none';
      } else if (key === 'Enter') {
        el.disabled = !!S.locked;
        el.textContent = S.solving ? '↵ ENTER' : '🎬 SOLVE';
        el.setAttribute('aria-label', S.solving ? 'Submit answer' : 'Solve movie');
      } else if (key === 'Skip') {
        el.disabled = !!S.locked;
        el.textContent = '⏭ SKIP';
      }
    });
  }

  renderTyped = function renderPrototypeAnswerLine() {
    const typed = document.getElementById('typed');
    const label = document.querySelector('#answerLine .caret-lbl');
    const answerLine = document.getElementById('answerLine');
    if (!typed || !answerLine) return;

    answerLine.classList.add('pt-marquee-line');
    typed.classList.add('pt-marquee-typed');

    if (S.solving) {
      if (label) label.innerHTML = 'MOVIE&nbsp;TITLE';
      typed.classList.add('pt-solving');
      typed.classList.remove('pt-puzzle');
      typed.innerHTML = esc(S.typed) + '<span class="cur">▊</span>';
    } else {
      if (label) label.textContent = 'MARQUEE';
      typed.classList.remove('pt-solving');
      typed.classList.add('pt-puzzle');
      renderPuzzleInto(typed);
    }

    scoreLabel();
    syncSeatStates();
  };

  loadQuestion = function loadPrototypeQuestion() {
    const q = currentQuestion();
    resetPrototypeState();
    ensureRoundState();
    S.locked = false;

    const ms = document.getElementById('movieScreen');
    ms.classList.remove('correct');
    ms.innerHTML = '<div class="clue" id="clue"></div>';
    document.getElementById('clue').textContent = q.clue;

    const sub = document.getElementById('subtitle');
    sub.classList.remove('wrong');
    sub.innerHTML = `<span class="lbl">${availableScore()} pts</span>Pick letters or solve now. Wrong consonants cost ${LETTER_COST}.`;

    document.getElementById('hudQ').textContent = S.i + 1;
    document.getElementById('hudScore').textContent = S.score;
    renderPips();
    hideLegacyActions();
    renderTyped();
  };

  function revealLetter(letter) {
    if (S.locked || S.solving || !/^[A-Z]$/.test(letter)) return;
    if ((S.guessedLetters || []).includes(letter)) return;

    S.guessedLetters.push(letter);
    const q = currentQuestion();
    const title = cleanDisplayTitle(q.title).toUpperCase();
    let found = false;

    [...title].forEach((ch, i) => {
      if (ch === letter) {
        found = true;
        if (!S.revealedIdx.includes(i)) S.revealedIdx.push(i);
      }
    });

    const sub = document.getElementById('subtitle');
    if (found) {
      sfxType();
      sub.classList.remove('wrong');
      sub.innerHTML = `<span class="lbl">${availableScore()} pts</span>${letter} is on the marquee.`;
    } else if (VOWELS.has(letter)) {
      sfxWrong();
      sub.classList.add('wrong');
      sub.innerHTML = `<span class="lbl">no ${letter}</span>Vowels are free. Keep rolling.`;
    } else {
      S.pot = Math.max(MIN_POT, S.pot - LETTER_COST);
      sfxWrong();
      buzz(18);
      sub.classList.add('wrong');
      sub.innerHTML = `<span class="lbl">-${LETTER_COST}</span>No ${letter}. ${esc(pick(FEEDBACK.letterMiss))}`;
    }

    renderTyped();

    if (solvedByLetters()) {
      setTimeout(() => win(currentQuestion()), 180);
    }
  }

  function enterSolveMode() {
    if (S.locked) return;
    S.solving = true;
    S.typed = '';
    const sub = document.getElementById('subtitle');
    sub.classList.remove('wrong');
    sub.innerHTML = `<span class="lbl">${availableScore()} pts</span>Type the full movie title.`;
    renderTyped();
  }

  function cancelSolveMode() {
    if (S.locked) return;
    S.solving = false;
    S.typed = '';
    const sub = document.getElementById('subtitle');
    sub.classList.remove('wrong');
    sub.innerHTML = `<span class="lbl">${availableScore()} pts</span>Back to the marquee.`;
    renderTyped();
  }

  typeChar = function prototypeTypeChar(ch) {
    if (S.locked) return;
    if (!S.solving) {
      revealLetter(String(ch).toUpperCase());
      return;
    }
    if (S.typed.length >= 48) return;
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

  function ensureResultOverlay() {
    let overlay = document.getElementById('ptResultOverlay');
    if (overlay) return overlay;

    overlay = document.createElement('div');
    overlay.id = 'ptResultOverlay';
    overlay.className = 'pt-result-overlay';
    overlay.innerHTML = `
      <div class="pt-result-card">
        <div class="pt-result-icon" id="ptResultIcon">🎬</div>
        <div class="pt-result-kicker" id="ptResultKicker"></div>
        <div class="pt-result-title" id="ptResultTitle"></div>
        <div class="pt-result-copy" id="ptResultCopy"></div>
        <button type="button" class="pt-result-btn" id="ptResultBtn">Continue →</button>
      </div>`;
    document.body.appendChild(overlay);
    return overlay;
  }

  function showResult({ icon, kicker, title, copy, button = 'Continue →', tone = 'good', onContinue }) {
    const overlay = ensureResultOverlay();
    overlay.classList.toggle('bad', tone === 'bad');
    document.getElementById('ptResultIcon').textContent = icon;
    document.getElementById('ptResultKicker').textContent = kicker;
    document.getElementById('ptResultTitle').textContent = title;
    document.getElementById('ptResultCopy').textContent = copy;
    const btn = document.getElementById('ptResultBtn');
    btn.textContent = button;
    btn.onclick = () => {
      overlay.classList.remove('show');
      onContinue?.();
    };
    overlay.classList.add('show');
    setTimeout(() => btn.focus({ preventScroll: true }), 30);
  }

  function celebrate() {
    if (matchMedia('(prefers-reduced-motion:reduce)').matches) return;
    const icons = ['★', '🎬', '★', '🍿', '★'];
    for (let i = 0; i < 18; i++) {
      const bit = document.createElement('span');
      bit.textContent = icons[i % icons.length];
      Object.assign(bit.style, {
        position: 'fixed',
        left: '50%',
        top: '42%',
        zIndex: '130',
        pointerEvents: 'none',
        fontSize: `${14 + Math.random() * 12}px`
      });
      document.body.appendChild(bit);
      const angle = (Math.PI * 2 * i) / 18;
      const dist = 75 + Math.random() * 125;
      bit.animate([
        { transform: 'translate(-50%, -50%) scale(.5)', opacity: 1 },
        { transform: `translate(calc(-50% + ${Math.cos(angle) * dist}px), calc(-50% + ${Math.sin(angle) * dist}px)) rotate(${Math.random() * 240 - 120}deg) scale(1)`, opacity: 0 }
      ], { duration: 720 + Math.random() * 280, easing: 'cubic-bezier(.2,.8,.2,1)' }).finished.finally(() => bit.remove());
    }
  }

  win = function winPrototype(q) {
    if (S.locked) return;
    S.locked = true;
    revealAllLetters();
    const gained = availableScore();
    S.score += gained;
    S.correct++;
    S.results[S.i] = true;
    sfxCorrect();
    buzz(20);
    renderPips();
    renderTyped();
    celebrate();

    const ms = document.getElementById('movieScreen');
    ms.classList.add('correct');
    ms.innerHTML = '<div class="verdict">CORRECT!</div>';
    document.getElementById('hudScore').textContent = S.score;

    showResult({
      icon: '🎬',
      kicker: `+${gained} POINTS`,
      title: q.title.toUpperCase(),
      copy: pick(FEEDBACK.correct),
      tone: 'good',
      onContinue: () => next()
    });
  };

  function endFromStrikes(q) {
    S.results[S.i] = false;
    for (let i = S.i + 1; i < S.qs.length; i++) S.results[i] = false;
    renderPips();
    showResult({
      icon: '🎞️',
      kicker: 'OUT OF STRIKES',
      title: 'SCREENING OVER',
      copy: `The answer was ${q.title}. The projector has been confiscated.`,
      button: 'See Receipt →',
      tone: 'bad',
      onContinue: () => endRound()
    });
  }

  wrong = function wrongPrototype() {
    if (S.locked) return;
    sfxWrong();
    buzz([0, 30, 40, 30]);
    const q = currentQuestion();
    S.strikes = Math.max(0, S.strikes - 1);

    const line = document.getElementById('answerLine');
    line.classList.add('shake');
    setTimeout(() => line.classList.remove('shake'), 350);

    S.solving = false;
    S.typed = '';
    renderTyped();

    if (S.strikes <= 0) {
      S.locked = true;
      endFromStrikes(q);
      return;
    }

    showResult({
      icon: '❌',
      kicker: `${S.strikes} STRIKE${S.strikes === 1 ? '' : 'S'} LEFT`,
      title: 'WRONG SCREENPLAY',
      copy: pick(FEEDBACK.wrong),
      button: 'Try Again',
      tone: 'bad',
      onContinue: () => {
        const sub = document.getElementById('subtitle');
        sub.classList.remove('wrong');
        sub.innerHTML = `<span class="lbl">${availableScore()} pts</span>Keep revealing letters or solve again.`;
        renderTyped();
      }
    });
  };

  skipQuestion = function skipPrototypeQuestion() {
    if (S.locked) return;
    S.locked = true;
    const q = currentQuestion();
    revealAllLetters();
    S.results[S.i] = false;
    renderPips();
    renderTyped();

    showResult({
      icon: '⏭️',
      kicker: '0 POINTS',
      title: q.title.toUpperCase(),
      copy: pick(FEEDBACK.skip),
      button: 'Continue →',
      tone: 'bad',
      onContinue: () => next()
    });
  };

  onSeatDown = function prototypeSeatDown(e) {
    const seat = e.target.closest('.seat');
    if (!seat) return;
    e.preventDefault();
    if (S.locked || seat.disabled) return;
    const k = seat.dataset.key;
    if (k === 'Skip') skipQuestion();
    else if (k === 'Enter') submitAnswer();
    else if (k === 'Backspace') backspace();
    else typeChar(k);
  };

  const originalBuildSeats = buildSeats;
  buildSeats = function buildPrototypeSeats() {
    originalBuildSeats();
    rebuildBottomRow();
    syncSeatStates();
  };

  const originalStartRound = startRound;
  startRound = function startPrototypeRound(key) {
    S.strikes = MAX_STRIKES;
    return originalStartRound.apply(this, arguments);
  };

  function injectStyles() {
    if (document.getElementById('ptPrototypeStyles')) return;
    const style = document.createElement('style');
    style.id = 'ptPrototypeStyles';
    style.textContent = `
      #theater .actions.pt-hidden-actions{display:none!important}
      #theater .answer-line.pt-marquee-line{flex-direction:column;align-items:stretch;gap:5px;padding:9px 13px;min-height:52px}
      #theater .answer-line.pt-marquee-line .caret-lbl{font-size:9px;letter-spacing:.13em}
      #theater .pt-marquee-typed{width:100%;line-height:1.15}
      #theater .pt-puzzle{display:flex;align-items:center;justify-content:center;flex-wrap:wrap;gap:3px 7px;font-family:'Space Mono',monospace!important;font-size:22px!important;letter-spacing:0!important;word-break:normal!important}
      #theater .pt-puzzle.pt-long{font-size:19px!important}
      #theater .pt-puzzle.pt-xlong{font-size:16px!important}
      #theater .pt-word{display:inline-flex;gap:2px;white-space:nowrap;align-items:center}
      #theater .pt-word-gap{width:.35em;height:1px;display:inline-block}
      #theater .pt-letter{display:inline-flex;align-items:center;justify-content:center;min-width:.55em;line-height:1.05}
      #theater .pt-letter.hidden{color:#e8d9b8}
      #theater .pt-letter.shown{color:var(--brass);text-shadow:0 0 10px rgba(228,179,76,.3)}
      #theater .pt-letter.punct{color:#9f8260;min-width:auto}
      #theater .screen-label{font-family:'Space Mono',monospace;font-size:9px;letter-spacing:.12em;color:#8f6d48;margin:6px 0 8px;text-align:center}
      #theater .pt-marquee-seating .pt-letter-hit{background:#315538!important;border-color:#5ee08a!important;color:#caffd8!important;opacity:.72}
      #theater .pt-marquee-seating .pt-letter-miss{background:#2b1215!important;border-color:#6d272e!important;color:#754950!important;opacity:.45}
      #theater .pt-marquee-seating .pt-skip-seat{border-color:#6d272e;color:#ffb5b5}
      .pt-result-overlay{position:fixed;inset:0;z-index:120;display:none;align-items:center;justify-content:center;padding:22px;background:rgba(6,3,4,.76);backdrop-filter:blur(5px)}
      .pt-result-overlay.show{display:flex;animation:fade .2s ease both}
      .pt-result-card{width:min(390px,100%);text-align:center;border:3px solid var(--brass);border-radius:16px;background:linear-gradient(180deg,#20090b,#120607);padding:26px 22px;box-shadow:0 0 0 6px #120607,0 20px 60px rgba(0,0,0,.65)}
      .pt-result-overlay.bad .pt-result-card{border-color:var(--velvet-lit)}
      .pt-result-icon{font-size:34px;margin-bottom:5px}
      .pt-result-kicker{font-family:'Space Mono',monospace;font-size:10px;letter-spacing:.17em;color:var(--brass);text-transform:uppercase;margin-bottom:7px}
      .pt-result-title{font-family:'Bungee',sans-serif;font-size:clamp(21px,6vw,30px);line-height:1.05;color:var(--bulb);margin-bottom:10px}
      .pt-result-copy{font-size:15px;line-height:1.45;color:#c9a978;margin:0 auto 20px;max-width:31ch}
      .pt-result-btn{width:100%;font-family:'Barlow Condensed',sans-serif;font-weight:700;text-transform:uppercase;letter-spacing:.12em;font-size:17px;border:0;border-radius:9px;padding:13px 16px;background:linear-gradient(180deg,var(--brass),var(--brass-dim));color:#2a1206;cursor:pointer}
      @media(max-width:480px){
        #theater .pt-puzzle{font-size:20px!important;gap:2px 5px}
        #theater .pt-puzzle.pt-long{font-size:17px!important}
        #theater .pt-puzzle.pt-xlong{font-size:14px!important}
        #theater .answer-line.pt-marquee-line{margin-bottom:7px;padding:8px 11px}
        #theater .screen-label{margin:3px 0 6px;font-size:8px;letter-spacing:.08em}
        #theater .pt-marquee-seating .seat-row:last-child{gap:5px}
        #theater .pt-marquee-seating .seat-row:last-child .seat.wide{flex:1;min-width:0;padding:0 6px;font-size:11px}
      }
      @media(min-width:960px){
        #theater .screen-label{display:block!important;margin:8px auto 6px}
        #theater .seating.pt-marquee-seating{display:flex!important;flex-direction:column;gap:4px;max-width:430px;margin:5px auto 0;padding:7px 9px;border:1px solid #2d1518;border-radius:10px;background:#100607}
        #theater .pt-marquee-seating .seat-row{display:flex;justify-content:center;gap:4px}
        #theater .pt-marquee-seating .seat{width:30px;height:30px;min-width:30px;max-width:30px;font-size:11px;border-radius:5px;box-shadow:0 2px 0 #3c0e12;padding:0}
        #theater .pt-marquee-seating .seat.wide{width:auto;min-width:74px;max-width:none;height:30px;font-size:10px;padding:0 10px;flex:0 0 auto}
        #theater .desktop-keyboard-tip{margin-top:7px;font-size:9px}
        #theater .answer-line.pt-marquee-line{max-width:840px;margin-bottom:9px}
        #theater .pt-puzzle{font-size:21px!important}
        #theater .pt-puzzle.pt-long{font-size:18px!important}
        #theater .pt-puzzle.pt-xlong{font-size:16px!important}
      }
    `;
    document.head.appendChild(style);
  }

  function patchStaticUI() {
    injectStyles();
    hideLegacyActions();
    ensureResultOverlay();

    const soundSub = document.querySelector('#settings #setSound')?.closest('.set-row')?.querySelector('.set-sub');
    if (soundSub) soundSub.textContent = 'Sound effects during play';

    const tip = document.querySelector('.desktop-keyboard-tip');
    if (tip) tip.innerHTML = '<span>Type letters to reveal</span><i></i><span>Enter to solve</span><i></i><span>Esc to cancel</span>';
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
