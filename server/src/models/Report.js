const mongoose = require('mongoose');

const reportSchema = new mongoose.Schema({
  report_id: {
    type: String,
    required: true,
    unique: true,
    index: true,
  },
  reporter_id: {
    type: String,
    required: true,
    index: true,
  },
  reporter_email: {
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
  category: {
    type: String,
    enum: ['inappropriate_post', 'harassment', 'scam', 'spam', 'other'],
    required: true,
  },
  related_post_id: {
    type: String,
    default: null,
  },
  related_user_id: {
    type: String,
    default: null,
  },
  status: {
    type: String,
    enum: ['open', 'in-progress', 'resolved', 'dismissed'],
    default: 'open',
    index: true,
  },
  assigned_admin_id: {
    type: String,
    default: null,
    index: true,
  },
  admin_notes: {
    type: String,
    default: null,
  },
  last_response_at: {
    type: String,
    default: null,
  },
  last_response_by: {
    type: String,
    default: null,
  },
  last_response_text: {
    type: String,
    default: null,
  },
  created_at: {
    type: String,
    default: () => new Date().toISOString(),
    index: true,
  },
  updated_at: {
    type: String,
    default: () => new Date().toISOString(),
  },
  resolved_at: {
    type: String,
    default: null,
  },
});

module.exports = mongoose.models.Report || mongoose.model('Report', reportSchema);
