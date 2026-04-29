import React from 'react';

export function AdSlot({ size = 'sidebar', label = 'Sponsored', testId }) {
  const sizes = {
    sidebar: 'min-h-[260px] w-full',
    leaderboard: 'min-h-[90px] w-full',
    inline: 'min-h-[120px] w-full',
  };
  return (
    <div className={`ad-slot ${sizes[size]} p-4`} data-testid={testId || `ad-slot-${size}`}>
      <span className="ad-slot-label">{label}</span>
      {/* AdSense slot placeholder. Replace with <ins class="adsbygoogle" ...> after AdSense approval. */}
      <div className="text-center text-muted-foreground">
        <p className="font-display text-xl text-ink/70">Your ad could be here</p>
        <p className="text-xs mt-1 tracking-wider uppercase">smartgiaoan · {size}</p>
      </div>
    </div>
  );
}
