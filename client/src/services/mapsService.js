/**
 * mapsService.js
 * Utilities for Google Maps JavaScript API integration.
 * The Maps API key is stored in VITE_GOOGLE_MAPS_API_KEY env variable.
 */

/**
 * Dynamically load the Google Maps JavaScript API script.
 * Resolves when the script is ready.
 * @returns {Promise<void>}
 */
export function loadGoogleMapsScript() {
  return new Promise((resolve, reject) => {
    // If already loaded and Map constructor is available, resolve immediately
    if (window.google && window.google.maps && window.google.maps.Map) {
      resolve();
      return;
    }

    // If script tag already exists (loading in progress), wait for it
    const existingScript = document.getElementById('google-maps-script');
    if (existingScript) {
      // If the script is already there, we might still be waiting for the callback
      // but adding more listeners won't hurt if we check for success
      const checkInterval = setInterval(() => {
        if (window.google && window.google.maps && window.google.maps.Map) {
          clearInterval(checkInterval);
          resolve();
        }
      }, 100);
      return;
    }

    const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
    if (!apiKey || apiKey === 'your_google_maps_api_key_here') {
      reject(new Error('Google Maps API key not configured'));
      return;
    }

    // Create the script
    const script = document.createElement('script');
    script.id = 'google-maps-script';
    
    // Define the global callback
    window.initGoogleMaps = () => {
      if (window.google && window.google.maps && window.google.maps.Map) {
        resolve();
      } else {
        reject(new Error('Google Maps API loaded but Map constructor is missing'));
      }
    };

    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places,marker&loading=async&callback=initGoogleMaps`;
    script.async = true;
    script.defer = true;
    script.onerror = () => reject(new Error('Failed to load Google Maps script'));
    document.head.appendChild(script);
  });
}

/**
 * Calculate distance between two lat/lng points (Haversine formula).
 * @param {number} lat1
 * @param {number} lng1
 * @param {number} lat2
 * @param {number} lng2
 * @returns {string} Distance in km
 */
export function calculateDistance(lat1, lng1, lat2, lng2) {
  const R = 6371; // Earth radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return (R * c).toFixed(1) + ' km';
}

/**
 * Get user's current geolocation.
 * @returns {Promise<{lat: number, lng: number}>}
 */
export function getUserLocation() {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Geolocation is not supported by your browser'));
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (position) => resolve({ lat: position.coords.latitude, lng: position.coords.longitude }),
      (error) => reject(error),
      { timeout: 10000, maximumAge: 300000 }
    );
  });
}
