import React, { useEffect } from ‘react’;
import { BrowserRouter, Routes, Route, useLocation, useNavigate } from ‘react-router-dom’;
import { Toaster } from ‘sonner’;
import { I18nProvider } from ‘./lib/i18n’;
import { AuthProvider } from ‘./lib/auth’;

// === STANDARD PAGES ===
import Landing from ‘./pages/Landing’;
import Dashboard from ‘./pages/Dashboard’;
import AuthCallback from ‘./pages/AuthCallback’;
import About from ‘./pages/About’;
import Pricing from ‘./pages/Pricing’;
import FAQ from ‘./pages/FAQ’;
import Contact from ‘./pages/Contact’;
import Privacy from ‘./pages/Privacy’;
import Terms from ‘./pages/Terms’;
import Account from ‘./pages/Account’;
import Levels from ‘./pages/Levels’;
import NotFound from ‘./pages/NotFound’;
import PublicLibrary from ‘./pages/PublicLibrary’;
import ProfileSettings from ‘./pages/ProfileSettings’;
import AuthModal from ‘./pages/AuthModal’;
import WorksheetView from ‘./pages/WorksheetView’;
import { CookieConsent } from ‘./components/CookieConsent’;
import ‘./App.css’;

// ─────────────────────────────────────────────
// OAuth redirect interceptor
// Runs before any route renders. If the URL hash
// contains session_id= (Emergent Google OAuth
// redirect), we hand off to AuthCallback cleanly
// instead of relying on hash detection inside
// every render cycle.
// ─────────────────────────────────────────────
function OAuthGate({ children }) {
const location = useLocation();
const navigate = useNavigate();

useEffect(() => {
if (location.hash?.includes(‘session_id=’)) {
// Replace history entry so Back button doesn’t re-trigger OAuth
navigate(’/auth/callback’ + location.hash, { replace: true });
}
}, [location.hash, navigate]);

// If we’re mid-redirect, render nothing to avoid a flash
if (location.hash?.includes(‘session_id=’)) return null;

return children;
}

// ─────────────────────────────────────────────
// Route tree
// ─────────────────────────────────────────────
function AppRouter() {
const navigate = useNavigate();

return (
<OAuthGate>
<Routes>
{/* Core */}
<Route path=”/” element={<Landing />} />
<Route path=”/dashboard” element={<Dashboard />} />
<Route path=”/levels” element={<Levels />} />

```
    {/* Auth */}
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

    {/* Features */}
    <Route path="/library" element={<PublicLibrary />} />
    <Route path="/worksheet/:id" element={<WorksheetView />} />
    <Route path="/profile" element={<ProfileSettings />} />

    {/* Account */}
    <Route path="/account" element={<Account />} />

    {/* Info / Legal */}
    <Route path="/about" element={<About />} />
    <Route path="/pricing" element={<Pricing />} />
    <Route path="/faq" element={<FAQ />} />
    <Route path="/contact" element={<Contact />} />
    <Route path="/privacy" element={<Privacy />} />
    <Route path="/terms" element={<Terms />} />

    {/* 404 */}
    <Route path="*" element={<NotFound />} />
  </Routes>
</OAuthGate>
```

);
}

// ─────────────────────────────────────────────
// Provider order (outside-in):
//   I18nProvider   — no router dependency
//   BrowserRouter  — must wrap everything that
//                    uses router hooks
//   AuthProvider   — uses useNavigate internally
//                    via startLogin(), so it MUST
//                    be inside BrowserRouter
// ─────────────────────────────────────────────
function App() {
return (
<I18nProvider>
<BrowserRouter>
<AuthProvider>
<AppRouter />
<CookieConsent />
<Toaster
position=“bottom-right”
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