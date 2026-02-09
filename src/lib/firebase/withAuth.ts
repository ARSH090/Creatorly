import { NextRequest, NextResponse } from 'next/server';
import { verifyFirebaseToken } from './verifyToken';

/**
 * Higher-order function to protect API routes with Firebase authentication
 * @param handler The API route handler function
 * @returns Protected handler that requires valid Firebase token
 */
export function withAuth(
    handler: (req: NextRequest, user: any, context?: any) => Promise<Response>
) {
    return async (req: NextRequest, context?: any) => {
        const authHeader = req.headers.get('Authorization');

        if (!authHeader?.startsWith('Bearer ')) {
            return NextResponse.json(
                { error: 'Unauthorized - Missing or invalid Authorization header' },
                { status: 401 }
            );
        }

        const token = authHeader.split('Bearer ')[1];
        const auth = await verifyFirebaseToken(token);

        if (!auth) {
            return NextResponse.json(
                { error: 'Unauthorized - Invalid or expired token' },
                { status: 401 }
            );
        }

        // Pass MongoDB user to handler
        return handler(req, auth.mongoUser, context);
    };
}

/**
 * Admin-only route protection
 */
export function withAdminAuth(
    handler: (req: NextRequest, user: any, context?: any) => Promise<Response>
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
    handler: (req: NextRequest, user: any, context?: any) => Promise<Response>
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
