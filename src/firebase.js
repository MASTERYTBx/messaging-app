import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// TODO: Replace with your actual Firebase project config
const firebaseConfig = {
  apiKey: "AIzaSyApuMSq3_ZLxp6dOo8WPX1AllqnKykDS2E",
  authDomain: "baydell-county-staff-database.firebaseapp.com",
  databaseURL: "https://baydell-county-staff-database-default-rtdb.firebaseio.com",
  projectId: "baydell-county-staff-database",
  storageBucket: "baydell-county-staff-database.firebasestorage.app",
  messagingSenderId: "412567407481",
  appId: "1:412567407481:web:0b2f03c7f490ef51517da8",
  measurementId: "G-QPDXEEMS9X"
};

// Check if Firebase config is actually provided
export const isFirebaseConfigured = firebaseConfig.apiKey !== "YOUR_API_KEY";

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const provider = new GoogleAuthProvider();

export const signInWithGoogle = async () => {
  if (!isFirebaseConfigured) {
    console.error("Firebase is not configured! Please add your config in src/firebase.js");
    return null;
  }
  try {
    const result = await signInWithPopup(auth, provider);
    return result.user;
  } catch (error) {
    console.error("Error signing in with Google", error);
    return null;
  }
};

export const logOut = async () => {
  try {
    await signOut(auth);
  } catch (error) {
    console.error("Error signing out", error);
  }
};
