import React, { useState, useEffect, useRef } from 'react';
import { Send, Smile, Paperclip, MoreVertical, Trash2, Edit2, X, Check } from 'lucide-react';
import { format } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';
import { deleteMessage, editMessage, db } from '../firebase';
import { collection, query, where, orderBy, onSnapshot, addDoc, serverTimestamp } from 'firebase/firestore';

export default function ChatWindow({ currentUser, selectedChat }) {
  const [text, setText] = useState('');
  const [messages, setMessages] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [editText, setEditText] = useState('');
  const [dropdownOpen, setDropdownOpen] = useState(null);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    if (!selectedChat) return;

    const q = query(
      collection(db, 'messages'), 
      where('chatId', '==', selectedChat.chatId)
    );
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      let msgs = [];
      snapshot.forEach((doc) => {
        msgs.push({ ...doc.data(), id: doc.id });
      });
      // Sort client-side to avoid needing a Firestore composite index
      msgs.sort((a, b) => {
        const timeA = a.createdAt?.toMillis() || Date.now();
        const timeB = b.createdAt?.toMillis() || Date.now();
        return timeA - timeB;
      });
      setMessages(msgs);
    }, (error) => {
      console.error("Error fetching messages:", error);
    });

    return () => unsubscribe();
  }, [selectedChat]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = async (text) => {
    if (text.trim() === '' || !selectedChat) return;
    try {
      await addDoc(collection(db, 'messages'), {
        chatId: selectedChat.chatId,
        text,
        uid: currentUser.uid,
        displayName: currentUser.displayName,
        photoURL: currentUser.photoURL,
        createdAt: serverTimestamp()
      });
    } catch (e) {
      console.error("Error adding message: ", e);
    }
  };

  const handleSend = (e) => {
    e.preventDefault();
    if (text.trim()) {
      sendMessage(text);
      setText('');
    }
  };

  const formatTime = (timestamp) => {
    if (!timestamp) return '';
    return format(timestamp.toDate(), 'HH:mm');
  };

  const handleEditInit = (msg) => {
    setEditingId(msg.id);
    setEditText(msg.text);
    setDropdownOpen(null);
  };

  const handleEditSave = (id) => {
    editMessage(id, editText);
    setEditingId(null);
  };

  if (!selectedChat) {
    return (
      <div className="chat-window empty-state">
        <div className="empty-state-content">
          <img src="/vite.svg" alt="App Logo" className="empty-logo" />
          <h2>Welcome to Messaging App</h2>
          <p>Search for a user by their @username to start chatting!</p>
        </div>
      </div>
    );
  }

  return (
    <div className="chat-window">
      <header className="chat-header">
        <div className="chat-header-info">
          <img src={selectedChat.photoURL || 'https://via.placeholder.com/40'} alt="Chat Avatar" className="avatar" />
          <div className="chat-title-wrapper">
            <h2 className="chat-title">{selectedChat.displayName}</h2>
            <span className="chat-status">@{selectedChat.username}</span>
          </div>
        </div>
      </header>

      <div className="messages-area">
        <AnimatePresence>
          {messages.map((msg) => {
            const isSent = msg.uid === currentUser.uid;
            const isEditing = editingId === msg.id;

            return (
              <motion.div 
                key={msg.id} 
                className={`message-wrapper ${isSent ? 'sent' : 'received'}`}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2 }}
              >
                <div className="message-bubble" onMouseLeave={() => setDropdownOpen(null)}>
                  {!isSent && <span className="message-sender">{msg.displayName}</span>}
                  
                  {isEditing ? (
                    <div className="inline-edit">
                      <input 
                        type="text" 
                        value={editText} 
                        onChange={(e) => setEditText(e.target.value)}
                        autoFocus
                        onKeyDown={(e) => { if(e.key === 'Enter') handleEditSave(msg.id) }}
                      />
                      <button onClick={() => handleEditSave(msg.id)} className="save-btn"><Check size={14}/></button>
                      <button onClick={() => setEditingId(null)} className="cancel-btn"><X size={14}/></button>
                    </div>
                  ) : (
                    <>
                      <p className="message-text">
                        {msg.text}
                        {msg.editedAt && <span className="edited-indicator"> (edited)</span>}
                      </p>
                      <span className="message-time">{formatTime(msg.createdAt)}</span>
                      
                      {isSent && (
                        <div className="message-actions-dropdown">
                          <MoreVertical 
                            className="msg-more-icon" 
                            size={16} 
                            onClick={() => setDropdownOpen(dropdownOpen === msg.id ? null : msg.id)} 
                          />
                          {dropdownOpen === msg.id && (
                            <div className="dropdown-menu">
                              <button onClick={() => handleEditInit(msg)}><Edit2 size={14}/> Edit</button>
                              <button onClick={() => deleteMessage(msg.id)} className="delete-text"><Trash2 size={14}/> Delete</button>
                            </div>
                          )}
                        </div>
                      )}
                    </>
                  )}
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
        <div ref={messagesEndRef} />
      </div>

      <form className="message-input-area" onSubmit={handleSend}>
        <Smile className="input-icon" onClick={() => alert("Emoji picker coming soon!")} />
        <Paperclip className="input-icon" onClick={() => alert("File attachments coming soon!")} />
        <input 
          type="text" 
          className="message-input" 
          placeholder="Type a message" 
          value={text}
          onChange={(e) => setText(e.target.value)}
        />
        <button type="submit" className="send-btn" disabled={!text.trim()}>
          <Send className="send-icon" />
        </button>
      </form>
    </div>
  );
}
