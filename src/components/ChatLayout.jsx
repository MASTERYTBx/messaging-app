import React, { useState, useEffect, useRef } from 'react';
import Sidebar from './Sidebar';
import ChatWindow from './ChatWindow';
import { db } from '../firebase';
import { collection, query, orderBy, onSnapshot, addDoc, serverTimestamp } from 'firebase/firestore';

export default function ChatLayout({ user, logOut }) {
  const [messages, setMessages] = useState([]);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    const q = query(collection(db, 'messages'), orderBy('createdAt'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      let msgs = [];
      snapshot.forEach((doc) => {
        msgs.push({ ...doc.data(), id: doc.id });
      });
      setMessages(msgs);
    }, (error) => {
      console.error("Error fetching messages: ", error);
    });

    return () => unsubscribe();
  }, []);

  const sendMessage = async (text) => {
    if (text.trim() === '') return;
    try {
      await addDoc(collection(db, 'messages'), {
        text,
        uid: user.uid,
        displayName: user.displayName,
        photoURL: user.photoURL,
        createdAt: serverTimestamp()
      });
    } catch (e) {
      console.error("Error adding message: ", e);
    }
  };

  return (
    <div className="chat-layout">
      <Sidebar user={user} logOut={logOut} />
      <ChatWindow 
        messages={messages} 
        currentUser={user} 
        sendMessage={sendMessage} 
        messagesEndRef={messagesEndRef}
      />
    </div>
  );
}
