const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('./models/User');
const Restaurant = require('./models/Restaurant');
const MenuItem = require('./models/MenuItem');

dotenv.config();

const seedDatabase = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Clear existing data
    await User.deleteMany({});
    await Restaurant.deleteMany({});
    await MenuItem.deleteMany({});
    console.log('Cleared existing data');

    // Create test users (plain passwords – model will hash)
    const customer = new User({
      name: 'Test Customer',
      email: 'customer@test.com',
      password: '123456',
      phone: '9876543210',
      role: 'customer'
    });
    await customer.save();
    console.log('Created customer');

    const owner = new User({
      name: 'Restaurant Owner',
      email: 'owner@test.com',
      password: '123456',
      phone: '9876543211',
      role: 'restaurant_owner'
    });
    await owner.save();
    console.log('Created restaurant owner');

    // Create restaurant
    const restaurant = new Restaurant({
      name: 'Spice Garden',
      ownerId: owner._id,
      description: 'Authentic Indian cuisine with rich flavors',
      cuisine: ['Indian', 'Chinese', 'Tandoor'],
      address: {
        street: '123 Main St',
        city: 'Mumbai',
        area: 'Andheri East',
        pincode: '400093',
        coordinates: { lat: 19.1136, lng: 72.8697 }
      },
      contact: {
        phone: '9876543212',
        email: 'spicegarden@example.com'
      },
      openingHours: {
        open: '10:00',
        close: '23:00',
        isOpen: true
      },
      deliveryConfig: {
        minOrderAmount: 200,
        deliveryFee: 40,
        freeDeliveryThreshold: 500,
        deliveryAreas: ['Andheri East', 'Andheri West', 'Vile Parle'],
        estimatedDeliveryTime: 35
      },
      images: [],
      logo: '',
      isActive: true
    });
    await restaurant.save();
    console.log('Created restaurant: Spice Garden');

    // ✅ Link the restaurant to the owner
    owner.restaurantId = restaurant._id;
    await owner.save();
    console.log('Linked restaurant to owner');

    const deliveryPartner = new User({
  name: 'Delivery Partner',
  email: 'delivery@test.com',
  password: '123456',
  phone: '9876543213',
  role: 'delivery_partner'
});
await deliveryPartner.save();
console.log('Created delivery partner');

const admin = new User({
  name: 'Admin',
  email: 'admin@test.com',
  password: '123456',
  phone: '9999999999',
  role: 'admin'
});
await admin.save();

    // Menu items (unchanged)
    const menuItems = [
      {
        name: 'Butter Chicken',
        description: 'Creamy tomato gravy with tender chicken',
        price: 350,
        category: 'Main Course',
        isVeg: false,
        spicyLevel: 3,
        preparationTime: 20,
        tags: ['non-veg', 'signature']
      },
      {
        name: 'Paneer Butter Masala',
        description: 'Cottage cheese in rich tomato gravy',
        price: 280,
        category: 'Main Course',
        isVeg: true,
        spicyLevel: 2,
        preparationTime: 15,
        tags: ['veg', 'popular']
      },
      {
        name: 'Garlic Naan',
        description: 'Soft bread with garlic butter',
        price: 50,
        category: 'Breads',
        isVeg: true,
        spicyLevel: 1,
        preparationTime: 10,
        tags: ['veg']
      },
      {
        name: 'Chicken Biryani',
        description: 'Fragrant rice with spiced chicken',
        price: 280,
        category: 'Biryani',
        isVeg: false,
        spicyLevel: 4,
        preparationTime: 25,
        tags: ['non-veg', 'biryani']
      },
      {
        name: 'Veg Biryani',
        description: 'Fragrant rice with vegetables and spices',
        price: 220,
        category: 'Biryani',
        isVeg: true,
        spicyLevel: 3,
        preparationTime: 20,
        tags: ['veg']
      }
    ];

    for (const item of menuItems) {
      const menuItem = new MenuItem({
        restaurantId: restaurant._id,
        ...item
      });
      await menuItem.save();
    }
    console.log(`Added ${menuItems.length} menu items`);

    console.log('\n✅ Seeding completed successfully!');
    console.log('\nLogin credentials:');
    console.log(`Customer: customer@test.com / 123456`);
    console.log(`Restaurant Owner: owner@test.com / 123456`);
    console.log(`Restaurant ID: ${restaurant._id}`);
    console.log(`Owner's restaurantId now set to: ${owner.restaurantId}`);

    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  } catch (error) {
    console.error('Seeding error:', error);
    process.exit(1);
  }
};

seedDatabase();