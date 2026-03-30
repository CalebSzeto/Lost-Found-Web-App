const mongoose = require('mongoose');

const lostItemSchema = new mongoose.Schema({
  lost_item_id: {
    type: String,
    required: true,
    unique: true,
    index: true,
  },
  user_id: {
    type: String,
    required: true,
    index: true,
  },
  user_email: {
    type: String,
    required: true,
  },
  title: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    required: true,
  },
  location: {
    type: String,
    required: true,
  },
  date_lost: {
    type: String,
    required: true,
  },
  image_url: {
    type: String,
    default: null,
  },
  status: {
    type: String,
    default: 'active',
    index: true,
  },
  is_pinned: {
    type: Boolean,
    default: false,
    index: true,
  },
  moderated_by_user_id: {
    type: String,
    default: null,
  },
  moderation_reason: {
    type: String,
    default: null,
  },
  moderation_action: {
    type: String,
    default: null,
  },
  moderated_at: {
    type: String,
    default: null,
  },
  created_at: {
    type: String,
    default: () => new Date().toISOString(),
    index: true,
  },
});

module.exports = mongoose.models.LostItem || mongoose.model('LostItem', lostItemSchema);
