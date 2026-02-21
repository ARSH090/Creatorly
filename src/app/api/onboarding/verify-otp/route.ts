import { NextRequest, NextResponse } from 'next/server';
import { OTPService } from '@/lib/services/otp-service';
import { connectToDatabase } from '@/lib/db/mongodb';
import crypto from 'crypto';

/**
 * POST /api/onboarding/verify-otp
 * Verifies OTP and returns a verification token or hash
 */
export async function POST(req: NextRequest) {
    try {
        const { phone, otp } = await req.json();

        if (!phone || !otp) {
            return NextResponse.json({ error: 'Phone and OTP are required' }, { status: 400 });
        }

        await connectToDatabase();

        const result = await OTPService.verifyOTP(phone, otp);

        if (!result.success) {
            return NextResponse.json({ error: result.message }, { status: 401 });
        }

        // If verified, return the phone hash to be used in the final account creation step
        const phoneHash = crypto.createHash('sha256').update(phone).digest('hex');

        return NextResponse.json({
            success: true,
            phoneHash,
            message: 'OTP verified successfully'
        });

    } catch (error: any) {
        console.error('Verify OTP Error:', error);
        return NextResponse.json({ error: 'Verification failed' }, { status: 500 });
    }
}
