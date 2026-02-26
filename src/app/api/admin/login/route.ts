import { NextResponse } from 'next/server';

/**
 * POST /api/admin/login
 *
 * DEPRECATED: This legacy custom-credential endpoint has been removed.
 * Admin authentication is now handled exclusively through Clerk.
 * Admin users must sign in via /auth/login and have the 'admin' or 'super-admin'
 * role assigned in the MongoDB User record.
 *
 * The admin panel layout (/app/admin/layout.tsx) enforces Clerk auth + role check
 * on every request, making this endpoint redundant and a security liability.
 */
export async function POST() {
  return NextResponse.json(
    {
      error: 'This endpoint has been removed. Admin authentication is handled by Clerk.',
      redirect: '/auth/login'
    },
    { status: 410 } // 410 Gone
  );
}
