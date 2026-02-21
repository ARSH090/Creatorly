import { NextResponse } from 'next/server';
import { whatsappQueue, instagramQueue } from '@/lib/queue';
import { withAuth } from '@/lib/auth/withAuth';

export const GET = withAuth(async (req, user) => {
    // Only super-admins can view queues
    if (user.role !== 'super-admin' && user.role !== 'admin') {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    try {
        const [whatsappCounts, instagramCounts] = await Promise.all([
            whatsappQueue.getJobCounts('wait', 'active', 'completed', 'failed', 'delayed', 'paused'),
            instagramQueue.getJobCounts('wait', 'active', 'completed', 'failed', 'delayed', 'paused')
        ]);

        // Get some recent jobs
        const [whatsappJobs, instagramJobs] = await Promise.all([
            whatsappQueue.getJobs(['active', 'failed'], 0, 10, true),
            instagramQueue.getJobs(['active', 'failed'], 0, 10, true)
        ]);

        const formatJobs = (jobs: any[]) => jobs.map(job => ({
            id: job.id,
            name: job.name,
            data: job.data,
            timestamp: job.timestamp,
            state: job.getState ? 'unknown' : 'N/A', // getState is async and complex here
            failedReason: job.failedReason,
        }));

        return NextResponse.json({
            success: true,
            queues: [
                {
                    name: 'whatsapp',
                    counts: whatsappCounts,
                    recentJobs: formatJobs(whatsappJobs)
                },
                {
                    name: 'instagram-dm',
                    counts: instagramCounts,
                    recentJobs: formatJobs(instagramJobs)
                }
            ]
        });

    } catch (error: any) {
        console.error('Queue API error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
});
