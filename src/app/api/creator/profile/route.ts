import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db/mongodb';
import CreatorProfile from '@/lib/models/CreatorProfile';
import { withAuth } from '@/lib/firebase/withAuth';

export const PATCH = withAuth(async (req, user) => {
    try {
        const data = await req.json();
        await connectToDatabase();

        const userId = user._id;

        // Security Check: Only allow if user has creator/admin role
        if (user.role !== 'creator' && user.role !== 'admin' && user.role !== 'super-admin') {
            return NextResponse.json({
                error: 'Forbidden',
                message: 'You must have a creator account to update this profile.'
            }, { status: 403 });
        }

        // Find or Create Profile
        let profile = await CreatorProfile.findOne({ userId });

        if (!profile) {
            profile = new CreatorProfile({
                userId,
                username: user.username || user.name?.toLowerCase().replace(/ /g, ''),
                displayName: user.name || '',
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
});

export const GET = withAuth(async (req, user) => {
    try {
        await connectToDatabase();
        const profile = await CreatorProfile.findOne({ userId: user._id });

        if (!profile) {
            return NextResponse.json({ message: 'Profile not found' }, { status: 404 });
        }

        return NextResponse.json(profile);
    } catch (error: any) {
        return NextResponse.json({ error: 'Failed to fetch profile' }, { status: 500 });
    }
});
