import { NextRequest, NextResponse } from 'next/server';
import { getAuth } from 'firebase-admin/auth';
import { initAdmin } from './admin';
import AdminLog from '@/lib/models/AdminLog';
import { connectToDatabase } from '@/lib/db/mongodb';

/**
 * Middleware to protect admin routes
 * Verifies Firebase token and checks for admin custom claim
 */
export async function withAdminAuth(
    handler: (req: NextRequest, user: any) => Promise<Response>
) {
    return async (req: NextRequest) => {
        try {
            // Get authorization header
            const authHeader = req.headers.get('authorization');

            if (!authHeader || !authHeader.startsWith('Bearer ')) {
                return NextResponse.json(
                    { success: false, error: 'Unauthorized - No token provided' },
                    { status: 401 }
                );
            }

            const token = authHeader.split('Bearer ')[1];

            // Initialize Firebase Admin
            initAdmin();
            const auth = getAuth();

            // Verify token
            const decodedToken = await auth.verifyIdToken(token);

            // Check if user has admin role
            if (!decodedToken.admin) {
                return NextResponse.json(
                    { success: false, error: 'Forbidden - Admin access required' },
                    { status: 403 }
                );
            }

            // Get user email
            const userEmail = decodedToken.email;

            // Attach admin info to request (for logging)
            const user = {
                uid: decodedToken.uid,
                email: userEmail,
                role: 'admin'
            };

            // Call the actual handler
            const response = await handler(req, user);

            return response;
        } catch (error: any) {
            console.error('Admin auth error:', error);

            if (error.code === 'auth/id-token-expired') {
                return NextResponse.json(
                    { success: false, error: 'Token expired' },
                    { status: 401 }
                );
            }

            return NextResponse.json(
                { success: false, error: 'Authentication failed' },
                { status: 401 }
            );
        }
    };
}

/**
 * Log admin action to database
 */
export async function logAdminAction(
    adminEmail: string,
    action: string,
    targetType: string,
    targetId?: string,
    changes?: any,
    req?: NextRequest
) {
    try {
        await connectToDatabase();

        const ipAddress = req?.headers.get('x-forwarded-for') ||
            req?.headers.get('x-real-ip') ||
            'unknown';
        const userAgent = req?.headers.get('user-agent') || 'unknown';

        await AdminLog.create({
            adminEmail,
            action,
            targetType,
            targetId,
            changes,
            ipAddress,
            userAgent,
            timestamp: new Date()
        });
    } catch (error) {
        console.error('Failed to log admin action:', error);
        // Don't throw - logging failure shouldn't break the main operation
    }
}
