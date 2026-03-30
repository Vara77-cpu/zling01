const express = require('express');
const auth = require('../middleware/auth');
const {
  getAllUsers,
  updateUserStatus,
  deleteUser,
  getAllRestaurants,
  updateRestaurantApproval,
  getDashboardStats,
  getSalesReport
} = require('../controllers/admin.controller');
const router = express.Router();

// All admin routes require authentication and admin role
router.use(auth);

// Middleware to check if user is admin
const isAdmin = (req, res, next) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Access denied. Admin only.' });
  }
  next();
};

router.use(isAdmin);

// User management
router.get('/users', getAllUsers);
router.put('/users/:userId/status', updateUserStatus);
router.delete('/users/:userId', deleteUser);

// Restaurant management
router.get('/restaurants', getAllRestaurants);
router.put('/restaurants/:restaurantId/approve', updateRestaurantApproval);

// Dashboard & Reports
router.get('/stats', getDashboardStats);
router.get('/reports/sales', getSalesReport);

module.exports = router;