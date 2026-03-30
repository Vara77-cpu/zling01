const mongoose = require('mongoose');

const menuItemSchema = new mongoose.Schema({
  restaurantId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Restaurant',
    required: true
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    default: ''
  },
  price: {
    type: Number,
    required: true,
    min: 0
  },
  category: {
    type: String,
    required: true
  },
  images: [{
    type: String
  }],
  isAvailable: {
    type: Boolean,
    default: true
  },
  isVeg: {
    type: Boolean,
    required: true
  },
  spicyLevel: {
    type: Number,
    min: 1,
    max: 5,
    default: 3
  },
  preparationTime: {
    type: Number,
    default: 15
  },
  tags: [{
    type: String
  }],
  discount: {
    type: Number,
    min: 0,
    max: 100,
    default: 0
  }
}, { timestamps: true });

module.exports = mongoose.model('MenuItem', menuItemSchema);