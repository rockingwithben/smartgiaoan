import React from 'react';

import { useEffect } from 'react';

export function SponsorSlot({ size = 'sidebar', label = 'Sponsored', testId }) {
  useEffect(() => {
    try {
      (window.adsbygoogle = window.adsbygoogle || []).push({});
    } catch (err) {
      console.error('AdSense error:', err);
    }
  }, []);

  const sizes = {
    sidebar: 'min-h-[260px] w-full',
    leaderboard: 'min-h-[90px] w-full',
    inline: 'min-h-[120px] w-full',
  };
  return (
    <div className={`sponsor-slot ${sizes[size]} p-4 flex flex-col`} data-testid={testId || `sponsor-slot-${size}`}>
      <span className="sponsor-slot-label mb-2 text-xs text-gray-400 uppercase tracking-wider">{label}</span>
      <div className="flex-1 w-full bg-gray-50 flex items-center justify-center overflow-hidden">
        <ins 
          className="adsbygoogle"
          style={{ display: 'block', width: '100%', height: '100%' }}
          data-ad-client="ca-pub-6737475067243465"
          data-ad-slot="8744271743"
          data-ad-format="auto"
          data-full-width-responsive="true"
        ></ins>
      </div>
    </div>
  );
}
