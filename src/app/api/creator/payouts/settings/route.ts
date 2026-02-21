import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db/mongodb';
import { User, type IUser } from '@/lib/models/User';
import { withCreatorAuth } from '@/lib/auth/withAuth';
import { successResponse, errorResponse } from '@/types/api';
import { z } from 'zod';
import { encryptTokenGCM, decryptTokenGCM } from '@/lib/security/encryption';

const payoutSchema = z.object({
    type: z.enum(['bank', 'paypal', 'stripe']),
    accountId: z.string().min(1, "Account ID is required").optional(),
    email: z.string().email("Invalid email").optional(),
}).refine((data) => {
    if (data.type === 'paypal' && !data.email) return false;
    if ((data.type === 'bank' || data.type === 'stripe') && !data.accountId) return false;
    return true;
}, {
    message: "Missing required fields for the selected payout method",
    path: ["accountId"]
});

/**
 * GET: Fetch current payout settings (Masked)
 */
async function getHandler(req: NextRequest, { user }: { user: any }) {
    await connectToDatabase();

    const dbUser = await User.findById(user._id).select('payoutMethod payoutStatus payoutHoldReason') as any;

    if (!dbUser) {
        return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const method = (dbUser.payoutMethod || {}) as Exclude<IUser['payoutMethod'], undefined>;
    let displayAccountId = method.accountId;

    // Mask sensitive account info
    if (method.type === 'bank' && method.accountId && method.accountIV && method.accountTag) {
        try {
            const decrypted = decryptTokenGCM(method.accountId, method.accountIV, method.accountTag);
            displayAccountId = decrypted.slice(0, 4) + ' •••• ' + decrypted.slice(-4);
        } catch (e) {
            displayAccountId = 'Error decrypting info';
        }
    } else if (method.type === 'stripe' && method.accountId) {
        displayAccountId = method.accountId.slice(0, 5) + '••••' + method.accountId.slice(-4);
    }

    return NextResponse.json(successResponse({
        payoutMethod: {
            type: method.type,
            accountId: displayAccountId,
            email: method.email
        },
        payoutStatus: dbUser.payoutStatus,
        payoutHoldReason: dbUser.payoutHoldReason
    }));
}

/**
 * POST: Update payout settings (Encrypted)
 */
async function postHandler(req: NextRequest, { user }: { user: any }) {
    await connectToDatabase();

    try {
        const body = await req.json();
        const validation = payoutSchema.safeParse(body);

        if (!validation.success) {
            const errorMessage = validation.error.flatten().fieldErrors.accountId?.[0] || validation.error.issues[0]?.message || 'Invalid data';
            return NextResponse.json(errorResponse(errorMessage), { status: 400 });
        }

        const { type, accountId, email } = validation.data;

        let finalAccountId = accountId;
        let accountIV = undefined;
        let accountTag = undefined;

        // Encrypt sensitive bank details
        if (type === 'bank' && accountId) {
            const { encryptedData, iv, tag } = encryptTokenGCM(accountId);
            finalAccountId = encryptedData;
            accountIV = iv;
            accountTag = tag;
        }

        if (type === 'stripe') {
            // WARNING: In production, we should use Stripe Connect onboarding
            // For now, we only allow manually setting it if it matches basic pattern
            if (!accountId?.startsWith('acct_')) {
                return NextResponse.json(errorResponse('Invalid Stripe Account ID format'), { status: 400 });
            }
        }

        const updatedUser = await User.findByIdAndUpdate(
            user._id,
            {
                $set: {
                    payoutMethod: {
                        type,
                        accountId: finalAccountId,
                        accountIV,
                        accountTag,
                        email
                    }
                }
            },
            { new: true }
        );

        return NextResponse.json(successResponse({
            payoutMethod: {
                type: updatedUser?.payoutMethod?.type,
                email: updatedUser?.payoutMethod?.email,
                accountId: 'Successfully saved' // Don't return the encrypted data or even the masked data yet
            }
        }, 'Payout settings updated and secured'));

    } catch (error) {
        console.error('[Payout Settings] Error:', error);
        return NextResponse.json(errorResponse('Internal Server Error'), { status: 500 });
    }
}

export const GET = withCreatorAuth(getHandler);
export const POST = withCreatorAuth(postHandler);
