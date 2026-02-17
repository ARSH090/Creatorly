import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db/mongodb';
import CreatorProfile from '@/lib/models/CreatorProfile';
import { withAuth } from '@/lib/auth/withAuth';

export const dynamic = 'force-dynamic';

// GET Availability Config (Creator only)
export const GET = withAuth(async (req, user) => {
    try {
        await connectToDatabase();
        const profile = await CreatorProfile.findOne({ creatorId: user._id });

        if (!profile) {
            return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
        }

        return NextResponse.json({ availability: profile.availability });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
});

// PATCH Availability Config (Creator only)
export const PATCH = withAuth(async (req, user) => {
    try {
        await connectToDatabase();
        const body = await req.json();
        const { availability } = body;

        const profile = await CreatorProfile.findOneAndUpdate(
            { creatorId: user._id },
            { $set: { availability } },
            { new: true, runValidators: true }
        );

        if (!profile) {
            return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
        }

        return NextResponse.json({ success: true, availability: profile.availability });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
});
