import React, { useEffect, useState, useRef } from 'react';
import { GoogleMap, LoadScript, Circle } from '@react-google-maps/api';

const mapContainerStyle = {
  height: '300px',
  width: '100%',
  borderRadius: '8px',
  boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
};

// Define the libraries as a static constant
const libraries = ['marker'];

const MapComponent = ({ initialLocation }) => {
  console.log("Current User initialLocation:", initialLocation);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [userLocation, setUserLocation] = useState(initialLocation);
  const mapRef = useRef(null);
  const watchId = useRef(null); // Reference to store watch ID

  useEffect(() => {
    // Initialize geolocation watching
    if ("geolocation" in navigator) {
      watchId.current = navigator.geolocation.watchPosition(
        (position) => {
          const location = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          };
          setUserLocation(location); // Update current location
          console.log("Updated Location:", location);
        },
        (error) => {
          console.error("Error watching location:", error);
        },
        {
          enableHighAccuracy: true,
          maximumAge: 10000,
          timeout: 5000,
        }
      );
    } else {
      console.error("Geolocation is not supported by this browser.");
    }

    // Cleanup function to stop watching location
    return () => {
      if (watchId.current) {
        navigator.geolocation.clearWatch(watchId.current);
      }
    };
  }, []);

  const onLoad = (map) => {
    mapRef.current = map; // Store the map instance
    setMapLoaded(true);
  };

  if (!userLocation || typeof userLocation.lat !== 'number' || typeof userLocation.lng !== 'number') {
    console.error("Invalid user location", userLocation);
    return null; // Prevent rendering if the location is invalid
  }

  return (
    <LoadScript
      googleMapsApiKey="AIzaSyBdLz3ukJU-lrlRuSxTJWaDmefIEGw1I4U" // Replace with your actual API key
      libraries={libraries} // Use the static libraries variable
      version="weekly" // Specify the version
    >
      <GoogleMap
        mapContainerStyle={mapContainerStyle}
        center={userLocation}
        zoom={16}
        onLoad={onLoad}
        options={{
          mapId: 'b4450ba6e6cfc1b8', // Set your Map ID here
        }}
      >
        {mapLoaded && (
          <Circle
            center={userLocation}
            radius={500} // Radius in meters
            options={{
              fillColor: 'rgba(255, 38, 0, 0.5)', // Semi-transparent red fill
              strokeColor: 'red', // Red outline
              strokeOpacity: 1,
              strokeWeight: 2,
            }}
          />
        )}
      </GoogleMap>
    </LoadScript>
  );
};

export default MapComponent;
