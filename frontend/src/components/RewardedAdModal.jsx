import React, { useEffect, useState } from 'react';
import { useI18n } from '../lib/i18n';
import { grantRewarded } from '../lib/api';
import { useAuth } from '../lib/auth';

export function RewardedAdModal({ open, tier, onClose, onClaimed }) {
  const { t } = useI18n();
  const { setUser } = useAuth();
  const tierSec = { short: 15, medium: 30, long: 45 }[tier] || 30;
  const [remaining, setRemaining] = useState(tierSec);
  const [claiming, setClaiming] = useState(false);

  useEffect(() => {
    if (!open) return;
    setRemaining(tierSec);
    const t1 = setInterval(() => setRemaining((r) => (r > 0 ? r - 1 : 0)), 1000);
    return () => clearInterval(t1);
  }, [open, tierSec]);

  if (!open) return null;
  const ready = remaining <= 0;

  const claim = async () => {
    try {
      setClaiming(true);
      const res = await grantRewarded(tier);
      if (res.user) setUser(res.user);
      onClaimed?.();
      onClose?.();
    } finally {
      setClaiming(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md p-4" data-testid="rewarded-ad-modal">
      <div className="bg-white border border-border w-full max-w-lg p-8 animate-fade-up">
        <div className="overline text-terracotta">Rewarded ad · {tierSec}s</div>
        <h3 className="font-display text-3xl mt-2">{t('rewarded_title')}</h3>
        <p className="text-sm text-muted-foreground mt-2">{t('rewarded_sub')}</p>

        {/* Ad placeholder area */}
        <div className="ad-slot min-h-[220px] mt-6 p-6">
          <span className="ad-slot-label">Sponsored · Rewarded</span>
          <div className="text-center">
            <p className="font-display text-2xl text-ink/80">Your sponsored message</p>
            <p className="text-xs mt-1 tracking-wider uppercase text-muted-foreground">Replace with AdSense rewarded creative</p>
          </div>
        </div>

        <div className="mt-6 flex items-center justify-between">
          <div className="text-sm">
            <span className="overline text-muted-foreground">{t('rewarded_skip_in')}</span>
            <div className="font-mono text-3xl font-bold">{remaining}s</div>
          </div>
          <button
            disabled={!ready || claiming}
            onClick={claim}
            className={`px-6 py-3 rounded-sm font-medium transition-all ${ready ? 'bg-terracotta text-white hover:bg-terracotta-hover hover:-translate-y-[1px]' : 'bg-secondary text-muted-foreground cursor-not-allowed'}`}
            data-testid="rewarded-claim-btn"
          >
            {claiming ? '…' : t('rewarded_claim')}
          </button>
        </div>
      </div>
    </div>
  );
}
