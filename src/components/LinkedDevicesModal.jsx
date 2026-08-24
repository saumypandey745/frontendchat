import React, { useState, useEffect } from 'react';
import { X, Laptop, Smartphone, QrCode, RefreshCw, LogOut, Check, Loader2, ShieldCheck, AlertCircle, Copy } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import api from '../lib/axios';

const LinkedDevicesModal = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState('sessions'); // 'sessions' | 'pair' | 'scan'
  const [devices, setDevices] = useState([]);
  const [loading, setLoading] = useState(false);

  // Pairing QR State
  const [pairingToken, setPairingToken] = useState('');
  const [timeLeft, setTimeLeft] = useState(60);
  const [loadingToken, setLoadingToken] = useState(false);
  const [copiedToken, setCopiedToken] = useState(false);

  // Manual Scan / Submit Token State
  const [scanToken, setScanToken] = useState('');
  const [linking, setLinking] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const fetchDevices = async () => {
    setLoading(true);
    try {
      const res = await api.get('/devices');
      if (res.data?.success) {
        setDevices(res.data.devices || []);
      }
    } catch (err) {
      console.error('Failed to fetch linked devices:', err);
    } finally {
      setLoading(false);
    }
  };

  const generatePairingToken = async () => {
    setLoadingToken(true);
    setError('');
    try {
      const res = await api.post('/devices/generate-pairing-token');
      if (res.data?.success) {
        setPairingToken(res.data.token);
        setTimeLeft(60);
      }
    } catch (err) {
      console.error('Generate pairing token error:', err);
      setError('Failed to generate pairing QR code. Please try again.');
    } finally {
      setLoadingToken(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchDevices();
      setActiveTab('sessions');
      setError('');
      setSuccess('');
    }
  }, [isOpen]);

  // Countdown timer for 60s pairing token
  useEffect(() => {
    let timer;
    if (activeTab === 'pair' && pairingToken && timeLeft > 0) {
      timer = setInterval(() => setTimeLeft((prev) => prev - 1), 1000);
    } else if (timeLeft === 0 && activeTab === 'pair') {
      setPairingToken('');
    }
    return () => clearInterval(timer);
  }, [activeTab, pairingToken, timeLeft]);

  if (!isOpen) return null;

  const handleRevokeDevice = async (deviceId) => {
    if (!window.confirm('Log out this linked device?')) return;
    try {
      await api.delete(`/devices/${deviceId}`);
      await fetchDevices();
    } catch (err) {
      console.error('Revoke device error:', err);
    }
  };

  const handleCopyToken = () => {
    if (!pairingToken) return;
    navigator.clipboard.writeText(pairingToken);
    setCopiedToken(true);
    setTimeout(() => setCopiedToken(false), 2000);
  };

  const handleLinkDeviceSubmit = async (e) => {
    e.preventDefault();
    if (!scanToken.trim()) return;

    setLinking(true);
    setError('');
    setSuccess('');

    try {
      const res = await api.post('/devices/link', {
        token: scanToken.trim(),
        deviceName: `${navigator.userAgent.includes('Mobile') ? 'Mobile Browser' : 'Desktop Browser'} (${navigator.platform})`,
      });

      if (res.data?.success) {
        setSuccess('Device linked successfully! Session is now active.');
        setScanToken('');
        await fetchDevices();
        setTimeout(() => {
          setActiveTab('sessions');
          setSuccess('');
        }, 1500);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to link device');
    } finally {
      setLinking(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[85vh]">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
            <Laptop className="w-5 h-5 text-brand-500" />
            Linked Devices
          </h3>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Selection */}
        <div className="flex border-b border-slate-200 dark:border-slate-800 text-xs font-bold bg-slate-50/50 dark:bg-slate-800/30">
          <button
            onClick={() => setActiveTab('sessions')}
            className={`flex-1 py-3 text-center transition-colors border-b-2 ${
              activeTab === 'sessions'
                ? 'border-brand-500 text-brand-600 dark:text-brand-400 bg-brand-50/50 dark:bg-brand-950/20'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            💻 Active Sessions ({devices.length})
          </button>
          <button
            onClick={() => {
              setActiveTab('pair');
              generatePairingToken();
            }}
            className={`flex-1 py-3 text-center transition-colors border-b-2 ${
              activeTab === 'pair'
                ? 'border-brand-500 text-brand-600 dark:text-brand-400 bg-brand-50/50 dark:bg-brand-950/20'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            🔲 Link a Device
          </button>
          <button
            onClick={() => setActiveTab('scan')}
            className={`flex-1 py-3 text-center transition-colors border-b-2 ${
              activeTab === 'scan'
                ? 'border-brand-500 text-brand-600 dark:text-brand-400 bg-brand-50/50 dark:bg-brand-950/20'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            🔑 Enter Token
          </button>
        </div>

        {/* Alerts */}
        {error && (
          <div className="m-4 p-3 rounded-2xl bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-800/50 text-red-600 dark:text-red-400 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}
        {success && (
          <div className="m-4 p-3 rounded-2xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800/50 text-emerald-600 dark:text-emerald-400 text-xs flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 flex-shrink-0" />
            <span>{success}</span>
          </div>
        )}

        {/* Tab 1: Active Sessions */}
        {activeTab === 'sessions' && (
          <div className="flex-1 overflow-y-auto p-5 space-y-3 custom-scrollbar">
            {loading ? (
              <div className="flex justify-center py-12">
                <Loader2 className="w-6 h-6 animate-spin text-brand-500" />
              </div>
            ) : devices.length === 0 ? (
              <div className="text-center py-12 space-y-3">
                <Laptop className="w-12 h-12 text-slate-300 dark:text-slate-700 mx-auto" />
                <p className="text-sm font-semibold text-slate-600 dark:text-slate-400">
                  No linked devices registered
                </p>
                <button
                  onClick={() => {
                    setActiveTab('pair');
                    generatePairingToken();
                  }}
                  className="px-4 py-2 bg-brand-600 text-white text-xs font-bold rounded-xl shadow"
                >
                  Link New Device via QR Code
                </button>
              </div>
            ) : (
              devices.map((dev) => (
                <div
                  key={dev._id}
                  className="p-4 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/60 rounded-2xl flex items-center justify-between"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-brand-500/10 text-brand-500 rounded-xl">
                      <Laptop className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="font-bold text-xs text-slate-900 dark:text-slate-100">
                        {dev.deviceName}
                      </h4>
                      <p className="text-[10px] text-slate-400 font-mono mt-0.5">
                        IP: {dev.ipAddress} • {new Date(dev.lastActive).toLocaleDateString()}
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={() => handleRevokeDevice(dev._id)}
                    className="p-2 text-slate-400 hover:text-red-500 rounded-xl hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                    title="Log Out Device"
                  >
                    <LogOut className="w-4 h-4" />
                  </button>
                </div>
              ))
            )}
          </div>
        )}

        {/* Tab 2: Pair Device QR Code */}
        {activeTab === 'pair' && (
          <div className="flex-1 overflow-y-auto p-6 text-center space-y-4 custom-scrollbar">
            <div>
              <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                Scan QR Code to Link Device
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Open ChatWave on secondary device and scan this single-use code
              </p>
            </div>

            <div className="p-4 bg-white rounded-3xl inline-block shadow-xl border border-slate-200 dark:border-slate-700 relative">
              {loadingToken ? (
                <div className="w-48 h-48 flex flex-col items-center justify-center space-y-2">
                  <Loader2 className="w-8 h-8 animate-spin text-brand-500" />
                  <span className="text-xs text-slate-400">Generating fresh QR code...</span>
                </div>
              ) : pairingToken && timeLeft > 0 ? (
                <div className="p-2 bg-white rounded-2xl flex flex-col items-center">
                  <QRCodeSVG
                    value={pairingToken}
                    size={192}
                    level="H"
                    includeMargin={true}
                  />
                </div>
              ) : (
                <div className="w-48 h-48 flex flex-col items-center justify-center space-y-3 p-4">
                  <AlertCircle className="w-8 h-8 text-amber-500" />
                  <p className="text-xs text-red-500 font-bold">QR Token Expired</p>
                  <button
                    onClick={generatePairingToken}
                    className="px-4 py-2 bg-brand-600 hover:bg-brand-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-lg active:scale-95 transition-all"
                  >
                    <RefreshCw className="w-4 h-4" /> Refresh QR Code
                  </button>
                </div>
              )}
            </div>

            {pairingToken && timeLeft > 0 && (
              <div className="space-y-3">
                <div className="flex items-center justify-between px-4 py-2 bg-slate-100 dark:bg-slate-800/80 rounded-2xl text-xs">
                  <span className="font-semibold text-slate-600 dark:text-slate-300">
                    Expires in: <span className="text-amber-600 dark:text-amber-400 font-bold font-mono">{timeLeft}s</span>
                  </span>
                  <button
                    onClick={generatePairingToken}
                    disabled={loadingToken}
                    className="text-brand-600 dark:text-brand-400 hover:underline font-bold flex items-center gap-1"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${loadingToken ? 'animate-spin' : ''}`} /> Refresh QR
                  </button>
                </div>

                {/* Display pairing token text for manual entry fallback */}
                <div className="p-2.5 bg-slate-100 dark:bg-slate-800/60 rounded-2xl flex items-center justify-between text-xs font-mono text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                  <span className="truncate max-w-[220px] select-all">{pairingToken}</span>
                  <button
                    onClick={handleCopyToken}
                    className="px-2.5 py-1 bg-brand-500/10 hover:bg-brand-500/20 text-brand-600 dark:text-brand-400 rounded-lg font-sans text-[11px] font-bold transition-all flex items-center gap-1"
                  >
                    {copiedToken ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                    {copiedToken ? 'Copied!' : 'Copy'}
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Tab 3: Enter Token to Link */}
        {activeTab === 'scan' && (
          <form onSubmit={handleLinkDeviceSubmit} className="flex-1 overflow-y-auto p-6 space-y-4 custom-scrollbar">
            <div>
              <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                Link Session via Pairing Token
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Paste the 60-second single-use pairing token from your primary device
              </p>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">
                Single-Use Pairing Token
              </label>
              <input
                type="text"
                value={scanToken}
                onChange={(e) => setScanToken(e.target.value)}
                placeholder="Paste 32-character pairing token..."
                className="w-full px-4 py-2.5 text-xs font-mono rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-brand-500"
                required
              />
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setActiveTab('sessions')}
                className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={linking || !scanToken.trim()}
                className="px-5 py-2 text-xs font-semibold text-white bg-brand-600 hover:bg-brand-700 rounded-xl flex items-center gap-2 shadow disabled:opacity-50"
              >
                {linking ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                Link Device Now
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default LinkedDevicesModal;
