const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const Message = require('../models/Message');
const User = require('../models/User');
const LostItem = require('../models/LostItem');
const FoundItem = require('../models/FoundItem');
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

    await Message.create(message);
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

    const allMessages = await Message.find({
      $or: [{ sender_id: uid }, { receiver_id: uid }],
    }).sort({ timestamp: -1 }).lean();

    const relatedPostIds = [...new Set(
      allMessages
        .map((msg) => msg.related_post_id)
        .filter(Boolean)
    )];

    const users = await User.find().select('_id email').lean();
    const userEmailById = users.reduce((acc, user) => {
      acc[user._id.toString()] = user.email;
      return acc;
    }, {});

    const lostItems = relatedPostIds.length > 0
      ? await LostItem.find({ lost_item_id: { $in: relatedPostIds } }).select('lost_item_id').lean()
      : [];

    const foundItems = relatedPostIds.length > 0
      ? await FoundItem.find({ found_item_id: { $in: relatedPostIds } }).select('found_item_id').lean()
      : [];

    const lostPostIds = new Set(lostItems.map((item) => item.lost_item_id));
    const foundPostIds = new Set(foundItems.map((item) => item.found_item_id));

    // Group by conversation partner
    const conversations = {};
    allMessages.forEach((msg) => {
      const partnerId = msg.sender_id === uid ? msg.receiver_id : msg.sender_id;
      const postId = msg.related_post_id || null;
      const key = `${partnerId}_${postId || 'general'}`;

      let relatedPostType = null;
      if (postId) {
        if (lostPostIds.has(postId)) relatedPostType = 'lost';
        if (foundPostIds.has(postId)) relatedPostType = 'found';
      }

      const partnerEmail =
        userEmailById[partnerId] ||
        (msg.sender_id === uid ? null : msg.sender_email) ||
        partnerId;

      if (!conversations[key] || new Date(msg.timestamp) > new Date(conversations[key].lastMessage.timestamp)) {
        conversations[key] = {
          conversation_id: key,
          partner_id: partnerId,
          partner_email: partnerEmail,
          related_post_id: postId,
          related_post_type: relatedPostType,
          lastMessage: msg,
          unread: 0,
        };
      }

      if (msg.receiver_id === uid && !msg.read) {
        conversations[key].unread += 1;
      }
    });

    res.json(
      Object.values(conversations).map((convo) => ({
        conversation_id: convo.conversation_id,
        partner_id: convo.partner_id,
        partner_email: convo.partner_email,
        related_post_id: convo.related_post_id,
        related_post_type: convo.related_post_type,
        last_message: convo.lastMessage?.message_text || '',
        last_message_at: convo.lastMessage?.timestamp || null,
        unread: convo.unread,
      }))
    );
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

    let messages = await Message.find({
      $or: [
        { sender_id: uid, receiver_id: partnerId },
        { sender_id: partnerId, receiver_id: uid },
      ],
    }).lean();

    // Filter by post_id if provided
    if (post_id) {
      messages = messages.filter((msg) => msg.related_post_id === post_id);
    }

    // Sort by timestamp
    messages.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));

    // Mark received messages as read
    await Message.updateMany(
      { sender_id: partnerId, receiver_id: uid, read: false },
      { $set: { read: true } }
    );

    res.json(messages);
  } catch (error) {
    console.error('Get messages error:', error);
    res.status(500).json({ error: 'Failed to get messages' });
  }
});

module.exports = router;
