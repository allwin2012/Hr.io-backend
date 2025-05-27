const User = require('../models/User');
const generateOTP = require('../utils/generateOTP');

async function createAndSaveOTP(email) {
  const otp = generateOTP();
  const otpExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes from now

  await User.findOneAndUpdate({ email }, { otp, otpExpiry });
  return otp;
}

async function verifyOTP(email, otp) {
  const user = await User.findOne({ email });
  if (!user || user.otp !== otp || user.otpExpiry < new Date()) {
    return false;
  }
  // Invalidate OTP after successful verification
  user.otp = null;
  user.otpExpiry = null;
  await user.save();
  return true;
}

module.exports = { createAndSaveOTP, verifyOTP };
