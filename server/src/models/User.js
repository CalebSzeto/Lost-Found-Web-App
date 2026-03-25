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
  created_at: {
    type: String,
    default: () => new Date().toISOString(),
  },
});

module.exports = mongoose.models.User || mongoose.model('User', userSchema);
