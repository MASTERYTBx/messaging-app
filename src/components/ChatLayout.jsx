import React, { useState } from 'react';
import Sidebar from './Sidebar';
import ChatWindow from './ChatWindow';

export default function ChatLayout({ user, logOut }) {
  const [selectedChat, setSelectedChat] = useState(null);

  return (
    <div className="chat-layout">
      <Sidebar 
        user={user} 
        logOut={logOut} 
        selectedChat={selectedChat}
        onSelectChat={setSelectedChat}
      />
      <ChatWindow 
        currentUser={user} 
        selectedChat={selectedChat}
      />
    </div>
  );
}
