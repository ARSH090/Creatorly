import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Load .env.local manually
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const envPath = path.resolve(__dirname, '..', '.env.local');

if (fs.existsSync(envPath)) {
    console.log('📄 Loading .env.local...');
    const envConfig = fs.readFileSync(envPath, 'utf8');
    envConfig.split('\n').forEach(line => {
        const [key, value] = line.split('=');
        if (key && value) {
            process.env[key.trim()] = value.trim().replace(/^["']|["']$/g, '');
        }
    });
}

import mongoose from 'mongoose';
import { connectToDatabase } from '../src/lib/db/mongodb';
import { QueueJob } from '../src/lib/models/QueueJob';
import { processQueueJob } from '../src/lib/queue/processor';
import { DMLog } from '../src/lib/models/DMLog';

async function testQueue() {
    console.log('🔌 Connecting to DB...');
    await connectToDatabase();

    const creatorId = new mongoose.Types.ObjectId();
    const recipientId = 'test-recipient-123';

    console.log('🧹 Cleaning up old test jobs...');
    await QueueJob.deleteMany({ 'payload.recipientId': recipientId });
    await DMLog.deleteMany({ recipientId });

    console.log('📝 Creating test job...');
    const job = await QueueJob.create({
        type: 'dm_delivery',
        payload: {
            recipientId,
            text: 'Test DM from queue script',
            accessToken: 'fake-token',
            creatorId: creatorId.toString(),
            source: 'dm'
        },
        status: 'pending'
    });
    console.log(`✅ Job created: ${job._id}`);

    console.log('⚙️ Processing job...');
    // We expect this to fail because of fake token, but we want to verify the FLOW (pending -> processing -> failed -> retry scheduled)
    const result = await processQueueJob(job._id.toString());

    console.log('Concept result:', result);

    const updatedJob = await QueueJob.findById(job._id);
    console.log('Job Status:', updatedJob?.status);
    console.log('Job Attempt:', updatedJob?.attempt);
    console.log('Job Error:', updatedJob?.error);
    console.log('Next Run:', updatedJob?.nextRunAt);

    if (updatedJob?.status === 'pending' && updatedJob.attempt === 1 && updatedJob.nextRunAt > new Date()) {
        console.log('✅ SUCCESS: Job failed as expected (network) but was scheduled for retry!');
    } else if (updatedJob?.status === 'failed') {
        console.log('⚠️ Job failed permanently (maybe acceptable if maxAttempts=1 or error not retryable)');
    } else {
        console.log('❌ UNEXPECTED STATE');
    }

    process.exit(0);
}

testQueue().catch(err => {
    console.error(err);
    process.exit(1);
});
