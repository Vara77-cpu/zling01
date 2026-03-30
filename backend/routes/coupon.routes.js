const express = require('express');
const auth = require('../middleware/auth');
const { validateCoupon } = require('../controllers/coupon.controller');
const router = express.Router();

router.get('/validate', auth, validateCoupon);

module.exports = router;