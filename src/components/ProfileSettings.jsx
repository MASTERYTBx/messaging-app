import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { X, Check, Loader2, Bell, Moon, User as UserIcon } from 'lucide-react';
import { updateUsername, checkUsernameExists, updateUserSettings, db } from '../firebase';
import { doc, getDoc } from 'firebase/firestore';

export default function ProfileSettings({ user, onClose }) {
  const [username, setUsername] = useState('');
  const [newUsername, setNewUsername] = useState('');
  const [settings, setSettings] = useState({ dndEnabled: false, theme: 'light' });
  
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
        setUsername(data.username || '');
        setNewUsername(data.username || '');
        if (data.settings) {
          setSettings(data.settings);
        }
      }
      setLoading(false);
    };
    fetchUserData();
  }, [user]);

  const handleToggleDnD = () => {
    setSettings(prev => ({ ...prev, dndEnabled: !prev.dndEnabled }));
  };

  const handleThemeChange = (e) => {
    setSettings(prev => ({ ...prev, theme: e.target.value }));
  };

  const handleSave = async () => {
    setError('');
    setSuccess('');
    
    // Basic validation
    const cleaned = newUsername.trim().toLowerCase();
    if (!cleaned || cleaned.length < 3) {
      setError("Username must be at least 3 characters.");
      return;
    }

    setSaving(true);
    
    try {
      // Check username if changed
      if (cleaned !== username) {
        const exists = await checkUsernameExists(cleaned);
        if (exists) {
          setError("This username is already taken!");
          setSaving(false);
          return;
        }
        await updateUsername(user.uid, cleaned);
        setUsername(cleaned);
      }

      // Update settings
      await updateUserSettings(user.uid, settings);
      
      // Apply theme locally (we'd ideally do this globally in App.jsx)
      if (settings.theme === 'dark') {
        document.documentElement.classList.add('dark-mode');
      } else {
        document.documentElement.classList.remove('dark-mode');
      }

      setSuccess("Settings updated successfully!");
      setTimeout(() => onClose(), 1500);
    } catch (e) {
      console.error(e);
      setError("Error updating settings.");
    }
    setSaving(false);
  };

  return (
    <div className="modal-overlay">
      <motion.div 
        className="profile-modal settings-modal"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 20 }}
        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
      >
        <button className="close-modal-btn" onClick={onClose}><X size={20} /></button>
        
        <h2>Settings</h2>
        
        <div className="profile-details">
          <img src={user.photoURL || 'https://via.placeholder.com/80'} alt="Profile" className="profile-avatar-large" />
          <p className="profile-email">{user.email}</p>
        </div>

        {loading ? (
          <div className="loading-spinner"><Loader2 className="spinner" /></div>
        ) : (
          <div className="settings-form">
            <div className="settings-section">
              <h3 className="section-title"><UserIcon size={16} /> Profile</h3>
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
            </div>

            <div className="settings-section">
              <h3 className="section-title"><Bell size={16} /> Notifications</h3>
              <div className="setting-row">
                <div>
                  <div className="setting-label">Do Not Disturb</div>
                  <div className="setting-desc">Mute all incoming message notifications</div>
                </div>
                <label className="switch">
                  <input type="checkbox" checked={settings.dndEnabled} onChange={handleToggleDnD} />
                  <span className="slider round"></span>
                </label>
              </div>
            </div>

            <div className="settings-section">
              <h3 className="section-title"><Moon size={16} /> Appearance</h3>
              <div className="setting-row">
                <div className="setting-label">Theme</div>
                <select className="theme-select" value={settings.theme} onChange={handleThemeChange}>
                  <option value="light">Light</option>
                  <option value="dark">Dark</option>
                </select>
              </div>
            </div>

            {error && <p className="error-msg">{error}</p>}
            {success && <p className="success-msg">{success}</p>}
            
            <button className="save-profile-btn" onClick={handleSave} disabled={saving}>
              {saving ? <Loader2 className="spinner" size={16} /> : <Check size={16} />}
              Save Settings
            </button>
          </div>
        )}
      </motion.div>
    </div>
  );
}
