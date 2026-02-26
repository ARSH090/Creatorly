import { NextRequest, NextResponse } from 'next/server';
import { currentUser } from '@clerk/nextjs/server';
import { connectToDatabase } from '@/lib/db/mongodb';
import { User } from '@/lib/models/User';

export async function POST(req: NextRequest) {
    try {
        const testSecret = process.env.TEST_SECRET;
        const incomingSecret = req.headers.get('x-test-secret');
        const isTestBypass = testSecret && incomingSecret === testSecret;

        let clerkUser: any;
        if (isTestBypass) {
            clerkUser = {
                id: 'user_test_123',
                emailAddresses: [{ emailAddress: 'test@creatorly.in' }],
                username: 'testcreator',
                firstName: 'Test',
                lastName: 'Creator',
                imageUrl: 'https://example.com/avatar.png',
                unsafeMetadata: { username: 'testcreator' },
                publicMetadata: { role: 'creator' }
            };
        } else {
            clerkUser = await currentUser();
        }

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

        // Fallback username and display name
        const emailPrefix = email.split('@')[0].toLowerCase().replace(/[^a-z0-9_-]/g, '');
        const fallbackDisplayName = clerkUser.username || emailPrefix;

        const userUpdate: any = {
            clerkId: clerkUser.id,
            email: email.toLowerCase(),
            displayName: (clerkUser.firstName || clerkUser.lastName)
                ? `${clerkUser.firstName || ''} ${clerkUser.lastName || ''}`.trim()
                : user?.displayName || fallbackDisplayName,
            username: (unsafeMetadata.username || clerkUser.username || user?.username || emailPrefix).toLowerCase().replace(/[^a-z0-9_-]/g, ''),
            avatar: clerkUser.imageUrl,
            role: publicMetadata.role || user?.role || 'user', // Default to 'user' for safety
            emailVerified: true
        };

        if (user) {
            // Update/Link existing user — never set firebaseUid to avoid E11000 on null
            await User.findByIdAndUpdate(user._id, {
                $set: userUpdate,
                $unset: { firebaseUid: 1 }
            });
            console.log(`✅ Synced existing MongoDB user: ${userUpdate.username} (${userUpdate.email})`);
        } else {
            // Double check username availability if it's new
            let finalUsername = userUpdate.username;
            const baseUsername = finalUsername;
            let counter = 1;

            while (await User.exists({ username: finalUsername })) {
                finalUsername = `${baseUsername}${counter}`;
                counter++;
            }

            // Use findOneAndUpdate with upsert to avoid E11000 duplicate key on firebaseUid: null.
            // Do not set firebaseUid so Clerk-only users don't hit the unique index.
            const doc = {
                clerkId: clerkUser.id,
                email: email.toLowerCase(),
                displayName: userUpdate.displayName,
                username: finalUsername,
                avatar: userUpdate.avatar,
                role: userUpdate.role,
                emailVerified: true,
                subscriptionTier: 'free',
                subscriptionStatus: 'active'
            };
            user = await User.findOneAndUpdate(
                { clerkId: clerkUser.id },
                { $set: doc },
                { upsert: true, new: true }
            );

            console.log(`✅ Created new MongoDB user via sync: ${finalUsername} (${userUpdate.email})`);
        }

        return NextResponse.json({ success: true, user: { id: user?._id, role: user?.role } });

    } catch (error: any) {
        console.error("❌ Sync Error Detailed:", {
            message: error.message,
            stack: error.stack,
            name: error.name,
            errors: error.errors // Mongoose validation errors
        });
        return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
    }
}
