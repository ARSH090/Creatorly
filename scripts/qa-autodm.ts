import mongoose from 'mongoose';
import * as dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const BASE_URL = 'http://localhost:3000';
const HEADERS = {
    'Content-Type': 'application/json',
    'x-test-secret': process.env.TEST_SECRET as string || 'v3ry-s3cr3t-t3st-v4lu3'
};

async function setupTestUser() {
    await mongoose.connect(process.env.MONGODB_URI as string);
    const UserSchema = new mongoose.Schema({ email: String, clerkId: String, role: String }, { strict: false });
    const User = mongoose.models.User || mongoose.model('User', UserSchema);

    let user = await User.findOne({ email: 'test@creatorly.in' });
    if (!user) {
        await User.create({ email: 'test@creatorly.in', clerkId: 'test_clerk_id', role: 'creator' });
        console.log('✅ Setup: Created test user for QA');
    } else {
        await User.updateOne({ email: 'test@creatorly.in' }, { role: 'creator' });
    }
    await mongoose.disconnect();
}

async function safeFetchJSON(url: string, options: any) {
    const res = await fetch(url, options);
    const text = await res.text();
    if (!res.ok) throw new Error(`API Error [${res.status}]: ${text.substring(0, 500)}`);
    try { return JSON.parse(text); } catch { throw new Error('Parse error'); }
}

async function runQaTests() {
    console.log('\n--- STARTING MODULE 1 QA TESTS: AUTODM HUB ---\n');
    let passed = 0; let failed = 0;
    const assert = (condition: boolean, msg: string) => {
        if (condition) { console.log(`✅ [PASS] ${msg}`); passed++; }
        else { console.error(`❌ [FAIL] ${msg}`); failed++; }
    };

    try {
        const createData = await safeFetchJSON(`${BASE_URL}/api/creator/automation/rules`, {
            method: 'POST', headers: HEADERS,
            body: JSON.stringify({ trigger: 'keyword', keywords: ['FREE'], response: 'Gift! https://a.com', isActive: true, followRequired: false })
        });

        const ruleId = createData.data?.rule?._id;
        assert(!!ruleId, '1.07 - Create new automation works');
        assert(createData.data?.rule?.triggerType === 'dm', '1.08 - Trigger types correctly parsed');
        assert(createData.data?.rule?.keywords?.includes('free'), '1.09 - Keyword trigger saves correctly');
        assert(createData.data?.rule?.replyText.includes('Gift'), '1.10 - DM response message saves correctly');
        assert(createData.data?.rule?.replyText.includes('https://'), '1.11 - DM message with link saves correctly');

        const listData = await safeFetchJSON(`${BASE_URL}/api/creator/automation/rules`, { headers: HEADERS });
        assert(Array.isArray(listData.data?.rules) && listData.data.rules.length > 0, '1.14 - Automation list fetched correctly');

        const editData = await safeFetchJSON(`${BASE_URL}/api/creator/automation/rules/${ruleId}`, {
            method: 'PUT', headers: HEADERS,
            body: JSON.stringify({ keywords: ['UPDATED'], response: 'Updated' })
        });
        assert(editData.data?.rule?.keywords?.includes('updated'), '1.15 - Edit automation works');

        const toggleData = await safeFetchJSON(`${BASE_URL}/api/creator/automation/rules/${ruleId}`, {
            method: 'PUT', headers: HEADERS,
            body: JSON.stringify({ isActive: false })
        });
        assert(toggleData.data?.rule?.isActive === false, '1.13 - Automation disable toggle works');

        await safeFetchJSON(`${BASE_URL}/api/creator/automation/rules/${ruleId}`, { method: 'DELETE', headers: HEADERS });
        const verifyData = await safeFetchJSON(`${BASE_URL}/api/creator/automation/rules`, { headers: HEADERS });
        const found = verifyData.data?.rules?.find((r: any) => r._id === ruleId);
        assert(!found, '1.16 - Delete automation firmly removed from DB');

    } catch (e: any) {
        console.error('\n🔴 Test script crashed:', e.message);
        failed++;
    }

    console.log(`\n--- RESULTS: ${passed} Passed, ${failed} Failed ---\n`);
    process.exit(failed > 0 ? 1 : 0);
}

setupTestUser().then(runQaTests).catch(console.error);
