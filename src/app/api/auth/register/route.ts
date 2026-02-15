import { connectToDatabase } from '@/lib/db/mongodb';
import User from '@/lib/models/User';
import { NextResponse } from 'next/server';
import { verifyFirebaseToken } from '@/lib/firebase/verifyToken';
import { RedisRateLimiter } from '@/lib/security/redis-rate-limiter';
import { checkDeviceAbuse, registerDevice } from '@/lib/security/abuse-detection';
import { successResponse, errorResponse } from '@/types/api';
import { z } from 'zod';

const registerSchema = z.object({
    idToken: z.string().min(1),
    displayName: z.string().min(2).max(100),
    fingerprint: z.string().optional(),
    username: z.string().optional(), // Optional, generated if missing
});

export async function POST(req: Request) {
    try {
        const forwarded = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || '';
        const ip = forwarded ? forwarded.split(',')[0].trim() : '127.0.0.1';
        const userAgent = req.headers.get('user-agent') || 'Unknown';

        // 1. Rate Limiting
        const isAllowed = await RedisRateLimiter.check('register', 10, 60 * 60 * 1000, ip);

        if (!isAllowed) {
            return NextResponse.json(
                errorResponse('Too many registration attempts. Please try again later.'),
                { status: 429 }
            );
        }

        // 2. Parse and validate request body
        const body = await req.json();
        const validation = registerSchema.safeParse(body);

        if (!validation.success) {
            return NextResponse.json(
                errorResponse('Validation error', validation.error.flatten().fieldErrors),
                { status: 400 }
            );
        }

        const { idToken, displayName, fingerprint, username } = validation.data;

        // 3. Address Abuse Check
        if (fingerprint) {
            const abuseCheck = await checkDeviceAbuse(fingerprint, ip, userAgent, 'free');
            if (abuseCheck.blocked) {
                return NextResponse.json(
                    errorResponse(abuseCheck.reason || 'Registration blocked due to suspicious activity.'),
                    { status: 403 }
                );
            }
        }

        // 4. Verify Firebase Token
        const auth = await verifyFirebaseToken(idToken);
        if (!auth) {
            return NextResponse.json(
                errorResponse('Invalid or expired token'),
                { status: 401 }
            );
        }

        const { uid: firebaseUid, email, picture: avatar } = auth.decodedToken;

        await connectToDatabase();

        // 5. Check if user already exists
        let user = await User.findOne({ firebaseUid });

        if (user) {
            return NextResponse.json(
                errorResponse('User already exists'),
                { status: 409 }
            );
        }

        // 6. Generate Username if not provided
        const finalUsername = username || `user_${Math.random().toString(36).substring(2, 7)}`;

        // Check username uniqueness
        const existingUsername = await User.findOne({ username: finalUsername });
        if (existingUsername) {
            return NextResponse.json(
                errorResponse('Username already taken'),
                { status: 409 }
            );
        }

        // 7. Create User
        user = await User.create({
            firebaseUid,
            email,
            displayName,
            username: finalUsername,
            avatar: avatar || null,
            role: 'customer', // Default role
            planLimits: {
                maxProducts: 3,
                maxStorageMb: 100,
                maxTeamMembers: 1,
                customDomain: false,
                canRemoveBranding: false
            }
        });

        // 8. Register Device
        if (fingerprint) {
            try {
                await registerDevice(fingerprint, user._id.toString(), ip, userAgent, 'free');
            } catch (deviceError) {
                console.error('Failed to register device:', deviceError);
            }
        }

        return NextResponse.json(
            successResponse(user, 'User registered successfully'),
            { status: 201 }
        );

    } catch (error: any) {
        console.error('Registration API error:', error);
        return NextResponse.json(
            errorResponse('Internal server error', error.message),
            { status: 500 }
        );
    }
}
