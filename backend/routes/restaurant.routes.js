const express = require('express');
const auth = require('../middleware/auth');
const {
  getRestaurants,
  getRestaurantById,
  getMenu,
  addMenuItem,
  updateMenuItem,
  updateRestaurantStatus
} = require('../controllers/restaurant.controller');
const router = express.Router();

// Public routes
router.get('/', getRestaurants);
router.get('/:id', getRestaurantById);
router.get('/:id/menu', getMenu);

// Protected routes (require authentication)
router.post('/:id/menu', auth, addMenuItem);
router.put('/:id/menu/:itemId', auth, updateMenuItem);
router.put('/:id/status', auth, updateRestaurantStatus);

module.exports = router;