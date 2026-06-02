import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../lib/auth';

export default function AuthCallback() {
  const navigate = useNavigate();
  const { checkAuth } = useAuth();
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;

    const finishLogin = async () => {
      try {
        window.history.replaceState({}, document.title, '/auth/callback');
        const me = await checkAuth();

        if (cancelled) return;

        if (!me) {
          throw new Error('No valid session cookie was returned by the backend.');
        }

        navigate(me.email_verified === false ? '/verify-email' : '/dashboard', { replace: true });
      } catch (e) {
        if (cancelled) return;
        console.error('Auth callback failed:', e);
        setError(e.response?.data?.detail || e.message || 'Unknown authentication error.');
      }
    };

    finishLogin();
    return () => {
      cancelled = true;
    };
  }, [checkAuth, navigate]);

  if (error) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-4 text-center">
        <h2 className="text-2xl font-black text-gray-900 mb-2">Login Failed</h2>
        <p className="text-red-600 font-bold mb-6 bg-red-50 p-4 rounded-xl border border-red-100 max-w-md">
          {error}
        </p>
        <Link to="/login" className="bg-black text-white px-8 py-3 rounded-xl font-bold hover:bg-gray-800 transition">
          Try Manual Sign-In
        </Link>
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
