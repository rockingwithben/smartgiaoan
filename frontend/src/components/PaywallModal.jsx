import React, { useState } from 'react';
import { useI18n } from '../lib/i18n';
import { capturePayPal } from '../lib/api';
import { useAuth } from '../lib/auth';
import { toast } from 'sonner';
import { PayPalButton } from './PayPalButton';

export function PaywallModal({ open, onClose, onWatchAd }) {
  const { t } = useI18n();
  const { refreshUser } = useAuth();
  
  const [view, setView] = useState('paywall'); // 'paywall' | 'checkout'
  const [activating, setActivating] = useState(false);

  // PayPal subscription plan IDs (env-overridable)
  const PLAN_PREMIUM = process.env.REACT_APP_PAYPAL_PREMIUM_PLAN_ID || 'P-53940113VL329025BNH7A3UQ';
  const PLAN_PRO     = process.env.REACT_APP_PAYPAL_PRO_PLAN_ID     || 'P-40482060EU873762GNH7A6YI';

  if (!open) return null;

  const handlePayPalSuccess = async (subscriptionID, product_type) => {
    setActivating(true);
    try {
      await capturePayPal(subscriptionID, product_type);
      await refreshUser();
      toast.success('Subscription activated! Welcome to the new tier.');
      
      setView('paywall');
      onClose();
    } catch (err) {
      toast.error('Could not instantly activate. It may take a few minutes for PayPal to verify.');
      // Close anyway since webhook will eventually catch it
      onClose();
    } finally {
      setActivating(false);
    }
  };

  const handleClose = () => {
    setView('paywall');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden transition-all max-h-[90vh] overflow-y-auto">
        
        {view === 'paywall' ? (
          /* --- VIEW 1: THE PAYWALL --- */
          <div className="p-8 text-center animate-in fade-in zoom-in duration-200">
            <div className="text-5xl mb-4">🎯</div>
            <h2 className="font-black text-2xl text-gray-900 mb-2">{t('paywall_title') || 'Out of Credits'}</h2>
            <p className="text-gray-500 font-medium text-sm mb-8">{t('paywall_sub') || 'Watch an ad or upgrade to keep generating.'}</p>
            
            <div className="max-w-md mx-auto space-y-3">
              <button onClick={() => onWatchAd('short')}
                className="w-full bg-gray-100 hover:bg-gray-200 text-gray-800 font-bold py-3 rounded-xl transition-colors text-sm">
                📺 {t('paywall_watch') || 'Watch Ad'} — +1 worksheet
              </button>
              <button onClick={() => onWatchAd('medium')}
                className="w-full bg-gray-100 hover:bg-gray-200 text-gray-800 font-bold py-3 rounded-xl transition-colors text-sm">
                📺 {t('paywall_watch30') || 'Watch Long Ad'} — +2 worksheets
              </button>
              
              <div className="relative my-4">
                <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-gray-100" /></div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-white px-3 text-gray-400 font-bold tracking-wider">or</span>
                </div>
              </div>
              
              <button onClick={() => setView('checkout')} className="w-full bg-black text-white font-bold py-3 rounded-xl hover:bg-gray-800 transition-colors">
                {t('paywall_upgrade') || 'View Upgrade Options'}
              </button>
            </div>
            
            <button onClick={handleClose} className="mt-6 w-full text-xs font-bold text-gray-400 hover:text-gray-600 transition-colors">
              Maybe later
            </button>
          </div>
        ) : (
          /* --- VIEW 2: THE PAYPAL CHECKOUT (DUAL TIER) --- */
          <div className="p-8 animate-in slide-in-from-right-4 fade-in duration-200">
            <div className="text-center mb-8">
              <h2 className="font-black text-3xl text-gray-900 mb-2">Choose Your Plan</h2>
              <p className="text-gray-500 font-medium">Select the tier that fits your teaching needs.</p>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              {/* Premium Tier */}
              <div className="border border-gray-200 rounded-2xl p-6 flex flex-col relative bg-white">
                <h3 className="font-black text-xl text-gray-900">Premium</h3>
                <div className="mt-2 mb-4 flex items-baseline gap-1">
                  <span className="text-3xl font-black">£5.67</span>
                  <span className="text-gray-500 font-medium text-sm">/mo</span>
                </div>
                <ul className="space-y-3 mb-8 flex-1">
                  <li className="flex items-start gap-2 text-sm font-medium text-gray-700">
                    <span className="text-green-500 mt-0.5">✓</span> Unlimited Ad-Free Worksheets
                  </li>
                  <li className="flex items-start gap-2 text-sm font-medium text-gray-700">
                    <span className="text-green-500 mt-0.5">✓</span> PDF Export included
                  </li>
                  <li className="flex items-start gap-2 text-sm font-medium text-gray-700">
                    <span className="text-green-500 mt-0.5">✓</span> Audio & Listening Skill features
                  </li>
                </ul>
                <div className="mt-auto">
                  {activating ? (
                    <div className="text-center text-sm font-bold text-gray-500 py-3">Activating...</div>
                  ) : (
                    <PayPalButton 
                      planId={PLAN_PREMIUM} 
                      onSuccess={(subId) => handlePayPalSuccess(subId, 'premium_monthly')} 
                    />
                  )}
                </div>
              </div>

              {/* Pro Tier */}
              <div className="border-2 border-black rounded-2xl p-6 flex flex-col relative bg-gray-50">
                <div className="absolute top-0 right-0 bg-black text-white text-[10px] font-bold tracking-widest uppercase px-3 py-1 rounded-bl-lg rounded-tr-xl">
                  Best Value
                </div>
                <h3 className="font-black text-xl text-gray-900">Pro Institutional</h3>
                <div className="mt-2 mb-4 flex items-baseline gap-1">
                  <span className="text-3xl font-black">£9.99</span>
                  <span className="text-gray-500 font-medium text-sm">/mo</span>
                </div>
                <ul className="space-y-3 mb-8 flex-1">
                  <li className="flex items-start gap-2 text-sm font-medium text-gray-700">
                    <span className="text-green-500 mt-0.5">✓</span> Everything in Premium
                  </li>
                  <li className="flex items-start gap-2 text-sm font-medium text-gray-700">
                    <span className="text-green-500 mt-0.5">✓</span> Custom School Branding (Logos)
                  </li>
                  <li className="flex items-start gap-2 text-sm font-medium text-gray-700">
                    <span className="text-green-500 mt-0.5">✓</span> Auto-Grading Interactive Links
                  </li>
                  <li className="flex items-start gap-2 text-sm font-medium text-gray-700">
                    <span className="text-green-500 mt-0.5">✓</span> Deep AI Output (Flashcards, etc.)
                  </li>
                </ul>
                <div className="mt-auto">
                  {activating ? (
                    <div className="text-center text-sm font-bold text-gray-500 py-3">Activating...</div>
                  ) : (
                    <PayPalButton 
                      planId={PLAN_PRO} 
                      onSuccess={(subId) => handlePayPalSuccess(subId, 'pro_monthly')} 
                    />
                  )}
                </div>
              </div>
            </div>

            <div className="text-center mt-6">
              <button onClick={() => setView('paywall')} className="text-sm font-bold text-gray-400 hover:text-gray-600 transition-colors">
                Go back
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
