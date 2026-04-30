import React, { useState, useEffect } from 'react';
import { useI18n } from '../lib/i18n';

export function RewardedAdModal({ open, tier, onClose, onClaimed }) {
  const { lang } = useI18n();
  const [countdown, setCountdown] = useState(5); // 5 second ad requirement
  const [canClaim, setCanClaim] = useState(false);
  const [isClaiming, setIsClaiming] = useState(false);

  useEffect(() => {
    let timer;
    if (open) {
      setCountdown(5);
      setCanClaim(false);
      timer = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            setCanClaim(true);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [open]);

  if (!open) return null;

  const handleClaim = async () => {
    setIsClaiming(true);
    try {
      const token = localStorage.getItem('session_token');
      await fetch(`${process.env.REACT_APP_BACKEND_URL || ''}/api/usage/grant-rewarded`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ tier })
      });
      await onClaimed();
      onClose();
    } catch (error) {
      console.error("Failed to claim reward");
    }
    setIsClaiming(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden flex flex-col">
        
        {/* Placeholder for actual Google AdSense / Video Ad */}
        <div className="bg-gray-200 h-64 flex items-center justify-center border-b border-gray-300">
          <p className="text-gray-400 font-bold uppercase tracking-widest text-sm">Advertisement Space</p>
        </div>

        <div className="p-6 text-center">
          <h3 className="text-xl font-extrabold text-gray-900 mb-2">
            {lang === 'vi' ? 'Đang hỗ trợ SmartGiaoAn...' : 'Supporting SmartGiaoAn...'}
          </h3>
          <p className="text-gray-500 font-medium mb-6 text-sm">
            {lang === 'vi' 
              ? 'Cảm ơn bạn đã xem! Phần thưởng sẽ sẵn sàng sau vài giây.' 
              : 'Thanks for watching! Your reward will be ready shortly.'}
          </p>

          <button
            onClick={handleClaim}
            disabled={!canClaim || isClaiming}
            className={`w-full p-4 rounded-xl font-bold transition-all ${
              canClaim 
                ? 'bg-green-500 text-white hover:bg-green-600 shadow-lg translate-y-0' 
                : 'bg-gray-100 text-gray-400 cursor-not-allowed'
            }`}
          >
            {isClaiming 
              ? 'Claiming...' 
              : canClaim 
                ? (lang === 'vi' ? 'Nhận 1 Lượt Tạo →' : 'Claim 1 Generation →') 
                : (lang === 'vi' ? `Vui lòng đợi ${countdown}s` : `Reward ready in ${countdown}s...`)
            }
          </button>
        </div>
      </div>
    </div>
  );
}
