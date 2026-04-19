import React, { useState, useEffect } from 'react';
import { Send, Smile, Paperclip } from 'lucide-react';
import { format } from 'date-fns';

export default function ChatWindow({ messages, currentUser, sendMessage, messagesEndRef }) {
  const [text, setText] = useState('');

  const handleSend = (e) => {
    e.preventDefault();
    if (text.trim()) {
      sendMessage(text);
      setText('');
    }
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, messagesEndRef]);

  const formatTime = (timestamp) => {
    if (!timestamp) return '';
    return format(timestamp.toDate(), 'HH:mm');
  };

  return (
    <div className="chat-window">
      <header className="chat-header">
        <div className="chat-header-info">
          <img src="https://via.placeholder.com/40/00a884/ffffff?text=GC" alt="Chat Avatar" className="avatar" />
          <div className="chat-title-wrapper">
            <h2 className="chat-title">Global Family Chat</h2>
            <span className="chat-status">click here for contact info</span>
          </div>
        </div>
      </header>

      <div className="messages-area">
        {messages.map((msg) => {
          const isSent = msg.uid === currentUser.uid;
          return (
            <div key={msg.id} className={`message-wrapper ${isSent ? 'sent' : 'received'}`}>
              <div className="message-bubble">
                {!isSent && <span className="message-sender">{msg.displayName}</span>}
                <p className="message-text">{msg.text}</p>
                <span className="message-time">{formatTime(msg.createdAt)}</span>
              </div>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      <form className="message-input-area" onSubmit={handleSend}>
        <Smile className="input-icon" />
        <Paperclip className="input-icon" />
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
