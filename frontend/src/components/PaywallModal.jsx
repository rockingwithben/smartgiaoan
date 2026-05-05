import React from 'react';
import { useI18n } from '../lib/i18n';
import { markPremium } from '../lib/api';
import { useAuth } from '../lib/auth';
import { toast } from 'sonner';

export function PaywallModal({ open, onClose, onWatchAd }) {
  const { t } = useI18n();
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden">
        <div className="p-8 text-center">
          <div className="text-5xl mb-4">🎯</div>
          <h2 className="font-black text-2xl text-gray-900 mb-2">{t('paywall_title')}</h2>
          <p className="text-gray-500 font-medium text-sm mb-8">{t('paywall_sub')}</p>
          <div className="space-y-3">
            <button onClick={() => onWatchAd('short')}
              className="w-full bg-gray-100 hover:bg-gray-200 text-gray-800 font-bold py-3 rounded-xl transition-colors text-sm">
              📺 {t('paywall_watch')} — +1 worksheet
            </button>
            <button onClick={() => onWatchAd('medium')}
              className="w-full bg-gray-100 hover:bg-gray-200 text-gray-800 font-bold py-3 rounded-xl transition-colors text-sm">
              📺 {t('paywall_watch30')} — +2 worksheets
            </button>
            <button onClick={() => onWatchAd('long')}
              className="w-full bg-gray-100 hover:bg-gray-200 text-gray-800 font-bold py-3 rounded-xl transition-colors text-sm">
              📺 {t('paywall_watch45')} — +3 worksheets
            </button>
            <div className="relative my-4">
              <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-gray-100" /></div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-white px-3 text-gray-400 font-bold tracking-wider">or</span>
              </div>
            </div>
            <button onClick={onClose} className="w-full bg-black text-white font-bold py-3 rounded-xl hover:bg-gray-800 transition-colors">
              {t('paywall_upgrade')} — £5/month
            </button>
          </div>
        </div>
        <button onClick={onClose} className="w-full py-3 text-xs font-bold text-gray-400 hover:text-gray-600 border-t border-gray-100 transition-colors">
          Maybe later
        </button>
      </div>
    </div>
  );
}

export function UpgradeModal({ open, onClose }) {
  const { t } = useI18n();
  const { refresh } = useAuth();
  const [activating, setActivating] = React.useState(false);

  if (!open) return null;

  const handleActivate = async () => {
    setActivating(true);
    try {
      await markPremium();
      await refresh();
      toast.success('Premium activated! Unlimited worksheets unlocked.');
      onClose();
    } catch (err) {
      toast.error('Could not activate Premium. Contact support if you have paid.');
    } finally {
      setActivating(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden">
        <div className="p-8 text-center">
          <div className="text-5xl mb-4">👑</div>
          <h2 className="font-black text-2xl text-gray-900 mb-1">{t('upgrade_modal_title')}</h2>
          <p className="text-gray-500 font-medium text-sm mb-6">{t('upgrade_modal_sub')}</p>

          <div className="bg-gray-50 rounded-2xl p-5 mb-6 text-left space-y-2">
            {['Unlimited worksheets', 'No ads, ever', 'Priority AI generation', 'Full worksheet history', 'PDF export'].map((f) => (
              <div key={f} className="flex items-center gap-2 text-sm font-bold text-gray-700">
                <span className="text-green-500">✓</span> {f}
              </div>
            ))}
          </div>

          <div id="paypal-button-container" className="mb-4">
            <a
              href="https://www.paypal.com/ncp/payment/KRKWACD47HF7G"
              target="_blank"
              rel="noopener noreferrer"
              className="w-full flex items-center justify-center gap-2 bg-yellow-400 hover:bg-yellow-500 text-black font-black py-4 rounded-2xl transition-colors shadow-md"
            >
              <img src="https://www.paypalobjects.com/webstatic/icon/pp16.png" alt="PayPal" className="w-5 h-5" />
              Pay £5/month with PayPal
            </a>
          </div>

          <p className="text-xs text-gray-400 font-medium mb-4">{t('after_paypal_note')}</p>

          <button onClick={handleActivate} disabled={activating}
            className="w-full bg-black text-white font-bold py-3 rounded-xl hover:bg-gray-800 transition-colors disabled:opacity-50">
            {activating ? 'Activating...' : t('activate_premium')}
          </button>
        </div>
        <button onClick={onClose} className="w-full py-3 text-xs font-bold text-gray-400 hover:text-gray-600 border-t border-gray-100 transition-colors">
          Cancel
        </button>
      </div>
    </div>
  );
}
