import { NextRequest, NextResponse } from 'next/server';
import { TokenManagerService } from '@/lib/services/tokenManager';

export async function GET(request: NextRequest) {
    // Verify cron secret (Vercel Cron uses ?secret=)
    const { searchParams } = new URL(request.url);
    const secret = searchParams.get('secret');

    if (secret !== process.env.CRON_SECRET) {
        console.warn('[Cron] Unauthorized access attempt to token refresh');
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('[Cron] Running scheduled token refresh...');

    try {
        // Our service already handles the connections and loops
        await TokenManagerService.checkAllTokens();

        return NextResponse.json({
            success: true,
            timestamp: new Date().toISOString(),
            message: 'Token refresh cycle completed successfully'
        });
    } catch (error: any) {
        console.error('[Cron] Token refresh failed:', error);
        return NextResponse.json(
            { success: false, error: error.message },
            { status: 500 }
        );
    }
}
