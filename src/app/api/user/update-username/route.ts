import { connectToDatabase } from '@/lib/db/mongodb';
import User from '@/lib/models/User';
import { NextResponse } from 'next/server';
import { withAuth } from '@/lib/auth/withAuth';
import { revalidatePath } from 'next/cache';

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

        // Update user with both username and storeSlug (for custom domain reselling)
        const updatedUser = await User.findOneAndUpdate(
            { _id: user._id },
            { 
                username: username.toLowerCase(),
                storeSlug: username.toLowerCase() // Sync storeSlug with username
            },
            { new: true }
        );

        if (!updatedUser) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        // Sync with custom domains and Redis
        try {
            const { syncUsernameWithDomains } = await import('@/lib/services/domainService');
            await syncUsernameWithDomains(user._id, updatedUser.username, user.username);
        } catch (syncErr) {
            console.error('Failed to sync username with domains:', syncErr);
        }

        // Revalidate the old storefront path (if it was different)
        if (user.username) {
            try {
                revalidatePath(`/u/${user.username}`);
            } catch (err) {
                console.error('Failed to revalidate old storefront path:', err);
            }
        }

        // Revalidate the new storefront path
        try {
            revalidatePath(`/u/${updatedUser.username}`);
        } catch (err) {
            console.error('Failed to revalidate new storefront path:', err);
        }

        return NextResponse.json({
            success: true,
            username: updatedUser.username,
            storeSlug: updatedUser.storeSlug
        });

    } catch (error: any) {
        console.error('Update Username API error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
});
