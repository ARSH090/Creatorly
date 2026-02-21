import { NextRequest, NextResponse } from 'next/server';
import { OTPService } from '@/lib/services/otp-service';
import { connectToDatabase } from '@/lib/db/mongodb';
import User from '@/lib/models/User';
import crypto from 'crypto';

/**
 * POST /api/onboarding/send-otp
 * Triggers OTP for phone verification
 */
export async function POST(req: NextRequest) {
    try {
        const { phone } = await req.json();

        if (!phone) {
            return NextResponse.json({ error: 'Phone number is required' }, { status: 400 });
        }

        // Validate format (+91XXXXXXXXXX)
        const phoneRegex = /^\+91[6-9]\d{9}$/;
        if (!phoneRegex.test(phone)) {
            return NextResponse.json({ error: 'Invalid Indian phone number. Format: +91XXXXXXXXXX' }, { status: 400 });
        }

        await connectToDatabase();

        // Anti-fraud: Check if phone is already linked to a COMPLETED account
        const phoneHash = crypto.createHash('sha256').update(phone).digest('hex');
        const existingUser = await User.findOne({ phoneHash, onboardingComplete: true });

        if (existingUser) {
            return NextResponse.json({ error: 'This phone number is already linked to an active account.' }, { status: 409 });
        }

        // Generate and Send OTP
        await OTPService.generateOTP(phone);

        return NextResponse.json({ success: true, message: 'OTP sent successfully' });

    } catch (error: any) {
        console.error('Send OTP Error:', error);
        return NextResponse.json({ error: 'Failed to send OTP. Please try again.' }, { status: 500 });
    }
}
