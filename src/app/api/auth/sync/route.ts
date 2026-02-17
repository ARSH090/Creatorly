import { auth, currentUser } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db/mongodb';
import User from '@/lib/models/User';
import { successResponse, errorResponse } from '@/types/api';

export async function POST() {
    try {
        const { userId } = await auth();
        const clerkUser = await currentUser();

        if (!userId || !clerkUser) {
            return NextResponse.json(errorResponse('Unauthorized'), { status: 401 });
        }

        await connectToDatabase();

        // Check if user exists
        let user = await User.findOne({
            $or: [
                { clerkId: userId },
                { email: clerkUser.emailAddresses[0].emailAddress }
            ]
        });

        if (!user) {
            // Create new user
            user = await User.create({
                clerkId: userId,
                email: clerkUser.emailAddresses[0].emailAddress,
                displayName: clerkUser.fullName || clerkUser.username || 'User',
                username: clerkUser.username || `user_${Math.random().toString(36).substring(2, 7)}`,
                avatar: clerkUser.imageUrl,
                role: 'customer', // Default
                planLimits: {
                    maxProducts: 3,
                    maxStorageMb: 100,
                    maxTeamMembers: 1,
                    customDomain: false,
                    canRemoveBranding: false
                }
            });
        } else if (!user.clerkId) {
            // Link existing user
            user.clerkId = userId;
            await user.save();
        }

        return NextResponse.json(successResponse(user));
    } catch (error: any) {
        console.error('Sync error:', error);
        return NextResponse.json(errorResponse('Internal server error', error.message), { status: 500 });
    }
}
