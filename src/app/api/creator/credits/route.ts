import { NextRequest } from 'next/server';
import { connectToDatabase } from '@/lib/db/mongodb';
import { AICredit, AICreditTransaction, CreditTransactionType } from '@/lib/models/AICredit';
import { withCreatorAuth } from '@/lib/auth/withAuth';
import { withErrorHandler } from '@/lib/utils/errorHandler';

/**
 * GET /api/creator/credits
 * Get creator's credit balance and package info
 */
async function getHandler(req: NextRequest, user: any, context: any) {
    await connectToDatabase();

    const credit = await AICredit.getOrCreate(user._id);

    // Get recent transactions
    const transactions = await AICreditTransaction.find({ creatorId: user._id })
        .sort({ createdAt: -1 })
        .limit(10)
        .lean();

    return {
        credits: {
            totalCredits: credit.totalCredits,
            usedCredits: credit.usedCredits,
            remainingCredits: credit.remainingCredits,
            packageType: credit.packageType,
            expiresAt: credit.expiresAt,
            autoReload: credit.autoReload,
            autoReloadThreshold: credit.autoReloadThreshold,
            autoReloadAmount: credit.autoReloadAmount
        },
        transactions
    };
}

/**
 * POST /api/creator/credits
 * Use credits (deduct from balance) or add credits
 * Body: { action: 'use' | 'add', amount, description }
 */
async function postHandler(req: NextRequest, user: any, context: any) {
    await connectToDatabase();

    const body = await req.json();
    const { action, amount, description, type = CreditTransactionType.USAGE, metadata } = body;

    if (!action || !amount) {
        throw new Error('action and amount are required');
    }

    const credit = await AICredit.getOrCreate(user._id);

    if (action === 'use') {
        // Use/deduct credits
        if (credit.remainingCredits < amount) {
            throw new Error('Insufficient credits');
        }

        await credit.useCredits(amount, description || 'AI feature usage', metadata);

        return {
            success: true,
            credits: {
                totalCredits: credit.totalCredits,
                usedCredits: credit.usedCredits,
                remainingCredits: credit.remainingCredits
            },
            message: `${amount} credits used`
        };
    } else if (action === 'add') {
        // Add credits (admin or purchase)
        await credit.addCredits(amount, type, description, metadata);

        return {
            success: true,
            credits: {
                totalCredits: credit.totalCredits,
                usedCredits: credit.usedCredits,
                remainingCredits: credit.remainingCredits
            },
            message: `${amount} credits added`
        };
    } else {
        throw new Error('Invalid action. Use "use" or "add"');
    }
}

/**
 * PUT /api/creator/credits
 * Update credit settings (auto-reload, etc.)
 */
async function putHandler(req: NextRequest, user: any, context: any) {
    await connectToDatabase();

    const body = await req.json();
    const { autoReload, autoReloadThreshold, autoReloadAmount, packageType } = body;

    const credit = await AICredit.getOrCreate(user._id);

    if (autoReload !== undefined) credit.autoReload = autoReload;
    if (autoReloadThreshold !== undefined) credit.autoReloadThreshold = autoReloadThreshold;
    if (autoReloadAmount !== undefined) credit.autoReloadAmount = autoReloadAmount;
    if (packageType !== undefined) credit.packageType = packageType;

    await credit.save();

    return {
        success: true,
        credits: {
            autoReload: credit.autoReload,
            autoReloadThreshold: credit.autoReloadThreshold,
            autoReloadAmount: credit.autoReloadAmount,
            packageType: credit.packageType
        }
    };
}

export const GET = withCreatorAuth(withErrorHandler(getHandler));
export const POST = withCreatorAuth(withErrorHandler(postHandler));
export const PUT = withCreatorAuth(withErrorHandler(putHandler));
