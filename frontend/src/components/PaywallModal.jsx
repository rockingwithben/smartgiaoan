import React, { useEffect, useRef, useState } from 'react';
import { useI18n } from '../lib/i18n';
import { markPremium } from '../lib/api';
import { useAuth } from '../lib/auth';

export function PaywallModal({ open, onClose, onWatchAd }) {
  const { t } = useI18n();
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md p-4" data-testid="paywall-modal">
      <div className="bg-white border border-border w-full max-w-2xl p-10 animate-fade-up">
        <div className="overline text-terracotta">Free limit reached</div>
        <h3 className="font-display text-4xl mt-2 leading-tight">{t('paywall_title')}</h3>
        <p className="text-muted-foreground mt-3">{t('paywall_sub')}</p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-8">
          <button onClick={() => onWatchAd('short')} className="btn-secondary !py-4" data-testid="paywall-watch-15">
            {t('paywall_watch')}
          </button>
          <button onClick={() => onWatchAd('medium')} className="btn-secondary !py-4" data-testid="paywall-watch-30">
            {t('paywall_watch30')}
          </button>
          <button onClick={() => onWatchAd('long')} className="btn-secondary !py-4" data-testid="paywall-watch-45">
            {t('paywall_watch45')}
          </button>
        </div>
        <div className="mt-6 pt-6 border-t border-border flex items-center justify-between">
          <div>
            <p className="font-display text-2xl">£5 / month</p>
            <p className="text-sm text-muted-foreground">Unlimited worksheets · No ads</p>
          </div>
          <button onClick={() => { window.location.hash = '#upgrade'; onClose(); }} className="btn-primary" data-testid="paywall-upgrade-btn">
            {t('paywall_upgrade')}
          </button>
        </div>
        <button onClick={onClose} className="mt-6 text-xs text-muted-foreground hover:text-ink" data-testid="paywall-close">
          Close
        </button>
      </div>
    </div>
  );
}

export function UpgradeModal({ open, onClose }) {
  const { t } = useI18n();
  const { user, refresh } = useAuth();
  const containerRef = useRef(null);
  const [activating, setActivating] = useState(false);

  useEffect(() => {
    if (!open) return;
    if (!containerRef.current) return;
    // Render PayPal hosted button
    if (window.paypal && window.paypal.HostedButtons) {
      try {
        containerRef.current.innerHTML = '<div id="paypal-container-KRKWACD47HF7G"></div>';
        window.paypal
          .HostedButtons({ hostedButtonId: 'KRKWACD47HF7G' })
          .render('#paypal-container-KRKWACD47HF7G');
      } catch (e) { /* paypal not ready */ }
    }
  }, [open]);

  if (!open) return null;

  const activate = async () => {
    if (!user) return;
    setActivating(true);
    try {
      await markPremium();
      await refresh();
      onClose();
    } finally {
      setActivating(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md p-4" data-testid="upgrade-modal">
      <div className="bg-white border border-border w-full max-w-xl p-10 animate-fade-up">
        <div className="overline text-terracotta">Premium</div>
        <h3 className="font-display text-4xl mt-2">{t('upgrade_modal_title')}</h3>
        <p className="text-muted-foreground mt-2">{t('upgrade_modal_sub')}</p>

        <div className="mt-8 p-6 bg-sand border border-border" ref={containerRef} data-testid="paypal-container-wrapper">
          <div id="paypal-container-KRKWACD47HF7G"></div>
        </div>

        <p className="mt-6 text-xs text-muted-foreground italic">{t('after_paypal_note')}</p>
        <div className="mt-4 flex items-center justify-between gap-3">
          <button onClick={onClose} className="text-xs text-muted-foreground hover:text-ink" data-testid="upgrade-close">
            Close
          </button>
          <button
            onClick={activate}
            disabled={!user || activating}
            className="btn-primary text-sm"
            data-testid="activate-premium-btn"
          >
            {activating ? '…' : t('activate_premium')}
          </button>
        </div>
      </div>
    </div>
  );
}
