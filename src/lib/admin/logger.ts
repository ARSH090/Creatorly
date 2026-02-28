import { NextRequest } from 'next/server';
import { auditLog } from '@/lib/utils/auditLogger';
import { connectToDatabase } from '@/lib/db/mongodb';

/**
 * Log admin action to database
 */
export async function logAdminAction(
    adminEmail: string,
    action: string,
    targetType: any,
    targetId?: string,
    changes?: any,
    req?: NextRequest
) {
    try {
        await connectToDatabase();
        const User = (await import('@/lib/models/User')).default;
        const admin = await User.findOne({ email: adminEmail });

        if (!admin) return;

        await auditLog({
            userId: admin._id,
            action,
            resourceType: targetType,
            resourceId: targetId,
            metadata: changes,
            req
        });
    } catch (error) {
        console.error('Failed to log admin action:', error);
    }
}
