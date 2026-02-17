import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db/mongodb';
import User from '@/lib/models/User';
import crypto from 'crypto';
import admin from '@/lib/firebase-admin';
import { authLimiter, getClientIdentifier } from '@/lib/utils/rate-limit';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * POST /api/auth/verify-phone
 * Verifies Firebase Phone OTP token and registers phone_hash in DB
 */
export async function POST(req: NextRequest) {
    try {
        // Rate limiting: 10 per minute per IP
        const clientIp = getClientIdentifier(req);
        try {
            await authLimiter.check(10, clientIp);
        } catch {
            return NextResponse.json(
                { error: 'Too many verification attempts', code: 'RATE_LIMITED' },
                { status: 429 }
            );
        }

        await connectToDatabase();

        const { firebaseToken, phoneNumber } = await req.json();

        // Validation
        if (!firebaseToken) {
            return NextResponse.json(
                { error: 'Firebase token is required', code: 'MISSING_TOKEN' },
                { status: 400 }
            );
        }

        if (!phoneNumber) {
            return NextResponse.json(
                { error: 'Phone number is required', code: 'MISSING_PHONE' },
                { status: 400 }
            );
        }

        // Validate phone format (+91 for India)
        const phoneRegex = /^\+91[1-9]\d{9}$/;
        if (!phoneRegex.test(phoneNumber)) {
            return NextResponse.json(
                { error: 'Invalid phone number format. Use +91XXXXXXXXXX', code: 'INVALID_PHONE_FORMAT' },
                { status: 400 }
            );
        }

        // Verify Firebase token
        let decodedToken;
        try {
            decodedToken = await admin.auth().verifyIdToken(firebaseToken);
        } catch (error: any) {
            console.error('Firebase token verification failed:', error);
            return NextResponse.json(
                { error: 'Invalid or expired Firebase token', code: 'INVALID_TOKEN' },
                { status: 401 }
            );
        }

        // Verify phone number matches token
        if (decodedToken.phone_number !== phoneNumber) {
            return NextResponse.json(
                { error: 'Phone number mismatch', code: 'PHONE_MISMATCH' },
                { status: 400 }
            );
        }

        // Hash the phone number (SHA256)
        const phoneHash = crypto.createHash('sha256').update(phoneNumber).digest('hex');

        // Check if phone already registered
        const existingUser = await User.findOne({ phoneHash });
        if (existingUser) {
            return NextResponse.json(
                { error: 'This phone number is already registered', code: 'PHONE_EXISTS' },
                { status: 409 }
            );
        }

        // If this is part of registration, update user record
        // (Assuming user was created via Clerk first)
        const userId = decodedToken.uid; // or get from Clerk JWT

        // For now, just return success - actual user update happens in registration flow
        return NextResponse.json(
            {
                success: true,
                phoneVerified: true,
                phoneHash, // Return for registration flow to save
            },
            { status: 200 }
        );

    } catch (error: any) {
        console.error('Phone verification error:', error);
        return NextResponse.json(
            { error: 'Phone verification failed', code: 'VERIFICATION_ERROR' },
            { status: 500 }
        );
    }
}
