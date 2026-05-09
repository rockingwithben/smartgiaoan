import { useEffect, useState } from 'react';
import { useAuth } from '../lib/auth';
import { AlertTriangle } from 'lucide-react';
import { Link } from 'react-router-dom';

export function SponsorManager() {
  const { user, loading } = useAuth();
  const [sponsorBlockDetected, setSponsorBlockDetected] = useState(false);

  useEffect(() => {
    if (loading) return;

    // Show ads if not logged in OR logged in but on free tier
    const isFree = !user || user.subscription_tier === 'free';

    const scriptId = 'google-adsense-script';
    let script = document.getElementById(scriptId);

    if (isFree) {
      // 1. Inject Sponsor Script if not there
      if (!script) {
        script = document.createElement('script');
        script.id = scriptId;
        script.async = true;
        script.src = 'https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-6737475067243465';
        script.crossOrigin = 'anonymous';
        
        // If the script fails to load entirely (often network blocked)
        script.onerror = () => { console.log('Sponsor script failed to load (possible network filter)'); /* Soft Warning instead of hard block */ };
        
        document.head.appendChild(script);
      }

      // 2. Disabled bait script for soft warning instead of hard block
      // const checkBait = setTimeout(() => {
      //   const bait = document.createElement('div');
      //   bait.className = 'pub_300x250 pub_300x250m pub_728x90 text-ad textAd text_ad text_ads text-ads text-ad-links';
      //   bait.style.position = 'absolute';
      //   bait.style.left = '-9999px';
      //   document.body.appendChild(bait);
      //   
      //   setTimeout(() => {
      //     if (bait.offsetHeight === 0 || window.getComputedStyle(bait).display === 'none') {
      //       console.log('Ad blocker detected via bait element');
      //     }
      //     bait.remove();
      //   }, 100);
      // }, 1000);

      // return () => clearTimeout(checkBait);
    } else {
      // Premium/Basic
      if (script) {
        script.remove();
      }
      setSponsorBlockDetected(false);
    }
  }, [user, loading]);

  // Soft warning instead of hard wall
  if (sponsorBlockDetected) {
    console.log("Sponsor filter warning logged to console.");
  }

  return null;
}
