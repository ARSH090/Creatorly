import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db/mongodb';
import CreatorProfile from '@/lib/models/CreatorProfile';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/authOptions';

export async function PATCH(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const data = await req.json();
        await connectToDatabase();

        const userId = (session.user as any).id;

        // Find or Create Profile
        let profile = await CreatorProfile.findOne({ userId });

        if (!profile) {
            profile = new CreatorProfile({
                userId,
                username: (session.user as any).username || session.user?.name?.toLowerCase().replace(/ /g, ''),
                displayName: session.user?.name || '',
            });
        }

        // Update Theme
        if (data.theme) {
            profile.theme = {
                ...profile.theme,
                ...data.theme,
                // Ensure default structure if missing
                fontFamily: data.theme.fontFamily || profile.theme?.fontFamily || 'Inter',
                primaryColor: data.theme.primaryColor || profile.theme?.primaryColor || '#6366f1',
                backgroundColor: data.theme.backgroundColor || profile.theme?.backgroundColor || '#030303',
            };
        }

        // Update Layout/Structure (If we add a field for it)
        // profile.layout = data.layout; 

        await profile.save();

        return NextResponse.json({
            success: true,
            profile
        });

    } catch (error: any) {
        console.error('Profile Update Error:', error);
        return NextResponse.json({
            error: 'Failed to update profile',
            details: error.message
        }, { status: 500 });
    }
}

export async function GET(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        await connectToDatabase();
        const profile = await CreatorProfile.findOne({ userId: (session.user as any).id });

        if (!profile) {
            return NextResponse.json({ message: 'Profile not found' }, { status: 404 });
        }

        return NextResponse.json(profile);
    } catch (error: any) {
        return NextResponse.json({ error: 'Failed to fetch profile' }, { status: 500 });
    }
}
