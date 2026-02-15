import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { RedisRateLimiter } from '@/lib/security/redis-rate-limiter';
import { verifyFirebaseToken } from '@/lib/firebase/verifyToken';
import { successResponse, errorResponse } from '@/types/api';

export async function POST(req: Request) {
    try {
        const forwarded = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || '';
        const ip = forwarded ? forwarded.split(',')[0].trim() : '127.0.0.1';

        // 1. Rate Limiting (20 attempts per minute to prevent session hammering)
        // Increased slightly as frontend might call this on load
        const isAllowed = await RedisRateLimiter.check('session', 20, 60 * 1000, ip);
        if (!isAllowed) {
            return NextResponse.json(
                errorResponse('Too many requests. Please try again later.'),
                { status: 429 }
            );
        }

        const body = await req.json().catch(() => ({}));
        const { action } = body;

        const cookieStore = await cookies();

        if (action === 'logout') {
            cookieStore.delete('authToken');
            return NextResponse.json(successResponse(null, 'Logged out successfully'));
        }

        const authHeader = req.headers.get('authorization');
        if (!authHeader?.startsWith('Bearer ')) {
            return NextResponse.json(
                errorResponse('Unauthorized - Missing or invalid Authorization header'),
                { status: 401 }
            );
        }

        const token = authHeader.replace('Bearer ', '');

        // Verify token and sync user to MongoDB
        const auth = await verifyFirebaseToken(token);

        if (!auth) {
            // If token is invalid, clear cookie
            cookieStore.delete('authToken');
            return NextResponse.json(
                errorResponse('Invalid or expired token'),
                { status: 401 }
            );
        }

        // Set secure cookie
        cookieStore.set('authToken', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            path: '/',
            maxAge: 60 * 60 * 24 * 5, // 5 days
        });

        return NextResponse.json(successResponse(auth.mongoUser, 'Session established'));

    } catch (error: any) {
        console.error('Session API error:', error);
        return NextResponse.json(
            errorResponse('Internal server error', error.message),
            { status: 500 }
        );
    }
}
