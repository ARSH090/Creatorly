import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db/mongodb';
import User from '@/lib/models/User';
import crypto from 'crypto';
import { sendPasswordResetEmail } from '@/lib/services/email';
import { passwordResetLimiter, getClientIdentifier } from '@/lib/utils/rate-limit';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * POST /api/auth/forgot-password
 * Generates password reset token and sends email
 * Rate limited: 3 requests per minute per IP
 */
export async function POST(req: NextRequest) {
  // Rate limiting
  const clientIp = getClientIdentifier(req);
  try {
    await passwordResetLimiter.check(clientIp);
  } catch {
    return NextResponse.json(
      { error: 'Too many password reset requests', code: 'RATE_LIMITED' },
      { status: 429 }
    );
  }

  try {
    await connectToDatabase();

    const { email } = await req.json();

    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      );
    }

    // Find user by email
    const user = await User.findOne({ email: email.toLowerCase().trim() });

    // Always return success to prevent email enumeration
    // Even if user doesn't exist, return 200
    if (!user) {
      return NextResponse.json(
        { success: true, message: 'If that email exists, a reset link has been sent.' },
        { status: 200 }
      );
    }

    // Generate secure random token
    const resetToken = crypto.randomUUID();
    const resetTokenHash = crypto.createHash('sha256').update(resetToken).digest('hex');

    // Set token expiry to 30 minutes
    const resetTokenExpiry = new Date(Date.now() + 30 * 60 * 1000);

    // Save hashed token to user document
    await User.findByIdAndUpdate(user._id, {
      passwordResetToken: resetTokenHash,
      passwordResetExpiry: resetTokenExpiry,
    });

    // Send email with reset link
    try {
      await sendPasswordResetEmail(user.email, resetToken);
    } catch (emailError: any) {
      console.error('Failed to send password reset email:', emailError);
      // Don't fail the request if email fails, token is still generated
    }

    return NextResponse.json(
      { success: true, message: 'If that email exists, a reset link has been sent.' },
      { status: 200 }
    );

  } catch (error: any) {
    console.error('Forgot password error:', error);
    return NextResponse.json(
      { error: 'Failed to process request' },
      { status: 500 }
    );
  }
}
