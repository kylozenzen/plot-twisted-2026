const clues = [
  { clue: "Cubicle guy takes pill and discovers reality is badly coded.", answer: "The Matrix" },
  { clue: "Billionaire battles whip electrician while slowly becoming a toxic element.", answer: "Iron Man 2" },
  { clue: "Magical family delays therapy until the house files a formal complaint.", answer: "Encanto" },
  { clue: "Chef tries to heal trauma with sandwiches, yelling, and stainless steel.", answer: "The Bear" },
  { clue: "Tiny hiking club returns cursed jewelry to its manufacturer.", answer: "The Lord of the Rings" }
];

let clueIndex = 0;
const clueText = document.getElementById("clueText");
const answerReveal = document.getElementById("answerReveal");
const revealButton = document.getElementById("revealButton");
const nextButton = document.getElementById("nextButton");

function showClue() {
  clueText.textContent = clues[clueIndex].clue;
  answerReveal.innerHTML = "&nbsp;";
  revealButton.textContent = "Reveal answer";
}

revealButton.addEventListener("click", () => {
  answerReveal.textContent = clues[clueIndex].answer;
  revealButton.textContent = "Correct, obviously";
});

nextButton.addEventListener("click", () => {
  clueIndex = (clueIndex + 1) % clues.length;
  showClue();
});

document.getElementById("year").textContent = new Date().getFullYear();
