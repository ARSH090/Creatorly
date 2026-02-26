import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db/mongodb';
import { SocialAccount } from '@/lib/models/SocialAccount';
import { withCreatorAuth } from '@/lib/auth/withAuth';

async function handler(req: NextRequest, user: any) {
    try {
        await connectToDatabase();

        await SocialAccount.findOneAndUpdate(
            { userId: user._id, platform: 'instagram' },
            { isActive: false }
        );

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Failed to disconnect Instagram:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

export const DELETE = withCreatorAuth(handler);
