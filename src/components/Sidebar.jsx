import React, { useState, useEffect, useRef } from 'react';
import { MoreVertical, MessageSquare, CircleDashed, ShieldAlert, Search } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { ADMIN_EMAIL, searchUsersByUsername, getOrCreateChat, db } from '../firebase';
import { collection, query, where, onSnapshot, doc, deleteDoc } from 'firebase/firestore';
import { motion } from 'framer-motion';
import ProfileSettings from './ProfileSettings';
import VerifiedBadge from './VerifiedBadge';
import StatusModal from './StatusModal';
import CreateChannelModal from './CreateChannelModal';
import { useAlert } from './CustomAlert';

export default function Sidebar({ user, logOut, selectedChat, onSelectChat }) {
  const navigate = useNavigate();
  const isAdmin = user?.email === ADMIN_EMAIL;
  const { showConfirm, showAlert } = useAlert();
  
  const [showProfile, setShowProfile] = useState(false);
  const [showStatus, setShowStatus] = useState(false);
  const [showCreateChannel, setShowCreateChannel] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [activeChats, setActiveChats] = useState([]);
  const [channels, setChannels] = useState([]);
  const [activeTab, setActiveTab] = useState('chats'); // 'chats' | 'channels'
  const [contextMenu, setContextMenu] = useState(null);

  const selectedChatRef = useRef(selectedChat);
  const dndEnabled = user?.settings?.dndEnabled || false;

  useEffect(() => {
    selectedChatRef.current = selectedChat;
  }, [selectedChat]);

  // Close context menu on any click
  useEffect(() => {
    const handleClick = () => setContextMenu(null);
    window.addEventListener('click', handleClick);
    return () => window.removeEventListener('click', handleClick);
  }, []);

  useEffect(() => {
    // Listen for chats where this user is a participant
    const q = query(collection(db, 'chats'), where('participants', 'array-contains', user.uid));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      
      snapshot.docChanges().forEach((change) => {
        if (change.type === "modified") {
          const data = change.doc.data();
          // If message is from someone else and we aren't looking at the chat
          if (data.lastMessageSender && data.lastMessageSender !== user.uid) {
            if (selectedChatRef.current?.chatId !== change.doc.id) {
              if (!dndEnabled && 'Notification' in window && Notification.permission === 'granted') {
                new Notification('New Message', {
                  body: data.lastMessage || 'Sent a message',
                  icon: '/app-icon.svg'
                });
              }
            }
          }
        }
      });

      let chats = [];
      snapshot.docs.forEach(doc => {
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
  }, [user.uid, dndEnabled]);

  useEffect(() => {
    // Fetch channels
    const q = query(collection(db, 'channels'));
    const unsub = onSnapshot(q, (snapshot) => {
      let fetched = [];
      snapshot.forEach(docSnap => {
        const data = docSnap.data();
        if (data.isPublic || data.participants?.includes(user.uid) || data.adminIds?.includes(user.uid)) {
           fetched.push({ id: docSnap.id, ...data });
        }
      });
      // Sort by updatedAt
      fetched.sort((a, b) => {
        const timeA = a.updatedAt?.toMillis() || 0;
        const timeB = b.updatedAt?.toMillis() || 0;
        return timeB - timeA;
      });
      setChannels(fetched);
    });
    return () => unsub();
  }, [user.uid]);

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

  const handleContextMenu = (e, chat) => {
    e.preventDefault();
    setContextMenu({
      mouseX: e.clientX,
      mouseY: e.clientY,
      chat: chat
    });
  };

  const handleDeleteChat = async () => {
    if (!contextMenu?.chat) return;
    showConfirm("Are you sure you want to delete this conversation for both participants?", async () => {
      await deleteDoc(doc(db, "chats", contextMenu.chat.id));
      if (selectedChat?.chatId === contextMenu.chat.id) {
        onSelectChat(null);
      }
    });
  };

  const handleMuteChat = () => {
    showAlert("Chat muted! (Visual placeholder)");
  };

  const startChat = async (targetUser) => {
    const chatId = await getOrCreateChat(user, targetUser);
    onSelectChat({
      chatId,
      uid: targetUser.uid,
      email: targetUser.email,
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
          <span className="user-name">Profile <VerifiedBadge email={user.email} size={14} /></span>
        </div>
        <div className="sidebar-actions">
          {isAdmin && (
            <ShieldAlert 
              className="action-icon admin-icon" 
              onClick={() => navigate('/admin')} 
              title="Admin Panel"
            />
          )}
          <CircleDashed className="action-icon" onClick={() => setShowStatus(true)} title="Status Updates" />
          <MessageSquare className="action-icon" onClick={() => setActiveTab('chats')} title="Chats" />
          <div className="dropdown">
            <MoreVertical className="action-icon" onClick={() => {
              showConfirm("Do you want to log out?", () => logOut());
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

      <div className="sidebar-tabs">
        <button className={activeTab === 'chats' ? 'active' : ''} onClick={() => setActiveTab('chats')}>Chats</button>
        <button className={activeTab === 'channels' ? 'active' : ''} onClick={() => setActiveTab('channels')}>Channels</button>
      </div>

      <div className="contact-list">
        {searchQuery.length > 2 ? (
          <div className="search-results">
            {searchResults.length === 0 ? <p className="no-results">No users found</p> : null}
            {searchResults.map((u, i) => (
              <motion.div 
                key={u.uid} 
                className="contact-item" 
                onClick={() => startChat(u)}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05 }}
              >
                <img src={u.photoURL || 'https://via.placeholder.com/48'} alt="Avatar" className="avatar" />
                <div className="contact-info">
                  <h3 className="contact-name">{u.displayName} <VerifiedBadge email={u.email} /></h3>
                  <p className="contact-last-message">@{u.username}</p>
                </div>
              </motion.div>
            ))}
          </div>
        ) : activeTab === 'channels' ? (
          <div className="channels-list">
            {isAdmin && (
              <div style={{padding: '12px 16px', borderBottom: '1px solid var(--border-color)'}}>
                <button 
                  style={{width: '100%', padding: '8px', backgroundColor: 'var(--primary-color)', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold'}}
                  onClick={() => setShowCreateChannel(true)}
                >
                  + Create Channel
                </button>
              </div>
            )}
            {channels.length === 0 ? <p className="no-results">No channels available.</p> : null}
            {channels.map(channel => {
              const isActive = selectedChat?.chatId === channel.id;
              return (
                <motion.div 
                  key={channel.id} 
                  className={`contact-item ${isActive ? 'active' : ''}`} 
                  onClick={() => onSelectChat({
                    chatId: channel.id,
                    isChannel: true,
                    displayName: channel.name,
                    username: 'channel',
                    photoURL: 'https://via.placeholder.com/48/00a884/ffffff?text=CH',
                    adminIds: channel.adminIds,
                    isOfficial: channel.isOfficial
                  })}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                >
                  <img src='https://via.placeholder.com/48/00a884/ffffff?text=CH' alt="Channel" className="avatar" />
                  <div className="contact-info">
                    <div className="contact-info-header">
                      <h3 className="contact-name">
                        {channel.name} 
                        {channel.isOfficial && <VerifiedBadge email={ADMIN_EMAIL} size={14} />}
                      </h3>
                    </div>
                    <p className="contact-last-message">
                      {channel.lastMessage || 'Channel created'}
                    </p>
                  </div>
                </motion.div>
              )
            })}
          </div>
        ) : (
          <div className="active-chats">
            {[...activeChats, ...channels].sort((a, b) => {
              const timeA = a.updatedAt?.toMillis() || 0;
              const timeB = b.updatedAt?.toMillis() || 0;
              return timeB - timeA;
            }).map(chat => {
              // Check if it's a channel
              if (chat.adminIds) {
                const isActive = selectedChat?.chatId === chat.id;
                return (
                  <motion.div 
                    key={`channel-${chat.id}`} 
                    layout
                    className={`contact-item ${isActive ? 'active' : ''}`} 
                    onClick={() => onSelectChat({
                      chatId: chat.id,
                      isChannel: true,
                      displayName: chat.name,
                      username: 'channel',
                      photoURL: 'https://via.placeholder.com/48/00a884/ffffff?text=CH',
                      adminIds: chat.adminIds,
                      isOfficial: chat.isOfficial
                    })}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ type: "spring", stiffness: 300, damping: 25 }}
                  >
                    <img src='https://via.placeholder.com/48/00a884/ffffff?text=CH' alt="Channel" className="avatar" />
                    <div className="contact-info">
                      <div className="contact-info-header">
                        <h3 className="contact-name">
                          {chat.name} 
                          {chat.isOfficial && <VerifiedBadge email={ADMIN_EMAIL} size={14} />}
                        </h3>
                      </div>
                      <p className="contact-last-message">
                        {chat.lastMessage || 'Channel created'}
                      </p>
                    </div>
                  </motion.div>
                )
              }

              // Normal Chat
              const otherUid = chat.participants.find(id => id !== user.uid);
              const otherDetails = chat.participantDetails[otherUid];
              const isActive = selectedChat?.chatId === chat.id;
              const unreadCount = chat.unreadCount?.[user.uid] || 0;

              return (
                <motion.div 
                  key={`chat-${chat.id}`} 
                  layout
                  className={`contact-item ${isActive ? 'active' : ''}`} 
                  onClick={() => onSelectChat({
                    chatId: chat.id,
                    uid: otherUid,
                    ...otherDetails
                  })}
                  onContextMenu={(e) => handleContextMenu(e, chat)}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ type: "spring", stiffness: 300, damping: 25 }}
                >
                  <img src={otherDetails?.photoURL || 'https://via.placeholder.com/48'} alt="Avatar" className="avatar" />
                  <div className="contact-info">
                    <div className="contact-info-header">
                      <h3 className="contact-name">
                        {otherDetails?.displayName} 
                        <VerifiedBadge email={otherDetails?.email} />
                        <span style={{fontSize: '0.75rem', color: '#8696a0', marginLeft: '4px'}}>@{otherDetails?.username}</span>
                      </h3>
                      {unreadCount > 0 && <span className="unread-badge">{unreadCount}</span>}
                    </div>
                    <p className={`contact-last-message ${unreadCount > 0 ? 'unread-bold' : ''}`}>
                      {chat.lastMessage || 'Start chatting!'}
                    </p>
                  </div>
                </motion.div>
              )
            })}
          </div>
        )}
      </div>

      {contextMenu && (
        <div 
          className="custom-context-menu"
          style={{ top: contextMenu.mouseY, left: contextMenu.mouseX }}
        >
          <button onClick={handleDeleteChat} className="danger">Delete Chat</button>
          <button onClick={handleMuteChat}>Mute Chat</button>
        </div>
      )}

      {showProfile && <ProfileSettings user={user} onClose={() => setShowProfile(false)} />}
      {showStatus && <StatusModal user={user} onClose={() => setShowStatus(false)} />}
      {showCreateChannel && <CreateChannelModal user={user} onClose={() => setShowCreateChannel(false)} />}
    </motion.div>
  );
}
