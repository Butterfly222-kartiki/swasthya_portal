'use client';

import { useState, useEffect, useRef } from 'react';
import { useLanguage } from '@/lib/LanguageContext';
import { MapPin, Navigation, Search, Loader, Clock, ExternalLink, RefreshCw, Info } from 'lucide-react';

export default function PharmacyPage() {
  const { t } = useLanguage();
  const mapRef = useRef(null);
  const leafletMapRef = useRef(null);
  const markersRef = useRef([]);
  const [location, setLocation] = useState(null);
  const [places, setPlaces] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('pharmacy');
  const [leafletLoaded, setLeafletLoaded] = useState(false);
  const [selectedPlace, setSelectedPlace] = useState(null);
  const [error, setError] = useState('');

  // Load Leaflet CSS + JS dynamically (free, no API key)
  useEffect(() => {
    if (window.L) { setLeafletLoaded(true); return; }
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
    document.head.appendChild(link);
    const script = document.createElement('script');
    script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
    script.onload = () => setLeafletLoaded(true);
    document.head.appendChild(script);
  }, []);

  // Init map once Leaflet loaded + location available
  useEffect(() => {
    if (!leafletLoaded || !location || !mapRef.current) return;
    if (leafletMapRef.current) {
      leafletMapRef.current.setView([location.lat, location.lng], 15);
      return;
    }
    const L = window.L;
    const map = L.map(mapRef.current).setView([location.lat, location.lng], 15);
    leafletMapRef.current = map;

    // OpenStreetMap tiles — free, no API key
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      maxZoom: 19,
    }).addTo(map);

    // User location marker
    const userIcon = L.divIcon({
      html: `<div style="width:14px;height:14px;border-radius:50%;background:#4f46e5;border:3px solid white;box-shadow:0 2px 8px rgba(79,70,229,0.5)"></div>`,
      className: '',
      iconAnchor: [7, 7],
    });
    L.marker([location.lat, location.lng], { icon: userIcon })
      .addTo(map)
      .bindPopup('<b>📍 You are here</b>')
      .openPopup();
  }, [leafletLoaded, location]);

  // Update place markers on map
  useEffect(() => {
    if (!leafletMapRef.current || !window.L) return;
    const L = window.L;
    markersRef.current.forEach(m => m.remove());
    markersRef.current = [];

    places.forEach(place => {
      const isPharmacy = activeTab === 'pharmacy';
      const icon = L.divIcon({
        html: `<div style="width:32px;height:32px;border-radius:50% 50% 50% 0;transform:rotate(-45deg);background:${isPharmacy ? '#f08000' : '#10b981'};border:3px solid white;box-shadow:0 3px 10px rgba(0,0,0,0.3);display:flex;align-items:center;justify-content:center">
          <span style="transform:rotate(45deg);font-size:13px">${isPharmacy ? '💊' : '🏥'}</span>
        </div>`,
        className: '',
        iconAnchor: [16, 32],
        popupAnchor: [0, -32],
      });
      const marker = L.marker([place.lat, place.lng], { icon })
        .addTo(leafletMapRef.current)
        .bindPopup(`
          <div style="font-family:Poppins,sans-serif;min-width:180px;padding:4px 0">
            <b style="color:#1a1a2e;font-size:0.875rem;display:block;margin-bottom:4px">${place.name}</b>
            ${place.address ? `<span style="color:#4a5568;font-size:0.75rem;display:block;margin-bottom:4px">${place.address}</span>` : ''}
            ${place.phone ? `<span style="color:#f08000;font-size:0.75rem;display:block;margin-bottom:4px">📞 ${place.phone}</span>` : ''}
            <a href="https://www.openstreetmap.org/?mlat=${place.lat}&mlon=${place.lng}&zoom=17" target="_blank" style="color:#4f46e5;font-size:0.75rem;text-decoration:none">🗺️ Open in Maps</a>
          </div>
        `);
      markersRef.current.push(marker);
    });
  }, [places, activeTab]);

  const getLocation = () => {
    setLoading(true); setError('');
    navigator.geolocation.getCurrentPosition(
      pos => {
        const loc = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        setLocation(loc);
        fetchNearby(loc, activeTab);
      },
      () => {
        const defaultLoc = { lat: 18.5204, lng: 73.8567 }; // Pune default
        setError('Location access denied — showing Pune as default.');
        setLocation(defaultLoc);
        fetchNearby(defaultLoc, activeTab);
      },
      { timeout: 8000 }
    );
  };

  // Overpass API — free OpenStreetMap data engine
  const fetchNearby = async (loc, tab) => {
    setLoading(true);
    setPlaces([]);
    const amenity = tab === 'pharmacy' ? 'pharmacy' : 'hospital|clinic|doctors';
    const radius = 3000;
    const query = `
      [out:json][timeout:25];
      (
        node["amenity"~"${amenity}"](around:${radius},${loc.lat},${loc.lng});
        way["amenity"~"${amenity}"](around:${radius},${loc.lat},${loc.lng});
      );
      out center 20;
    `;
    try {
      const res = await fetch('https://overpass-api.de/api/interpreter', {
        method: 'POST',
        body: query,
      });
      const data = await res.json();
      const results = data.elements
        .map(el => ({
          id: el.id,
          name: el.tags?.name || (tab === 'pharmacy' ? 'Pharmacy' : 'Clinic'),
          address: [el.tags?.['addr:street'], el.tags?.['addr:city']].filter(Boolean).join(', ') || el.tags?.['addr:full'] || '',
          phone: el.tags?.phone || el.tags?.['contact:phone'] || '',
          lat: el.lat ?? el.center?.lat,
          lng: el.lon ?? el.center?.lon,
          opening_hours: el.tags?.opening_hours || '',
        }))
        .filter(p => p.lat && p.lng);
      setPlaces(results);
      if (leafletMapRef.current && results.length > 0) {
        const L = window.L;
        const bounds = L.latLngBounds([[loc.lat, loc.lng], ...results.map(p => [p.lat, p.lng])]);
        leafletMapRef.current.fitBounds(bounds, { padding: [40, 40] });
      }
    } catch {
      setError('Could not fetch nearby places. Check your connection and try again.');
    }
    setLoading(false);
  };

  const switchTab = (tab) => {
    setActiveTab(tab);
    setSelectedPlace(null);
    if (location) fetchNearby(location, tab);
  };

  const focusPlace = (place) => {
    setSelectedPlace(place);
    if (leafletMapRef.current) {
      leafletMapRef.current.setView([place.lat, place.lng], 17, { animate: true });
      markersRef.current.forEach(m => {
        if (Math.abs(m.getLatLng().lat - place.lat) < 0.0001) m.openPopup();
      });
    }
  };

  const filtered = places.filter(p =>
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.address.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="animate-fade-in">
      <div style={{ marginBottom: 16 }}>
        <h1 style={{ fontFamily: 'Poppins', fontWeight: 800, fontSize: '1.5rem', color: '#1a1a2e' }}>{t('pharmacy')}</h1>
        <p style={{ color: '#4a5568', fontSize: '0.875rem', marginTop: 4 }}>Find pharmacies and clinics near you</p>
      </div>

      {/* Free badge */}
      <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: '#ecfdf5', border: '1px solid #a7f3d0', borderRadius: 20, padding: '5px 14px', marginBottom: 16 }}>
        <Info size={13} color="#10b981" />
        <span style={{ color: '#065f46', fontSize: '0.75rem', fontWeight: 600 }}>
          100% Free · OpenStreetMap + Overpass API · No API key required
        </span>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 8, background: '#f5f5f5', borderRadius: 12, padding: 4, width: 'fit-content', marginBottom: 20 }}>
        {[
          { key: 'pharmacy', label: '💊 Pharmacies' },
          { key: 'clinic', label: '🏥 Clinics & Hospitals' },
        ].map(tab => (
          <button key={tab.key} onClick={() => switchTab(tab.key)} style={{ padding: '8px 20px', borderRadius: 8, border: 'none', fontFamily: 'Poppins', fontWeight: 600, fontSize: '0.85rem', cursor: 'pointer', background: activeTab === tab.key ? 'white' : 'transparent', color: activeTab === tab.key ? '#f08000' : '#4a5568', boxShadow: activeTab === tab.key ? '0 2px 8px rgba(0,0,0,0.1)' : 'none', transition: 'all 0.2s' }}>
            {tab.label}
          </button>
        ))}
      </div>

      {!location ? (
        <div className="card" style={{ textAlign: 'center', padding: '4rem 2rem' }}>
          <div style={{ width: 80, height: 80, borderRadius: '50%', background: 'linear-gradient(135deg,#fff8f0,#ffd9a0)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
            <MapPin size={36} color="#f08000" />
          </div>
          <h3 style={{ fontFamily: 'Poppins', fontWeight: 700, fontSize: '1.2rem', color: '#1a1a2e', marginBottom: 8 }}>
            Find Nearby {activeTab === 'pharmacy' ? 'Pharmacies' : 'Clinics'}
          </h3>
          <p style={{ color: '#4a5568', fontSize: '0.875rem', marginBottom: 8, maxWidth: 400, margin: '0 auto 8px' }}>
            Allow location access to see places near you on an interactive map.
          </p>
          <p style={{ color: '#9ca3af', fontSize: '0.75rem', marginBottom: 24 }}>
            Powered by OpenStreetMap & Overpass API — completely free, no credit card needed.
          </p>
          <button onClick={getLocation} disabled={loading} className="btn-primary" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, opacity: loading ? 0.7 : 1 }}>
            {loading ? <Loader size={16} style={{ animation: 'spin 1s linear infinite' }} /> : <Navigation size={16} />}
            {loading ? 'Getting location...' : t('find_pharmacy')}
          </button>
          {error && (
            <p style={{ color: '#f08000', fontSize: '0.8rem', marginTop: 12, background: '#fff8f0', padding: '8px 16px', borderRadius: 8, display: 'inline-block' }}>
              ⚠️ {error}
            </p>
          )}
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 20, height: 'calc(100vh - 280px)', minHeight: 480 }}>
          {/* Map */}
          <div style={{ borderRadius: 20, overflow: 'hidden', border: '1px solid #f0e8d8', position: 'relative' }}>
            <div ref={mapRef} style={{ width: '100%', height: '100%' }} />

            {/* Refresh button on map */}
            <div style={{ position: 'absolute', top: 12, left: 12, zIndex: 1000 }}>
              <button
                onClick={() => fetchNearby(location, activeTab)}
                disabled={loading}
                style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px', borderRadius: 10, border: 'none', background: 'white', boxShadow: '0 2px 10px rgba(0,0,0,0.15)', cursor: 'pointer', fontFamily: 'Poppins', fontWeight: 600, fontSize: '0.8rem', color: '#1a1a2e' }}
              >
                <RefreshCw size={13} color={loading ? '#f08000' : '#4a5568'} style={{ animation: loading ? 'spin 1s linear infinite' : 'none' }} />
                Refresh
              </button>
            </div>

            {loading && (
              <div style={{ position: 'absolute', inset: 0, background: 'rgba(255,255,255,0.75)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 999 }}>
                <div style={{ textAlign: 'center', background: 'white', padding: '1.5rem 2rem', borderRadius: 16, boxShadow: '0 8px 32px rgba(0,0,0,0.1)' }}>
                  <Loader size={28} color="#f08000" style={{ animation: 'spin 1s linear infinite', display: 'block', margin: '0 auto 10px' }} />
                  <p style={{ fontFamily: 'Poppins', fontWeight: 600, color: '#1a1a2e', fontSize: '0.875rem' }}>Fetching nearby places...</p>
                  <p style={{ fontSize: '0.75rem', color: '#9ca3af', marginTop: 4 }}>via Overpass API (free)</p>
                </div>
              </div>
            )}
          </div>

          {/* Results panel */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, overflow: 'hidden' }}>
            {/* Search */}
            <div style={{ position: 'relative' }}>
              <Search size={14} style={{ position: 'absolute', left: 11, top: '50%', transform: 'translateY(-50%)', color: '#9ca3af' }} />
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder={`Search ${places.length} results...`}
                style={{ width: '100%', padding: '9px 12px 9px 32px', borderRadius: 10, border: '1px solid #f0e8d8', fontSize: '0.85rem', outline: 'none', background: 'white' }}
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '0.8rem', color: '#4a5568', fontWeight: 600 }}>
                {loading ? 'Searching…' : `${filtered.length} found`}
              </span>
              <span style={{ fontSize: '0.7rem', color: '#9ca3af' }}>within 3 km</span>
            </div>

            {/* List */}
            <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 8, paddingRight: 2 }}>
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="skeleton" style={{ height: 90, borderRadius: 12 }} />
                ))
              ) : filtered.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '2.5rem 1rem', color: '#9ca3af' }}>
                  <MapPin size={32} style={{ margin: '0 auto 10px', opacity: 0.3 }} />
                  <p style={{ fontSize: '0.875rem', fontWeight: 600 }}>No results found</p>
                  <p style={{ fontSize: '0.75rem', marginTop: 4 }}>Try refreshing or check your area</p>
                  <button onClick={() => fetchNearby(location, activeTab)} className="btn-outline" style={{ marginTop: 12, padding: '6px 16px', fontSize: '0.8rem' }}>Refresh</button>
                </div>
              ) : filtered.map((place, i) => (
                <div
                  key={place.id || i}
                  onClick={() => focusPlace(place)}
                  style={{
                    background: 'white',
                    border: `2px solid ${selectedPlace?.id === place.id ? '#f08000' : '#f0e8d8'}`,
                    borderRadius: 14, padding: '12px', cursor: 'pointer',
                    transition: 'all 0.2s',
                    boxShadow: selectedPlace?.id === place.id ? '0 4px 16px rgba(240,128,0,0.15)' : 'none',
                  }}
                  onMouseEnter={e => { if (selectedPlace?.id !== place.id) e.currentTarget.style.borderColor = '#ffd9a0'; }}
                  onMouseLeave={e => { if (selectedPlace?.id !== place.id) e.currentTarget.style.borderColor = '#f0e8d8'; }}
                >
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 6 }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 5 }}>
                        <div style={{ width: 26, height: 26, borderRadius: 7, background: activeTab === 'pharmacy' ? '#fff8f0' : '#ecfdf5', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: '0.85rem' }}>
                          {activeTab === 'pharmacy' ? '💊' : '🏥'}
                        </div>
                        <span style={{ fontFamily: 'Poppins', fontWeight: 700, fontSize: '0.82rem', color: '#1a1a2e', lineHeight: 1.3 }}>{place.name}</span>
                      </div>

                      {place.address && (
                        <div style={{ display: 'flex', gap: 4, color: '#4a5568', fontSize: '0.72rem', marginBottom: 3 }}>
                          <MapPin size={10} style={{ flexShrink: 0, marginTop: 1 }} />
                          <span>{place.address}</span>
                        </div>
                      )}

                      {place.phone && (
                        <div style={{ fontSize: '0.72rem', color: '#f08000', fontWeight: 600 }}>📞 {place.phone}</div>
                      )}

                      {place.opening_hours && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: '0.68rem', color: '#4a5568', marginTop: 3 }}>
                          <Clock size={9} />
                          {place.opening_hours.length > 28 ? place.opening_hours.slice(0, 28) + '…' : place.opening_hours}
                        </div>
                      )}
                    </div>

                    <button
                      onClick={e => { e.stopPropagation(); window.open(`https://www.openstreetmap.org/?mlat=${place.lat}&mlon=${place.lng}&zoom=17`, '_blank'); }}
                      title="Open in OpenStreetMap"
                      style={{ width: 28, height: 28, borderRadius: 7, border: '1px solid #f0e8d8', background: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}
                    >
                      <ExternalLink size={12} color="#4a5568" />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Attribution */}
            <div style={{ fontSize: '0.68rem', color: '#9ca3af', textAlign: 'center', paddingTop: 4 }}>
              Map © <a href="https://openstreetmap.org" target="_blank" rel="noreferrer" style={{ color: '#4f46e5' }}>OpenStreetMap</a> · Data via <a href="https://overpass-api.de" target="_blank" rel="noreferrer" style={{ color: '#4f46e5' }}>Overpass API</a>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        .leaflet-popup-content-wrapper { border-radius: 12px !important; box-shadow: 0 8px 24px rgba(0,0,0,0.15) !important; }
        .leaflet-popup-content { margin: 12px 14px !important; }
        @media (max-width: 900px) {
          .map-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  );
}
