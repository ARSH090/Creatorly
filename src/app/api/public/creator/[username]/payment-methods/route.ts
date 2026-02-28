import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db/mongodb';
import User from '@/lib/models/User';

export async function GET(
    req: NextRequest,
    { params }: { params: { username: string } }
) {
    try {
        await connectToDatabase();
        const { username } = params;

        const user = await User.findOne({
            $or: [{ username }, { storeSlug: username }]
        }).select('paymentConfigs primaryPaymentMethod');

        if (!user) {
            return NextResponse.json({ error: 'Creator not found' }, { status: 404 });
        }

        const configs = user.paymentConfigs || {};
        const enabledMethods: Record<string, boolean> = {
            upi: !!configs.upi?.upiId,
            razorpay: !!configs.razorpay?.keyId,
            paypal: !!configs.paypal?.email,
            bank: !!configs.bank?.accountNumber,
            stripe: !!configs.stripe?.accountId
        };

        return NextResponse.json({
            methods: enabledMethods,
            primaryMethod: user.primaryPaymentMethod || (enabledMethods.upi ? 'upi' : Object.keys(enabledMethods).find(k => enabledMethods[k]))
        });

    } catch (error) {
        console.error('[Payment Methods API Error]:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
