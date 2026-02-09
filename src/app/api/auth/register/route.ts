import { connectToDatabase } from '@/lib/db/mongodb';
import User from '@/lib/models/User';
import bcrypt from 'bcryptjs';
import { NextResponse } from 'next/server';

import { UserRegistrationSchema } from '@/lib/validations';
import { RedisRateLimiter } from '@/lib/security/redis-rate-limiter';
import { checkDeviceAbuse, registerDevice } from '@/lib/security/abuse-detection';

export async function POST(req: Request) {
    try {
        const forwarded = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || '';
        const ip = forwarded ? forwarded.split(',')[0].trim() : '127.0.0.1';
        const userAgent = req.headers.get('user-agent') || 'Unknown';

        // 1. Rate Limiting
        const isAllowed = await RedisRateLimiter.check('register', 5, 60 * 60 * 1000, ip); // 5 attempts per hour

        if (!isAllowed) {
            return NextResponse.json(
                { error: 'Too many registration attempts. Please try again later.' },
                { status: 429 }
            );
        }

        // 2. Parse and validate request body
        const body = await req.json();

        // Auto-generate temporary username if not provided
        if (!body.username) {
            const tempId = Math.random().toString(36).substring(2, 7);
            body.username = `user_${tempId}`;
        }

        const validation = UserRegistrationSchema.safeParse(body);

        if (!validation.success) {
            const fieldErrors = validation.error.flatten().fieldErrors;
            const errorMessage = Object.values(fieldErrors)[0]?.[0] || 'Validation failed';
            return NextResponse.json({
                error: errorMessage,
                details: fieldErrors
            }, { status: 400 });
        }

        const { email, password, username, displayName, fingerprint } = validation.data;

        // 3. Security & Abuse Check (Fingerprinting)
        // If fingerprint is provided, check for abuse. 
        // Note: We prioritize blocking abuse over allowing signup if fingerprint is missing in a high-security context.
        if (fingerprint) {
            const abuseCheck = await checkDeviceAbuse(fingerprint, ip, userAgent, 'free'); // Defaulting to free plan for now
            if (abuseCheck.blocked) {
                return NextResponse.json(
                    { error: abuseCheck.reason || 'Registration blocked due to suspicious activity.' },
                    { status: 403 }
                );
            }
        }

        await connectToDatabase();

        // 4. Check if user already exists
        const existingUser = await User.findOne({
            $or: [{ email: email.toLowerCase() }, { username: username.toLowerCase() }]
        });

        if (existingUser) {
            if (existingUser.email === email.toLowerCase()) {
                return NextResponse.json(
                    { error: 'This email is already registered. Please log in or use a different email.' },
                    { status: 400 }
                );
            } else {
                return NextResponse.json(
                    { error: 'This username is already taken. Please choose a different one.' },
                    { status: 400 }
                );
            }
        }

        // 5. Hash password
        const hashedPassword = await bcrypt.hash(password, 12);

        // 6. Create user
        const user = await User.create({
            email: email.toLowerCase(),
            password: hashedPassword,
            username: username.toLowerCase(),
            displayName,
            // Initialize with default plan limits (Free Tier)
            planLimits: {
                maxProducts: 3,
                maxStorageMb: 100,
                maxTeamMembers: 1,
                customDomain: false,
                canRemoveBranding: false
            }
        });

        // 7. Register Device (if fingerprint provided)
        if (fingerprint) {
            try {
                await registerDevice(fingerprint, user._id.toString(), ip, userAgent, 'free');
            } catch (deviceError) {
                console.error('Failed to register device:', deviceError);
                // Non-blocking error, user is created
            }
        }

        return NextResponse.json({
            success: true,
            message: 'User created successfully',
            user: {
                id: user._id,
                email: user.email,
                username: user.username,
                displayName: user.displayName
            }
        }, { status: 201 });

    } catch (error: any) {
        console.error('Registration API error:', error);

        // Handle MongoDB duplicate key errors
        if (error.code === 11000) {
            const field = Object.keys(error.keyPattern)[0];
            return NextResponse.json(
                { error: `This ${field} is already registered. Please try a different one.` },
                { status: 400 }
            );
        }

        return NextResponse.json({
            error: 'Failed to create account. Please try again.',
            details: error?.message || error
        }, { status: 500 });
    }
}
