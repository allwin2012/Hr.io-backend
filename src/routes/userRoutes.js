const express = require('express');
const router = express.Router();
const requireAuth = require('../middleware/auth'); // JWT middleware
const User = require('../models/User');
const multer = require('multer');
const path = require('path');

// GET /api/users/me
router.get('/me', requireAuth, async (req, res) => {
  const user = req.user;

  res.json({
    name: user.name,
    email: user.email,
    phone: user.phone || '',
    department: user.department || '',
    role: user.role,
    location: user.location || '',
    joinDate: user.createdAt,
    status: user.status || 'Active',
    bio: user.bio || '',
    avatar: user.avatar || null,
  });
});

// PUT /api/users/me
router.put('/me', requireAuth, async (req, res) => {
    const userId = req.user._id;
    const {
      name, phone, location, status, bio, avatar,
      role, department // Optional, allow only HR/admin to change in production
    } = req.body;
  
    try {
      const updated = await User.findByIdAndUpdate(
        userId,
        { name, phone, location, status, bio, avatar, role, department },
        { new: true }
      );
  
      res.json({
        name: updated.name,
        email: updated.email,
        phone: updated.phone,
        location: updated.location,
        joinDate: updated.createdAt,
        status: updated.status,
        bio: updated.bio,
        avatar: updated.avatar,
        role: updated.role,
        department: updated.department,
      });
    } catch (err) {
      res.status(500).json({ message: 'Update failed', error: err.message });
    }
  });

  // GET /api/users/me/hierarchy
  //get the manager and team members
router.get('/me/hierarchy', requireAuth, async (req, res) => {
  const user = await User.findById(req.user._id).populate('reportsTo', 'name role avatar');
  const team = await User.find({ reportsTo: user._id }).select('name role avatar');

  res.json({
    manager: user.reportsTo || null,
    teamMembers: team,
  });
});
// PUT /api/users/:id/manager
const requireHR = require('../middleware/requireHR'); // you may need to create this
router.put('/:id/manager', requireAuth, requireHR, async (req, res) => {
  const { managerId } = req.body;

  const updated = await User.findByIdAndUpdate(
    req.params.id,
    { reportsTo: managerId },
    { new: true }
  ).populate('reportsTo', 'name role');

  res.json(updated);
});

//upload avatar
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/'); // save to backend/uploads
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const name = `${req.user._id}_avatar${ext}`;
    cb(null, name);
  }
});

const upload = multer({ storage });

router.post('/upload-avatar', requireAuth, upload.single('avatar'), async (req, res) => {
  try {
    const fileUrl = `/uploads/${req.file.filename}`;
    await User.findByIdAndUpdate(req.user._id, { avatar: fileUrl });
    res.json({ avatarUrl: fileUrl });
  } catch (err) {
    res.status(500).json({ message: 'Upload failed', error: err.message });
  }
});
  

module.exports = router;
