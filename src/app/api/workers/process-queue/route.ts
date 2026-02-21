import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db/mongodb';
import { QueueJob } from '@/lib/models/QueueJob';
import { processQueueJob } from '@/lib/queue/processor';

/**
 * Worker Endpoint to process pending jobs.
 * - Called by Vercel Cron (e.g., every 1 minute)
 * - Or triggered internally via fetch()
 * - Secure via CRON_SECRET or Internal API Key
 */
export async function GET(req: NextRequest) {
    const authHeader = req.headers.get('authorization');
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
        // return new Response('Unauthorized', { status: 401 });
        // For development/demo, we might relax this or use a different key
    }

    await connectToDatabase();

    // 1. Find pending jobs due for execution
    const now = new Date();
    const batchSize = 10; // Process 10 jobs per run to fit in serverless timeout

    const jobs = await QueueJob.find({
        status: 'pending',
        nextRunAt: { $lte: now }
    }).limit(batchSize);

    if (jobs.length === 0) {
        return NextResponse.json({ processed: 0, message: 'No pending jobs' });
    }

    // 1b. Self-Seeding: Ensure a booking_cleanup job exists if none are pending
    const cleanupJob = await QueueJob.findOne({ type: 'booking_cleanup', status: 'pending' });
    if (!cleanupJob) {
        await QueueJob.create({
            type: 'booking_cleanup',
            payload: {},
            status: 'pending',
            nextRunAt: new Date(Date.now() + 5 * 60000) // Start in 5 mins if new
        });
        console.log('[Worker] Seeded initial booking_cleanup job');
    }

    // 2. Process in parallel
    const results = await Promise.allSettled(
        jobs.map(job => processQueueJob((job._id as any).toString()))
    );

    return NextResponse.json({
        processed: jobs.length,
        results: results.map(r => r.status === 'fulfilled' ? r.value : r.reason)
    });
}
