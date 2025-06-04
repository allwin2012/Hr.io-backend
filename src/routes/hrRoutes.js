// routes/hrRoutes.js
const express = require('express');
const router = express.Router();
const requireAuth = require('../middleware/auth'); // ✅ now this path is valid
const requireHR = require('../middleware/requireHR');
const User = require('../models/User');

// All routes are protected and HR-only
router.use(requireAuth, requireHR);

// Get all employees
router.get('/employees', async (req, res) => {
  const users = await User.find({ role: { $ne: 'SuperAdmin' } });
  res.json(users);
});

// Update role/department
router.put('/employees/:id', async (req, res) => {
  const { role, department } = req.body;
  const updated = await User.findByIdAndUpdate(
    req.params.id,
    { role, department },
    { new: true }
  );
  res.json(updated);
});

// Example HR route
router.get('/', (req, res) => {
  res.send('HR route works!');
});

module.exports = router;
