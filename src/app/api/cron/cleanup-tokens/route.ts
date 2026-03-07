import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db/mongodb';
import { DownloadToken } from '@/lib/models/DownloadToken';

/**
 * GET /api/cron/cleanup-tokens
 * Weekly job to delete expired/deactivated download tokens older than 30 days
 */
export async function GET(req: NextRequest) {
    const authHeader = req.headers.get('authorization');
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        await connectToDatabase();

        const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

        // Delete tokens that are:
        // 1. Expired more than 30 days ago
        // 2. Deactivated more than 30 days ago
        const result = await DownloadToken.deleteMany({
            $or: [
                { expiresAt: { $lt: thirtyDaysAgo } },
                { isActive: false, updatedAt: { $lt: thirtyDaysAgo } },
            ]
        });

        console.log(`[CLEANUP_TOKENS] Deleted ${result.deletedCount} expired tokens`);

        return NextResponse.json({
            success: true,
            deletedCount: result.deletedCount,
            timestamp: new Date().toISOString(),
        });
    } catch (error: any) {
        console.error('[CLEANUP_TOKENS]', error);
        return NextResponse.json({ error: 'Cleanup failed' }, { status: 500 });
    }
}
