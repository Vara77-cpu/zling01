import API from './api';

export const getRestaurants = async (filters = {}) => {
  const params = new URLSearchParams(filters).toString();
  const response = await API.get(`/restaurants?${params}`);
  return response.data;
};

export const getRestaurantById = async (id) => {
  const response = await API.get(`/restaurants/${id}`);
  return response.data;
};

export const getMenuByRestaurant = async (restaurantId) => {
  const response = await API.get(`/restaurants/${restaurantId}/menu`);
  return response.data;
};