const express = require('express');
const router = express.Router();
const requireAuth = require('../middleware/auth');
const LeaveRequest = require('../models/LeaveRequest');
const User = require('../models/User');

// Apply leave
router.post('/request', requireAuth, async (req, res) => {
  const { type, startDate, endDate, reason } = req.body;
  const userId = req.user._id;

  console.log('POST /request hit', req.body);

  // Basic validation
  if (!type || !startDate || !endDate || !reason) {
    return res.status(400).json({ error: 'All fields are required.' });
  }

  // Create leave
  const leave = new LeaveRequest({
    employee: req.user._id, 
    type,
    startDate,
    endDate,
    reason,
    status: 'Pending',
  });

  await leave.save();
  res.status(201).json({ message: 'Leave request submitted.' });
});


// leaveRoutes.js
router.get('/my-requests', requireAuth, async (req, res) => {
  try {
    const userId = req.user._id;

    const leaves = await LeaveRequest.find({ employee: userId })
      .sort({ createdAt: -1 }); // latest first

    res.json(leaves);
  } catch (err) {
    console.error('Error fetching leave requests:', err);
    res.status(500).json({ error: 'Failed to fetch leave requests' });
  }
});
module.exports = router;
