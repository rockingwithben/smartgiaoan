import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../lib/auth';
import { BACKEND_BASE, http } from '../lib/api';
import { toast } from 'sonner';

export default function VerifyEmail() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user, loading, checkAuth, logout } = useAuth();
  const token = searchParams.get('token');

  const [status, setStatus] = useState(token ? 'verifying' : 'pending');
  const [message, setMessage] = useState(
    token ? 'Verifying your email...' : 'Check your inbox for the verification link.'
  );
  const [resending, setResending] = useState(false);

  useEffect(() => {
    if (!token) return;

    let cancelled = false;

    const verifyEmail = async () => {
      try {
        const response = await fetch(`${BACKEND_BASE}/api/auth/verify-email`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token }),
          credentials: 'include',
        });

        if (cancelled) return;

        if (!response.ok) {
          const error = await response.json().catch(() => ({}));
          setStatus('error');
          setMessage(error.detail || 'Email verification failed.');
          return;
        }

        setStatus('success');
        setMessage('Email verified successfully! Redirecting to dashboard...');
        await checkAuth();
        setTimeout(() => navigate('/dashboard', { replace: true }), 1500);
      } catch (err) {
        if (cancelled) return;
        console.error('Verification error:', err);
        setStatus('error');
        setMessage('An error occurred during verification. Please try again.');
      }
    };

    verifyEmail();
    return () => { cancelled = true; };
  }, [token, checkAuth, navigate]);

  const handleResend = async () => {
    setResending(true);
    try {
      await http.post('/auth/send-verification');
      toast.success('Verification email sent. Check your inbox.');
      setStatus('pending');
      setMessage('We sent a fresh verification link to your email.');
    } catch (err) {
      toast.error(err?.response?.data?.detail || 'Could not send verification email.');
    } finally {
      setResending(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 px-4">
      <div className="bg-white rounded-2xl shadow-lg p-8 max-w-md w-full text-center">
        <h1 className="text-3xl font-bold mb-2 text-gray-800">Email Verification</h1>

        {user?.email && (
          <p className="text-sm text-gray-500 mb-6 break-all">{user.email}</p>
        )}

        {status === 'verifying' && (
          <div>
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4" />
            <p className="text-gray-600">{message}</p>
          </div>
        )}

        {status === 'pending' && (
          <div className="space-y-4">
            <div className="text-5xl mb-2">📬</div>
            <p className="text-gray-700 leading-relaxed">{message}</p>
            <p className="text-sm text-gray-500">
              Open the link in your email to unlock the dashboard and worksheet generator.
            </p>
            <button
              type="button"
              onClick={handleResend}
              disabled={resending}
              className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white font-semibold py-3 px-4 rounded-xl transition"
            >
              {resending ? 'Sending…' : 'Resend verification email'}
            </button>
            <div className="flex flex-col gap-2 pt-2">
              <Link to="/" className="text-sm font-bold text-gray-600 hover:text-black">
                ← Back to homepage
              </Link>
              <button
                type="button"
                onClick={logout}
                className="text-sm font-bold text-gray-400 hover:text-black"
              >
                Sign out and use a different account
              </button>
            </div>
          </div>
        )}

        {status === 'success' && (
          <div>
            <div className="text-green-500 text-5xl mb-4">✓</div>
            <p className="text-green-600 font-semibold mb-2">{message}</p>
          </div>
        )}

        {status === 'error' && (
          <div className="space-y-4">
            <div className="text-red-500 text-5xl mb-2">✕</div>
            <p className="text-red-600 font-semibold">{message}</p>
            <button
              type="button"
              onClick={handleResend}
              disabled={resending}
              className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white font-semibold py-2 px-4 rounded-xl transition"
            >
              {resending ? 'Sending…' : 'Send a new verification email'}
            </button>
            <Link
              to="/login"
              className="inline-block text-sm font-bold text-gray-600 hover:text-black"
            >
              Back to login
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
