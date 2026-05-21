import React, { useEffect, useState, lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Toaster } from 'sonner';
import { I18nProvider } from './lib/i18n';
import { AuthProvider } from './lib/auth';
import { wakeUpServer } from './lib/api';

// Lazy load page components
const Landing = lazy(() => import('./pages/Landing'));
const Dashboard = lazy(() => import('./pages/Dashboard'));
const AuthCallback = lazy(() => import('./pages/AuthCallback'));
const About = lazy(() => import('./pages/About'));
const Pricing = lazy(() => import('./pages/Pricing'));
const FAQ = lazy(() => import('./pages/FAQ'));
const Contact = lazy(() => import('./pages/Contact'));
const Privacy = lazy(() => import('./pages/Privacy'));
const Terms = lazy(() => import('./pages/Terms'));
const Account = lazy(() => import('./pages/Account'));
const Levels = lazy(() => import('./pages/Levels'));
const NotFound = lazy(() => import('./pages/NotFound'));
const PublicLibrary = lazy(() => import('./pages/PublicLibrary'));
const ProfileSettings = lazy(() => import('./pages/ProfileSettings.jsx'));
const AuthModal = lazy(() => import('./pages/AuthModal'));
const WorksheetView = lazy(() => import('./pages/WorksheetView'));
const WorksheetUpload = lazy(() => import('./pages/WorksheetUpload'));
const VerifyEmail = lazy(() => import('./pages/VerifyEmail'));

import { CookieConsent } from './components/CookieConsent';
import { SponsorManager } from './components/SponsorManager';
import GoogleAdSenseScript from './components/GoogleAdSense';

// Simple loading fallback component
const PageLoading = () => (
  <div className="min-h-screen flex items-center justify-center text-lg font-medium text-gray-500">
    Loading page...
  </div>
);

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
        <Route path="/" element={<Suspense fallback={<PageLoading />}><Landing /></Suspense>} />
        {/* FIX: Restored the manual login route */}
        <Route path="/login" element={<Suspense fallback={<PageLoading />}><AuthModal /></Suspense>} />
        
        <Route path="/dashboard" element={<Suspense fallback={<PageLoading />}><Dashboard /></Suspense>} />
        <Route path="/library" element={<Suspense fallback={<PageLoading />}><PublicLibrary /></Suspense>} />
        <Route path="/worksheet/:id" element={<Suspense fallback={<PageLoading />}><WorksheetView /></Suspense>} />
        <Route path="/upload" element={<Suspense fallback={<PageLoading />}><WorksheetUpload /></Suspense>} />
        <Route path="/auth/callback" element={<Suspense fallback={<PageLoading />}><AuthCallback /></Suspense>} />
        <Route path="/verify-email" element={<Suspense fallback={<PageLoading />}><VerifyEmail /></Suspense>} />
        <Route path="/about" element={<Suspense fallback={<PageLoading />}><About /></Suspense>} />
        <Route path="/pricing" element={<Suspense fallback={<PageLoading />}><Pricing /></Suspense>} />
        <Route path="/faq" element={<Suspense fallback={<PageLoading />}><FAQ /></Suspense>} />
        <Route path="/contact" element={<Suspense fallback={<PageLoading />}><Contact /></Suspense>} />
        <Route path="/privacy" element={<Suspense fallback={<PageLoading />}><Privacy /></Suspense>} />
        <Route path="/terms" element={<Suspense fallback={<PageLoading />}><Terms /></Suspense>} />
        <Route path="/account" element={<Suspense fallback={<PageLoading />}><Account /></Suspense>} />
        <Route path="/profile" element={<Suspense fallback={<PageLoading />}><ProfileSettings /></Suspense>} />
        <Route path="/levels" element={<Suspense fallback={<PageLoading />}><Levels /></Suspense>} />
        <Route path="*" element={<Suspense fallback={<PageLoading />}><NotFound /></Suspense>} />
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
