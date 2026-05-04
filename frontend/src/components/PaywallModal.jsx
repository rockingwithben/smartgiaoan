import React from 'react';
import { useNavigate } from 'react-router-dom';
import { X, Play, Crown } from 'lucide-react';
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
      <div className="bg-white rounded-2xl max-w-md w-full p-6 relative shadow-2xl">
        <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition">
          <X size={20} />
        </button>

        <div className="text-center mb-6">
          <div className="w-12 h-12 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-3">
            <Crown size={24} className="text-amber-600" />
          </div>
          <h3 className="text-xl font-bold text-gray-900 mb-1">Free Limit Reached</h3>
          <p className="text-gray-500 text-sm">You've used all your free worksheets. Get more credits or upgrade to Premium.</p>
        </div>

        <div className="space-y-3 mb-6">
          {tiers.map((item) => (
            <button
              key={item.tier}
              onClick={() => onWatchAd(item.tier)}
              className="w-full flex items-center justify-between p-4 border border-gray-200 rounded-xl hover:border-indigo-500 hover:bg-indigo-50 transition group"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-indigo-100 rounded-lg flex items-center justify-center group-hover:bg-indigo-200 transition">
                  <Play size={14} className="text-indigo-600" />
                </div>
                <span className="font-medium text-gray-900">{item.label}</span>
              </div>
              <span className="text-indigo-600 font-bold text-sm">{item.reward}</span>
            </button>
          ))}
        </div>

        <div className="border-t pt-4">
          <button
            onClick={() => { onClose(); navigate('/pricing'); }}
            className="w-full bg-black text-white py-3 rounded-xl font-semibold hover:bg-gray-800 transition"
          >
            Upgrade to Premium
          </button>
          <p className="text-center text-xs text-gray-400 mt-2">200,000₫/month · Unlimited · No Ads · 24/7 Support</p>
        </div>
      </div>
    </div>
  );
}
