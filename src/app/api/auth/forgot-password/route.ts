import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db/mongodb';
import User from '@/lib/models/User';
import VerificationToken from '@/lib/models/VerificationToken';
import { sendPasswordResetEmail } from '@/lib/services/email';
import { z } from 'zod';
import crypto from 'crypto';
import { RedisRateLimiter } from '@/lib/security/redis-rate-limiter';


const forgotPasswordSchema = z.object({
  email: z.string().email('Invalid email address'),
});

export async function POST(request: NextRequest) {
  try {
    const forwarded = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || '';
    const ip = forwarded ? forwarded.split(',')[0].trim() : '127.0.0.1';

    // 1. Rate Limiting (3 attempts per hour to prevent email spam/enumeration)
    const isAllowed = await RedisRateLimiter.check('forgot-password', 3, 60 * 60 * 1000, ip);
    if (!isAllowed) {
      return NextResponse.json({ error: 'Too many requests. Please try again later.' }, { status: 429 });
    }

    const body = await request.json();

    const validation = forgotPasswordSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json({ error: 'Validation failed', details: validation.error.flatten().fieldErrors }, { status: 400 });
    }

    await connectToDatabase();

    // Find user by email
    const user = await User.findOne({ email: validation.data.email.toLowerCase() });

    if (!user) {
      // Don't reveal if email exists
      return NextResponse.json({
        message: 'If an account exists with this email, a password reset link has been sent.',
      });
    }

    // Delete any existing reset tokens for this user
    await VerificationToken.deleteMany({
      email: user.email,
      type: 'password_reset',
    });

    // Generate reset token
    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    // Save token
    await VerificationToken.create({
      email: user.email,
      token,
      type: 'password_reset',
      expiresAt,
    });

    // Send email
    await sendPasswordResetEmail(user.email, token);

    return NextResponse.json({
      message: 'If an account exists with this email, a password reset link has been sent.',
    });
  } catch (error) {
    console.error('Forgot password error:', error);
    return NextResponse.json(
      { error: 'Failed to process password reset request' },
      { status: 500 }
    );
  }
}
