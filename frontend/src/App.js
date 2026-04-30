import React from 'react';
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
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
import { CookieConsent } from './components/CookieConsent';
import './App.css';

// === NEW SMARTGIAOAN IMPORTS ===
// Make sure you saved these files in the matching folders!
import PublicLibrary from './pages/PublicLibrary';
import ProfileSettings from './pages/ProfileSettings';
import AuthModal from './pages/AuthModal';
import WorksheetView from './pages/WorksheetView';

function AppRouter() {
  const location = useLocation();
  
  if (location.hash?.includes('session_id=')) {
    return <AuthCallback />;
  }
  
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/dashboard" element={<Dashboard />} />
      <Route path="/levels" element={<Levels />} />
      <Route path="/about" element={<About />} />
      <Route path="/pricing" element={<Pricing />} />
      <Route path="/faq" element={<FAQ />} />
      <Route path="/contact" element={<Contact />} />
      <Route path="/privacy" element={<Privacy />} />
      <Route path="/terms" element={<Terms />} />
      <Route path="/account" element={<Account />} />
      
      {/* === NEW SMARTGIAOAN ROUTES === */}
      <Route path="/library" element={<PublicLibrary />} />
      <Route path="/worksheet/:id" element={<WorksheetView />} />
      <Route path="/profile" element={<ProfileSettings />} />
      <Route path="/login" element={
        <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
          <AuthModal onLoginSuccess={(user) => {
            // Once they successfully log in with the new system, shoot them straight to the dashboard
            window.location.href = "/dashboard";
          }} />
        </div>
      } />

      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

function App() {
  return (
    <I18nProvider>
      <AuthProvider>
        <BrowserRouter>
          <AppRouter />
          <CookieConsent />
          <Toaster position="bottom-right" richColors closeButton toastOptions={{ duration: 4000 }} />
        </BrowserRouter>
      </AuthProvider>
    </I18nProvider>
  );
}

export default App;
