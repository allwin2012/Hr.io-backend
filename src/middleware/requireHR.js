// middleware/requireHR.js

module.exports = (req, res, next) => {
  const role = req.user?.role;
  if (['HR', 'Admin', 'SuperAdmin'].includes(role)) {
    return next();
  }
  return res.status(403).json({ message: 'Access denied: HR/Admin only' });
};
