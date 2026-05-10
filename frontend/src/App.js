import React, { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Toaster } from 'sonner';
import { I18nProvider } from './lib/i18n';
import { AuthProvider } from './lib/auth';
import { wakeUpServer } from './lib/api';

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
import WorksheetUpload from './pages/WorksheetUpload';
import { CookieConsent } from './components/CookieConsent';
import { SponsorManager } from './components/SponsorManager';
import { SEO } from './meta'; // Import SEO component
import './App.css';
import GoogleAdSenseScript from './components/GoogleAdSense';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }
  static getDerivedStateFromError(error) {
    return { hasError: true };
  }
  componentDidCatch(error, errorInfo) {
    console.error("SmartGiaoAn Critical UI Crash:", error, errorInfo);
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-4 text-center">
          <div className="text-5xl mb-4">🚨</div>
          <h2 className="text-2xl font-black text-gray-900 mb-2">Something went wrong.</h2>
          <p className="text-gray-500 font-medium text-sm mb-6 max-w-md mx-auto">
            Our servers had a minor hiccup. Don't worry, your data is safe. Please return to the homepage to continue.
          </p>
          <button
            onClick={() => window.location.href = '/'}
            className="bg-black text-white px-6 py-3 rounded-xl font-bold hover:bg-gray-800 transition"
          >
            Go to Homepage
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

function AppRouter() {
  return (
    <>
      <SponsorManager />
      <Routes>
        <Route path="/" element={<Landing />} />
        {/* FIX: Restored the manual login route */}
        <Route path="/login" element={<AuthModal />} />
        
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/library" element={<PublicLibrary />} />
        <Route path="/worksheet/:id" element={<WorksheetView />} />
        <Route path="/upload" element={<WorksheetUpload />} />
        <Route path="/auth/callback" element={<AuthCallback />} />
        <Route path="/about" element={<About />} />
        <Route path="/pricing" element={<Pricing />} />
        <Route path="/faq" element={<FAQ />} />
        <Route path="/contact" element={<Contact />} />
        <Route path="/privacy" element={<Privacy />} />
        <Route path="/terms" element={<Terms />} />
        <Route path="/account" element={<Account />} />
        <Route path="/profile" element={<ProfileSettings />} />
        <Route path="/levels" element={<Levels />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
      <CookieConsent />
      <Toaster position="top-center" richColors />
    </>
  );
}

function App() {
  const [showEasterEgg, setShowEasterEgg] = useState(false);

  useEffect(() => {
    wakeUpServer();

    const konamiCode = [
      "ArrowUp", "ArrowUp", "ArrowDown", "ArrowDown",
      "ArrowLeft", "ArrowRight", "ArrowLeft", "ArrowRight",
      "b", "a", "Enter",
    ];
    let konamiIndex = 0;

    const handleKeyDown = (event) => {
      if (event.key === konamiCode[konamiIndex]) {
        konamiIndex++;
        if (konamiIndex === konamiCode.length) {
          console.log("Konami Code entered!");
          setShowEasterEgg(true);
          setTimeout(() => setShowEasterEgg(false), 5000); // Show for 5 seconds
          konamiIndex = 0; // Reset for next time
        }
      } else {
        konamiIndex = 0;
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);

  return (
    <ErrorBoundary>
      <I18nProvider>
        <BrowserRouter>
          <AuthProvider>
            <AppRouter />
            <GoogleAdSenseScript />
            {showEasterEgg && (
              <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-[9999] animate-bounce">
                <p className="text-white text-4xl font-bold">🎉 Konami! 🎉</p>
              </div>
            )}
          </AuthProvider>
        </BrowserRouter>
      </I18nProvider>
    </ErrorBoundary>
  );
}

export default App;