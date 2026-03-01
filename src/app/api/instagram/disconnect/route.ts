import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { connectToDatabase as dbConnect } from '@/lib/db/mongodb';
import { User } from '@/lib/models/User';

export async function POST(req: NextRequest) {
    const { userId } = await auth();
    if (!userId) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        await dbConnect();

        await User.findOneAndUpdate(
            { clerkId: userId },
            {
                $set: {
                    'instagramConnection.isConnected': false,
                },
                $unset: {
                    'instagramConnection.instagramUserId': '',
                    'instagramConnection.username': '',
                    'instagramConnection.accessToken': '',
                    'instagramConnection.tokenExpiresAt': '',
                    'instagramConnection.connectedAt': '',
                    'instagramConnection.profilePicUrl': '',
                }
            }
        );

        return NextResponse.json({ success: true, message: 'Instagram disconnected successfully' });
    } catch (error) {
        console.error('Error disconnecting Instagram:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

