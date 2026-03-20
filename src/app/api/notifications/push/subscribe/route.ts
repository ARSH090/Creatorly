import { NextRequest, NextResponse } from 'next/server';
import { withCreatorAuth } from '@/lib/auth/withAuth';
import { withErrorHandler } from '@/lib/utils/errorHandler';
import User from '@/lib/models/User';
import { connectToDatabase } from '@/lib/db/mongodb';

async function handler(req: NextRequest, user: any) {
    await connectToDatabase();
    const subscription = await req.json();

    await User.findByIdAndUpdate(user._id, {
        $set: { pushSubscription: subscription },
    });

    return { success: true };
}

export const POST = withCreatorAuth(withErrorHandler(handler));
