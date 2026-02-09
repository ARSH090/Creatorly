import { NextRequest, NextResponse } from 'next/server';
export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    return NextResponse.json({
      message: 'Admin metrics moved to /api/admin/dashboard/metrics',
      redirect: '/api/admin/dashboard/metrics',
    });
  } catch (error) {
    console.error('Admin metrics error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch metrics' },
      { status: 500 }
    );
  }
}
