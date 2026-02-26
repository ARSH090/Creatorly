import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db/mongodb';
import { SocialAccount } from '@/lib/models/SocialAccount';
import { withCreatorAuth } from '@/lib/auth/withAuth';

async function handler(req: NextRequest, user: any) {
    try {
        await connectToDatabase();

        const igAccount = await SocialAccount.findOne({
            userId: user._id,
            platform: 'instagram',
            isActive: true
        });

        return NextResponse.json({
            instagram: {
                connected: !!igAccount,
                handle: igAccount?.metadata?.username || null, // Assuming username might be in metadata or we'll need to fetch it
                status: igAccount?.tokenStatus || 'disconnected'
            }
        });
    } catch (error) {
        console.error('Failed to fetch social status:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

export const GET = withCreatorAuth(handler);
