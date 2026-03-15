// gameEngine.js
// --- MAIN GAME LOOP ---
// Theme 1 - handling all the physics and movement
import { gameState, saveStateToHistory, updateGameState, highestUnlockedLevel } from './gameState.js';
import { updateMovesDisplay, renderGrid, updateTimerDisplay, showMainMenu } from './uiManager.js';
import { HEART_LEVELS } from './levels.js';
import { recordScoreToCloud } from './authManager.js';

// removed loose audio state for clean AudioService integration

export function loadLevel(levelIndex) {
    const heartsLayer = document.getElementById('hearts-layer');
    if (heartsLayer) heartsLayer.innerHTML = '';

    updateGameState({
        movesCount: 0,
        gameActive: true,
        levelStateHistory: [],
        availableBackwardMoves: 0,
        rescueAttempts: 0
    });

    // --- TIMER LOGIC ---
    if (gameState.timerInterval) clearInterval(gameState.timerInterval);
    updateGameState({ timeRemaining: gameState.timeLimit });
    updateTimerDisplay();

    if (gameState.timeLimit !== null) {
        TimerService.start();
    }

    updateMovesDisplay();
    updateBackwardButton();

    const gameGrid = document.getElementById('game-grid');
    gameGrid.innerHTML = '';

    const levelMap = HEART_LEVELS[levelIndex];
    if (!levelMap) return;

    let newState = levelMap.map(row => row.split(''));

    // Fix: finding the exact x and y instead of using the html tags
    let startX = 0, startY = 0;
    for (let r = 0; r < newState.length; r++) {
        for (let c = 0; c < newState[r].length; c++) {
            if (newState[r][c] === '@' || newState[r][c] === '+') {
                startX = c;
                startY = r;
            }
        }
    }

    updateGameState({
        currentLevelState: newState,
        currentLevelIndex: levelIndex,
        playerPos: { x: startX, y: startY }
    });

    const rows = newState.length;
    let cols = 0;
    newState.forEach(row => { if (row.length > cols) cols = row.length; });

    gameGrid.style.gridTemplateColumns = `repeat(${cols}, 50px)`;
    gameGrid.style.gridTemplateRows = `repeat(${rows}, 50px)`;

    renderGrid();
}

function updateBackwardButton() {
    const btnBackward = document.getElementById('btn-backward');
    if (!btnBackward) return;

    if (gameState.availableBackwardMoves > 0) {
        btnBackward.classList.remove('hidden');
        btnBackward.innerText = `Backward: ${gameState.availableBackwardMoves}`;
    } else {
        btnBackward.classList.add('hidden');
    }
}

export const TimerService = {
    start: function () {
        const interval = setInterval(() => {
            if (!gameState.gameActive || gameState.timeRemaining === null) return;

            const currentRemaining = gameState.timeRemaining - 1;

            if (currentRemaining <= 0) {
                this.stop();
                updateGameState({ gameActive: false, timeRemaining: 0 });
                updateTimerDisplay();

                // time's up, game over
                const gameOverPopup = document.getElementById('game-over-popup');
                if (gameOverPopup) gameOverPopup.classList.remove('hidden');
            } else {
                updateGameState({ timeRemaining: currentRemaining });
                updateTimerDisplay();
            }
        }, 1000);

        updateGameState({ timerInterval: interval });
    },
    stop: function () {
        if (gameState.timerInterval) {
            clearInterval(gameState.timerInterval);
            updateGameState({ timerInterval: null });
        }
    },
    reset: function () {
        this.stop();
        updateGameState({ timeRemaining: gameState.timeLimit });
        updateTimerDisplay();
        if (gameState.timeLimit !== null) this.start();
    }
};

export function movePlayer(dx, dy) {
    if (!gameState.gameActive) return;

    const newY = gameState.playerPos.y + dy;
    const newX = gameState.playerPos.x + dx;
    const currentState = gameState.currentLevelState;

    if (newY < 0 || newY >= currentState.length || newX < 0 || newX >= currentState[newY].length) {
        return;
    }

    const nextCell = currentState[newY][newX];
    if (nextCell === '#') return;

    if (nextCell === '$' || nextCell === '*') {
        const beyondY = newY + dy;
        const beyondX = newX + dx;

        if (beyondY < 0 || beyondY >= currentState.length || beyondX < 0 || beyondX >= currentState[beyondY].length) {
            return;
        }

        const beyondCell = currentState[beyondY][beyondX];

        if (beyondCell === ' ' || beyondCell === '.') {
            saveStateToHistory();

            currentState[newY][newX] = (nextCell === '*') ? '.' : ' ';
            currentState[beyondY][beyondX] = (beyondCell === '.') ? '*' : '$';

            updatePlayerPosition(newX, newY);
            updateGameState({
                movesCount: gameState.movesCount + 1,
                currentLevelState: currentState
            });
            updateMovesDisplay();
            renderGrid();
            checkWinCondition();
            return;
        } else {
            return;
        }
    }

    if (nextCell === ' ' || nextCell === '.') {
        saveStateToHistory();
        updatePlayerPosition(newX, newY);
        updateGameState({ movesCount: gameState.movesCount + 1 });
        updateMovesDisplay();
        renderGrid();
        checkWinCondition();
    }
}

function updatePlayerPosition(newX, newY) {
    const currentState = gameState.currentLevelState;
    const currentCell = currentState[gameState.playerPos.y][gameState.playerPos.x];
    currentState[gameState.playerPos.y][gameState.playerPos.x] = (currentCell === '+') ? '.' : ' ';

    const targetCell = currentState[newY][newX];
    currentState[newY][newX] = (targetCell === '.') ? '+' : '@';

    updateGameState({
        playerPos: { x: newX, y: newY },
        currentLevelState: currentState
    });
}

function checkWinCondition() {
    const currentState = gameState.currentLevelState;
    for (let y = 0; y < currentState.length; y++) {
        for (let x = 0; x < currentState[y].length; x++) {
            if (currentState[y][x] === '.' || currentState[y][x] === '+') {
                return false;
            }
        }
    }

    updateGameState({ gameActive: false });

    // unlock the next level if they beat the highest one
    if (gameState.currentLevelIndex + 1 === highestUnlockedLevel) {
        // Todo: add cloud saving for this later
    }

    recordScoreToCloud(gameState.movesCount, gameState.currentLevelIndex);

    // play the happy cat music at the end using event dispatch
    document.dispatchEvent(new Event('levelCompleteState'));

    const completeModal = document.getElementById('level-complete-popup');
    const completeMovesText = document.getElementById('complete-moves-text');
    if (completeMovesText) completeMovesText.innerText = gameState.movesCount;
    if (completeModal) completeModal.classList.remove('hidden');
    return true;
}
