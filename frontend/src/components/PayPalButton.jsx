import React, { useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';
import { useAuth } from '../lib/auth';

let paypalSdkPromise = null;

function loadPayPalSdk(clientId) {
  if (window.paypal) return Promise.resolve(window.paypal);
  if (!clientId) return Promise.reject(new Error('Missing PayPal client ID'));
  if (paypalSdkPromise) return paypalSdkPromise;

  paypalSdkPromise = new Promise((resolve, reject) => {
    const script = document.createElement('script');
    const params = new URLSearchParams({
      'client-id': clientId,
      vault: 'true',
      intent: 'subscription',
      components: 'buttons',
      currency: 'GBP',
    });
    script.src = `https://www.paypal.com/sdk/js?${params.toString()}`;
    script.async = true;
    script.dataset.sdkIntegrationSource = 'smartgiaoan-subscriptions';
    script.onload = () => resolve(window.paypal);
    script.onerror = () => reject(new Error('Failed to load PayPal SDK'));
    document.head.appendChild(script);
  });

  return paypalSdkPromise;
}

/**
 * Renders a PayPal subscription button.
 * IMPORTANT: passes the user's user_id as `custom_id` so the
 * PayPal webhook can match the subscription back to a user.
 */
export function PayPalButton({ planId, onSuccess, onError, customId }) {
  const containerRef = useRef(null);
  const { user } = useAuth();
  const [sdkError, setSdkError] = useState('');
  const finalCustomId = customId || user?.user_id || '';
  const clientId = process.env.REACT_APP_PAYPAL_CLIENT_ID || '';

  useEffect(() => {
    if (!containerRef.current || !planId || !finalCustomId) return;

    let cancelled = false;

    containerRef.current.innerHTML = '';
    setSdkError('');

    let renderedButton;

    loadPayPalSdk(clientId)
      .then((paypal) => {
        if (cancelled || !containerRef.current) return;
        renderedButton = paypal.Buttons({
          style: {
            shape: 'pill',
            color: 'gold',
            layout: 'vertical',
            label: 'subscribe',
          },
          createSubscription: function (data, actions) {
            return actions.subscription.create({
              plan_id: planId,
              custom_id: finalCustomId,
            });
          },
          onApprove: function (data) {
            if (onSuccess) onSuccess(data.subscriptionID);
          },
          onError: function (err) {
            console.error('PayPal Error:', err);
            if (onError) onError(err);
            else toast.error('PayPal checkout encountered an error. Please try again.');
          },
        });

        return renderedButton.render(containerRef.current);
      })
      .catch((e) => {
        console.error('Failed to render PayPal button', e);
        setSdkError(e.message || 'PayPal is not configured.');
      });

    return () => {
      cancelled = true;
      // Best-effort cleanup
      try {
        if (renderedButton && typeof renderedButton.close === 'function') {
          renderedButton.close();
        }
      } catch (_) {
        /* noop */
      }
    };
  }, [planId, finalCustomId, clientId, onSuccess, onError]);

  if (!finalCustomId) {
    return (
      <div className="text-xs text-center text-gray-500 py-3">
        Please sign in to subscribe.
      </div>
    );
  }

  if (sdkError) {
    return (
      <div className="text-xs text-center text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
        {sdkError}
      </div>
    );
  }

  return <div ref={containerRef} className="w-full min-h-[45px] z-0" />;
}

export default PayPalButton;
