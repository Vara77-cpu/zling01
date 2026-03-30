import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getRestaurantById, getMenuByRestaurant } from '../services/restaurant';
import { useCart } from '../context/CartContext';
import toast from 'react-hot-toast';

const RestaurantDetail = () => {
  const { id } = useParams();
  const [restaurant, setRestaurant] = useState(null);
  const [menu, setMenu] = useState([]);
  const [loading, setLoading] = useState(true);
  const { addToCart } = useCart();

  useEffect(() => {
    loadData();
  }, [id]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [restaurantData, menuData] = await Promise.all([
        getRestaurantById(id),
        getMenuByRestaurant(id)
      ]);
      setRestaurant(restaurantData);
      setMenu(menuData);
    } catch (error) {
      console.error('Error loading restaurant:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="flex justify-center items-center h-64">Loading...</div>;
  }

  if (!restaurant) {
    return <div className="text-center py-12">Restaurant not found</div>;
  }

  // Group menu by category
  const groupedMenu = menu.reduce((acc, item) => {
    const category = item.category;
    if (!acc[category]) acc[category] = [];
    acc[category].push(item);
    return acc;
  }, {});

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Restaurant Header */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-8">
        <h1 className="text-3xl font-bold text-gray-900">{restaurant.name}</h1>
        <p className="text-gray-600 mt-2">{restaurant.description}</p>
        <div className="flex flex-wrap gap-4 mt-4 text-sm text-gray-500">
          <span>⭐ {restaurant.rating?.average || 'New'} ({restaurant.rating?.count || 0} ratings)</span>
          <span>⏱️ {restaurant.deliveryConfig?.estimatedDeliveryTime} min</span>
          <span>💰 ₹{restaurant.deliveryConfig?.deliveryFee} delivery</span>
          <span>🚚 Min order: ₹{restaurant.deliveryConfig?.minOrderAmount}</span>
        </div>
        <div className="mt-4">
          <p className="text-gray-600">{restaurant.address?.street}, {restaurant.address?.area}, {restaurant.address?.city}</p>
          <p className="text-gray-500 text-sm">Open: {restaurant.openingHours?.open} - {restaurant.openingHours?.close}</p>
        </div>
      </div>

      {/* Menu */}
      <h2 className="text-2xl font-bold mb-6">Menu</h2>
      {Object.keys(groupedMenu).length === 0 ? (
        <p className="text-gray-500">No menu items available.</p>
      ) : (
        Object.entries(groupedMenu).map(([category, items]) => (
          <div key={category} className="mb-8">
            <h3 className="text-xl font-semibold text-gray-800 mb-4">{category}</h3>
            <div className="grid gap-4">
              {items.map(item => (
                <div key={item._id} className="bg-white rounded-lg shadow p-4 flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h4 className="text-lg font-medium text-gray-900">{item.name}</h4>
                      <span className="text-xs px-2 py-1 rounded bg-gray-200">{item.isVeg ? '🌱 Veg' : '🍗 Non-Veg'}</span>
                      {item.spicyLevel > 3 && <span className="text-xs px-2 py-1 rounded bg-red-100 text-red-600">🔥 Spicy</span>}
                    </div>
                    <p className="text-gray-500 text-sm mt-1">{item.description}</p>
                    <div className="mt-2 flex items-center gap-4 text-sm text-gray-600">
                      <span>₹{item.price}</span>
                      <span>⏱️ {item.preparationTime} min</span>
                    </div>
                  </div>
                  <button
  onClick={() => {
    addToCart(item, restaurant._id, restaurant.name);
    toast.success(`Added ${item.name} to cart`);
  }}
  className="ml-4 bg-orange-500 text-white px-4 py-2 rounded-lg hover:bg-orange-600 transition-colors"
>
  Add to Cart
</button>
                </div>
              ))}
            </div>
          </div>
        ))
      )}
    </div>
  );
};

export default RestaurantDetail;