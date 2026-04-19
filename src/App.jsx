import React, { useState, useEffect } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth, signInWithGoogle, logOut, isFirebaseConfigured } from './firebase';
import Login from './components/Login';
import ChatLayout from './components/ChatLayout';
import './index.css';

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // If not configured, just stop loading
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
    <div className="app-container">
      {user ? (
        <ChatLayout user={user} logOut={logOut} />
      ) : (
        <Login signInWithGoogle={signInWithGoogle} isFirebaseConfigured={isFirebaseConfigured} />
      )}
    </div>
  );
}

export default App;
