import React, { useState } from 'react';
import { useAuth } from '../lib/auth';
import { http } from '../lib/api';
import { toast } from 'sonner';

export const UserAvatar = ({ name, size = "w-10 h-10", textSize = "text-sm" }) => {
  const getInitials = (n) => {
    if (!n) return "??";
    const p = n.trim().split(' ');
    if (p.length === 1) return p[0].substring(0, 2).toUpperCase();
    return (p[0][0] + p[p.length - 1][0]).toUpperCase();
  };
  return (
    <div className={`${size} ${textSize} rounded-full bg-red-100 text-red-700 font-extrabold flex items-center justify-center border-2 border-white shadow-sm`}>
      {getInitials(name)}
    </div>
  );
};

export default function AuthModal({ onLoginSuccess }) {
  const { startLogin, checkAuth } = useAuth();
  const [mode, setMode] = useState('login');
  const [form, setForm] = useState({ email: '', password: '', name: '', role: 'Teacher', heard_from: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const onChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const endpoint = mode === 'register' ? '/auth/register' : '/auth/login';
      const payload = mode === 'register'
        ? { email: form.email, password: form.password, name: form.name, role: form.role, heard_from: form.heard_from }
        : { email: form.email, password: form.password };
      await http.post(endpoint, payload);
      await checkAuth();
      toast.success(mode === 'register' ? 'Account created!' : 'Welcome back!');
      if (onLoginSuccess) onLoginSuccess();
    } catch (err) {
      setError(err?.response?.data?.detail || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md space-y-5 bg-white p-8 rounded-3xl shadow-xl border border-gray-100">
      <div className="text-center">
        <h2 className="text-3xl font-black text-gray-900 tracking-tight">
          {mode === 'login' ? 'Welcome back' : 'Join SmartGiaoAn'}
        </h2>
        <p className="text-gray-500 mt-1 font-medium text-sm">
          {mode === 'login' ? 'Sign in to access your worksheets.' : 'Free to start. No credit card needed.'}
        </p>
      </div>

      <button
        onClick={startLogin}
        type="button"
        className="w-full flex items-center justify-center gap-3 border-2 border-gray-100 bg-white hover:border-black text-gray-700 font-bold py-3 px-4 rounded-2xl transition-all shadow-sm"
      >
        <svg className="w-5 h-5" viewBox="0 0 24 24">
          <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
          <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
          <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
          <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
        </svg>
        Continue with Google
      </button>

      <div className="relative">
        <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-gray-100" /></div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-white px-3 text-gray-400 font-bold tracking-wider">or email</span>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-3">
        {mode === 'register' && (
          <>
            <input type="text" name="name" placeholder="Your name (e.g. Mr. Ben)" required
              className="w-full border border-gray-200 rounded-xl p-3 text-sm focus:outline-none focus:border-black transition"
              value={form.name} onChange={onChange} />
            <div className="flex gap-2">
              {['Teacher', 'Parent', 'Student'].map((r) => (
                <button type="button" key={r} onClick={() => setForm({ ...form, role: r })}
                  className={`flex-1 py-2 rounded-xl text-xs font-black transition border ${form.role === r ? 'bg-red-50 text-red-700 border-red-200' : 'bg-white text-gray-400 border-gray-200 hover:bg-gray-50'}`}>
                  {r}
                </button>
              ))}
            </div>
            <select name="heard_from" value={form.heard_from} onChange={onChange}
              className="w-full border border-gray-200 rounded-xl p-3 text-sm focus:outline-none focus:border-black transition bg-white text-gray-500">
              <option value="">Where did you hear about us?</option>
              <option value="Facebook Group">Facebook Group</option>
              <option value="Colleague">Teacher Colleague</option>
              <option value="Google Search">Google Search</option>
              <option value="Other">Other</option>
            </select>
          </>
        )}
        <input type="email" name="email" placeholder="you@school.edu.vn" required
          className="w-full border border-gray-200 rounded-xl p-3 text-sm focus:outline-none focus:border-black transition"
          value={form.email} onChange={onChange} />
        <input type="password" name="password" placeholder="Password (min 8 characters)" required minLength={8}
          className="w-full border border-gray-200 rounded-xl p-3 text-sm focus:outline-none focus:border-black transition"
          value={form.password} onChange={onChange} />
        {error && (
          <div className="text-xs font-bold text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</div>
        )}
        <button type="submit" disabled={loading}
          className="w-full bg-black text-white font-bold py-3 rounded-xl hover:bg-gray-800 transition disabled:opacity-50 disabled:cursor-not-allowed">
          {loading ? 'Please wait...' : mode === 'login' ? 'Sign in' : 'Create account'}
        </button>
      </form>

      <p className="text-center text-sm text-gray-500">
        {mode === 'login' ? (
          <>No account?{' '}
            <button onClick={() => { setMode('register'); setError(''); }} className="font-bold text-red-600 hover:underline">Sign up free</button>
          </>
        ) : (
          <>Already have one?{' '}
            <button onClick={() => { setMode('login'); setError(''); }} className="font-bold text-red-600 hover:underline">Sign in</button>
          </>
        )}
      </p>
    </div>
  );
}
