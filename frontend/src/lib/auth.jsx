import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { getMe, logout as apiLogout } from './api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const checkAuth = useCallback(async () => {
    try {
      const me = await getMe();
      if (me && me.user_id) {
        setUser(me);
      } else {
        setUser(null);
      }
    } catch (err) {
      console.error('Auth check failed:', err);
      setUser(null);
      if (err.response?.status === 401) {
        localStorage.removeItem('session_token');
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const isCallback = window.location.pathname === '/auth/callback';
    if (!isCallback) {
      checkAuth();
    } else {
      setLoading(false);
    }
  }, [checkAuth]);

  const startLogin = useCallback(() => {
    const redirectUrl = window.location.origin + '/auth/callback';
    window.location.href = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${process.env.REACT_APP_GOOGLE_CLIENT_ID}&redirect_uri=${encodeURIComponent(redirectUrl)}&response_type=code&scope=openid%20email%20profile`;
  }, []);

  const logout = useCallback(async () => {
    try {
      await apiLogout();
    } catch (e) {
      console.warn('Logout request failed, clearing local state anyway.');
    }
    setUser(null);
    localStorage.removeItem('session_token');
    window.location.href = '/';
  }, []);

  return (
    <AuthContext.Provider value={{ user, setUser, loading, startLogin, logout, checkAuth }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth outside provider');
  return ctx;
}