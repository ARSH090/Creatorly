import { NextRequest, NextResponse } from 'next/server';
export const dynamic = 'force-dynamic';
import { withAdminAuth } from '@/lib/auth/withAuth';

export const GET = withAdminAuth(async (req: NextRequest) => {
  return NextResponse.json({
    message: 'Admin metrics moved to /api/admin/dashboard/metrics',
    redirect: '/api/admin/dashboard/metrics',
  });
});
