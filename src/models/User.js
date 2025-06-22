const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true },
  password: { type: String, required: true },
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
  leave: {
    sick: { type: Number, default: 10 },
    casual: { type: Number, default: 10 },
    earned: { type: Number, default: 5 },
    lop: { type: Number, default: 0 }
  },
  leaveBalances: {
    type: Map,
    of: {
      used: { type: Number, default: 0 },
      total: { type: Number, default: 0 }
    },
    default: () => ({
      'Casual Leave': { used: 0, total: 12 },
      'Sick Leave': { used: 0, total: 10 },
      'Earned Leave': { used: 0, total: 15 }
    })
  },
  otp: { type: String, default: null },
  otpExpiry: { type: Date, default: null }
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);
