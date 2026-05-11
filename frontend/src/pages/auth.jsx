import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { getMe, logoutUser } from './api'; // Removed startEmergentLogin

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Initial Auth Check
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const me = await getMe();
        if (mounted) setUser(me);
      } catch {
        if (mounted) setUser(null);
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, []);

  // Safely refresh the user state from the backend
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

  const startLogin = useCallback(() => { // Replaced with direct Google OAuth flow
    const redirectUrl = window.location.origin + '/auth/callback';
    window.location.href = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${process.env.REACT_APP_GOOGLE_CLIENT_ID}&redirect_uri=${encodeURIComponent(redirectUrl)}&response_type=code&scope=openid%20email%20profile`;
  }, []);

  const logout = async () => {
    await logoutUser();
    setUser(null);
  };

  return (
    // Exposing the refresh callback as checkAuth
    <AuthContext.Provider value={{ user, loading, checkAuth: refreshUser, startLogin, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
