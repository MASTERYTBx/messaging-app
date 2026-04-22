import React, { useState, useEffect } from 'react';
import { db, ADMIN_EMAIL, toggleUserBan } from '../firebase';
import { collection, query, onSnapshot, orderBy } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Eye, ShieldAlert, Users, MessageSquare } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import ChatWindow from './ChatWindow';
import VerifiedBadge from './VerifiedBadge';

export default function AdminPanel({ user }) {
  const [activeTab, setActiveTab] = useState('conversations'); // 'conversations' | 'users'
  const [conversations, setConversations] = useState([]);
  const [allUsers, setAllUsers] = useState([]);
  const [selectedChat, setSelectedChat] = useState(null);
  
  const navigate = useNavigate();

  useEffect(() => {
    // Protection: if not admin, kick them out
    if (user?.email !== ADMIN_EMAIL) {
      navigate('/');
    }

    // Fetch all conversations globally
    const qChats = query(collection(db, 'chats'));
    const unsubscribeChats = onSnapshot(qChats, (snapshot) => {
      let chats = [];
      snapshot.forEach(doc => {
        chats.push({ ...doc.data(), id: doc.id });
      });
      chats.sort((a, b) => {
        const tA = a.updatedAt?.toMillis() || 0;
        const tB = b.updatedAt?.toMillis() || 0;
        return tB - tA;
      });
      setConversations(chats);
    });

    // Fetch all users
    const qUsers = query(collection(db, 'users'), orderBy('createdAt', 'desc'));
    const unsubscribeUsers = onSnapshot(qUsers, (snapshot) => {
      let usrs = [];
      snapshot.forEach(doc => {
        usrs.push(doc.data());
      });
      setAllUsers(usrs);
    });

    return () => {
      unsubscribeChats();
      unsubscribeUsers();
    }
  }, [user, navigate]);

  const renderParticipants = (chat) => {
    if (!chat.participantDetails) return "Unknown";
    const users = Object.values(chat.participantDetails);
    if (users.length < 2) return "Unknown";
    return (
      <div className="admin-chat-participants">
        <div className="participant-badge">
          <img src={users[0].photoURL || 'https://via.placeholder.com/30'} alt="" />
          <span style={{display: 'flex', alignItems: 'center', gap: '4px'}}>
            {users[0].displayName} <VerifiedBadge email={users[0].email} size={12} /> (@{users[0].username})
          </span>
        </div>
        <span className="participant-divider">↔</span>
        <div className="participant-badge">
          <img src={users[1].photoURL || 'https://via.placeholder.com/30'} alt="" />
          <span style={{display: 'flex', alignItems: 'center', gap: '4px'}}>
            {users[1].displayName} <VerifiedBadge email={users[1].email} size={12} /> (@{users[1].username})
          </span>
        </div>
      </div>
    );
  };

  // If a chat is selected, we render Spectator Mode (ChatWindow)
  if (selectedChat) {
    // Find the live version of this chat to keep isFrozen updated
    const liveChat = conversations.find(c => c.id === selectedChat.id) || selectedChat;

    // Reformat selectedChat to match what ChatWindow expects
    const specChat = {
      chatId: liveChat.id,
      displayName: "Spectating Chat",
      username: "admin_view",
      photoURL: "https://via.placeholder.com/40/fbbf24/ffffff?text=AD",
      isFrozen: liveChat.isFrozen
    };

    return (
      <div className="spectator-layout">
        <ChatWindow 
          currentUser={user} 
          selectedChat={specChat}
          onBack={() => setSelectedChat(null)}
          isAdminSpectator={true}
        />
      </div>
    );
  }

  return (
    <motion.div 
      className="admin-panel"
      initial={{ opacity: 0, x: 50 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -50 }}
    >
      <div className="admin-header">
        <button className="back-btn" onClick={() => navigate('/')}>
          <ArrowLeft /> Back to App
        </button>
        <h2>Admin Dashboard</h2>
        <span className="admin-badge">Super Admin</span>
      </div>

      <div className="admin-tabs">
        <button 
          className={`admin-tab ${activeTab === 'conversations' ? 'active' : ''}`}
          onClick={() => setActiveTab('conversations')}
        >
          <MessageSquare size={18}/> Conversations
        </button>
        <button 
          className={`admin-tab ${activeTab === 'users' ? 'active' : ''}`}
          onClick={() => setActiveTab('users')}
        >
          <Users size={18}/> Users
        </button>
      </div>

      <div className="admin-content">
        <AnimatePresence mode="wait">
          {activeTab === 'conversations' ? (
            <motion.div 
              key="conversations"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            >
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Participants</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {conversations.length === 0 && (
                    <tr><td colSpan="3" style={{textAlign: 'center', padding: '2rem'}}>No conversations yet.</td></tr>
                  )}
                  {conversations.map((chat) => (
                    <tr key={chat.id}>
                      <td>{renderParticipants(chat)}</td>
                      <td>
                        {chat.isFrozen ? <span className="frozen-badge">Frozen</span> : <span className="active-badge">Active</span>}
                      </td>
                      <td>
                        <button className="admin-view-btn" onClick={() => setSelectedChat(chat)}>
                          <Eye size={16} /> Spectate
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </motion.div>
          ) : (
            <motion.div 
              key="users"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            >
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>User</th>
                    <th>Email</th>
                    <th>Joined</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {allUsers.length === 0 && (
                    <tr><td colSpan="5" style={{textAlign: 'center', padding: '2rem'}}>No users found.</td></tr>
                  )}
                  {allUsers.map((u) => (
                    <tr key={u.uid}>
                      <td>
                        <div className="admin-user-cell">
                          <img src={u.photoURL || 'https://via.placeholder.com/30'} alt="Avatar" />
                          <div>
                            <strong style={{display: 'flex', alignItems: 'center', gap: '4px'}}>
                              {u.displayName} 
                              <VerifiedBadge email={u.email} size={14} />
                            </strong>
                            <div style={{fontSize: '0.8rem', color: 'var(--text-secondary)'}}>@{u.username}</div>
                          </div>
                        </div>
                      </td>
                      <td>{u.email}</td>
                      <td>{u.createdAt ? new Date(u.createdAt.toDate()).toLocaleDateString() : 'N/A'}</td>
                      <td>
                        {u.banned ? <span className="banned-badge">Banned</span> : <span className="active-badge">Active</span>}
                      </td>
                      <td>
                        {u.email !== ADMIN_EMAIL && (
                          <button 
                            className={`ban-btn ${u.banned ? 'unban' : ''}`}
                            onClick={() => toggleUserBan(u.uid, !u.banned)}
                          >
                            <ShieldAlert size={16} /> {u.banned ? 'Unban User' : 'Ban User'}
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}
