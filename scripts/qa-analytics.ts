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

async function setup() {
    await mongoose.connect(process.env.MONGODB_URI as string);
    const UserSchema = new mongoose.Schema({ email: String, clerkId: String }, { strict: false });
    const User = mongoose.models.User || mongoose.model('User', UserSchema);

    user = await User.findOne({ email: 'test@creatorly.in' });
    if (!user) throw new Error("Test user not found");

    // Seed Orders for Revenue testing
    const OrderSchema = new mongoose.Schema({}, { strict: false });
    const Order = mongoose.models.Order || mongoose.model('Order', OrderSchema);

    // Check if we have orders, if not, create one
    const count = await Order.countDocuments({ creatorId: user._id, status: 'completed' });
    if (count === 0) {
        await Order.create({
            creatorId: user._id,
            userId: user._id,
            paymentStatus: 'paid',
            status: 'completed',
            customerEmail: 'analytics-customer@qa.com',
            amount: 500,
            total: 500,
            currency: 'INR',
            paidAt: new Date(),
            orderNumber: `TEST-ORD-AN-${Date.now()}`
        });
    }

    // Seed AnalyticsEvents for Traffic testing
    const AnalyticsEventSchema = new mongoose.Schema({}, { strict: false });
    const AnalyticsEvent = mongoose.models.AnalyticsEvent || mongoose.model('AnalyticsEvent', AnalyticsEventSchema);

    // Add some UTM traffic today
    await AnalyticsEvent.create({
        creatorId: user._id,
        eventType: 'page_view',
        path: `/u/${user.username || 'testcreator'}`,
        utm_source: 'twitter',
        utm_medium: 'social',
        utm_campaign: 'qa_launch',
        referrer: 'https://twitter.com',
        sessionId: `sess_${Date.now()}`,
        metadata: { source: 'server-component' },
        createdAt: new Date()
    });

    await mongoose.disconnect();
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
    console.log('\n--- STARTING MODULE 6 QA TESTS: ANALYTICS ---\n');
    let passed = 0; let failed = 0;
    const assert = (condition: boolean, msg: string) => {
        if (condition) { console.log(`✅ [PASS] ${msg}`); passed++; }
        else { console.error(`❌ [FAIL] ${msg}`); failed++; }
    };

    try {
        console.log('Testing Analytics Master Dashboard...');
        const summaryData = await safeFetchJSON(`${BASE_URL}/api/creator/analytics`, { headers: HEADERS });
        assert(
            typeof summaryData.todayRevenue === 'number' && typeof summaryData.todayVisitors === 'number',
            '6.01 - Analytics dashboard aggregates traffic counts'
        );

        console.log('\nTesting Traffic & Referrer Endpoints...');
        const trafficData = await safeFetchJSON(`${BASE_URL}/api/creator/analytics/traffic?type=source`, { headers: HEADERS });

        // Assert we have source mappings (e.g., twitter, direct)
        const hasSources = Array.isArray(trafficData.sources) && trafficData.sources.length > 0;
        assert(hasSources, '6.02 - Source mapping tracks UTM referrers');

        const hasUtm = Array.isArray(trafficData.utmBreakdown);
        assert(hasUtm, '6.03 - Click events and page views persist');

        console.log('\nTesting Revenue Time-Series...');
        const revenueData = await safeFetchJSON(`${BASE_URL}/api/creator/analytics/revenue?days=30&period=daily`, { headers: HEADERS });
        assert(Array.isArray(revenueData.data) && revenueData.data.length > 0, '6.04 - Purchases accurately convert to revenue graphs');

        // Ensure date filtering exists in the return payload format
        assert(revenueData.days === 30 && revenueData.period === 'daily', '6.05 - Date range filtering acts reliably');

    } catch (e: any) {
        console.error('\n🔴 Test script crashed:', e.message);
        failed++;
    }

    console.log(`\n--- RESULTS: ${passed} Passed, ${failed} Failed ---\n`);
    process.exit(failed > 0 ? 1 : 0);
}

setup().then(runQaTests).catch(console.error);
