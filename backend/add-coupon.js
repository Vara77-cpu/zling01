const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Coupon = require('./models/Coupon');

dotenv.config();

mongoose.connect(process.env.MONGODB_URI)
  .then(async () => {
    await Coupon.deleteOne({ code: 'WELCOME10' });
    const coupon = new Coupon({
      code: 'WELCOME10',
      type: 'percentage',
      value: 10,
      minOrder: 200,
      maxDiscount: 100,
      validFrom: new Date(),
      validTo: new Date('2026-12-31'),
      applicableRestaurants: [],
      usageLimit: 100,
      usedCount: 0,
      isActive: true
    });
    await coupon.save();
    console.log('Coupon added');
    process.exit();
  });