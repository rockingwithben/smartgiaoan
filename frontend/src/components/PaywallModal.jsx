import React, { useEffect, useRef, useState } from 'react';
import { useI18n } from '../lib/i18n';
import { markPremium } from '../lib/api';
import { useAuth } from '../lib/auth';

export function PaywallModal({ open, onClose, onWatchAd }) {
  const { t, lang } = useI18n();
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-md p-4 animate-in fade-in duration-300">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-xl overflow-hidden border border-gray-100">
        <div className="p-1 bg-gradient-to-r from-red-500 via-orange-500 to-yellow-500"></div>
        <div className="p-8 sm:p-12 text-center">
          <div className="inline-block px-4 py-1 rounded-full bg-red-50 text-red-600 text-xs font-black uppercase tracking-widest mb-4">
            {lang === 'vi' ? 'Đã đạt giới hạn' : 'Free limit reached'}
          </div>
          <h3 className="text-3xl sm:text-4xl font-extrabold text-gray-900 leading-tight mb-4">
            {t('paywall_title')}
          </h3>
          <p className="text-gray-500 font-medium mb-10">
            {t('paywall_sub')}
          </p>

          {/* Ad Reward Tiers */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-8">
            {[
              { tier: 'short', label: t('paywall_watch'), reward: '+1' },
              { tier: 'medium', label: t('paywall_watch30'), reward: '+2' },
              { tier: 'long', label: t('paywall_watch45'), reward: '+3' }
            ].map((item) => (
              <button 
                key={item.tier}
                onClick={() => onWatchAd(item.tier)}
                className="group flex flex-col items-center p-4 bg-gray-50 border border-gray-200 rounded-2xl hover:border-black hover:bg-white transition-all shadow-sm"
              >
                <span className="text-2xl mb-1 group-hover:scale-110 transition-transform">📺</span>
                <span className="text-[10px] font-black uppercase text-gray-400 group-hover:text-black">{item.label}</span>
                <span className="text-sm font-black text-red-600 mt-1">{item.reward} Credit</span>
              </button>
            ))}
          </div>

          <div className="pt-8 border-t border-gray-100 flex flex-col sm:flex-row items-center justify-between gap-6 text-left">
            <div>
              <p className="text-2xl font-black text-gray-900">200,000₫ <span className="text-sm text-gray-400 font-bold">/ month</span></p>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wide">Unlimited · No Ads · 24/7 Support</p>
            </div>
            <button 
              onClick={() => { window.location.hash = '#upgrade'; onClose(); }} 
              className="w-full sm:w-auto bg-black text-white px-8 py-4 rounded-2xl font-bold hover:bg-gray-800 transition-transform active:scale-95 shadow-lg"
            >
              {t('paywall_upgrade')} →
            </button>
          </div>
          
          <button onClick={onClose} className="mt-8 text-sm font-bold text-gray-400 hover:text-black transition-colors">
            {lang === 'vi' ? 'Để sau' : 'Maybe later'}
          </button>
        </div>
      </div>
    </div>
  );
}

export function UpgradeModal({ open, onClose }) {
  const { t, lang } = useI18n();
  const { user, refresh } = useAuth();
  const containerRef = useRef(null);
  const [activating, setActivating] = useState(false);

  useEffect(() => {
    if (!open || !containerRef.current) return;
    
    // Inject the PayPal Button
    if (window.paypal && window.paypal.HostedButtons) {
      try {
        containerRef.current.innerHTML = '<div id="paypal-container-KRKWACD47HF7G"></div>';
        window.paypal
          .HostedButtons({ hostedButtonId: 'KRKWACD47HF7G' })
          .render('#paypal-container-KRKWACD47HF7G');
      } catch (e) { console.error("PayPal failed to load", e); }
    }
  }, [open]);

  if (!open) return null;

  const activate = async () => {
    if (!user) return;
    
    // Developer "God Mode" Bypass
    if (user.email === 'bentaylors@hotmail.co.uk') {
        setActivating(true);
        await markPremium();
        await refresh();
        onClose();
        return;
    }

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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-lg p-4 animate-in fade-in zoom-in duration-300">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden relative">
        <button onClick={onClose} className="absolute top-6 right-6 text-gray-300 hover:text-black text-xl font-bold z-10">✕</button>
        
        <div className="p-8 sm:p-12">
          <div className="flex items-center space-x-2 mb-4">
             <span className="w-8 h-8 rounded-lg bg-red-600 flex items-center justify-center text-white font-bold italic">S</span>
             <span className="font-black text-xl tracking-tight">SmartGiaoAn <span className="text-red-600">PRO</span></span>
          </div>
          
          <h3 className="text-3xl font-black text-gray-900 mb-2">{t('upgrade_modal_title')}</h3>
          <p className="text-gray-500 font-medium mb-8 leading-relaxed">{t('upgrade_modal_sub')}</p>

          <div className="bg-gray-50 border-2 border-dashed border-gray-200 rounded-3xl p-8 mb-8" ref={containerRef}>
            <div id="paypal-container-KRKWACD47HF7G" className="flex justify-center min-h-[150px] items-center italic text-gray-400">
                Loading Secure Payment Gateway...
            </div>
          </div>

          <div className="bg-blue-50 border border-blue-100 rounded-2xl p-4 mb-8">
            <p className="text-xs text-blue-700 font-bold leading-relaxed italic">
                💡 {t('after_paypal_note')}
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <button onClick={onClose} className="text-sm font-bold text-gray-400 hover:text-black order-2 sm:order-1">
              {lang === 'vi' ? 'Hủy bỏ' : 'Cancel'}
            </button>
            <button
              onClick={activate}
              disabled={!user || activating}
              className="w-full sm:w-auto bg-red-600 text-white px-10 py-4 rounded-2xl font-black hover:bg-red-700 shadow-xl disabled:bg-gray-300 transition-all active:scale-95 order-1 sm:order-2"
            >
              {activating ? 'Processing...' : t('activate_premium')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
