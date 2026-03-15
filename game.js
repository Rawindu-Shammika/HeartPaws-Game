// --- MAIN JAVASCRIPT FILE ---
// Theme 5 - plugging everything together so the game runs

import { gameState, updateGameState, highestUnlockedLevel } from './gameState.js';
import { renderFallingHearts, showMainMenu, updateMovesDisplay, updateBackwardButton, renderGrid, showDifficultyMessage, updateTimerDisplay } from './uiManager.js';
import { loadLevel, movePlayer, TimerService } from './gameEngine.js';
import { loginUser, registerUser, signInWithGoogle, saveVirtualIdentity } from './authManager.js';
import { fetchRescueChallenge } from './apiService.js';

document.addEventListener('DOMContentLoaded', () => {
    // Start falling hearts when they load the page
    renderFallingHearts();

    function saveAudioPrefs() {
        let uid = 'fallback_local_user';
        const match = document.cookie.match(/(^|;) ?paws_session=([^;]*)(;|$)/);
        if (match) {
            try {
                const parsed = JSON.parse(decodeURIComponent(match[2]));
                if (parsed.uid) uid = parsed.uid;
            } catch (e) {
                uid = decodeURIComponent(match[2]);
            }
        }
        const sessionData = JSON.stringify({ uid, meowVolume: gameState.volume, happyCatVolume: gameState.happyCatVolume });
        document.cookie = `paws_session=${encodeURIComponent(sessionData)}; max-age=86400; path=/; samesite=strict`;
    }

    function loadAudioPrefs() {
        const match = document.cookie.match(/(^|;) ?paws_session=([^;]*)(;|$)/);
        if (match) {
            try {
                const parsed = JSON.parse(decodeURIComponent(match[2]));
                if (parsed.meowVolume !== undefined) updateGameState({ volume: parsed.meowVolume });
                if (parsed.happyCatVolume !== undefined) updateGameState({ happyCatVolume: parsed.happyCatVolume });
            } catch (e) {
                console.log("No valid JSON audio prefs found in cookie, keeping defaults.");
            }
        }
    }

    loadAudioPrefs();

    // Getting all the screens ready
    const tapToPlayBtn = document.getElementById('tap-to-play-btn');
    const startScreen = document.getElementById('start-screen');
    const loginScreen = document.getElementById('login-screen');
    const createAccountScreen = document.getElementById('create-account-screen');
    const mainMenuScreen = document.getElementById('main-menu-screen');
    const levelsScreen = document.getElementById('levels-screen');
    const optionsScreen = document.getElementById('options-screen');
    const howToPlayScreen = document.getElementById('how-to-play-screen');
    const gamePlayScreen = document.getElementById('game-play-screen');

    const linkCreateAccount = document.getElementById('link-create-account');
    const linkBackToLogin = document.getElementById('link-back-to-login');
    const backBtn = document.getElementById('global-back-btn');

    tapToPlayBtn.addEventListener('click', () => {

        startScreen.classList.add('hidden');
        loginScreen.classList.remove('hidden');
        backBtn.classList.remove('hidden');

        const savedIdentifier = localStorage.getItem('paws_saved_id');
        if (savedIdentifier) {
            document.getElementById('username').value = savedIdentifier;
        }
    });

    backBtn.addEventListener('click', () => {
        if (!createAccountScreen.classList.contains('hidden')) {
            createAccountScreen.classList.add('hidden');
            loginScreen.classList.remove('hidden');
        } else if (!mainMenuScreen.classList.contains('hidden')) {
            mainMenuScreen.classList.add('hidden');
            loginScreen.classList.remove('hidden');
            document.cookie = "paws_session=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
            AudioService.stopBgMusic();
        } else if (!loginScreen.classList.contains('hidden')) {
            loginScreen.classList.add('hidden');
            startScreen.classList.remove('hidden');
            backBtn.classList.add('hidden');
        }
    });

    linkCreateAccount.addEventListener('click', (e) => {
        e.preventDefault();
        loginScreen.classList.add('hidden');
        createAccountScreen.classList.remove('hidden');
    });

    linkBackToLogin.addEventListener('click', (e) => {
        e.preventDefault();
        createAccountScreen.classList.add('hidden');
        loginScreen.classList.remove('hidden');
    });

    // --- LOGIN MENU STUFF ---
    document.getElementById('login-form').addEventListener('submit', (e) => {
        e.preventDefault();
        const loginIdentifier = document.getElementById('username').value.trim();
        const loginPassword = document.getElementById('password').value;
        loginUser(loginIdentifier, loginPassword);
    });

    document.getElementById('create-account-form').addEventListener('submit', (e) => {
        e.preventDefault();

        const createUsername = document.getElementById('reg-username').value.trim();
        const createPassword = document.getElementById('reg-password').value;
        const confirmPassword = document.getElementById('reg-password-confirm').value;

        if (createPassword !== confirmPassword) {
            alert("Passwords do not match!");
            return;
        }
        registerUser(createUsername, createPassword);
    });

    // Google Sign In (needs standard button injected manually if desired, or skip if removed)
    // const btnGoogleAuth = document.getElementById('btn-google-auth');
    // if(btnGoogleAuth) btnGoogleAuth.addEventListener('click', signInWithGoogle);

    // Main Menu buttons
    const btnContinue = document.getElementById('btn-continue');
    const btnNewGame = document.getElementById('btn-new-game');
    const btnLevels = document.getElementById('btn-levels');
    const btnOptions = document.getElementById('btn-options');
    const btnHowToPlay = document.getElementById('btn-how-to-play');
    const btnExit = document.getElementById('btn-exit');

    const newGameConfirmPopup = document.getElementById('new-game-confirm-popup');

    btnNewGame.addEventListener('click', () => {
        newGameConfirmPopup.classList.remove('hidden');
    });

    document.getElementById('btn-new-game-cancel').addEventListener('click', () => {
        newGameConfirmPopup.classList.add('hidden');
    });

    document.getElementById('btn-new-game-confirm').addEventListener('click', () => {
        newGameConfirmPopup.classList.add('hidden');
        mainMenuScreen.classList.add('hidden');
        gamePlayScreen.classList.remove('hidden');
        loadLevel(0);
    });

    btnContinue.addEventListener('click', () => {
        mainMenuScreen.classList.add('hidden');
        gamePlayScreen.classList.remove('hidden');
        loadLevel(highestUnlockedLevel - 1);
    });

    btnLevels.addEventListener('click', () => {
        mainMenuScreen.classList.add('hidden');
        levelsScreen.classList.remove('hidden');
        renderLevelButtons();
    });

    document.getElementById('btn-back-to-main').addEventListener('click', () => {
        levelsScreen.classList.add('hidden');
        mainMenuScreen.classList.remove('hidden');
    });

    btnOptions.addEventListener('click', () => {
        mainMenuScreen.classList.add('hidden');
        optionsScreen.classList.remove('hidden');
    });

    // Options stuff
    const optionsMainModal = document.getElementById('options-main-modal');
    const optionsAudioModal = document.getElementById('options-audio-modal');
    const optionsControlsModal = document.getElementById('options-controls-modal');
    const optionsDifficultyModal = document.getElementById('options-difficulty-modal');

    document.getElementById('btn-opt-audio').addEventListener('click', () => {
        optionsMainModal.classList.add('hidden');
        optionsAudioModal.classList.remove('hidden');
    });

    document.getElementById('btn-back-from-audio').addEventListener('click', () => {
        optionsAudioModal.classList.add('hidden');
        optionsMainModal.classList.remove('hidden');
    });

    document.getElementById('btn-opt-controls').addEventListener('click', () => {
        optionsMainModal.classList.add('hidden');
        optionsControlsModal.classList.remove('hidden');
    });

    document.getElementById('btn-back-from-controls').addEventListener('click', () => {
        optionsControlsModal.classList.add('hidden');
        optionsMainModal.classList.remove('hidden');
    });

    document.getElementById('btn-opt-difficulty').addEventListener('click', () => {
        optionsMainModal.classList.add('hidden');
        optionsDifficultyModal.classList.remove('hidden');
    });

    document.getElementById('btn-back-from-difficulty').addEventListener('click', () => {
        optionsDifficultyModal.classList.add('hidden');
        optionsMainModal.classList.remove('hidden');
    });

    document.getElementById('btn-back-from-options').addEventListener('click', () => {
        optionsScreen.classList.add('hidden');
        mainMenuScreen.classList.remove('hidden');
    });

    // --- AUDIO SETTINGS ---
    const AudioService = {
        bgMusic: document.getElementById('bg-music'),
        volumeSlider: document.getElementById('volume-slider'),
        happyCatVolumeSlider: document.getElementById('happy-cat-volume-slider'),

        init: function () {
            if (this.volumeSlider && this.bgMusic) {
                this.volumeSlider.value = gameState.volume;
                this.bgMusic.volume = gameState.volume;

                this.volumeSlider.addEventListener('input', (e) => {
                    const newVolume = parseFloat(e.target.value);
                    updateGameState({ volume: newVolume });
                    this.bgMusic.volume = newVolume;
                    saveAudioPrefs();
                });
            }

            if (this.happyCatVolumeSlider) {
                this.happyCatVolumeSlider.value = gameState.happyCatVolume;
                this.happyCatVolumeSlider.addEventListener('input', (e) => {
                    const newVolume = parseFloat(e.target.value);
                    updateGameState({ happyCatVolume: newVolume });
                    saveAudioPrefs();
                });
            }
        },
        playBgMusic: function () {
            const levelPop = document.getElementById('level-complete-popup');
            if (this.bgMusic && this.bgMusic.paused && !gameState.isMuted && levelPop && levelPop.classList.contains('hidden')) {
                this.bgMusic.play().catch(e => console.log('Autoplay prevented:', e));
            }
        },
        pauseBgMusic: function () {
            if (this.bgMusic) this.bgMusic.pause();
        },
        stopBgMusic: function () {
            if (this.bgMusic) {
                this.bgMusic.pause();
                this.bgMusic.currentTime = 0;
            }
        },
        playHappyCat: function () {
            if (!gameState.isMuted) {
                this.pauseBgMusic();
                this.currentWinAudio = new Audio('assets/happycat.mp3');
                this.currentWinAudio.volume = gameState.happyCatVolume;
                this.currentWinAudio.play().catch(e => console.log('Audio prevented:', e));
            }
        },
        stopHappyCat: function () {
            if (this.currentWinAudio) {
                this.currentWinAudio.pause();
                this.currentWinAudio.currentTime = 0;
                this.currentWinAudio = null;
            }
        }
    };

    AudioService.init();

    // Listen for level complete event
    document.addEventListener('levelCompleteState', () => {
        AudioService.playHappyCat();
    });

    // Start the meow sound when they login 
    document.addEventListener('click', () => {
        AudioService.playBgMusic();
    }, { once: true });

    // Top left mute button
    const muteBtn = document.getElementById('global-mute-btn');
    if (muteBtn) {
        muteBtn.addEventListener('click', () => {
            const newState = !gameState.isMuted;
            updateGameState({ isMuted: newState });

            if (newState) {
                AudioService.pauseBgMusic();
                muteBtn.innerText = '😾';
                muteBtn.style.background = '#ccc';
            } else {
                AudioService.playBgMusic();
                muteBtn.innerText = '😺';
                muteBtn.style.background = 'var(--light-beige)';
            }
        });
    }

    // Difficulty buttons - easy is 2m, med is 1m, hard is 30s
    const diffButtons = {
        'Easy': document.getElementById('btn-diff-easy'),
        'Medium': document.getElementById('btn-diff-medium'),
        'Hard': document.getElementById('btn-diff-hard')
    };

    const difficultyConfig = {
        'Easy': { timeLimit: 120, toastText: "Easy mode: 2 Minutes" },
        'Medium': { timeLimit: 60, toastText: "Medium mode: 1 Minute" },
        'Hard': { timeLimit: 30, toastText: "Hard mode: 30 Seconds" }
    };

    function updateDifficultyUI(selectedDiff, showToast = false) {
        Object.values(diffButtons).forEach(btn => btn.classList.remove('active'));
        diffButtons[selectedDiff].classList.add('active');

        const config = difficultyConfig[selectedDiff];
        updateGameState({ difficulty: selectedDiff, timeLimit: config.timeLimit });

        if (showToast) {
            showDifficultyMessage(config.toastText);
        }
    }

    updateDifficultyUI(gameState.difficulty, false);

    Object.keys(diffButtons).forEach(diff => {
        diffButtons[diff].addEventListener('click', () => updateDifficultyUI(diff, true));
    });

    // Controls buttons - changing the keys to move
    let activeBindKey = null;

    const bindButtons = {
        up: document.getElementById('btn-bind-up'),
        down: document.getElementById('btn-bind-down'),
        left: document.getElementById('btn-bind-left'),
        right: document.getElementById('btn-bind-right')
    };

    function updateControlsUI() {
        bindButtons.up.innerText = gameState.customControls.up;
        bindButtons.down.innerText = gameState.customControls.down;
        bindButtons.left.innerText = gameState.customControls.left;
        bindButtons.right.innerText = gameState.customControls.right;
    }

    updateControlsUI();

    Object.keys(bindButtons).forEach(direction => {
        bindButtons[direction].addEventListener('click', (e) => {
            if (activeBindKey) {
                bindButtons[activeBindKey].style.background = 'var(--cute-yellow)';
            }
            activeBindKey = direction;
            e.target.innerText = 'Press Key...';
            e.target.style.background = '#ffeb3b';
        });
    });

    btnHowToPlay.addEventListener('click', () => {
        mainMenuScreen.classList.add('hidden');
        howToPlayScreen.classList.remove('hidden');
    });

    document.getElementById('btn-back-from-how-to-play').addEventListener('click', () => {
        howToPlayScreen.classList.add('hidden');
        mainMenuScreen.classList.remove('hidden');
    });

    const exitConfirmPopup = document.getElementById('exit-confirm-popup');
    btnExit.addEventListener('click', () => {
        exitConfirmPopup.classList.remove('hidden');
    });

    document.getElementById('btn-confirm-cancel').addEventListener('click', () => {
        exitConfirmPopup.classList.add('hidden');
    });

    document.getElementById('btn-confirm-exit').addEventListener('click', () => {
        exitConfirmPopup.classList.add('hidden');
        mainMenuScreen.classList.add('hidden');
        loginScreen.classList.remove('hidden');
        backBtn.classList.remove('hidden');
        document.cookie = "paws_session=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
    });

    // creating the grid layout
    function renderLevelButtons() {
        const levelsGrid = document.getElementById('levels-grid-container');
        levelsGrid.innerHTML = '';

        for (let i = 1; i <= 10; i++) {
            const btn = document.createElement('button');
            btn.classList.add('level-btn');
            btn.innerText = i;

            if (i > highestUnlockedLevel) {
                btn.classList.add('locked');
                const lockIcon = document.createElement('span');
                lockIcon.classList.add('lock-icon');
                lockIcon.innerText = '🔒';
                btn.appendChild(lockIcon);

                btn.addEventListener('click', () => {
                    alert(`Level ${i} is locked! Clear Level ${i - 1} first.`);
                });
            } else {
                if (i === highestUnlockedLevel) {
                    btn.classList.add('active-level');
                }
                btn.addEventListener('click', () => {
                    levelsScreen.classList.add('hidden');
                    gamePlayScreen.classList.remove('hidden');
                    loadLevel((i - 1) < 10 ? (i - 1) : 0);
                });
            }
            levelsGrid.appendChild(btn);
        }
    }

    // --- KEYBOARD CONTROLS ---
    document.addEventListener('keydown', (e) => {
        // saving the new key if they change controls
        if (activeBindKey && !optionsScreen.classList.contains('hidden')) {
            e.preventDefault();
            const controls = { ...gameState.customControls };
            controls[activeBindKey] = e.key;
            updateGameState({ customControls: controls });

            bindButtons[activeBindKey].style.background = 'var(--cute-yellow)';
            activeBindKey = null;
            updateControlsUI();
            return;
        }

        if (!gameState.gameActive) return;

        switch (e.key) {
            case gameState.customControls.up:
            case 'w':
            case 'W':
                movePlayer(0, -1);
                break;
            case gameState.customControls.down:
            case 's':
            case 'S':
                movePlayer(0, 1);
                break;
            case gameState.customControls.left:
            case 'a':
            case 'A':
                movePlayer(-1, 0);
                break;
            case gameState.customControls.right:
            case 'd':
            case 'D':
                movePlayer(1, 0);
                break;
            case 'r':
            case 'R':
                loadLevel(gameState.currentLevelIndex);
                break;
        }
    });

    // Game Pause Menu buttons
    const btnPause = document.getElementById('btn-pause');
    const btnClose = document.getElementById('btn-close');
    const pauseMenuPopup = document.getElementById('pause-menu-popup');
    const mainMenuConfirmPopup = document.getElementById('main-menu-confirm-popup');

    btnPause.addEventListener('click', () => {
        updateGameState({ gameActive: false });
        pauseMenuPopup.classList.remove('hidden');
    });

    document.getElementById('btn-pause-continue').addEventListener('click', () => {
        pauseMenuPopup.classList.add('hidden');
        updateGameState({ gameActive: true });
    });

    document.getElementById('btn-pause-restart').addEventListener('click', () => {
        pauseMenuPopup.classList.add('hidden');
        loadLevel(gameState.currentLevelIndex);
    });

    btnClose.addEventListener('click', () => {
        updateGameState({ gameActive: false });
        mainMenuConfirmPopup.classList.remove('hidden');
    });

    document.getElementById('btn-main-menu-cancel').addEventListener('click', () => {
        mainMenuConfirmPopup.classList.add('hidden');
        updateGameState({ gameActive: true });
    });

    document.getElementById('btn-main-menu-confirm').addEventListener('click', () => {
        mainMenuConfirmPopup.classList.add('hidden');
        updateGameState({ gameActive: false });
        gamePlayScreen.classList.add('hidden');
        showMainMenu();
    });

    // Theme 6 - Rescue minigame stuff
    const btnRescue = document.getElementById('btn-rescue');
    btnRescue.addEventListener('click', () => {
        startRescueMiniGame();
    });

    const btnBackward = document.getElementById('btn-backward');
    if (btnBackward) {
        btnBackward.addEventListener('click', () => {
            if (gameState.availableBackwardMoves > 0 && gameState.levelStateHistory.length > 0) {
                updateGameState({ availableBackwardMoves: gameState.availableBackwardMoves - 1 });
                const previousState = gameState.levelStateHistory.pop();

                updateGameState({
                    currentLevelState: previousState.grid,
                    playerPos: { x: previousState.x, y: previousState.y },
                    movesCount: previousState.moves,
                    levelStateHistory: gameState.levelStateHistory // retain mutated history
                });

                updateMovesDisplay();
                updateBackwardButton();
                renderGrid();
            }
        });
    }

    function startRescueMiniGame() {
        if (gameState.rescueAttempts >= 3) {
            alert("You have used all your rescue attempts for this level!");
            return;
        }

        updateGameState({ rescueAttempts: gameState.rescueAttempts + 1 });
        let timerSeconds = 10;
        let rewardMoves = 5;
        if (gameState.rescueAttempts === 2) {
            timerSeconds = 8;
            rewardMoves = 3;
        } else if (gameState.rescueAttempts >= 3) {
            timerSeconds = 6;
            rewardMoves = 1;
        }

        updateGameState({ gameActive: false });
        const rescueModal = document.getElementById('rescue-modal');
        rescueModal.classList.remove('hidden');

        const img = document.getElementById('rescue-image');
        const loading = document.getElementById('rescue-loading');
        const timerDisplay = document.getElementById('rescue-timer');
        const answerInput = document.getElementById('rescue-answer');
        const msg = document.getElementById('rescue-message');

        img.style.display = 'none';
        loading.style.display = 'block';
        answerInput.value = '';
        msg.innerText = '';
        timerDisplay.innerText = `Time: ${timerSeconds}s`;

        clearInterval(gameState.rescueTimerInterval);

        fetchRescueChallenge().then(data => {
            updateGameState({ rescueSolution: data.solution });
            img.src = data.question;
            img.onload = () => {
                loading.style.display = 'none';
                img.style.display = 'block';

                const interval = setInterval(() => {
                    timerSeconds--;
                    timerDisplay.innerText = `Time: ${timerSeconds}s`;
                    if (timerSeconds <= 0) {
                        clearInterval(interval);
                        msg.innerText = "Time's up!";
                        setTimeout(() => {
                            rescueModal.classList.add('hidden');
                            updateGameState({ gameActive: true });
                        }, 2000);
                    }
                }, 1000);
                updateGameState({ rescueTimerInterval: interval });
            };
        }).catch(err => {
            msg.innerText = "Error loading mini-game.";
            setTimeout(() => {
                rescueModal.classList.add('hidden');
                updateGameState({ gameActive: true });
            }, 2000);
        });

        const btnSubmit = document.getElementById('btn-rescue-submit');
        const newBtnSubmit = btnSubmit.cloneNode(true);
        btnSubmit.parentNode.replaceChild(newBtnSubmit, btnSubmit);

        newBtnSubmit.addEventListener('click', () => {
            if (timerSeconds <= 0) return;

            const answer = parseInt(document.getElementById('rescue-answer').value);
            if (answer === gameState.rescueSolution) {
                clearInterval(gameState.rescueTimerInterval);
                msg.innerText = `Correct! ${rewardMoves} Backward moves granted.`;
                msg.style.color = "#2ecc71";

                updateGameState({ availableBackwardMoves: gameState.availableBackwardMoves + rewardMoves });
                updateBackwardButton();

                setTimeout(() => {
                    rescueModal.classList.add('hidden');
                    updateGameState({ gameActive: true });
                }, 2000);
            } else {
                msg.innerText = "Incorrect! Try again.";
                msg.style.color = "#ff4757";
            }
        });
    }

    // --- TIME UP / RESTART LOGIC ---
    document.getElementById('btn-restart-level').addEventListener('click', () => {
        document.getElementById('game-over-popup').classList.add('hidden');
        TimerService.reset();
        loadLevel(gameState.currentLevelIndex);
        AudioService.playBgMusic();
    });

    document.getElementById('btn-game-over-main-menu').addEventListener('click', () => {
        document.getElementById('game-over-popup').classList.add('hidden');
        gamePlayScreen.classList.add('hidden');

        showMainMenu();
        AudioService.playBgMusic();
    });

    // --- NEXT LEVEL SUCCESS ---
    const levelCompletePopup = document.getElementById('level-complete-popup');
    document.getElementById('btn-complete-main-menu').addEventListener('click', () => {
        AudioService.stopHappyCat();
        levelCompletePopup.classList.add('hidden');
        gamePlayScreen.classList.add('hidden');
        showMainMenu();
        AudioService.playBgMusic();
    });

    document.getElementById('btn-complete-next-level').addEventListener('click', () => {
        AudioService.stopHappyCat();
        levelCompletePopup.classList.add('hidden');
        if (gameState.currentLevelIndex < 9) {
            loadLevel(gameState.currentLevelIndex + 1);
        } else {
            gamePlayScreen.classList.add('hidden');
            showMainMenu();
        }
        AudioService.playBgMusic();
    });

    // Fix: had to add this observer because the music wouldn't play on the first login screen transition 
    const loginObserver = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
            if (mutation.type === 'attributes' && mutation.attributeName === 'class') {
                if (!mainMenuScreen.classList.contains('hidden')) {
                    AudioService.playBgMusic();
                }
            }
        });
    });
    loginObserver.observe(mainMenuScreen, { attributes: true });

    // export this so the gameengine can read it
    window.renderLevelsGlobally = renderLevelButtons;
});
