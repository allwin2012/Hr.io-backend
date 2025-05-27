const mongoose = require('mongoose');

const emailQueueSchema = new mongoose.Schema({
  to: String,
  subject: String,
  body: String,
  status: { type: String, enum: ['pending', 'sent', 'failed'], default: 'pending' },
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('EmailQueue', emailQueueSchema);
