import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db/mongodb';
import { User } from '@/lib/models/User';
import { withCreatorAuth } from '@/lib/auth/withAuth';
import { encryptTokenWithVersion, decryptTokenWithVersion } from '@/lib/security/encryption';

// Helper to mask sensitive keys
function maskSensitive(value: string | undefined) {
    if (!value) return '';
    if (value.length < 12) return '••••' + value.slice(-2);
    return value.slice(0, 8) + '••••••••' + value.slice(-4);
}

// GET /api/dashboard/settings/payments
export const GET = withCreatorAuth(async (req, user) => {
    try {
        const configs = user.paymentConfigs || {};

        // Return masked data for UI
        const maskedConfigs = {
            upi: configs.upi || { upiId: '', active: false },
            razorpay: {
                keyId: configs.razorpay?.keyId || '',
                keySecret: configs.razorpay?.keySecret ? '••••••••••••' : '',
                active: configs.razorpay?.active || false
            },
            stripe: configs.stripe || { accountId: '', active: false },
            paypal: configs.paypal || { email: '', active: false },
            bank: {
                accountNumber: configs.bank?.accountNumber ? '••••••••' + '1234' : '', // Hypothetical last 4
                ifsc: configs.bank?.ifsc || '',
                holderName: configs.bank?.holderName || '',
                bankName: configs.bank?.bankName || '',
                active: configs.bank?.active || false
            }
        };

        return NextResponse.json({
            configs: maskedConfigs,
            primaryPaymentMethod: user.primaryPaymentMethod || 'upi'
        });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
});

// POST /api/dashboard/settings/payments
export const POST = withCreatorAuth(async (req, user) => {
    try {
        const body = await req.json();
        const { method, data } = body; // method: 'upi' | 'razorpay' | ...

        await connectToDatabase();
        const update: any = {};

        if (method === 'upi') {
            // Validate UPI format (basic check)
            if (!/^[a-zA-Z0-9.\-_]{2,256}@[a-zA-Z]{2,64}$/.test(data.upiId)) {
                return NextResponse.json({ error: 'Invalid UPI ID format' }, { status: 400 });
            }
            update['paymentConfigs.upi'] = { upiId: data.upiId, active: true };
        }
        else if (method === 'razorpay') {
            const encrypted = encryptTokenWithVersion(data.keySecret);
            update['paymentConfigs.razorpay'] = {
                keyId: data.keyId,
                keySecret: encrypted.encryptedData,
                keySecretIV: encrypted.iv,
                keySecretTag: encrypted.tag,
                active: true
            };
        }
        else if (method === 'stripe') {
            update['paymentConfigs.stripe'] = { accountId: data.accountId, active: true };
        }
        else if (method === 'paypal') {
            update['paymentConfigs.paypal'] = { email: data.email, active: true };
        }
        else if (method === 'bank') {
            const encrypted = encryptTokenWithVersion(data.accountNumber);
            update['paymentConfigs.bank'] = {
                accountNumber: encrypted.encryptedData,
                accountNumberIV: encrypted.iv,
                accountNumberTag: encrypted.tag,
                ifsc: data.ifsc,
                holderName: data.holderName,
                bankName: data.bankName,
                active: true
            };
        }

        await User.findByIdAndUpdate(user._id, { $set: update });

        return NextResponse.json({ success: true });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
});

// PATCH /api/dashboard/settings/payments
export const PATCH = withCreatorAuth(async (req, user) => {
    try {
        const { primaryMethod, activeMethod, deactivateMethod } = await req.json();
        await connectToDatabase();

        const update: any = {};
        if (primaryMethod) {
            update.primaryPaymentMethod = primaryMethod;
        }

        if (deactivateMethod) {
            update[`paymentConfigs.${deactivateMethod}.active`] = false;
        }

        if (activeMethod) {
            update[`paymentConfigs.${activeMethod}.active`] = true;
        }

        await User.findByIdAndUpdate(user._id, { $set: update });
        return NextResponse.json({ success: true });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
});
