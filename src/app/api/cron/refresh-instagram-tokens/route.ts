import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase as dbConnect } from '@/lib/db/mongodb';
import { User, IUser } from '@/lib/models/User';
import { decryptStringToken, encryptToken } from '@/lib/security/encryption';

export async function GET(req: NextRequest) {
    const authHeader = req.headers.get('authorization');
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
        return new NextResponse('Unauthorized', { status: 401 });
    }

    try {
        await dbConnect();
        const tenDaysFromNow = new Date(Date.now() + 10 * 24 * 60 * 60 * 1000);

        const creatorsToRefresh = await User.find({
            'instagramConnection.isConnected': true,
            'instagramConnection.tokenExpiresAt': { $lt: tenDaysFromNow }
        }).select('instagramConnection');

        let refreshed = 0;
        let failed = 0;

        for (const creator of creatorsToRefresh) {
            try {
                if (!creator.instagramConnection?.accessToken) continue;

                const currentToken = decryptStringToken(creator.instagramConnection.accessToken);

                const res = await fetch(
                    `https://graph.instagram.com/refresh_access_token?grant_type=ig_refresh_token&access_token=${currentToken}`
                );

                if (!res.ok) {
                    console.error('Failed to refresh token for creator:', creator._id);
                    failed++;
                    continue;
                }

                const { access_token: newToken, expires_in } = await res.json();

                await User.findByIdAndUpdate(creator._id, {
                    'instagramConnection.accessToken': encryptToken(newToken),
                    'instagramConnection.tokenExpiresAt': new Date(Date.now() + expires_in * 1000)
                });
                refreshed++;
            } catch {
                failed++;
            }
        }

        return NextResponse.json({ refreshed, failed });

    } catch (err: any) {
        console.error('Refresh tokens cron GET Error:', err);
        return new NextResponse('Internal server error', { status: 500 });
    }
}

