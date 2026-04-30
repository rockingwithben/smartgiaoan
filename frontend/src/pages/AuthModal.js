import React, { useState } from 'react';

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
    email: '', password: '', confirmPassword: '', name: '', role: 'Teacher', heardFrom: ''
  });
  const [errorMsg, setErrorMsg] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleStandardAuth = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMsg('');

    if (!isLogin && formData.password !== formData.confirmPassword) {
      setErrorMsg("Passwords do not match.");
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
        if (onLoginSuccess) {
            onLoginSuccess(data.user);
        }
      } else {
        setErrorMsg(data.detail || "Authentication failed.");
      }
    } catch (error) {
      setErrorMsg("Network error. Please check your connection.");
    }
    setIsLoading(false);
  };

  const handleGoogleAuth = () => {
    // We will wire this to Google OAuth properly later in the 7-day sprint
    alert("Google Sign-In is being optimized. Please use Email/Password for now.");
  };

  return (
    <div className="flex flex-col space-y-4 w-full max-w-md mx-auto p-8 bg-white rounded-2xl shadow-xl border border-gray-100 font-sans">
      <div className="text-center mb-2">
        <h2 className="text-3xl font-extrabold text-gray-900">
          {isLogin ? 'Welcome Back' : 'Join SmartGiaoAn'}
        </h2>
        <p className="text-gray-500 mt-2 font-medium">
          {isLogin ? 'Log in to generate your next lesson.' : 'Create an account to start creating.'}
        </p>
      </div>
      
      {errorMsg && (
        <p className="text-sm text-red-600 text-center font-bold bg-red-50 p-3 rounded-lg border border-red-100">
          {errorMsg}
        </p>
      )}
      
      <form onSubmit={handleStandardAuth} className="flex flex-col space-y-4">
        
        {!isLogin && (
          <>
            <input 
              type="text" name="name" placeholder="Full Name" required
              className="p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-red-500 outline-none font-medium bg-gray-50"
              value={formData.name} onChange={handleChange}
            />
            
            <div className="flex space-x-2">
              {['Teacher', 'Parent', 'Student'].map((r) => (
                <button
                  type="button"
                  key={r}
                  onClick={() => setFormData({ ...formData, role: r })}
                  className={`flex-1 py-2 rounded-xl text-sm font-bold transition-all border ${
                    formData.role === r 
                      ? 'bg-red-50 text-red-700 border-red-200' 
                      : 'bg-white text-gray-500 border-gray-200 hover:bg-gray-50'
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
          className="p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-red-500 outline-none font-medium bg-gray-50"
          value={formData.email} onChange={handleChange}
        />
        <input 
          type="password" name="password" placeholder="Password" required
          className="p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-red-500 outline-none font-medium bg-gray-50"
          value={formData.password} onChange={handleChange}
        />
        
        {!isLogin && (
          <>
            <input 
              type="password" name="confirmPassword" placeholder="Confirm Password" required
              className="p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-red-500 outline-none font-medium bg-gray-50"
              value={formData.confirmPassword} onChange={handleChange}
            />
            <select 
              name="heardFrom" required
              className="p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-red-500 outline-none font-medium bg-gray-50 text-gray-600"
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
          className="bg-black text-white font-bold p-4 rounded-xl hover:bg-gray-800 transition disabled:bg-gray-400 mt-2 shadow-md"
        >
          {isLoading ? 'Processing...' : (isLogin ? 'Log In' : 'Create Free Account')}
        </button>
      </form>

      <div className="relative flex items-center py-4">
        <div className="flex-grow border-t border-gray-200"></div>
        <span className="flex-shrink-0 mx-4 text-gray-400 text-sm font-semibold">OR</span>
        <div className="flex-grow border-t border-gray-200"></div>
      </div>

      <button 
        onClick={handleGoogleAuth}
        type="button"
        className="flex items-center justify-center border-2 border-gray-200 p-3 rounded-xl hover:bg-gray-50 transition font-bold text-gray-700"
      >
        <img src="https://www.svgrepo.com/show/475656/google-color.svg" alt="Google" className="w-5 h-5 mr-3"/>
        Continue with Google
      </button>

      <p className="text-center text-sm text-gray-500 mt-4 font-medium">
        {isLogin ? "Don't have an account?" : "Already have an account?"}
        <button 
          onClick={() => { setIsLogin(!isLogin); setErrorMsg(''); }} 
          className="ml-2 text-red-600 font-extrabold hover:underline"
        >
          {isLogin ? "Sign up" : "Log in"}
        </button>
      </p>
    </div>
  );
}
