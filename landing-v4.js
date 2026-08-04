const clues = [
  { category: "Superhero", clue: "Billionaire builds a weapon in a cave, rebrands himself as the weapon, and calls it personal growth.", answer: "Iron Man" },
  { category: "SciFi", clue: "Office worker learns reality is a screensaver and joins a leather-based resistance.", answer: "The Matrix" },
  { category: "Family", clue: "Magical family delays therapy until the house files a formal complaint.", answer: "Encanto" },
  { category: "Streaming Hits", clue: "Chef tries to heal trauma with sandwiches, yelling, and stainless steel.", answer: "The Bear" },
  { category: "Fantasy", clue: "Tiny hiking club returns cursed jewelry to its manufacturer.", answer: "The Lord of the Rings" }
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
  }
});

nextButton?.addEventListener("click", (event) => {
  event.stopPropagation();
  clueIndex = (clueIndex + 1) % clues.length;
  showClue();
});

function openGame() {
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
});

window.addEventListener("appinstalled", () => {
  deferredInstallPrompt = null;
  updateInstallUI();
});

installButton?.addEventListener("click", async () => {
  if (isStandalone()) return;

  if (deferredInstallPrompt) {
    deferredInstallPrompt.prompt();
    const choice = await deferredInstallPrompt.userChoice;
    deferredInstallPrompt = null;
    setInstallStatus(choice.outcome === "accepted"
      ? "Installation started. Your ticket stub is becoming an app icon."
      : "No problem—the game still works perfectly in your browser.");
    updateInstallUI();
    return;
  }

  highlightInstallCard(detectInstallPlatform(), true);
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
updateInstallUI();

if ("serviceWorker" in navigator) {
  window.addEventListener("load", async () => {
    try {
      const registration = await navigator.serviceWorker.register("./sw.js", { updateViaCache: "none" });
      await registration.update();
    } catch (_) {}
  });
}
