import React from 'react';
import { MoreVertical, MessageSquare, CircleDashed, ShieldAlert } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { ADMIN_EMAIL } from '../firebase';
import { motion } from 'framer-motion';

export default function Sidebar({ user, logOut }) {
  const navigate = useNavigate();
  const isAdmin = user?.email === ADMIN_EMAIL;

  return (
    <motion.div 
      className="sidebar"
      initial={{ x: -50, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
    >
      <header className="sidebar-header">
        <div className="user-profile">
          <img src={user.photoURL || 'https://via.placeholder.com/40'} alt="User" className="avatar" />
          <span className="user-name">{user.displayName}</span>
        </div>
        <div className="sidebar-actions">
          {isAdmin && (
            <ShieldAlert 
              className="action-icon admin-icon" 
              onClick={() => navigate('/admin')} 
              title="Admin Panel"
            />
          )}
          <CircleDashed className="action-icon" onClick={() => alert("Status updates coming soon!")} />
          <MessageSquare className="action-icon" onClick={() => alert("New chat coming soon!")} />
          <div className="dropdown">
            <MoreVertical className="action-icon" onClick={() => {
              if (window.confirm("Do you want to log out?")) {
                logOut();
              }
            }} />
          </div>
        </div>
      </header>
      
      <div className="sidebar-search">
        <input type="text" placeholder="Search or start new chat" className="search-input" />
      </div>

      <div className="contact-list">
        <div className="contact-item active">
          <img src="https://via.placeholder.com/48/00a884/ffffff?text=GC" alt="Global Chat" className="avatar" />
          <div className="contact-info">
            <h3 className="contact-name">Global Family Chat</h3>
            <p className="contact-last-message">Welcome to the messaging app!</p>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
