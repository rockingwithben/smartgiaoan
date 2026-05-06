import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { getMe, logout as apiLogout } from './api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  // ALWAYS start true to prevent premature kicks
  const [loading, setLoading] = useState(true);

  const checkAuth = useCallback(async () => {
    setLoading(true); // CRITICAL: Lock the UI while checking
    try {
      const me = await getMe();
      setUser(me);
      return me;
    } catch {
      setUser(null);
      localStorage.removeItem('session_token');
      return null;
    } finally {
      setLoading(false); // Only unlock when 100% finished
    }
  }, []);

  useEffect(() => {
    const hasSessionId = window.location.search?.includes('session_id=') || window.location.hash?.includes('session_id=');
    if (hasSessionId) {
      // CRITICAL: If we are returning from Google, DO NOT set loading to false yet.
      // Let the AuthCallback finish the job.
      return;
    }
    checkAuth();
  }, [checkAuth]);

  const refreshUser = useCallback(async () => {
    try {
      const me = await getMe();
      setUser(me);
      return me;
    } catch {
      setUser(null);
      return null;
    }
  }, []);

  const startLogin = useCallback(() => {
    const redirectUrl = window.location.origin + '/auth/callback';
    window.location.href = `https://auth.emergentagent.com/?redirect=${encodeURIComponent(redirectUrl)}`;
  }, []);

  const logout = useCallback(async () => {
    await apiLogout();
    setUser(null);
    window.location.href = '/';
  }, []);

  return (
    <AuthContext.Provider value={{ user, setUser, loading, startLogin, logout, refreshUser, checkAuth }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth outside provider');
  return ctx;
}