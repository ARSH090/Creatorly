
import axios from 'axios';
import crypto from 'crypto';

const WEBHOOK_SECRET = process.env.RAZORPAY_WEBHOOK_SECRET || 'placeholder';
const BASE_URL = 'http://localhost:3000/api/payments/webhook';

async function testSubscriptionWebhook() {
    console.log('🚀 Testing Subscription Webhooks...');

    // Mock Payload for Subscription Charged
    const payload = JSON.stringify({
        "entity": "event",
        "account_id": "acc_Test123",
        "event": "subscription.charged",
        "contains": ["payment", "subscription"],
        "payload": {
            "payment": {
                "entity": {
                    "id": "pay_Test123",
                    "amount": 99900,
                    "currency": "INR",
                    "status": "captured",
                    "order_id": "order_Test123",
                    "email": "customer@example.com"
                }
            },
            "subscription": {
                "entity": {
                    "id": "sub_Test123",
                    "plan_id": "plan_Test123",
                    "status": "active",
                    "current_start": 1715420000,
                    "current_end": 1718090000
                }
            }
        },
        "created_at": Date.now() / 1000
    });

    // Generate Signature
    const signature = crypto
        .createHmac('sha256', WEBHOOK_SECRET)
        .update(payload)
        .digest('hex');

    try {
        const res = await axios.post(BASE_URL, JSON.parse(payload), {
            headers: {
                'x-razorpay-signature': signature,
                'x-razorpay-event-id': `evt_${Date.now()}`
            }
        });

        console.log('✅ Webhook Response:', res.status, res.data);
    } catch (error: any) {
        console.error('❌ Webhook Failed:', error.response?.status, error.response?.data);
    }
}

testSubscriptionWebhook();
