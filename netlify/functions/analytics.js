exports.handler = async function handler() {
  const measurementId = String(process.env.GA_MEASUREMENT_ID || '').trim();
  const context = String(process.env.CONTEXT || 'production');
  const previewsEnabled = String(process.env.GA_ENABLE_PREVIEWS || '').toLowerCase() === 'true';
  const validId = /^G-[A-Z0-9]+$/i.test(measurementId);
  const enabled = validId && (context === 'production' || previewsEnabled);

  const body = `(() => {
    const MEASUREMENT_ID = ${JSON.stringify(enabled ? measurementId : '')};
    const CONSENT_KEY = 'pt_analytics_consent_v1';
    let tagLoaded = false;

    function safeStorageGet() {
      try { return localStorage.getItem(CONSENT_KEY); } catch (_) { return null; }
    }

    function safeStorageSet(value) {
      try { localStorage.setItem(CONSENT_KEY, value); } catch (_) {}
    }

    function defineGtag() {
      window.dataLayer = window.dataLayer || [];
      window.gtag = window.gtag || function gtag(){ window.dataLayer.push(arguments); };
    }

    function updateConsent(analyticsStorage) {
      if (!window.gtag) return;
      window.gtag('consent', 'update', {
        ad_storage: 'denied',
        ad_user_data: 'denied',
        ad_personalization: 'denied',
        analytics_storage: analyticsStorage
      });
    }

    function loadTag() {
      if (!MEASUREMENT_ID || tagLoaded) return;
      tagLoaded = true;
      defineGtag();
      window.gtag('consent', 'default', {
        ad_storage: 'denied',
        ad_user_data: 'denied',
        ad_personalization: 'denied',
        analytics_storage: 'denied'
      });
      updateConsent('granted');
      window.gtag('js', new Date());
      window.gtag('config', MEASUREMENT_ID, {
        send_page_view: true,
        debug_mode: new URLSearchParams(location.search).get('ga_debug') === '1'
      });

      const script = document.createElement('script');
      script.async = true;
      script.src = 'https://www.googletagmanager.com/gtag/js?id=' + encodeURIComponent(MEASUREMENT_ID);
      document.head.appendChild(script);
    }

    function track(name, parameters = {}) {
      if (!MEASUREMENT_ID || safeStorageGet() !== 'granted') return;
      loadTag();
      window.gtag('event', name, parameters);
    }

    function addStyles() {
      if (document.getElementById('pt-analytics-styles')) return;
      const style = document.createElement('style');
      style.id = 'pt-analytics-styles';
      style.textContent = '.pt-consent{position:fixed;left:16px;right:16px;bottom:16px;z-index:10000;max-width:720px;margin:auto;padding:17px 18px;border:1px solid rgba(228,179,76,.42);border-radius:16px;background:rgba(18,11,13,.97);color:#fff8ee;box-shadow:0 22px 60px rgba(0,0,0,.55);font-family:system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif}.pt-consent[hidden]{display:none}.pt-consent-inner{display:flex;align-items:center;gap:18px}.pt-consent-copy{flex:1;min-width:0}.pt-consent strong{display:block;margin-bottom:3px;font-size:14px}.pt-consent p{margin:0;color:#b9aaa0;font-size:12.5px;line-height:1.45}.pt-consent a{color:#e4b34c}.pt-consent-actions{display:flex;gap:8px;flex:0 0 auto}.pt-consent button,.pt-analytics-choice{cursor:pointer;border-radius:10px;font:700 12px/1 system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif}.pt-consent button{min-height:40px;padding:0 14px}.pt-consent-allow{border:0;color:#fff;background:#ff4d8d}.pt-consent-deny{border:1px solid #49373c;color:#fff8ee;background:transparent}.pt-analytics-choice{border:0;padding:0;color:#806f68;background:transparent;text-decoration:underline;text-underline-offset:3px}.pt-analytics-choice:hover{color:#e4b34c}@media(max-width:640px){.pt-consent-inner{align-items:stretch;flex-direction:column}.pt-consent-actions{width:100%}.pt-consent-actions button{flex:1}}';
      document.head.appendChild(style);
    }

    function banner() {
      let node = document.getElementById('ptAnalyticsConsent');
      if (node) return node;
      addStyles();
      node = document.createElement('aside');
      node.className = 'pt-consent';
      node.id = 'ptAnalyticsConsent';
      node.setAttribute('aria-label', 'Analytics preferences');
      node.innerHTML = '<div class="pt-consent-inner"><div class="pt-consent-copy"><strong>Help improve the theater?</strong><p>Allow anonymous Google Analytics so we can see which showings get played and where the projector jams. No guesses, clue text, feedback messages, or contact details are sent. <a href="/privacy">Privacy details</a>.</p></div><div class="pt-consent-actions"><button class="pt-consent-deny" type="button">No thanks</button><button class="pt-consent-allow" type="button">Allow analytics</button></div></div>';
      node.querySelector('.pt-consent-allow').addEventListener('click', () => {
        safeStorageSet('granted');
        loadTag();
        node.hidden = true;
      });
      node.querySelector('.pt-consent-deny').addEventListener('click', () => {
        safeStorageSet('denied');
        updateConsent('denied');
        node.hidden = true;
      });
      document.body.appendChild(node);
      return node;
    }

    function showPreferences() {
      if (!MEASUREMENT_ID) return;
      const node = banner();
      node.hidden = false;
    }

    function addPreferenceLink() {
      if (!MEASUREMENT_ID || document.querySelector('.pt-analytics-choice')) return;
      const host = document.querySelector('.footer-bottom,.privacy-footer-inner,footer .container');
      if (!host) return;
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'pt-analytics-choice';
      button.textContent = 'Analytics choices';
      button.addEventListener('click', showPreferences);
      host.appendChild(button);
    }

    window.ptAnalytics = {
      enabled: Boolean(MEASUREMENT_ID),
      track,
      showPreferences,
      get consent(){ return safeStorageGet(); }
    };

    if (!MEASUREMENT_ID) return;
    const choice = safeStorageGet();
    if (choice === 'granted') loadTag();

    const boot = () => {
      if (!safeStorageGet()) banner();
      addPreferenceLink();
      window.addEventListener('appinstalled', () => track('pwa_install', { app_name: 'Plot Twisted' }));
    };
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot, { once:true });
    else boot();
  })();`;

  return {
    statusCode: 200,
    headers: {
      'Content-Type': 'application/javascript; charset=utf-8',
      'Cache-Control': 'no-store',
      'X-Content-Type-Options': 'nosniff'
    },
    body
  };
};
