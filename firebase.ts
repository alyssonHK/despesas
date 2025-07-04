
// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// Your web app's Firebase configuration
// IMPORTANT: You've provided your actual keys here. For security, it's recommended to 
// use environment variables instead of hardcoding them in the source code.
const firebaseConfig = {
  apiKey: "AIzaSyAa5METeGCE7Ffu3Qo4bUNZttrSnG7RvBo",
  authDomain: "despesas-8b2d6.firebaseapp.com",
  projectId: "despesas-8b2d6",
  storageBucket: "despesas-8b2d6.firebasestorage.app",
  messagingSenderId: "1033568076934",
  appId: "1:1033568076934:web:aadffaa493b94599dcfd07",
  measurementId: "G-N98WX0F71S"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase services
const auth = getAuth(app);
const db = getFirestore(app);

// Export the services for use in other parts of the app
export { auth, db };
