import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { connectToDatabase } from '@/lib/db/mongodb';
import { SocialAccount } from '@/lib/models/SocialAccount';
import { User } from '@/lib/models/User';

/**
 * List connected social accounts
 */
export async function GET(request: NextRequest) {
    try {
        const { userId } = await auth();
        if (!userId) {
            return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
        }

        await connectToDatabase();
        const user = await User.findOne({ clerkId: userId });
        if (!user) {
            return NextResponse.json({ success: false, message: 'User not found' }, { status: 404 });
        }

        const accounts = await SocialAccount.find({
            userId: user._id,
            isActive: true
        }).select('platform instagramBusinessId tokenExpiresAt tokenStatus metadata connectedAt');

        return NextResponse.json({
            success: true,
            accounts: accounts.map(acc => ({
                id: acc._id,
                platform: acc.platform,
                handle: acc.metadata?.pageName || acc.instagramBusinessId,
                status: acc.tokenStatus,
                expiresAt: acc.tokenExpiresAt,
                connectedAt: acc.connectedAt
            }))
        });

    } catch (error: any) {
        console.error('[Social Accounts] List Error:', error);
        return NextResponse.json({ success: false, message: error.message }, { status: 500 });
    }
}

/**
 * Disconnect a social account (soft-delete)
 */
export async function DELETE(request: NextRequest) {
    try {
        const { userId } = await auth();
        if (!userId) {
            return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const accountId = searchParams.get('id');
        if (!accountId) {
            return NextResponse.json({ success: false, message: 'Missing account ID' }, { status: 400 });
        }

        await connectToDatabase();
        const user = await User.findOne({ clerkId: userId });
        if (!user) {
            return NextResponse.json({ success: false, message: 'User not found' }, { status: 404 });
        }

        const result = await SocialAccount.findOneAndUpdate(
            { _id: accountId, userId: user._id },
            {
                isActive: false,
                tokenStatus: 'revoked',
                'metadata.disconnectedAt': new Date()
            },
            { new: true }
        );

        if (!result) {
            return NextResponse.json({ success: false, message: 'Account not found or not owned by user' }, { status: 404 });
        }

        return NextResponse.json({ success: true, message: 'Account disconnected successfully' });

    } catch (error: any) {
        console.error('[Social Accounts] Delete Error:', error);
        return NextResponse.json({ success: false, message: error.message }, { status: 500 });
    }
}
