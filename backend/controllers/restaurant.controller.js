const Restaurant = require('../models/Restaurant');
const MenuItem = require('../models/MenuItem');

// @desc    Get all restaurants (with filters)
// @route   GET /api/restaurants
// @access  Public
exports.getRestaurants = async (req, res) => {
  try {
    const { area, cuisine, search, city } = req.query;
    let filter = { isActive: true };

    if (area) filter['address.area'] = { $regex: area, $options: 'i' };
    if (city) filter['address.city'] = { $regex: city, $options: 'i' };
    if (cuisine) filter.cuisine = { $in: cuisine.split(',') };
    if (search) filter.name = { $regex: search, $options: 'i' };

    const restaurants = await Restaurant.find(filter).select('-__v').sort({ rating: -1 });
    res.json(restaurants);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get restaurant by ID
// @route   GET /api/restaurants/:id
// @access  Public
exports.getRestaurantById = async (req, res) => {
  try {
    const restaurant = await Restaurant.findById(req.params.id).select('-__v');
    if (!restaurant) {
      return res.status(404).json({ message: 'Restaurant not found' });
    }
    res.json(restaurant);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get menu items for a restaurant
// @route   GET /api/restaurants/:id/menu
// @access  Public
exports.getMenu = async (req, res) => {
  try {
    const menu = await MenuItem.find({ restaurantId: req.params.id, isAvailable: true })
      .select('-__v')
      .sort({ category: 1 });
    res.json(menu);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Add a new menu item to a restaurant
// @route   POST /api/restaurants/:id/menu
// @access  Private (Restaurant Owner or Admin)
exports.addMenuItem = async (req, res) => {
  try {
    const restaurant = await Restaurant.findById(req.params.id);
    if (!restaurant) {
      return res.status(404).json({ message: 'Restaurant not found' });
    }

    // Check authorization: only restaurant owner or admin can add items
    if (restaurant.ownerId.toString() !== req.user.userId && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized to add items to this restaurant' });
    }

    const menuItem = new MenuItem({
      ...req.body,
      restaurantId: req.params.id
    });
    await menuItem.save();

    res.status(201).json(menuItem);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Update a menu item
// @route   PUT /api/restaurants/:id/menu/:itemId
// @access  Private (Restaurant Owner or Admin)
exports.updateMenuItem = async (req, res) => {
  try {
    const menuItem = await MenuItem.findById(req.params.itemId);
    if (!menuItem) {
      return res.status(404).json({ message: 'Menu item not found' });
    }

    // Verify that the menu item belongs to the restaurant
    if (menuItem.restaurantId.toString() !== req.params.id) {
      return res.status(400).json({ message: 'Menu item does not belong to this restaurant' });
    }

    const restaurant = await Restaurant.findById(req.params.id);
    if (restaurant.ownerId.toString() !== req.user.userId && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized to update this item' });
    }

    Object.assign(menuItem, req.body);
    await menuItem.save();

    res.json(menuItem);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Update restaurant open/close status
// @route   PUT /api/restaurants/:id/status
// @access  Private (Restaurant Owner or Admin)
exports.updateRestaurantStatus = async (req, res) => {
  try {
    const restaurant = await Restaurant.findById(req.params.id);
    if (!restaurant) {
      return res.status(404).json({ message: 'Restaurant not found' });
    }

    if (restaurant.ownerId.toString() !== req.user.userId && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized to update restaurant status' });
    }

    const { isActive } = req.body;
    if (isActive !== undefined) {
      restaurant.isActive = isActive;
    }
    if (req.body.openingHours) {
      restaurant.openingHours = req.body.openingHours;
    }

    await restaurant.save();
    res.json({ message: 'Restaurant status updated', isActive: restaurant.isActive });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};