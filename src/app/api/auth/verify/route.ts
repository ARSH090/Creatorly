import { NextRequest, NextResponse } from 'next/server';
import { verifyFirebaseToken } from '@/lib/firebase/verifyToken';
import { connectToDatabase } from '@/lib/db/mongodb';
import User from '@/lib/models/User';
import { successResponse, errorResponse } from '@/types/api';
import { RedisRateLimiter } from '@/lib/security/redis-rate-limiter';

export async function POST(request: NextRequest) {
    try {
        const forwarded = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || '';
        const ip = forwarded ? forwarded.split(',')[0].trim() : '127.0.0.1';

        // Rate limiting: 60 requests per minute (higher limit for verification as it happens often)
        const isAllowed = await RedisRateLimiter.check('verify_token', 60, 60 * 1000, ip);

        if (!isAllowed) {
            return NextResponse.json(
                errorResponse('Too many requests. Please try again later.'),
                { status: 429 }
            );
        }

        const { idToken } = await request.json();

        if (!idToken) {
            return NextResponse.json(
                errorResponse('No token provided'),
                { status: 400 }
            );
        }

        // Verify token
        const auth = await verifyFirebaseToken(idToken);

        if (!auth) {
            return NextResponse.json(
                errorResponse('Invalid token'),
                { status: 401 }
            );
        }

        const { uid: firebaseUid } = auth.decodedToken;

        // Connect to database
        await connectToDatabase();

        // Get user from database
        const user = await User.findOne({ firebaseUid });

        if (!user) {
            return NextResponse.json(
                errorResponse('User not found'),
                { status: 404 }
            );
        }

        return NextResponse.json(successResponse({
            id: user._id,
            email: user.email,
            displayName: user.displayName,
            username: user.username,
            role: user.role,
            avatar: user.avatar,
        }));

    } catch (error: any) {
        console.error('Token verification error:', error);
        return NextResponse.json(
            errorResponse('Internal server error', error.message),
            { status: 500 }
        );
    }
}
