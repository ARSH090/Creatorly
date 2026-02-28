import AuditLog from '@/lib/models/AuditLog';
import { connectToDatabase } from '@/lib/db/mongodb';
import mongoose from 'mongoose';

export interface AuditLogParams {
    userId: string | mongoose.Types.ObjectId;
    action: string;
    resourceType: 'user' | 'product' | 'order' | 'coupon' | 'domain' | 'system' | 'announcement' | 'ticket' | 'message' | 'store' | 'settlement' | 'withdrawal' | 'setting';
    resourceId?: string | mongoose.Types.ObjectId;
    metadata?: any;
    req?: any;
}

/**
 * Standard audit log utility for both Creator and Admin actions
 */
export async function auditLog(params: AuditLogParams) {
    try {
        await connectToDatabase();
        const { userId, action, resourceType, resourceId, metadata, req } = params;

        let ipAddress = 'unknown';
        let userAgent = 'unknown';

        if (req) {
            ipAddress = req.headers.get('x-forwarded-for') || '127.0.0.1';
            userAgent = req.headers.get('user-agent') || 'unknown';
        }

        return await AuditLog.create({
            adminId: userId, // Mapping userId to adminId for schema compatibility
            action,
            entityType: resourceType,
            entityId: resourceId,
            details: metadata,
            ipAddress,
            userAgent
        });
    } catch (error) {
        console.error('[AuditLog] Failed to record action:', error);
    }
}

/**
 * Legacy wrapper for Admin-only actions (Refactored to use AuditLog)
 */
export interface LogActionParams {
    adminEmail: string; // Used to find adminId
    action: string;
    targetType: any;
    targetId?: string;
    changes?: any;
    req?: any;
}

export async function recordAdminAction(params: LogActionParams) {
    try {
        await connectToDatabase();
        const User = (await import('@/lib/models/User')).default;
        const admin = await User.findOne({ email: params.adminEmail });

        if (!admin) {
            console.warn(`[AuditLog] Admin ${params.adminEmail} not found for logging.`);
            return;
        }

        return await auditLog({
            userId: admin._id,
            action: params.action,
            resourceType: params.targetType,
            resourceId: params.targetId,
            metadata: params.changes,
            req: params.req
        });
    } catch (error) {
        console.error('[AuditLog] Legacy wrapper failure:', error);
    }
}
