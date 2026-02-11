import { TokenManagerService } from '@/lib/services/tokenManager';

/**
 * Token Refresh Logic for Scheduler
 */
export async function startTokenRefreshJob() {
    console.log('[Scheduler] Starting token refresh check...');
    try {
        // Correcting static method call
        await TokenManagerService.checkAllTokens();
        console.log('[Scheduler] Token refresh check completed.');
    } catch (error) {
        console.error('[Scheduler] Token refresh job failed:', error);
        throw error;
    }
}

