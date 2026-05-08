import React, { useEffect, useRef } from 'react';
import { toast } from 'sonner';

export function PayPalButton({ planId, onSuccess, onError }) {
  const containerRef = useRef(null);

  useEffect(() => {
    // Make sure the PayPal SDK is loaded and the container exists
    if (!window.paypal || !containerRef.current) return;

    // Clear any previous buttons to avoid duplicates during re-renders
    containerRef.current.innerHTML = '';

    try {
      const button = window.paypal.Buttons({
        style: {
          shape: 'pill',
          color: 'white',
          layout: 'vertical',
          label: 'subscribe'
        },
        createSubscription: function(data, actions) {
          return actions.subscription.create({
            plan_id: planId
          });
        },
        onApprove: function(data, actions) {
          if (onSuccess) {
            onSuccess(data.subscriptionID);
          }
        },
        onError: function(err) {
          console.error("PayPal Error:", err);
          if (onError) {
            onError(err);
          } else {
            toast.error("PayPal checkout encountered an error. Please try again.");
          }
        }
      });

      button.render(containerRef.current);
    } catch (e) {
      console.error("Failed to render PayPal button", e);
    }
  }, [planId, onSuccess, onError]);

  return <div ref={containerRef} className="w-full min-h-[45px] z-0" />;
}
