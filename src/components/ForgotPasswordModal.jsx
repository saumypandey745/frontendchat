import React, { useState, useEffect, useRef } from 'react';
import { X, Mail, KeyRound, Lock, Eye, EyeOff, Loader2, CheckCircle2, AlertCircle, RefreshCw, ArrowLeft } from 'lucide-react';
import api from '../lib/axios';
import { sendEmail } from '../utils/email';

const ForgotPasswordModal = ({ isOpen, onClose }) => {
  const [step, setStep] = useState(1); // 1: Email, 2: OTP, 3: New Password, 4: Done
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [resetToken, setResetToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [cooldown, setCooldown] = useState(60);

  const inputRefs = useRef([]);

  // Reset state on open/close
  useEffect(() => {
    if (!isOpen) {
      setStep(1);
      setEmail('');
      setOtp(['', '', '', '', '', '']);
      setResetToken('');
      setNewPassword('');
      setConfirmPassword('');
      setError('');
      setSuccessMsg('');
      setCooldown(60);
    }
  }, [isOpen]);

  // Cooldown timer
  useEffect(() => {
    let timer;
    if (step === 2 && cooldown > 0) {
      timer = setInterval(() => {
        setCooldown((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [step, cooldown]);

  // Auto focus first OTP input when reaching step 2
  useEffect(() => {
    if (step === 2 && inputRefs.current[0]) {
      inputRefs.current[0].focus();
    }
  }, [step]);

  if (!isOpen) return null;

  // Step 1: Submit Email
  const handleEmailSubmit = async (e) => {
    e.preventDefault();
    if (!email.trim()) {
      setError('Please enter a valid email address.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const res = await api.post('/auth/forgot-password', { email: email.trim() });
      if (res.data.success) {
        if (res.data.otp) {
          try {
            const recipientEmail = res.data.email || email.trim();
            const recipientName = res.data.name || 'User';
            const otpCode = res.data.otp;

            await sendEmail({
              to_email: recipientEmail,
              user_email: recipientEmail,
              email: recipientEmail,
              reply_to: recipientEmail,
              to_name: recipientName,
              user_name: recipientName,
              name: recipientName,
              otp: otpCode,
              code: otpCode,
              passcode: otpCode,
              verification_code: otpCode,
              from_name: 'ChatWave',
              subject: 'ChatWave - Password Reset OTP',
              message: `Your ChatWave password reset OTP is: ${otpCode}`,
            });
          } catch (emailErr) {
            console.error('[AUTH] Failed to send password reset OTP via EmailJS:', emailErr);
          }
        }
        setStep(2);
        setCooldown(60);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to send OTP email.');
    } finally {
      setLoading(false);
    }
  };

  // OTP Input handlers
  const handleOtpChange = (index, value) => {
    if (!/^\d*$/.test(value)) return;

    const newOtp = [...otp];
    newOtp[index] = value.substring(value.length - 1);
    setOtp(newOtp);
    setError('');

    if (value && index < 5 && inputRefs.current[index + 1]) {
      inputRefs.current[index + 1].focus();
    }
  };

  const handleOtpKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0 && inputRefs.current[index - 1]) {
      inputRefs.current[index - 1].focus();
    }
  };

  const handleOtpPaste = (e) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').trim();
    if (!/^\d{6}$/.test(pasted)) return;

    setOtp(pasted.split(''));
    setError('');
    if (inputRefs.current[5]) {
      inputRefs.current[5].focus();
    }
  };

  // Step 2: Submit OTP
  const handleOtpSubmit = async (e) => {
    e.preventDefault();
    const code = otp.join('');
    if (code.length < 6) {
      setError('Please enter the complete 6-digit OTP.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const res = await api.post('/auth/verify-reset-otp', {
        email: email.trim(),
        otp: code,
      });

      if (res.data.success) {
        setResetToken(res.data.resetToken);
        setStep(3);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid or expired OTP.');
    } finally {
      setLoading(false);
    }
  };

  // Resend OTP
  const handleResendOtp = async () => {
    if (cooldown > 0 || resending) return;

    setResending(true);
    setError('');
    setSuccessMsg('');

    try {
      const res = await api.post('/auth/forgot-password', { email: email.trim() });
      if (res.data.success) {
        if (res.data.otp) {
          try {
            const recipientEmail = res.data.email || email.trim();
            const recipientName = res.data.name || 'User',
            otpCode = res.data.otp;

            await sendEmail({
              to_email: recipientEmail,
              user_email: recipientEmail,
              email: recipientEmail,
              reply_to: recipientEmail,
              to_name: recipientName,
              user_name: recipientName,
              name: recipientName,
              otp: otpCode,
              code: otpCode,
              passcode: otpCode,
              verification_code: otpCode,
              from_name: 'ChatWave',
              subject: 'ChatWave - Password Reset OTP',
              message: `Your ChatWave password reset OTP is: ${otpCode}`,
            });
          } catch (emailErr) {
            console.error('[AUTH] Failed to send resend OTP via EmailJS:', emailErr);
          }
        }
        setSuccessMsg('A new OTP has been sent to your email.');
        setCooldown(60);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to resend OTP.');
    } finally {
      setResending(false);
    }
  };

  // Step 3: Submit New Password
  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    setError('');

    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    if (!passwordRegex.test(newPassword)) {
      setError(
        'Password must be at least 8 characters with 1 uppercase letter, 1 number, and 1 special character.'
      );
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);

    try {
      const res = await api.post('/auth/reset-password', {
        resetToken,
        newPassword,
        confirmNewPassword: confirmPassword,
      });

      if (res.data.success) {
        setStep(4);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to reset password.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800">
          <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
            <KeyRound className="w-5 h-5 text-brand-600 dark:text-brand-400" />
            {step === 1 && 'Forgot Password'}
            {step === 2 && 'Enter Verification OTP'}
            {step === 3 && 'Set New Password'}
            {step === 4 && 'Password Reset Complete'}
          </h3>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-4">
          {/* Error Alert */}
          {error && (
            <div className="p-3 text-xs rounded-xl bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-800/50 text-red-600 dark:text-red-400 flex items-center gap-2 animate-fade-in">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Success Banner */}
          {successMsg && (
            <div className="p-3 text-xs rounded-xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800/50 text-emerald-600 dark:text-emerald-400 flex items-center gap-2 animate-fade-in">
              <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* STEP 1: Enter Email */}
          {step === 1 && (
            <form onSubmit={handleEmailSubmit} className="space-y-4">
              <p className="text-xs text-slate-600 dark:text-slate-400">
                Enter your registered email address below. We'll send you a 6-digit OTP to reset your password.
              </p>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-brand-500 text-sm transition-all"
                    required
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="inline-flex items-center justify-center gap-2 px-5 py-2.5 text-sm font-semibold text-white bg-brand-600 hover:bg-brand-700 rounded-xl shadow-md transition-colors disabled:opacity-50"
                >
                  {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                  Send Reset OTP
                </button>
              </div>
            </form>
          )}

          {/* STEP 2: Enter OTP */}
          {step === 2 && (
            <form onSubmit={handleOtpSubmit} className="space-y-5">
              <p className="text-xs text-slate-600 dark:text-slate-400">
                We sent a 6-digit OTP code to{' '}
                <span className="font-semibold text-slate-800 dark:text-slate-200">{email}</span>.
              </p>

              <div className="flex justify-center gap-2" onPaste={handleOtpPaste}>
                {otp.map((digit, index) => (
                  <input
                    key={index}
                    ref={(el) => (inputRefs.current[index] = el)}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleOtpChange(index, e.target.value)}
                    onKeyDown={(e) => handleOtpKeyDown(index, e)}
                    className="w-11 h-13 text-center text-xl font-bold rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-brand-500 text-sm transition-all"
                  />
                ))}
              </div>

              <div className="flex items-center justify-between text-xs pt-1">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 flex items-center gap-1"
                >
                  <ArrowLeft className="w-3.5 h-3.5" /> Back to Email
                </button>

                <button
                  type="button"
                  onClick={handleResendOtp}
                  disabled={cooldown > 0 || resending}
                  className="font-bold text-brand-600 dark:text-brand-400 hover:underline disabled:opacity-50 disabled:no-underline flex items-center gap-1"
                >
                  {resending ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <RefreshCw className="w-3.5 h-3.5" />
                  )}
                  {cooldown > 0 ? `Resend in ${cooldown}s` : 'Resend OTP'}
                </button>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="submit"
                  disabled={loading || otp.join('').length < 6}
                  className="w-full py-2.5 text-sm font-semibold text-white bg-brand-600 hover:bg-brand-700 rounded-xl shadow-md transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                  Verify OTP
                </button>
              </div>
            </form>
          )}

          {/* STEP 3: Enter New Password */}
          {step === 3 && (
            <form onSubmit={handlePasswordSubmit} className="space-y-4">
              <p className="text-xs text-slate-600 dark:text-slate-400">
                Enter your new password below.
              </p>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">
                  New Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-brand-500 text-sm transition-all"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-3 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">
                  Confirm New Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-brand-500 text-sm transition-all"
                    required
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-2.5 text-sm font-semibold text-white bg-brand-600 hover:bg-brand-700 rounded-xl shadow-md transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                  Reset Password
                </button>
              </div>
            </form>
          )}

          {/* STEP 4: Success */}
          {step === 4 && (
            <div className="text-center py-4 space-y-4 animate-fade-in">
              <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <div>
                <h4 className="text-lg font-bold text-slate-900 dark:text-slate-100">
                  Password Reset Successfully!
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  All active sessions have been invalidated for security. Please sign in with your new password.
                </p>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="w-full py-2.5 bg-brand-600 hover:bg-brand-700 text-white font-semibold rounded-xl transition-all text-sm"
              >
                Back to Login
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ForgotPasswordModal;
