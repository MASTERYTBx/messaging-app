import React, { useState, useEffect, useRef } from 'react';
import { Send, Smile, Paperclip, MoreVertical, Trash2, Edit2, X, Check, CheckCheck, ArrowLeft } from 'lucide-react';
import { format, isToday, isYesterday } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';
import { deleteMessage, editMessage, setTypingStatus, resetUnreadCount, markMessagesAsRead, addReaction, toggleChatFreeze, db, ADMIN_EMAIL } from '../firebase';
import { collection, query, where, onSnapshot, addDoc, serverTimestamp, updateDoc, doc, increment } from 'firebase/firestore';
import VerifiedBadge from './VerifiedBadge';

const EMOJIS = ['👍', '❤️', '😂', '😮', '😢', '🔥'];

export default function ChatWindow({ currentUser, selectedChat, onBack, isAdminSpectator = false }) {
  const [text, setText] = useState('');
  const [messages, setMessages] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [editText, setEditText] = useState('');
  const [dropdownOpen, setDropdownOpen] = useState(null);
  const [reactionOpen, setReactionOpen] = useState(null);
  const [isOtherTyping, setIsOtherTyping] = useState(false);
  const messagesEndRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  useEffect(() => {
    if (!selectedChat) return;

    // 1. Fetch Messages
    const qMsgs = query(collection(db, 'messages'), where('chatId', '==', selectedChat.chatId));
    const unsubMsgs = onSnapshot(qMsgs, (snapshot) => {
      let msgs = [];
      let hasUnreadFromOther = false;
      
      snapshot.forEach((docSnap) => {
        const data = docSnap.data();
        msgs.push({ ...data, id: docSnap.id });
        if (data.uid !== currentUser.uid && data.status === 'sent') {
          hasUnreadFromOther = true;
        }
      });
      
      msgs.sort((a, b) => {
        const timeA = a.createdAt?.toMillis() || Date.now();
        const timeB = b.createdAt?.toMillis() || Date.now();
        return timeA - timeB;
      });
      
      setMessages(msgs);

      // If we are looking at the chat and there are unread messages, mark them read
      if (hasUnreadFromOther) {
        markMessagesAsRead(selectedChat.chatId, currentUser.uid);
        resetUnreadCount(selectedChat.chatId, currentUser.uid);
      }
    });

    // 2. Listen to Chat Document for typing status
    const unsubChat = onSnapshot(doc(db, 'chats', selectedChat.chatId), (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        if (data.typing && data.typing[selectedChat.uid]) {
          setIsOtherTyping(true);
        } else {
          setIsOtherTyping(false);
        }
      }
    });

    // Initial reset of unread
    resetUnreadCount(selectedChat.chatId, currentUser.uid);
    markMessagesAsRead(selectedChat.chatId, currentUser.uid);

    return () => {
      unsubMsgs();
      unsubChat();
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      setTypingStatus(selectedChat.chatId, currentUser.uid, false);
    };
  }, [selectedChat, currentUser.uid]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isOtherTyping]);

  const handleTyping = (e) => {
    setText(e.target.value);
    setTypingStatus(selectedChat.chatId, currentUser.uid, true);
    
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      setTypingStatus(selectedChat.chatId, currentUser.uid, false);
    }, 2000);
  };

  const sendMessage = async (e) => {
    e.preventDefault();
    if (text.trim() === '' || !selectedChat) return;
    
    const msgText = text;
    setText('');
    setTypingStatus(selectedChat.chatId, currentUser.uid, false);

    try {
      await addDoc(collection(db, 'messages'), {
        chatId: selectedChat.chatId,
        text: msgText,
        uid: currentUser.uid,
        email: currentUser.email,
        displayName: currentUser.displayName,
        photoURL: currentUser.photoURL,
        status: 'sent',
        reactions: {},
        createdAt: serverTimestamp()
      });

      await updateDoc(doc(db, 'chats', selectedChat.chatId), {
        updatedAt: serverTimestamp(),
        lastMessage: msgText,
        lastMessageSender: currentUser.uid,
        [`unreadCount.${selectedChat.uid}`]: increment(1)
      });
    } catch (err) {
      console.error("Error sending message: ", err);
    }
  };

  const handleEditInit = (msg) => {
    setEditingId(msg.id);
    setEditText(msg.text);
    setDropdownOpen(null);
  };

  const handleReaction = (msgId, emoji) => {
    addReaction(msgId, currentUser.uid, emoji);
    setReactionOpen(null);
  };

  // Group Messages by Date
  const groupedMessages = [];
  let lastDate = null;

  messages.forEach(msg => {
    const msgDateObj = msg.createdAt ? msg.createdAt.toDate() : new Date();
    const dateStr = msgDateObj.toDateString();
    
    if (dateStr !== lastDate) {
      let displayDate = format(msgDateObj, 'MMMM d, yyyy');
      if (isToday(msgDateObj)) displayDate = 'Today';
      else if (isYesterday(msgDateObj)) displayDate = 'Yesterday';
      
      groupedMessages.push({ type: 'date', text: displayDate, id: `date-${dateStr}` });
      lastDate = dateStr;
    }
    groupedMessages.push({ type: 'message', ...msg });
  });

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
          <button className="mobile-back-btn" onClick={onBack}>
            <ArrowLeft size={20} />
          </button>
          <img src={selectedChat.photoURL || 'https://via.placeholder.com/40'} alt="Chat Avatar" className="avatar" />
          <div className="chat-title-wrapper">
            <h2 className="chat-title">
              {selectedChat.displayName} 
              {(selectedChat.email === ADMIN_EMAIL || selectedChat.isOfficial) && <VerifiedBadge email={ADMIN_EMAIL} />}
              {selectedChat.isFrozen && <span className="frozen-tag">(Frozen)</span>}
            </h2>
            <span className="chat-status">
              {isAdminSpectator ? 'Admin Spectator Mode' : (isOtherTyping ? <span className="typing-text">typing...</span> : (selectedChat.isChannel ? 'Announcement Channel' : `@${selectedChat.username}`))}
            </span>
          </div>
        </div>
        {isAdminSpectator && (
          <button 
            className={`admin-freeze-btn ${selectedChat.isFrozen ? 'unfreeze' : ''}`}
            onClick={() => toggleChatFreeze(selectedChat.chatId, !selectedChat.isFrozen)}
          >
            {selectedChat.isFrozen ? 'Unfreeze Chat' : 'Freeze Chat'}
          </button>
        )}
      </header>

      <div className="messages-area">
        <AnimatePresence>
          {groupedMessages.map((item) => {
            if (item.type === 'date') {
              return (
                <div key={item.id} className="date-separator">
                  <span>{item.text}</span>
                </div>
              );
            }

            const msg = item;
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
                <div className="message-bubble" onMouseLeave={() => {setDropdownOpen(null); setReactionOpen(null)}}>
                  {!isSent && (
                    <span className="message-sender">
                      {msg.displayName}
                      <VerifiedBadge email={msg.email} size={12} />
                    </span>
                  )}
                  
                  {isEditing ? (
                    <div className="inline-edit">
                      <input 
                        type="text" 
                        value={editText} 
                        onChange={(e) => setEditText(e.target.value)}
                        autoFocus
                        onKeyDown={(e) => { if(e.key === 'Enter') { editMessage(msg.id, editText); setEditingId(null); } }}
                      />
                      <button onClick={() => { editMessage(msg.id, editText); setEditingId(null); }} className="save-btn"><Check size={14}/></button>
                      <button onClick={() => setEditingId(null)} className="cancel-btn"><X size={14}/></button>
                    </div>
                  ) : (
                    <>
                      <p className="message-text">
                        {msg.text}
                        {msg.editedAt && <span className="edited-indicator"> (edited)</span>}
                      </p>
                      
                      <div className="message-meta">
                        <span className="message-time">
                          {msg.createdAt ? format(msg.createdAt.toDate(), 'HH:mm') : ''}
                        </span>
                        {isSent && (
                          <span className="message-status">
                            {msg.status === 'read' ? <CheckCheck size={14} className="read-tick" /> : <Check size={14} className="sent-tick" />}
                          </span>
                        )}
                      </div>
                      
                      {/* Reactions Display */}
                      {msg.reactions && Object.keys(msg.reactions).length > 0 && (
                        <div className="reactions-display">
                          {Object.values(msg.reactions).map((emoji, idx) => (
                            <span key={idx} className="reaction-emoji">{emoji}</span>
                          ))}
                        </div>
                      )}

                      {/* Hover Actions */}
                      <div className="message-actions-dropdown">
                        <Smile 
                          className="msg-more-icon react-icon" 
                          size={14} 
                          onClick={() => setReactionOpen(reactionOpen === msg.id ? null : msg.id)} 
                        />
                        {reactionOpen === msg.id && (
                          <div className="reaction-popover">
                            {EMOJIS.map(emoji => (
                              <span key={emoji} onClick={() => handleReaction(msg.id, emoji)}>{emoji}</span>
                            ))}
                          </div>
                        )}

                        {isAdminSpectator || isSent ? (
                          <>
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
                          </>
                        ) : null}
                      </div>
                    </>
                  )}
                </div>
              </motion.div>
            );
          })}
          
          {isOtherTyping && (
            <motion.div 
              className="message-wrapper received"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <div className="message-bubble typing-bubble">
                <span className="typing-dot"></span>
                <span className="typing-dot"></span>
                <span className="typing-dot"></span>
              </div>
            </motion.div>
          )}

        </AnimatePresence>
        <div ref={messagesEndRef} />
      </div>

      {isAdminSpectator ? (
        <div className="frozen-chat-notice">
          <p>You are spectating this chat. You cannot send messages.</p>
        </div>
      ) : selectedChat.isFrozen ? (
        <div className="frozen-chat-notice">
          <p>This chat has been frozen by an admin.</p>
        </div>
      ) : (selectedChat.isChannel && !selectedChat.adminIds?.includes(currentUser.uid)) ? (
        <div className="frozen-chat-notice">
          <p>Only admins can send messages in this channel.</p>
        </div>
      ) : (
        <form className="message-input-area" onSubmit={sendMessage}>
          <Smile className="input-icon" onClick={() => alert("Emoji picker coming soon!")} />
          <Paperclip className="input-icon" onClick={() => alert("File attachments coming soon!")} />
          <input 
            type="text" 
            className="message-input" 
            placeholder="Type a message" 
            value={text}
            onChange={handleTyping}
          />
          <button type="submit" className="send-btn" disabled={!text.trim()}>
            <Send className="send-icon" />
          </button>
        </form>
      )}
    </div>
  );
}
