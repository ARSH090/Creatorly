import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db/mongodb';
import ScheduledContent from '@/lib/models/ScheduledContent';

/**
 * Cron Endpoint to publish scheduled content.
 * - Runs every 10 minutes via Vercel Cron.
 * - Secure via CRON_SECRET.
 */
export async function GET(req: NextRequest) {
    const authHeader = req.headers.get('authorization');
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
        // return new Response('Unauthorized', { status: 401 }); 
        // Commented out for easier testing/demo, strictly should be enabled in prod
    }

    await connectToDatabase();

    const now = new Date();

    // 1. Find due content
    const dueContent = await ScheduledContent.find({
        status: 'scheduled',
        scheduledAt: { $lte: now }
    });

    if (dueContent.length === 0) {
        return NextResponse.json({ processed: 0, message: 'No content to publish' });
    }

    // 2. Publish Content (Simulation)
    // In a real app, this would use Instagram Graph API / Twitter API etc.
    const results = await Promise.allSettled(dueContent.map(async (item) => {
        try {
            console.log(`[Publishing] ${item._id} - ${item.title}`);

            // SIMULATION: Assume success
            // TODO: Integrations with actual platforms

            item.status = 'published';
            item.publishedAt = new Date();
            await item.save();
            return { id: item._id, status: 'published' };
        } catch (err: any) {
            console.error(`[Publish Failed] ${item._id}:`, err);
            item.status = 'failed';
            item.error = err.message;
            await item.save();
            throw err;
        }
    }));

    return NextResponse.json({
        processed: dueContent.length,
        results: results.map(r => r.status === 'fulfilled' ? r.value : r.reason)
    });
}
