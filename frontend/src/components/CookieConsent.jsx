import React, { useState, useEffect } from 'react';

export function CookieConsent() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    try {
      if (!localStorage.getItem('sga_cookies_accepted')) {
        setVisible(true);
      }
    } catch {}
  }, []);

  const accept = () => {
    try { localStorage.setItem('sga_cookies_accepted', '1'); } catch {}
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 sm:left-auto sm:right-6 sm:max-w-sm z-50 bg-white border border-gray-200 rounded-2xl shadow-xl p-5">
      <p className="text-sm font-medium text-gray-700 mb-4 leading-relaxed">
        We use cookies to keep you signed in and remember your preferences.{' '}
        <a href="/privacy" className="text-red-600 font-bold hover:underline">Privacy policy</a>.
      </p>
      <div className="flex gap-2">
        <button onClick={accept}
          className="flex-1 bg-black text-white text-sm font-bold py-2 rounded-xl hover:bg-gray-800 transition-colors">
          Accept
        </button>
        <button onClick={() => setVisible(false)}
          className="px-4 text-sm font-bold text-gray-500 hover:text-black transition-colors">
          Dismiss
        </button>
      </div>
    </div>
  );
}
