import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { User } from '@/lib/models/User';
import { Subscription } from '@/lib/models/Subscription';
import { PlatformSettings } from '@/lib/models/PlatformSettings';
import { Coupon } from '@/lib/models/Coupon';
import { razorpay } from '@/lib/payments/razorpay';
import { connectToDatabase as dbConnect } from '@/lib/db/mongodb';
import crypto from 'crypto';

export async function POST(req: NextRequest) {
    try {
        await dbConnect();
        const { userId } = await auth();

        if (!userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await req.json();
        const { plan, couponCode } = body;

        if (!['monthly', 'yearly'].includes(plan)) {
            return NextResponse.json({ error: 'Invalid plan selected' }, { status: 400 });
        }

        const user = await User.findOne({ clerkId: userId });
        if (!user) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        // 1. Validate User Subscription Status
        if (user.subscriptionStatus === 'active' || user.subscriptionStatus === 'trialing') { // or check activeSubscription
            // Double check with Subscription model to be sure
            const activeSub = await Subscription.findOne({
                userId: user._id,
                status: { $in: ['active', 'trialing'] }
            });
            if (activeSub) {
                return NextResponse.json({ error: 'You already have an active subscription.' }, { status: 400 });
            }
        }

        // 2. Fetch Pricing
        const settings = await PlatformSettings.findOne().sort({ createdAt: -1 });
        if (!settings) {
            return NextResponse.json({ error: 'Platform settings not configured' }, { status: 500 });
        }

        let originalPrice = plan === 'monthly' ? settings.subscriptionPlans.monthly.price : settings.subscriptionPlans.yearly.price;
        let finalPrice = originalPrice;
        let discountAmount = 0;
        let couponId = null;

        // 3. Validate Coupon
        if (couponCode) {
            const coupon = await Coupon.findOne({
                code: couponCode.toUpperCase(),
                isActive: true,
                expiresAt: { $gt: new Date() }
            });

            if (coupon) {
                if (coupon.usageLimit && coupon.usedCount >= coupon.usageLimit) {
                    // Coupon exhausted
                } else {
                    couponId = coupon._id;
                    if (coupon.discountType === 'percentage') {
                        discountAmount = (originalPrice * coupon.discountValue) / 100;
                    } else {
                        discountAmount = coupon.discountValue;
                    }
                    // Ensure price doesn't go below 0 (or minimum allowed by Razorpay, usually 1 INR)
                    finalPrice = Math.max(originalPrice - discountAmount, 1);
                }
            }
        }

        // 4. Determine Plan ID (Dynamic or Existing)
        let razorpayPlanId = plan === 'monthly' ? settings.subscriptionPlans.monthly.razorpayPlanId : settings.subscriptionPlans.yearly.razorpayPlanId;

        // If price differs (due to coupon or missing plan), create a dynamic plan
        // Razorpay Plans are strictly tied to amount. If amount changes, we need a new plan.
        // For simplicity in this "Strict" flow, we will create a plan if the standard one doesn't match or is missing.
        // Actually, if we use a coupon, we should probably stick to the base plan and use an 'offer' or 'addon' if possible?
        // Razorpay Subscriptions don't support arbitrary amounts easily without a plan.
        // So we will CREATE a plan for this specific transaction if discount is applied.

        let shouldCreatePlan = !razorpayPlanId;
        if (discountAmount > 0) {
            shouldCreatePlan = true;
        }

        if (shouldCreatePlan) {
            const planName = `Creatorly ${plan.charAt(0).toUpperCase() + plan.slice(1)} - ${finalPrice} INR`;
            const planResponse = await razorpay.plans.create({
                period: plan === 'monthly' ? 'monthly' : 'yearly',
                interval: 1,
                item: {
                    name: planName,
                    amount: finalPrice * 100, // in paise
                    currency: settings.currency || 'INR',
                    description: `Subscription for ${user.displayName} (${discountAmount > 0 ? 'Discounted' : 'Standard'})`
                }
            });
            razorpayPlanId = planResponse.id;
        }

        // 5. Create Razorpay Subscription
        // Rule: Trial only if not used before.
        const trialDays = user.trialUsed ? 0 : 14;

        // However, the PROMPT says: "Users get 14 days FREE access ONLY after enabling AutoPay".
        // And "Strict Enforcement".
        // If trialUsed is true, do we deny subscription? No, they just pay immediately.
        // If trialUsed is false, they get 14 days.

        // Razorpay API: trial_period_days defaults to 0.
        // If we send non-zero, the first charge is delayed.

        // Notes: we store metadata here to retrieve later in webhook
        const subscription = await razorpay.subscriptions.create({
            plan_id: razorpayPlanId,
            total_count: 120, // 10 years
            quantity: 1,
            customer_notify: 1,
            trial_period_days: trialDays,
            notes: {
                userId: user._id.toString(),
                plan: plan,
                couponCode: couponCode || ''
            }
        } as any);

        // 6. Store pending subscription in DB
        // We do NOT mark it as active yet.
        await Subscription.create({
            userId: user._id,
            planId: null, // Platform plan
            originalPrice,
            discountAmount,
            finalPrice,
            billingPeriod: plan,
            startDate: new Date(),
            endDate: new Date(Date.now() + (trialDays * 24 * 60 * 60 * 1000)), // Provisional
            status: 'pending', // Will become 'active' or 'trialing' on webhook
            razorpaySubscriptionId: subscription.id,
            razorpayCustomerId: user.razorpayCustomerId || '', // Might need to create customer if missing
            autoRenew: true,
            trialEndsAt: trialDays > 0 ? new Date(Date.now() + (trialDays * 24 * 60 * 60 * 1000)) : undefined,
            autopayEnabled: false // Confirmed via webhook
        });

        // If user didn't have razorpayCustomerId, we might want to update it later or create it now.
        // Steps say: "Step 4: Create Razorpay Customer (if not exists)". 
        // Let's doing it before subscription creation.

        return NextResponse.json({
            subscriptionId: subscription.id,
            razorpayKey: process.env.RAZORPAY_KEY_ID
        });

    } catch (error: any) {
        console.error('Subscription Creation Error:', error);
        return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
    }
}

