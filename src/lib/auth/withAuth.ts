import { NextRequest, NextResponse } from 'next/server';
import { getMongoUser } from './get-user';

/**
 * Higher-order function to protect API routes with Clerk authentication
 * Syncs user to MongoDB if needed.
 */
export function withAuth(
    handler: (...args: any[]) => Promise<Response>
) {
    return async (req: NextRequest, context?: any) => {
        try {
            const user = await getMongoUser();

            if (!user) {
                return NextResponse.json(
                    { error: 'Unauthorized - Login required' },
                    { status: 401 }
                );
            }

            // Pass MongoDB user to handler
            return handler(req, user, context);
        } catch (error) {
            console.error("Auth middleware error:", error);
            return NextResponse.json(
                { error: 'Internal Server Error' },
                { status: 500 }
            );
        }
    };
}

/**
 * Admin-only route protection
 */
export function withAdminAuth(
    handler: (...args: any[]) => Promise<Response>
) {
    return withAuth(async (req, user, context) => {
        if (user.role !== 'admin' && user.role !== 'super-admin') {
            return NextResponse.json(
                { error: 'Forbidden - Admin access required' },
                { status: 403 }
            );
        }
        return handler(req, user, context);
    });
}

/**
 * Creator-only route protection
 */
export function withCreatorAuth(
    handler: (...args: any[]) => Promise<Response>
) {
    return withAuth(async (req, user, context) => {
        if (user.role !== 'creator' && user.role !== 'admin' && user.role !== 'super-admin') {
            return NextResponse.json(
                { error: 'Forbidden - Creator access required' },
                { status: 403 }
            );
        }
        return handler(req, user, context);
    });
}
