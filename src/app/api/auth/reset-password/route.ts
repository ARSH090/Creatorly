import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db/mongodb';
import User from '@/lib/models/User';
import crypto from 'crypto';
import bcrypt from 'bcryptjs';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * POST /api/auth/reset-password
 * Resets password using valid token
 */
export async function POST(req: NextRequest) {
  try {
    await connectToDatabase();

    const { token, newPassword } = await req.json();

    if (!token || !newPassword) {
      return NextResponse.json(
        { error: 'Token and new password are required' },
        { status: 400 }
      );
    }

    // Validate password strength
    if (newPassword.length < 8) {
      return NextResponse.json(
        { error: 'Password must be at least 8 characters' },
        { status: 400 }
      );
    }

    // Hash the provided token to compare with stored hash
    const resetTokenHash = crypto.createHash('sha256').update(token).digest('hex');

    // Find user with matching token that hasn't expired
    const user = await User.findOne({
      passwordResetToken: resetTokenHash,
      passwordResetExpiry: { $gt: new Date() }, // Token not expired
    });

    if (!user) {
      return NextResponse.json(
        { error: 'Invalid or expired reset token' },
        { status: 400 }
      );
    }

    // Hash new password
    const passwordHash = await bcrypt.hash(newPassword, 12);

    // Update password and clear reset token (single-use)
    await User.findByIdAndUpdate(user._id, {
      password: passwordHash,
      passwordResetToken: null,
      passwordResetExpiry: null,
      $push: {
        passwordChangeHistory: {
          changedAt: new Date(),
          resetViaEmail: true,
        },
      },
    });

    return NextResponse.json(
      { success: true, message: 'Password reset successfully' },
      { status: 200 }
    );

  } catch (error: any) {
    console.error('Reset password error:', error);
    return NextResponse.json(
      { error: 'Failed to reset password' },
      { status: 500 }
    );
  }
}
