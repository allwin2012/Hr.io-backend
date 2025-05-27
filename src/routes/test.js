const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');

router.get('/', (req, res) => {
  const isConnected = mongoose.connection.readyState === 1;
  res.status(200).json({
    success: true,
    message: 'API is working',
    db: isConnected ? 'Connected' : 'Not Connected'
  });
});

module.exports = router;
