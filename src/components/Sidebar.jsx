import React, { useState, useEffect } from 'react';
import { MoreVertical, MessageSquare, CircleDashed, ShieldAlert, Search } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { ADMIN_EMAIL, searchUsersByUsername, getOrCreateChat, db } from '../firebase';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { motion } from 'framer-motion';
import ProfileSettings from './ProfileSettings';

export default function Sidebar({ user, logOut, selectedChat, onSelectChat }) {
  const navigate = useNavigate();
  const isAdmin = user?.email === ADMIN_EMAIL;
  
  const [showProfile, setShowProfile] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [activeChats, setActiveChats] = useState([]);

  useEffect(() => {
    // Listen for chats where this user is a participant
    const q = query(collection(db, 'chats'), where('participants', 'array-contains', user.uid));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      let chats = [];
      snapshot.forEach(doc => {
        chats.push({ ...doc.data(), id: doc.id });
      });
      // Sort by updatedAt descending
      chats.sort((a, b) => {
        const timeA = a.updatedAt?.toMillis() || Date.now();
        const timeB = b.updatedAt?.toMillis() || Date.now();
        return timeB - timeA;
      });
      setActiveChats(chats);
    });
    return () => unsubscribe();
  }, [user]);

  const handleSearch = async (e) => {
    const term = e.target.value;
    setSearchQuery(term);
    if (term.length > 2) {
      const results = await searchUsersByUsername(term.toLowerCase());
      setSearchResults(results.filter(u => u.uid !== user.uid));
    } else {
      setSearchResults([]);
    }
  };

  const startChat = async (targetUser) => {
    const chatId = await getOrCreateChat(user, targetUser);
    onSelectChat({
      chatId,
      uid: targetUser.uid,
      displayName: targetUser.displayName,
      username: targetUser.username,
      photoURL: targetUser.photoURL
    });
    setSearchQuery('');
    setSearchResults([]);
  };

  return (
    <motion.div 
      className="sidebar"
      initial={{ x: -50, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
    >
      <header className="sidebar-header">
        <div className="user-profile" onClick={() => setShowProfile(true)} style={{cursor: 'pointer'}}>
          <img src={user.photoURL || 'https://via.placeholder.com/40'} alt="User" className="avatar" />
          <span className="user-name">Profile</span>
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
              if (window.confirm("Do you want to log out?")) logOut();
            }} />
          </div>
        </div>
      </header>
      
      <div className="sidebar-search">
        <Search className="search-icon" size={16} />
        <input 
          type="text" 
          placeholder="Search usernames (e.g. johndoe)" 
          className="search-input" 
          value={searchQuery}
          onChange={handleSearch}
        />
      </div>

      <div className="contact-list">
        {searchQuery.length > 2 ? (
          <div className="search-results">
            {searchResults.length === 0 ? <p className="no-results">No users found</p> : null}
            {searchResults.map(u => (
              <div key={u.uid} className="contact-item" onClick={() => startChat(u)}>
                <img src={u.photoURL || 'https://via.placeholder.com/48'} alt="Avatar" className="avatar" />
                <div className="contact-info">
                  <h3 className="contact-name">{u.displayName}</h3>
                  <p className="contact-last-message">@{u.username}</p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="active-chats">
            {activeChats.map(chat => {
              // Find the other participant's details
              const otherUid = chat.participants.find(id => id !== user.uid);
              const otherDetails = chat.participantDetails[otherUid];
              const isActive = selectedChat?.chatId === chat.id;
              const unreadCount = chat.unreadCount?.[user.uid] || 0;

              return (
                <div key={chat.id} className={`contact-item ${isActive ? 'active' : ''}`} onClick={() => onSelectChat({
                  chatId: chat.id,
                  uid: otherUid,
                  ...otherDetails
                })}>
                  <img src={otherDetails?.photoURL || 'https://via.placeholder.com/48'} alt="Avatar" className="avatar" />
                  <div className="contact-info">
                    <div className="contact-info-header">
                      <h3 className="contact-name">{otherDetails?.displayName} <span style={{fontSize: '0.75rem', color: '#8696a0'}}>@{otherDetails?.username}</span></h3>
                      {unreadCount > 0 && <span className="unread-badge">{unreadCount}</span>}
                    </div>
                    <p className={`contact-last-message ${unreadCount > 0 ? 'unread-bold' : ''}`}>
                      {chat.lastMessage || 'Start chatting!'}
                    </p>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {showProfile && <ProfileSettings user={user} onClose={() => setShowProfile(false)} />}
    </motion.div>
  );
}
