'use client';

import React, { useState, useEffect, useRef, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { getConversations, getMessages, sendMessage } from '@/lib/api';
import styles from './messages.module.css';

function MessagesContent() {
  const searchParams = useSearchParams();
  const toParam = searchParams.get('to');
  const postParam = searchParams.get('post');

  const { currentUser } = useAuth();
  const [conversations, setConversations] = useState([]);
  const [selectedPartner, setSelectedPartner] = useState(toParam || null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState(
    postParam ? `Hi! I'm reaching out about a post (ID: ${postParam}).` : ''
  );
  const [loadingConvos, setLoadingConvos] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [error, setError] = useState('');
  const messagesEndRef = useRef(null);

  useEffect(() => {
    if (currentUser) {
      fetchConversations();
    }
  }, [currentUser]);

  useEffect(() => {
    if (selectedPartner) {
      fetchMessages(selectedPartner);
    }
  }, [selectedPartner]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const fetchConversations = async () => {
    try {
      setLoadingConvos(true);
      const res = await getConversations();
      setConversations(res.data);

      // If we have a "to" param but it's not in conversations, add a placeholder
      if (toParam && !res.data.find((c) => c.partner_id === toParam)) {
        setConversations([
          { partner_id: toParam, partner_email: 'New Conversation', last_message: '' },
          ...res.data,
        ]);
      }
    } catch (err) {
      setError('Failed to load conversations');
    } finally {
      setLoadingConvos(false);
    }
  };

  const fetchMessages = async (partnerId) => {
    try {
      setLoadingMessages(true);
      const res = await getMessages(partnerId);
      setMessages(res.data);
    } catch (err) {
      // New conversation — no messages yet
      setMessages([]);
    } finally {
      setLoadingMessages(false);
    }
  };

  const handleSend = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedPartner) return;

    try {
      await sendMessage({
        receiver_id: selectedPartner,
        content: newMessage.trim(),
      });
      setNewMessage('');
      fetchMessages(selectedPartner);
      fetchConversations();
    } catch (err) {
      setError('Failed to send message');
    }
  };

  if (!currentUser) {
    return (
      <div className="pageContainer">
        <div className="emptyState">
          <h3>Please log in to view messages</h3>
          <a href="/login" className="btn btnPrimary">Log In</a>
        </div>
      </div>
    );
  }

  return (
    <div className="pageContainer">
      <div className={styles.messagesPage}>
        <h1>💬 Messages</h1>

        <div className={styles.messagesLayout}>
          {/* Conversations Sidebar */}
          <div className={styles.sidebar}>
            <h3>Conversations</h3>
            {loadingConvos ? (
              <div className={styles.sidebarLoading}>Loading...</div>
            ) : conversations.length === 0 ? (
              <div className={styles.sidebarEmpty}>
                <p>No conversations yet</p>
              </div>
            ) : (
              <div className={styles.conversationList}>
                {conversations.map((convo) => (
                  <div
                    key={convo.partner_id}
                    className={`${styles.conversationItem} ${
                      selectedPartner === convo.partner_id ? styles.active : ''
                    }`}
                    onClick={() => setSelectedPartner(convo.partner_id)}
                  >
                    <div className={styles.convoAvatar}>
                      {(convo.partner_email || '?')[0].toUpperCase()}
                    </div>
                    <div className={styles.convoInfo}>
                      <span className={styles.convoEmail}>{convo.partner_email}</span>
                      <span className={styles.convoPreview}>
                        {convo.last_message
                          ? convo.last_message.substring(0, 40) + (convo.last_message.length > 40 ? '...' : '')
                          : 'Start a conversation'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Messages Panel */}
          <div className={styles.chatPanel}>
            {!selectedPartner ? (
              <div className={styles.chatEmpty}>
                <h3>Select a conversation</h3>
                <p>Choose a conversation from the sidebar or message someone from an item post.</p>
              </div>
            ) : (
              <>
                <div className={styles.chatMessages}>
                  {loadingMessages ? (
                    <div className={styles.chatLoading}>Loading messages...</div>
                  ) : messages.length === 0 ? (
                    <div className={styles.chatEmpty}>
                      <p>No messages yet. Send the first one!</p>
                    </div>
                  ) : (
                    messages.map((msg, index) => (
                      <div
                        key={index}
                        className={`${styles.message} ${
                          msg.sender_id === currentUser.uid ? styles.sent : styles.received
                        }`}
                      >
                        <div className={styles.messageBubble}>
                          <p>{msg.content}</p>
                          <span className={styles.messageTime}>
                            {new Date(msg.created_at).toLocaleString()}
                          </span>
                        </div>
                      </div>
                    ))
                  )}
                  <div ref={messagesEndRef} />
                </div>

                <form onSubmit={handleSend} className={styles.chatInput}>
                  <input
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="Type a message..."
                  />
                  <button type="submit" className="btn btnPrimary" disabled={!newMessage.trim()}>
                    Send
                  </button>
                </form>
              </>
            )}
          </div>
        </div>

        {error && <div className="errorMessage">{error}</div>}
      </div>
    </div>
  );
}

export default function MessagesPage() {
  return (
    <Suspense fallback={
      <div className="pageContainer">
        <div className="loadingSpinner">
          <div className="spinner"></div>
          <p>Loading messages...</p>
        </div>
      </div>
    }>
      <MessagesContent />
    </Suspense>
  );
}
