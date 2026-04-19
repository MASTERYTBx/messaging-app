import React, { useState, useEffect } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth, signInWithGoogle, logOut, isFirebaseConfigured } from './firebase';
import Login from './components/Login';
import ChatLayout from './components/ChatLayout';
import AdminPanel from './components/AdminPanel';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import './index.css';
import './admin.css';

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isFirebaseConfigured) {
      setLoading(false);
      return;
    }
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

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
