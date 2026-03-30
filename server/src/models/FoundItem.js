const mongoose = require('mongoose');

const foundItemSchema = new mongoose.Schema({
  found_item_id: {
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
    default: 'Found item',
  },
  description: {
    type: String,
    required: true,
  },
  location: {
    type: String,
    required: true,
  },
  date_found: {
    type: String,
    default: () => new Date().toISOString().split('T')[0],
  },
  image_url: {
    type: String,
    default: null,
  },
  dropoff_time: {
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

module.exports = mongoose.models.FoundItem || mongoose.model('FoundItem', foundItemSchema);
