import { connectToDatabase } from '../src/lib/db/mongodb';
import Plan from '../src/lib/models/Plan';
import { PlanTier, BillingPeriod } from '../src/lib/models/plan.types';
import { syncRazorpayPlan } from '../src/lib/payments/razorpay';
import mongoose from 'mongoose';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

async function seedPlansSafe() {
    try {
        await connectToDatabase();
        console.log('📡 Connected to database for safe seeding...');

        const plans = [
            {
                name: 'Starter',
                tier: PlanTier.STARTER,
                monthlyPrice: 999,
                yearlyPrice: 9999,
                description: 'Ideal for growing creators.',
                displayFeatures: ['5 products', '1 booking', '3% fee']
            },
            {
                name: 'Pro',
                tier: PlanTier.PRO,
                monthlyPrice: 1999,
                yearlyPrice: 19999,
                description: 'Everything you need to scale.',
                displayFeatures: ['Unlimited products', '0% fee', 'AutoDM + AI']
            },
            {
                name: 'Business',
                tier: PlanTier.BUSINESS,
                monthlyPrice: 3999,
                yearlyPrice: 39999,
                description: 'For large agencies and teams.',
                displayFeatures: ['5 team members', 'WhatsApp DM', 'White-label']
            }
        ];

        for (const p of plans) {
            console.log(`Checking plan: ${p.name}...`);
            let existing = await Plan.findOne({ tier: p.tier });

            if (existing) {
                console.log(`Plan ${p.name} already exists. Updating metadata...`);
                // Only update non-destructive fields if it already exists
                existing.description = p.description;
                existing.displayFeatures = p.displayFeatures;
                await existing.save();
            } else {
                console.log(`Plan ${p.name} missing. Creating with Razorpay sync...`);
                const monthlyRp = await syncRazorpayPlan({
                    name: p.name,
                    description: p.description,
                    amount: p.monthlyPrice,
                    interval: 'monthly'
                });

                const yearlyRp = await syncRazorpayPlan({
                    name: p.name,
                    description: p.description,
                    amount: p.yearlyPrice,
                    interval: 'yearly'
                });

                await Plan.create({
                    ...p,
                    billingPeriod: [BillingPeriod.MONTHLY, BillingPeriod.YEARLY],
                    razorpayMonthlyPlanId: monthlyRp.id,
                    razorpayYearlyPlanId: yearlyRp.id,
                    razorpayPlanId: monthlyRp.id,
                    isActive: true,
                    isVisible: true,
                    // Standard limits for these tiers as per model defaults or common sense
                    maxUsers: p.tier === PlanTier.STARTER ? 1 : (p.tier === PlanTier.PRO ? 5 : 20),
                    maxStorageMb: p.tier === PlanTier.STARTER ? 2048 : (p.tier === PlanTier.PRO ? 10240 : 51200),
                    maxAutoDms: p.tier === PlanTier.STARTER ? 500 : (p.tier === PlanTier.PRO ? 5000 : 50000),
                    maxApiCalls: p.tier === PlanTier.STARTER ? 5000 : (p.tier === PlanTier.PRO ? 50000 : 500000),
                    rateLimitPerMin: p.tier === PlanTier.STARTER ? 50 : (p.tier === PlanTier.PRO ? 200 : 1000),
                });
            }
        }

        // Always ensure Free Tier exists
        const freeExists = await Plan.findOne({ tier: PlanTier.FREE });
        if (!freeExists) {
            console.log('Creating Free Tier...');
            await Plan.create({
                name: 'Free Tier',
                tier: PlanTier.FREE,
                monthlyPrice: 0,
                yearlyPrice: 0,
                description: 'Perfect for getting started.',
                billingPeriod: [BillingPeriod.MONTHLY],
                maxUsers: 1,
                maxStorageMb: 100,
                maxAutoDms: 100,
                maxApiCalls: 1000,
                isActive: true,
                isVisible: true,
                sortOrder: 0
            });
        }

        console.log('✅ Safe seeding complete!');
        process.exit(0);
    } catch (error) {
        console.error('❌ Safe seeding failed:', error);
        process.exit(1);
    }
}

seedPlansSafe();
