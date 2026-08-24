import React, { useState } from 'react';
import { X, MapPin, Navigation, Send, Loader2, Radio } from 'lucide-react';

const LocationPickerModal = ({ isOpen, onClose, onSendLocation }) => {
  const [activeTab, setActiveTab] = useState('static'); // 'static' | 'live'
  const [lat, setLat] = useState(37.7749);
  const [lng, setLng] = useState(-122.4194);
  const [address, setAddress] = useState('San Francisco, CA, USA');
  const [liveDuration, setLiveDuration] = useState(3600); // default 1 hour in seconds
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleGetCurrentLocation = () => {
    if (navigator.geolocation) {
      setLoading(true);
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLat(position.coords.latitude);
          setLng(position.coords.longitude);
          setAddress(`GPS Location (${position.coords.latitude.toFixed(4)}, ${position.coords.longitude.toFixed(4)})`);
          setLoading(false);
        },
        (err) => {
          alert('Could not retrieve current location.');
          setLoading(false);
        }
      );
    }
  };

  const handleSend = () => {
    if (activeTab === 'live') {
      onSendLocation({
        latitude: lat,
        longitude: lng,
        address: address || 'Live Location',
        isLive: true,
        liveDuration,
      });
    } else {
      onSendLocation({
        latitude: lat,
        longitude: lng,
        address,
        isLive: false,
      });
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <h3 className="font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <MapPin className="w-5 h-5 text-brand-500" />
            Share Location
          </h3>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Selection */}
        <div className="flex border-b border-slate-200 dark:border-slate-800 text-xs font-bold">
          <button
            onClick={() => setActiveTab('static')}
            className={`flex-1 py-2.5 text-center transition-colors border-b-2 ${
              activeTab === 'static'
                ? 'border-brand-500 text-brand-600 dark:text-brand-400 bg-brand-50/50 dark:bg-brand-950/30'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            📍 Send Current Location
          </button>
          <button
            onClick={() => setActiveTab('live')}
            className={`flex-1 py-2.5 text-center transition-colors border-b-2 ${
              activeTab === 'live'
                ? 'border-red-500 text-red-600 dark:text-red-400 bg-red-50/50 dark:bg-red-950/30'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            🔴 Share Live Location
          </button>
        </div>

        <div className="p-6 space-y-4">
          <div className="w-full h-40 bg-slate-100 dark:bg-slate-800 rounded-2xl flex flex-col items-center justify-center border border-slate-200 dark:border-slate-700 relative overflow-hidden">
            <div className="relative">
              <MapPin className="w-9 h-9 text-red-500 animate-bounce mb-1" />
              {activeTab === 'live' && (
                <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-600 rounded-full animate-ping" />
              )}
            </div>
            <p className="text-xs font-bold text-slate-800 dark:text-slate-200 px-4 text-center">{address}</p>
            <p className="text-[10px] text-slate-500">Lat: {lat}, Lng: {lng}</p>
          </div>

          <button
            type="button"
            onClick={handleGetCurrentLocation}
            disabled={loading}
            className="w-full py-2.5 px-4 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-800 dark:text-slate-200 text-xs font-semibold rounded-xl flex items-center justify-center gap-2 border border-slate-200 dark:border-slate-700"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin text-brand-500" /> : <Navigation className="w-4 h-4 text-brand-500" />}
            Use My Current GPS Location
          </button>

          {activeTab === 'live' ? (
            <div className="space-y-2 pt-1">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                Share Live Location Duration
              </label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { label: '15 Minutes', value: 900 },
                  { label: '1 Hour', value: 3600 },
                  { label: '8 Hours', value: 28800 },
                ].map((dur) => (
                  <button
                    key={dur.value}
                    type="button"
                    onClick={() => setLiveDuration(dur.value)}
                    className={`py-2 px-3 text-xs font-bold rounded-xl border transition-all ${
                      liveDuration === dur.value
                        ? 'bg-red-600 text-white border-red-600 shadow-md shadow-red-600/30'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    {dur.label}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">
                Location Name / Address
              </label>
              <input
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className="w-full px-4 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs text-slate-900 dark:text-slate-100"
              />
            </div>
          )}

          <div className="flex justify-end gap-3 pt-2">
            <button onClick={onClose} className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300">
              Cancel
            </button>
            <button
              onClick={handleSend}
              className={`px-5 py-2 text-xs font-semibold text-white rounded-xl flex items-center gap-2 shadow ${
                activeTab === 'live' ? 'bg-red-600 hover:bg-red-700' : 'bg-brand-600 hover:bg-brand-700'
              }`}
            >
              <Send className="w-3.5 h-3.5" />
              {activeTab === 'live' ? 'Share Live Location' : 'Send Location'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LocationPickerModal;
