import React from 'react';
import { useNavigate } from 'react-router-dom';
import { X } from 'lucide-react';
import { useAuth } from '../lib/auth';

export default function PaywallModal({ onClose, onWatchAd }) {
  const navigate = useNavigate();
  const { user } = useAuth();

  const tiers = [
    { tier: 15, label: 'Watch 15s ad', reward: '+1 credit' },
    { tier: 30, label: 'Watch 30s ad', reward: '+2 credits' },
    { tier: 45, label: 'Watch 45s ad', reward: '+3 credits' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-2xl max-w-md w-full p-6 relative">
        <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600">
          <X size={20} />
        </button>

        <h3 className="text-xl font-bold text-gray-900 mb-2">
          Free Limit Reached
        </h3>
        <p className="text-gray-500 mb-6">
          You've used all your free worksheets. Get more credits or upgrade to Premium.
        </p>

        <div className="space-y-3 mb-6">
          {tiers.map((item) => (
            <button
              key={item.tier}
              onClick={() => onWatchAd(item.tier)}
              className="w-full flex items-center justify-between p-4 border border-gray-200 rounded-xl hover:border-indigo-500 hover:bg-indigo-50 transition"
            >
              <span className="font-medium text-gray-900">{item.label}</span>
              <span className="text-indigo-600 font-semibold">{item.reward}</span>
            </button>
          ))}
        </div>

        <div className="border-t pt-4">
          <button
            onClick={() => navigate('/pricing')}
            className="w-full bg-black text-white py-3 rounded-xl font-semibold hover:bg-gray-800 transition"
          >
            Upgrade to Premium — Unlimited
          </button>
          <p className="text-center text-xs text-gray-400 mt-2">
            200,000₫ / month · No ads · 24/7 Support
          </p>
        </div>
      </div>
    </div>
  );
}
