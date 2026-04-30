import React, { useState, useEffect } from 'react';
import { toast } from 'sonner';

// Helper component to generate the Initials Avatar for new users
export const UserAvatar = ({ name, size = "w-10 h-10", textSize = "text-sm" }) => {
  const getInitials = (fullName) => {
    if (!fullName) return "??";
    const parts = fullName.trim().split(' ');
    if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  };

  return (
    <div className={`${size} ${textSize} rounded-full bg-red-100 text-red-700 font-extrabold flex items-center justify-center border-2 border-white shadow-sm`}>
      {getInitials(name)}
    </div>
  );
};

export default function AuthModal({ onLoginSuccess }) {
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({
    email: '', 
    password: '', 
    confirmPassword: '', 
    name: '', 
    role: 'Teacher', 
    heardFrom: ''
  });
  const [isLoading, setIsLoading] = useState(false);

  // Initialize Google Sign-In
  useEffect(() => {
    /* global google */
    if (window.google) {
      google.accounts.id.initialize({
        client_id: process.env.REACT_APP_GOOGLE_CLIENT_ID,
        callback: handleGoogleResponse,
        cancel_on_tap_outside: false,
      });
    }
  }, []);

  const handleGoogleResponse = async (response) => {
    setIsLoading(true);
    try {
      const res = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/auth/google`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: response.credential })
      });
      const data = await res.json();
      
      if (res.ok && data.session_token) {
        localStorage.setItem('session_token', data.session_token);
        onLoginSuccess(data.user);
        toast.success("Signed in successfully!");
      } else {
        toast.error(data.detail || "Google Sign-In failed.");
      }
    } catch (err) {
      toast.error("Network error during Google login.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleClick = () => {
    /* global google */
    if (window.google) {
      google.accounts.id.prompt();
    } else {
      toast.error("Google services not loaded. Please refresh.");
    }
  };

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleStandardAuth = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    if (!isLogin && formData.password !== formData.confirmPassword) {
      toast.error("Passwords do not match.");
      setIsLoading(false);
      return;
    }

    const endpoint = isLogin ? '/api/auth/login' : '/api/auth/register';
    const payload = isLogin 
      ? { email: formData.email, password: formData.password }
      : { 
          email: formData.email, 
          password: formData.password, 
          name: formData.name,
          role: formData.role,
          heard_from: formData.heardFrom
        };
    
    try {
      const response = await fetch(`${process.env.REACT_APP_BACKEND_URL || ''}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await response.json();
      
      if (response.ok && data.session_token) {
        localStorage.setItem('session_token', data.session_token);
        onLoginSuccess(data.user);
        toast.success(isLogin ? "Welcome back!" : "Account created!");
      } else {
        toast.error(data.detail || "Authentication failed.");
      }
    } catch (error) {
      toast.error("Network error. Please check your connection.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col space-y-4 w-full max-w-md mx-auto p-8 bg-white rounded-3xl shadow-xl border border-gray-100 font-sans">
      <div className="text-center mb-4">
        <h2 className="text-3xl font-black text-gray-900 tracking-tight">
          {isLogin ? 'Welcome Back' : 'Join SmartGiaoAn'}
        </h2>
        <p className="text-gray-500 mt-2 font-medium">
          {isLogin ? 'Log in to generate your next lesson.' : 'Create an account to start creating.'}
        </p>
      </div>
      
      <button 
        onClick={handleGoogleClick}
        disabled={isLoading}
        type="button"
        className="flex items-center justify-center border-2 border-gray-100 p-4 rounded-2xl hover:bg-gray-50 transition-all font-bold text-gray-700 shadow-sm active:scale-95"
      >
        <img src="https://www.svgrepo.com/show/475656/google-color.svg" alt="Google" className="w-5 h-5 mr-3"/>
        {isLogin ? 'Sign in with Google' : 'Sign up with Google'}
      </button>

      <div className="relative flex items-center py-4">
        <div className="flex-grow border-t border-gray-100"></div>
        <span className="flex-shrink-0 mx-4 text-gray-400 text-[10px] font-black uppercase tracking-widest">OR EMAIL</span>
        <div className="flex-grow border-t border-gray-100"></div>
      </div>
      
      <form onSubmit={handleStandardAuth} className="flex flex-col space-y-3">
        {!isLogin && (
          <>
            <input 
              type="text" name="name" placeholder="Full Name" required
              className="p-4 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-red-500 outline-none font-medium"
              value={formData.name} onChange={handleChange}
            />
            
            <div className="flex space-x-2">
              {['Teacher', 'Parent', 'Student'].map((r) => (
                <button
                  type="button"
                  key={r}
                  onClick={() => setFormData({ ...formData, role: r })}
                  className={`flex-1 py-2 rounded-xl text-xs font-black transition-all border ${
                    formData.role === r 
                      ? 'bg-red-50 text-red-700 border-red-200' 
                      : 'bg-white text-gray-400 border-gray-200 hover:bg-gray-50'
                  }`}
                >
                  {r}
                </button>
              ))}
            </div>
          </>
        )}

        <input 
          type="email" name="email" placeholder="Email Address" required
          className="p-4 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-red-500 outline-none font-medium"
          value={formData.email} onChange={handleChange}
        />
        <input 
          type="password" name="password" placeholder="Password" required
          className="p-4 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-red-500 outline-none font-medium"
          value={formData.password} onChange={handleChange}
        />
        
        {!isLogin && (
          <>
            <input 
              type="password" name="confirmPassword" placeholder="Confirm Password" required
              className="p-4 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-red-500 outline-none font-medium"
              value={formData.confirmPassword} onChange={handleChange}
            />
            <select 
              name="heardFrom" required
              className="p-4 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-red-500 outline-none font-medium text-gray-500"
              value={formData.heardFrom} onChange={handleChange}
            >
              <option value="" disabled>Where did you hear about us?</option>
              <option value="Facebook Group">Facebook Group</option>
              <option value="Colleague">Teacher Colleague</option>
              <option value="Google Search">Google Search</option>
              <option value="Other">Other</option>
            </select>
          </>
        )}

        <button 
          type="submit" 
          disabled={isLoading}
          className="bg-black text-white font-black p-4 rounded-2xl hover:bg-gray-800 transition-all disabled:bg-gray-300 shadow-lg active:scale-95 mt-2"
        >
          {isLoading ? 'Processing...' : (isLogin ? 'Log In' : 'Create Free Account')}
        </button>
      </form>

      <p className="text-center text-sm text-gray-500 mt-6 font-bold">
        {isLogin ? "New to SmartGiaoAn?" : "Already have an account?"}
        <button 
          onClick={() => { setIsLogin(!isLogin); }} 
          className="ml-2 text-red-600 font-black hover:underline"
        >
          {isLogin ? "Sign up" : "Log in"}
        </button>
      </p>
    </div>
  );
}
