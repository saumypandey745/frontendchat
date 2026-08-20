import React from 'react';
import { ShieldAlert, X, Settings } from 'lucide-react';
import useCall from '../hooks/useCall';

const PermissionErrorModal = () => {
  const { permissionError, clearPermissionError } = useCall();

  if (!permissionError) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-950/75 backdrop-blur-md animate-fade-in">
      <div className="w-full max-w-sm bg-white dark:bg-slate-900 rounded-t-3xl sm:rounded-3xl p-6 border-t sm:border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4 text-center">
        <div className="w-14 h-14 rounded-2xl bg-amber-500/10 text-amber-500 flex items-center justify-center mx-auto">
          <ShieldAlert className="w-8 h-8" />
        </div>

        <div>
          <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">
            Permission Required
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 leading-relaxed">
            {permissionError.message ||
              'Access to your camera or microphone was blocked. Please grant permissions in your browser settings to place or receive calls.'}
          </p>
        </div>

        <div className="p-3 bg-slate-100 dark:bg-slate-800/60 rounded-2xl text-[11px] text-slate-600 dark:text-slate-300 text-left space-y-1">
          <p className="font-bold flex items-center gap-1">
            <Settings className="w-3.5 h-3.5 text-brand-500" /> How to allow permissions:
          </p>
          <ol className="list-decimal list-inside space-y-0.5 text-[10px] text-slate-500 dark:text-slate-400 pl-1">
            <li>Click the padlocked / settings icon near your browser address bar.</li>
            <li>Toggle <strong>Camera</strong> & <strong>Microphone</strong> to <strong>Allow</strong>.</li>
            <li>Reload or try the call again.</li>
          </ol>
        </div>

        <button
          onClick={clearPermissionError}
          className="w-full min-h-[44px] py-3 bg-brand-600 hover:bg-brand-500 text-white text-xs font-bold rounded-2xl shadow-md transition-all active:scale-95 flex items-center justify-center"
        >
          Got It
        </button>
      </div>
    </div>
  );
};

export default PermissionErrorModal;
