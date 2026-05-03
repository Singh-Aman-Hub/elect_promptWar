import { useState, useEffect, useRef, useCallback } from 'react';
import { MapPin, Navigation, List, Search, ExternalLink, Loader2 } from 'lucide-react';
import PropTypes from 'prop-types';
import { fetchPollingBooths } from '../services/searchService';
import { getUserLocation } from '../services/mapsService';

const DELHI_CENTER = { lat: 28.6139, lng: 77.209 };

/**
 * Load Google Maps using the modern importLibrary pattern.
 * Returns { Map, InfoWindow, LatLngBounds, AdvancedMarkerElement, PinElement }
 */
async function loadMapsLibraries() {
  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
  if (!apiKey || apiKey === 'your_google_maps_api_key_here') {
    throw new Error('Google Maps API key not configured');
  }

  // Inject the bootstrap script once
  if (!window.google?.maps) {
    await new Promise((resolve, reject) => {
      if (document.getElementById('gmap-bootstrap')) {
        // Already injecting — wait for it
        const poll = setInterval(() => {
          if (window.google?.maps) { clearInterval(poll); resolve(); }
        }, 50);
        return;
      }
      const s = document.createElement('script');
      s.id = 'gmap-bootstrap';
      s.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&v=weekly&libraries=marker&loading=async`;
      s.async = true;
      s.onload = resolve;
      s.onerror = () => reject(new Error('Failed to load Google Maps script'));
      document.head.appendChild(s);
    });
  }

  const { Map, InfoWindow, LatLngBounds } = await window.google.maps.importLibrary('maps');
  const { AdvancedMarkerElement, PinElement } = await window.google.maps.importLibrary('marker');

  return { Map, InfoWindow, LatLngBounds, AdvancedMarkerElement, PinElement };
}

/**
 * BoothLocator — Google Maps integration for polling booth discovery
 */
export default function BoothLocator() {
  const [booths, setBooths] = useState([]);
  const [selectedBooth, setSelectedBooth] = useState(null);
  const [isLoadingBooths, setIsLoadingBooths] = useState(false);
  const [isLoadingMap, setIsLoadingMap] = useState(true);
  const [mapError, setMapError] = useState(null);
  const [boothError, setBoothError] = useState(null);
  const [searchText, setSearchText] = useState('');
  const [activeView, setActiveView] = useState('split');

  const mapRef = useRef(null);
  const googleMapRef = useRef(null);
  const markersRef = useRef([]);
  const infoWindowRef = useRef(null);
  const libsRef = useRef(null);

  // ── Clear + place AdvancedMarkers ─────────────────────────────────────────
  const placeMarkers = useCallback((boothList) => {
    markersRef.current.forEach((m) => { m.map = null; });
    markersRef.current = [];

    if (!libsRef.current || !googleMapRef.current) return;
    const { AdvancedMarkerElement, PinElement } = libsRef.current;

    boothList.forEach((booth) => {
      const pin = new PinElement({
        background: '#FF9933',
        borderColor: '#ffffff',
        glyphColor: '#ffffff',
        scale: 0.9,
      });

      const marker = new AdvancedMarkerElement({
        map: googleMapRef.current,
        position: { lat: booth.lat, lng: booth.lng },
        title: booth.name,
        content: pin,
      });

      marker.addListener('gmp-click', () => {
        setSelectedBooth(booth);
        infoWindowRef.current.setContent(`
          <div style="font-family:Inter,sans-serif;padding:8px;min-width:200px">
            <h3 style="font-weight:700;color:#FF9933;margin-bottom:6px;font-size:13px">${booth.name}</h3>
            <p style="font-size:12px;color:#555;margin-bottom:4px">📍 ${booth.address}</p>
            <p style="font-size:12px;color:#555;margin-bottom:4px">🗳️ Booth No: ${booth.boothNo}</p>
            <p style="font-size:12px;color:#555;margin-bottom:8px">⏰ ${booth.timings}</p>
            <a href="https://www.google.com/maps/dir/?api=1&destination=${booth.lat},${booth.lng}"
               target="_blank" rel="noopener noreferrer"
               style="background:#FF9933;color:white;padding:5px 12px;border-radius:6px;text-decoration:none;font-size:12px;font-weight:600">
              Get Directions →
            </a>
          </div>
        `);
        infoWindowRef.current.open({ map: googleMapRef.current, anchor: marker });
      });

      markersRef.current.push(marker);
    });

    if (boothList.length > 0) {
      const { LatLngBounds } = libsRef.current;
      const bounds = new LatLngBounds();
      boothList.forEach((b) => bounds.extend({ lat: b.lat, lng: b.lng }));
      googleMapRef.current.fitBounds(bounds, 60);
    }
  }, []);

  const loadBoothsByLocation = useCallback(async (lat, lng) => {
    setIsLoadingBooths(true);
    setBoothError(null);
    try {
      const fetched = await fetchPollingBooths({ lat, lng });
      setBooths(fetched);
      try { placeMarkers(fetched); } catch { /* marker errors don't affect booth list */ }
    } catch (err) {
      setBoothError('Failed to load booths. Please try again.');
      console.error('[BoothLocator] fetchPollingBooths error:', err);
    } finally {
      setIsLoadingBooths(false);
    }
  }, [placeMarkers]);

  // ── Initialize map once ───────────────────────────────────────────────────
  useEffect(() => {
    let cancelled = false;

    loadMapsLibraries()
      .then((libs) => {
        if (cancelled || !mapRef.current) return;
        libsRef.current = libs;

        const mapId = import.meta.env.VITE_GOOGLE_MAPS_MAP_ID || 'DEMO_MAP_ID';

        googleMapRef.current = new libs.Map(mapRef.current, {
          center: DELHI_CENTER,
          zoom: 13,
          mapId,
          zoomControl: true,
          mapTypeControl: false,
          streetViewControl: false,
          fullscreenControl: true,
        });

        infoWindowRef.current = new libs.InfoWindow();
        setIsLoadingMap(false);
        loadBoothsByLocation(DELHI_CENTER.lat, DELHI_CENTER.lng);
      })
      .catch((err) => {
        if (cancelled) return;
        setMapError(err.message);
        setIsLoadingMap(false);
        loadBoothsByLocation(DELHI_CENTER.lat, DELHI_CENTER.lng);
      });

    return () => { cancelled = true; };
  }, [loadBoothsByLocation]);

  // ── Handlers ──────────────────────────────────────────────────────────────
  const handleUseMyLocation = async () => {
    try {
      setIsLoadingBooths(true);
      const { lat, lng } = await getUserLocation();
      googleMapRef.current?.setCenter({ lat, lng });
      googleMapRef.current?.setZoom(14);
      await loadBoothsByLocation(lat, lng);
    } catch {
      setBoothError('Location access denied. Please search by constituency name.');
      setIsLoadingBooths(false);
    }
  };

  const handleConstituencySearch = async (e) => {
    e.preventDefault();
    if (!searchText.trim()) return;
    setIsLoadingBooths(true);
    setBoothError(null);
    try {
      const fetched = await fetchPollingBooths({ constituency: searchText });
      setBooths(fetched);
      if (googleMapRef.current && fetched.length > 0) {
        try { placeMarkers(fetched); } catch { /* marker errors don't affect booth list */ }
      }
    } catch {
      setBoothError('Failed to search booths. Please try again.');
    } finally {
      setIsLoadingBooths(false);
    }
  };

  const handleBoothListClick = (booth) => {
    setSelectedBooth(booth);
    googleMapRef.current?.setCenter({ lat: booth.lat, lng: booth.lng });
    googleMapRef.current?.setZoom(16);
  };

  // ── Render ────────────────────────────────────────────────────────────────
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
              className="absolute left-3 top-1/2 -translate-y-1/2 z-10 pointer-events-none"
              style={{ color: '#8b949e' }}
            />
            <input
              id="constituency-search"
              type="text"
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              placeholder="Search by constituency..."
              aria-label="Search by constituency name"
              className="w-full h-full pl-9 pr-4 rounded-xl text-sm outline-none transition-all"
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
            style={{ background: 'linear-gradient(135deg, #FF9933, #e85c00)', color: 'white' }}
          >
            Search
          </button>
        </form>

        {/* View Toggles */}
        <div
          className="flex items-center gap-1 p-1 rounded-xl flex-shrink-0 h-[42px]"
          style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}
        >
          {['split', 'map', 'list'].map((v) => (
            <button
              key={v}
              type="button"
              onClick={() => setActiveView(v)}
              className={`px-3 h-full rounded-lg text-xs font-semibold transition-all capitalize ${
                activeView === v ? 'bg-[#FF9933] text-white' : 'text-[#8b949e] hover:text-white'
              }`}
            >
              {v}
            </button>
          ))}
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
          {mapError ? `⚠️ Maps API: ${mapError} — Showing booth list only.` : `❌ ${boothError}`}
        </div>
      )}

      {/* Map + List grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4" style={{ minHeight: '450px' }}>
        {/* Map panel */}
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
                <p className="text-sm" style={{ color: '#8b949e' }}>Loading Google Maps...</p>
              </div>
            )}
            {mapError && (
              <div
                className="absolute inset-0 m-6 flex flex-col items-center justify-center gap-3 rounded-2xl"
                style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)' }}
              >
                <MapPin size={48} style={{ color: '#FF9933', opacity: 0.4 }} />
                <h3 className="text-lg font-semibold text-white">Map unavailable</h3>
                <p className="text-sm text-center px-8" style={{ color: '#8b949e' }}>
                  Google Maps requires a valid API key.<br />
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

// ── Booth list item ───────────────────────────────────────────────────────────
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

// Dark map styles (used when no mapId is configured)
const DARK_MAP_STYLES = [
  { elementType: 'geometry', stylers: [{ color: '#212121' }] },
  { elementType: 'labels.icon', stylers: [{ visibility: 'off' }] },
  { elementType: 'labels.text.fill', stylers: [{ color: '#757575' }] },
  { elementType: 'labels.text.stroke', stylers: [{ color: '#212121' }] },
  { featureType: 'administrative', elementType: 'geometry', stylers: [{ color: '#757575' }] },
  { featureType: 'administrative.country', elementType: 'labels.text.fill', stylers: [{ color: '#9e9e9e' }] },
  { featureType: 'administrative.land_parcel', stylers: [{ visibility: 'off' }] },
  { featureType: 'administrative.locality', elementType: 'labels.text.fill', stylers: [{ color: '#bdbdbd' }] },
  { featureType: 'poi', elementType: 'labels.text.fill', stylers: [{ color: '#757575' }] },
  { featureType: 'poi.park', elementType: 'geometry', stylers: [{ color: '#181818' }] },
  { featureType: 'poi.park', elementType: 'labels.text.fill', stylers: [{ color: '#616161' }] },
  { featureType: 'poi.park', elementType: 'labels.text.stroke', stylers: [{ color: '#1b1b1b' }] },
  { featureType: 'road', elementType: 'geometry.fill', stylers: [{ color: '#2c2c2c' }] },
  { featureType: 'road', elementType: 'labels.text.fill', stylers: [{ color: '#8a8a8a' }] },
  { featureType: 'road.arterial', elementType: 'geometry', stylers: [{ color: '#373737' }] },
  { featureType: 'road.highway', elementType: 'geometry', stylers: [{ color: '#3c3c3c' }] },
  { featureType: 'road.highway.controlled_access', elementType: 'geometry', stylers: [{ color: '#4e4e4e' }] },
  { featureType: 'road.local', elementType: 'labels.text.fill', stylers: [{ color: '#616161' }] },
  { featureType: 'transit', elementType: 'labels.text.fill', stylers: [{ color: '#757575' }] },
  { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#000000' }] },
  { featureType: 'water', elementType: 'labels.text.fill', stylers: [{ color: '#3d3d3d' }] },
];
