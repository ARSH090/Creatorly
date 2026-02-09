import { connectToDatabase } from '@/lib/db/mongodb';
import User from '@/lib/models/User';
import { NextResponse } from 'next/server';
import { withAuth } from '@/lib/firebase/withAuth';

export const POST = withAuth(async (req, user) => {
    try {
        const { username } = await req.json();

        if (!username || username.length < 3) {
            return NextResponse.json({ error: 'Username too short' }, { status: 400 });
        }

        if (!/^[a-z0-9_-]+$/.test(username)) {
            return NextResponse.json({ error: 'Invalid characters' }, { status: 400 });
        }

        await connectToDatabase();

        // Check availability
        const existing = await User.findOne({ username: username.toLowerCase() });
        if (existing) {
            return NextResponse.json({ error: 'Username already taken' }, { status: 400 });
        }

        // Update user
        const updatedUser = await User.findOneAndUpdate(
            { _id: user._id },
            { username: username.toLowerCase() },
            { new: true }
        );

        if (!updatedUser) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        return NextResponse.json({
            success: true,
            username: updatedUser.username
        });

    } catch (error: any) {
        console.error('Update Username API error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
});
