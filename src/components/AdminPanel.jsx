import React, { useState, useEffect } from 'react';
import { db, ADMIN_EMAIL, deleteMessage, editMessage } from '../firebase';
import { collection, query, orderBy, onSnapshot } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';
import { Trash2, Edit2, Check, X, ArrowLeft } from 'lucide-react';
import { motion } from 'framer-motion';

export default function AdminPanel({ user }) {
  const [messages, setMessages] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [editText, setEditText] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    // Basic protection: if not admin, kick them out
    if (user?.email !== ADMIN_EMAIL) {
      navigate('/');
    }

    const q = query(collection(db, 'messages'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      let msgs = [];
      snapshot.forEach((doc) => {
        msgs.push({ ...doc.data(), id: doc.id });
      });
      setMessages(msgs);
    });

    return () => unsubscribe();
  }, [user, navigate]);

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

  return (
    <motion.div 
      className="admin-panel"
      initial={{ opacity: 0, x: 50 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -50 }}
    >
      <div className="admin-header">
        <button className="back-btn" onClick={() => navigate('/')}>
          <ArrowLeft /> Back to Chat
        </button>
        <h2>Admin Dashboard</h2>
        <span className="admin-badge">Super Admin</span>
      </div>

      <div className="admin-content">
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
      </div>
    </motion.div>
  );
}
