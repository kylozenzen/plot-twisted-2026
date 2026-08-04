const clues = [
  { category: "SciFi", clue: "Cubicle guy takes pill and discovers reality is badly coded.", answer: "The Matrix" },
  { category: "Superhero", clue: "Billionaire battles whip electrician while slowly becoming a toxic element.", answer: "Iron Man 2" },
  { category: "Family", clue: "Magical family delays therapy until the house files a formal complaint.", answer: "Encanto" },
  { category: "Streaming Hits", clue: "Chef tries to heal trauma with sandwiches, yelling, and stainless steel.", answer: "The Bear" },
  { category: "Fantasy", clue: "Tiny hiking club returns cursed jewelry to its manufacturer.", answer: "The Lord of the Rings" }
];

let clueIndex = 0;
let demoScore = 0;
const clueText = document.getElementById("clueText");
const answerReveal = document.getElementById("answerReveal");
const revealButton = document.getElementById("revealButton");
const nextButton = document.getElementById("nextButton");
const demoCategory = document.getElementById("demoCategory");
const scoreNode = document.getElementById("demoScore");

function showClue() {
  const current = clues[clueIndex];
  clueText.textContent = current.clue;
  demoCategory.textContent = current.category;
  answerReveal.textContent = "Name the movie";
  answerReveal.classList.remove("revealed");
  revealButton.textContent = "Reveal";
}

revealButton?.addEventListener("click", () => {
  if (!answerReveal.classList.contains("revealed")) {
    answerReveal.textContent = clues[clueIndex].answer;
    answerReveal.classList.add("revealed");
    revealButton.textContent = "Correct";
    demoScore += 100;
    scoreNode.textContent = demoScore;
  }
});

nextButton?.addEventListener("click", () => {
  clueIndex = (clueIndex + 1) % clues.length;
  showClue();
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

if ("serviceWorker" in navigator) {
  window.addEventListener("load", async () => {
    try {
      const registration = await navigator.serviceWorker.register("./sw.js", { updateViaCache: "none" });
      await registration.update();
    } catch (_) {}
  });
}
