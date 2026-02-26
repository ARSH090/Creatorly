import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { connectToDatabase } from '@/lib/db/mongodb';
import { User } from '@/lib/models/User';

export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { username, fullName, email, phone } = body as {
      username?: string;
      fullName?: string;
      email?: string;
      phone?: string;
    };

    if (!username || !fullName || !email || !phone) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    await connectToDatabase();

    const normalizedUsername = String(username).toLowerCase();
    const normalizedEmail = String(email).toLowerCase();

    const existingByUsername = await User.findOne({ username: normalizedUsername }).select('_id');
    if (existingByUsername) {
      return NextResponse.json({ error: 'Username already taken' }, { status: 409 });
    }

    const update = {
      clerkId: userId,
      username: normalizedUsername,
      displayName: fullName,
      email: normalizedEmail,
      phone: String(phone),
      emailVerified: true,
      onboardingComplete: false,
      onboardingStep: 1,
      subscriptionStatus: 'expired' as const,
    };

    await User.findOneAndUpdate(
      { $or: [{ clerkId: userId }, { email: normalizedEmail }] },
      { $set: update },
      { upsert: true, new: true }
    );

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('register-basic error:', error);
    return NextResponse.json(
      { error: 'Failed to finalize registration', details: error?.message },
      { status: 500 }
    );
  }
}

