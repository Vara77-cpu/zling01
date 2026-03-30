import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { getRestaurants } from '../services/restaurant';

const HomePage = () => {
  const { t } = useTranslation();
  const [restaurants, setRestaurants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedCuisine, setSelectedCuisine] = useState('');

  const loadRestaurants = useCallback(async () => {
    setLoading(true);
    try {
      const filters = {};
      if (search) filters.search = search;
      if (selectedCuisine) filters.cuisine = selectedCuisine;
      const data = await getRestaurants(filters);
      setRestaurants(data);
    } catch (error) {
      console.error('Error loading restaurants:', error);
    } finally {
      setLoading(false);
    }
  }, [search, selectedCuisine]);

  useEffect(() => {
    loadRestaurants();
  }, [loadRestaurants]);

  const cuisines = ['Italian', 'Chinese', 'Indian', 'Mexican', 'Japanese', 'American', 'Thai', 'Mediterranean'];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-orange-500 to-orange-600 rounded-2xl p-8 mb-12 text-white">
        <h1 className="text-4xl font-bold mb-4">{t('home.title')}</h1>
        <p className="text-lg mb-6">{t('home.subtitle')}</p>
        <div className="flex gap-4">
          <input
            type="text"
            placeholder={t('home.search')}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="flex-1 px-4 py-2 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-orange-300"
          />
        </div>
      </div>

      {/* Cuisine Filters */}
      <div className="mb-8">
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setSelectedCuisine('')}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
              selectedCuisine === '' ? 'bg-orange-500 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            {t('home.all')}
          </button>
          {cuisines.map(cuisine => (
            <button
              key={cuisine}
              onClick={() => setSelectedCuisine(cuisine)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                selectedCuisine === cuisine ? 'bg-orange-500 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              {cuisine}
            </button>
          ))}
        </div>
      </div>

      {/* Restaurant Grid */}
      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
        </div>
      ) : restaurants.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-500 text-lg">{t('home.noRestaurants')}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {restaurants.map(restaurant => (
            <Link
              key={restaurant._id}
              to={`/restaurant/${restaurant._id}`}
              className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-300"
            >
              <div className="h-48 bg-gray-200 relative">
                {restaurant.images?.[0] ? (
                  <img
                    src={restaurant.images[0]}
                    alt={restaurant.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-orange-100">
                    <span className="text-orange-400 text-4xl">🍔</span>
                  </div>
                )}
                {!restaurant.isActive && (
                  <div className="absolute top-2 right-2 bg-red-500 text-white text-xs px-2 py-1 rounded">
                    {t('home.closed')}
                  </div>
                )}
              </div>
              <div className="p-4">
                <div className="flex justify-between items-start">
                  <h3 className="text-lg font-semibold text-gray-900">{restaurant.name}</h3>
                  <div className="flex items-center bg-green-100 text-green-700 px-2 py-1 rounded text-sm">
                    <span>★</span>
                    <span className="ml-1">{restaurant.rating?.average || t('home.new')}</span>
                  </div>
                </div>
                <p className="text-sm text-gray-500 mt-1">{restaurant.cuisine?.join(', ') || t('home.various')}</p>
                <p className="text-sm text-gray-500 mt-2">{restaurant.address?.area}, {restaurant.address?.city}</p>
                <div className="mt-3 flex items-center text-sm text-gray-600">
                  <span>⏱️ {restaurant.deliveryConfig?.estimatedDeliveryTime || 30} {t('home.min')}</span>
                  <span className="mx-2">•</span>
                  <span>₹{restaurant.deliveryConfig?.deliveryFee || 40} {t('home.delivery')}</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
};

export default HomePage;