import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { exchangeSession, http } from '../lib/api';
import { useAuth } from '../lib/auth';

const processedTokens = new Set();

export default function AuthCallback() {
  const navigate = useNavigate();
  const { checkAuth } = useAuth();
  const [error, setError] = useState(null);
  const hasProcessed = useRef(false);

  useEffect(() => {
    if (hasProcessed.current) return;
    hasProcessed.current = true;

    // Safely parse URL parameters
    const searchParams = new URLSearchParams(window.location.search);
    const session_id = searchParams.get('session_id') || window.location.hash.match(/session_id=([^&]+)/)?.[1];

    if (!session_id) {
      navigate('/', { replace: true });
      return;
    }

    // Hardware Lock
    if (processedTokens.has(session_id) || sessionStorage.getItem(`lock_${session_id}`)) {
      console.warn("React Ghost Mount prevented.");
      return;
    }
    
    processedTokens.add(session_id);
    sessionStorage.setItem(`lock_${session_id}`, "true");

    (async () => {
      try {
        const res = await exchangeSession(session_id);

        if (res.user && res.session_token) {
          // Force Token
          localStorage.setItem('session_token', res.session_token);
          http.defaults.headers.common['Authorization'] = `Bearer ${res.session_token}`;
          
          // Clear URL before React has a chance to re-render
          window.history.replaceState({}, document.title, "/");

          // Tell the global state we are good
          await checkAuth();

          // Force route to dashboard
          window.location.href = '/dashboard';
        } else {
          throw new Error("Backend did not return a session token.");
        }
      } catch (e) {
        console.error('Auth callback failed:', e);
        setError(e.response?.data?.detail || e.message || "Unknown Auth Error.");
      }
    })();
  }, [navigate, checkAuth]);

  if (error) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-4 text-center">
        <div className="text-5xl mb-4">🛑</div>
        <h2 className="text-2xl font-black text-gray-900 mb-2">Login Failed</h2>
        <p className="text-red-600 font-bold mb-6 bg-red-50 p-4 rounded-xl border border-red-100 max-w-md">
          {error}
        </p>
        <button onClick={() => window.location.href = '/login'} className="bg-black text-white px-8 py-3 rounded-xl font-bold hover:bg-gray-800 transition">
          Try Manual Sign-In
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50">
      <div className="w-12 h-12 border-4 border-black border-t-transparent rounded-full animate-spin mb-6 shadow-sm"></div>
      <h2 className="text-2xl font-black text-gray-900 mb-2">Securing Connection...</h2>
      <p className="text-gray-500 font-medium">Validating credentials...</p>
    </div>
  );
}