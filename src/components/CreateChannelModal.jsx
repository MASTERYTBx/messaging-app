import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { X, Check, Loader2 } from 'lucide-react';
import { createChannel } from '../firebase';

export default function CreateChannelModal({ user, onClose }) {
  const [name, setName] = useState('');
  const [isPublic, setIsPublic] = useState(true);
  const [isOfficial, setIsOfficial] = useState(false);
  const [saving, setSaving] = useState(false);

  const handleCreate = async () => {
    if (!name.trim()) return;
    setSaving(true);
    await createChannel(name.trim(), isPublic, isOfficial, user);
    setSaving(false);
    onClose();
  };

  return (
    <div className="modal-overlay">
      <motion.div 
        className="profile-modal"
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
      >
        <button className="close-modal-btn" onClick={onClose}><X size={20} /></button>
        
        <h2>Create Channel</h2>
        <p style={{fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '20px'}}>
          Channels are 1-way broadcast tools. Only admins can post messages.
        </p>

        <div className="settings-form">
          <div className="settings-section">
            <label>Channel Name</label>
            <div className="input-group">
              <input 
                type="text" 
                value={name} 
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Announcements"
                maxLength={30}
              />
            </div>
          </div>

          <div className="settings-section">
            <div className="setting-row">
              <div>
                <div className="setting-label">Public Channel</div>
                <div className="setting-desc">Anyone can find and read this channel</div>
              </div>
              <label className="switch">
                <input type="checkbox" checked={isPublic} onChange={() => setIsPublic(!isPublic)} />
                <span className="slider round"></span>
              </label>
            </div>
          </div>

          <div className="settings-section">
            <div className="setting-row">
              <div>
                <div className="setting-label">Official Channel</div>
                <div className="setting-desc">Display a blue verified badge next to the name</div>
              </div>
              <label className="switch">
                <input type="checkbox" checked={isOfficial} onChange={() => setIsOfficial(!isOfficial)} />
                <span className="slider round"></span>
              </label>
            </div>
          </div>

          <button className="save-profile-btn" onClick={handleCreate} disabled={saving || !name.trim()}>
            {saving ? <Loader2 className="spinner" size={16} /> : <Check size={16} />}
            Create Channel
          </button>
        </div>
      </motion.div>
    </div>
  );
}
