import { currentUser, auth } from "@clerk/nextjs/server";
import { connectToDatabase } from "@/lib/db/mongodb";
import User, { IUser } from "@/lib/models/User";
import { cache } from 'react';
import { headers } from 'next/headers';

/**
 * Optimized user fetcher with request-level caching.
 * Prevents multiple MongoDB lookups in the same request.
 */
export const getMongoUser = cache(async (): Promise<IUser | null> => {
    try {
        // ── Bypass for Testing ──
        const testSecret = process.env.TEST_SECRET;
        const headerList = await headers();
        const incomingSecret = headerList.get('x-test-secret');
        const incomingEmail = headerList.get('x-test-email');

        if (testSecret && incomingSecret === testSecret && process.env.NODE_ENV !== 'production') {
            await connectToDatabase();
            if (incomingEmail) {
                const testUser = await User.findOne({ email: incomingEmail });
                if (testUser) return testUser;
            }
        }

        const { userId } = await auth();
        if (!userId) return null;

        await connectToDatabase();

        // 1. Try to find by clerkId
        let user = await User.findOne({ clerkId: userId });

        if (user) return user;

        // 2. If not found, try to find by email (for migration or race conditions)
        const clerkUser = await currentUser();
        if (!clerkUser) return null;

        const email = clerkUser.emailAddresses[0]?.emailAddress;
        if (!email) return null;

        user = await User.findOne({ email });

        // 3. If found by email, link clerkId and sync handle if missing
        if (user) {
            const unsafeMetadata = clerkUser.unsafeMetadata as Record<string, any>;
            user.clerkId = userId;
            if (!user.username && unsafeMetadata?.username) {
                user.username = unsafeMetadata.username as string;
            }
            await user.save();
            return user;
        }

        return null;
    } catch (error) {
        console.error("Error fetching MongoDB user:", error);
        return null;
    }
});
