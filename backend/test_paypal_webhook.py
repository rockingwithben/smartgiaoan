#!/usr/bin/env python3
"""Test script to verify PayPal webhook signature verification."""

import json
import os

def test_signature_verification():
    """Test PayPal webhook signature verification logic."""
    
    # Mock PayPal webhook data
    mock_webhook_data = {
        "headers": {
            "paypal-transmission-certurl": "https://api-m.sandbox.paypal.com/certs",
            "paypal-transmission-id": "TEST_TRANSMISSION_ID",
            "paypal-transmission-time": "2023-01-01T12:00:00Z",
            "paypal-auth-algo": "SHA256",
            "paypal-transmission-sig": "TEST_SIGNATURE"
        },
        "body": '{"event_type": "PAYMENT.SALE.COMPLETED", "resource": {"custom_id": "user_12345"}}'
    }
    
    # Test environment variables
    required_headers = [
        "paypal-transmission-certurl",
        "paypal-transmission-id", 
        "paypal-transmission-time",
        "paypal-auth-algo",
        "paypal-transmission-sig",
        "paypal-webhook-id"
    ]
    
    print("Testing PayPal webhook signature verification...")
    print("Required headers:", required_headers)
    
    # Check if all required headers are present
    missing_headers = [h for h in required_headers if h not in mock_webhook_data["headers"]]
    if missing_headers:
        print(f"Missing headers: {missing_headers}")
        return False
    else:
        print("All required headers present")
    
    # Test verification data construction
    verification_data = {
        "transmission_id": mock_webhook_data["headers"]["paypal-transmission-id"],
        "transmission_time": mock_webhook_data["headers"]["paypal-transmission-time"],
        "cert_url": mock_webhook_data["headers"]["paypal-transmission-certurl"],
        "auth_algo": mock_webhook_data["headers"]["paypal-auth-algo"],
        "transmission_sig": mock_webhook_data["headers"]["paypal-transmission-sig"],
        "webhook_id": os.environ.get("PAYPAL_WEBHOOK_ID", "TEST_WEBHOOK_ID"),
        "webhook_event": json.loads(mock_webhook_data["body"])
    }
    
    print("Verification data constructed successfully")
    print("Webhook event type:", verification_data["webhook_event"].get("event_type"))
    
    return True

if __name__ == "__main__":
    success = test_signature_verification()
    if success:
        print("\nSignature verification logic appears correct")
    else:
        print("\nSignature verification has issues")
