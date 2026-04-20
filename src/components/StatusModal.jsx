import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Send, Loader2 } from 'lucide-react';
import { db, addStatus } from '../firebase';
import { collection, query, where, onSnapshot, orderBy } from 'firebase/firestore';
import VerifiedBadge from './VerifiedBadge';

export default function StatusModal({ user, onClose }) {
  const [text, setText] = useState('');
  const [statuses, setStatuses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [posting, setPosting] = useState(false);

  useEffect(() => {
    // Fetch statuses from the last 24 hours
    const yesterday = new Date();
    yesterday.setHours(yesterday.getHours() - 24);

    const q = query(
      collection(db, 'statuses'),
      where('createdAt', '>', yesterday),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      let fetched = [];
      snapshot.forEach(doc => {
        fetched.push({ id: doc.id, ...doc.data() });
      });
      setStatuses(fetched);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handlePost = async (e) => {
    e.preventDefault();
    if (!text.trim()) return;
    setPosting(true);
    await addStatus(user, text.trim());
    setText('');
    setPosting(false);
  };

  return (
    <div className="modal-overlay">
      <motion.div 
        className="profile-modal status-modal"
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
      >
        <button className="close-modal-btn" onClick={onClose}><X size={20} /></button>
        
        <h2>Status Updates</h2>

        <form className="status-input-area" onSubmit={handlePost}>
          <img src={user.photoURL || 'https://via.placeholder.com/40'} alt="Me" className="avatar" />
          <input 
            type="text" 
            placeholder="What's on your mind?" 
            value={text}
            onChange={(e) => setText(e.target.value)}
            maxLength={100}
          />
          <button type="submit" disabled={!text.trim() || posting}>
            {posting ? <Loader2 size={16} className="spinner" /> : <Send size={16} />}
          </button>
        </form>

        <div className="statuses-list">
          {loading ? (
            <div className="loading-spinner"><Loader2 className="spinner" /></div>
          ) : statuses.length === 0 ? (
            <p className="no-results">No recent updates.</p>
          ) : (
            <AnimatePresence>
              {statuses.map((s, i) => (
                <motion.div 
                  key={s.id} 
                  className="status-card"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.05 }}
                >
                  <div className="status-header">
                    <img src={s.photoURL || 'https://via.placeholder.com/40'} alt="" className="avatar" />
                    <div>
                      <h4>{s.displayName} <VerifiedBadge email={s.email} size={14}/></h4>
                      <span>
                        {s.createdAt ? new Date(s.createdAt.toDate()).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : 'Just now'}
                      </span>
                    </div>
                  </div>
                  <p className="status-text">{s.text}</p>
                </motion.div>
              ))}
            </AnimatePresence>
          )}
        </div>
      </motion.div>
    </div>
  );
}
