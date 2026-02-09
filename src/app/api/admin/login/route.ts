import { NextRequest, NextResponse } from 'next/server';
export const dynamic = 'force-dynamic';
import * as crypto from 'crypto';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import User from '@/lib/models/User';
import { connectToDatabase } from '@/lib/db/mongodb';
import { getClientIp, getClientUserAgent, logAdminAction } from '@/lib/admin/authMiddleware';

const loginSchema = z.object({
  email: z.string().email().toLowerCase(),
  password: z.string().min(6),
  totpToken: z.string().optional(),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const validation = loginSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json({ error: 'Invalid input' }, { status: 400 });
    }

    const { email, password, totpToken } = validation.data;
    const clientIp = getClientIp(req);
    const userAgent = getClientUserAgent(req);

    await connectToDatabase();

    const user = await User.findOne({ email, role: { $in: ['admin', 'super-admin'] } });

    if (!user) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    }

    // Check if account is suspended
    if (user.isSuspended) {
      await logAdminAction(
        user._id.toString(),
        email,
        'VIEW',
        'USER',
        user._id.toString(),
        email,
        'Attempted login to suspended admin account'
      );

      return NextResponse.json(
        {
          error: `Account suspended. Reason: ${user.suspensionReason || 'Not specified'}`,
        },
        { status: 403 }
      );
    }

    // Verify password
    const passwordValid = await bcrypt.compare(password, user.password || '');

    if (!passwordValid) {
      // Increment failed attempts
      user.failedLoginAttempts = (user.failedLoginAttempts || 0) + 1;
      user.lastFailedLoginAt = new Date();

      await user.save();

      // Lock account after 5 failed attempts
      if (user.failedLoginAttempts >= 5) {
        user.isSuspended = true;
        user.suspensionReason = 'Too many failed login attempts';
        user.suspendedAt = new Date();
        await user.save();

        return NextResponse.json(
          { error: 'Account locked due to too many failed login attempts' },
          { status: 403 }
        );
      }

      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    }

    // If 2FA is required and enabled, return 2FA challenge
    if (user.twoFactorEnabled && user.twoFactorSecret) {
      if (!totpToken) {
        return NextResponse.json(
          {
            message: '2FA required',
            requires2FA: true,
            sessionId: user._id.toString(),
          },
          { status: 200 }
        );
      }

      // Verify TOTP token
      const speakeasy = require('speakeasy');
      const verified = speakeasy.totp.verify({
        secret: user.twoFactorSecret,
        encoding: 'base32',
        token: totpToken,
      });

      if (!verified) {
        user.failedLoginAttempts = (user.failedLoginAttempts || 0) + 1;
        await user.save();
        return NextResponse.json({ error: 'Invalid 2FA token' }, { status: 401 });
      }
    }

    // Successful login
    user.lastLogin = new Date();
    user.lastLoginIp = clientIp;
    user.failedLoginAttempts = 0;
    user.loginHistory = user.loginHistory || [];
    user.loginHistory.push({
      ip: clientIp,
      userAgent,
      timestamp: new Date(),
      successful: true,
    });

    // Keep only last 20 login attempts
    if (user.loginHistory.length > 20) {
      user.loginHistory = user.loginHistory.slice(-20);
    }

    await user.save();

    await logAdminAction(
      user._id.toString(),
      email,
      'VIEW',
      'USER',
      user._id.toString(),
      email,
      `Admin login from IP: ${clientIp}`,
      undefined,
      clientIp,
      userAgent
    );

    // Return pseudo-signed token for admin session
    // In production, use a proper JWT library with a secure HS256 secret
    const payload = JSON.stringify({
      id: user._id,
      email: user.email,
      role: user.role,
      permissions: user.permissions,
      iat: Date.now(),
    });

    const signature = crypto.createHmac('sha256', process.env.JWT_SECRET || 'fallback-secret')
      .update(payload)
      .digest('hex');

    const token = `${Buffer.from(payload).toString('base64')}.${signature}`;

    const response = NextResponse.json({
      message: 'Login successful',
      token,
      user: {
        id: user._id,
        email: user.email,
        displayName: user.displayName,
        role: user.role,
        permissions: user.permissions,
      },
    });

    // Set secure cookie for session
    response.cookies.set('admin-token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7200, // 2 hours
    });

    return response;
  } catch (error) {
    console.error('Admin login error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
