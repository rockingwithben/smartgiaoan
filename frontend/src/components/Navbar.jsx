import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../lib/auth';
import { useI18n } from '../lib/i18n';

const AvatarFallback = ({ name }) => {
  const initial = name ? name.charAt(0).toUpperCase() : '?';
  return (
    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-gray-800 to-black text-white flex items-center justify-center text-xs font-bold shadow-sm">
      {initial}
    </div>
  );
};

export function Navbar() {
  const { user, logout } = useAuth();
  const { t, lang, setLang } = useI18n();
  const location = useLocation(); 
  
  const [menuOpen, setMenuOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname]);

  const isActive = (path) => location.pathname === path ? 'text-black' : 'text-gray-500 hover:text-black';

  return (
    <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-100 shadow-sm transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">

          <Link to="/" className="flex items-center gap-2 flex-shrink-0">
            <span className="font-serif font-black text-xl text-gray-900 tracking-tight relative group">
              Smart<span className="text-red-600">GiaoAn</span>
              <span className="absolute inset-0 flex items-center justify-center text-xs font-black text-blue-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none">
                BETA
              </span>
            </span>
          </Link>

          <div className="hidden md:flex items-center gap-6">
            <Link to="/dashboard" className={`text-sm font-bold transition-colors ${isActive('/dashboard')}`}>{t('dashboard') || 'Dashboard'}</Link>
            <Link to="/library" className={`text-sm font-bold transition-colors ${isActive('/library')}`}>Library</Link>
            <Link to="/upload" className={`text-sm font-bold transition-colors ${isActive('/upload')}`}>Share</Link>
            <Link to="/pricing" className={`text-sm font-bold transition-colors ${isActive('/pricing')}`}>Pricing</Link>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setLang(lang === 'en' ? 'vi' : 'en')}
              className="text-xs font-black uppercase tracking-widest border border-gray-200 px-2.5 py-1 rounded-lg hover:border-black transition-colors hidden sm:block"
            >
              {lang === 'en' ? 'VI' : 'EN'}
            </button>

            {user ? (
              <div className="relative" ref={dropdownRef}>
                <button
                  onClick={() => setMenuOpen(!menuOpen)}
                  className="flex items-center gap-2 hover:opacity-80 transition-opacity focus:outline-none"
                >
                  {user.picture ? (
                    <img src={user.picture} alt={user.name} className="w-8 h-8 rounded-full border-2 border-white shadow-sm object-cover" />
                  ) : (
                    <AvatarFallback name={user.name} />
                  )}
                  {user.is_premium && (
                    <span className="hidden sm:block text-[9px] uppercase tracking-widest font-black text-red-600 border border-red-300 px-1.5 py-0.5 rounded bg-red-50">PRO</span>
                  )}
                </button>
                
                {menuOpen && (
                  <div className="absolute right-0 mt-2 w-48 bg-white border border-gray-100 rounded-2xl shadow-xl py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-200">
                    <div className="px-4 py-3 border-b border-gray-50 mb-1">
                      <p className="font-bold text-sm text-gray-900 truncate">{user.name}</p>
                      <p className="text-xs text-gray-400 truncate">{user.email}</p>
                    </div>
                    <Link to="/dashboard" onClick={() => setMenuOpen(false)} className="block px-4 py-2 text-sm font-bold text-gray-700 hover:bg-gray-50">{t('dashboard') || 'Dashboard'}</Link>
                    <Link to="/account" onClick={() => setMenuOpen(false)} className="block px-4 py-2 text-sm font-bold text-gray-700 hover:bg-gray-50">Account</Link>
                    {!user.is_premium && (
                      <Link to="/pricing" onClick={() => setMenuOpen(false)} className="block px-4 py-2 text-sm font-bold text-red-600 hover:bg-red-50">Upgrade to Premium</Link>
                    )}
                    <div className="border-t border-gray-50 mt-1 pt-1">
                      <button onClick={() => { setMenuOpen(false); logout(); }} className="w-full text-left px-4 py-2 text-sm font-bold text-gray-500 hover:bg-gray-50">{t('sign_out') || 'Sign Out'}</button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <Link
                to="/login"
                className="bg-black text-white text-sm font-bold px-4 py-2 rounded-xl hover:bg-gray-800 transition-colors shadow-sm"
              >
                {t('sign_in') || 'Sign In'}
              </Link>
            )}

            <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="md:hidden p-2 rounded-lg hover:bg-gray-100 transition-colors focus:outline-none">
              <svg className="w-5 h-5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                {mobileMenuOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          </div>
        </div>
      </div>

      {mobileMenuOpen && (
        <div className="md:hidden border-t border-gray-100 bg-white px-4 py-4 space-y-3 shadow-inner animate-in slide-in-from-top-2 duration-200">
          <Link to="/dashboard" className={`block py-2 text-base font-bold ${isActive('/dashboard')}`}>{t('dashboard') || 'Dashboard'}</Link>
          <Link to="/library" className={`block py-2 text-base font-bold ${isActive('/library')}`}>Library</Link>
          <Link to="/upload" className={`block py-2 text-base font-bold ${isActive('/upload')}`}>Share</Link>
          <Link to="/pricing" className={`block py-2 text-base font-bold ${isActive('/pricing')}`}>Pricing</Link>
          
          <div className="pt-3 mt-1 border-t border-gray-50 flex items-center justify-between">
            <span className="text-sm font-bold text-gray-400">Language</span>
            <button
              onClick={() => setLang(lang === 'en' ? 'vi' : 'en')}
              className="text-xs font-black uppercase tracking-widest border border-gray-200 px-3 py-1.5 rounded-lg hover:border-black transition-colors"
            >
              {lang === 'en' ? 'Vietnamese' : 'English'}
            </button>
          </div>
        </div>
      )}
    </nav>
  );
}