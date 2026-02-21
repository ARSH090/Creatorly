import { NextRequest, NextResponse } from 'next/server';
import { currentUser } from '@clerk/nextjs/server';
import { connectToDatabase } from '@/lib/db/mongodb';
import { User } from '@/lib/models/User';

export async function POST() {
    try {
        const clerkUser = await currentUser();
        if (!clerkUser) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        await connectToDatabase();

        const email = clerkUser.emailAddresses[0]?.emailAddress;
        if (!email) {
            return NextResponse.json({ error: 'No email found' }, { status: 400 });
        }

        // Check if user exists by clerkId or email
        let user = await User.findOne({
            $or: [
                { clerkId: clerkUser.id },
                { email: email }
            ]
        });

        // Get metadata for custom values
        const unsafeMetadata = (clerkUser.unsafeMetadata as any) || {};
        const publicMetadata = (clerkUser.publicMetadata as any) || {};

        const userUpdate = {
            clerkId: clerkUser.id,
            email: email,
            displayName: `${clerkUser.firstName || ''} ${clerkUser.lastName || ''}`.trim() || user?.displayName || email.split('@')[0],
            username: unsafeMetadata.username || clerkUser.username || user?.username || email.split('@')[0],
            avatar: clerkUser.imageUrl,
            role: publicMetadata.role || user?.role || 'creator',
            emailVerified: true
        };

        if (user) {
            // Update/Link existing user
            await User.findByIdAndUpdate(user._id, { $set: userUpdate });
            console.log(`✅ Synced existing MongoDB user: ${user.username} (${email})`);
        } else {
            // Double check username availability if it's new
            let finalUsername = userUpdate.username.toLowerCase().replace(/[^a-z0-9_-]/g, '');
            let baseUsername = finalUsername;
            let counter = 1;

            while (await User.exists({ username: finalUsername })) {
                finalUsername = `${baseUsername}${counter}`;
                counter++;
            }

            user = await User.create({
                ...userUpdate,
                username: finalUsername,
                subscriptionTier: 'free',
            });

            console.log(`✅ Created new MongoDB user via sync: ${finalUsername} (${email})`);
        }

        return NextResponse.json({ success: true, user: { id: user._id, role: user.role } });

    } catch (error: any) {
        // Handle duplicate username error specially if possible, or generic
        console.error("Sync Error:", error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
