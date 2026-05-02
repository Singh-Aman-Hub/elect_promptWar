import { useState, useEffect, useRef, useCallback } from 'react';
import { MapPin, Navigation, List, Search, ExternalLink, Loader2 } from 'lucide-react';
import PropTypes from 'prop-types';
import { fetchPollingBooths } from '../services/searchService';
import { loadGoogleMapsScript, getUserLocation } from '../services/mapsService';

/**
 * BoothLocator — Google Maps integration for polling booth discovery
 */
export default function BoothLocator() {
  const [booths, setBooths] = useState([]);
  const [selectedBooth, setSelectedBooth] = useState(null);
  const [isLoadingBooths, setIsLoadingBooths] = useState(false);
  const [isLoadingMap, setIsLoadingMap] = useState(false);
  const [mapError, setMapError] = useState(null);
  const [boothError, setBoothError] = useState(null);
  const [constituencyInput, setConstituencyInput] = useState('');
  const [mapLoaded, setMapLoaded] = useState(false);
  const [activeView, setActiveView] = useState('split'); // 'map' | 'list' | 'split'

  const mapRef = useRef(null);
  const googleMapRef = useRef(null);
  const searchInputRef = useRef(null);
  const markersRef = useRef([]);
  const infoWindowRef = useRef(null);

  const DELHI_CENTER = { lat: 28.6139, lng: 77.209 };

  // Initialize Google Maps
  useEffect(() => {
    setIsLoadingMap(true);
    loadGoogleMapsScript()
      .then(() => {
        setMapLoaded(true);
        setIsLoadingMap(false);

        // Initialize Google Places Autocomplete
        if (searchInputRef.current && window.google) {
          const autocomplete = new window.google.maps.places.Autocomplete(searchInputRef.current, {
            types: ['(regions)'],
            componentRestrictions: { country: 'in' },
          });

          autocomplete.addListener('place_changed', () => {
            const place = autocomplete.getPlace();
            if (place.geometry) {
              setConstituencyInput(place.formatted_address);
              handleSearch(
                place.formatted_address,
                place.geometry.location.lat(),
                place.geometry.location.lng()
              );
            }
          });
        }
      })
      .catch((err) => {
        setMapError(err.message);
        setIsLoadingMap(false);
        // Load booths even without map
        loadBoothsByLocation(DELHI_CENTER.lat, DELHI_CENTER.lng);
      });
  }, []);

  // Initialize map when script is loaded
  useEffect(() => {
    if (!mapLoaded || !mapRef.current) return;

    googleMapRef.current = new window.google.maps.Map(mapRef.current, {
      center: DELHI_CENTER,
      zoom: 13,
      mapId: 'DEMO_MAP_ID',
      styles: DARK_MAP_STYLES,
      disableDefaultUI: false,
      zoomControl: true,
      mapTypeControl: false,
      streetViewControl: false,
      fullscreenControl: true,
    });

    infoWindowRef.current = new window.google.maps.InfoWindow();

    // Load initial booths for Delhi
    loadBoothsByLocation(DELHI_CENTER.lat, DELHI_CENTER.lng);
  }, [mapLoaded]);

  const loadBoothsByLocation = useCallback(async (lat, lng) => {
    setIsLoadingBooths(true);
    setBoothError(null);
    try {
      const fetchedBooths = await fetchPollingBooths({ lat, lng });
      setBooths(fetchedBooths);
      if (googleMapRef.current) {
        placeMarkers(fetchedBooths);
      }
    } catch (err) {
      setBoothError('Failed to load booths. Please try again.');
    } finally {
      setIsLoadingBooths(false);
    }
  }, []);

  const handleSearch = useCallback(
    async (address, lat, lng) => {
      setIsLoadingBooths(true);
      setBoothError(null);
      if (googleMapRef.current) {
        googleMapRef.current.setCenter({ lat, lng });
        googleMapRef.current.setZoom(14);
      }
      await loadBoothsByLocation(lat, lng);
    },
    [loadBoothsByLocation]
  );

  const placeMarkers = (boothList) => {
    // Clear existing markers
    markersRef.current.forEach((m) => m.setMap(null));
    markersRef.current = [];

    boothList.forEach((booth) => {
      const pinElement = new window.google.maps.marker.PinElement({
        background: '#FF9933',
        borderColor: '#ffffff',
        glyphColor: '#ffffff',
        scale: 0.8,
      });

      const marker = new window.google.maps.marker.AdvancedMarkerElement({
        position: { lat: booth.lat, lng: booth.lng },
        map: googleMapRef.current,
        title: booth.name,
        content: pinElement.element,
      });

      marker.addListener('click', () => {
        setSelectedBooth(booth);
        infoWindowRef.current.setContent(`
          <div style="font-family: Inter, sans-serif; padding: 8px; min-width: 200px;">
            <h3 style="font-weight: 700; color: #FF9933; margin-bottom: 6px; font-size: 13px;">${booth.name}</h3>
            <p style="font-size: 12px; color: #555; margin-bottom: 4px;">📍 ${booth.address}</p>
            <p style="font-size: 12px; color: #555; margin-bottom: 4px;">🗳️ Booth No: ${booth.boothNo}</p>
            <p style="font-size: 12px; color: #555; margin-bottom: 8px;">⏰ ${booth.timings}</p>
            <a href="https://www.google.com/maps/dir/?api=1&destination=${booth.lat},${booth.lng}" 
               target="_blank" rel="noopener noreferrer"
               style="background: #FF9933; color: white; padding: 5px 12px; border-radius: 6px; text-decoration: none; font-size: 12px; font-weight: 600;">
              Get Directions →
            </a>
          </div>
        `);
        infoWindowRef.current.open(googleMapRef.current, marker);
      });

      markersRef.current.push(marker);
    });

    // Fit map to markers
    if (boothList.length > 0 && googleMapRef.current) {
      const bounds = new window.google.maps.LatLngBounds();
      boothList.forEach((b) => bounds.extend({ lat: b.lat, lng: b.lng }));
      googleMapRef.current.fitBounds(bounds, 60);
    }
  };

  const handleUseMyLocation = async () => {
    try {
      setIsLoadingBooths(true);
      const { lat, lng } = await getUserLocation();
      if (googleMapRef.current) {
        googleMapRef.current.setCenter({ lat, lng });
        googleMapRef.current.setZoom(14);
      }
      await loadBoothsByLocation(lat, lng);
    } catch {
      setBoothError('Location access denied. Please search by constituency name.');
      setIsLoadingBooths(false);
    }
  };

  const handleConstituencySearch = async (e) => {
    e.preventDefault();
    if (!constituencyInput.trim()) return;
    setIsLoadingBooths(true);
    setBoothError(null);
    try {
      const fetchedBooths = await fetchPollingBooths({ constituency: constituencyInput });
      setBooths(fetchedBooths);
      if (googleMapRef.current && fetchedBooths.length > 0) {
        placeMarkers(fetchedBooths);
      }
    } catch (err) {
      setBoothError('Failed to search booths. Please try again.');
    } finally {
      setIsLoadingBooths(false);
    }
  };

  const handleBoothListClick = (booth) => {
    setSelectedBooth(booth);
    if (googleMapRef.current) {
      googleMapRef.current.setCenter({ lat: booth.lat, lng: booth.lng });
      googleMapRef.current.setZoom(16);
    }
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="text-center">
        <h2 className="font-display font-bold text-2xl text-gradient-saffron mb-1">
          Polling Booth Locator
        </h2>
        <p className="text-sm" style={{ color: '#8b949e' }}>
          Find your nearest polling booth
        </p>
      </div>

      {/* Controls */}
      <div className="flex flex-col sm:flex-row gap-3 items-stretch flex-shrink-0 overflow-hidden">
        <button
          onClick={handleUseMyLocation}
          disabled={isLoadingBooths}
          aria-label="Use my current location to find polling booths"
          className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all hover:scale-105 disabled:opacity-60 cursor-pointer flex-shrink-0"
          style={{
            background: 'linear-gradient(135deg, rgba(255,153,51,0.2), rgba(232,92,0,0.2))',
            border: '1px solid rgba(255,153,51,0.4)',
            color: '#FF9933',
            height: '42px',
          }}
        >
          <Navigation size={15} />
          Use My Location
        </button>

        <form onSubmit={handleConstituencySearch} className="flex gap-2 flex-1 h-[42px]">
          <div className="relative flex-1">
            <Search
              size={14}
              className="absolute left-3 top-1/2 -translate-y-1/2"
              style={{ color: '#8b949e' }}
            />
            <input
              ref={searchInputRef}
              id="constituency-search"
              type="text"
              value={constituencyInput}
              onChange={(e) => setConstituencyInput(e.target.value)}
              placeholder="Search by constituency..."
              aria-label="Search by constituency name"
              className="w-full pl-9 pr-4 py-2.5 rounded-xl text-sm outline-none transition-all"
              style={{
                background: 'rgba(255,255,255,0.05)',
                border: '1px solid rgba(255,255,255,0.1)',
                color: '#e6edf3',
              }}
              onFocus={(e) => (e.target.style.borderColor = 'rgba(255,153,51,0.4)')}
              onBlur={(e) => (e.target.style.borderColor = 'rgba(255,255,255,0.1)')}
            />
          </div>
          <button
            type="submit"
            disabled={isLoadingBooths}
            aria-label="Search polling booths"
            className="px-5 py-2.5 rounded-xl text-sm font-semibold transition-all hover:scale-105 disabled:opacity-60 cursor-pointer ml-2 flex-shrink-0"
            style={{
              background: 'linear-gradient(135deg, #FF9933, #e85c00)',
              color: 'white',
            }}
          >
            Search
          </button>
        </form>

        {/* View Toggles */}
        <div 
          className="flex items-center gap-1 p-1 rounded-xl flex-shrink-0 h-[42px]" 
          style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}
        >
          <button
            type="button"
            onClick={() => setActiveView('split')}
            className={`px-3 h-full rounded-lg text-xs font-semibold transition-all ${
              activeView === 'split' ? 'bg-[#FF9933] text-white' : 'text-[#8b949e] hover:text-white'
            }`}
          >
            Split
          </button>
          <button
            type="button"
            onClick={() => setActiveView('map')}
            className={`px-3 h-full rounded-lg text-xs font-semibold transition-all ${
              activeView === 'map' ? 'bg-[#FF9933] text-white' : 'text-[#8b949e] hover:text-white'
            }`}
          >
            Map
          </button>
          <button
            type="button"
            onClick={() => setActiveView('list')}
            className={`px-3 h-full rounded-lg text-xs font-semibold transition-all ${
              activeView === 'list' ? 'bg-[#FF9933] text-white' : 'text-[#8b949e] hover:text-white'
            }`}
          >
            List
          </button>
        </div>
      </div>

      {/* Error messages */}
      {(boothError || mapError) && (
        <div
          className="px-4 py-3 rounded-xl text-sm"
          style={{
            background: mapError ? 'rgba(251,191,36,0.1)' : 'rgba(220,38,38,0.1)',
            border: `1px solid ${mapError ? 'rgba(251,191,36,0.3)' : 'rgba(220,38,38,0.3)'}`,
            color: mapError ? '#fbbf24' : '#fca5a5',
          }}
        >
          {mapError
            ? `⚠️ Maps API: ${mapError} — Showing booth list only.`
            : `❌ ${boothError}`}
        </div>
      )}

      {/* Map + List grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4" style={{ minHeight: '450px' }}>
        {/* Map */}
        {(activeView === 'split' || activeView === 'map') && (
        <div
          className={`${activeView === 'map' ? 'lg:col-span-3' : 'lg:col-span-2'} rounded-2xl overflow-hidden relative`}
          style={{
            background: 'rgba(22,27,34,0.8)',
            border: '1px solid rgba(255,255,255,0.07)',
            minHeight: '400px',
          }}
        >
          {isLoadingMap && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 z-10">
              <Loader2 size={28} className="animate-spin" style={{ color: '#FF9933' }} />
              <p className="text-sm" style={{ color: '#8b949e' }}>
                Loading Google Maps...
              </p>
            </div>
          )}
          {mapError && (
            <div 
              className="absolute inset-0 m-6 flex flex-col items-center justify-center gap-3 rounded-2xl"
              style={{
                background: 'rgba(255,255,255,0.02)',
                border: '1px solid rgba(255,255,255,0.05)'
              }}
            >
              <MapPin size={48} style={{ color: '#FF9933', opacity: 0.4 }} />
              <h3 className="text-lg font-semibold text-white">Map unavailable</h3>
              <p className="text-sm text-center px-8" style={{ color: '#8b949e' }}>
                Google Maps requires a valid API key.
                <br />
                Configure <code>VITE_GOOGLE_MAPS_API_KEY</code> in <code>.env</code>
              </p>
            </div>
          )}
            <div
              ref={mapRef}
              id="google-map"
              aria-label="Google Map showing polling booths"
              style={{ width: '100%', height: '100%', minHeight: '400px' }}
            />
          </div>
        )}

        {/* Booth list sidebar */}
        {(activeView === 'split' || activeView === 'list') && (
        <div
          className={`${activeView === 'list' ? 'lg:col-span-3' : 'lg:col-span-1'} rounded-2xl overflow-hidden flex flex-col`}
          style={{
            background: 'rgba(22,27,34,0.8)',
            border: '1px solid rgba(255,255,255,0.07)',
            maxHeight: '450px',
          }}
        >
          <div
            className="px-4 py-3 flex items-center gap-2"
            style={{ borderBottom: '1px solid rgba(255,255,255,0.07)' }}
          >
            <List size={15} style={{ color: '#FF9933' }} />
            <span className="font-semibold text-sm text-white">
              Nearby Booths{' '}
              {booths.length > 0 && (
                <span
                  className="ml-1 px-2 py-0.5 rounded-full text-xs"
                  style={{ background: 'rgba(255,153,51,0.2)', color: '#FF9933' }}
                >
                  {booths.length}
                </span>
              )}
            </span>
          </div>

          <div className="flex-1 overflow-y-auto">
            {isLoadingBooths ? (
              <div className="p-4 space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="space-y-2">
                    <div className="skeleton h-4 w-3/4" />
                    <div className="skeleton h-3 w-full" />
                    <div className="skeleton h-3 w-1/2" />
                  </div>
                ))}
              </div>
            ) : booths.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full py-8 gap-3">
                <MapPin size={32} style={{ color: '#8b949e', opacity: 0.5 }} />
                <p className="text-sm text-center px-4" style={{ color: '#8b949e' }}>
                  Search by constituency or use your location to find booths.
                </p>
              </div>
            ) : (
              <div className="divide-y" style={{ borderColor: 'rgba(255,255,255,0.05)' }}>
                {booths.map((booth) => (
                  <BoothListItem
                    key={booth.id}
                    booth={booth}
                    isSelected={selectedBooth?.id === booth.id}
                    onClick={() => handleBoothListClick(booth)}
                  />
                ))}
              </div>
            )}
          </div>
          </div>
        )}
      </div>

      <p className="text-xs text-center" style={{ color: '#484f58' }}>
        ⓘ Booth data shown for demonstration. Verify with{' '}
        <a
          href="https://electoralsearch.eci.gov.in"
          target="_blank"
          rel="noopener noreferrer"
          style={{ color: '#FF9933' }}
        >
          electoralsearch.eci.gov.in
        </a>{' '}
        for official locations.
      </p>
    </div>
  );
}

function BoothListItem({ booth, isSelected, onClick }) {
  return (
    <div
      className="px-4 py-3 cursor-pointer transition-all hover:bg-white/[0.03]"
      style={{
        background: isSelected ? 'rgba(255,153,51,0.07)' : 'transparent',
        borderLeft: isSelected ? '3px solid #FF9933' : '3px solid transparent',
      }}
      onClick={onClick}
      role="button"
      tabIndex={0}
      aria-label={`Select booth: ${booth.name}`}
      onKeyDown={(e) => e.key === 'Enter' && onClick()}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <p
            className="font-semibold text-xs leading-tight mb-1"
            style={{ color: isSelected ? '#FF9933' : '#e6edf3' }}
          >
            {booth.name}
          </p>
          <p className="text-xs leading-relaxed mb-1" style={{ color: '#8b949e' }}>
            {booth.address}
          </p>
          <div className="flex items-center gap-3">
            <span className="text-xs" style={{ color: '#6e7681' }}>
              Booth #{booth.boothNo}
            </span>
            {booth.distance && (
              <span
                className="text-xs px-1.5 py-0.5 rounded"
                style={{ background: 'rgba(255,153,51,0.1)', color: '#FF9933' }}
              >
                📍 {booth.distance}
              </span>
            )}
          </div>
        </div>
        <a
          href={`https://www.google.com/maps/dir/?api=1&destination=${booth.lat},${booth.lng}`}
          target="_blank"
          rel="noopener noreferrer"
          onClick={(e) => e.stopPropagation()}
          aria-label={`Get directions to ${booth.name}`}
          className="flex-shrink-0 p-1.5 rounded-lg transition-all hover:bg-saffron-500/10"
          style={{ color: '#8b949e' }}
        >
          <ExternalLink size={13} />
        </a>
      </div>
    </div>
  );
}

BoothListItem.propTypes = {
  booth: PropTypes.shape({
    id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
    name: PropTypes.string.isRequired,
    address: PropTypes.string.isRequired,
    boothNo: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
    lat: PropTypes.number.isRequired,
    lng: PropTypes.number.isRequired,
    distance: PropTypes.string,
  }).isRequired,
  isSelected: PropTypes.bool.isRequired,
  onClick: PropTypes.func.isRequired,
};

// Dark map styles for Google Maps
const DARK_MAP_STYLES = [
  { elementType: 'geometry', stylers: [{ color: '#212121' }] },
  { elementType: 'labels.icon', stylers: [{ visibility: 'off' }] },
  { elementType: 'labels.text.fill', stylers: [{ color: '#757575' }] },
  { elementType: 'labels.text.stroke', stylers: [{ color: '#212121' }] },
  {
    featureType: 'administrative',
    elementType: 'geometry',
    stylers: [{ color: '#757575' }],
  },
  {
    featureType: 'administrative.country',
    elementType: 'labels.text.fill',
    stylers: [{ color: '#9e9e9e' }],
  },
  {
    featureType: 'administrative.land_parcel',
    stylers: [{ visibility: 'off' }],
  },
  {
    featureType: 'administrative.locality',
    elementType: 'labels.text.fill',
    stylers: [{ color: '#bdbdbd' }],
  },
  {
    featureType: 'poi',
    elementType: 'labels.text.fill',
    stylers: [{ color: '#757575' }],
  },
  {
    featureType: 'poi.park',
    elementType: 'geometry',
    stylers: [{ color: '#181818' }],
  },
  {
    featureType: 'poi.park',
    elementType: 'labels.text.fill',
    stylers: [{ color: '#616161' }],
  },
  {
    featureType: 'poi.park',
    elementType: 'labels.text.stroke',
    stylers: [{ color: '#1b1b1b' }],
  },
  {
    featureType: 'road',
    elementType: 'geometry.fill',
    stylers: [{ color: '#2c2c2c' }],
  },
  {
    featureType: 'road',
    elementType: 'labels.text.fill',
    stylers: [{ color: '#8a8a8a' }],
  },
  {
    featureType: 'road.arterial',
    elementType: 'geometry',
    stylers: [{ color: '#373737' }],
  },
  {
    featureType: 'road.highway',
    elementType: 'geometry',
    stylers: [{ color: '#3c3c3c' }],
  },
  {
    featureType: 'road.highway.controlled_access',
    elementType: 'geometry',
    stylers: [{ color: '#4e4e4e' }],
  },
  {
    featureType: 'road.local',
    elementType: 'labels.text.fill',
    stylers: [{ color: '#616161' }],
  },
  {
    featureType: 'transit',
    elementType: 'labels.text.fill',
    stylers: [{ color: '#757575' }],
  },
  {
    featureType: 'water',
    elementType: 'geometry',
    stylers: [{ color: '#000000' }],
  },
  {
    featureType: 'water',
    elementType: 'labels.text.fill',
    stylers: [{ color: '#3d3d3d' }],
  },
];
