import { currentUser, auth } from "@clerk/nextjs/server";
import { connectToDatabase } from "@/lib/db/mongodb";
import User, { IUser } from "@/lib/models/User";

export async function getMongoUser(): Promise<IUser | null> {
    try {
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
            const unsafeMetadata = (clerkUser.unsafeMetadata as any) || {};
            user.clerkId = userId;
            if (!user.username && unsafeMetadata.username) {
                user.username = unsafeMetadata.username;
            }
            await user.save();
            return user;
        }

        return null;
    } catch (error) {
        console.error("Error fetching MongoDB user:", error);
        return null;
    }
}
