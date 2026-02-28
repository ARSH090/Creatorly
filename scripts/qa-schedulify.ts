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
let testProduct: any = null;

async function setup() {
    await mongoose.connect(process.env.MONGODB_URI as string);
    const UserSchema = new mongoose.Schema({ email: String, clerkId: String, role: String }, { strict: false });
    const User = mongoose.models.User || mongoose.model('User', UserSchema);

    user = await User.findOne({ email: 'test@creatorly.in' });
    if (!user) throw new Error("Test user not found");

    const ProductSchema = new mongoose.Schema({ name: String, creatorId: mongoose.Schema.Types.ObjectId, status: String }, { strict: false });
    const Product = mongoose.models.Product || mongoose.model('Product', ProductSchema);

    testProduct = await Product.findOne({ creatorId: user._id });
    if (!testProduct) {
        testProduct = await Product.create({ name: 'Test Product', creatorId: user._id, status: 'published' });
    }

    await mongoose.disconnect();
}

async function safeFetchJSON(url: string, options: any) {
    const res = await fetch(url, options);
    const text = await res.text();
    if (!res.ok) throw new Error(`API Error [${res.status}]: ${text.substring(0, 500)}`);
    try { return JSON.parse(text); } catch { throw new Error('Parse error: ' + text); }
}

async function runQaTests() {
    console.log('\n--- STARTING MODULE 2 QA TESTS: SCHEDULIFY ---\n');
    let passed = 0; let failed = 0;
    const assert = (condition: boolean, msg: string) => {
        if (condition) { console.log(`✅ [PASS] ${msg}`); passed++; }
        else { console.error(`❌ [FAIL] ${msg}`); failed++; }
    };

    try {
        console.log('Testing past date validation...');
        let rejectedPastDate = false;
        try {
            await safeFetchJSON(`${BASE_URL}/api/creator/schedule`, {
                method: 'POST', headers: HEADERS,
                body: JSON.stringify({
                    productId: testProduct._id.toString(),
                    title: 'Test',
                    description: 'Test post',
                    scheduledAt: new Date(Date.now() - 100000).toISOString()
                })
            });
        } catch (e: any) {
            if (e.message.includes('400')) rejectedPastDate = true;
        }
        assert(rejectedPastDate, '2.04 - Validates past dates correctly');

        console.log('\nTesting content creation...');
        const createData = await safeFetchJSON(`${BASE_URL}/api/creator/schedule`, {
            method: 'POST', headers: HEADERS,
            body: JSON.stringify({
                productId: testProduct._id.toString(),
                title: 'Test Post',
                description: 'This is a test post that needs > 10 chars',
                scheduledAt: new Date(Date.now() + 86400000).toISOString(),
                social: { instagram: true }
            })
        });

        const scheduleId = createData.scheduled?._id;
        assert(!!scheduleId, '2.03 - Schedule new content works cleanly');

        console.log('\nTesting Retrieval...');
        const listData = await safeFetchJSON(`${BASE_URL}/api/creator/schedule`, { headers: HEADERS });
        assert(Array.isArray(listData.content) && listData.content.length > 0, '2.02 - List/Calendar view retrieves content');

        console.log('\nTesting Update...');
        try {
            const editData = await safeFetchJSON(`${BASE_URL}/api/creator/schedule/${scheduleId}`, {
                method: 'PUT', headers: HEADERS,
                body: JSON.stringify({ title: 'Updated Title' })
            });
            assert(editData.scheduled?.title === 'Updated Title', '2.05 - Edit scheduled content works');
        } catch (e: any) {
            assert(false, `2.05 - Edit scheduled content works (${e.message})`);
        }

        console.log('\nTesting Deletion...');
        try {
            await safeFetchJSON(`${BASE_URL}/api/creator/schedule/${scheduleId}`, {
                method: 'DELETE', headers: HEADERS
            });
            assert(true, '2.06 - Delete scheduled content works');
        } catch (e: any) {
            assert(false, `2.06 - Delete scheduled content works (${e.message})`);
        }

    } catch (e: any) {
        console.error('\n🔴 Test script crashed:', e.message);
        failed++;
    }

    console.log(`\n--- RESULTS: ${passed} Passed, ${failed} Failed ---\n`);
    process.exit(failed > 0 ? 1 : 0);
}

setup().then(runQaTests).catch(console.error);
