import { NextRequest } from 'next/server';
import { connectToDatabase } from '@/lib/db/mongodb';
import Payout from '@/lib/models/Payout';
import { Order } from '@/lib/models/Order';
import User from '@/lib/models/User';
import { withCreatorAuth } from '@/lib/auth/withAuth';
import { withErrorHandler } from '@/lib/utils/errorHandler';
import { createRazorpayXPayout } from '@/lib/payments/razorpay';
import { nanoid } from 'nanoid';

async function handler(req: NextRequest, user: any) {
    await connectToDatabase();
    const body = await req.json();
    const { amount: requestedAmount, upiId, mode = 'UPI' } = body;

    // Calculate available balance
    const paidOrders = await Order.find({ creatorId: user._id, paymentStatus: 'paid' });
    const totalPaid = await Payout.find({ creatorId: user._id, status: { $in: ['paid', 'processed'] } });
    
    const grossRevenue = paidOrders.reduce((s, o) => s + ((o.total || 0) - (o.commissionAmount || 0)), 0);
    const alreadyPaidOut = totalPaid.reduce((s, p) => s + p.amount, 0);
    const availableBalance = grossRevenue - alreadyPaidOut;

    const payoutAmount = requestedAmount
        ? Math.min(requestedAmount * 100, availableBalance) // convert to paise
        : availableBalance;

    if (payoutAmount < 100) { // min ₹1
        throw new Error('Insufficient balance for payout. Minimum payout is ₹1.');
    }

    const referenceId = `payout_${user._id}_${nanoid(8)}`;

    // Attempt instant Razorpay X payout if UPI provided
    if (upiId && process.env.RAZORPAY_X_KEY_ID) {
        try {
            const razorpayPayout = await createRazorpayXPayout({
                accountNumber: process.env.RAZORPAY_X_ACCOUNT_NUMBER!,
                amount: Math.round(payoutAmount),
                currency: 'INR',
                mode: mode as 'UPI' | 'IMPS' | 'NEFT',
                purpose: 'payout',
                fund_account: {
                    account_type: 'vpa',
                    vpa: { address: upiId },
                    contact: {
                        name: user.displayName || user.username,
                        email: user.email,
                        contact: user.phone || '0000000000',
                        type: 'vendor',
                    },
                },
                narration: `Creatorly payout for ${user.username}`,
                reference_id: referenceId,
            });

            const payout = await Payout.create({
                creatorId: user._id,
                amount: Math.round(payoutAmount / 100), // store in rupees
                status: 'processed',
                payoutMethod: 'upi',
                razorpayPayoutId: razorpayPayout.id,
                transactionId: referenceId,
                processedAt: new Date(),
                notes: `Instant UPI payout to ${upiId}`,
            });

            return { success: true, payout, instant: true, razorpayPayoutId: razorpayPayout.id };
        } catch (err: any) {
            console.error('Instant payout failed, falling back to manual:', err.message);
            // Fall through to manual payout
        }
    }

    // Manual payout (admin approves)
    const payout = await Payout.create({
        creatorId: user._id,
        amount: Math.round(payoutAmount / 100),
        status: 'pending',
        payoutMethod: mode === 'UPI' ? 'upi' : 'bank',
        transactionId: referenceId,
        notes: upiId ? `Requested to UPI: ${upiId}` : 'Manual bank transfer requested',
    });

    return { success: true, payout, instant: false, message: 'Payout request submitted. Will be processed within 1-2 business days.' };
}

export const POST = withCreatorAuth(withErrorHandler(handler));
