import React, { useState } from 'react';
import Sidebar from './Sidebar';
import ChatWindow from './ChatWindow';

export default function ChatLayout({ user, logOut }) {
  const [selectedChat, setSelectedChat] = useState(null);

  return (
    <div className={`chat-layout ${selectedChat ? 'chat-active' : ''}`}>
      <Sidebar 
        user={user} 
        logOut={logOut} 
        selectedChat={selectedChat}
        onSelectChat={setSelectedChat}
      />
      <ChatWindow 
        currentUser={user} 
        selectedChat={selectedChat}
        onBack={() => setSelectedChat(null)}
      />
    </div>
  );
}
