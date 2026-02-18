import { NextRequest } from 'next/server';
import { getMongoUser } from '@/lib/auth/get-user';
import { withAuth } from '@/lib/auth/withAuth';
import { withErrorHandler } from '@/lib/utils/errorHandler';

/**
 * GET /api/auth/me
 * Returns the current Mongoose user details
 */
async function handler(req: NextRequest, user: any) {
    return { user };
}

export const GET = withAuth(withErrorHandler(handler));
