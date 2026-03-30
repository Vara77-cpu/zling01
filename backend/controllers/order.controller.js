const Order = require('../models/Order');
const Restaurant = require('../models/Restaurant');
const MenuItem = require('../models/MenuItem');
const Coupon = require('../models/Coupon');
const User = require('../models/User');
const emailService = require('../services/email.service');
const smsService = require('../services/sms.service');
const geocodeService = require('../services/geocode.service');

// Helper function to safely get io
const getIo = (req) => {
  try {
    return req.app.get('io');
  } catch (e) {
    return null;
  }
};

// @desc    Create a new order
// @route   POST /api/orders
// @access  Private (Customer only)
exports.createOrder = async (req, res) => {
  try {
    console.log('\n=== CREATE ORDER REQUEST ===');
    console.log('Body:', JSON.stringify(req.body, null, 2));
    console.log('User ID:', req.user.userId);

    const { restaurantId, items, deliveryAddress, paymentMethod, specialInstructions, couponCode } = req.body;

    // --- Validate required fields ---
    if (!restaurantId) {
      return res.status(400).json({ message: 'Restaurant ID is required' });
    }
    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ message: 'At least one item is required' });
    }
    if (!deliveryAddress || !deliveryAddress.street || !deliveryAddress.city || !deliveryAddress.area || !deliveryAddress.pincode) {
      return res.status(400).json({ message: 'Complete delivery address is required (street, city, area, pincode)' });
    }
    if (!paymentMethod) {
      return res.status(400).json({ message: 'Payment method is required' });
    }

    const customerId = req.user.userId;

    // --- Verify restaurant exists and is active ---
    const restaurant = await Restaurant.findById(restaurantId);
    if (!restaurant) {
      return res.status(404).json({ message: 'Restaurant not found' });
    }
    if (!restaurant.isActive) {
      return res.status(400).json({ message: 'Restaurant is currently closed' });
    }

    // --- Validate items and calculate subtotal ---
    let subtotal = 0;
    const orderItems = [];

    for (const item of items) {
      if (!item.menuItemId) {
        return res.status(400).json({ message: 'Each item must have a menuItemId' });
      }
      const menuItem = await MenuItem.findById(item.menuItemId);
      if (!menuItem) {
        return res.status(400).json({ message: `Item with id ${item.menuItemId} not found` });
      }
      if (!menuItem.isAvailable) {
        return res.status(400).json({ message: `Item "${menuItem.name}" is not available` });
      }

      const quantity = item.quantity || 1;
      const itemTotal = menuItem.price * quantity;
      subtotal += itemTotal;

      orderItems.push({
        menuItemId: menuItem._id,
        name: menuItem.name,
        quantity: quantity,
        price: menuItem.price,
        specialInstructions: item.specialInstructions || ''
      });
    }

    // --- Apply coupon discount (advanced) ---
    let discount = 0;
    if (couponCode) {
      const coupon = await Coupon.findOne({ code: couponCode.toUpperCase(), isActive: true });
      if (coupon) {
        // Basic validation (you may want to re-run all checks or trust frontend)
        if (coupon.type === 'percentage') {
          discount = (subtotal * coupon.value) / 100;
          if (coupon.maxDiscount && discount > coupon.maxDiscount) discount = coupon.maxDiscount;
        } else {
          discount = coupon.value;
        }
        // Increment usage count
        coupon.usedCount += 1;
        await coupon.save();
      }
    }

    // --- Delivery fee (safe access) ---
    const deliveryConfig = restaurant.deliveryConfig || {};
    const freeDeliveryThreshold = deliveryConfig.freeDeliveryThreshold || 0;
    const baseDeliveryFee = deliveryConfig.deliveryFee || 40;
    const deliveryFee = subtotal >= freeDeliveryThreshold ? 0 : baseDeliveryFee;

    // --- Tax (5%) ---
    const tax = subtotal * 0.05;

    const totalAmount = subtotal + deliveryFee + tax - discount;

    // --- Estimated delivery time ---
    const estimatedDeliveryTime = new Date();
    const prepTime = (deliveryConfig.estimatedDeliveryTime || 30);
    estimatedDeliveryTime.setMinutes(estimatedDeliveryTime.getMinutes() + prepTime);

    // --- Geocode delivery address (optional) ---
    let coordinates = null;
    if (process.env.GOOGLE_MAPS_API_KEY) {
      try {
        coordinates = await geocodeService.geocodeAddress(deliveryAddress);
        console.log('Geocoded coordinates:', coordinates);
      } catch (err) {
        console.warn('Geocoding failed:', err.message);
        // Continue without coordinates
      }
    } else {
      console.log('No Google Maps API key, skipping geocoding');
    }

    // --- Create order ---
    const order = new Order({
      customerId,
      restaurantId,
      items: orderItems,
      subtotal,
      deliveryFee,
      tax,
      discount,
      couponCode: couponCode || '',
      totalAmount,
      paymentMethod,
      deliveryAddress: {
        ...deliveryAddress,
        coordinates: coordinates || { lat: 0, lng: 0 }
      },
      specialInstructions: specialInstructions || '',
      estimatedDeliveryTime,
      orderStatus: 'pending'
    });

    // Generate custom orderId manually (no pre-save hook)
    order.orderId = 'ORD' + Date.now() + Math.floor(Math.random() * 10000);

    await order.save();

    // --- Emit real-time event (if socket.io is available) ---
    const io = getIo(req);
    if (io) {
      io.to(`restaurant_${restaurantId}`).emit('newOrder', order);
    }

    // Send email/SMS notification for order creation (optional)
    try {
      const customer = await User.findById(customerId);
      if (customer && customer.email) {
        await emailService.sendOrderStatusEmail(customer.email, order.orderId, order.orderStatus, {
          items: order.items,
          totalAmount: order.totalAmount
        });
      }
      if (customer && customer.phone) {
        await smsService.sendOrderStatusSMS(customer.phone, order.orderId, order.orderStatus);
      }
    } catch (err) {
      console.error('Notification error:', err);
    }

    res.status(201).json({
      message: 'Order created successfully',
      order
    });
  } catch (error) {
    console.error('Create order error:', error);
    console.error('Error stack:', error.stack);
    res.status(500).json({ message: error.message || 'Server error' });
  }
};

// @desc    Get orders for the logged-in user based on role
// @route   GET /api/orders
// @access  Private
exports.getOrders = async (req, res) => {
  try {
    const { userId, role } = req.user;
    let query = {};

    if (role === 'customer') {
      query.customerId = userId;
    } else if (role === 'restaurant_owner') {
      const restaurant = await Restaurant.findOne({ ownerId: userId });
      if (restaurant) {
        query.restaurantId = restaurant._id;
      } else {
        return res.json([]);
      }
    } else if (role === 'delivery_partner') {
      query.deliveryPartnerId = userId;
    } else if (role === 'admin') {
      // Admin sees all
    } else {
      return res.status(403).json({ message: 'Not authorized' });
    }

    const orders = await Order.find(query)
      .populate('restaurantId', 'name address logo')
      .populate('customerId', 'name phone')
      .sort('-createdAt');

    res.json(orders);
  } catch (error) {
    console.error('Get orders error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get single order by ID
// @route   GET /api/orders/:id
// @access  Private
exports.getOrderById = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate('restaurantId', 'name address contact logo deliveryConfig')
      .populate('customerId', 'name phone address')
      .populate('deliveryPartnerId', 'name phone');

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    const { userId, role } = req.user;
    const isCustomer = order.customerId && order.customerId._id.toString() === userId;
    const restaurant = await Restaurant.findById(order.restaurantId);
    const isRestaurantOwner = restaurant && restaurant.ownerId.toString() === userId;
    const isDeliveryPartner = order.deliveryPartnerId && order.deliveryPartnerId._id.toString() === userId;
    const isAdmin = role === 'admin';

    if (!(isCustomer || isRestaurantOwner || isDeliveryPartner || isAdmin)) {
      return res.status(403).json({ message: 'Not authorized to view this order' });
    }

    res.json(order);
  } catch (error) {
    console.error('Get order by id error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Update order status
// @route   PUT /api/orders/:id/status
// @access  Private (Restaurant owner, delivery partner, or admin)
exports.updateOrderStatus = async (req, res) => {
  try {
    console.log('\n=== UPDATE ORDER STATUS ===');
    console.log('Order ID:', req.params.id);
    console.log('User:', req.user.userId);
    console.log('Body:', req.body);

    const order = await Order.findById(req.params.id);
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    const { userId, role } = req.user;
    const { status, deliveryPartnerId } = req.body;

    // Authorization checks
    let authorized = false;
    if (role === 'admin') {
      authorized = true;
    } else if (role === 'restaurant_owner') {
      const restaurant = await Restaurant.findOne({ ownerId: userId });
      if (restaurant && restaurant._id.toString() === order.restaurantId.toString()) {
        authorized = true;
      }
    } else if (role === 'delivery_partner') {
      // Delivery partner can:
      // - Claim a ready order that is not assigned
      // - Update status of orders assigned to them
      if (order.orderStatus === 'ready' && !order.deliveryPartnerId) {
        authorized = true; // claim
      } else if (order.deliveryPartnerId && order.deliveryPartnerId.toString() === userId) {
        authorized = true; // update
      }
    } else if (role === 'customer' && status === 'cancelled' && ['pending', 'confirmed'].includes(order.orderStatus)) {
      authorized = true;
    }

    if (!authorized) {
      return res.status(403).json({ message: 'Not authorized to update order status' });
    }

    // Perform the update
    if (role === 'delivery_partner' && order.orderStatus === 'ready' && !order.deliveryPartnerId) {
      // Claiming order
      order.deliveryPartnerId = userId;
      order.orderStatus = 'picked_up'; // claim → picked_up
    } else {
      // Normal status update
      order.orderStatus = status;
      if (deliveryPartnerId) {
        order.deliveryPartnerId = deliveryPartnerId;
      }
    }

    if (order.orderStatus === 'delivered') {
      order.actualDeliveryTime = new Date();
    }

    await order.save();

    // Emit real-time update
    const io = getIo(req);
    if (io) {
      io.to(`order_${order._id}`).emit('orderStatusUpdated', {
        orderId: order._id,
        status: order.orderStatus
      });
      // Also notify restaurant of the update (especially for delivery partner actions)
      io.to(`restaurant_${order.restaurantId}`).emit('orderStatusUpdated', {
        orderId: order._id,
        status: order.orderStatus
      });
    }

    // Send email/SMS notification to customer
    try {
      const customer = await User.findById(order.customerId);
      if (customer && customer.email) {
        await emailService.sendOrderStatusEmail(customer.email, order.orderId, order.orderStatus, {
          items: order.items,
          totalAmount: order.totalAmount
        });
      }
      if (customer && customer.phone) {
        await smsService.sendOrderStatusSMS(customer.phone, order.orderId, order.orderStatus);
      }
    } catch (err) {
      console.error('Notification error:', err);
    }

    res.json({
      message: 'Order status updated successfully',
      order
    });
  } catch (error) {
    console.error('Update order status error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};