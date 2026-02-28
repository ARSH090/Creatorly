import mongoose from 'mongoose';
import * as dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const BASE_URL = 'http://localhost:3000';
const HEADERS = {
    'Content-Type': 'application/json',
    'x-test-secret': process.env.TEST_SECRET as string || 'v3ry-s3cr3t-t3st-v4lu3'
};

let user: any = null;
let testOrder: any = null;
let Order: any = null;

async function setup() {
    await mongoose.connect(process.env.MONGODB_URI as string);
    const UserSchema = new mongoose.Schema({ email: String, clerkId: String }, { strict: false });
    const User = mongoose.models.User || mongoose.model('User', UserSchema);

    user = await User.findOne({ email: 'test@creatorly.in' });
    if (!user) throw new Error("Test user not found");

    const OrderSchema = new mongoose.Schema({}, { strict: false });
    Order = mongoose.models.Order || mongoose.model('Order', OrderSchema);

    testOrder = await Order.findOne({ creatorId: user._id, orderNumber: 'TEST-ORD-QA' });
    if (!testOrder) {
        testOrder = await Order.create({
            creatorId: user._id,
            userId: user._id,
            paymentStatus: 'paid',
            status: 'completed',
            customerEmail: 'customer@qa.com',
            customerName: 'QA Customer',
            amount: 100,
            total: 100,
            currency: 'INR',
            paidAt: new Date(),
            orderNumber: 'TEST-ORD-QA',
            razorpayOrderId: `TEST_RP_ORDER_${Date.now()}`,
            items: [{
                productId: new mongoose.Types.ObjectId(),
                name: 'QA Product',
                price: 100,
                type: 'digital'
            }]
        });
    }
}

async function safeFetchJSON(url: string, options: any) {
    const res = await fetch(url, options);
    const text = await res.text();
    if (!res.ok) throw new Error(`API Error [${res.status}]: ${text.substring(0, 500)}`);
    try {
        const json = JSON.parse(text);
        return json.data || json; // Auto-unwrap withErrorHandler envelope
    } catch { throw new Error('Parse error: ' + text); }
}

async function runQaTests() {
    console.log('\n--- STARTING MODULE 4 QA TESTS: ORDERS ---\n');
    let passed = 0; let failed = 0;
    const assert = (condition: boolean, msg: string) => {
        if (condition) { console.log(`✅ [PASS] ${msg}`); passed++; }
        else { console.error(`❌ [FAIL] ${msg}`); failed++; }
    };

    try {
        console.log('Testing Orders List...');
        const listData = await safeFetchJSON(`${BASE_URL}/api/orders`, { headers: HEADERS });
        assert(Array.isArray(listData.orders) && listData.orders.length > 0, '4.02 - Orders list retrieves existing records');

        if (listData.orders && listData.orders.length > 0) {
            const orderId = testOrder._id;

            console.log('\nTesting Order Detail...');
            const detailData = await safeFetchJSON(`${BASE_URL}/api/orders/${orderId}`, { headers: HEADERS });
            // withCreatorAuth wrapping might not be used or it uses standard json return logic
            // The API returns NextResponse.json(order). It does NOT use withErrorHandler!
            // Wait, api/orders/[orderId] returns NextResponse.json(order), so there is NO { success, data } envelope.
            // My safeFetchJSON auto-unwraps `json.data || json`, which falls back to the raw json successfully.

            assert(detailData && detailData._id === orderId, '4.03 - Order detail view works');

            console.log('\nTesting Order Patch (Internal Notes)...');
            const patchData = await safeFetchJSON(`${BASE_URL}/api/orders/${orderId}`, {
                method: 'PATCH',
                headers: HEADERS,
                body: JSON.stringify({ internalNotes: 'QA Tested' })
            });

            assert(patchData.success === true && patchData.order?.internalNotes === 'QA Tested', '4.03 - Order internal notes patch works');

            console.log('\nTesting Payment Gateway Webhook (Razorpay)...');
            const crypto = await import('crypto');
            const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET || 'creatorly_test_webhook_secret_2024';

            // Revert test order status to pending for the test
            await Order.findByIdAndUpdate(orderId, { status: 'pending', paymentStatus: 'pending' });

            const webhookPayload = {
                id: `evt_mock_${Date.now()}`,
                event: 'payment.captured',
                payload: {
                    payment: {
                        entity: {
                            id: 'pay_MockId123',
                            order_id: testOrder.razorpayOrderId,
                            amount: 10000,
                            currency: 'INR'
                        }
                    }
                }
            };
            const payloadStr = JSON.stringify(webhookPayload);
            const signature = crypto.createHmac('sha256', webhookSecret).update(payloadStr).digest('hex');

            const webhookRes = await fetch(`${BASE_URL}/api/webhooks/razorpay`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-razorpay-signature': signature
                },
                body: payloadStr
            });
            const webhookData = await webhookRes.json();

            // Check if DB updated
            const updatedOrder = await Order.findById(orderId).lean();

            console.log('=> webhookRes.ok:', webhookRes.ok);
            console.log('=> webhookData:', webhookData);
            console.log('=> updatedOrder?.status:', updatedOrder?.status);
            console.log('=> updatedOrder?.paymentStatus:', updatedOrder?.paymentStatus);

            assert(
                webhookRes.ok &&
                webhookData.status === 'ok' &&
                updatedOrder?.status === 'completed' &&
                updatedOrder?.paymentStatus === 'paid',
                '4.04 - Payment callbacks update order status'
            );

        } else {
            console.error('❌ Skipping detail tests (no orders found)');
            failed += 3;
        }

    } catch (e: any) {
        console.error('\n🔴 Test script crashed:', e.message);
        failed++;
    }

    console.log(`\n--- RESULTS: ${passed} Passed, ${failed} Failed ---\n`);
    process.exit(failed > 0 ? 1 : 0);
}

setup().then(runQaTests).catch(console.error);
