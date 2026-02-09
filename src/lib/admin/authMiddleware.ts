import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { NextRequest, NextResponse } from 'next/server';
import { AdminLog } from '@/lib/models/AdminLog';
import { connectToDatabase } from '@/lib/db/mongodb';

export interface AdminSession {
  id: string;
  email: string;
  role: 'admin' | 'super-admin';
  permissions: string[];
}

export async function getAdminSession(): Promise<AdminSession | null> {
  const session = await getServerSession(authOptions);

  if (!session?.user) return null;

  // In production, you'd also validate the role from your database
  const isAdmin = ['admin', 'super-admin'].includes((session.user as any).role);

  if (!isAdmin) return null;

  return {
    id: (session.user as any).id,
    email: session.user.email || '',
    role: (session.user as any).role,
    permissions: (session.user as any).permissions || [],
  };
}

export async function adminAuthMiddleware(req: NextRequest, requiredPermission?: string) {
  const session = await getAdminSession();

  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Check specific permission if required
  if (requiredPermission && !hasPermission(session, requiredPermission)) {
    return NextResponse.json({ error: 'Forbidden: Insufficient permissions' }, { status: 403 });
  }

  return { session };
}

export function hasPermission(session: AdminSession, permission: string): boolean {
  // Super-admin has all permissions
  if (session.role === 'super-admin') return true;

  return session.permissions.includes(permission);
}

export async function logAdminAction(
  adminId: string,
  adminEmail: string,
  action: string,
  resource: string,
  resourceId?: string,
  resourceName?: string,
  description?: string,
  changes?: any,
  ipAddress?: string,
  userAgent?: string
) {
  try {
    await connectToDatabase();

    const log = new AdminLog({
      adminId,
      adminEmail,
      action,
      resource,
      resourceId,
      resourceName,
      description: description || `${action} on ${resource}`,
      changes,
      ipAddress,
      userAgent,
      status: 'success',
      timestamp: new Date(),
    });

    await log.save();
    return log;
  } catch (error) {
    console.error('Failed to log admin action:', error);
    // Don't throw, logging failure shouldn't block the action
  }
}

export function getClientIp(req: NextRequest): string {
  const forwarded = req.headers.get('x-forwarded-for');
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }
  return req.headers.get('x-real-ip') || 'unknown';
}

export function getClientUserAgent(req: NextRequest): string {
  return req.headers.get('user-agent') || 'unknown';
}

// Permission constants
export const ADMIN_PERMISSIONS = {
  // User management
  VIEW_USERS: 'view:users',
  EDIT_USERS: 'edit:users',
  DELETE_USERS: 'delete:users',
  BAN_USERS: 'ban:users',
  SUSPEND_USERS: 'suspend:users',

  // Product management
  VIEW_PRODUCTS: 'view:products',
  EDIT_PRODUCTS: 'edit:products',
  DELETE_PRODUCTS: 'delete:products',
  APPROVE_PRODUCTS: 'approve:products',
  FEATURE_PRODUCTS: 'feature:products',

  // Order management
  VIEW_ORDERS: 'view:orders',
  EDIT_ORDERS: 'edit:orders',
  REFUND_ORDERS: 'refund:orders',

  // Payment/Finance
  VIEW_PAYMENTS: 'view:payments',
  VIEW_FINANCE: 'view:finance',
  MANAGE_PAYOUTS: 'manage:payouts',

  // Coupon management
  MANAGE_COUPONS: 'manage:coupons',
  CREATE_COUPONS: 'create:coupons',
  DELETE_COUPONS: 'delete:coupons',

  // System
  VIEW_SETTINGS: 'view:settings',
  EDIT_SETTINGS: 'edit:settings',
  VIEW_LOGS: 'view:logs',
  MANAGE_ADMINS: 'manage:admins',

  // Analytics
  VIEW_ANALYTICS: 'view:analytics',
  EXPORT_DATA: 'export:data',
};

export const ADMIN_ROLES = {
  ADMIN: {
    name: 'admin',
    permissions: [
      ADMIN_PERMISSIONS.VIEW_USERS,
      ADMIN_PERMISSIONS.VIEW_PRODUCTS,
      ADMIN_PERMISSIONS.VIEW_ORDERS,
      ADMIN_PERMISSIONS.VIEW_PAYMENTS,
      ADMIN_PERMISSIONS.VIEW_ANALYTICS,
      ADMIN_PERMISSIONS.MANAGE_COUPONS,
      ADMIN_PERMISSIONS.REFUND_ORDERS,
    ],
  },
  SUPER_ADMIN: {
    name: 'super-admin',
    permissions: Object.values(ADMIN_PERMISSIONS), // All permissions
  },
  MODERATOR: {
    name: 'moderator',
    permissions: [
      ADMIN_PERMISSIONS.VIEW_USERS,
      ADMIN_PERMISSIONS.VIEW_PRODUCTS,
      ADMIN_PERMISSIONS.VIEW_ORDERS,
      ADMIN_PERMISSIONS.BAN_USERS,
    ],
  },
};
