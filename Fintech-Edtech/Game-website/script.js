
const board = document.getElementById("gameBoard");
const timerDisplay = document.getElementById("timer");
const levelDisplay = document.getElementById("level");
const matchesDisplay = document.getElementById("matches");
const mistakesDisplay = document.getElementById("mistakes");
const xpDisplay = document.getElementById("xp");
const totalXPDisplay = document.getElementById("totalXP");
const hintsDisplay = document.getElementById("hints");
const messageDisplay = document.getElementById("message");
const progressText = document.getElementById("progressText");
const overlay = document.getElementById("overlay");
const resultTitle = document.getElementById("resultTitle");
const resultMessage = document.getElementById("resultMessage");
const resultIcon = document.getElementById("resultIcon");
const resultEyebrow = document.getElementById("resultEyebrow");
const resultActions = document.getElementById("resultActions");

const symbols = [
    "🍎", "🍇", "🍉", "🍒", "🍋", "🍓",
    "⭐", "🌙", "⚡", "💎", "🎯", "🎵",
    "🚀", "🪐", "🌈", "🔥", "🦋", "🌸",
    "🍀", "🎮", "🎲", "🧩", "🏆", "🎨"
];

let level = 1;
let sessionLevels = 5;
let xp = 0;
let hints = 3;
let mistakesLeft = 3;
let secondsLeft = 60;
let pairsFound = 0;
let totalPairs = 4;
let firstCard = null;
let secondCard = null;
let lockBoard = false;
let gameOver = false;
let timerId = null;
let hintTimeout = null;
let runId = 0;
let pendingContinue = false;

function shuffle(items) {
    const result = [...items];

    for (let i = result.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [result[i], result[j]] = [result[j], result[i]];
    }

    return result;
}

function getLevelSettings() {
    const pairs = Math.min(4 + Math.floor((level - 1) / 2), 12);

    let time;

    if (level >= 15) {
        time = Math.max(30, 50 - Math.floor((level - 15) / 3) * 5);
    } else {
        time = Math.max(30, 60 - Math.floor((level - 1) / 3) * 5);
    }

    return { pairs, time };
}

function updateDisplay() {
    levelDisplay.textContent = level;
    timerDisplay.textContent = `${secondsLeft}s`;
    matchesDisplay.textContent = `${pairsFound} / ${totalPairs}`;
    xpDisplay.textContent = xp;
    totalXPDisplay.textContent = xp;
    hintsDisplay.textContent = hints;
    progressText.textContent = `Level ${level} of ${sessionLevels}`;

    timerDisplay.style.color =
        secondsLeft <= 10 ? "#ff829b" : "#7fa0ff";
}

function stopTimer() {
    clearInterval(timerId);
    timerId = null;
}

function clearHintTimeout() {
    clearTimeout(hintTimeout);
    hintTimeout = null;
}

function startTimer() {
    stopTimer();

    timerId = setInterval(() => {
        if (gameOver || lockBoard) return;

        secondsLeft--;
        updateDisplay();

        if (secondsLeft <= 0) {
            endGame("time");
        }
    }, 1000);
}

function startLevel() {
    runId++;
    stopTimer();
    clearHintTimeout();

    gameOver = false;
    pendingContinue = false;
    lockBoard = false;
    firstCard = null;
    secondCard = null;
    mistakesLeft = 3;
    pairsFound = 0;

    const settings = getLevelSettings();
    totalPairs = settings.pairs;
    secondsLeft = settings.time;

    const chosenSymbols = shuffle(symbols).slice(0, totalPairs);
    const cards = shuffle([...chosenSymbols, ...chosenSymbols]);

    board.style.gridTemplateColumns =
        `repeat(${totalPairs <= 6 ? 4 : 6}, minmax(0, 1fr))`;

    board.innerHTML = "";

    cards.forEach((symbol, index) => {
        const card = document.createElement("button");

        card.type = "button";
        card.className = "memory-card";
        card.dataset.symbol = symbol;
        card.dataset.index = index;
        card.setAttribute("aria-label", `Card ${index + 1}, face down`);

        card.addEventListener("click", () => flipCard(card));

        board.appendChild(card);
    });

    messageDisplay.textContent = "Flip two cards to find a matching pair!";
    overlay.hidden = true;
    updateDisplay();
    startTimer();
}

function flipCard(card) {
    if (
        gameOver ||
        lockBoard ||
        card.classList.contains("flipped") ||
        card.classList.contains("matched")
    ) {
        return;
    }

    card.classList.add("flipped");
    card.textContent = card.dataset.symbol;
    card.setAttribute("aria-label", `Card showing ${card.dataset.symbol}`);

    if (!firstCard) {
        firstCard = card;
        return;
    }

    secondCard = card;
    lockBoard = true;

    if (firstCard.dataset.symbol === secondCard.dataset.symbol) {
        handleMatch();
    } else {
        handleMismatch();
    }
}

function handleMatch() {
    firstCard.classList.add("matched");
    secondCard.classList.add("matched");
    firstCard.disabled = true;
    secondCard.disabled = true;

    pairsFound++;
    secondsLeft += 10;

    messageDisplay.textContent = "Perfect match! +10 seconds";
    updateDisplay();

    firstCard = null;
    secondCard = null;
    lockBoard = false;

    if (pairsFound === totalPairs) {
        completeLevel();
    }
}

function handleMismatch() {
    messageDisplay.textContent = "Not a match! Try again.";

    messageDisplay.textContent = "Not a match! Try to remember the cards.";

    const thisRun = runId;

    setTimeout(() => {
        if (thisRun !== runId || gameOver) return;

        [firstCard, secondCard].forEach(card => {
            if (!card) return;

            card.classList.remove("flipped");
            card.textContent = "";
            card.setAttribute(
                "aria-label",
                `Card ${Number(card.dataset.index) + 1}, face down`
            );
        });

        firstCard = null;
        secondCard = null;
        lockBoard = false;

        messageDisplay.textContent = "Choose your next pair.";
    }, 700);
}

function completeLevel() {
    stopTimer();
    gameOver = true;

    const reward = 50 + level * 10;
    xp += reward;

    showResult(
        "🏆",
        "LEVEL COMPLETE",
        `Amazing! You earned ${reward} XP.`,
        "Continue",
        () => {
            if (level % 5 === 0) {
                hints += 3;
            }

            if (level >= sessionLevels) {
                showSessionComplete();
            } else {
                level++;
                startLevel();
            }
        }
    );

    updateDisplay();
}

function showSessionComplete() {
    stopTimer();
    gameOver = true;

    showResult(
        "🎉",
        "SESSION COMPLETE",
        `You completed ${sessionLevels} levels! Your XP: ${xp}.`,
        "Play next session",
        () => {
            sessionLevels += 5;
            level++;
            startLevel();
        }
    );

    addResultButton("Play from Level 1", "secondary", () => {
        level = 1;
        sessionLevels = 5;
        xp = 0;
        hints = 3;
        startLevel();
    });
}

function endGame(reason) {
    if (gameOver) return;

    gameOver = true;
    pendingContinue = true;
    stopTimer();
    clearHintTimeout();

    const reasonText = reason === "time"
        ? "Time ran out!"
        : "You used all three wrong-match chances.";

    showResult(
        "💔",
        "GAME OVER",
        `${reasonText} Spend 100 XP to continue this level, or restart.`,
        "Continue — 100 XP",
        continueLevel
    );

    addResultButton("Restart game", "secondary", () => {
        level = 1;
        xp = 0;
        hints = 3;
        sessionLevels = 5;
        startLevel();
    });
}

function continueLevel() {
    if (!pendingContinue) return;

    if (xp < 100) {
        resultMessage.textContent =
            "You need at least 100 XP to continue. Restart the game instead.";
        return;
    }

    xp -= 100;
    pendingContinue = false;

    startLevel();
}

function useHint() {
    if (gameOver || lockBoard) return;

    if (hints <= 0) {
        messageDisplay.textContent =
            "No hints left! Complete five levels to earn three more.";
        return;
    }

    const unmatched = [...board.querySelectorAll(".memory-card")]
        .filter(card =>
            !card.classList.contains("matched") &&
            !card.classList.contains("flipped")
        );

    if (unmatched.length < 2) return;

    const symbol = unmatched[0].dataset.symbol;
    const pair = unmatched.filter(card => card.dataset.symbol === symbol);

    if (pair.length < 2) return;

    hints--;
    updateDisplay();

    pair.forEach(card => {
        card.classList.add("flipped");
        card.textContent = card.dataset.symbol;
    });

    messageDisplay.textContent = "Hint used! Remember this matching pair.";

    const thisRun = runId;

    clearHintTimeout();
    hintTimeout = setTimeout(() => {
        if (thisRun !== runId || gameOver) return;

        pair.forEach(card => {
            if (!card.classList.contains("matched")) {
                card.classList.remove("flipped");
                card.textContent = "";
            }
        });

        messageDisplay.textContent = "Now find the matching pair!";
    }, 1200);
}

function showResult(icon, eyebrow, message, primaryLabel, primaryAction) {
    resultIcon.textContent = icon;
    resultEyebrow.textContent = eyebrow;
    resultTitle.textContent =
        eyebrow === "GAME OVER" ? "Try again!" :
        eyebrow === "SESSION COMPLETE" ? "Well played!" :
        "Brilliant!";

    resultMessage.textContent = message;
    resultActions.innerHTML = "";
    addResultButton(primaryLabel, "", primaryAction);
    overlay.hidden = false;
}

function addResultButton(label, className, action) {
    const button = document.createElement("button");

    button.type = "button";
    button.textContent = label;

    if (className) button.classList.add(className);

    button.addEventListener("click", action);
    resultActions.appendChild(button);
}

document.getElementById("hintButton").addEventListener("click", useHint);

document.getElementById("restartButton").addEventListener("click", () => {
    level = 1;
    xp = 0;
    hints = 3;
    sessionLevels = 5;
    startLevel();
});

startLevel();
