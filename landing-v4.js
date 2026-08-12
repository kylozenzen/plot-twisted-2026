const PLAYED_KEY = "pt_has_played";
const HOME_BYPASS_KEY = "pt_home_bypass";
const pendingAnalytics = [];

function trackAnalytics(name, parameters = {}) {
  if (window.ptAnalytics?.track) {
    window.ptAnalytics.track(name, parameters);
    return;
  }
  pendingAnalytics.push([name, parameters]);
}

(function loadBetaAssets() {
  if (!document.querySelector('link[href="./site-polish.css"]')) {
    const polish = document.createElement("link");
    polish.rel = "stylesheet";
    polish.href = "./site-polish.css";
    document.head.appendChild(polish);
  }

  const analytics = document.createElement("script");
  analytics.src = "/.netlify/functions/analytics";
  analytics.addEventListener("load", () => {
    while (pendingAnalytics.length && window.ptAnalytics?.track) {
      const [name, parameters] = pendingAnalytics.shift();
      window.ptAnalytics.track(name, parameters);
    }
  });
  document.head.appendChild(analytics);

  const hero = document.querySelector(".hero");
  if (hero && !hero.querySelector(".hero-atmosphere")) {
    const atmosphere = document.createElement("div");
    atmosphere.className = "hero-atmosphere";
    atmosphere.setAttribute("aria-hidden", "true");
    hero.prepend(atmosphere);
  }
})();

(function routeReturningPlayers() {
  try {
    const params = new URLSearchParams(window.location.search);
    if (params.get("home") === "1") {
      sessionStorage.setItem(HOME_BYPASS_KEY, "1");
      params.delete("home");
      const query = params.toString();
      const cleanUrl = `${window.location.pathname}${query ? `?${query}` : ""}${window.location.hash}`;
      window.history.replaceState({}, "", cleanUrl);
    }

    const hasPlayed = localStorage.getItem(PLAYED_KEY) === "true";
    const homeBypass = sessionStorage.getItem(HOME_BYPASS_KEY) === "1";
    const standalone = window.matchMedia?.("(display-mode: standalone)").matches || window.navigator.standalone === true;
    if (hasPlayed && !homeBypass && !standalone) window.location.replace("./play");
  } catch (_) {}
})();

const clues = [
  { category: "Superhero", clue: "Billionaire builds a weapon in a cave, rebrands himself as the weapon, and calls it personal growth.", answer: "Iron Man" },
  { category: "SciFi", clue: "Office worker learns reality is a screensaver and joins a leather-based resistance.", answer: "The Matrix" },
  { category: "Family", clue: "Magical family delays therapy until the house files a formal complaint.", answer: "Encanto" },
  { category: "Streaming Hits", clue: "Chef tries to heal trauma with sandwiches, yelling, and stainless steel.", answer: "The Bear" },
  { category: "Fantasy", clue: "Tiny hiking club returns cursed jewelry to its manufacturer.", answer: "The Lord of the Rings" },
  { category: "Horror", clue: "Small-town mayor protects summer revenue by ignoring a very bitey tourism problem.", answer: "Jaws" },
  { category: "Classics", clue: "Teen damages the family timeline and must make his parents attracted to each other again.", answer: "Back to the Future" }
];

let clueIndex = 0;
let demoScore = 0;
let deferredInstallPrompt = null;

const clueText = document.getElementById("clueText");
const answerReveal = document.getElementById("answerReveal");
const revealButton = document.getElementById("revealButton");
const nextButton = document.getElementById("nextButton");
const demoCategory = document.getElementById("demoCategory");
const scoreNode = document.getElementById("demoScore");
const gamePreview = document.querySelector("[data-game-link]");
const installButton = document.getElementById("installAppButton");
const installStatus = document.getElementById("installStatus");
const installCards = [...document.querySelectorAll("[data-install-platform]")];

function rememberLandingForThisSession() {
  try { sessionStorage.setItem(HOME_BYPASS_KEY, "1"); } catch (_) {}
}

function ctaLocation(link) {
  if (link.closest(".site-nav")) return "navigation";
  if (link.closest(".hero")) return "hero";
  if (link.closest(".install-section")) return "install_section";
  if (link.closest(".cta-section")) return "final_cta";
  return "landing_page";
}

document.querySelectorAll(".game-link").forEach((link) => {
  link.addEventListener("click", () => {
    rememberLandingForThisSession();
    trackAnalytics("select_content", {
      content_type: "game_entry",
      content_id: `plot_twisted_${ctaLocation(link)}`
    });
  });
});

function makeLandingBetaChip(label) {
  const chip = document.createElement("span");
  chip.className = "landing-beta-chip";
  chip.textContent = label;
  return chip;
}

function addLandingBetaLabels() {
  const navLogo = document.querySelector(".site-nav .nav-logo");
  if (navLogo && !navLogo.querySelector(".landing-beta-chip")) navLogo.appendChild(makeLandingBetaChip("Beta"));

  const heroEyebrow = document.querySelector(".hero-brandline .eyebrow");
  if (heroEyebrow && !heroEyebrow.querySelector(".landing-beta-chip")) heroEyebrow.appendChild(makeLandingBetaChip("Now in beta"));

  const installLabel = document.querySelector(".install-intro > .section-label");
  if (installLabel && !installLabel.querySelector(".landing-beta-chip")) installLabel.appendChild(makeLandingBetaChip("Beta build"));

  const cta = document.querySelector(".cta-inner");
  if (cta && !cta.querySelector(":scope > .landing-beta-chip")) cta.prepend(makeLandingBetaChip("Now in beta"));
}

function showClue() {
  const current = clues[clueIndex];
  clueText.textContent = current.clue;
  demoCategory.textContent = current.category;
  answerReveal.textContent = "Name the movie";
  answerReveal.classList.remove("revealed");
  revealButton.textContent = "Reveal";
}

revealButton?.addEventListener("click", (event) => {
  event.stopPropagation();
  if (!answerReveal.classList.contains("revealed")) {
    answerReveal.textContent = clues[clueIndex].answer;
    answerReveal.classList.add("revealed");
    revealButton.textContent = "Correct";
    demoScore += 100;
    scoreNode.textContent = demoScore;
    trackAnalytics("select_content", {
      content_type: "demo_clue",
      content_id: `reveal_${clues[clueIndex].category.toLowerCase().replace(/\s+/g, "_")}`
    });
  }
});

nextButton?.addEventListener("click", (event) => {
  event.stopPropagation();
  clueIndex = (clueIndex + 1) % clues.length;
  showClue();
  trackAnalytics("demo_next_clue", { game_category: clues[clueIndex].category });
});

function openGame() {
  rememberLandingForThisSession();
  trackAnalytics("select_content", { content_type: "game_entry", content_id: "plot_twisted_phone_demo" });
  const target = gamePreview?.dataset.gameLink || "./play";
  window.location.assign(target);
}

gamePreview?.addEventListener("click", (event) => {
  if (event.target.closest("button")) return;
  openGame();
});

gamePreview?.addEventListener("keydown", (event) => {
  if (event.key === "Enter" || event.key === " ") {
    event.preventDefault();
    openGame();
  }
});

function isStandalone() {
  return window.matchMedia?.("(display-mode: standalone)").matches || window.navigator.standalone === true;
}

function detectInstallPlatform() {
  const ua = navigator.userAgent || "";
  const isIOS = /iPad|iPhone|iPod/.test(ua) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
  if (isIOS) return "ios";
  if (/Android/i.test(ua)) return "android";
  return "desktop";
}

function highlightInstallCard(platform, shouldScroll = false) {
  installCards.forEach((card) => card.classList.toggle("is-recommended", card.dataset.installPlatform === platform));
  const selected = installCards.find((card) => card.dataset.installPlatform === platform);
  if (shouldScroll) selected?.scrollIntoView({ behavior: "smooth", block: "center" });
}

function setInstallStatus(message) {
  if (installStatus) installStatus.textContent = message;
}

function updateInstallUI() {
  const platform = detectInstallPlatform();
  highlightInstallCard(platform);

  if (!installButton) return;
  if (isStandalone()) {
    installButton.textContent = "Already installed";
    installButton.disabled = true;
    setInstallStatus("Plot Twisted is already running as an installed app on this device.");
    return;
  }

  if (deferredInstallPrompt) {
    installButton.textContent = "Install Plot Twisted";
    installButton.disabled = false;
    setInstallStatus("Your browser can install the game directly from this page.");
    return;
  }

  installButton.textContent = platform === "ios" ? "Show iPhone steps" : "Show install steps";
  installButton.disabled = false;
  setInstallStatus(platform === "ios"
    ? "On iPhone or iPad, installation happens through Safari's Share menu."
    : "Use the button when available, or follow the steps for your device.");
}

window.addEventListener("beforeinstallprompt", (event) => {
  event.preventDefault();
  deferredInstallPrompt = event;
  updateInstallUI();
  trackAnalytics("pwa_install_available", { install_platform: detectInstallPlatform() });
});

window.addEventListener("appinstalled", () => {
  deferredInstallPrompt = null;
  updateInstallUI();
});

installButton?.addEventListener("click", async () => {
  if (isStandalone()) return;
  const platform = detectInstallPlatform();

  if (deferredInstallPrompt) {
    trackAnalytics("pwa_install_prompt", { install_platform: platform });
    deferredInstallPrompt.prompt();
    const choice = await deferredInstallPrompt.userChoice;
    deferredInstallPrompt = null;

    if (choice.outcome === "accepted") {
      installButton.textContent = "Installation requested";
      installButton.disabled = true;
      setInstallStatus("Installation started. Your ticket stub is becoming an app icon.");
    } else {
      updateInstallUI();
      setInstallStatus("No problem—the game still works perfectly in your browser.");
      trackAnalytics("pwa_install_dismiss", { install_platform: platform });
    }
    return;
  }

  trackAnalytics("pwa_install_instructions", { install_platform: platform });
  highlightInstallCard(platform, true);
});

const revealElements = document.querySelectorAll(".reveal");
if ("IntersectionObserver" in window) {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("in");
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.1 });
  revealElements.forEach((element) => observer.observe(element));
} else {
  revealElements.forEach((element) => element.classList.add("in"));
}

document.getElementById("year").textContent = new Date().getFullYear();
addLandingBetaLabels();
updateInstallUI();

if ("serviceWorker" in navigator) {
  window.addEventListener("load", async () => {
    try {
      const registration = await navigator.serviceWorker.register("./sw.js", { updateViaCache: "none" });
      await registration.update();
    } catch (_) {}
  });
}
