import { useEffect } from 'react';
import { useAuth } from '../lib/auth';

export function AdManager() {
  const { user, loading } = useAuth();

  useEffect(() => {
    if (loading) return;

    // Show ads if not logged in OR logged in but on free tier
    const isFree = !user || user.subscription_tier === 'free';

    const scriptId = 'google-adsense-script';
    let script = document.getElementById(scriptId);

    if (isFree) {
      if (!script) {
        script = document.createElement('script');
        script.id = scriptId;
        script.async = true;
        script.src = 'https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-6737475067243465';
        script.crossOrigin = 'anonymous';
        document.head.appendChild(script);
      }
    } else {
      if (script) {
        script.remove();
      }
    }
  }, [user, loading]);

  return null;
}
