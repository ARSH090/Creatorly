import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db/mongodb';
import { User } from '@/lib/models/User';
import { CreatorProfile } from '@/lib/models/CreatorProfile';
import { withCreatorAuth } from '@/lib/auth/withAuth';
import { withErrorHandler } from '@/lib/utils/errorHandler';

async function deleteStoreHandler(req: NextRequest, user: any, context: any) {
    await connectToDatabase();

    // 1. Delete CreatorProfile
    await CreatorProfile.deleteOne({ creatorId: user._id });

    // 2. Unset storeSlug from User so they can recreate it
    await User.findByIdAndUpdate(user._id, { $unset: { storeSlug: "" } });

    // Force clear domain mapping cache if they had one
    // But since it's just deleting the store, the domain might become pointing to nothing.

    return { success: true, message: 'Store deleted successfully' };
}

export const DELETE = withCreatorAuth(withErrorHandler(deleteStoreHandler));
