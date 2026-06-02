import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { BACKEND_BASE, getMe, logout as apiLogout } from './api';

const AuthContext = createContext(null);
const AUTH_TIMEOUT_MS = 12000;
const GOOGLE_CLIENT_ID =
  process.env.REACT_APP_GOOGLE_CLIENT_ID ||
  '764086051850-6qr4p6gpi6hn506pt8ejuq83di341hur.apps.googleusercontent.com';

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const checkAuth = useCallback(async () => {
    try {
      const me = await getMe();
      if (me && me.user_id) {
        setUser(me);
        return me;
      }
      setUser(null);
      return null;
    } catch (err) {
      console.error('Auth check failed:', err);
      setUser(null);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;

    const runAuthCheck = async () => {
      await checkAuth();
      if (cancelled) return;
    };

    runAuthCheck();

    const timeout = setTimeout(() => {
      if (!cancelled) {
        setLoading(false);
      }
    }, AUTH_TIMEOUT_MS);

    return () => {
      cancelled = true;
      clearTimeout(timeout);
    };
  }, [checkAuth]);

  const startLogin = useCallback(() => {
    if (!GOOGLE_CLIENT_ID) {
      console.error('Missing REACT_APP_GOOGLE_CLIENT_ID');
      window.location.href = '/login';
      return;
    }
    const backendCallbackUrl = `${BACKEND_BASE}/api/auth/google-callback`;
    const state = window.location.origin;
    window.location.href = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${encodeURIComponent(GOOGLE_CLIENT_ID)}&redirect_uri=${encodeURIComponent(backendCallbackUrl)}&response_type=code&scope=openid%20email%20profile&state=${encodeURIComponent(state)}`;
  }, []);

  const logout = useCallback(async () => {
    try {
      await apiLogout();
    } catch (e) {
      console.warn('Logout request failed, clearing local state anyway.');
    }
    setUser(null);
    window.location.href = '/';
  }, []);

  return (
    <AuthContext.Provider value={{ user, setUser, loading, startLogin, logout, checkAuth, refreshUser: checkAuth }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth outside provider');
  return ctx;
}
