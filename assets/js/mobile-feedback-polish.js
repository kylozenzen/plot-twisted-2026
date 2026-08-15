(() => {
  const MOBILE_QUERY = '(max-width: 959px)';
  const PRAISE = [
    'Roll credits — that answer just won opening weekend.',
    'Spotlight on you. Correct, and with style.',
    'That landed like a third-act reveal.',
    'Box office confirmed: correct.',
    'Your watchlist is paying dividends.',
    'The clue never stood a chance.'
  ];
  const SKIP_ROASTS = [
    'We’ll pretend you went for popcorn.',
    'Your brain called in a stunt double.',
    'A strategic retreat. Very cinematic.',
    'The clue survives another screening.',
    'This one is leaving the theater without you.',
    'Skipped. Your Letterboxd account has been notified.'
  ];

  const pick = (pool) => pool[Math.floor(Math.random() * pool.length)];
  const isMobile = () => window.matchMedia(MOBILE_QUERY).matches;

  const style = document.createElement('style');
  style.textContent = `
    @media (max-width: 959px) {
      #theater .actions .act:nth-child(2) { display:none; }
      #theater .actions { gap:10px; }
      #theater .actions .act {
        min-height:58px;
        padding:10px 12px;
        font-size:14px;
        gap:7px;
      }
      #theater .actions .act small {
        font-size:10px;
        letter-spacing:.1em;
      }
      #theater .seating { position:relative; }
      #theater .seating .seat-row:last-child { width:100%; }
      #theater .seating .seat-row:last-child .seat.wide {
        width:calc((100% - (var(--gap) * 2)) / 3);
        max-width:none;
        flex:1 1 0;
        height:62px;
        padding:0 8px;
        font-size:14px;
      }
      #theater .movie-screen.skipped {
        border-color:#b7353d;
        box-shadow:0 0 50px rgba(183,53,61,.35);
      }
      #theater .movie-screen.skipped .verdict {
        color:#ff646d;
        text-shadow:0 0 30px rgba(183,53,61,.55);
      }
      .pt-mobile-result {
        position:absolute;
        inset:4px;
        z-index:12;
        display:none;
        align-items:center;
        justify-content:center;
        padding:14px;
        border-radius:14px;
        background:linear-gradient(180deg,rgba(28,8,11,.98),rgba(12,5,6,.99));
        border:2px solid var(--brass-dim);
        box-shadow:0 18px 44px rgba(0,0,0,.58), inset 0 0 32px rgba(0,0,0,.3);
      }
      .pt-mobile-result.show { display:flex; animation:fade .2s ease both; }
      .pt-mobile-result.skip { border-color:#7a1e22; }
      .pt-mobile-result-card {
        width:min(100%,360px);
        text-align:center;
        display:flex;
        flex-direction:column;
        align-items:center;
        gap:8px;
      }
      .pt-mobile-result-kicker {
        font-family:'Space Mono',monospace;
        font-size:10px;
        letter-spacing:.2em;
        text-transform:uppercase;
        color:var(--brass);
      }
      .pt-mobile-result.skip .pt-mobile-result-kicker { color:#ff7078; }
      .pt-mobile-result-title {
        font-family:'Bungee',sans-serif;
        font-size:clamp(22px,7vw,34px);
        line-height:1.05;
        color:var(--bulb);
      }
      .pt-mobile-result-movie {
        font-family:'Barlow Condensed',sans-serif;
        font-weight:700;
        text-transform:uppercase;
        letter-spacing:.08em;
        color:var(--brass);
        font-size:16px;
        line-height:1.15;
      }
      .pt-mobile-result-copy {
        color:#d8c2aa;
        font-size:14px;
        line-height:1.35;
        max-width:30ch;
      }
      .pt-mobile-result-continue {
        width:100%;
        margin-top:6px;
        min-height:52px;
        border:none;
        border-radius:9px;
        cursor:pointer;
        font-family:'Barlow Condensed',sans-serif;
        font-weight:700;
        font-size:17px;
        letter-spacing:.12em;
        text-transform:uppercase;
        background:linear-gradient(180deg,var(--brass),var(--brass-dim));
        color:#2a1206;
        box-shadow:0 4px 0 #6d4f1a;
      }
      .pt-mobile-result-continue:active { transform:translateY(2px); box-shadow:0 2px 0 #6d4f1a; }
    }
  `;
  document.head.appendChild(style);

  function ensureOverlay() {
    if (!isMobile()) return null;
    const seating = document.getElementById('seating');
    if (!seating) return null;
    let overlay = seating.querySelector('.pt-mobile-result');
    if (overlay) return overlay;

    overlay = document.createElement('div');
    overlay.className = 'pt-mobile-result';
    overlay.setAttribute('role', 'status');
    overlay.setAttribute('aria-live', 'polite');
    overlay.innerHTML = `
      <div class="pt-mobile-result-card">
        <div class="pt-mobile-result-kicker"></div>
        <div class="pt-mobile-result-title"></div>
        <div class="pt-mobile-result-movie"></div>
        <div class="pt-mobile-result-copy"></div>
        <button class="pt-mobile-result-continue" type="button">Continue →</button>
      </div>
    `;
    overlay.querySelector('.pt-mobile-result-continue').addEventListener('click', () => {
      hideOverlay();
      next();
    });
    seating.appendChild(overlay);
    return overlay;
  }

  function hideOverlay() {
    const overlay = document.querySelector('#seating .pt-mobile-result');
    if (!overlay) return;
    overlay.classList.remove('show', 'skip', 'correct');
  }

  function showOverlay({ type, kicker, title, movie, copy }) {
    const overlay = ensureOverlay();
    if (!overlay) return;
    overlay.classList.remove('skip', 'correct');
    overlay.classList.add(type, 'show');
    overlay.querySelector('.pt-mobile-result-kicker').textContent = kicker;
    overlay.querySelector('.pt-mobile-result-title').textContent = title;
    overlay.querySelector('.pt-mobile-result-movie').textContent = movie || '';
    overlay.querySelector('.pt-mobile-result-copy').textContent = copy;
    overlay.querySelector('.pt-mobile-result-continue').focus({ preventScroll:true });
  }

  const originalBuildSeats = buildSeats;
  buildSeats = function mobilePolishBuildSeats() {
    originalBuildSeats.apply(this, arguments);
    if (!isMobile()) return;
    const enter = document.querySelector('#seating .seat[data-key="Enter"]');
    if (enter) {
      enter.textContent = '↵ SUBMIT';
      enter.setAttribute('aria-label', 'Submit answer');
    }
    ensureOverlay();
  };

  const originalLoadQuestion = loadQuestion;
  loadQuestion = function mobilePolishLoadQuestion() {
    hideOverlay();
    const ms = document.getElementById('movieScreen');
    if (ms) ms.classList.remove('skipped');
    return originalLoadQuestion.apply(this, arguments);
  };

  const originalWin = win;
  win = function mobilePolishWin(q) {
    if (!isMobile()) return originalWin.apply(this, arguments);
    if (S.locked) return;

    S.locked = true;
    const gained = S.hintUsed ? 50 : 100;
    S.score += gained;
    S.correct++;
    S.results[S.i] = true;
    sfxCorrect();
    buzz(20);
    renderPips();

    const ms = document.getElementById('movieScreen');
    ms.classList.remove('skipped');
    ms.classList.add('correct');
    ms.innerHTML = '<div class="verdict">CORRECT!</div>';

    const sub = document.getElementById('subtitle');
    sub.classList.remove('wrong');
    sub.innerHTML = `<span class="lbl">+${gained}</span>${esc(q.title)}`;
    document.getElementById('hudScore').textContent = S.score;

    showOverlay({
      type:'correct',
      kicker:'★ Nice work ★',
      title:`+${gained} PTS`,
      movie:q.title,
      copy:pick(PRAISE)
    });
  };

  const originalSkip = skipQuestion;
  skipQuestion = function mobilePolishSkip() {
    if (!isMobile()) return originalSkip.apply(this, arguments);
    if (S.locked) return;

    S.locked = true;
    const q = S.qs[S.i];
    S.results[S.i] = false;
    renderPips();

    const ms = document.getElementById('movieScreen');
    ms.classList.remove('correct');
    ms.classList.add('skipped');
    ms.innerHTML = '<div class="verdict">SKIPPED</div>';

    const sub = document.getElementById('subtitle');
    sub.classList.remove('wrong');
    sub.innerHTML = '<span class="lbl">0 pts</span>No shame. Mostly.';

    showOverlay({
      type:'skip',
      kicker:'The answer was',
      title:'SKIPPED',
      movie:q.title,
      copy:pick(SKIP_ROASTS)
    });
  };
})();
