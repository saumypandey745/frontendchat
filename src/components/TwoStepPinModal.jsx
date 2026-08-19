import React, { useState } from 'react';
import { X, KeyRound, ShieldCheck, Loader2 } from 'lucide-react';
import api from '../lib/axios';
import useAuth from '../hooks/useAuth';

const TwoStepPinModal = ({ isOpen, onClose }) => {
  const { user } = useAuth();
  const [pin, setPin] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  if (!isOpen) return null;

  const handleSetup = async (e) => {
    e.preventDefault();
    if (pin.length !== 4) {
      setError('PIN must be exactly 4 digits');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const res = await api.post('/users/two-step-pin', { pin, action: 'setup' });
      if (res.data.success) {
        setSuccess('Two-step verification PIN enabled!');
        setTimeout(() => onClose(), 1200);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Setup failed');
    } finally {
      setLoading(false);
    }
  };

  const handleDisable = async () => {
    setLoading(true);
    try {
      const res = await api.post('/users/two-step-pin', { action: 'disable' });
      if (res.data.success) {
        setSuccess('Two-step verification disabled');
        setTimeout(() => onClose(), 1200);
      }
    } catch (err) {
      setError('Disable failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <h3 className="font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <KeyRound className="w-5 h-5 text-brand-500" /> Two-Step Verification
          </h3>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSetup} className="p-6 space-y-4">
          <p className="text-xs text-slate-500">
            Enter a 4-digit security PIN for extra account security.
          </p>

          {error && <div className="p-3 text-xs bg-red-50 text-red-600 rounded-xl">{error}</div>}
          {success && <div className="p-3 text-xs bg-emerald-50 text-emerald-600 rounded-xl flex items-center gap-2"><ShieldCheck className="w-4 h-4" />{success}</div>}

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">
              4-Digit PIN
            </label>
            <input
              type="password"
              maxLength={4}
              value={pin}
              onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))}
              placeholder="••••"
              className="w-full text-center tracking-widest font-mono text-xl py-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
            />
          </div>

          <div className="flex justify-between items-center pt-2">
            {user?.twoStepEnabled ? (
              <button type="button" onClick={handleDisable} className="text-xs font-bold text-red-500 hover:underline">
                Disable PIN
              </button>
            ) : <div />}

            <div className="flex gap-2">
              <button type="button" onClick={onClose} className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300">
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading || pin.length !== 4}
                className="px-5 py-2 text-xs font-semibold text-white bg-brand-600 hover:bg-brand-700 rounded-xl shadow disabled:opacity-50"
              >
                {loading && <Loader2 className="w-3.5 h-3.5 animate-spin" />} Save PIN
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default TwoStepPinModal;
