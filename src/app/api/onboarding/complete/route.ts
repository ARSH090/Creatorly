import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db/mongodb';
import { User } from '@/lib/models/User';
import { Subscription } from '@/lib/models/Subscription';
import { Plan } from '@/lib/models/Plan';
import crypto from 'crypto';

/**
 * POST /api/onboarding/complete
 * Called after Razorpay mandate is authorized on frontend.
 * Finalizes account creation and trial setup.
 */
export async function POST(req: NextRequest) {
    try {
        const { razorpay_payment_id, razorpay_subscription_id, razorpay_signature, onboardingData } = await req.json();

        // 1. Verify Signature
        const secret = process.env.RAZORPAY_KEY_SECRET!;
        const generated_signature = crypto
            .createHmac('sha256', secret)
            .update(razorpay_payment_id + '|' + razorpay_subscription_id)
            .digest('hex');

        if (generated_signature !== razorpay_signature) {
            return NextResponse.json({ error: 'Invalid payment signature' }, { status: 400 });
        }

        await connectToDatabase();

        // 2. Check for duplicate accounts (username or email)
        const existingUsername = await User.findOne({ username: onboardingData.username });
        if (existingUsername) return NextResponse.json({ error: 'Username already taken' }, { status: 409 });

        const existingEmail = await User.findOne({ email: onboardingData.email });
        if (existingEmail) return NextResponse.json({ error: 'Email already registered' }, { status: 409 });

        // 3. Fetch Plan details for limits
        const plan = await Plan.findOne({ tier: onboardingData.plan });
        if (!plan) return NextResponse.json({ error: 'Invalid plan' }, { status: 400 });

        // 4. Create User Record
        const trialEndDate = new Date();
        trialEndDate.setDate(trialEndDate.getDate() + 14);

        const newUser = await User.create({
            username: onboardingData.username.toLowerCase(),
            email: onboardingData.email.toLowerCase(),
            displayName: onboardingData.fullName,
            phone: onboardingData.phone,
            phoneHash: onboardingData.phoneHash,
            phoneVerified: true,
            phoneVerifiedAt: new Date(),
            onboardingComplete: true,
            onboardingStep: 5,
            subscriptionTier: onboardingData.plan,
            subscriptionStatus: 'trialing',
            subscriptionStartAt: new Date(),
            subscriptionEndAt: trialEndDate,
            razorpaySubscriptionId: razorpay_subscription_id,
            planLimits: plan.trialLimits || plan.limits
        });

        // 5. Create Subscription Record
        await Subscription.create({
            userId: newUser._id,
            planId: plan._id,
            originalPrice: onboardingData.cycle === 'monthly' ? plan.monthlyPrice : plan.yearlyPrice,
            discountAmount: 0,
            finalPrice: onboardingData.cycle === 'monthly' ? plan.monthlyPrice : plan.yearlyPrice,
            billingPeriod: onboardingData.cycle,
            status: 'trialing',
            startDate: new Date(),
            endDate: trialEndDate,
            trialEndsAt: trialEndDate,
            razorpaySubscriptionId: razorpay_subscription_id,
            autopayEnabled: true
        });

        // 6. Link to Clerk (Assuming Clerk user already exists if they used Google, 
        // or we need to sync Clerk metadata. For now, we assume the frontend handles 
        // the session creation or they login after.)

        return NextResponse.json({
            success: true,
            message: 'Onboarding completed successfully'
        });

    } catch (error: any) {
        console.error('Onboarding Completion Error:', error);
        return NextResponse.json({ error: 'Failed to finalize your account. Please contact support.' }, { status: 500 });
    }
}
