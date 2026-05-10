import React, { useEffect, useRef } from 'react';
import { toast } from 'sonner';
import { useAuth } from '../lib/auth';

/**
 * Renders a PayPal subscription button.
 * IMPORTANT: passes the user's user_id as `custom_id` so the
 * PayPal webhook can match the subscription back to a user.
 */
export function PayPalButton({ planId, onSuccess, onError, customId }) {
  const containerRef = useRef(null);
  const { user } = useAuth();
  const finalCustomId = customId || user?.user_id || '';

  useEffect(() => {
    if (!window.paypal || !containerRef.current) return;
    if (!planId) return;

    // Clear previous render to avoid duplicates
    containerRef.current.innerHTML = '';

    let renderedButton;
    try {
      renderedButton = window.paypal.Buttons({
        style: {
          shape: 'pill',
          color: 'gold',
          layout: 'vertical',
          label: 'subscribe',
        },
        createSubscription: function (data, actions) {
          const payload = { plan_id: planId };
          if (finalCustomId) {
            // PayPal forwards this onto the BILLING.SUBSCRIPTION.* webhook
            // events on resource.custom_id — REQUIRED by our backend.
            payload.custom_id = finalCustomId;
          }
          return actions.subscription.create(payload);
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

      renderedButton.render(containerRef.current);
    } catch (e) {
      console.error('Failed to render PayPal button', e);
    }

    return () => {
      // Best-effort cleanup
      try {
        if (renderedButton && typeof renderedButton.close === 'function') {
          renderedButton.close();
        }
      } catch (_) {
        /* noop */
      }
    };
  }, [planId, finalCustomId, onSuccess, onError]);

  if (!finalCustomId) {
    return (
      <div className="text-xs text-center text-gray-500 py-3">
        Please sign in to subscribe.
      </div>
    );
  }

  return <div ref={containerRef} className="w-full min-h-[45px] z-0" />;
}

export default PayPalButton;
