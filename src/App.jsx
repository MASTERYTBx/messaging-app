import React, { useState, useEffect } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth, signInWithGoogle, logOut, isFirebaseConfigured, saveUserToDB, db } from './firebase';
import { doc, onSnapshot } from 'firebase/firestore';
import Login from './components/Login';
import ChatLayout from './components/ChatLayout';
import AdminPanel from './components/AdminPanel';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import './index.css';
import './admin.css';
import './profile.css';
import './mobile.css';
import './features.css';

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isFirebaseConfigured) {
      setLoading(false);
      return;
    }
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        await saveUserToDB(currentUser);
      }
      setUser(currentUser);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!user) return;
    const unsub = onSnapshot(doc(db, 'users', user.uid), (docSnap) => {
      if (docSnap.exists() && docSnap.data().banned) {
        alert("You have been banned from using this app.");
        logOut();
      }
    });
    return () => unsub();
  }, [user]);

  if (loading) {
    return (
      <div className="loading-screen">
        <div className="spinner"></div>
      </div>
    );
  }

  return (
    <Router>
      <div className="app-container">
        <AnimatePresence mode="wait">
          <Routes>
            <Route path="/" element={
              user ? <ChatLayout user={user} logOut={logOut} /> : <Login signInWithGoogle={signInWithGoogle} isFirebaseConfigured={isFirebaseConfigured} />
            } />
            <Route path="/admin" element={
              user ? <AdminPanel user={user} /> : <Navigate to="/" />
            } />
            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
        </AnimatePresence>
      </div>
    </Router>
  );
}

export default App;
