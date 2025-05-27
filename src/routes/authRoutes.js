const express = require('express');
const router = express.Router();
const { registerUser, loginUser } = require('../controllers/authController');
const authController = require('../controllers/authController');
    

router.post('/register', registerUser);
router.post('/login', loginUser);

//forgot password
router.post('/forgot-password', authController.forgotPassword);
router.post('/verify-otp', authController.verifyOTP);
router.post('/reset-password', authController.resetPassword);

module.exports = router;
