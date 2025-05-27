const mongoose = require('mongoose');

const emailTemplateSchema = new mongoose.Schema({
  name: { type: String, unique: true },
  subject: String,
  body: String, // Use placeholders like {{OTP}}, {{name}}, etc.
});

module.exports = mongoose.model('EmailTemplate', emailTemplateSchema);
