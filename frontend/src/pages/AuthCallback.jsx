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
        if (res.user) setUser(res.user);
        // clean hash and route to dashboard
        window.history.replaceState(null, '', '/dashboard');
        navigate('/dashboard', { replace: true });
      } catch (e) {
        navigate('/');
      }
    })();
  }, [navigate, setUser]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center">
        <div className="font-display text-3xl">Signing you in…</div>
        <div className="text-sm text-muted-foreground mt-2">A moment please.</div>
      </div>
    </div>
  );
}
