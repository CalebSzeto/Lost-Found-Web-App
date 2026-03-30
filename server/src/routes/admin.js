const express = require('express');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const LostItem = require('../models/LostItem');
const FoundItem = require('../models/FoundItem');
const Message = require('../models/Message');
const AuditLog = require('../models/AuditLog');
const { authenticate, requireAdmin } = require('../middleware/auth');

const router = express.Router();

router.use(authenticate, requireAdmin);

function requireReason(reason, res) {
  if (!reason || !String(reason).trim()) {
    res.status(400).json({ error: 'A moderation reason is required' });
    return false;
  }

  return true;
}

async function logAdminAction({ actorAdminId, action, targetType, targetId, reason, beforeState, afterState }) {
  await AuditLog.create({
    actor_admin_id: actorAdminId,
    action,
    target_type: targetType,
    target_id: targetId,
    reason: reason || null,
    before_state: beforeState || null,
    after_state: afterState || null,
    created_at: new Date().toISOString(),
  });
}

function toPublicUser(user) {
  return {
    user_id: user._id.toString(),
    email: user.email,
    displayName: user.displayName,
    role: user.role,
    account_status: user.account_status,
    password_reset_required: user.password_reset_required,
    ban_reason: user.ban_reason,
    ban_expires_at: user.ban_expires_at,
    created_at: user.created_at,
  };
}

router.get('/users', async (req, res) => {
  try {
    const users = await User.find().sort({ created_at: -1 }).lean();
    return res.json(users.map(toPublicUser));
  } catch (error) {
    console.error('Admin list users error:', error);
    return res.status(500).json({ error: 'Failed to list users' });
  }
});

router.get('/users/:id/history', async (req, res) => {
  try {
    const targetId = req.params.id;
    const logs = await AuditLog.find({ target_type: 'user', target_id: targetId }).sort({ created_at: -1 }).lean();
    return res.json(logs);
  } catch (error) {
    console.error('Admin user history error:', error);
    return res.status(500).json({ error: 'Failed to get user moderation history' });
  }
});

router.patch('/users/:id/status', async (req, res) => {
  try {
    const targetId = req.params.id;
    const { account_status, reason, ban_expires_at = null } = req.body;

    if (!['active', 'restricted', 'banned'].includes(account_status)) {
      return res.status(400).json({ error: 'Invalid account_status' });
    }

    if ((account_status === 'restricted' || account_status === 'banned') && !requireReason(reason, res)) {
      return;
    }

    const user = await User.findById(targetId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (user.role === 'admin') {
      return res.status(403).json({ error: 'Cannot moderate another admin account' });
    }

    const beforeState = {
      account_status: user.account_status,
      ban_reason: user.ban_reason,
      ban_expires_at: user.ban_expires_at,
    };

    user.account_status = account_status;
    user.ban_reason = account_status === 'active' ? null : String(reason || '').trim() || null;
    user.ban_expires_at = account_status === 'banned' ? ban_expires_at : null;
    user.moderated_by_user_id = req.user.uid;
    user.last_moderated_at = new Date().toISOString();
    user.token_version = (user.token_version || 0) + 1;
    await user.save();

    await logAdminAction({
      actorAdminId: req.user.uid,
      action: `set_user_status:${account_status}`,
      targetType: 'user',
      targetId: user._id.toString(),
      reason,
      beforeState,
      afterState: {
        account_status: user.account_status,
        ban_reason: user.ban_reason,
        ban_expires_at: user.ban_expires_at,
      },
    });

    return res.json({ message: 'User status updated', user: toPublicUser(user) });
  } catch (error) {
    console.error('Admin set user status error:', error);
    return res.status(500).json({ error: 'Failed to update user status' });
  }
});

router.post('/users/:id/force-logout', async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    if (user.role === 'admin') {
      return res.status(403).json({ error: 'Cannot force logout another admin account' });
    }

    const beforeState = { token_version: user.token_version || 0 };
    user.token_version = (user.token_version || 0) + 1;
    user.moderated_by_user_id = req.user.uid;
    user.last_moderated_at = new Date().toISOString();
    await user.save();

    await logAdminAction({
      actorAdminId: req.user.uid,
      action: 'force_logout_user',
      targetType: 'user',
      targetId: user._id.toString(),
      reason: req.body?.reason || null,
      beforeState,
      afterState: { token_version: user.token_version },
    });

    return res.json({ message: 'User session invalidated' });
  } catch (error) {
    console.error('Admin force logout error:', error);
    return res.status(500).json({ error: 'Failed to force logout user' });
  }
});

router.post('/users/:id/force-password-reset', async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    if (user.role === 'admin') {
      return res.status(403).json({ error: 'Cannot reset another admin password' });
    }

    const beforeState = {
      password_reset_required: user.password_reset_required,
      token_version: user.token_version || 0,
    };

    user.password_reset_required = true;
    user.token_version = (user.token_version || 0) + 1;
    user.moderated_by_user_id = req.user.uid;
    user.last_moderated_at = new Date().toISOString();
    await user.save();

    await logAdminAction({
      actorAdminId: req.user.uid,
      action: 'force_password_reset',
      targetType: 'user',
      targetId: user._id.toString(),
      reason: req.body?.reason || null,
      beforeState,
      afterState: {
        password_reset_required: user.password_reset_required,
        token_version: user.token_version,
      },
    });

    return res.json({ message: 'User must reset password at next login' });
  } catch (error) {
    console.error('Admin force password reset error:', error);
    return res.status(500).json({ error: 'Failed to set password reset requirement' });
  }
});

router.delete('/users/:id', async (req, res) => {
  try {
    const targetId = req.params.id;
    const { reason } = req.body || {};
    if (!requireReason(reason, res)) {
      return;
    }

    const user = await User.findById(targetId).lean();
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (user.role === 'admin') {
      return res.status(403).json({ error: 'Cannot delete another admin account' });
    }

    const [lostPosts, foundPosts] = await Promise.all([
      LostItem.find({ user_id: targetId }).select('lost_item_id').lean(),
      FoundItem.find({ user_id: targetId }).select('found_item_id').lean(),
    ]);

    const relatedPostIds = [
      ...lostPosts.map((p) => p.lost_item_id),
      ...foundPosts.map((p) => p.found_item_id),
    ];

    const deleteOps = [
      User.deleteOne({ _id: targetId }),
      LostItem.deleteMany({ user_id: targetId }),
      FoundItem.deleteMany({ user_id: targetId }),
      Message.deleteMany({
        $or: [
          { sender_id: targetId },
          { receiver_id: targetId },
          ...(relatedPostIds.length > 0 ? [{ related_post_id: { $in: relatedPostIds } }] : []),
        ],
      }),
      User.updateMany({}, { $pull: { blocked_user_ids: String(targetId) } }),
    ];

    await Promise.all(deleteOps);

    await logAdminAction({
      actorAdminId: req.user.uid,
      action: 'delete_user_hard',
      targetType: 'user',
      targetId,
      reason,
      beforeState: {
        email: user.email,
        role: user.role,
        account_status: user.account_status,
      },
      afterState: { deleted: true },
    });

    return res.json({ message: 'User and related data deleted' });
  } catch (error) {
    console.error('Admin delete user error:', error);
    return res.status(500).json({ error: 'Failed to delete user' });
  }
});

router.patch('/posts/lost/:id', async (req, res) => {
  try {
    const { action, reason, updates } = req.body;
    const item = await LostItem.findOne({ lost_item_id: req.params.id });

    if (!item) {
      return res.status(404).json({ error: 'Lost item not found' });
    }

    const beforeState = item.toObject();

    if (['hide', 'restore', 'hard_delete'].includes(action) && !requireReason(reason, res)) {
      return;
    }

    switch (action) {
      case 'hide':
        item.status = 'hidden';
        break;
      case 'restore':
        item.status = 'active';
        break;
      case 'resolve':
        item.status = 'resolved';
        break;
      case 'pin':
        item.is_pinned = true;
        break;
      case 'unpin':
        item.is_pinned = false;
        break;
      case 'edit':
        if (updates && typeof updates === 'object') {
          const editableFields = ['title', 'description', 'location', 'date_lost', 'status'];
          editableFields.forEach((field) => {
            if (updates[field] !== undefined) {
              item[field] = updates[field];
            }
          });
        }
        break;
      case 'hard_delete':
        await Message.deleteMany({ related_post_id: item.lost_item_id });
        await LostItem.deleteOne({ lost_item_id: item.lost_item_id });
        await logAdminAction({
          actorAdminId: req.user.uid,
          action: 'hard_delete_lost_post',
          targetType: 'lost_item',
          targetId: item.lost_item_id,
          reason,
          beforeState,
          afterState: { deleted: true },
        });
        return res.json({ message: 'Lost post deleted permanently' });
      default:
        return res.status(400).json({ error: 'Unsupported action' });
    }

    item.moderated_by_user_id = req.user.uid;
    item.moderation_reason = reason || null;
    item.moderation_action = action;
    item.moderated_at = new Date().toISOString();
    await item.save();

    await logAdminAction({
      actorAdminId: req.user.uid,
      action: `moderate_lost_post:${action}`,
      targetType: 'lost_item',
      targetId: item.lost_item_id,
      reason: reason || null,
      beforeState,
      afterState: item.toObject(),
    });

    return res.json({ message: 'Lost post updated', item });
  } catch (error) {
    console.error('Admin moderate lost post error:', error);
    return res.status(500).json({ error: 'Failed to moderate lost post' });
  }
});

router.patch('/posts/found/:id', async (req, res) => {
  try {
    const { action, reason, updates } = req.body;
    const item = await FoundItem.findOne({ found_item_id: req.params.id });

    if (!item) {
      return res.status(404).json({ error: 'Found item not found' });
    }

    const beforeState = item.toObject();

    if (['hide', 'restore', 'hard_delete'].includes(action) && !requireReason(reason, res)) {
      return;
    }

    switch (action) {
      case 'hide':
        item.status = 'hidden';
        break;
      case 'restore':
        item.status = 'active';
        break;
      case 'resolve':
        item.status = 'resolved';
        break;
      case 'pin':
        item.is_pinned = true;
        break;
      case 'unpin':
        item.is_pinned = false;
        break;
      case 'edit':
        if (updates && typeof updates === 'object') {
          const editableFields = ['title', 'description', 'location', 'date_found', 'dropoff_time', 'status'];
          editableFields.forEach((field) => {
            if (updates[field] !== undefined) {
              item[field] = updates[field];
            }
          });
        }
        break;
      case 'hard_delete':
        await Message.deleteMany({ related_post_id: item.found_item_id });
        await FoundItem.deleteOne({ found_item_id: item.found_item_id });
        await logAdminAction({
          actorAdminId: req.user.uid,
          action: 'hard_delete_found_post',
          targetType: 'found_item',
          targetId: item.found_item_id,
          reason,
          beforeState,
          afterState: { deleted: true },
        });
        return res.json({ message: 'Found post deleted permanently' });
      default:
        return res.status(400).json({ error: 'Unsupported action' });
    }

    item.moderated_by_user_id = req.user.uid;
    item.moderation_reason = reason || null;
    item.moderation_action = action;
    item.moderated_at = new Date().toISOString();
    await item.save();

    await logAdminAction({
      actorAdminId: req.user.uid,
      action: `moderate_found_post:${action}`,
      targetType: 'found_item',
      targetId: item.found_item_id,
      reason: reason || null,
      beforeState,
      afterState: item.toObject(),
    });

    return res.json({ message: 'Found post updated', item });
  } catch (error) {
    console.error('Admin moderate found post error:', error);
    return res.status(500).json({ error: 'Failed to moderate found post' });
  }
});

router.get('/posts/:type/:id/history', async (req, res) => {
  try {
    const { type, id } = req.params;
    const mappedType = type === 'lost' ? 'lost_item' : type === 'found' ? 'found_item' : null;
    if (!mappedType) {
      return res.status(400).json({ error: 'Invalid post type' });
    }

    const logs = await AuditLog.find({ target_type: mappedType, target_id: id }).sort({ created_at: -1 }).lean();
    return res.json(logs);
  } catch (error) {
    console.error('Admin post history error:', error);
    return res.status(500).json({ error: 'Failed to fetch post moderation history' });
  }
});

router.get('/messages', async (req, res) => {
  try {
    const { participant_id, keyword, limit = 100 } = req.query;
    const query = {};

    if (participant_id) {
      query.$or = [{ sender_id: participant_id }, { receiver_id: participant_id }];
    }

    if (keyword) {
      query.message_text = { $regex: String(keyword), $options: 'i' };
    }

    const normalizedLimit = Math.min(Math.max(parseInt(limit, 10) || 100, 1), 500);
    const messages = await Message.find(query).sort({ timestamp: -1 }).limit(normalizedLimit).lean();

    return res.json(messages);
  } catch (error) {
    console.error('Admin list messages error:', error);
    return res.status(500).json({ error: 'Failed to list messages' });
  }
});

router.delete('/messages/:messageId', async (req, res) => {
  try {
    const { reason } = req.body || {};
    if (!requireReason(reason, res)) {
      return;
    }

    const message = await Message.findOne({ message_id: req.params.messageId }).lean();
    if (!message) {
      return res.status(404).json({ error: 'Message not found' });
    }

    await Message.deleteOne({ message_id: message.message_id });
    await logAdminAction({
      actorAdminId: req.user.uid,
      action: 'delete_message',
      targetType: 'message',
      targetId: message.message_id,
      reason,
      beforeState: message,
      afterState: { deleted: true },
    });

    return res.json({ message: 'Message deleted' });
  } catch (error) {
    console.error('Admin delete message error:', error);
    return res.status(500).json({ error: 'Failed to delete message' });
  }
});

router.get('/audit-logs', async (req, res) => {
  try {
    const { action, target_type, target_id, limit = 200 } = req.query;
    const query = {};
    if (action) query.action = action;
    if (target_type) query.target_type = target_type;
    if (target_id) query.target_id = target_id;

    const normalizedLimit = Math.min(Math.max(parseInt(limit, 10) || 200, 1), 1000);
    const logs = await AuditLog.find(query).sort({ created_at: -1 }).limit(normalizedLimit).lean();
    return res.json(logs);
  } catch (error) {
    console.error('Admin list audit logs error:', error);
    return res.status(500).json({ error: 'Failed to list audit logs' });
  }
});

module.exports = router;
