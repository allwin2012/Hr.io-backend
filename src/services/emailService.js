const nodemailer = require('nodemailer');
const EmailQueue = require('../models/EmailQueue');

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

async function sendEmail(to, subject, body) {
  const mailOptions = {
    from: process.env.EMAIL_USER,
    to,
    subject,
    html: body,
  };

  try {
    await transporter.sendMail(mailOptions);
    await EmailQueue.create({ to, subject, body, status: 'sent' });
  } catch (error) {
    await EmailQueue.create({ to, subject, body, status: 'failed' });
    console.error('Email sending failed:', error);
  }
}

module.exports = { sendEmail };
