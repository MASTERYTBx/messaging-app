import React from 'react';
import { LogIn } from 'lucide-react';

export default function Login({ signInWithGoogle, isFirebaseConfigured }) {
  return (
    <div className="login-container">
      <div className="login-card">
        <div className="login-icon-wrapper">
          <LogIn className="login-icon" size={48} />
        </div>
        <h1 className="login-title">Welcome to Messaging App</h1>
        <p className="login-subtitle">Connect with your friends and family instantly.</p>
        
        {!isFirebaseConfigured && (
          <div className="firebase-warning">
            <p><strong>Setup Required:</strong> Please configure Firebase in src/firebase.js to enable login.</p>
          </div>
        )}

        <button 
          className="login-btn" 
          onClick={signInWithGoogle}
          disabled={!isFirebaseConfigured}
        >
          <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google Logo" className="google-logo" />
          Sign in with Google
        </button>
      </div>
    </div>
  );
}
