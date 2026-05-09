import React, { useState, useEffect, useCallback } from 'react';
import { X, Gift } from 'lucide-react';
import { grantRewarded } from '../lib/api';
import { toast } from 'sonner';

const TIER_SECONDS = { 15: 15, 30: 30, 45: 45 };

export default function SponsorRewardedModal({ tier, onClose, onGranted }) {
  const [remaining, setRemaining] = useState(TIER_SECONDS[tier] || 15);
  const [ready, setReady] = useState(false);
  const [claiming, setClaiming] = useState(false);

  useEffect(() => {
    // Push the AdSense ad when the modal opens
    try {
      (window.adsbygoogle = window.adsbygoogle || []).push({});
    } catch (err) {
      console.error('AdSense error:', err);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (remaining <= 0) {
      setReady(true);
      return;
    }
    const timer = setInterval(() => {
      setRemaining((r) => r - 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [remaining]);

  const handleClaim = useCallback(async () => {
    if (!ready || claiming) return;
    setClaiming(true);
    try {
      // const res = await grantRewarded(tier);
      console.log('Reward claim bypassed (backend endpoint disabled)');
      const res = { amount: tier <= 15 ? 1 : 2 }; // Local mock since endpoint is disabled
      toast.success(`+${res.amount} credit${res.amount > 1 ? 's' : ''} added!`);
      onGranted?.(res);
      onClose();
    } catch (e) {
      toast.error('Failed to grant credits. Please try again.');
      setClaiming(false);
    }
  }, [ready, claiming, tier, onClose, onGranted]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="bg-white rounded-2xl max-w-sm w-full p-6 relative text-center">
        <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600">
          <X size={20} />
        </button>

        <div className="mb-4">
          <span className="inline-flex items-center gap-2 bg-amber-100 text-amber-800 px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wide">
            <Gift size={14} /> Sponsored Reward
          </span>
        </div>

        <div className="w-full bg-gray-100 rounded-xl mx-auto mb-4 flex items-center justify-center overflow-hidden min-h-[150px]">
          <ins 
            className="adsbygoogle"
            style={{ display: 'block', width: '100%', height: '100%' }}
            data-ad-client="ca-pub-6737475067243465"
            data-ad-slot="8744271743"
            data-ad-format="auto"
            data-full-width-responsive="true"
          ></ins>
        </div>

        <h4 className="text-lg font-bold text-gray-900 mb-1">
          {ready ? 'Ready to claim!' : 'Video playing...'}
        </h4>
        <p className="text-gray-500 text-sm mb-4">
          {ready
            ? 'Thanks for watching! Claim your credits now.'
            : `Please wait ${remaining}s before claiming.`}
        </p>

        <div className="w-full bg-gray-100 rounded-full h-2 mb-4 overflow-hidden">
          <div
            className="bg-indigo-600 h-full transition-all duration-1000"
            style={{
              width: `${((TIER_SECONDS[tier] - remaining) / TIER_SECONDS[tier]) * 100}%`,
            }}
          />
        </div>

        <button
          onClick={handleClaim}
          disabled={!ready || claiming}
          className={`w-full py-3 rounded-xl font-semibold transition ${
            ready && !claiming
              ? 'bg-indigo-600 text-white hover:bg-indigo-700'
              : 'bg-gray-200 text-gray-400 cursor-not-allowed'
          }`}
        >
          {claiming ? 'Claiming...' : ready ? 'Claim Credits' : `${remaining}s remaining`}
        </button>

        {!ready && (
          <button
            onClick={onClose}
            className="mt-3 text-sm text-gray-400 hover:text-gray-600"
          >
            Cancel
          </button>
        )}
      </div>
    </div>
  );
}
