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
let Product: any = null;

async function setup() {
    await mongoose.connect(process.env.MONGODB_URI as string);
    const UserSchema = new mongoose.Schema({ email: String, clerkId: String, username: String }, { strict: false });
    const User = mongoose.models.User || mongoose.model('User', UserSchema);

    user = await User.findOne({ email: 'test@creatorly.in' });
    if (!user) throw new Error("Test user not found");

    const CreatorProfileSchema = new mongoose.Schema({}, { strict: false });
    const CreatorProfile = mongoose.models.CreatorProfile || mongoose.model('CreatorProfile', CreatorProfileSchema);

    // Ensure profile exists for testing
    let profile = await CreatorProfile.findOne({ creatorId: user._id });
    if (!profile) {
        profile = await CreatorProfile.create({
            creatorId: user._id,
            storeName: user.username || 'Test Store',
            isPublished: true
        });
    }

    // Mock an active product to test `5.02 Products map successfully to UI cards` if needed by fetching /u/ endpoint.
    const ProductSchema = new mongoose.Schema({}, { strict: false });
    Product = mongoose.models.Product || mongoose.model('Product', ProductSchema);
    const existingProduct = await Product.findOne({ creatorId: user._id, status: 'active' });
    if (!existingProduct) {
        await Product.create({
            creatorId: user._id,
            name: 'QA Test Product',
            slug: 'qa-test-product',
            description: 'Test product for storefront QA',
            price: 100,
            currency: 'INR',
            status: 'active',
            isActive: true,
            type: 'digital',
            visibility: 'public'
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
        return json.data || json; // Auto-unwrap withErrorHandler envelope
    } catch { throw new Error('Parse error: ' + text); }
}

async function runQaTests() {
    console.log('\n--- STARTING MODULE 5 QA TESTS: STOREFRONT ---\n');
    let passed = 0; let failed = 0;
    const assert = (condition: boolean, msg: string) => {
        if (condition) { console.log(`✅ [PASS] ${msg}`); passed++; }
        else { console.error(`❌ [FAIL] ${msg}`); failed++; }
    };

    try {
        console.log('Testing Storefront Editor Config Retrieval...');
        const configData = await safeFetchJSON(`${BASE_URL}/api/creator/profile`, { headers: HEADERS });
        assert(configData && configData.profile && configData.storefrontData, '5.04 - Storefront Editor retrieves config');

        console.log('\nTesting Store Settings PATCH Update...');
        const patchData = await safeFetchJSON(`${BASE_URL}/api/creator/profile`, {
            method: 'PATCH',
            headers: HEADERS,
            body: JSON.stringify({
                theme: { primaryColor: '#7C3AED' },
                isPublished: true
            })
        });

        assert(patchData.success === true && patchData.storefront?.theme?.primaryColor === '#7C3AED', '5.05 - Store settings PATCH requests save configuration');

        console.log(`\nTesting Public Developer Storefront Routing (/u/${user.username})...`);
        const publicRes = await fetch(`${BASE_URL}/u/${user.username}`);
        const publicHtml = await publicRes.text();

        // Assert it rendered HTML successfully (200 status) and includes some keywords
        assert(publicRes.ok && publicHtml.includes('<!DOCTYPE html>'), '5.01 - Creator link /u/[username] loads layout');

        // Check if our patched theme color or product data made it to the page
        const productVisible = publicHtml.includes('QA Test Product');
        assert(productVisible, '5.02 - Products map successfully to UI cards');

    } catch (e: any) {
        console.error('\n🔴 Test script crashed:', e.message);
        failed++;
    }

    console.log(`\n--- RESULTS: ${passed} Passed, ${failed} Failed ---\n`);
    process.exit(failed > 0 ? 1 : 0);
}

setup().then(runQaTests).catch(console.error);
