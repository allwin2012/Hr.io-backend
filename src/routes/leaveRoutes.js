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

//review leave
router.get('/requests-to-review', requireAuth, async (req, res) => {
  const userId = req.user._id;
  // Find users reporting to this manager
  const reportees = await User.find({ reportsTo: userId }).select('_id');
  const reporteeIds = reportees.map(user => user._id);
  // Find their leave requests
  const leaves = await LeaveRequest.find({ employee: { $in: reporteeIds } })
    .populate('employee', 'name email avatar role');

  res.json(leaves);
});


//update leave status
// PUT /update-status/:id
router.put('/update-status/:id', requireAuth, async (req, res) => {
  const { status, comment } = req.body;

  if (!['Approved', 'Rejected'].includes(status)) {
    return res.status(400).json({ error: 'Invalid status' });
  }

  const leave = await LeaveRequest.findById(req.params.id);
  if (!leave) return res.status(404).json({ error: 'Leave not found' });

  leave.status = status;
  if (comment && status === 'Rejected') {
    leave.comment = comment;
  }

  await leave.save();

  // If approved, update user's leave balance
  if (status === 'Approved') {
    const user = await User.findById(leave.employee);
    if (!user) return res.status(404).json({ error: 'Employee not found' });

    console.log('User found:', user.name);
    console.log('Leave found:', leave);

    const leaveType = leave.type;
    const start = new Date(leave.startDate);
    const end = new Date(leave.endDate);
    const days = Math.ceil((end - start) / (1000 * 60 * 60 * 24)) + 1;

    // ✅ Handle Map format (if leaveBalances is a Map)
    if (user.leaveBalances instanceof Map) {
      const balance = user.leaveBalances.get(leaveType) || { used: 0, total: 0 };
      balance.used += days;
      user.leaveBalances.set(leaveType, balance);
    } else {
      // ✅ Handle plain object format
      if (!user.leaveBalances) user.leaveBalances = {};
      if (!user.leaveBalances[leaveType]) {
        user.leaveBalances[leaveType] = { used: 0, total: 0 };
      }
      user.leaveBalances[leaveType].used += days;
      user.markModified('leaveBalances');
    }

    await user.save();
    console.log('✅ Leave balance updated for:', user.name);
  }

  res.json({ message: 'Status updated and balance applied', leave });
});


// GET leave balances
router.get('/balances', requireAuth, async (req, res) => {
  const user = await User.findById(req.user._id);
  if (!user) return res.status(404).json({ error: 'User not found' });

  const leaveBalances = user.leaveBalances instanceof Map
    ? Object.fromEntries(user.leaveBalances)
    : user.leaveBalances || {};

  const colorMap = {
    'Casual Leave': 'green',
    'Sick Leave': 'blue',
    'Earned Leave': 'purple',
  };

  const formatted = Object.entries(leaveBalances).map(([type, values]) => ({
    type,
    used: values.used || 0,
    total: values.total || 0,
    color: colorMap[type] || 'gray',
  }));

  res.json(formatted);
});


module.exports = router;
