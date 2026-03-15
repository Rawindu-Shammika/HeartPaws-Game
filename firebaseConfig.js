// firebaseConfig.js - Firebase configuration and initialization for the web app


import { initializeApp } from "https://www.gstatic.com/firebasejs/10.9.0/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.9.0/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.9.0/firebase-firestore.js";

// web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDIzPfdfwIXe62Q7kwEGuNWfAdv7YsBkX8",
  authDomain: "heartpaws-dbf07.firebaseapp.com",
  projectId: "heartpaws-dbf07",
  storageBucket: "heartpaws-dbf07.firebasestorage.app",
  messagingSenderId: "308379792519",
  appId: "1:308379792519:web:27b4e6d1927881645af422"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

export { auth, db };
