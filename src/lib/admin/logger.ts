import { NextRequest } from 'next/server';
import AdminLog from '@/lib/models/AdminLog';
import { connectToDatabase } from '@/lib/db/mongodb';

/**
 * Log admin action to database
 */
export async function logAdminAction(
    adminEmail: string,
    action: string,
    targetType: string,
    targetId?: string,
    changes?: any,
    req?: NextRequest
) {
    try {
        await connectToDatabase();

        const ipAddress = req?.headers.get('x-forwarded-for') ||
            req?.headers.get('x-real-ip') ||
            'unknown';
        const userAgent = req?.headers.get('user-agent') || 'unknown';

        await AdminLog.create({
            adminEmail,
            action,
            targetType,
            targetId: targetId as any,
            changes,
            ipAddress,
            userAgent,
            timestamp: new Date()
        });
    } catch (error) {
        console.error('Failed to log admin action:', error);
        // Don't throw - logging failure shouldn't break the main operation
    }
}
