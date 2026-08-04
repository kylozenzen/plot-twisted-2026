(() => {
  const PLAYED_KEY = 'pt_has_played';
  const HOME_BYPASS_KEY = 'pt_home_bypass';
  const SHARE_URL = `${window.location.origin}/`;

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

  function buildSupportPanel() {
    const panel = document.createElement('details');
    panel.className = 'support-panel';
    panel.innerHTML = `
      <summary>Need support?</summary>
      <div class="support-panel-body">
        <p>Tell the projection booth what went wrong. Bug reports, install trouble, accessibility issues, and general help all land here.</p>
        <form class="fb-form" name="support" method="POST" data-netlify="true" netlify-honeypot="bot-field" id="supportForm">
          <input type="hidden" name="form-name" value="support">
          <p class="hp"><label>Leave blank: <input name="bot-field"></label></p>
          <label class="fb-lab" for="supportType">What do you need help with?</label>
          <select class="fb-in" name="type" id="supportType" required>
            <option value="Gameplay problem">Gameplay problem</option>
            <option value="Install or PWA">Install or PWA</option>
            <option value="Accessibility">Accessibility</option>
            <option value="Account or data question">Data or privacy question</option>
            <option value="Other">Other</option>
          </select>
          <label class="fb-lab" for="supportMessage">What happened?</label>
          <textarea class="fb-in" name="message" id="supportMessage" rows="4" placeholder="Include what you clicked, what you expected, and what the theater did instead." required></textarea>
          <label class="fb-lab" for="supportContact">Contact (optional)</label>
          <input class="fb-in" name="contact" id="supportContact" placeholder="Email or handle, if you want a reply">
          <button class="btn btn-primary support-submit" type="submit">Send Support Ticket →</button>
        </form>
        <div class="fb-done" id="supportDone" hidden>
          <div class="fb-ticket"><div class="fb-ticket-h">🎟️ SUPPORT TICKET RECEIVED</div><p id="supportDoneMessage">The projection booth has your note.</p></div>
          <button class="btn btn-ghost support-reset" type="button">Send Another</button>
        </div>
      </div>`;
    return panel;
  }

  function addSettingsTools() {
    const settingsList = document.querySelector('#settings .settings-list');
    if (!settingsList || document.getElementById('supportForm')) return;

    settingsList.append(
      settingsRow('Home Screen', 'Return to the Plot Twisted landing page', 'HOME', goHome),
      settingsRow('Share Game', 'Copy a clean link to send to another movie nerd', 'COPY LINK', copyShareLink)
    );

    const panel = buildSupportPanel();
    settingsList.after(panel);

    const form = panel.querySelector('#supportForm');
    const done = panel.querySelector('#supportDone');
    const doneMessage = panel.querySelector('#supportDoneMessage');
    const reset = panel.querySelector('.support-reset');
    const submit = panel.querySelector('.support-submit');

    form.addEventListener('submit', async (event) => {
      event.preventDefault();
      submit.disabled = true;
      submit.textContent = 'Sending…';
      const body = new URLSearchParams(new FormData(form)).toString();

      try {
        const response = await fetch('/', {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body
        });
        if (!response.ok) throw new Error('Support submission failed');
        form.hidden = true;
        done.hidden = false;
        doneMessage.textContent = 'The projection booth has your note. Add contact information if you would like a reply.';
      } catch (_) {
        submit.disabled = false;
        submit.textContent = 'Try Sending Again';
        done.hidden = false;
        done.querySelector('.fb-ticket').classList.add('support-error');
        doneMessage.textContent = 'The ticket printer jammed. Please try again in a moment.';
      }
    });

    reset.addEventListener('click', () => {
      form.reset();
      form.hidden = false;
      done.hidden = true;
      done.querySelector('.fb-ticket').classList.remove('support-error');
      submit.disabled = false;
      submit.textContent = 'Send Support Ticket →';
      panel.open = true;
    });
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
    rememberCompletedRound();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot, { once: true });
  } else {
    boot();
  }
})();
