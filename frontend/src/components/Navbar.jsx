import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useI18n } from '../lib/i18n';
import { useAuth } from '../lib/auth';
import { LangToggle } from './LangToggle';

export function Navbar() {
  const { t } = useI18n();
  const { user, startLogin, logout } = useAuth();
  const location = useLocation();
  const onDashboard = location.pathname.startsWith('/dashboard');

  return (
    <header className="sticky top-0 z-30 bg-background/85 backdrop-blur-md border-b border-border" data-testid="navbar">
      <div className="max-w-7xl mx-auto flex items-center justify-between px-6 lg:px-10 py-4">
        <Link to="/" className="flex items-baseline gap-2" data-testid="brand-link">
          <span className="font-display text-2xl font-medium tracking-tight">SmartGiao<span className="text-terracotta">An</span></span>
          <span className="hidden sm:inline text-[10px] tracking-[0.2em] uppercase text-muted-foreground font-bold">VN · ESL</span>
        </Link>
        <nav className="flex items-center gap-5 sm:gap-7">
          <LangToggle />
          {user ? (
            <>
              {!onDashboard && (
                <Link to="/dashboard" className="text-sm font-medium hover:text-terracotta transition-colors" data-testid="nav-dashboard">
                  {t('dashboard')}
                </Link>
              )}
              <div className="hidden md:flex items-center gap-2">
                {user.picture && <img src={user.picture} alt="" className="w-7 h-7 rounded-full border border-border" />}
                <span className="text-sm">{user.name}</span>
                {user.is_premium && (
                  <span className="text-[10px] uppercase tracking-widest font-bold text-terracotta border border-terracotta px-1.5 py-0.5">Premium</span>
                )}
              </div>
              <button onClick={logout} className="text-sm hover:text-terracotta transition-colors" data-testid="logout-btn">
                {t('sign_out')}
              </button>
            </>
          ) : (
            <button onClick={startLogin} className="btn-primary !py-2 !px-4 text-sm" data-testid="signin-btn">
              {t('sign_in')}
            </button>
          )}
        </nav>
      </div>
    </header>
  );
}
