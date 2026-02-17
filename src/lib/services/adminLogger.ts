/**
 * Admin Logger Service
 * Logs admin actions for audit trail and compliance
 */

interface AdminLog {
    adminId: string;
    action: string;
    resource: string;
    details?: any;
    timestamp: Date;
    ipAddress?: string;
}

/**
 * Log admin actions to console and optionally to database/external service
 */
export function logAdminAction(log: AdminLog): void {
    const logEntry = {
        ...log,
        timestamp: log.timestamp || new Date(),
    };

    // Log to console in development
    if (process.env.NODE_ENV !== 'production') {
        console.log('[ADMIN ACTION]', JSON.stringify(logEntry, null, 2));
    }

    // In production, you might want to:
    // - Write to database audit table
    // - Send to external logging service (DataDog, LogRocket, etc.)
    // - Write to file system

    // Example: write to DB (implement based on your needs)
    // await db.adminLogs.insert(logEntry);
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
): AdminLog {
    return {
        adminId,
        action,
        resource,
        details,
        timestamp: new Date(),
        ipAddress,
    };
}

export default {
    logAdminAction,
    createAdminLog,
};
