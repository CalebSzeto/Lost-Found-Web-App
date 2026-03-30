const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
  },
  password_hash: {
    type: String,
    required: true,
  },
  displayName: {
    type: String,
    required: true,
    trim: true,
  },
  blocked_user_ids: {
    type: [String],
    default: [],
  },
  role: {
    type: String,
    enum: ['user', 'admin'],
    default: 'user',
    index: true,
  },
  account_status: {
    type: String,
    enum: ['active', 'restricted', 'banned'],
    default: 'active',
    index: true,
  },
  ban_reason: {
    type: String,
    default: null,
  },
  ban_expires_at: {
    type: String,
    default: null,
  },
  moderated_by_user_id: {
    type: String,
    default: null,
  },
  last_moderated_at: {
    type: String,
    default: null,
  },
  password_reset_required: {
    type: Boolean,
    default: false,
  },
  token_version: {
    type: Number,
    default: 0,
  },
  created_at: {
    type: String,
    default: () => new Date().toISOString(),
  },
});

module.exports = mongoose.models.User || mongoose.model('User', userSchema);
