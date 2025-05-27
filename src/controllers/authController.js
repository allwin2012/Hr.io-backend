const User = require('../models/User'); // Your Mongoose model
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const EmailTemplate = require('../models/EmailTemplate');
const { sendEmail } = require('../services/emailService');
const { createAndSaveOTP, verifyOTP } = require('../services/otpService');

const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret';

exports.registerUser = async (req, res) => {
  const { name, email, password } = req.body; // ✅ Include name
  try {
    const existing = await User.findOne({ email });
    if (existing) return res.status(400).json({ message: 'User already exists' });

    const hashedPassword = await bcrypt.hash(password, 10);

    // ✅ Save name to DB
    const newUser = await User.create({ name, email, password: hashedPassword });

    const token = jwt.sign({ id: newUser._id }, JWT_SECRET, { expiresIn: '1d' });

    res.status(201).json({ token, user: { name: newUser.name, email: newUser.email } }); // ✅ Return name
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.loginUser = async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ message: 'User not found' });

    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.status(400).json({ message: 'Incorrect password' });

    const token = jwt.sign({ id: user._id }, JWT_SECRET, { expiresIn: '1d' });

    res.status(200).json({ token, user: { name: user.name, email: user.email } }); // ✅ Include name in login too
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

//forgot password
exports.forgotPassword = async (req, res) => {
  const { email } = req.body;
  const user = await User.findOne({ email });
  if (!user) return res.status(404).json({ message: 'User not found' });

  const otp = await createAndSaveOTP(email);
  const template = await EmailTemplate.findOne({ name: 'forgot_password' });
  if (!template) return res.status(500).json({ message: 'Email template not found' });

  const subject = template.subject;
  const body = template.body.replace('{{name}}', user.name).replace('{{OTP}}', otp);

  await sendEmail(email, subject, body);
  res.json({ message: 'OTP sent to email' });
};

exports.verifyOTP = async (req, res) => {
  const { email, otp } = req.body;
  const isValid = await verifyOTP(email, otp);
  if (!isValid) return res.status(400).json({ message: 'Invalid or expired OTP' });

  res.json({ message: 'OTP verified' });
};

exports.resetPassword = async (req, res) => {
  const { email, newPassword } = req.body;
  const hashedPassword = await bcrypt.hash(newPassword, 10);
  await User.findOneAndUpdate({ email }, { password: hashedPassword });
  res.json({ message: 'Password reset successful' });
};
