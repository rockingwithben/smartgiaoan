import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { exchangeSession, http } from '../lib/api';
import { useAuth } from '../lib/auth';

// 2000% MODE FIX: Module-level lock. This survives React's background re-renders 
// and guarantees we NEVER send the Google token to the backend twice.
const processedTokens = new Set();

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

    // Instantly abort if we already processed this exact token
    if (processedTokens.has(session_id)) return;
    processedTokens.add(session_id);

    (async () => {
      try {
        const res = await exchangeSession(session_id);

        if (res.user && res.session_token) {
          // 1. Force the token into the browser's permanent storage
          localStorage.setItem('session_token', res.session_token);
          
          // 2. IMMEDIATELY inject the token into our API client to defeat race conditions
          http.defaults.headers.common['Authorization'] = `Bearer ${res.session_token}`;

          // 3. Wait for the global app state to officially verify you
          await checkAuth();
          
          // 4. Clean up the URL so it looks professional
          window.history.replaceState(null, '', window.location.pathname);

          // 5. Micro-delay to ensure React has fully painted the Dashboard before moving
          setTimeout(() => {
            if (!res.user.teaching_level || !res.user.role) {
              navigate('/profile', { replace: true });
            } else {
              navigate('/dashboard', { replace: true });
            }
          }, 100);
        } else {
          throw new Error("Backend did not return valid user credentials.");
        }
      } catch (e) {
        console.error('Auth callback failed:', e);
        // 2000% MODE FIX: We NO LONGER bounce to the homepage. We display the exact error.
        setError(e.response?.data?.detail || e.message || "Failed to secure session with Google.");
      }
    })();
  }, [navigate, checkAuth]);

  // If an error happens, show the Red Alert screen instead of a silent bounce
  if (error) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-4 text-center">
        <div className="text-5xl mb-4">⚠️</div>
        <h2 className="text-2xl font-black text-gray-900 mb-2">Authentication Failed</h2>
        <p className="text-red-600 font-bold mb-6 bg-red-50 p-4 rounded-xl border border-red-100 max-w-md">
          {error}
        </p>
        <button
          onClick={() => navigate('/')}
          className="bg-black text-white px-8 py-3 rounded-xl font-bold hover:bg-gray-800 transition shadow-lg"
        >
          Return to Homepage
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50">
      <div className="w-12 h-12 border-4 border-black border-t-transparent rounded-full animate-spin mb-6 shadow-sm"></div>
      <h2 className="text-2xl font-black text-gray-900 mb-2">Securing Connection...</h2>
      <p className="text-gray-500 font-medium">Please wait while we establish a secure session.</p>
    </div>
  );
}