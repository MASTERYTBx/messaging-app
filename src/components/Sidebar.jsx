import React from 'react';
import { MoreVertical, MessageSquare, CircleDashed } from 'lucide-react';

export default function Sidebar({ user, logOut }) {
  return (
    <div className="sidebar">
      <header className="sidebar-header">
        <div className="user-profile">
          <img src={user.photoURL || 'https://via.placeholder.com/40'} alt="User" className="avatar" />
          <span className="user-name">{user.displayName}</span>
        </div>
        <div className="sidebar-actions">
          <CircleDashed className="action-icon" />
          <MessageSquare className="action-icon" />
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
        {/* We just have a global chat room for this MVP */}
        <div className="contact-item active">
          <img src="https://via.placeholder.com/48/00a884/ffffff?text=GC" alt="Global Chat" className="avatar" />
          <div className="contact-info">
            <h3 className="contact-name">Global Family Chat</h3>
            <p className="contact-last-message">Welcome to the messaging app!</p>
          </div>
        </div>
      </div>
    </div>
  );
}
