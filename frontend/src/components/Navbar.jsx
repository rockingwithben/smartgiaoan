import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../lib/auth';
import { useI18n } from '../lib/i18n';
import { UserAvatar } from '../pages/AuthModal';

export function Navbar() {
  const { user, logout, startLogin } = useAuth();
  const { t, lang, setLang } = useI18n();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <nav className="sticky top-0 z-50 bg-white border-b border-gray-100 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">

          <Link to="/" className="flex items-center gap-2 flex-shrink-0">
            <span className="font-serif font-black text-xl text-gray-900 tracking-tight">
              Smart<span className="text-red-600">GiaoAn</span>
            </span>
          </Link>

          <div className="hidden md:flex items-center gap-6">
            <Link to="/dashboard" className="text-sm font-bold text-gray-600 hover:text-black transition-colors">{t('dashboard')}</Link>
            <Link to="/library" className="text-sm font-bold text-gray-600 hover:text-black transition-colors">Library</Link>
            <Link to="/pricing" className="text-sm font-bold text-gray-600 hover:text-black transition-colors">Pricing</Link>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setLang(lang === 'en' ? 'vi' : 'en')}
              className="text-xs font-black uppercase tracking-widest border border-gray-200 px-2.5 py-1 rounded-lg hover:border-black transition-colors hidden sm:block"
            >
              {lang === 'en' ? 'VI' : 'EN'}
            </button>

            {user ? (
              <div className="relative">
                <button
                  onClick={() => setMenuOpen(!menuOpen)}
                  className="flex items-center gap-2 hover:opacity-80 transition-opacity"
                >
                  {user.picture ? (
                    <img src={user.picture} alt={user.name} className="w-8 h-8 rounded-full border-2 border-white shadow-sm" />
                  ) : (
                    <UserAvatar name={user.name} size="w-8 h-8" textSize="text-xs" />
                  )}
                  {user.is_premium && (
                    <span className="hidden sm:block text-[9px] uppercase tracking-widest font-black text-red-600 border border-red-300 px-1.5 py-0.5 rounded bg-red-50">PRO</span>
                  )}
                </button>
                {menuOpen && (
                  <div className="absolute right-0 mt-2 w-48 bg-white border border-gray-100 rounded-2xl shadow-xl py-2 z-50">
                    <div className="px-4 py-2 border-b border-gray-50">
                      <p className="font-bold text-sm text-gray-900 truncate">{user.name}</p>
                      <p className="text-xs text-gray-400 truncate">{user.email}</p>
                    </div>
                    <Link to="/dashboard" onClick={() => setMenuOpen(false)} className="block px-4 py-2 text-sm font-bold text-gray-700 hover:bg-gray-50">{t('dashboard')}</Link>
                    <Link to="/account" onClick={() => setMenuOpen(false)} className="block px-4 py-2 text-sm font-bold text-gray-700 hover:bg-gray-50">Account</Link>
                    {!user.is_premium && (
                      <Link to="/pricing" onClick={() => setMenuOpen(false)} className="block px-4 py-2 text-sm font-bold text-red-600 hover:bg-red-50">Upgrade to Premium</Link>
                    )}
                    <button onClick={() => { setMenuOpen(false); logout(); }} className="w-full text-left px-4 py-2 text-sm font-bold text-gray-500 hover:bg-gray-50">{t('sign_out')}</button>
                  </div>
                )}
              </div>
            ) : (
              <button
                onClick={startLogin}
                className="bg-black text-white text-sm font-bold px-4 py-2 rounded-xl hover:bg-gray-800 transition-colors shadow-sm"
              >
                {t('sign_in')}
              </button>
            )}

            <button onClick={() => setMenuOpen(!menuOpen)} className="md:hidden p-2 rounded-lg hover:bg-gray-100 transition-colors">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {menuOpen && (
        <div className="md:hidden border-t border-gray-100 bg-white px-4 py-3 space-y-2">
          <Link to="/dashboard" onClick={() => setMenuOpen(false)} className="block py-2 font-bold text-gray-700">{t('dashboard')}</Link>
          <Link to="/library" onClick={() => setMenuOpen(false)} className="block py-2 font-bold text-gray-700">Library</Link>
          <Link to="/pricing" onClick={() => setMenuOpen(false)} className="block py-2 font-bold text-gray-700">Pricing</Link>
        </div>
      )}
    </nav>
  );
}
