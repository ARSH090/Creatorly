import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth/server-auth';

export async function adminAuthMiddleware(req: NextRequest) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized - No session' },
        { status: 401 }
      );
    }

    if (!user.role || !['admin', 'super_admin', 'super-admin'].includes(user.role)) {
      return NextResponse.json(
        { error: 'Forbidden - Admin access required' },
        { status: 403 }
      );
    }

    // Log admin action
    await logAdminAction({
      adminId: user._id,
      action: 'api_access',
      resource: req.nextUrl.pathname,
      resourceId: null,
      ipAddress: req.headers.get('x-forwarded-for') || 'unknown',
      userAgent: req.headers.get('user-agent') || 'unknown',
    });

    return { user, isAdmin: true };
  } catch (error) {
    console.error('Admin auth middleware error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}


async function logAdminAction(data: any) {
  try {
    const { default: AdminLog } = await import('@/lib/models/AdminLog');
    await AdminLog.create(data);
  } catch (error) {
    console.error('Failed to log admin action:', error);
  }
}

export function checkAdminPermission(action: string, role?: string) {
  const permissions: Record<string, string[]> = {
    view_dashboard: ['admin', 'super_admin'],
    view_users: ['admin', 'super_admin'],
    manage_users: ['super_admin'],
    view_orders: ['admin', 'super_admin'],
    create_order: ['super_admin'],
    process_refund: ['admin', 'super_admin'],
    manage_payouts: ['super_admin'],
    view_finance: ['admin', 'super_admin'],
    manage_coupons: ['admin', 'super_admin'],
    manage_products: ['admin', 'super_admin'],
    manage_settings: ['super_admin'],
  };

  return permissions[action]?.includes(role || '') || false;
}
