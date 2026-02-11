
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
import ScheduledContent from '../src/lib/models/ScheduledContent';
import { GET as publishCronHandler } from '../src/app/api/cron/publish/route';
import { NextRequest } from 'next/server';

async function testBioAutomation() {
    console.log('🔌 Connecting to DB...');
    await connectToDatabase();

    const creatorId = new mongoose.Types.ObjectId();
    const productId = new mongoose.Types.ObjectId();

    console.log('🧹 Cleaning up old test content...');
    await ScheduledContent.deleteMany({ title: 'Test Bio Auto' });

    console.log('📝 Creating PAST scheduled content...');
    const pastDate = new Date();
    pastDate.setMinutes(pastDate.getMinutes() - 20); // 20 mins ago

    const content = await ScheduledContent.create({
        creatorId,
        productId,
        title: 'Test Bio Auto',
        description: 'Auto Publish Test',
        scheduledAt: pastDate,
        status: 'scheduled'
    });
    console.log(`✅ Content created: ${content._id} (Scheduled at: ${pastDate.toISOString()})`);

    console.log('⚙️ Triggering Cron Handler...');
    // Mock Request with Cron Secret
    const req = new NextRequest('http://localhost:3000/api/cron/publish', {
        headers: { 'Authorization': `Bearer ${process.env.CRON_SECRET || ''}` }
    });

    try {
        const res = await publishCronHandler(req);
        const json = await res.json();
        console.log('Cron Result:', json);
    } catch (e) {
        console.error('Cron Handler Error:', e);
    }

    const updatedContent = await ScheduledContent.findById(content._id);
    console.log('Updated Status:', updatedContent?.status);
    console.log('Published At:', updatedContent?.publishedAt);

    if (updatedContent?.status === 'published' && updatedContent.publishedAt) {
        console.log('✅ SUCCESS: Content was published!');
    } else {
        console.log('❌ FAILURE: Content was NOT published.');
    }

    process.exit(0);
}

testBioAutomation().catch(err => {
    console.error(err);
    process.exit(1);
});
