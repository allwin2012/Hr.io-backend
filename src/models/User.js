// src/models/User.js
const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true
  },
  password: {
    type: String,
    required: true
  },
  role: {
    type: String,
    enum: ['Employee', 'Manager', 'HR', 'Admin', 'SuperAdmin'],
    default: 'Employee',
  },
  department: { type: String, default: '' },
  reportsTo: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  phone: { type: String, default: '' },
  location: { type: String, default: '' },
  status: { type: String, default: 'Active' },
  bio: { type: String, default: '' },
  avatar: { type: String, default: '' },
  
  reportsTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null,
  },

  managerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null,
  },
  reportsToId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  otp: {
    type: String,
    default: null
  },
  otpExpiry: {
    type: Date,
    default: null
  }
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);
