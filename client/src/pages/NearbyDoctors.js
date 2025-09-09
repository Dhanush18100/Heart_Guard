import React, { useEffect, useState } from 'react';
import { MapPin, Phone, Globe, Star, Loader2, AlertTriangle, Search, Crosshair } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

const NearbyDoctors = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [places, setPlaces] = useState([]);
  const [type, setType] = useState('doctor');
  const [radius, setRadius] = useState(10);
  const [latitude, setLatitude] = useState('');
  const [longitude, setLongitude] = useState('');
  const [debug, setDebug] = useState([]);

  const fetchPlaces = async () => {
    try {
      setLoading(true);
      setError('');
      const params = new URLSearchParams({ type, radius: String(radius), latitude, longitude });
      const resp = await fetch(`/api/user/nearby-doctors?${params.toString()}`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      const data = await resp.json();
      if (!resp.ok) throw new Error(data?.message || 'Failed to fetch');
      setPlaces(Array.isArray(data?.places) ? data.places : (Array.isArray(data) ? data : []));
      setDebug(Array.isArray(data?.debug) ? data.debug : []);
      if (data?.note) setError(data.note);
    } catch (e) {
      setError(e.message || 'Failed to fetch nearby places');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!latitude || !longitude) {
      // Try profile location first
      const coords = user?.location?.coordinates;
      if (Array.isArray(coords) && coords.length === 2) {
        setLongitude(String(coords[0]));
        setLatitude(String(coords[1]));
        return;
      }
      // Fall back to browser geolocation
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition((pos) => {
          setLatitude(String(pos.coords.latitude));
          setLongitude(String(pos.coords.longitude));
        }, () => setLoading(false));
      } else {
        setLoading(false);
      }
    }
  }, [latitude, longitude, user]);

  useEffect(() => {
    if (latitude && longitude) fetchPlaces();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [type, radius, latitude, longitude]);

  const PlaceCard = ({ place }) => (
    <div className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
      <h3 className="font-semibold text-gray-900 mb-1">{place.name}</h3>
      {place.rating && (
        <div className="flex items-center text-sm text-yellow-600 mb-2">
          <Star className="w-4 h-4 mr-1" /> {place.rating}
        </div>
      )}
      <div className="space-y-1 text-sm text-gray-600">
        {place.address && (
          <div className="flex items-center">
            <MapPin className="w-4 h-4 mr-2" />
            <span>{place.address}</span>
          </div>
        )}
        {place.phone && (
          <div className="flex items-center">
            <Phone className="w-4 h-4 mr-2" />
            <span>{place.phone}</span>
          </div>
        )}
        {place.website && (
          <div className="flex items-center">
            <Globe className="w-4 h-4 mr-2" />
            <a href={place.website} className="text-blue-600 hover:underline" target="_blank" rel="noreferrer">Website</a>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <div className="flex flex-wrap items-end gap-4">
            <div>
              <label className="block text-sm text-gray-600 mb-1">Type</label>
              <select value={type} onChange={(e) => setType(e.target.value)} className="input">
                <option value="doctor">Doctors</option>
                <option value="hospital">Hospitals</option>
              </select>
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-1">Radius (km)</label>
              <input type="number" className="input w-28" min={1} max={50} value={radius} onChange={(e) => setRadius(Number(e.target.value))} />
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-1">Latitude</label>
              <input type="text" className="input w-40" value={latitude} onChange={(e) => setLatitude(e.target.value)} />
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-1">Longitude</label>
              <input type="text" className="input w-40" value={longitude} onChange={(e) => setLongitude(e.target.value)} />
            </div>
            <button onClick={fetchPlaces} className="btn btn-primary">
              <Search className="w-4 h-4 mr-2" /> Search
            </button>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => {
                const coords = user?.location?.coordinates;
                if (Array.isArray(coords) && coords.length === 2) {
                  setLongitude(String(coords[0]));
                  setLatitude(String(coords[1]));
                }
              }}
            >
              <Crosshair className="w-4 h-4 mr-2" /> Use Profile Location
            </button>
            <button
              type="button"
              className="btn btn-outline"
              onClick={() => {
                setLatitude('40.7484');
                setLongitude('-73.9857');
              }}
            >
              Use Sample (NYC)
            </button>
          </div>
        </div>

        {error && (
          <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 rounded-lg p-4 mb-6 flex items-start">
            <AlertTriangle className="w-5 h-5 mr-2 mt-0.5" />
            <div>
              <p className="text-sm">{error}</p>
              <p className="text-xs text-yellow-700 mt-1">If results are empty: set your location in Profile, allow browser location, or enter coordinates above. If the API key is not set on the server, only an empty list will be shown.</p>
            </div>
          </div>
        )}

        {loading ? (
          <div className="text-center py-16">
            <Loader2 className="w-8 h-8 text-blue-600 animate-spin mx-auto mb-3" />
            <p className="text-gray-600">Finding nearby places...</p>
          </div>
        ) : places.length === 0 ? (
          <div className="text-center py-16">
            <MapPin className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-600">No results found for the selected filters.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {places.map((p) => (
              <PlaceCard key={p.id || p.name} place={p} />
            ))}
          </div>
        )}

        {!loading && places.length === 0 && (
          <div className="mt-6 bg-white rounded-lg shadow p-4">
            <h4 className="font-semibold text-gray-900 mb-2">Troubleshooting</h4>
            <ul className="list-disc pl-5 text-sm text-gray-700 space-y-1">
              <li>Try increasing the radius and click Search again.</li>
              <li>Verify latitude/longitude are valid numbers.</li>
              <li>Click "Use Sample (NYC)" to test with a known location.</li>
            </ul>
            {debug && debug.length > 0 && (
              <div className="mt-3">
                <p className="text-xs text-gray-500">Query debug info:</p>
                <pre className="text-xs bg-gray-50 p-2 rounded border border-gray-200 overflow-auto max-h-40">{JSON.stringify(debug, null, 2)}</pre>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default NearbyDoctors;
