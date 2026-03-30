const axios = require('axios');

const GEOCODE_URL = 'https://maps.googleapis.com/maps/api/geocode/json';

exports.geocodeAddress = async (address) => {
  const { street, city, area, pincode } = address;
  const fullAddress = `${street}, ${area}, ${city}, ${pincode}`;
  const response = await axios.get(GEOCODE_URL, {
    params: {
      address: fullAddress,
      key: process.env.GOOGLE_MAPS_API_KEY
    }
  });
  const results = response.data.results;
  if (results.length === 0) {
    throw new Error('Could not geocode address');
  }
  const location = results[0].geometry.location;
  return {
    lat: location.lat,
    lng: location.lng
  };
};