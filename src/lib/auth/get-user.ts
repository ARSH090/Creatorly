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

        // 2. If not found, try to find by email (for migration)
        const clerkUser = await currentUser();
        if (!clerkUser) return null;

        const email = clerkUser.emailAddresses[0]?.emailAddress;
        if (!email) return null;

        user = await User.findOne({ email });

        // 3. If found by email, link clerkId
        if (user) {
            user.clerkId = userId;
            await user.save();
            return user;
        }

        return null;
    } catch (error) {
        console.error("Error fetching MongoDB user:", error);
        return null;
    }
}
