import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getConversations, getMessages, sendMessage } from '../services/api';
import './Pages.css';

const Messages = () => {
  const { currentUser } = useAuth();
  const [searchParams] = useSearchParams();
  const [conversations, setConversations] = useState([]);
  const [activePartner, setActivePartner] = useState(null);
  const [activePostId, setActivePostId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef(null);

  // Check URL params for direct message
  const toUserId = searchParams.get('to');
  const postId = searchParams.get('post');

  useEffect(() => {
    if (toUserId) {
      setActivePartner(toUserId);
      setActivePostId(postId);
    }
    fetchConversations();
  }, [toUserId, postId]);

  useEffect(() => {
    if (activePartner) {
      fetchMessages(activePartner, activePostId);
    }
  }, [activePartner, activePostId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const fetchConversations = async () => {
    try {
      const res = await getConversations();
      setConversations(res.data);
    } catch (err) {
      console.error('Failed to fetch conversations:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchMessages = async (partnerId, postId) => {
    try {
      const res = await getMessages(partnerId, postId);
      setMessages(res.data);
    } catch (err) {
      console.error('Failed to fetch messages:', err);
    }
  };

  const handleSend = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !activePartner) return;

    setSending(true);
    try {
      await sendMessage({
        receiver_id: activePartner,
        related_post_id: activePostId,
        message_text: newMessage.trim(),
      });
      setNewMessage('');
      fetchMessages(activePartner, activePostId);
      fetchConversations();
    } catch (err) {
      console.error('Failed to send message:', err);
    } finally {
      setSending(false);
    }
  };

  const selectConversation = (conv) => {
    setActivePartner(conv.partnerId);
    setActivePostId(conv.related_post_id);
  };

  if (!currentUser) {
    return (
      <div className="page-container">
        <div className="empty-state">
          <h3>Please log in to view messages</h3>
        </div>
      </div>
    );
  }

  return (
    <div className="page-container">
      <div className="page-header">
        <h1>💬 Messages</h1>
      </div>

      <div className="messages-layout">
        {/* Conversations Sidebar */}
        <div className="conversations-sidebar">
          <h3>Conversations</h3>
          {loading ? (
            <p className="sidebar-loading">Loading...</p>
          ) : conversations.length === 0 && !toUserId ? (
            <p className="sidebar-empty">No conversations yet</p>
          ) : (
            <div className="conversation-list">
              {toUserId && !conversations.find(c => c.partnerId === toUserId) && (
                <div
                  className={`conversation-item ${activePartner === toUserId ? 'active' : ''}`}
                  onClick={() => { setActivePartner(toUserId); setActivePostId(postId); }}
                >
                  <div className="conv-info">
                    <span className="conv-partner">New Conversation</span>
                    <span className="conv-post">Re: Post</span>
                  </div>
                </div>
              )}
              {conversations.map((conv, idx) => (
                <div
                  key={idx}
                  className={`conversation-item ${activePartner === conv.partnerId ? 'active' : ''}`}
                  onClick={() => selectConversation(conv)}
                >
                  <div className="conv-info">
                    <span className="conv-partner">{conv.partnerEmail || conv.partnerId}</span>
                    {conv.lastMessage && (
                      <span className="conv-preview">
                        {conv.lastMessage.message_text?.substring(0, 40)}...
                      </span>
                    )}
                  </div>
                  {conv.unread > 0 && <span className="conv-unread">{conv.unread}</span>}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Messages Panel */}
        <div className="messages-panel">
          {activePartner ? (
            <>
              <div className="messages-list">
                {messages.length === 0 ? (
                  <div className="messages-empty">
                    <p>No messages yet. Send the first message!</p>
                  </div>
                ) : (
                  messages.map((msg) => (
                    <div
                      key={msg.message_id}
                      className={`message-bubble ${
                        msg.sender_id === currentUser.uid ? 'sent' : 'received'
                      }`}
                    >
                      <p className="message-text">{msg.message_text}</p>
                      <span className="message-time">
                        {new Date(msg.timestamp).toLocaleString()}
                      </span>
                    </div>
                  ))
                )}
                <div ref={messagesEndRef} />
              </div>

              <form className="message-input-form" onSubmit={handleSend}>
                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Type a message..."
                  className="message-input"
                />
                <button type="submit" className="btn btn-primary" disabled={sending}>
                  {sending ? '...' : 'Send'}
                </button>
              </form>
            </>
          ) : (
            <div className="messages-empty">
              <span className="empty-icon">💬</span>
              <h3>Select a conversation</h3>
              <p>Choose a conversation from the sidebar or message someone from a post.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Messages;
