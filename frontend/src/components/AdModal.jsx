import React, { useState, useEffect } from 'react';
import { X, PlayCircle, Clock } from 'lucide-react';
import { http } from '../lib/api';

export default function AdModal({ isOpen, duration, onComplete, onClose }) {
  const [timeLeft, setTimeLeft] = useState(duration);
  const [canSkip, setCanSkip] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    setTimeLeft(duration);
    setCanSkip(false);

    // Push the AdSense ad when the modal opens
    try {
      (window.adsbygoogle = window.adsbygoogle || []).push({});
    } catch (err) {
      console.error('AdSense error:', err);
    }
    
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          setCanSkip(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isOpen, duration]);

  const handleComplete = async () => {
    try {
      await http.post('/usage/grant-rewarded', { tier: duration, reward_type: 'worksheet' });
      onComplete?.();
    } catch (err) {
      console.error('Ad reward failed:', err);
      onComplete?.(); // Still close modal
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm">
      <div className="bg-white rounded-2xl max-w-md w-full mx-4 overflow-hidden shadow-2xl">
        {/* Ad Header */}
        <div className="bg-gradient-to-r from-red-600 to-orange-500 p-4 flex justify-between items-center">
          <div className="flex items-center gap-2 text-white">
            <PlayCircle className="w-5 h-5" />
            <span className="font-bold text-sm">Sponsored Content</span>
          </div>
          {canSkip ? (
            <button onClick={handleComplete} className="text-white hover:bg-white/20 p-1 rounded">
              <X className="w-5 h-5" />
            </button>
          ) : (
            <div className="flex items-center gap-1 text-white/90 text-sm">
              <Clock className="w-4 h-4" />
              <span>{timeLeft}s</span>
            </div>
          )}
        </div>

        {/* Ad Content Placeholder */}
        <div className="p-8 text-center">
          <div className="bg-gray-100 rounded-xl min-h-[200px] flex items-center justify-center mb-4 overflow-hidden">
            <ins 
              className="adsbygoogle"
              style={{ display: 'block', width: '100%', height: '100%' }}
              data-ad-client="ca-pub-6737475067243465"
              data-ad-format="auto"
              data-full-width-responsive="true"
            ></ins>
          </div>
          <p className="text-sm text-gray-600">
            Watch this short ad to continue generating worksheets for free.
          </p>
          <p className="text-xs text-gray-400 mt-2">
            Premium members never see ads.
          </p>
        </div>

        {/* Progress Bar */}
        <div className="px-4 pb-4">
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-red-500 h-2 rounded-full transition-all duration-1000"
              style={{ width: `${((duration - timeLeft) / duration) * 100}%` }}
            />
          </div>
          {canSkip && (
            <button
              onClick={handleComplete}
              className="w-full mt-4 bg-black text-white font-bold py-3 rounded-xl hover:bg-gray-800"
            >
              Continue (+1 Worksheet Credit)
            </button>
          )}
        </div>
      </div>
    </div>
  );
}