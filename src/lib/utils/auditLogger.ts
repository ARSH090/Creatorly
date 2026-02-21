import AdminLog from '@/lib/models/AdminLog';
import { connectToDatabase } from '@/lib/db/mongodb';

export interface LogActionParams {
    adminEmail: string;
    action: string;
    targetType: 'user' | 'product' | 'order' | 'payout' | 'coupon' | 'settings' | 'system';
    targetId?: string;
    changes?: any;
    req?: any;
}

/**
 * Utility to record administrative actions in the Audit Log (using AdminLog model)
 */
export async function recordAdminAction(params: LogActionParams) {
    try {
        await connectToDatabase();

        const { adminEmail, action, targetType, targetId, changes, req } = params;

        let ipAddress = 'unknown';
        let userAgent = 'unknown';

        if (req) {
            ipAddress = req.headers.get('x-forwarded-for') || '127.0.0.1';
            userAgent = req.headers.get('user-agent') || 'unknown';
        }

        return await AdminLog.create({
            adminEmail,
            action,
            targetType,
            targetId,
            changes,
            ipAddress,
            userAgent,
            timestamp: new Date()
        });
    } catch (error) {
        console.error('Audit Log Failure:', error);
    }
}
