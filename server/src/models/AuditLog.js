const mongoose = require('mongoose');

const auditLogSchema = new mongoose.Schema({
  actor_admin_id: {
    type: String,
    required: true,
    index: true,
  },
  action: {
    type: String,
    required: true,
    index: true,
  },
  target_type: {
    type: String,
    enum: ['user', 'lost_item', 'found_item', 'message'],
    required: true,
    index: true,
  },
  target_id: {
    type: String,
    required: true,
    index: true,
  },
  reason: {
    type: String,
    default: null,
  },
  before_state: {
    type: mongoose.Schema.Types.Mixed,
    default: null,
  },
  after_state: {
    type: mongoose.Schema.Types.Mixed,
    default: null,
  },
  created_at: {
    type: String,
    default: () => new Date().toISOString(),
    index: true,
  },
});

module.exports = mongoose.models.AuditLog || mongoose.model('AuditLog', auditLogSchema);
