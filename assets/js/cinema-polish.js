/* Cinema polish: ticket-stub showings, projector theater, and a film-leader countdown.
   Layered last so it wraps the core game and the mobile feedback patch without changing scoring or flow. */
(() => {
  if (typeof CAT_META === 'undefined' || typeof renderBoard !== 'function') return;

  const reduceMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const icon = (key) => (window.ptIcon ? window.ptIcon(key) : '');
  const pad = (n) => String(n).padStart(2, '0');

  // Each showing keeps the velvet-and-brass frame but gets its own lamp color.
  const ACCENTS = {
    Family: '#f6c96a',
    Superhero: '#ff6b5e',
    SciFi: '#74d6ff',
    Fantasy: '#b79bff',
    Horror: '#9be38a',
    Classics: '#eadbb8',
    EmotionalDamage: '#ff4d8d',
    StreamingHits: '#ff9a4d'
  };

  /* ---------- Box office: ticket stubs ---------- */
  renderBoard = function cinemaRenderBoard() {
    const board = document.getElementById('board');
    if (!board) return;
    board.innerHTML = CAT_ORDER.map((key, index) => {
      const m = CAT_META[key];
      if (!m) return '';
      const bk = typeof modeKey === 'function' ? modeKey(key) : key;
      const best = BEST[bk] ? `<span class="stub-best">★ Best ${BEST[bk]}</span>` : '';
      return `<button class="poster stub" style="--accent:${ACCENTS[key] || '#e4b34c'};--i:${index}" onclick="startRound('${key}')" aria-label="Buy ticket to ${esc(m.name)}">
        <span class="stub-art" aria-hidden="true">${icon(key)}</span>
        <h3>${esc(m.name)}</h3>
        <p>${esc(m.blurb)}</p>
        <span class="stub-perf" aria-hidden="true"></span>
        <span class="stub-foot"><span class="rated">${m.rated}</span><span class="stub-admit">Admit one · ${ROUND_SIZE} clues</span>${best}</span>
      </button>`;
    }).join('');
  };

  // Coming attractions get the same line icons in place of emoji.
  const COMING = ['Gaming', 'Action', 'Binge', 'NeedleDrop'];
  document.querySelectorAll('#more .coming').forEach((card, i) => {
    const flick = card.querySelector('.flick');
    if (flick && COMING[i]) { flick.innerHTML = icon(COMING[i]); flick.classList.add('stub-art'); }
  });

  /* ---------- Theater: projector beam and screen furniture ---------- */
  function dressTheater() {
    const aud = document.querySelector('#theater .auditorium');
    if (!aud || aud.querySelector('.projector-beam')) return;
    const beam = document.createElement('div');
    beam.className = 'projector-beam';
    beam.setAttribute('aria-hidden', 'true');
    aud.prepend(beam);
    const valance = document.createElement('div');
    valance.className = 'valance';
    valance.setAttribute('aria-hidden', 'true');
    aud.prepend(valance);
  }

  function projectorTick(high) {
    if (typeof tone === 'function') tone(high ? 1320 : 880, 0.035, 'square', 0.018);
  }

  // A real leader counts 3-2-1 before the feature; later reels just flash their number.
  function rollLeader(screen, reelIndex) {
    if (reduceMotion()) return;
    const counts = reelIndex === 0 ? ['3', '2', '1'] : [String(reelIndex + 1)];
    const step = reelIndex === 0 ? 360 : 420;
    const leader = document.createElement('div');
    leader.className = 'leader';
    leader.setAttribute('aria-hidden', 'true');
    leader.innerHTML = `<span class="leader-sweep"></span><span class="leader-ring"></span><span class="leader-ring inner"></span><span class="leader-cross"></span><span class="leader-num">${counts[0]}</span><span class="leader-tag">${reelIndex === 0 ? 'Picture start' : 'Reel ' + pad(reelIndex + 1)}</span>`;
    screen.appendChild(leader);
    screen.classList.add('rolling');
    const num = leader.querySelector('.leader-num');
    leader.style.setProperty('--step', step + 'ms');
    projectorTick(false);
    counts.slice(1).forEach((n, i) => {
      setTimeout(() => {
        if (!leader.isConnected) return;
        num.textContent = n;
        num.classList.remove('pop'); void num.offsetWidth; num.classList.add('pop');
        projectorTick(i === counts.length - 2);
      }, step * (i + 1));
    });
    setTimeout(() => {
      leader.classList.add('out');
      screen.classList.remove('rolling');
      setTimeout(() => leader.remove(), 260);
    }, step * counts.length);
  }

  const previousLoad = loadQuestion;
  loadQuestion = function cinemaLoadQuestion() {
    const result = previousLoad.apply(this, arguments);
    dressTheater();
    const screen = document.getElementById('movieScreen');
    if (!screen) return result;
    screen.classList.add('feature');
    const label = document.createElement('div');
    label.className = 'reel-label';
    label.setAttribute('aria-hidden', 'true');
    const hard = typeof SETTINGS !== 'undefined' && SETTINGS.mode === 'hard';
    label.innerHTML = `<span>Reel ${pad(S.i + 1)} / ${pad(S.qs.length)}</span><span${hard ? ' class="reel-program"' : ''}>${esc(hard ? "Director's Cut" : (S.cat?.name || ''))}</span>`;
    const cue = document.createElement('div');
    cue.className = 'reel-cue';
    cue.setAttribute('aria-hidden', 'true');
    cue.textContent = 'Name the movie';
    screen.prepend(label);
    screen.appendChild(cue);
    const clue = document.getElementById('clue');
    if (clue && !reduceMotion()) {
      clue.classList.add('title-in');
      clue.style.animationDelay = (S.i === 0 ? 1080 : 420) + 'ms';
    }
    takes = 0;
    fitClue();
    rollLeader(screen, S.i);
    return result;
  };

  // Verdict screens drop the reel furniture so CORRECT / SKIPPED own the frame.
  const clearFeature = () => document.getElementById('movieScreen')?.classList.remove('feature', 'rolling');
  ['win', 'skipQuestion'].forEach((name) => {
    const original = window[name];
    if (typeof original !== 'function') return;
    window[name] = function cinemaVerdict() { clearFeature(); return original.apply(this, arguments); };
  });
  win = window.win; skipQuestion = window.skipQuestion;

  /* ---------- Stable stage helpers ---------- */
  // Shrink the clue until it fits the screen, so the screen never has to grow.
  function fitClue() {
    const screen = document.getElementById('movieScreen');
    const clue = document.getElementById('clue');
    if (!screen || !clue) return;
    clue.style.fontSize = '';
    const cs = getComputedStyle(screen);
    const room = screen.clientHeight - parseFloat(cs.paddingTop) - parseFloat(cs.paddingBottom);
    let size = parseFloat(getComputedStyle(clue).fontSize);
    while (clue.scrollHeight > room && size > 13) {
      size -= 1;
      clue.style.fontSize = size + 'px';
    }
  }
  let fitTimer;
  window.addEventListener('resize', () => { clearTimeout(fitTimer); fitTimer = setTimeout(fitClue, 120); });
  if (document.fonts?.ready) document.fonts.ready.then(fitClue);

  // One-line answer box: step the type down for long titles, then slide so the cursor stays in view.
  function fitTyped() {
    const line = document.getElementById('answerLine');
    const typed = document.getElementById('typed');
    if (!line || !typed) return;
    const len = S.typed.length;
    line.classList.toggle('has-text', len > 0);
    typed.style.setProperty('--fit', len > 30 ? '.62' : len > 22 ? '.72' : len > 15 ? '.84' : '1');
    typed.classList.remove('overflowing');
    if (typed.scrollWidth > typed.clientWidth + 1) typed.classList.add('overflowing');
  }
  const previousRenderTyped = renderTyped;
  renderTyped = function cinemaRenderTyped() {
    const result = previousRenderTyped.apply(this, arguments);
    fitTyped();
    return result;
  };

  /* ---------- Wrong answers: rotating roasts, counted like film takes ---------- */
  const WRONG_ROASTS = [
    'Not that one. Roll it again.',
    'Wrong reel. The projectionist saw that.',
    'Bold guess. Wrong movie.',
    'That movie exists. Just not here.',
    'The front row gasped. Not in a good way.',
    'Plot twist: that was wrong.',
    'Even the popcorn knew that one.',
    'Close? Maybe. Correct? No.',
    'Somewhere, a film critic sighed.',
    'Swing and a miss. Stay in your seat.'
  ];
  let takes = 0;
  let lastRoast = -1;
  wrong = function cinemaWrong() {
    sfxWrong();
    buzz([0, 30, 40, 30]);
    takes += 1;
    const line = document.getElementById('answerLine');
    line.classList.add('shake');
    setTimeout(() => line.classList.remove('shake'), 350);
    const screen = document.getElementById('movieScreen');
    screen?.classList.add('miss');
    setTimeout(() => screen?.classList.remove('miss'), 420);
    let i = Math.floor(Math.random() * WRONG_ROASTS.length);
    if (i === lastRoast) i = (i + 1) % WRONG_ROASTS.length;
    lastRoast = i;
    const sub = document.getElementById('subtitle');
    sub.classList.add('wrong');
    sub.innerHTML = `<span class="lbl">${takes === 1 ? 'cut!' : 'take ' + takes}</span>${esc(WRONG_ROASTS[i])}`;
    S.typed = '';
    renderTyped();
  };

  /* ---------- Correct answers: confetti over the auditorium ---------- */
  const CONFETTI = ['#e4b34c', '#fcebc0', '#ff4d8d', '#5ee08a', '#f6c96a'];
  function throwConfetti() {
    if (reduceMotion()) return;
    const aud = document.querySelector('#theater .auditorium');
    if (!aud) return;
    const layer = document.createElement('div');
    layer.className = 'confetti';
    layer.setAttribute('aria-hidden', 'true');
    const h = aud.clientHeight;
    for (let n = 0; n < 26; n++) {
      const bit = document.createElement('i');
      bit.style.left = (8 + Math.random() * 84) + '%';
      bit.style.background = CONFETTI[n % CONFETTI.length];
      bit.style.setProperty('--x', (Math.random() * 120 - 60) + 'px');
      bit.style.setProperty('--y', (h * (0.55 + Math.random() * 0.4)) + 'px');
      bit.style.setProperty('--r', (Math.random() * 900 - 450) + 'deg');
      bit.style.setProperty('--d', (0.9 + Math.random() * 0.7) + 's');
      bit.style.animationDelay = (Math.random() * 0.15) + 's';
      layer.appendChild(bit);
    }
    aud.appendChild(layer);
    setTimeout(() => layer.remove(), 1900);
  }
  const verdictWin = win;
  win = window.win = function cinemaWin() {
    const wasLocked = S.locked;
    const result = verdictWin.apply(this, arguments);
    if (!wasLocked) throwConfetti();
    return result;
  };

  renderBoard();
})();
