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
          // 1. Save the token securely
          if (res.session_token) {
            localStorage.setItem('session_token', res.session_token);
          }

          // 2. Await the absolute completion of the auth check
          await checkAuth();
          
          // 3. Clean the URL
          window.history.replaceState(null, '', window.location.pathname);

          // 4. CRITICAL: Micro-delay to ensure React Context is fully updated before mounting Dashboard
          setTimeout(() => {
            if (!res.user.teaching_level || !res.user.role) {
              navigate('/profile', { replace: true });
            } else {
              navigate('/dashboard', { replace: true });
            }
          }, 50);
        }
      } catch (e) {
        console.error('Auth callback failed:', e);
        navigate('/', { replace: true });
      }
    })();
  }, [navigate, checkAuth]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50">
      <div className="w-12 h-12 border-4 border-black border-t-transparent rounded-full animate-spin mb-4"></div>
      <h2 className="text-2xl font-black text-gray-900 mb-2">Securing Connection...</h2>
      <p className="text-gray-500 font-medium">Please wait while we log you in.</p>
    </div>
  );
}