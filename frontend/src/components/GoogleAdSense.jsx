import React, { useEffect, useState } from 'react';

// AdSense Client ID - should be set in environment variables
const ADSENSE_CLIENT_ID = process.env.REACT_APP_ADSENSE_CLIENT_ID || 'ca-pub-6737475067243465';

export function AdSenseScript() {
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (window.adsbygoogle) {
      setLoaded(true);
      return;
    }

    const script = document.createElement('script');
    script.src = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${ADSENSE_CLIENT_ID}`;
    script.async = true;
    script.crossOrigin = 'anonymous';
    script.onload = () => setLoaded(true);
    script.onerror = () => console.warn('Failed to load AdSense script');
    
    document.head.appendChild(script);

    return () => {
      // Don't remove script on unmount as it may be needed elsewhere
    };
  }, []);

  return null;
}

export default AdSenseScript;
