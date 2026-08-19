import React, { useEffect, useRef } from 'react';
import useAuth from '../hooks/useAuth';

const GoogleAuthButton = ({ label = 'Sign in with Google' }) => {
  const { googleLogin } = useAuth();
  const googleBtnRef = useRef(null);

  useEffect(() => {
    const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;

    if (window.google?.accounts?.id && clientId) {
      window.google.accounts.id.initialize({
        client_id: clientId,
        callback: async (response) => {
          if (response.credential) {
            await googleLogin(response.credential);
          }
        },
      });

      if (googleBtnRef.current) {
        window.google.accounts.id.renderButton(googleBtnRef.current, {
          theme: 'outline',
          size: 'large',
          width: '100%',
          text: 'continue_with',
          shape: 'rectangular',
        });
      }
    }
  }, [googleLogin]);

  // Demo / Test Fallback click handler if SDK button isn't available or for local testing
  const handleTestGoogleLogin = async () => {
    const mockEmail = `testuser_${Math.floor(Math.random() * 1000)}@gmail.com`;
    await googleLogin(`mock-google-token-${mockEmail}`);
  };

  return (
    <div className="w-full flex flex-col items-center">
      <div ref={googleBtnRef} className="w-full flex justify-center min-h-[40px]"></div>
      
      {/* Fallback button if Google SDK is blocked or using mock client ID */}
      <button
        type="button"
        onClick={handleTestGoogleLogin}
        className="w-full mt-2 inline-flex items-center justify-center gap-3 px-4 py-2.5 border border-slate-300 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors font-medium text-sm shadow-sm"
      >
        <svg className="w-5 h-5" viewBox="0 0 24 24">
          <path
            fill="#4285F4"
            d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
          />
          <path
            fill="#34A853"
            d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
          />
          <path
            fill="#FBBC05"
            d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
          />
          <path
            fill="#EA4335"
            d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
          />
        </svg>
        <span>{label}</span>
      </button>
    </div>
  );
};

export default GoogleAuthButton;
