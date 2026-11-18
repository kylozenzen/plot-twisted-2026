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
      const best = BEST[key] ? `<span class="stub-best">★ Best ${BEST[key]}</span>` : '';
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
    label.innerHTML = `<span>Reel ${pad(S.i + 1)} / ${pad(S.qs.length)}</span><span>${esc(S.cat?.name || '')}</span>`;
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

  renderBoard();
})();
