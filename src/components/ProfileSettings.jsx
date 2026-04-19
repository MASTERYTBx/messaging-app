import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { X, Check, Loader2 } from 'lucide-react';
import { updateUsername, checkUsernameExists, db } from '../firebase';
import { doc, getDoc } from 'firebase/firestore';

export default function ProfileSettings({ user, onClose }) {
  const [username, setUsername] = useState('');
  const [newUsername, setNewUsername] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    const fetchUserData = async () => {
      const userRef = doc(db, 'users', user.uid);
      const userSnap = await getDoc(userRef);
      if (userSnap.exists()) {
        const data = userSnap.data();
        setUsername(data.username);
        setNewUsername(data.username);
      }
      setLoading(false);
    };
    fetchUserData();
  }, [user]);

  const handleSave = async () => {
    setError('');
    setSuccess('');
    
    // Basic validation
    const cleaned = newUsername.trim().toLowerCase();
    if (!cleaned || cleaned.length < 3) {
      setError("Username must be at least 3 characters.");
      return;
    }
    if (cleaned === username) {
      onClose(); // No change
      return;
    }

    setSaving(true);
    // Check if taken
    const exists = await checkUsernameExists(cleaned);
    if (exists) {
      setError("This username is already taken!");
      setSaving(false);
      return;
    }

    // Update
    try {
      await updateUsername(user.uid, cleaned);
      setUsername(cleaned);
      setSuccess("Username updated successfully!");
      setTimeout(() => onClose(), 1500);
    } catch (e) {
      setError("Error updating username.");
    }
    setSaving(false);
  };

  return (
    <div className="modal-overlay">
      <motion.div 
        className="profile-modal"
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
      >
        <button className="close-modal-btn" onClick={onClose}><X size={20} /></button>
        
        <h2>Profile Settings</h2>
        
        <div className="profile-details">
          <img src={user.photoURL || 'https://via.placeholder.com/80'} alt="Profile" className="profile-avatar-large" />
          <p className="profile-email">{user.email}</p>
        </div>

        {loading ? (
          <div className="loading-spinner"><Loader2 className="spinner" /></div>
        ) : (
          <div className="username-form">
            <label>Your Username</label>
            <div className="input-group">
              <span className="at-symbol">@</span>
              <input 
                type="text" 
                value={newUsername} 
                onChange={(e) => setNewUsername(e.target.value.replace(/[^a-zA-Z0-9_]/g, ''))}
                placeholder="username"
              />
            </div>
            {error && <p className="error-msg">{error}</p>}
            {success && <p className="success-msg">{success}</p>}
            
            <button className="save-profile-btn" onClick={handleSave} disabled={saving}>
              {saving ? <Loader2 className="spinner" size={16} /> : <Check size={16} />}
              Save Changes
            </button>
          </div>
        )}
      </motion.div>
    </div>
  );
}
