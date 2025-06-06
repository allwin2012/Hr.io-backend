const express = require('express');
const router = express.Router();

const authRoutes = require('./authRoutes');
const testRoutes = require('./test'); // optional
const hrRoutes = require('./hrRoutes');
const userRoutes = require('./userRoutes');
const leaveRoutes = require('./leaveRoutes');


router.use('/auth', authRoutes);     // All auth routes under /api/auth
router.use('/test', testRoutes);     // Optional test route under /api/test
router.use('/hr', hrRoutes);         // HR-only routes under /api/hr
router.use('/users', userRoutes);     // User routes under /api/user
router.use('/leave', leaveRoutes); // Leave routes under /api/leave


module.exports = router;
