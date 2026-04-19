import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithPopup, signInWithRedirect, signOut } from 'firebase/auth';
import { getFirestore, doc, deleteDoc, updateDoc } from 'firebase/firestore';

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

// Admin email configuration - change this to your actual email
export const ADMIN_EMAIL = "ytbgamez469@gmail.com";

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
    console.error("Error signing in with Google:", error);
    
    // Fallback to redirect if popup fails or is blocked
    if (error.code !== 'auth/popup-closed-by-user' && error.code !== 'auth/cancelled-popup-request') {
      alert("Popup blocked or failed! Redirecting to Google instead...");
      try {
        await signInWithRedirect(auth, provider);
      } catch (redirectError) {
        console.error("Redirect sign-in failed:", redirectError);
        alert(`Login failed entirely: ${redirectError.message}`);
      }
    }
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

// Delete a message by ID
export const deleteMessage = async (messageId) => {
  try {
    await deleteDoc(doc(db, "messages", messageId));
  } catch (error) {
    console.error("Error deleting message: ", error);
  }
};

// Edit a message by ID
export const editMessage = async (messageId, newText) => {
  try {
    await updateDoc(doc(db, "messages", messageId), {
      text: newText,
      editedAt: new Date()
    });
  } catch (error) {
    console.error("Error editing message: ", error);
  }
};

import { setDoc, getDoc, collection, query, where, getDocs, addDoc, serverTimestamp } from 'firebase/firestore';

// Save user to DB and ensure they have a username
export const saveUserToDB = async (user) => {
  if (!user) return;
  const userRef = doc(db, "users", user.uid);
  const userSnap = await getDoc(userRef);
  
  if (!userSnap.exists()) {
    // Auto-generate a username based on email
    const baseUsername = user.email.split('@')[0].toLowerCase().replace(/[^a-z0-9_]/g, '');
    let username = baseUsername;
    let isUnique = await checkUsernameExists(username);
    let counter = 1;
    
    while(isUnique) {
      username = `${baseUsername}${counter}`;
      isUnique = await checkUsernameExists(username);
      counter++;
    }

    await setDoc(userRef, {
      uid: user.uid,
      email: user.email,
      displayName: user.displayName,
      photoURL: user.photoURL,
      username: username,
      createdAt: serverTimestamp()
    });
  }
};

// Check if a username is already taken
export const checkUsernameExists = async (username) => {
  const q = query(collection(db, "users"), where("username", "==", username));
  const querySnapshot = await getDocs(q);
  return !querySnapshot.empty;
};

// Update user's username
export const updateUsername = async (uid, newUsername) => {
  const userRef = doc(db, "users", uid);
  await updateDoc(userRef, { username: newUsername });
};

// Search users by username
export const searchUsersByUsername = async (searchTerm) => {
  const q = query(collection(db, "users"), where("username", ">=", searchTerm), where("username", "<=", searchTerm + '\uf8ff'));
  const querySnapshot = await getDocs(q);
  let users = [];
  querySnapshot.forEach((doc) => users.push(doc.data()));
  return users;
};

// Get or Create a 1-on-1 chat
export const getOrCreateChat = async (currentUser, targetUser) => {
  // Chat ID is predictably generated to avoid duplicates (sort UIDs alphabetically)
  const sortedUids = [currentUser.uid, targetUser.uid].sort();
  const chatId = `${sortedUids[0]}_${sortedUids[1]}`;
  
  const chatRef = doc(db, "chats", chatId);
  const chatSnap = await getDoc(chatRef);
  
  if (!chatSnap.exists()) {
    await setDoc(chatRef, {
      participants: [currentUser.uid, targetUser.uid],
      participantDetails: {
        [currentUser.uid]: { displayName: currentUser.displayName, photoURL: currentUser.photoURL, username: currentUser.username || currentUser.email.split('@')[0] },
        [targetUser.uid]: { displayName: targetUser.displayName, photoURL: targetUser.photoURL, username: targetUser.username }
      },
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      lastMessage: ""
    });
  }
  return chatId;
};
