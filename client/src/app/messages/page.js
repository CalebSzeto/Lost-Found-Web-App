'use client';

import React, { Suspense, useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import {
  blockUser,
  endConversation,
  getBlockedUsers,
  getConversations,
  getMessages,
  sendMessage,
  unblockUser,
} from '@/lib/api';
import styles from './messages.module.css';

function MessagesContent() {
  const searchParams = useSearchParams();
  const toParam = searchParams.get('to');
  const postParam = searchParams.get('post');
  const urlConversationId = toParam ? `${toParam}_${postParam || 'general'}` : null;

  const { currentUser } = useAuth();
  const [conversations, setConversations] = useState([]);
  const [selectedConversationId, setSelectedConversationId] = useState(
    urlConversationId
  );
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loadingConvos, setLoadingConvos] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [error, setError] = useState('');
  const [blockedUserIds, setBlockedUserIds] = useState([]);
  const [blockedUsers, setBlockedUsers] = useState([]);
  const [busyAction, setBusyAction] = useState(false);
  const chatMessagesRef = useRef(null);
  const lastSentAtRef = useRef(0);

  const selectedConversation = useMemo(
    () => conversations.find((c) => c.conversation_id === selectedConversationId),
    [conversations, selectedConversationId]
  );

  useEffect(() => {
    if (currentUser) {
      fetchConversations(false);
      fetchBlockedUsers();
    }
  }, [currentUser]);

  useEffect(() => {
    // Keep selection in sync when the URL changes from detail-page links.
    setSelectedConversationId(urlConversationId);
  }, [urlConversationId]);

  useEffect(() => {
    if (selectedConversation?.partner_id) {
      fetchMessages(
        selectedConversation.partner_id,
        selectedConversation.related_post_id,
        false
      );
    }
  }, [selectedConversation?.partner_id, selectedConversation?.related_post_id]);

  useEffect(() => {
    if (chatMessagesRef.current) {
      chatMessagesRef.current.scrollTop = chatMessagesRef.current.scrollHeight;
    }
  }, [messages]);

  useEffect(() => {
    if (!currentUser) return;

    const intervalId = setInterval(() => {
      fetchConversations(true);
      if (selectedConversation?.partner_id) {
        fetchMessages(
          selectedConversation.partner_id,
          selectedConversation.related_post_id,
          true
        );
      }
    }, 4000);

    return () => clearInterval(intervalId);
  }, [currentUser, selectedConversation?.partner_id, selectedConversation?.related_post_id]);

  const normalizeConversations = (items) =>
    (items || []).map((c) => {
      const partnerId = c.partner_id || c.partnerId;
      const relatedPostId = c.related_post_id || null;

      return {
        conversation_id: c.conversation_id || `${partnerId}_${relatedPostId || 'general'}`,
        partner_id: partnerId,
        partner_email: c.partner_email || c.partnerEmail || partnerId,
        related_post_id: relatedPostId,
        related_post_type: c.related_post_type || null,
        related_post_title: c.related_post_title || null,
        last_message: c.last_message || '',
        unread: c.unread || 0,
      };
    });

  const fetchBlockedUsers = async () => {
    try {
      const res = await getBlockedUsers();
      const users = res.data || [];
      setBlockedUsers(users);
      setBlockedUserIds(users.map((u) => String(u.user_id)));
    } catch (err) {
      setBlockedUsers([]);
      setBlockedUserIds([]);
    }
  };

  const fetchConversations = async (silent = false) => {
    try {
      if (!silent) setLoadingConvos(true);

      const res = await getConversations();
      const normalized = normalizeConversations(res.data);

      let merged = normalized;
      if (urlConversationId && !normalized.find((c) => c.conversation_id === urlConversationId)) {
        merged = [
          {
            conversation_id: urlConversationId,
            partner_id: toParam,
            partner_email: 'New Conversation',
            related_post_id: postParam || null,
            related_post_type: null,
            related_post_title: null,
            last_message: '',
            unread: 0,
          },
          ...normalized,
        ];
      }

      setConversations(merged);

      if (!selectedConversationId && merged.length > 0) {
        setSelectedConversationId(merged[0].conversation_id);
      }
    } catch (err) {
      setError('Failed to load conversations');
    } finally {
      if (!silent) setLoadingConvos(false);
    }
  };

  const fetchMessages = async (partnerId, postId, silent = false) => {
    try {
      // Keep a freshly sent optimistic message visible for a short time.
      if (silent && Date.now() - lastSentAtRef.current < 3000) {
        return;
      }

      if (!silent) setLoadingMessages(true);

      const res = await getMessages(partnerId, postId || undefined);
      const normalized = (res.data || []).map((m) => ({
        ...m,
        content: m.content || m.message_text || '',
        created_at: m.created_at || m.timestamp,
      }));

      setMessages(normalized);
    } catch (err) {
      if (!silent) setMessages([]);
    } finally {
      if (!silent) setLoadingMessages(false);
    }
  };

  const handleSend = async (e) => {
    e.preventDefault();
    if (!selectedConversation?.partner_id || !newMessage.trim()) return;
    if (blockedUserIds.includes(String(selectedConversation.partner_id))) {
      setError('You blocked this user. Unblock to send messages.');
      return;
    }

    const text = newMessage.trim();
    const conversationPostId = selectedConversation.conversation_id.split('_').slice(1).join('_');
    const activePostId =
      selectedConversation.related_post_id ||
      (conversationPostId && conversationPostId !== 'general' ? conversationPostId : null) ||
      postParam ||
      undefined;

    const tempId = `temp-${Date.now()}`;

    const optimisticMessage = {
      message_id: tempId,
      sender_id: currentUser.uid,
      sender_email: currentUser.email,
      related_post_id: activePostId || null,
      content: text,
      created_at: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, optimisticMessage]);
    setConversations((prev) =>
      prev.map((c) =>
        c.conversation_id === selectedConversation.conversation_id
          ? { ...c, last_message: text }
          : c
      )
    );
    setNewMessage('');
    lastSentAtRef.current = Date.now();

    try {
      const res = await sendMessage({
        receiver_id: selectedConversation.partner_id,
        related_post_id: activePostId,
        message_text: text,
      });

      const saved = res?.data?.data;
      if (saved) {
        const confirmedMessage = {
          ...saved,
          content: saved.message_text || text,
          created_at: saved.timestamp || new Date().toISOString(),
        };

        setMessages((prev) =>
          prev.map((m) => (m.message_id === tempId ? confirmedMessage : m))
        );
      }

      setError('');
      // Refresh sidebar metadata now; polling keeps thread synced.
      fetchConversations(true);
    } catch (err) {
      setError('Failed to send message');
      fetchMessages(selectedConversation.partner_id, activePostId, true);
    }
  };

  const handleToggleBlock = async () => {
    if (!selectedConversation?.partner_id) return;

    const partnerId = String(selectedConversation.partner_id);
    const blocked = blockedUserIds.includes(partnerId);
    const question = blocked
      ? 'Unblock this user?'
      : 'Block this user? They will not be able to message you.';

    if (!window.confirm(question)) return;

    try {
      setBusyAction(true);
      if (blocked) {
        await unblockUser(partnerId);
        await fetchBlockedUsers();
      } else {
        await blockUser(partnerId);
        await fetchBlockedUsers();
      }
      fetchConversations(true);
      setError('');
    } catch (err) {
      setError('Failed to update block status');
    } finally {
      setBusyAction(false);
    }
  };

  const handleUnblockFromList = async (userId) => {
    try {
      setBusyAction(true);
      await unblockUser(userId);
      await fetchBlockedUsers();
      if (selectedConversation?.partner_id && String(selectedConversation.partner_id) === String(userId)) {
        setError('');
      }
    } catch (err) {
      setError('Failed to unblock user');
    } finally {
      setBusyAction(false);
    }
  };

  const handleEndConversation = async () => {
    if (!selectedConversation?.partner_id) return;

    if (!window.confirm('End this conversation for both users? This cannot be undone.')) {
      return;
    }

    try {
      setBusyAction(true);
      await endConversation(
        selectedConversation.partner_id,
        selectedConversation.related_post_id || undefined
      );

      const removedId = selectedConversation.conversation_id;
      const nextConversations = conversations.filter((c) => c.conversation_id !== removedId);
      setConversations(nextConversations);
      setMessages([]);
      setSelectedConversationId(nextConversations[0]?.conversation_id || null);
      setError('');
    } catch (err) {
      setError('Failed to end conversation');
    } finally {
      setBusyAction(false);
    }
  };

  const selectedConversationType = selectedConversation?.related_post_type
    ? selectedConversation.related_post_type === 'lost'
      ? 'Lost Item'
      : 'Found Item'
    : 'General';
  const selectedConversationTitle = selectedConversation?.related_post_title;
  const isPartnerBlocked = selectedConversation
    ? blockedUserIds.includes(String(selectedConversation.partner_id))
    : false;

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
        <h1>Messages</h1>

        <div className={styles.messagesLayout}>
          <div className={styles.sidebar}>
            <h3>Conversations</h3>
            <div className={styles.blockedPanel}>
              <h4>Blocked Users</h4>
              {blockedUsers.length === 0 ? (
                <p className={styles.blockedEmpty}>No blocked users</p>
              ) : (
                <div className={styles.blockedList}>
                  {blockedUsers.map((user) => (
                    <div key={user.user_id} className={styles.blockedItem}>
                      <span className={styles.blockedEmail}>{user.email}</span>
                      <button
                        type="button"
                        className="btn"
                        onClick={() => handleUnblockFromList(user.user_id)}
                        disabled={busyAction}
                      >
                        Unblock
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
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
                    key={convo.conversation_id}
                    className={`${styles.conversationItem} ${
                      selectedConversationId === convo.conversation_id ? styles.active : ''
                    }`}
                    onClick={() => setSelectedConversationId(convo.conversation_id)}
                  >
                    <div className={styles.convoAvatar}>
                      {(convo.partner_email || '?')[0].toUpperCase()}
                    </div>
                    <div className={styles.convoInfo}>
                      <span className={styles.convoEmail}>{convo.partner_email}</span>
                      <span className={styles.convoType}>
                        {convo.related_post_type === 'lost'
                          ? 'Lost Item'
                          : convo.related_post_type === 'found'
                            ? 'Found Item'
                            : 'General'}
                      </span>
                      {convo.related_post_title && (
                        <span className={styles.convoItemTitle}>Item: {convo.related_post_title}</span>
                      )}
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

          <div className={styles.chatPanel}>
            {!selectedConversation?.partner_id ? (
              <div className={styles.chatEmpty}>
                <h3>Select a conversation</h3>
                <p>Choose a conversation from the sidebar or message someone from an item post.</p>
              </div>
            ) : (
              <>
                <div className={styles.chatHeader}>
                  <div>
                    <h3 className={styles.chatTitle}>{selectedConversation.partner_email}</h3>
                    <span className={styles.chatSubtitle}>Conversation type: {selectedConversationType}</span>
                    {selectedConversationTitle && (
                      <span className={styles.chatSubtitle}>Item: {selectedConversationTitle}</span>
                    )}
                  </div>
                  <div className={styles.chatActions}>
                    <button
                      type="button"
                      className="btn btnDanger"
                      onClick={handleEndConversation}
                      disabled={busyAction}
                    >
                      End Conversation
                    </button>
                    <button
                      type="button"
                      className="btn"
                      onClick={handleToggleBlock}
                      disabled={busyAction}
                    >
                      {isPartnerBlocked ? 'Unblock User' : 'Block User'}
                    </button>
                  </div>
                </div>

                <div className={styles.chatMessages} ref={chatMessagesRef}>
                  {loadingMessages ? (
                    <div className={styles.chatLoading}>Loading messages...</div>
                  ) : messages.length === 0 ? (
                    <div className={styles.chatEmpty}>
                      <p>No messages yet. Send the first one!</p>
                    </div>
                  ) : (
                    messages.map((msg, index) => (
                      <div
                        key={msg.message_id || index}
                        className={`${styles.message} ${
                          String(msg.sender_id) === String(currentUser.uid) ||
                          (msg.sender_email && msg.sender_email === currentUser.email)
                            ? styles.sent
                            : styles.received
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
                </div>

                <form onSubmit={handleSend} className={styles.chatInput}>
                  {isPartnerBlocked && (
                    <p className={styles.blockedNotice}>
                      This user is blocked. Unblock them to send messages.
                    </p>
                  )}
                  <input
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="Type a message..."
                    disabled={isPartnerBlocked}
                  />
                  <button type="submit" className="btn btnPrimary" disabled={!newMessage.trim() || isPartnerBlocked}>
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
    <Suspense
      fallback={
        <div className="pageContainer">
          <div className="loadingSpinner">
            <div className="spinner"></div>
            <p>Loading messages...</p>
          </div>
        </div>
      }
    >
      <MessagesContent />
    </Suspense>
  );
}
