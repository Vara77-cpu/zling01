const express = require('express');
const auth = require('../middleware/auth');
const {
  createOrder,
  getOrders,
  getOrderById,
  updateOrderStatus
} = require('../controllers/order.controller');
const router = express.Router();

// All routes require authentication
router.post('/', auth, createOrder);
router.get('/', auth, getOrders);
router.get('/:id', auth, getOrderById);
router.put('/:id/status', auth, updateOrderStatus);
router.put('/:id/status', auth, updateOrderStatus);

module.exports = router;