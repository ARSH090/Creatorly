import { connectToDatabase } from '../src/lib/db/mongodb';
import Plan from '../src/lib/models/Plan';
import { PlanTier, BillingPeriod } from '../src/lib/models/plan.types';
import mongoose from 'mongoose';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

async function seedPlans() {
    try {
        await connectToDatabase();
        console.log('Connected to database...');

        // 1. Initial Free Plan
        const freePlan = {
            name: 'Free Tier',
            description: 'Perfect for getting started. 100% free forever.',
            tier: PlanTier.FREE,
            billingPeriod: [BillingPeriod.MONTHLY],
            monthlyPrice: 0,
            yearlyPrice: 0,
            maxUsers: 1,
            maxStorageMb: 100,
            maxApiCalls: 1000,
            rateLimitPerMin: 10,
            hasAnalytics: false,
            isActive: true,
            isVisible: true,
            sortOrder: 0
        };

        // 2. Basic Plan
        const basicPlan = {
            name: 'Starter',
            description: 'Ideal for growing creators.',
            tier: PlanTier.BASIC,
            billingPeriod: [BillingPeriod.MONTHLY, BillingPeriod.YEARLY],
            monthlyPrice: 199,
            yearlyPrice: 1990, // ~16% discount
            maxUsers: 3,
            maxStorageMb: 5120, // 5GB
            maxApiCalls: 10000,
            rateLimitPerMin: 100,
            hasAnalytics: true,
            isActive: true,
            isVisible: true,
            sortOrder: 1
        };

        // 3. Pro Plan
        const proPlan = {
            name: 'Creator Pro',
            description: 'Everything you need to scale.',
            tier: PlanTier.PRO,
            billingPeriod: [BillingPeriod.MONTHLY, BillingPeriod.YEARLY],
            monthlyPrice: 499,
            yearlyPrice: 4990,
            maxUsers: 10,
            maxStorageMb: 51200, // 50GB
            maxApiCalls: 100000,
            rateLimitPerMin: 1000,
            hasAnalytics: true,
            hasPrioritySupport: true,
            hasCustomDomain: true,
            hasTeamCollaboration: true,
            hasWebhooks: true,
            isActive: true,
            isVisible: true,
            sortOrder: 2
        };

        await Plan.deleteMany({}); // Clear existing plans for seeding
        await Plan.create([freePlan, basicPlan, proPlan]);

        console.log('Plans seeded successfully!');
        process.exit(0);
    } catch (error) {
        console.error('Seeding failed:', error);
        process.exit(1);
    }
}

seedPlans();
