import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { exchangeSession, http } from '../lib/api';
import { useAuth } from '../lib/auth';

export default function AuthCallback() {
  const navigate = useNavigate();
  const { checkAuth } = useAuth();
  const [error, setError] = useState(null);
  const hasProcessed = useRef(false);

  useEffect(() => {
    if (hasProcessed.current) return;
    hasProcessed.current = true;

    const urlString = window.location.search || window.location.hash || '';
    const m = urlString.match(/session_id=([^&]+)/);

    if (!m) {
      navigate('/', { replace: true });
      return;
    }

    const session_id = decodeURIComponent(m[1]);

    // THE HARDWARE LOCK: Physically block React 18 from double-fetching and burning the token
    if (sessionStorage.getItem(`lock_${session_id}`)) {
      console.warn("React Double-Mount detected. Lock engaged. Ignoring ghost request.");
      return;
    }
    sessionStorage.setItem(`lock_${session_id}`, "true");

    (async () => {
      try {
        const res = await exchangeSession(session_id);

        if (res.user && res.session_token) {
          localStorage.setItem('session_token', res.session_token);
          http.defaults.headers.common['Authorization'] = `Bearer ${res.session_token}`;
          
          await checkAuth();
          window.history.replaceState(null, '', window.location.pathname);

          setTimeout(() => {
            navigate('/dashboard', { replace: true });
          }, 100);
        } else {
          throw new Error("Backend did not return a valid session token.");
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
        <button onClick={() => navigate('/')} className="bg-black text-white px-8 py-3 rounded-xl font-bold hover:bg-gray-800 transition">
          Return to Homepage
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50">
      <div className="w-12 h-12 border-4 border-black border-t-transparent rounded-full animate-spin mb-6 shadow-sm"></div>
      <h2 className="text-2xl font-black text-gray-900 mb-2">Securing Connection...</h2>
      <p className="text-gray-500 font-medium">Trading secure session tokens...</p>
    </div>
  );
}