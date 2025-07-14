// ==============================
// Wordle-Style Game Logic (Final Fixed app.js)
// ==============================
let WORDS = [];
let currentWord = "";
let currentRow = 0;
let currentCol = 0;
let gameOver = false;
let board = [];
let keyStatus = {};

const boardElement = document.getElementById("game-board");
const messageElement = document.getElementById("message");
const newWordBtn = document.getElementById("new-word-btn");
const keyboardElement = document.getElementById("keyboard");
const isGamePage = document.getElementById("game-board");

const scoreListEl = document.getElementById("score-list");
const summaryEl = document.getElementById("score-summary");
const resetBtn = document.getElementById("reset-scores");
let scoreList = JSON.parse(localStorage.getItem("scoreList")) || [];

function startNewGame() {
  boardElement.innerHTML = "";
  messageElement.textContent = "";
  currentWord = WORDS[Math.floor(Math.random() * WORDS.length)].toLowerCase();
  currentRow = 0;
  currentCol = 0;
  gameOver = false;
  board = [];
  keyStatus = {};

  for (let i = 0; i < 6; i++) {
    const row = [];
    const rowDiv = document.createElement("div");
    rowDiv.className = "row";
    for (let j = 0; j < 5; j++) {
      const box = document.createElement("div");
      box.className = "box";
      box.textContent = "";
      rowDiv.appendChild(box);
      row.push(box);
    }
    board.push(row);
    boardElement.appendChild(rowDiv);
  }

  generateKeyboard();
}

function generateKeyboard() {
  keyboardElement.innerHTML = "";
  const keys = [
    ..."QWERTYUIOP",
    ..."ASDFGHJKL",
    "Enter",
    ..."ZXCVBNM",
    "Backspace",
  ];

  keys.forEach((key) => {
    const keyBtn = document.createElement("button");
    keyBtn.textContent = key;
    keyBtn.className = "key";
    if (key === "Enter") keyBtn.classList.add("enter");
    if (key === "Backspace") keyBtn.classList.add("backspace");
    if (keyStatus[key.toLowerCase()]) {
      keyBtn.classList.add(keyStatus[key.toLowerCase()]);
    }
    keyBtn.addEventListener("click", () => handleKeyPress(key));
    keyboardElement.appendChild(keyBtn);
  });
}

function updateKeyboard(letter, status) {
  const prev = keyStatus[letter];
  const order = { wrong: 1, partial: 2, correct: 3 };
  if (!prev || order[status] > order[prev]) {
    keyStatus[letter] = status;
  }
  generateKeyboard();
}

function handleKeyPress(key) {
  if (gameOver) return;

  if (key === "Backspace") {
    if (currentCol > 0) {
      currentCol--;
      const box = board[currentRow][currentCol];
      box.textContent = "";
      box.removeAttribute("data-letter");
    }
    return;
  }

  if (key === "Enter") {
    if (currentCol === 5) {
      validateRealWord();
    }
    return;
  }

  if (/^[A-Z]$/.test(key) && currentCol < 5) {
    const box = board[currentRow][currentCol];
    box.textContent = key;
    box.dataset.letter = key.toLowerCase();
    currentCol++;
  }
}

function validateRealWord() {
  const guess = board[currentRow]
    .map((box) => box.dataset.letter || "")
    .join("");
  if (guess.length !== 5) return;

  fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${guess}`)
    .then((res) => {
      if (!res.ok) throw new Error();
      return res.json();
    })
    .then(() => validateGuess(guess))
    .catch(() => {
      messageElement.textContent = `❌ "${guess}" is not a valid word. Try again.`;
    });
}

function validateGuess(guess) {
  const tempWord = currentWord.split("");
  const guessArr = guess.split("");
  const used = Array(5).fill(false);

  for (let i = 0; i < 5; i++) {
    if (guessArr[i] === tempWord[i]) {
      board[currentRow][i].classList.add("correct");
      updateKeyboard(guessArr[i], "correct");
      used[i] = true;
      guessArr[i] = null;
    }
  }

  for (let i = 0; i < 5; i++) {
    if (!board[currentRow][i].classList.contains("correct")) {
      const index = tempWord.findIndex((char, j) => char === guessArr[i] && !used[j]);
      if (index > -1) {
        board[currentRow][i].classList.add("partial");
        updateKeyboard(guessArr[i], "partial");
        used[index] = true;
      } else {
        board[currentRow][i].classList.add("wrong");
        updateKeyboard(guessArr[i], "wrong");
      }
    }
  }

  if (guess === currentWord) {
    const roundScore = 100 - currentRow * 20;
    scoreList.push(roundScore);
    localStorage.setItem("scoreList", JSON.stringify(scoreList));
    messageElement.textContent = `🎉 Correct! You scored ${roundScore} points! Starting next word...`;
    gameOver = true;
    setTimeout(startNewGame, 2000);
    return;
  }

  currentRow++;
  currentCol = 0;

  if (currentRow === 6) {
    scoreList.push(0);
    localStorage.setItem("scoreList", JSON.stringify(scoreList));
    messageElement.textContent = `❌ Out of tries! The word was "${currentWord}". Starting next word...`;
    gameOver = true;
    setTimeout(startNewGame, 2000);
  }
}

if (newWordBtn) newWordBtn.addEventListener("click", startNewGame);

document.addEventListener("keydown", (e) => {
  const key =
    e.key.length === 1
      ? e.key.toUpperCase()
      : e.key === "Backspace" || e.key === "Enter"
      ? e.key
      : null;
  if (key) handleKeyPress(key);
});

if (isGamePage) {
  fetch("words.txt")
    .then((response) => response.text())
    .then((text) => {
      WORDS = text
        .split("\n")
        .map((word) => word.trim().toLowerCase())
        .filter((word) => word.length === 5);
      startNewGame();
    })
    .catch((error) => {
      console.error("Error loading word list:", error);
      WORDS = [
        "plant",
        "brick",
        "world",
        "flame",
        "glove",
        "crane",
        "sugar",
        "pride",
        "smile",
        "eagle",
      ];
      startNewGame();
    });
}

if (scoreListEl && summaryEl && resetBtn) {
  function displayScores() {
    scoreListEl.innerHTML = "";

    if (scoreList.length === 0) {
      summaryEl.textContent = "No scores yet. Go play a round!";
      return;
    }

    let total = 0;
    scoreList.forEach((score, index) => {
      total += score;
      const li = document.createElement("li");
      li.textContent = `Game ${index + 1}: ${score} points`;
      scoreListEl.appendChild(li);
    });

    summaryEl.textContent = `Total games: ${scoreList.length} | Total score: ${total} points`;
  }

  resetBtn.addEventListener("click", () => {
    if (confirm("Are you sure you want to reset your scores?")) {
      localStorage.removeItem("scoreList");
      location.reload();
    }
  });

  displayScores();
}

// burger menu and sticky header
const burgerBtn = document.querySelector(".burger");
const navMenu = document.querySelector(".nav-links");
const header = document.querySelector("header");

burgerBtn?.addEventListener("click", () => navMenu.classList.toggle("open"));

window.addEventListener("scroll", () => {
  header.classList.toggle("sticky", window.scrollY > 0);
});
