import React, { createContext, useContext, useEffect, useState } from 'react';
import api, { setAccessToken } from '../lib/axios';
import { sendEmail } from '../utils/email';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Initialize session on load via refresh token cookie
  useEffect(() => {
    const checkAuthStatus = async () => {
      try {
        const res = await api.post('/auth/refresh');
        if (res.data.success) {
          setAccessToken(res.data.accessToken);
          setUser(res.data.user);
        }
      } catch (err) {
        // No valid session/refresh token
        setUser(null);
        setAccessToken(null);
      } finally {
        setLoading(false);
      }
    };

    checkAuthStatus();

    // Listen for forced logout event from axios interceptor
    const handleForcedLogout = () => {
      setUser(null);
      setAccessToken(null);
    };

    window.addEventListener('auth:logout', handleForcedLogout);
    return () => window.removeEventListener('auth:logout', handleForcedLogout);
  }, []);

  // Email/Password Signup (Requires verification)
  const signup = async (name, email, password, confirmPassword) => {
    try {
      const res = await api.post('/auth/signup', {
        name,
        email,
        password,
        confirmPassword,
      });

      if (res.data.success) {
        let emailSent = true;
        let emailErrorMsg = '';

        if (res.data.code) {
          try {
            const recipientEmail = res.data.email || email;
            const recipientName = res.data.name || name || 'User';
            const verificationCode = res.data.code;

            await sendEmail({
              to_email: recipientEmail,
              user_email: recipientEmail,
              email: recipientEmail,
              reply_to: recipientEmail,
              to_name: recipientName,
              user_name: recipientName,
              name: recipientName,
              otp: verificationCode,
              OTP: verificationCode,
              ' OTP ': verificationCode,
              Chatwave: verificationCode,
              time: new Date().toLocaleTimeString(),
              code: verificationCode,
              passcode: verificationCode,
              verification_code: verificationCode,
              from_name: 'ChatWave',
              subject: 'ChatWave - Email Verification Code',
              message: `Your ChatWave verification code is: ${verificationCode}`,
            });
          } catch (emailErr) {
            emailSent = false;
            emailErrorMsg = emailErr?.text || emailErr?.message || 'EmailJS service failed';
            console.error('[AUTH] Failed to send verification email via EmailJS:', emailErr);
          }
        }
        return {
          success: true,
          requiresVerification: res.data.requiresVerification,
          email: res.data.email || email,
          emailSent,
          emailError: emailErrorMsg,
          message: emailSent
            ? (res.data.message || 'Account created! Please check your email for the verification code.')
            : `Account created, but EmailJS failed to send email: ${emailErrorMsg}`,
        };
      }
    } catch (err) {
      const errors = err.response?.data?.errors;
      const message = err.response?.data?.message || 'Signup failed';
      return { success: false, message, errors };
    }
  };

  // Verify Email
  const verifyEmail = async (email, code) => {
    try {
      const res = await api.post('/auth/verify-email', { email, code });
      if (res.data.success) {
        setAccessToken(res.data.accessToken);
        setUser(res.data.user);
        return { success: true, message: res.data.message };
      }
    } catch (err) {
      const message = err.response?.data?.message || 'Verification failed';
      return { success: false, message };
    }
  };

  // Resend Email Verification Code
  const resendVerification = async (email) => {
    try {
      const res = await api.post('/auth/resend-verification', { email });
      if (res.data.success) {
        let emailSent = true;
        let emailErrorMsg = '';

        if (res.data.code) {
          try {
            const recipientEmail = res.data.email || email;
            const recipientName = res.data.name || 'User';
            const verificationCode = res.data.code;

            await sendEmail({
              to_email: recipientEmail,
              user_email: recipientEmail,
              email: recipientEmail,
              reply_to: recipientEmail,
              to_name: recipientName,
              user_name: recipientName,
              name: recipientName,
              otp: verificationCode,
              code: verificationCode,
              passcode: verificationCode,
              verification_code: verificationCode,
              from_name: 'ChatWave',
              subject: 'ChatWave - Email Verification Code',
              message: `Your ChatWave verification code is: ${verificationCode}`,
            });
          } catch (emailErr) {
            emailSent = false;
            emailErrorMsg = emailErr?.text || emailErr?.message || 'EmailJS service failed';
            console.error('[AUTH] Failed to send resend-verification email via EmailJS:', emailErr);
          }
        }
        return {
          success: true,
          emailSent,
          emailError: emailErrorMsg,
          message: emailSent
            ? 'A new verification code has been sent to your email address.'
            : `Verification code generated, but EmailJS failed to send email: ${emailErrorMsg}`,
        };
      }
    } catch (err) {
      const message = err.response?.data?.message || 'Failed to resend verification code';
      return { success: false, message };
    }
  };

  // Email/Password Login
  const login = async (email, password, rememberMe = false) => {
    try {
      const res = await api.post('/auth/login', {
        email,
        password,
        rememberMe,
      });

      if (res.data.success) {
        setAccessToken(res.data.accessToken);
        setUser(res.data.user);
        return { success: true, message: res.data.message };
      }
    } catch (err) {
      const isUnverified = err.response?.data?.isUnverified;
      const unverifiedEmail = err.response?.data?.email;
      const message = err.response?.data?.message || 'Invalid email or password';
      return { success: false, message, isUnverified, email: unverifiedEmail };
    }
  };

  // Google OAuth Login / Signup
  const googleLogin = async (idToken) => {
    try {
      const res = await api.post('/auth/google', { idToken });
      if (res.data.success) {
        setAccessToken(res.data.accessToken);
        setUser(res.data.user);
        return { success: true, message: res.data.message };
      }
    } catch (err) {
      const message = err.response?.data?.message || 'Google authentication failed';
      return { success: false, message };
    }
  };

  // Logout
  const logout = async () => {
    try {
      await api.post('/auth/logout');
    } catch (err) {
      console.error('Logout error:', err);
    } finally {
      setUser(null);
      setAccessToken(null);
    }
  };

  // Update Profile
  const updateProfile = async (formData) => {
    try {
      const res = await api.put('/users/profile', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      if (res.data.success) {
        setUser(res.data.user);
        return { success: true, message: res.data.message, user: res.data.user };
      }
    } catch (err) {
      const message = err.response?.data?.message || 'Failed to update profile';
      return { success: false, message };
    }
  };

  // Update Settings (password / online status visibility)
  const updateSettings = async (settingsData) => {
    try {
      const res = await api.put('/users/settings', settingsData);
      if (res.data.success) {
        setUser(res.data.user);
        return { success: true, message: res.data.message, user: res.data.user };
      }
    } catch (err) {
      const message = err.response?.data?.message || 'Failed to update settings';
      return { success: false, message };
    }
  };

  const isUserBlocked = (targetUserId) => {
    if (!user?.blockedUsers || !targetUserId) return false;
    return user.blockedUsers.some(
      (b) => (b._id || b).toString() === targetUserId.toString()
    );
  };

  const toggleBlockUser = async (targetUserId) => {
    if (!user || !targetUserId) return { success: false, message: 'Invalid block request' };

    const currentlyBlocked = isUserBlocked(targetUserId);

    // 1. OPTIMISTIC UPDATE: Toggle targetUserId in user.blockedUsers immediately
    const previousBlockedUsers = user.blockedUsers || [];
    const optimisticBlockedUsers = currentlyBlocked
      ? previousBlockedUsers.filter((b) => (b._id || b).toString() !== targetUserId.toString())
      : [...previousBlockedUsers, targetUserId];

    setUser((prevUser) => (prevUser ? { ...prevUser, blockedUsers: optimisticBlockedUsers } : prevUser));

    // 2. Perform API call
    try {
      const endpoint = currentlyBlocked
        ? `/users/${targetUserId}/unblock`
        : `/users/${targetUserId}/block`;

      const res = await api.post(endpoint);

      if (res.data?.success) {
        const serverBlockedUsers = res.data.blockedUsers;
        if (serverBlockedUsers && Array.isArray(serverBlockedUsers)) {
          setUser((prevUser) => {
            if (!prevUser) return prevUser;
            const prevIds = (prevUser.blockedUsers || []).map((id) => (id._id || id).toString()).sort().join(',');
            const newIds = serverBlockedUsers.map((id) => (id._id || id).toString()).sort().join(',');
            if (prevIds === newIds) return prevUser; // Prevent redundant re-render blink
            return { ...prevUser, blockedUsers: serverBlockedUsers };
          });
        }
        return { success: true, isBlocked: !currentlyBlocked, message: res.data.message };
      } else {
        // Rollback on non-success
        setUser((prevUser) => (prevUser ? { ...prevUser, blockedUsers: previousBlockedUsers } : prevUser));
        return { success: false, message: res.data?.message || 'Failed to update block status' };
      }
    } catch (err) {
      // 3. Rollback on error
      setUser((prevUser) => (prevUser ? { ...prevUser, blockedUsers: previousBlockedUsers } : prevUser));
      const message = err.response?.data?.message || 'Failed to update block status';
      return { success: false, message };
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        setUser,
        loading,
        signup,
        verifyEmail,
        resendVerification,
        login,
        googleLogin,
        logout,
        updateProfile,
        updateSettings,
        toggleBlockUser,
        isUserBlocked,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
