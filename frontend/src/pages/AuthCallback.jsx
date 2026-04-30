import React, { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { exchangeSession } from '../lib/api';
import { useAuth } from '../lib/auth';

export default function AuthCallback() {
  const navigate = useNavigate();
  const { setUser } = useAuth();
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
          // This fires the refreshUser callback in auth.jsx to sync state
          await setUser(res.user); 
          
          // Clean the ugly hash out of the URL bar
          window.history.replaceState(null, '', window.location.pathname);
          
          // SMART ROUTING: 
          if (!res.user.teaching_level || !res.user.role) {
            navigate('/profile', { replace: true });
          } else {
            navigate('/dashboard', { replace: true });
          }
        }
      } catch (e) {
        console.error("Auth callback failed:", e);
        navigate('/login', { replace: true });
      }
    })();
  }, [navigate, setUser]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50">
      <div className="text-center p-8 bg-white rounded-2xl shadow-sm border border-gray-100 max-w-sm w-full">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto mb-6"></div>
        <div className="font-extrabold text-2xl text-gray-900">Authenticating...</div>
        <div className="text-sm text-gray-500 mt-2 font-medium">Securing your session.</div>
      </div>
    </div>
  );
}
