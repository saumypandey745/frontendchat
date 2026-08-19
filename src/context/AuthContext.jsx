import React, { createContext, useContext, useEffect, useState } from 'react';
import api, { setAccessToken } from '../lib/axios';

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

  // Email/Password Signup
  const signup = async (name, email, password, confirmPassword) => {
    try {
      const res = await api.post('/auth/signup', {
        name,
        email,
        password,
        confirmPassword,
      });

      if (res.data.success) {
        setAccessToken(res.data.accessToken);
        setUser(res.data.user);
        return { success: true, message: res.data.message };
      }
    } catch (err) {
      const errors = err.response?.data?.errors;
      const message = err.response?.data?.message || 'Signup failed';
      return { success: false, message, errors };
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
      const message = err.response?.data?.message || 'Invalid email or password';
      return { success: false, message };
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

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        signup,
        login,
        googleLogin,
        logout,
        updateProfile,
        updateSettings,
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
