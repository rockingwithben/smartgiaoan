import React, { useEffect, useState } from 'react';
import { useI18n } from '../lib/i18n';
import { grantRewarded } from '../lib/api';
import { useAuth } from '../lib/auth';

export function RewardedAdModal({ open, tier, onClose, onClaimed }) {
  const { t, lang } = useI18n();
  const { setUser } = useAuth();
  
  // Dynamic timing based on tier
  const tierSec = { short: 15, medium: 30, long: 45 }[tier] || 30;
  const [remaining, setRemaining] = useState(tierSec);
  const [claiming, setClaiming] = useState(false);

  // Calculate progress percentage for the visual ring
  const progress = ((tierSec - remaining) / tierSec) * 100;

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
    } catch (err) {
      console.error("Reward error:", err);
    } finally {
      setClaiming(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-xl p-4 animate-in fade-in duration-300" data-testid="rewarded-ad-modal">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden border border-gray-100 flex flex-col relative animate-in zoom-in-95 duration-300">
        
        {/* Header Branding */}
        <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 rounded-full bg-red-600 animate-pulse"></div>
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-500">
              {lang === 'vi' ? 'QUẢNG CÁO ĐANG CHẠY' : 'SPONSORED REWARD'}
            </span>
          </div>
          <div className="text-[10px] font-bold text-gray-400">
            {tier.toUpperCase()} TIER · {tierSec}S
          </div>
        </div>

        {/* Ad Body Area */}
        <div className="min-h-[280px] bg-gray-100 flex flex-col items-center justify-center p-8 relative overflow-hidden group">
          {/* Background Decorative Element */}
          <div className="absolute inset-0 opacity-[0.03] pointer-events-none flex items-center justify-center text-[10rem] font-black">
            AD
          </div>
          
          <div className="text-center relative z-10">
            <div className="w-20 h-20 bg-white rounded-2xl shadow-sm border border-gray-200 flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-500">
              <span className="text-4xl">🎁</span>
            </div>
            <h4 className="font-black text-2xl text-gray-900 mb-2 leading-tight">
              {t('rewarded_title')}
            </h4>
            <p className="text-gray-500 font-medium text-sm max-w-[240px] mx-auto leading-relaxed">
              {t('rewarded_sub')}
            </p>
          </div>
        </div>

        {/* Footer Controls */}
        <div className="p-8 bg-white border-t border-gray-100">
          <div className="flex items-center justify-between">
            
            {/* Visual Timer Container */}
            <div className="flex items-center space-x-4">
              <div className="relative w-14 h-14 flex items-center justify-center">
                {/* SVG Progress Circle */}
                <svg className="absolute inset-0 w-full h-full -rotate-90">
                  <circle 
                    cx="28" cy="28" r="24" 
                    className="stroke-gray-100 fill-none" 
                    strokeWidth="4"
                  />
                  <circle 
                    cx="28" cy="28" r="24" 
                    className="stroke-red-600 fill-none transition-all duration-1000 ease-linear" 
                    strokeWidth="4"
                    strokeDasharray="150.8"
                    strokeDashoffset={150.8 - (150.8 * progress) / 100}
                  />
                </svg>
                <span className="font-black text-lg text-gray-900 tabular-nums">
                  {remaining}s
                </span>
              </div>
              <div>
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest leading-none mb-1">
                  {t('rewarded_skip_in')}
                </p>
                <p className="text-sm font-bold text-gray-900">
                  {ready ? (lang === 'vi' ? 'Sẵn sàng!' : 'Ready!') : (lang === 'vi' ? 'Vui lòng đợi' : 'Please wait')}
                </p>
              </div>
            </div>

            {/* Claim Button */}
            <button
              disabled={!ready || claiming}
              onClick={claim}
              className={`relative px-8 py-4 rounded-2xl font-black text-sm transition-all shadow-xl active:scale-95 ${
                ready 
                  ? 'bg-black text-white hover:bg-gray-800' 
                  : 'bg-gray-100 text-gray-300 cursor-not-allowed'
              }`}
              data-testid="rewarded-claim-btn"
            >
              {claiming ? (
                <div className="flex items-center space-x-2">
                   <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                   <span>...</span>
                </div>
              ) : (
                ready ? `🚀 ${t('rewarded_claim')}` : t('rewarded_claim')
              )}
            </button>
          </div>
          
          {/* Cancel button only if not ready - hidden when ready to force focus on Claim */}
          {!ready && (
             <button 
              onClick={onClose} 
              className="mt-6 w-full text-center text-xs font-bold text-gray-400 hover:text-red-600 transition-colors uppercase tracking-widest"
             >
               {lang === 'vi' ? 'Hủy bỏ và mất thưởng' : 'Cancel & Lose Reward'}
             </button>
          )}
        </div>
      </div>
    </div>
  );
}
