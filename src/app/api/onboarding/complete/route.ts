import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { connectToDatabase } from '@/lib/db/mongodb';
import { User } from '@/lib/models/User';
import { Subscription } from '@/lib/models/Subscription';
import { Plan } from '@/lib/models/Plan';
import crypto from 'crypto';

/**
 * POST /api/onboarding/complete
 * Called after Razorpay mandate is authorized on frontend.
 * Finalizes account creation and trial setup.
 * 
 * FIXES:
 * - BUG-01: Auth check added — only authenticated Clerk users can call this
 * - BUG-02: clerkId is now stored on User document to link Clerk ↔ MongoDB
 */
export async function POST(req: NextRequest) {
    try {
        // BUG-01 FIX: Require Clerk authentication
        const { userId: clerkUserId } = await auth();
        if (!clerkUserId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { razorpay_payment_id, razorpay_subscription_id, razorpay_signature, onboardingData } = await req.json();

        if (!onboardingData) {
            return NextResponse.json({ error: 'Missing onboarding data' }, { status: 400 });
        }

        const isFree = onboardingData.plan === 'free';

        // 1. Verify Razorpay Signature (Skip for free)
        if (!isFree) {
            if (!razorpay_payment_id || !razorpay_subscription_id || !razorpay_signature) {
                return NextResponse.json({ error: 'Missing payment details' }, { status: 400 });
            }
            const secret = process.env.RAZORPAY_KEY_SECRET!;
            const generated_signature = crypto
                .createHmac('sha256', secret)
                .update(razorpay_payment_id + '|' + razorpay_subscription_id)
                .digest('hex');

            if (generated_signature !== razorpay_signature) {
                return NextResponse.json({ error: 'Invalid payment signature' }, { status: 400 });
            }
        }

        await connectToDatabase();

        // 2. Check for duplicate accounts (username or email)
        const existingUsername = await User.findOne({ username: onboardingData.username?.toLowerCase(), clerkId: { $ne: clerkUserId } });
        if (existingUsername) return NextResponse.json({ error: 'Username already taken' }, { status: 409 });

        // 3. Fetch Plan details for limits
        const plan = await Plan.findOne({ tier: onboardingData.plan });
        if (!plan) return NextResponse.json({ error: 'Invalid plan' }, { status: 400 });

        // 4. Update or Create User Record
        const trialEndDate = new Date();
        trialEndDate.setDate(trialEndDate.getDate() + 14);

        const newUser = await User.findOneAndUpdate(
            { clerkId: clerkUserId },
            {
                $set: {
                    username: onboardingData.username.toLowerCase(),
                    email: onboardingData.email.toLowerCase(),
                    displayName: onboardingData.fullName,
                    onboardingComplete: true,
                    onboardingStep: 5,
                    subscriptionTier: onboardingData.plan,
                    subscriptionStatus: isFree ? 'active' : 'trialing',
                    subscriptionStartAt: new Date(),
                    subscriptionEndAt: trialEndDate,
                    razorpaySubscriptionId: razorpay_subscription_id || undefined,
                    planLimits: plan.trialLimits || plan.limits,
                    emailVerified: true // Clerk already verified email
                }
            },
            { upsert: true, new: true }
        );

        // 5. Create Subscription Record
        await Subscription.create({
            userId: newUser._id,
            planId: plan._id,
            originalPrice: onboardingData.cycle === 'monthly' ? plan.monthlyPrice : plan.yearlyPrice,
            discountAmount: 0,
            finalPrice: onboardingData.cycle === 'monthly' ? plan.monthlyPrice : plan.yearlyPrice,
            billingPeriod: onboardingData.cycle || 'monthly',
            status: 'trialing',
            startDate: new Date(),
            endDate: trialEndDate,
            trialEndsAt: trialEndDate,
            razorpaySubscriptionId: razorpay_subscription_id,
            autopayEnabled: true
        });

        return NextResponse.json({
            success: true,
            message: 'Onboarding completed successfully'
        });

    } catch (error: any) {
        console.error('Onboarding Completion Error:', error);
        return NextResponse.json({ error: 'Failed to finalize your account. Please contact support.' }, { status: 500 });
    }
}
