const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  message_id: {
    type: String,
    required: true,
    unique: true,
    index: true,
  },
  sender_id: {
    type: String,
    required: true,
    index: true,
  },
  sender_email: {
    type: String,
    required: true,
  },
  receiver_id: {
    type: String,
    required: true,
    index: true,
  },
  related_post_id: {
    type: String,
    default: null,
  },
  message_text: {
    type: String,
    required: true,
  },
  read: {
    type: Boolean,
    default: false,
  },
  timestamp: {
    type: String,
    default: () => new Date().toISOString(),
    index: true,
  },
});

module.exports = mongoose.models.Message || mongoose.model('Message', messageSchema);
