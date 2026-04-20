import React from 'react';
import { motion } from 'framer-motion';
import { X, Flag, Ban } from 'lucide-react';
import VerifiedBadge from './VerifiedBadge';
import { useAlert } from './CustomAlert';

export default function UserProfileModal({ profileUser, onClose }) {
  const { showConfirm, showAlert } = useAlert();

  if (!profileUser) return null;

  const handleReport = () => {
    showConfirm(`Are you sure you want to report ${profileUser.displayName}? Admins will be notified.`, () => {
      showAlert(`You have reported ${profileUser.displayName}. Thank you for keeping the community safe.`);
    });
  };

  const handleBlock = () => {
    showConfirm(`Are you sure you want to block ${profileUser.displayName}? You will no longer receive their messages.`, () => {
      showAlert(`You have blocked ${profileUser.displayName}.`);
    });
  };

  return (
    <div className="modal-overlay" style={{ zIndex: 1000 }}>
      <motion.div 
        className="profile-modal"
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        style={{ textAlign: 'center', padding: '30px', maxWidth: '350px' }}
      >
        <button className="close-modal-btn" onClick={onClose}><X size={20} /></button>
        
        <img src={profileUser.photoURL || 'https://via.placeholder.com/150'} alt="Profile" style={{width: '120px', height: '120px', borderRadius: '50%', marginBottom: '16px', objectFit: 'cover'}} />
        
        <h2 style={{ marginBottom: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
          {profileUser.displayName} <VerifiedBadge email={profileUser.email || profileUser.id} />
        </h2>
        <p style={{ color: 'var(--text-secondary)', marginBottom: '16px' }}>
          {profileUser.username ? `@${profileUser.username}` : 'User'}
        </p>

        {profileUser.email && (
          <p style={{ fontSize: '0.9rem', marginBottom: '8px' }}>{profileUser.email}</p>
        )}
        
        <div style={{ backgroundColor: 'var(--bg-header)', padding: '16px', borderRadius: '8px', marginBottom: '24px', textAlign: 'left' }}>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Status</p>
          <p style={{ fontSize: '1rem', marginTop: '4px' }}>Hey there! I am using this messaging app.</p>
        </div>

        <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
          <button 
            onClick={handleReport}
            style={{ flex: 1, padding: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', border: '1px solid #ef4444', background: 'transparent', color: '#ef4444', borderRadius: '8px', cursor: 'pointer', fontWeight: 500 }}
          >
            <Flag size={16} /> Report
          </button>
          <button 
            onClick={handleBlock}
            style={{ flex: 1, padding: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', border: 'none', background: '#ef4444', color: 'white', borderRadius: '8px', cursor: 'pointer', fontWeight: 500 }}
          >
            <Ban size={16} /> Block
          </button>
        </div>
      </motion.div>
    </div>
  );
}
