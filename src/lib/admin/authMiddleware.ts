import { NextRequest, NextResponse } from 'next/server';
import * as crypto from 'crypto';

export const ADMIN_PERMISSIONS = {
    VIEW_USERS: 'view_users',
    EDIT_USERS: 'edit_users',
    VIEW_ORDERS: 'view_orders',
    REFUND_ORDERS: 'refund_orders',
    VIEW_ANALYTICS: 'view_analytics',
    MANAGE_PRODUCTS: 'manage_products',
};

export async function getAdminSession() {
    const { cookies } = await import('next/headers');
    const token = (await cookies()).get('admin-token')?.value;

    if (!token) return null;

    try {
        const [base64Payload, signature] = token.split('.');
        if (!base64Payload || !signature) return null;

        const payloadText = Buffer.from(base64Payload, 'base64').toString();

        // Verify Signature
        const expectedSignature = crypto.createHmac('sha256', process.env.JWT_SECRET || 'fallback-secret')
            .update(payloadText)
            .digest('hex');

        if (signature !== expectedSignature) {
            console.error('🚨 Admin session signature mismatch!');
            return null;
        }

        const session = JSON.parse(payloadText);

        // Check expiry (2 hours)
        if (Date.now() - session.iat > 2 * 60 * 60 * 1000) {
            return null;
        }

        return session;
    } catch (error) {
        console.error('Admin session parsing error:', error);
        return null;
    }
}

export function hasPermission(session: any, permission: string) {
    if (!session) return false;
    if (session.role === 'super-admin') return true;
    return session.permissions?.includes(permission) || false;
}

export async function logAdminAction(
    adminId: string,
    adminEmail: string,
    action: string,
    resourceType: string,
    resourceId: string,
    identifier: string,
    details: string,
    changes?: any,
    ip?: string,
    userAgent?: string
) {
    try {
        const { AdminLog } = await import('@/lib/models/AdminLog');
        await AdminLog.create({
            adminId,
            adminEmail,
            action,
            resourceType,
            resourceId,
            identifier,
            details,
            changes,
            ipAddress: ip || 'unknown',
            userAgent: userAgent || 'unknown',
            timestamp: new Date(),
        });
    } catch (error) {
        console.error('Failed to log admin action:', error);
    }
}

export function getClientIp(req: NextRequest | Request) {
    const forwarded = (req as any).headers?.get?.('x-forwarded-for') || (req as any).headers?.['x-forwarded-for'];
    if (forwarded) return forwarded.split(',')[0].trim();
    return '127.0.0.1';
}

export function getClientUserAgent(req: NextRequest | Request) {
    return (req as any).headers?.get?.('user-agent') || (req as any).headers?.['user-agent'] || 'unknown';
}
