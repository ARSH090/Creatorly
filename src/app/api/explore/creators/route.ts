import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db/mongodb';
import CreatorProfile from '@/lib/models/CreatorProfile';
import User from '@/lib/models/User';
import { cachedQuery } from '@/lib/cache/redis';

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        await connectToDatabase();
        const profiles = await cachedQuery(
            'explore:creators',
            async () => {
                const list = await CreatorProfile.find({})
                    .sort({ updatedAt: -1 })
                    .limit(12)
                    .lean();
                return list;
            },
            300,
            ['explore']
        );

        // 2. Map to display data (Fetch User info for avatar/displayName)
        const creators = await Promise.all(profiles.map(async (profile: any) => {
            const user = await User.findById(profile.creatorId).select('displayName avatar username').lean();
            if (!user) return null;

            return {
                username: user.username,
                displayName: user.displayName,
                avatar: (user as any).avatar,
                description: profile.description,
            };
        }));

        return NextResponse.json({
            creators: creators.filter(Boolean)
        });

    } catch (error: any) {
        console.error('Explore API Error:', error);
        return NextResponse.json({ error: 'Failed to fetch creators' }, { status: 500 });
    }
}
