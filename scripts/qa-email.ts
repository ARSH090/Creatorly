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

async function setup() {
    await mongoose.connect(process.env.MONGODB_URI as string);
    const UserSchema = new mongoose.Schema({ email: String, clerkId: String, plan: String, subscriptionTier: String }, { strict: false });
    const User = mongoose.models.User || mongoose.model('User', UserSchema);

    user = await User.findOne({ email: 'test@creatorly.in' });
    if (!user) throw new Error("Test user not found");

    // Upgrade test user conditionally so we can test Email Marketing. 'pro' or 'creator_pro'
    if (user.subscriptionTier !== 'creator_pro' && user.plan !== 'pro') {
        user.subscriptionTier = 'creator_pro';
        user.plan = 'pro';
        await user.save();
    }

    // Creating mock paid order to populate subscriber
    const OrderSchema = new mongoose.Schema({ creatorId: mongoose.Schema.Types.ObjectId, paymentStatus: String, customerEmail: String }, { strict: false });
    const Order = mongoose.models.Order || mongoose.model('Order', OrderSchema);

    testOrder = await Order.findOne({ creatorId: user._id, customerEmail: 'subscriber@test.com' });
    if (!testOrder) {
        testOrder = await Order.create({
            creatorId: user._id,
            paymentStatus: 'paid',
            customerEmail: 'subscriber@test.com',
            customerName: 'Test Subscriber',
            total: 99,
            paidAt: new Date(),
            orderNumber: `TEST-ORD-${Date.now()}`
        });
    }

    await mongoose.disconnect();
}

async function safeFetchJSON(url: string, options: any) {
    const res = await fetch(url, options);
    const text = await res.text();
    if (!res.ok) throw new Error(`API Error [${res.status}]: ${text.substring(0, 500)}`);
    try {
        const json = JSON.parse(text);
        return json.data || json;
    } catch { throw new Error('Parse error: ' + text); }
}

async function runQaTests() {
    console.log('\n--- STARTING MODULE 3 QA TESTS: EMAIL MARKETING ---\n');
    let passed = 0; let failed = 0;
    const assert = (condition: boolean, msg: string) => {
        if (condition) { console.log(`✅ [PASS] ${msg}`); passed++; }
        else { console.error(`❌ [FAIL] ${msg}`); failed++; }
    };

    try {
        console.log('Testing Subscribers Retrieval...');
        const subsData = await safeFetchJSON(`${BASE_URL}/api/creator/email/subscribers`, { headers: HEADERS });
        assert(subsData.total > 0 && subsData.subscribers.some((s: any) => s.email === 'subscriber@test.com'), '3.02 - Subscribers retrieve successfully (From Paid Orders)');

        console.log('\nTesting Lists Retrieval...');
        const listsData = await safeFetchJSON(`${BASE_URL}/api/creator/email/lists`, { headers: HEADERS });
        assert(Array.isArray(listsData.lists), '3.03 - Email Lists creation & retrieval works');

        console.log('\nTesting Campaign Creation...');
        const campaignPayload = {
            name: 'QA Test Broadcast',
            subject: 'Exciting news from Creatorly Test',
            content: 'Hello {{name}}! This is a test broadcast.',
        };
        const createData = await safeFetchJSON(`${BASE_URL}/api/creator/email/campaign`, {
            method: 'POST', headers: HEADERS,
            body: JSON.stringify(campaignPayload)
        });

        const campaignId = createData.campaign?._id;
        assert(!!campaignId, '3.04 - Create Campaign works cleanly');

        // Verify if recipient pool populated correctly
        const recipientsArray = createData.campaign?.recipients || [];
        assert(recipientsArray.length > 0, '3.05 - Campaign populates recipient pool (Bug Check)');

        console.log('\nTesting Broadcast Delivery Enqueue...');
        try {
            const sendData = await safeFetchJSON(`${BASE_URL}/api/creator/email/send`, {
                method: 'POST', headers: HEADERS,
                body: JSON.stringify({ campaignId })
            });
            assert(sendData.success === true, '3.07 - Broadcast Queue enqueues successfully');
        } catch (e: any) {
            assert(false, `3.07 - Broadcast Queue enqueues successfully (${e.message})`);
        }

    } catch (e: any) {
        console.error('\n🔴 Test script crashed:', e.message);
        failed++;
    }

    console.log(`\n--- RESULTS: ${passed} Passed, ${failed} Failed ---\n`);
    process.exit(failed > 0 ? 1 : 0);
}

setup().then(runQaTests).catch(console.error);
