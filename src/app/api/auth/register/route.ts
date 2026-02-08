import { connectToDatabase } from '@/lib/db/mongodb';
import User from '@/lib/models/User';
import bcrypt from 'bcryptjs';
import { NextResponse } from 'next/server';

import { UserRegistrationSchema } from '@/lib/validations';
import { RateLimiter } from '@/lib/security/rate-limiter';

export async function POST(req: Request) {
    try {
        const ip = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || '127.0.0.1';
        const isAllowed = await RateLimiter.check('register', 5, 60 * 60 * 1000, ip); // 5 attempts per hour

        if (!isAllowed) {
            return NextResponse.json(
                { error: 'Too many registration attempts. Please try again later.' },
                { status: 429 }
            );
        }

        const body = await req.json();

        // Validate required fields
        if (!body.email || !body.password || !body.username || !body.displayName) {
            return NextResponse.json({
                error: 'Missing required fields',
            }, { status: 400 });
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

        const { email, password, username, displayName } = validation.data;

        await connectToDatabase();

        // Check if user already exists
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

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 12);

        // Create user
        const user = await User.create({
            email: email.toLowerCase(),
            password: hashedPassword,
            username: username.toLowerCase(),
            displayName,
        });

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
