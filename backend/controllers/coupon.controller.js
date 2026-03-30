const Coupon = require('../models/Coupon');

exports.validateCoupon = async (req, res) => {
  try {
    const { code, restaurantId, subtotal } = req.query;
    if (!code) {
      return res.status(400).json({ message: 'Coupon code required' });
    }

    const coupon = await Coupon.findOne({ code: code.toUpperCase(), isActive: true });
    if (!coupon) {
      return res.status(404).json({ message: 'Invalid coupon code' });
    }

    // Check validity dates
    const now = new Date();
    if (coupon.validFrom && now < coupon.validFrom) {
      return res.status(400).json({ message: 'Coupon not yet valid' });
    }
    if (coupon.validTo && now > coupon.validTo) {
      return res.status(400).json({ message: 'Coupon expired' });
    }

    // Check usage limit
    if (coupon.usedCount >= coupon.usageLimit) {
      return res.status(400).json({ message: 'Coupon usage limit reached' });
    }

    // Check applicable restaurants
    if (coupon.applicableRestaurants.length > 0 && !coupon.applicableRestaurants.includes(restaurantId)) {
      return res.status(400).json({ message: 'Coupon not applicable for this restaurant' });
    }

    // Check minimum order
    if (subtotal < coupon.minOrder) {
      return res.status(400).json({ message: `Minimum order amount of ₹${coupon.minOrder} required` });
    }

    // Calculate discount
    let discount = 0;
    if (coupon.type === 'percentage') {
      discount = (subtotal * coupon.value) / 100;
      if (coupon.maxDiscount && discount > coupon.maxDiscount) {
        discount = coupon.maxDiscount;
      }
    } else {
      discount = coupon.value;
    }

    res.json({
      valid: true,
      coupon: {
        code: coupon.code,
        discount,
        type: coupon.type,
        value: coupon.value
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};