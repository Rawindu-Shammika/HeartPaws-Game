// uiManager.js
// Theme 2 - putting all the score updates and UI changes here so it's clean
import { gameState } from './gameState.js';

export function showMainMenu() {
    document.getElementById('login-screen').classList.add('hidden');
    document.getElementById('create-account-screen').classList.add('hidden');

    const backBtn = document.getElementById('global-back-btn');
    if (backBtn) backBtn.classList.add('hidden');

    const muteBtn = document.getElementById('global-mute-btn');
    if (muteBtn) muteBtn.classList.remove('hidden');

    let displayName = localStorage.getItem('paws_display_name') || 'Friend';
    if (displayName.includes('@')) displayName = displayName.split('@')[0];

    // Theme 4 - Mapping encrypted Cloud UID to a user friendly Virtual Identity for UI cohesion.
    const greeting = document.getElementById('main-menu-greeting');
    if (greeting) greeting.innerText = `Welcome Back, ${displayName}!`;

    document.getElementById('main-menu-screen').classList.remove('hidden');
    renderFallingHearts();
}

export function updateMovesDisplay() {
    const movesCounter = document.getElementById('moves-counter');
    if (movesCounter) {
        movesCounter.innerText = `Moves: ${gameState.movesCount}`;
    }
}

export function updateBackwardButton() {
    const btnBackward = document.getElementById('btn-backward');
    if (!btnBackward) return;

    if (gameState.availableBackwardMoves > 0) {
        btnBackward.classList.remove('hidden');
        btnBackward.innerText = `Backward: ${gameState.availableBackwardMoves}`;
    } else {
        btnBackward.classList.add('hidden');
    }
}

export function updateTimerDisplay() {
    const timerDisplay = document.getElementById('timer-display');
    if (!timerDisplay) return;

    if (gameState.timeLimit === null) {
        timerDisplay.innerText = '∞';
    } else {
        const mins = Math.floor(gameState.timeRemaining / 60);
        const secs = gameState.timeRemaining % 60;
        timerDisplay.innerText = `${mins}:${secs.toString().padStart(2, '0')}`;

        // make it flash red when time is running out
        if (gameState.timeRemaining <= 30 && gameState.timeRemaining > 0) {
            timerDisplay.style.animation = 'funny-wiggle 1s infinite';
            timerDisplay.style.color = 'red';
            timerDisplay.style.borderColor = 'red';
        } else {
            timerDisplay.style.animation = 'none';
            timerDisplay.style.color = '#ff4757';
            timerDisplay.style.borderColor = '#ff4757';
        }
    }
}

export function showDifficultyMessage(text) {
    // Fix: this stops the toast from glitching if they keep clicking it
    const existing = document.querySelector('.toast-message');
    if (existing) existing.remove();

    const toast = document.createElement('div');
    toast.className = 'toast-message';
    toast.innerText = text;
    document.body.appendChild(toast);

    // have to restart the animation here otherwise it breaks
    void toast.offsetWidth;
    toast.classList.add('show');

    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => toast.remove(), 500); // Wait for the animation to end first
    }, 3000);
}

export function renderFallingHearts() {
    const container = document.getElementById('hearts-layer');
    if (!container) return;
    container.innerHTML = '';
    const totalHearts = 60;
    for (let i = 0; i < totalHearts; i++) {
        const heart = document.createElement('img');
        heart.src = 'assets/Heart.png';
        heart.alt = 'Heart';
        heart.classList.add('heart');

        const sizeMap = { 0: '20px', 1: '40px', 2: '60px' };
        const randomSizeIndex = Math.floor(Math.random() * 3);
        heart.style.width = sizeMap[randomSizeIndex];

        const isLeftSide = Math.random() > 0.5;
        const leftPos = isLeftSide ? (Math.random() * 30) : (70 + Math.random() * 30);
        heart.style.left = leftPos + '%';

        const animDuration = 4 + Math.random() * 5;
        heart.style.animation = `float-down ${animDuration}s linear infinite`;
        heart.style.animationDelay = (Math.random() * 5) + 's';

        container.appendChild(heart);
    }
}

export function renderGrid() {
    const gameGrid = document.getElementById('game-grid');
    gameGrid.innerHTML = '';

    const rows = gameState.currentLevelState.length;
    const cols = gameState.currentLevelState[0] ? gameState.currentLevelState[0].length : 0;

    for (let y = 0; y < rows; y++) {
        const rowData = gameState.currentLevelState[y];
        for (let x = 0; x < cols; x++) {
            const cellChar = rowData[x] || ' ';
            const tileDiv = document.createElement('div');
            tileDiv.classList.add('tile');

            if (cellChar === '#') {
                tileDiv.classList.add('tile-wall');
            } else if (cellChar !== ' ' && cellChar !== '_') {
                tileDiv.classList.add('tile-floor');
                if ((x + y) % 2 === 0) {
                    tileDiv.classList.add('tile-floor-dark');
                }

                if (cellChar === '.' || cellChar === '*' || cellChar === '+') {
                    const targetDiv = document.createElement('div');
                    targetDiv.classList.add('entity', 'tile-target');
                    tileDiv.appendChild(targetDiv);
                }

                if (cellChar === '$' || cellChar === '*') {
                    const boxDiv = document.createElement('div');
                    boxDiv.classList.add('entity', 'entity-box');
                    tileDiv.appendChild(boxDiv);
                }

                if (cellChar === '@' || cellChar === '+') {
                    const playerDiv = document.createElement('div');
                    playerDiv.classList.add('entity', 'entity-player');
                    tileDiv.appendChild(playerDiv);
                }
            }
            gameGrid.appendChild(tileDiv);
        }
    }
}
