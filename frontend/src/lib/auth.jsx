import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { getMe, logout as apiLogout } from './api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true); // Start true to prevent the "Flash and Kick"

  const checkAuth = useCallback(async () => {
    try {
      const me = await getMe();
      if (me && me.user_id) {
        setUser(me);
      } else {
        setUser(null);
      }
    } catch (err) {
      console.error("Auth check failed:", err);
      setUser(null);
      // Only clear token if it's a genuine 401/auth failure
      if (err.response?.status === 401) {
        localStorage.removeItem('session_token');
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // If we are currently in the middle of a Google Callback, 
    // do NOT run checkAuth yet. Let AuthCallback.jsx handle the state.
    const isCallback = window.location.pathname === '/auth/callback';
    
    if (!isCallback) {
      checkAuth();
    } else {
      // We are in callback, stop global loading from interfering
      setLoading(false);
    }
  }, [checkAuth]);

  const startLogin = useCallback(() => {
    const redirectUrl = window.location.origin + '/auth/callback';
    window.location.href = `https://auth.emergentagent.com/?redirect=${encodeURIComponent(redirectUrl)}`;
  }, []);

  const logout = useCallback(async () => {
    try {
      await apiLogout();
    } catch (e) {
      console.warn("Logout request failed, clearing local state anyway.");
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