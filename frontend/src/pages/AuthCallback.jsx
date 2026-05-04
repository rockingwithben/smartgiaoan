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

    const hash = window.location.hash || '';
    const m = hash.match(/session_id=([^&]+)/);

    if (!m) {
      navigate('/');
      return;
    }

    const session_id = decodeURIComponent(m[1]);

    (async () => {
      try {
        const res = await exchangeSession(session_id);

        if (res.user) {
          await checkAuth();
          window.history.replaceState(null, '', window.location.pathname);

          if (!res.user.teaching_level || !res.user.role) {
            navigate('/profile', { replace: true });
          } else {
            navigate('/dashboard', { replace: true });
          }
        }
      } catch (e) {
        console.error('Auth callback failed:', e);
        navigate('/login', { replace: true });
      }
    })();
  }, [navigate, checkAuth]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mb-4" />
      <h2 className="text-xl font-semibold text-gray-900">Authenticating...</h2>
      <p className="text-gray-500 mt-2">Securing your session.</p>
    </div>
  );
}
