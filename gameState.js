// gameState.js
// Theme 2 - active game variables

export let highestUnlockedLevel = 20; // set to 20 to unlock everything for testing 

export let gameState = {
    currentLevelIndex: 0,
    movesCount: 0,
    currentLevelState: [],
    playerPos: { x: 0, y: 0 },
    gameActive: false,
    levelStateHistory: [],
    availableBackwardMoves: 0,
    rescueAttempts: 0,
    rescueTimerInterval: null,
    rescueSolution: 0,
    isMuted: false,
    volume: 0.5,
    happyCatVolume: 0.5,
    difficulty: 'Medium',
    timeLimit: 60, // starting at 1m for medium
    timeRemaining: null,
    timerInterval: null,
    customControls: {
        up: 'ArrowUp',
        down: 'ArrowDown',
        left: 'ArrowLeft',
        right: 'ArrowRight'
    }
};



export function updateGameState(updates) {
    Object.assign(gameState, updates);
}

export function saveStateToHistory() {
    
    gameState.levelStateHistory.push({
        grid: gameState.currentLevelState.map(row => [...row]),
        x: gameState.playerPos.x,
        y: gameState.playerPos.y,
        moves: gameState.movesCount
    });
}
