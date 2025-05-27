const express = require('express');
const router = express.Router();

const authRoutes = require('./authRoutes');
const testRoutes = require('./test'); // optional

router.use('/auth', authRoutes);     // All auth routes under /api/auth
router.use('/test', testRoutes);     // Optional test route under /api/test

module.exports = router;
