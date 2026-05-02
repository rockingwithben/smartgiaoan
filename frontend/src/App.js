import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, useLocation, useNavigate } from 'react-router-dom';
import { Toaster } from 'sonner';
import { I18nProvider } from './lib/i18n';
import { AuthProvider } from './lib/auth';

import Landing from './pages/Landing';
import Dashboard from './pages/Dashboard';
import AuthCallback from './pages/AuthCallback';
import About from './pages/About';
import Pricing from './pages/Pricing';
import FAQ from './pages/FAQ';
import Contact from './pages/Contact';
import Privacy from './pages/Privacy';
import Terms from './pages/Terms';
import Account from './pages/Account';
import Levels from './pages/Levels';
import NotFound from './pages/NotFound';
import PublicLibrary from './pages/PublicLibrary';
import ProfileSettings from './pages/ProfileSettings';
import AuthModal from './pages/AuthModal';
import WorksheetView from './pages/WorksheetView';
import { CookieConsent } from './components/CookieConsent';
import './App.css';

function OAuthGate({ children }) {
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    if (location.hash && location.hash.includes('session_id=')) {
      navigate('/auth/callback' + location.hash, { replace: true });
    }
  }, [location.hash, navigate]);

  if (location.hash && location.hash.includes('session_id=')) return null;

  return children;
}

function AppRouter() {
  const navigate = useNavigate();

  return (
    <OAuthGate>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/levels" element={<Levels />} />

        <Route path="/auth/callback" element={<AuthCallback />} />
        <Route
          path="/login"
          element={
            <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
              <AuthModal
                onLoginSuccess={() => navigate('/dashboard', { replace: true })}
              />
            </div>
          }
        />

        <Route path="/library" element={<PublicLibrary />} />
        <Route path="/worksheet/:id" element={<WorksheetView />} />
        <Route path="/profile" element={<ProfileSettings />} />
        <Route path="/account" element={<Account />} />

        <Route path="/about" element={<About />} />
        <Route path="/pricing" element={<Pricing />} />
        <Route path="/faq" element={<FAQ />} />
        <Route path="/contact" element={<Contact />} />
        <Route path="/privacy" element={<Privacy />} />
        <Route path="/terms" element={<Terms />} />

        <Route path="*" element={<NotFound />} />
      </Routes>
    </OAuthGate>
  );
}

function App() {
  return (
    <I18nProvider>
      <BrowserRouter>
        <AuthProvider>
          <AppRouter />
          <CookieConsent />
          <Toaster
            position="bottom-right"
            richColors
            closeButton
            toastOptions={{ duration: 4000 }}
          />
        </AuthProvider>
      </BrowserRouter>
    </I18nProvider>
  );
}

export default App;
