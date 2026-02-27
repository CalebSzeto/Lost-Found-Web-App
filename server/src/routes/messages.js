const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const { db } = require('../config/firebase');
const authenticate = require('../middleware/auth');

// POST /api/messages - Send a message
router.post('/', authenticate, async (req, res) => {
  try {
    const { receiver_id, related_post_id, message_text } = req.body;

    if (!receiver_id || !message_text) {
      return res.status(400).json({ error: 'Receiver ID and message text are required' });
    }

    const message_id = uuidv4();
    const message = {
      message_id,
      sender_id: req.user.uid,
      sender_email: req.user.email,
      receiver_id,
      related_post_id: related_post_id || null,
      message_text,
      read: false,
      timestamp: new Date().toISOString(),
    };

    await db.collection('messages').doc(message_id).set(message);
    res.status(201).json({ message: 'Message sent', data: message });
  } catch (error) {
    console.error('Send message error:', error);
    res.status(500).json({ error: 'Failed to send message' });
  }
});

// GET /api/messages/conversations - Get all conversations for current user
router.get('/conversations', authenticate, async (req, res) => {
  try {
    const uid = req.user.uid;

    // Get messages where user is sender or receiver
    const sentSnapshot = await db.collection('messages')
      .where('sender_id', '==', uid)
      .orderBy('timestamp', 'desc')
      .get();

    const receivedSnapshot = await db.collection('messages')
      .where('receiver_id', '==', uid)
      .orderBy('timestamp', 'desc')
      .get();

    const allMessages = [];
    sentSnapshot.forEach((doc) => allMessages.push(doc.data()));
    receivedSnapshot.forEach((doc) => allMessages.push(doc.data()));

    // Group by conversation partner
    const conversations = {};
    allMessages.forEach((msg) => {
      const partnerId = msg.sender_id === uid ? msg.receiver_id : msg.sender_id;
      const key = `${partnerId}_${msg.related_post_id || 'general'}`;
      if (!conversations[key] || new Date(msg.timestamp) > new Date(conversations[key].lastMessage.timestamp)) {
        conversations[key] = {
          partnerId,
          partnerEmail: msg.sender_id === uid ? msg.receiver_id : msg.sender_email,
          related_post_id: msg.related_post_id,
          lastMessage: msg,
          unread: msg.receiver_id === uid && !msg.read ? 1 : 0,
        };
      }
    });

    res.json(Object.values(conversations));
  } catch (error) {
    console.error('Get conversations error:', error);
    res.status(500).json({ error: 'Failed to get conversations' });
  }
});

// GET /api/messages/:partnerId - Get messages with a specific user
router.get('/:partnerId', authenticate, async (req, res) => {
  try {
    const uid = req.user.uid;
    const partnerId = req.params.partnerId;
    const { post_id } = req.query;

    // Get messages between the two users
    const sentSnapshot = await db.collection('messages')
      .where('sender_id', '==', uid)
      .where('receiver_id', '==', partnerId)
      .orderBy('timestamp', 'asc')
      .get();

    const receivedSnapshot = await db.collection('messages')
      .where('sender_id', '==', partnerId)
      .where('receiver_id', '==', uid)
      .orderBy('timestamp', 'asc')
      .get();

    let messages = [];
    sentSnapshot.forEach((doc) => messages.push(doc.data()));
    receivedSnapshot.forEach((doc) => messages.push(doc.data()));

    // Filter by post_id if provided
    if (post_id) {
      messages = messages.filter((msg) => msg.related_post_id === post_id);
    }

    // Sort by timestamp
    messages.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));

    // Mark received messages as read
    receivedSnapshot.forEach((doc) => {
      if (!doc.data().read) {
        db.collection('messages').doc(doc.id).update({ read: true });
      }
    });

    res.json(messages);
  } catch (error) {
    console.error('Get messages error:', error);
    res.status(500).json({ error: 'Failed to get messages' });
  }
});

module.exports = router;
