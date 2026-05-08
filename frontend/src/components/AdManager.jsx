import { useEffect, useState } from 'react';
import { useAuth } from '../lib/auth';
import { AlertTriangle } from 'lucide-react';
import { Link } from 'react-router-dom';

export function AdManager() {
  const { user, loading } = useAuth();
  const [adBlockDetected, setAdBlockDetected] = useState(false);

  useEffect(() => {
    if (loading) return;

    // Show ads if not logged in OR logged in but on free tier
    const isFree = !user || user.subscription_tier === 'free';

    const scriptId = 'google-adsense-script';
    let script = document.getElementById(scriptId);

    if (isFree) {
      // 1. Inject AdSense if not there
      if (!script) {
        script = document.createElement('script');
        script.id = scriptId;
        script.async = true;
        script.src = 'https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-6737475067243465';
        script.crossOrigin = 'anonymous';
        
        // If the script fails to load entirely (often network blocked)
        script.onerror = () => setAdBlockDetected(true);
        
        document.head.appendChild(script);
      }

      // 2. Double check by creating a bait element
      const checkBait = setTimeout(() => {
        const bait = document.createElement('div');
        bait.className = 'pub_300x250 pub_300x250m pub_728x90 text-ad textAd text_ad text_ads text-ads text-ad-links';
        bait.style.position = 'absolute';
        bait.style.left = '-9999px';
        document.body.appendChild(bait);
        
        setTimeout(() => {
          if (bait.offsetHeight === 0 || window.getComputedStyle(bait).display === 'none') {
            setAdBlockDetected(true);
          }
          bait.remove();
        }, 100);
      }, 1000);

      return () => clearTimeout(checkBait);
    } else {
      // Premium/Basic
      if (script) {
        script.remove();
      }
      setAdBlockDetected(false);
    }
  }, [user, loading]);

  if (adBlockDetected) {
    return (
      <div className="fixed inset-0 z-[9999] bg-gray-900/95 backdrop-blur-sm flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl max-w-md w-full p-8 text-center shadow-2xl">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <AlertTriangle className="w-8 h-8 text-red-600" />
          </div>
          <h2 className="text-2xl font-black text-gray-900 mb-4">Ad Blocker Detected</h2>
          <p className="text-gray-600 mb-6 leading-relaxed">
            We rely on ads to keep SmartGiaoAn free for teachers. Please disable your ad blocker or whitelist our site to continue generating worksheets.
          </p>
          <div className="space-y-3">
            <button 
              onClick={() => window.location.reload()} 
              className="w-full bg-black text-white font-bold py-3.5 rounded-xl hover:bg-gray-800 transition"
            >
              I've disabled it - Reload Page
            </button>
            <Link 
              to="/pricing" 
              onClick={() => window.location.reload()}
              className="block w-full border-2 border-gray-200 text-gray-700 font-bold py-3.5 rounded-xl hover:border-gray-300 transition"
            >
              Upgrade to Premium (Ad-Free)
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return null;
}
