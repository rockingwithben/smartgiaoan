import React, { useEffect, useState } from 'react';

// AdSense Client ID - should be set in environment variables
const ADSENSE_CLIENT_ID = import.meta.env.VITE_ADSENSE_CLIENT_ID || 'ca-pub-XXXXXXXXXXXXXXXX';

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

// Responsive ad slot that adapts to container width
export function AdUnit({ 
  slotId, 
  className = '',
  format = 'auto',
  layout = 'in-article',
  layoutKey = '-gw-r+ee-2+2a'
}) {
  const [adLoaded, setAdLoaded] = useState(false);

  useEffect(() => {
    // Push ad after a short delay to ensure container is rendered
    const timer = setTimeout(() => {
      try {
        (window.adsbygoogle = window.adsbygoogle || []).push({});
        setAdLoaded(true);
      } catch (e) {
        console.warn('AdSense push error:', e);
      }
    }, 100);

    return () => clearTimeout(timer);
  }, [slotId]);

  return (
    <div className={`ads-container ${className}`}>
      <ins
        className="adsbygoogle"
        style={{ display: 'block', minHeight: '90px' }}
        data-ad-client={ADSENSE_CLIENT_ID}
        data-ad-slot={slotId}
        data-ad-format={format}
        data-full-width-responsive="true"
      />
    </div>
  );
}

// Banner ad (horizontal)
export function BannerAd({ slotId, className = '' }) {
  return (
    <div className={`flex justify-center my-4 ${className}`}>
      <AdUnit slotId={slotId} format="horizontal" />
    </div>
  );
}

// In-article ad (rectangle)
export function InArticleAd({ slotId, className = '' }) {
  return (
    <div className={`flex justify-center my-6 ${className}`}>
      <AdUnit slotId={slotId} format="mediumRectangle" />
    </div>
  );
}

// Mobile banner (smaller)
export function MobileBannerAd({ slotId, className = '' }) {
  return (
    <div className={`flex justify-center my-3 ${className} md:hidden`}>
      <AdUnit slotId={slotId} format="mobile-banner" />
    </div>
  );
}

// Desktop leaderboard
export function LeaderboardAd({ slotId, className = '' }) {
  return (
    <div className={`flex justify-center my-5 ${className} hidden md:flex`}>
      <AdUnit slotId={slotId} format="leaderboard" />
    </div>
  );
}

// Sponsored content placeholder
export function SponsoredContent({ children, className = '' }) {
  return (
    <div className={`border border-gray-200 rounded-lg p-4 bg-gray-50 ${className}`}>
      <div className="text-xs text-gray-400 uppercase tracking-wider mb-2">Sponsored</div>
      {children}
    </div>
  );
}

// Ad placeholder for development (when AdSense is not configured)
export function AdPlaceholder({ height = '90px', className = '' }) {
  const isDev = import.meta.env.DEV;
  
  if (!isDev) return null;
  
  return (
    <div 
      className={`bg-gray-100 rounded flex items-center justify-center text-gray-400 text-xs ${className}`}
      style={{ height }}
    >
      Ad Space ({height})
    </div>
  );
}

export default {
  AdSenseScript,
  AdUnit,
  BannerAd,
  InArticleAd,
  MobileBannerAd,
  LeaderboardAd,
  SponsoredContent,
  AdPlaceholder
};