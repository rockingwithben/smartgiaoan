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

  const NAV_LINKS = [
    { to: '/levels', label: t('lang') === 'vi' ? 'Cấp độ' : 'Levels' },
    { to: '/pricing', label: t('pricing_title') === 'Simple pricing' ? 'Pricing' : 'Giá' },
    { to: '/about', label: 'About' },
    { to: '/faq', label: 'FAQ' },
  ];

  return (
    <header className="sticky top-0 z-30 bg-background/85 backdrop-blur-md border-b border-border" data-testid="navbar">
      <div className="max-w-7xl mx-auto flex items-center justify-between px-6 lg:px-10 py-4">
        <Link to="/" className="flex items-baseline gap-2" data-testid="brand-link">
          <span className="font-display text-2xl font-medium tracking-tight">SmartGiao<span className="text-terracotta">An</span></span>
          <span className="hidden sm:inline text-[10px] tracking-[0.2em] uppercase text-muted-foreground font-bold">VN · ESL</span>
        </Link>

        <nav className="hidden md:flex items-center gap-6 lg:gap-7 text-sm">
          <Link to="/levels" className={navLinkClass(location, '/levels')} data-testid="nav-levels">Levels</Link>
          <Link to="/pricing" className={navLinkClass(location, '/pricing')} data-testid="nav-pricing">Pricing</Link>
          <Link to="/about" className={navLinkClass(location, '/about')} data-testid="nav-about">About</Link>
          <Link to="/faq" className={navLinkClass(location, '/faq')} data-testid="nav-faq">FAQ</Link>
        </nav>

        <div className="flex items-center gap-4 sm:gap-5">
          <LangToggle />
          {user ? (
            <>
              {!onDashboard && (
                <Link to="/dashboard" className="text-sm font-medium hover:text-terracotta transition-colors" data-testid="nav-dashboard">
                  {t('dashboard')}
                </Link>
              )}
              <Link to="/account" className="hidden md:flex items-center gap-2 hover:text-terracotta" data-testid="nav-account">
                {user.picture && <img src={user.picture} alt="" className="w-7 h-7 rounded-full border border-border" />}
                <span className="text-sm">{user.name?.split(' ')[0]}</span>
                {user.is_premium && (
                  <span className="text-[10px] uppercase tracking-widest font-bold text-terracotta border border-terracotta px-1.5 py-0.5">Pro</span>
                )}
              </Link>
              <button onClick={logout} className="text-sm hover:text-terracotta transition-colors" data-testid="logout-btn">
                {t('sign_out')}
              </button>
            </>
          ) : (
            <button onClick={startLogin} className="btn-primary !py-2 !px-4 text-sm" data-testid="signin-btn">
              {t('sign_in')}
            </button>
          )}
        </div>
      </div>
    </header>
  );
}

function navLinkClass(location, to) {
  const active = location.pathname === to;
  return `transition-colors ${active ? 'text-terracotta font-medium' : 'text-foreground/80 hover:text-terracotta'}`;
}
