import React, { useState } from 'react';
import { useI18n } from '../lib/i18n';
import { markPremium } from '../lib/api';
import { useAuth } from '../lib/auth';
import { toast } from 'sonner';

export function PaywallModal({ open, onClose, onWatchAd }) {
  const { t } = useI18n();
  const { refresh } = useAuth();
  
  // FIX: Added internal state to smoothly transition from the Paywall to the Checkout
  const [view, setView] = useState('paywall'); // 'paywall' | 'checkout'
  const [activating, setActivating] = useState(false);
  const [hasClickedPayPal, setHasClickedPayPal] = useState(false);

  if (!open) return null;

  const handleActivate = async () => {
    // Basic friction: Don't let them activate unless they at least clicked the checkout link
    if (!hasClickedPayPal) {
      toast.error('Please complete the PayPal checkout first.');
      return;
    }

    setActivating(true);
    try {
      // WARNING: This relies on the honor system for MVP. 
      // Post-launch, this backend endpoint MUST be secured with PayPal Webhooks.
      await markPremium();
      await refresh();
      toast.success('Premium activated! Unlimited worksheets unlocked.');
      
      // Reset state and close
      setView('paywall');
      setHasClickedPayPal(false);
      onClose();
    } catch (err) {
      toast.error('Could not activate Premium. Contact support if you have paid.');
    } finally {
      setActivating(false);
    }
  };

  const handleClose = () => {
    setView('paywall');
    setHasClickedPayPal(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden transition-all">
        
        {view === 'paywall' ? (
          /* --- VIEW 1: THE PAYWALL --- */
          <div className="p-8 text-center animate-in fade-in zoom-in duration-200">
            <div className="text-5xl mb-4">🎯</div>
            <h2 className="font-black text-2xl text-gray-900 mb-2">{t('paywall_title') || 'Out of Credits'}</h2>
            <p className="text-gray-500 font-medium text-sm mb-8">{t('paywall_sub') || 'Watch an ad or upgrade to keep generating.'}</p>
            
            <div className="space-y-3">
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
              
              {/* FIX: This button used to just close the modal. Now it triggers the checkout view. */}
              <button onClick={() => setView('checkout')} className="w-full bg-black text-white font-bold py-3 rounded-xl hover:bg-gray-800 transition-colors">
                {t('paywall_upgrade') || 'Upgrade to Premium'} — £5/month
              </button>
            </div>
            
            <button onClick={handleClose} className="mt-6 w-full text-xs font-bold text-gray-400 hover:text-gray-600 transition-colors">
              Maybe later
            </button>
          </div>
        ) : (
          /* --- VIEW 2: THE PAYPAL CHECKOUT --- */
          <div className="p-8 text-center animate-in slide-in-from-right-4 fade-in duration-200">
            <div className="text-5xl mb-4">👑</div>
            <h2 className="font-black text-2xl text-gray-900 mb-1">{t('upgrade_modal_title') || 'Unlock Premium'}</h2>
            <p className="text-gray-500 font-medium text-sm mb-6">{t('upgrade_modal_sub') || 'Unlimited zero-edit worksheets.'}</p>

            <div className="bg-gray-50 rounded-2xl p-5 mb-6 text-left space-y-2">
              {['Unlimited worksheets', 'No ads, ever', 'Priority AI generation', 'Full worksheet history', 'PDF export'].map((f) => (
                <div key={f} className="flex items-center gap-2 text-sm font-bold text-gray-700">
                  <span className="text-green-500">✓</span> {f}
                </div>
              ))}
            </div>

            <div className="mb-4">
              {/* FIX: Require the user to click the link before revealing the activation logic */}
              <a
                href="https://www.paypal.com/ncp/payment/KRKWACD47HF7G"
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => setHasClickedPayPal(true)}
                className="w-full flex items-center justify-center gap-2 bg-yellow-400 hover:bg-yellow-500 text-black font-black py-4 rounded-2xl transition-colors shadow-md"
              >
                <img src="https://www.paypalobjects.com/webstatic/icon/pp16.png" alt="PayPal" className="w-5 h-5" />
                Pay £5/month with PayPal
              </a>
            </div>

            <p className="text-xs text-gray-400 font-medium mb-4">
              {t('after_paypal_note') || 'After completing payment in the new tab, click below to activate your account.'}
            </p>

            <button 
              onClick={handleActivate} 
              disabled={activating || !hasClickedPayPal}
              className={`w-full font-bold py-3 rounded-xl transition-colors ${
                hasClickedPayPal && !activating 
                  ? 'bg-black text-white hover:bg-gray-800' 
                  : 'bg-gray-200 text-gray-400 cursor-not-allowed'
              }`}
            >
              {activating ? 'Activating...' : t('activate_premium') || 'I have paid, Activate Premium'}
            </button>
            
            <button onClick={() => setView('paywall')} className="mt-6 w-full text-xs font-bold text-gray-400 hover:text-gray-600 transition-colors">
              Go back
            </button>
          </div>
        )}
      </div>
    </div>
  );
}