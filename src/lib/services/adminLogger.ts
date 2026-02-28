/* eslint-disable react-hooks/exhaustive-deps, react/no-unescaped-entities, @next/next/no-img-element, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars, prefer-const, import/no-anonymous-default-export */
import { auditLog } from '@/lib/utils/auditLogger';

/**
 * Admin Logger Service
 * Logs admin actions for audit trail and compliance
 */

interface AdminLogParams {
    adminId: string;
    action: string;
    resource: string;
    details?: any;
    ipAddress?: string;
    timestamp?: Date;
}

/**
 * Log admin actions to the unified AuditLog system
 */
export async function logAdminAction(params: AdminLogParams): Promise<void> {
    await auditLog({
        userId: params.adminId,
        action: params.action,
        resourceType: 'system', // Defaulting to system for generic service logs
        resourceId: params.resource,
        metadata: params.details,
        req: params.ipAddress ? { headers: new Map([['x-forwarded-for', params.ipAddress]]) } : undefined
    });

    // Log to console in development
    if (process.env.NODE_ENV !== 'production') {
        console.log('[ADMIN ACTION]', JSON.stringify(params, null, 2));
    }
}

/**
 * Helper to create standardized admin log entries
 */
export function createAdminLog(
    adminId: string,
    action: string,
    resource: string,
    details?: any,
    ipAddress?: string
) {
    return {
        adminId,
        action,
        resource,
        details,
        ipAddress,
    };
}

export default {
    logAdminAction,
    createAdminLog,
};
