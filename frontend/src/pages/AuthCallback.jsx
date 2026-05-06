import React, { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { exchangeSession } from '../lib/api';
import { useAuth } from '../lib/auth';

export default function AuthCallback() {
  const navigate = useNavigate();
  const { checkAuth } = useAuth();
  const hasProcessed = useRef(false);

  useEffect(() => {
    if (hasProcessed.current) return;
    hasProcessed.current = true;

    // FIX: Check search (query params) first, fallback to hash
    const urlString = window.location.search || window.location.hash || '';
    const m = urlString.match(/session_id=([^&]+)/);

    if (!m) {
      navigate('/', { replace: true });
      return;
    }

    const session_id = decodeURIComponent(m[1]);

    (async () => {
      try {
        const res = await exchangeSession(session_id);

        if (res.user) {
          await checkAuth();
          // Clean up the messy URL parameters so it looks professional
          window.history.replaceState(null, '', window.location.pathname);

          if (!res.user.teaching_level || !res.user.role) {
            navigate('/profile', { replace: true });
          } else {
            navigate('/dashboard', { replace: true });
          }
        }
      } catch (e) {
        console.error('Auth callback failed:', e);
        navigate('/', { replace: true });
      }
    })();
  }, [navigate, checkAuth]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Authenticating...</h2>
        <p className="text-gray-500">Securing your session.</p>
      </div>
    </div>
  );
}