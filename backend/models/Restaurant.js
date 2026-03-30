const mongoose = require('mongoose');

const restaurantSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  ownerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  description: {
    type: String,
    default: ''
  },
  cuisine: [{
    type: String
  }],
  address: {
    street: { type: String, required: true },
    city: { type: String, required: true },
    area: { type: String, required: true },
    pincode: { type: String, required: true },
    coordinates: {
      lat: { type: Number, default: 0 },
      lng: { type: Number, default: 0 }
    }
  },
  contact: {
    phone: { type: String, required: true },
    email: { type: String, default: '' }
  },
  openingHours: {
    open: { type: String, default: '09:00' },
    close: { type: String, default: '22:00' },
    isOpen: { type: Boolean, default: true }
  },
  deliveryConfig: {
    minOrderAmount: { type: Number, default: 0 },
    deliveryFee: { type: Number, default: 40 },
    freeDeliveryThreshold: { type: Number, default: 500 },
    deliveryAreas: [String],
    estimatedDeliveryTime: { type: Number, default: 30 }
  },
  images: [{
    type: String
  }],
  logo: {
    type: String,
    default: ''
  },
  rating: {
    average: { type: Number, default: 0 },
    count: { type: Number, default: 0 }
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, { timestamps: true });

module.exports = mongoose.model('Restaurant', restaurantSchema);