import { GoogleMap, LoadScript, Marker } from '@react-google-maps/api';

const Map = ({ restaurantCoords, customerCoords }) => {
  const center = {
    lat: (restaurantCoords.lat + customerCoords.lat) / 2,
    lng: (restaurantCoords.lng + customerCoords.lng) / 2,
  };
  return (
    <LoadScript googleMapsApiKey={process.env.REACT_APP_GOOGLE_MAPS_API_KEY}>
      <GoogleMap mapContainerStyle={{ width: '100%', height: '400px' }} center={center} zoom={12}>
        <Marker position={restaurantCoords} label="R" />
        <Marker position={customerCoords} label="C" />
      </GoogleMap>
    </LoadScript>
  );
};