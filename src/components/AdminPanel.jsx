import React, { useState, useEffect } from 'react';
import { db, ADMIN_EMAIL, deleteMessage, editMessage } from '../firebase';
import { collection, query, onSnapshot, where } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';
import { Trash2, Edit2, Check, X, ArrowLeft, Eye } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function AdminPanel({ user }) {
  const [conversations, setConversations] = useState([]);
  const [selectedChat, setSelectedChat] = useState(null);
  
  const [messages, setMessages] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [editText, setEditText] = useState('');
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
      chats.sort((a, b) => b.updatedAt?.toDate() - a.updatedAt?.toDate());
      setConversations(chats);
    });

    return () => unsubscribeChats();
  }, [user, navigate]);

  useEffect(() => {
    if (!selectedChat) return;

    // Fetch messages for the selected chat
    const qMsgs = query(collection(db, 'messages'), where('chatId', '==', selectedChat.id));
    const unsubscribeMsgs = onSnapshot(qMsgs, (snapshot) => {
      let msgs = [];
      snapshot.forEach(doc => {
        msgs.push({ ...doc.data(), id: doc.id });
      });
      // Sort client-side
      msgs.sort((a, b) => {
        const timeA = a.createdAt?.toMillis() || Date.now();
        const timeB = b.createdAt?.toMillis() || Date.now();
        return timeA - timeB;
      });
      setMessages(msgs);
    });

    return () => unsubscribeMsgs();
  }, [selectedChat]);

  const handleDelete = (id) => {
    deleteMessage(id);
  };

  const handleEditClick = (msg) => {
    setEditingId(msg.id);
    setEditText(msg.text);
  };

  const handleSaveEdit = (id) => {
    editMessage(id, editText);
    setEditingId(null);
  };

  const renderParticipants = (chat) => {
    if (!chat.participantDetails) return "Unknown";
    const users = Object.values(chat.participantDetails);
    if (users.length < 2) return "Unknown";
    return (
      <div className="admin-chat-participants">
        <div className="participant-badge">
          <img src={users[0].photoURL || 'https://via.placeholder.com/30'} alt="" />
          <span>{users[0].displayName} (@{users[0].username})</span>
        </div>
        <span className="participant-divider">↔</span>
        <div className="participant-badge">
          <img src={users[1].photoURL || 'https://via.placeholder.com/30'} alt="" />
          <span>{users[1].displayName} (@{users[1].username})</span>
        </div>
      </div>
    );
  };

  return (
    <motion.div 
      className="admin-panel"
      initial={{ opacity: 0, x: 50 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -50 }}
    >
      <div className="admin-header">
        {selectedChat ? (
          <button className="back-btn" onClick={() => setSelectedChat(null)}>
            <ArrowLeft /> Back to Conversations
          </button>
        ) : (
          <button className="back-btn" onClick={() => navigate('/')}>
            <ArrowLeft /> Back to App
          </button>
        )}
        <h2>Admin Dashboard</h2>
        <span className="admin-badge">Super Admin</span>
      </div>

      <div className="admin-content">
        <AnimatePresence mode="wait">
          {!selectedChat ? (
            <motion.div 
              key="conversations"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            >
              <h3>All Global Conversations</h3>
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Participants</th>
                    <th>Last Activity</th>
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
                      <td>{chat.updatedAt ? new Date(chat.updatedAt.toDate()).toLocaleString() : 'Just now'}</td>
                      <td>
                        <button className="admin-view-btn" onClick={() => setSelectedChat(chat)}>
                          <Eye size={16} /> View Chat
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </motion.div>
          ) : (
            <motion.div 
              key="messages"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            >
              <h3>Viewing Chat Messages</h3>
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>User</th>
                    <th>Message</th>
                    <th>Date</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {messages.length === 0 && (
                    <tr><td colSpan="4" style={{textAlign: 'center', padding: '2rem'}}>No messages in this chat.</td></tr>
                  )}
                  {messages.map((msg) => (
                    <tr key={msg.id}>
                      <td>
                        <div className="admin-user-cell">
                          <img src={msg.photoURL || 'https://via.placeholder.com/30'} alt="Avatar" />
                          <span>{msg.displayName}</span>
                        </div>
                      </td>
                      <td className="message-cell">
                        {editingId === msg.id ? (
                          <input 
                            type="text" 
                            value={editText} 
                            onChange={(e) => setEditText(e.target.value)} 
                            className="admin-edit-input"
                          />
                        ) : (
                          <span className="message-text-preview">{msg.text}</span>
                        )}
                        {msg.editedAt && <span className="edited-badge">(edited)</span>}
                      </td>
                      <td>
                        {msg.createdAt ? new Date(msg.createdAt.toDate()).toLocaleString() : 'Just now'}
                      </td>
                      <td>
                        <div className="admin-actions">
                          {editingId === msg.id ? (
                            <>
                              <button className="action-btn save" onClick={() => handleSaveEdit(msg.id)}><Check size={16} /></button>
                              <button className="action-btn cancel" onClick={() => setEditingId(null)}><X size={16} /></button>
                            </>
                          ) : (
                            <>
                              <button className="action-btn edit" onClick={() => handleEditClick(msg)}><Edit2 size={16} /></button>
                              <button className="action-btn delete" onClick={() => handleDelete(msg.id)}><Trash2 size={16} /></button>
                            </>
                          )}
                        </div>
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
