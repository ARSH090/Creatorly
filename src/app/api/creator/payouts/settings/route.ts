import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db/mongodb';
import { User } from '@/lib/models/User';
import { withCreatorAuth } from '@/lib/firebase/withAuth';
import { successResponse, errorResponse } from '@/types/api';

/**
 * GET: Fetch current payout settings
 */
async function getHandler(req: NextRequest, { user }: { user: any }) {
    await connectToDatabase();

    // Re-fetch user to get latest settings
    const dbUser = await User.findById(user.id).select('payoutMethod payoutStatus payoutHoldReason');

    if (!dbUser) {
        return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json(successResponse({
        payoutMethod: dbUser.payoutMethod || {},
        payoutStatus: dbUser.payoutStatus,
        payoutHoldReason: dbUser.payoutHoldReason
    }));
}

/**
 * POST: Update payout settings
 */
async function postHandler(req: NextRequest, { user }: { user: any }) {
    await connectToDatabase();

    const body = await req.json();
    const { type, accountId, email } = body;

    // Basic validation
    if (!['bank', 'paypal', 'stripe'].includes(type)) {
        return NextResponse.json(errorResponse('Invalid payout type'), { status: 400 });
    }

    if (type === 'paypal' && !email) {
        return NextResponse.json(errorResponse('Email is required for PayPal'), { status: 400 });
    }

    if ((type === 'bank' || type === 'stripe') && !accountId) {
        return NextResponse.json(errorResponse('Account ID/Number is required'), { status: 400 });
    }

    const updatedUser = await User.findByIdAndUpdate(
        user.id,
        {
            $set: {
                payoutMethod: {
                    type,
                    accountId,
                    email
                }
            }
        },
        { new: true }
    );

    return NextResponse.json(successResponse({
        payoutMethod: updatedUser?.payoutMethod
    }, 'Payout settings updated successfully'));
}

export const GET = withCreatorAuth(getHandler);
export const POST = withCreatorAuth(postHandler);
