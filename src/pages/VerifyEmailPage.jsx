import React, { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { MessageSquare, Mail, Loader2, AlertCircle, CheckCircle2, ArrowLeft, RefreshCw } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const VerifyEmailPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { verifyEmail, resendVerification } = useAuth();

  const email = location.state?.email || new URLSearchParams(location.search).get('email') || '';
  const codeSentInitially = location.state?.codeSent || false;
  const emailErrorInitially = location.state?.emailError || '';

  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [error, setError] = useState(
    emailErrorInitially ? `Email delivery notice: ${emailErrorInitially}` : ''
  );
  const [successMsg, setSuccessMsg] = useState(
    codeSentInitially && !emailErrorInitially ? 'A verification code has been sent to your email address.' : ''
  );
  const [cooldown, setCooldown] = useState(codeSentInitially ? 60 : 0);

  const inputRefs = useRef([]);

  // Cooldown countdown timer
  useEffect(() => {
    let timer;
    if (cooldown > 0) {
      timer = setInterval(() => {
        setCooldown((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [cooldown]);

  // Focus first input on mount
  useEffect(() => {
    if (inputRefs.current[0]) {
      inputRefs.current[0].focus();
    }
  }, []);

  const handleChange = (index, value) => {
    if (!/^\d*$/.test(value)) return;

    const newOtp = [...otp];
    // Handle single character
    newOtp[index] = value.substring(value.length - 1);
    setOtp(newOtp);
    setError('');

    // Auto advance to next input
    if (value && index < 5 && inputRefs.current[index + 1]) {
      inputRefs.current[index + 1].focus();
    }
  };

  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0 && inputRefs.current[index - 1]) {
      inputRefs.current[index - 1].focus();
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').trim();
    if (!/^\d{6}$/.test(pastedData)) return;

    const digits = pastedData.split('');
    setOtp(digits);
    setError('');
    if (inputRefs.current[5]) {
      inputRefs.current[5].focus();
    }
  };

  const handleVerify = async (e) => {
    if (e) e.preventDefault();
    const code = otp.join('');

    if (code.length < 6) {
      setError('Please enter the full 6-digit verification code.');
      return;
    }

    if (!email) {
      setError('Missing email address. Please return to signup or login.');
      return;
    }

    setLoading(true);
    setError('');
    setSuccessMsg('');

    const res = await verifyEmail(email, code);
    setLoading(false);

    if (res.success) {
      setSuccessMsg('Email verified successfully! Redirecting to chat...');
      setTimeout(() => {
        navigate('/', { replace: true });
      }, 1200);
    } else {
      setError(res.message);
    }
  };

  const handleResend = async () => {
    if (cooldown > 0 || resending || !email) return;

    setResending(true);
    setError('');
    setSuccessMsg('');

    const res = await resendVerification(email);
    setResending(false);

    if (res.success) {
      if (res.emailSent === false) {
        setError(`Code generated, but EmailJS failed to send email: ${res.emailError || 'Unknown error'}`);
      } else {
        setSuccessMsg(res.message);
      }
      setCooldown(60); // Reset 60-second cooldown timer
    } else {
      setError(res.message);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-slate-50 dark:bg-slate-950">
      <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200/80 dark:border-slate-800 p-8 space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-brand-600 text-white shadow-lg shadow-brand-500/30">
            <Mail className="w-7 h-7" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
            Verify your email
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            We sent a 6-digit code to{' '}
            <span className="font-semibold text-slate-800 dark:text-slate-200">
              {email || 'your email'}
            </span>
          </p>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="p-3.5 rounded-2xl bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-800/50 text-red-600 dark:text-red-400 text-xs flex items-center gap-2 animate-fade-in">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Success Alert */}
        {successMsg && (
          <div className="p-3.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800/50 text-emerald-600 dark:text-emerald-400 text-xs flex items-center gap-2 animate-fade-in">
            <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleVerify} className="space-y-6">
          {/* 6-Digit Code Input Box */}
          <div className="flex justify-center gap-2" onPaste={handlePaste}>
            {otp.map((digit, index) => (
              <input
                key={index}
                ref={(el) => (inputRefs.current[index] = el)}
                type="text"
                inputMode="numeric"
                maxLength={1}
                value={digit}
                onChange={(e) => handleChange(index, e.target.value)}
                onKeyDown={(e) => handleKeyDown(index, e)}
                className="w-11 h-13 text-center text-xl font-bold rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500 transition-all"
              />
            ))}
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading || otp.join('').length < 6}
            className="w-full py-3 px-4 bg-brand-600 hover:bg-brand-700 text-white font-semibold rounded-xl shadow-lg shadow-brand-500/25 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Verify Account'}
          </button>
        </form>

        {/* Resend Code Section */}
        <div className="pt-2 border-t border-slate-200 dark:border-slate-800 text-center space-y-3">
          <div className="flex items-center justify-center gap-2 text-xs">
            <span className="text-slate-500 dark:text-slate-400">Didn't receive the code?</span>
            <button
              type="button"
              onClick={handleResend}
              disabled={cooldown > 0 || resending}
              className="font-bold text-brand-600 dark:text-brand-400 hover:underline disabled:opacity-50 disabled:no-underline flex items-center gap-1"
            >
              {resending ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin inline" />
              ) : (
                <RefreshCw className="w-3.5 h-3.5 inline" />
              )}
              {cooldown > 0 ? `Resend in ${cooldown}s` : 'Resend code'}
            </button>
          </div>

          <div>
            <Link
              to="/login"
              className="inline-flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              Back to Login
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VerifyEmailPage;
