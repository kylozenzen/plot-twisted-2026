(() => {
  const PLAYED_KEY = 'pt_has_played';
  const HOME_BYPASS_KEY = 'pt_home_bypass';
  const SHARE_URL = `${window.location.origin}/`;

  function track(name, parameters = {}) {
    window.ptAnalytics?.track?.(name, parameters);
  }

  function notify(message) {
    if (typeof window.toast === 'function') window.toast(message);
  }

  function makeBetaChip(label = 'Now in beta') {
    const chip = document.createElement('span');
    chip.className = 'game-beta-chip';
    chip.textContent = label;
    return chip;
  }

  function addBetaLabels() {
    const lobbyMarquee = document.querySelector('#lobby .marquee');
    if (lobbyMarquee && !lobbyMarquee.querySelector('.game-beta-chip')) {
      lobbyMarquee.appendChild(makeBetaChip('Beta'));
    }

    const settings = document.getElementById('settings');
    const settingsEyebrow = settings?.querySelector(':scope > .eyebrow');
    if (settings && settingsEyebrow && !settings.querySelector('.settings-beta-wrap')) {
      const wrap = document.createElement('div');
      wrap.className = 'settings-beta-wrap';
      settingsEyebrow.before(wrap);
      wrap.append(settingsEyebrow, makeBetaChip());
    }

    const foot = document.querySelector('#lobby .foot');
    if (foot) foot.textContent = 'A Nobody Creative Production · 5 Questions · Beta Build';
  }

  function goHome() {
    track('select_content', { content_type: 'navigation', content_id: 'game_home_screen' });
    try { sessionStorage.setItem(HOME_BYPASS_KEY, '1'); } catch (_) {}
    window.location.assign('/?home=1');
  }

  async function copyShareLink(button) {
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(SHARE_URL);
      } else {
        const input = document.createElement('textarea');
        input.value = SHARE_URL;
        input.setAttribute('readonly', '');
        input.style.position = 'fixed';
        input.style.opacity = '0';
        document.body.appendChild(input);
        input.select();
        document.execCommand('copy');
        input.remove();
      }
      const original = button.textContent;
      button.textContent = 'COPIED';
      notify('Game link copied');
      track('share', { method: 'clipboard', content_type: 'game', item_id: 'plot_twisted' });
      setTimeout(() => { button.textContent = original; }, 1600);
    } catch (_) {
      notify('Could not copy the link');
    }
  }

  function settingsRow(title, description, buttonText, handler) {
    const row = document.createElement('div');
    row.className = 'set-row settings-action-row';
    row.innerHTML = `<div><div class="set-name">${title}</div><div class="set-sub">${description}</div></div>`;
    const button = document.createElement('button');
    button.className = 'toggle';
    button.type = 'button';
    button.textContent = buttonText;
    button.addEventListener('click', () => handler(button));
    row.appendChild(button);
    return row;
  }

  function addSettingsTools() {
    const settingsList = document.querySelector('#settings .settings-list');
    if (!settingsList || settingsList.querySelector('.settings-action-row')) return;

    settingsList.append(
      settingsRow('Home Screen', 'Return to the Plot Twisted landing page', 'HOME', goHome),
      settingsRow('Share Game', 'Copy a clean link to send to another movie nerd', 'COPY LINK', copyShareLink)
    );
  }

  function currentCategory() {
    try { return S?.cat?.name || S?.cat?.key || 'Unknown'; } catch (_) { return 'Unknown'; }
  }

  function instrumentGameEvents() {
    if (window.__ptAnalyticsInstrumented) return;
    window.__ptAnalyticsInstrumented = true;

    if (typeof window.startRound === 'function') {
      const originalStartRound = window.startRound;
      window.startRound = function trackedStartRound(key) {
        const result = originalStartRound.apply(this, arguments);
        let levelName = key;
        try { levelName = CAT_META?.[key]?.name || key; } catch (_) {}
        track('level_start', { level_name: levelName });
        return result;
      };
    }

    if (typeof window.endRound === 'function') {
      const originalEndRound = window.endRound;
      window.endRound = function trackedEndRound() {
        const result = originalEndRound.apply(this, arguments);
        let score = 0;
        let correct = 0;
        let total = 0;
        try {
          score = Number(S.score || 0);
          correct = Number(S.correct || 0);
          total = Number(S.qs?.length || 0);
        } catch (_) {}
        const category = currentCategory();
        track('level_end', { level_name: category, success: true });
        track('post_score', {
          score,
          game_category: category,
          correct_answers: correct,
          question_count: total
        });
        return result;
      };
    }

    if (typeof window.shareScoreCard === 'function') {
      const originalShareScoreCard = window.shareScoreCard;
      window.shareScoreCard = function trackedShareScoreCard() {
        track('share', {
          method: navigator.share ? 'web_share_or_download' : 'download',
          content_type: 'score_card',
          item_id: currentCategory().toLowerCase().replace(/\s+/g, '_')
        });
        return originalShareScoreCard.apply(this, arguments);
      };
    }

    const feedback = document.getElementById('fbForm');
    feedback?.addEventListener('submit', () => {
      const feedbackType = document.getElementById('fbType')?.value || 'Unknown';
      track('feedback_submit', { feedback_type: feedbackType });
    }, { capture: true });
  }

  function rememberCompletedRound() {
    const receipt = document.getElementById('receipt');
    if (!receipt) return;
    const remember = () => {
      if (receipt.classList.contains('active')) {
        try { localStorage.setItem(PLAYED_KEY, 'true'); } catch (_) {}
      }
    };
    remember();
    new MutationObserver(remember).observe(receipt, { attributes: true, attributeFilter: ['class'] });
  }

  function boot() {
    addBetaLabels();
    addSettingsTools();
    instrumentGameEvents();
    rememberCompletedRound();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot, { once: true });
  } else {
    boot();
  }
})();
