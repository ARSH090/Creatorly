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

        // Check if user exists
        let user = await User.findOne({
            $or: [
                { clerkId: clerkUser.id },
                { email: email }
            ]
        });

        if (!user) {
            // Generate base username
            let baseUsername = (clerkUser.username || email.split('@')[0]).toLowerCase().replace(/[^a-z0-9]/g, '');
            let username = baseUsername;

            // Simple retry logic for unique username
            let counter = 1;
            while (await User.exists({ username })) {
                username = `${baseUsername}${counter}`;
                counter++;
            }

            user = await User.create({
                clerkId: clerkUser.id,
                email: email,
                username: username,
                displayName: `${clerkUser.firstName || ''} ${clerkUser.lastName || ''}`.trim() || baseUsername,
                avatar: clerkUser.imageUrl,
                role: 'user',
                emailVerified: true
            });

            console.log(`✅ Created new MongoDB user: ${username} (${email})`);
        } else if (!user.clerkId) {
            // Link existing user
            user.clerkId = clerkUser.id;
            await user.save();
            console.log(`🔗 Linked Clerk ID to existing MongoDB user: ${email}`);
        }

        return NextResponse.json({ success: true, user: { id: user._id, role: user.role } });

    } catch (error: any) {
        // Handle duplicate username error specially if possible, or generic
        console.error("Sync Error:", error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
