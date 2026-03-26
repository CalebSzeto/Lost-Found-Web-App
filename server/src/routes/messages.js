const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const Message = require('../models/Message');
const User = require('../models/User');
const LostItem = require('../models/LostItem');
const FoundItem = require('../models/FoundItem');
const authenticate = require('../middleware/auth');

async function getBlockContext(uid) {
  const [currentUser, blockedByUsers] = await Promise.all([
    User.findById(uid).select('blocked_user_ids').lean(),
    User.find({ blocked_user_ids: uid }).select('_id').lean(),
  ]);

  const blockedByIds = new Set(blockedByUsers.map((u) => u._id.toString()));
  return {
    blockedByIds,
    myBlockedIds: new Set((currentUser?.blocked_user_ids || []).map(String)),
  };
}

// POST /api/messages - Send a message
router.post('/', authenticate, async (req, res) => {
  try {
    const { receiver_id, related_post_id, message_text } = req.body;

    if (!receiver_id || !message_text) {
      return res.status(400).json({ error: 'Receiver ID and message text are required' });
    }

    if (receiver_id === req.user.uid) {
      return res.status(400).json({ error: 'Cannot send a message to yourself' });
    }

    const [senderUser, receiverUser] = await Promise.all([
      User.findById(req.user.uid).select('blocked_user_ids').lean(),
      User.findById(receiver_id).select('blocked_user_ids').lean(),
    ]);

    if (!receiverUser) {
      return res.status(404).json({ error: 'Receiver not found' });
    }

    const senderBlocked = new Set((senderUser?.blocked_user_ids || []).map(String));
    const receiverBlocked = new Set((receiverUser?.blocked_user_ids || []).map(String));

    if (senderBlocked.has(String(receiver_id))) {
      return res.status(403).json({ error: 'You blocked this user. Unblock to send messages.' });
    }

    if (receiverBlocked.has(String(req.user.uid))) {
      return res.status(403).json({ error: 'You cannot message this user.' });
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

    const { blockedByIds, myBlockedIds } = await getBlockContext(uid);

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
      ? await LostItem.find({ lost_item_id: { $in: relatedPostIds } }).select('lost_item_id title').lean()
      : [];

    const foundItems = relatedPostIds.length > 0
      ? await FoundItem.find({ found_item_id: { $in: relatedPostIds } }).select('found_item_id title').lean()
      : [];

    const lostPostMap = lostItems.reduce((acc, item) => {
      acc[item.lost_item_id] = item.title || 'Lost item';
      return acc;
    }, {});
    const foundPostMap = foundItems.reduce((acc, item) => {
      acc[item.found_item_id] = item.title || 'Found item';
      return acc;
    }, {});

    // Group by conversation partner
    const conversations = {};
    allMessages.forEach((msg) => {
      const partnerId = msg.sender_id === uid ? msg.receiver_id : msg.sender_id;
      if (myBlockedIds.has(String(partnerId)) || blockedByIds.has(String(partnerId))) {
        return;
      }

      const postId = msg.related_post_id || null;
      const key = `${partnerId}_${postId || 'general'}`;

      let relatedPostType = null;
      let relatedPostTitle = null;
      if (postId) {
        if (lostPostMap[postId]) {
          relatedPostType = 'lost';
          relatedPostTitle = lostPostMap[postId];
        }
        if (foundPostMap[postId]) {
          relatedPostType = 'found';
          relatedPostTitle = foundPostMap[postId];
        }
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
          related_post_title: relatedPostTitle,
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
        related_post_title: convo.related_post_title,
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

// POST /api/messages/block/:userId - Block a user
router.post('/block/:userId', authenticate, async (req, res) => {
  try {
    const uid = req.user.uid;
    const targetUserId = req.params.userId;

    if (!targetUserId || targetUserId === uid) {
      return res.status(400).json({ error: 'Invalid user to block' });
    }

    const targetUser = await User.findById(targetUserId).select('_id').lean();
    if (!targetUser) {
      return res.status(404).json({ error: 'User not found' });
    }

    await User.updateOne({ _id: uid }, { $addToSet: { blocked_user_ids: String(targetUserId) } });
    res.json({ message: 'User blocked successfully' });
  } catch (error) {
    console.error('Block user error:', error);
    res.status(500).json({ error: 'Failed to block user' });
  }
});

// DELETE /api/messages/block/:userId - Unblock a user
router.delete('/block/:userId', authenticate, async (req, res) => {
  try {
    const uid = req.user.uid;
    const targetUserId = req.params.userId;

    await User.updateOne({ _id: uid }, { $pull: { blocked_user_ids: String(targetUserId) } });
    res.json({ message: 'User unblocked successfully' });
  } catch (error) {
    console.error('Unblock user error:', error);
    res.status(500).json({ error: 'Failed to unblock user' });
  }
});

// GET /api/messages/blocked - List users blocked by current user
router.get('/blocked', authenticate, async (req, res) => {
  try {
    const user = await User.findById(req.user.uid).select('blocked_user_ids').lean();
    const blockedIds = (user?.blocked_user_ids || []).map(String);

    if (blockedIds.length === 0) {
      return res.json([]);
    }

    const blockedUsers = await User.find({ _id: { $in: blockedIds } }).select('_id email').lean();
    const response = blockedUsers.map((u) => ({
      user_id: u._id.toString(),
      email: u.email,
    }));

    res.json(response);
  } catch (error) {
    console.error('Get blocked users error:', error);
    res.status(500).json({ error: 'Failed to get blocked users' });
  }
});

// DELETE /api/messages/conversation/:partnerId - End a conversation for both users
router.delete('/conversation/:partnerId', authenticate, async (req, res) => {
  try {
    const uid = req.user.uid;
    const partnerId = req.params.partnerId;
    const { post_id } = req.query;

    const conversationQuery = {
      $or: [
        { sender_id: uid, receiver_id: partnerId },
        { sender_id: partnerId, receiver_id: uid },
      ],
    };

    if (post_id) {
      conversationQuery.related_post_id = post_id;
    } else {
      conversationQuery.$or = [
        { sender_id: uid, receiver_id: partnerId, related_post_id: null },
        { sender_id: partnerId, receiver_id: uid, related_post_id: null },
      ];
    }

    const result = await Message.deleteMany(conversationQuery);
    res.json({
      message: 'Conversation ended',
      deleted_count: result.deletedCount || 0,
    });
  } catch (error) {
    console.error('End conversation error:', error);
    res.status(500).json({ error: 'Failed to end conversation' });
  }
});

// GET /api/messages/:partnerId - Get messages with a specific user
router.get('/:partnerId', authenticate, async (req, res) => {
  try {
    const uid = req.user.uid;
    const partnerId = req.params.partnerId;
    const { post_id } = req.query;

    const { blockedByIds, myBlockedIds } = await getBlockContext(uid);
    if (myBlockedIds.has(String(partnerId)) || blockedByIds.has(String(partnerId))) {
      return res.status(403).json({ error: 'Cannot view messages with this user' });
    }

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
