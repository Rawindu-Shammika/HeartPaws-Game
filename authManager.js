// authManager.js
// --- LOGIN MENU STUFF ---
// Theme 4 - saving the name to cookie and handling firebase stuff

import { auth, db } from './firebaseConfig.js';
import {
    createUserWithEmailAndPassword,
    signInWithPopup,
    GoogleAuthProvider,
    signInWithEmailAndPassword,
    sendPasswordResetEmail
} from "https://www.gstatic.com/firebasejs/10.9.0/firebase-auth.js";
import { doc, setDoc, getDoc, updateDoc } from "https://www.gstatic.com/firebasejs/10.9.0/firebase-firestore.js";
import { showMainMenu } from './uiManager.js';
import { highestUnlockedLevel, updateGameState, gameState } from './gameState.js';

export async function loginUser(loginIdentifier, loginPassword) {
    const email = loginIdentifier.includes('@') ? loginIdentifier : loginIdentifier + '@heartpaws.game';
    try {
        const userCredential = await signInWithEmailAndPassword(auth, email, loginPassword);
        const user = userCredential.user;
        console.log("Logged in gracefully:", user);

        const sessionData = JSON.stringify({ uid: user.uid, meowVolume: gameState.volume, happyCatVolume: gameState.happyCatVolume });
        document.cookie = `paws_session=${encodeURIComponent(sessionData)}; max-age=86400; path=/; samesite=strict`;
        localStorage.setItem('paws_saved_id', loginIdentifier);
        localStorage.setItem('paws_display_name', loginIdentifier);

        showMainMenu();
    } catch (error) {
        console.error("Login Error:", error.message);
        if (error.code === 'auth/api-key-not-valid. -please-pass-a-valid-api-key.' || error.message.includes('api-key-not-valid') || error.message.includes('API key') || error.code === 'auth/invalid-api-key') {
            console.warn("Using Dummy Firebase Credentials - Checking LocalStorage");
            const dummyUser = localStorage.getItem('dummy_username');
            const dummyPass = localStorage.getItem('dummy_password');

            if (loginIdentifier === dummyUser && loginPassword === dummyPass) {
                const sessionData = JSON.stringify({ uid: 'fallback_local_user', meowVolume: gameState.volume, happyCatVolume: gameState.happyCatVolume });
                document.cookie = `paws_session=${encodeURIComponent(sessionData)}; max-age=86400; path=/; samesite=strict`;
                localStorage.setItem('paws_saved_id', loginIdentifier);
                showMainMenu();
            } else {
                alert("Login failed! Invalid credentials. Did you create an account?");
            }
        } else {
            alert("Login failed! Please check your credentials: " + error.message);
        }
    }
}

// Theme 3/4: Leveraging Firebase's SMTP distributed service for secure identity recovery.
export async function resetPassword(username) {
    const email = username.includes('@') ? username : username + '@heartpaws.game';
    try {
        await sendPasswordResetEmail(auth, email);
    } catch (error) {
        console.error("Password reset error", error);
        throw error;
    }
}

export async function registerUser(username, password) {
    const email = username.includes('@') ? username : username + '@heartpaws.game';
    try {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        localStorage.setItem('paws_display_name', username);
        alert("Account created successfully! Please login.");
        document.getElementById('create-account-screen').classList.add('hidden');
        document.getElementById('login-screen').classList.remove('hidden');
    } catch (error) {
        console.error("Firebase Auth Error", error);
        if (error.code === 'auth/api-key-not-valid. -please-pass-a-valid-api-key.' || error.message.includes('api-key-not-valid') || error.message.includes('API key') || error.code === 'auth/invalid-api-key') {
            console.warn("Using Dummy Firebase Credentials - Saving to LocalStorage for Demo");
            localStorage.setItem('dummy_username', username);
            localStorage.setItem('dummy_password', password);

            alert("Account created successfully! Please login.");
            document.getElementById('create-account-screen').classList.add('hidden');
            document.getElementById('login-screen').classList.remove('hidden');
            document.getElementById('reg-password').value = '';
            document.getElementById('reg-password-confirm').value = '';
        } else {
            alert("Registration failed: " + error.message);
        }
    }
}

export async function signInWithGoogle() {
    const provider = new GoogleAuthProvider();
    try {
        const result = await signInWithPopup(auth, provider);
        const user = result.user;
        saveVirtualIdentity(user.displayName || user.email);
    } catch (error) {
        console.error("Google Auth Error", error);
        if (error.code === 'auth/api-key-not-valid. -please-pass-a-valid-api-key.' || error.message.includes('api-key-not-valid') || error.message.includes('API key')) {
            console.warn("Using Dummy Firebase Credentials - Bypassing Auth");
            saveVirtualIdentity("GoogleUser");
        } else {
            alert("Google Sign-In failed: " + error.message);
        }
    }
}

export async function recordScoreToCloud(moves, currentLevelIndex) {
    if (!auth.currentUser) return;

    try {
        const userRef = doc(db, "leaderboard", auth.currentUser.uid);
        const userDoc = await getDoc(userRef);

        let totalMoves = moves;
        let levelsCompleted = 1;
        let highestSavedLevel = highestUnlockedLevel;
        const email = auth.currentUser.email || "Player";

        if (userDoc.exists()) {
            const data = userDoc.data();
            totalMoves += data.totalMoves || 0;
            levelsCompleted += data.levelsCompleted || 0;

            await updateDoc(userRef, {
                totalMoves: totalMoves,
                levelsCompleted: levelsCompleted,
                highestUnlockedLevel: highestSavedLevel
            });
        } else {
            await setDoc(userRef, {
                email: email,
                totalMoves: totalMoves,
                levelsCompleted: levelsCompleted,
                highestUnlockedLevel: highestSavedLevel
            });
        }
    } catch (error) {
        console.error("Error retrieving continue state:", error);
    }
}

export async function checkContinueAvailability() {
    if (!auth.currentUser) return;

    try {
        const userRef = doc(db, "leaderboard", auth.currentUser.uid);
        const userDoc = await getDoc(userRef);

        if (userDoc.exists()) {
            const data = userDoc.data();

            if (data.highestUnlockedLevel && data.highestUnlockedLevel > 1) {
                
                document.getElementById('btn-continue').classList.remove('hidden');
            }
        }
    } catch (error) {
        console.error("Error retrieving continue state:", error);
    }
}

export function saveVirtualIdentity(username) {
    const d = new Date();
    d.setTime(d.getTime() + (7 * 24 * 60 * 60 * 1000));
    const expires = "expires=" + d.toUTCString();
    const sessionData = JSON.stringify({ uid: username, meowVolume: gameState.volume, happyCatVolume: gameState.happyCatVolume });
    document.cookie = "paws_session=" + encodeURIComponent(sessionData) + ";" + expires + ";path=/";
    showMainMenu();
}
