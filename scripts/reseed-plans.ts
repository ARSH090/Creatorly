import { connectToDatabase } from '../src/lib/db/mongodb';
import Plan from '../src/lib/models/Plan';
import mongoose from 'mongoose';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const plans = [
    {
        id: 'free',
        name: 'Free',
        description: 'Perfect for getting started.',
        isActive: true,
        isVisible: true,
        limits: {
            products: 3,
            stores: 1,
            emailSubscribers: 100,
            emailCampaigns: 1,
            autoDMAutomations: 0,
            scheduledPosts: 5,
            aiGenerations: 10,
            analyticsRetentionDays: 7,
            transactionFeePercent: 5,
            customDomain: false,
            affiliateSystem: false,
            advancedAnalytics: false,
            autoDMHub: false,
            schedulify: false,
            emailMarketing: false,
            aiTools: false,
            prioritySupport: false,
            whiteLabel: false,
        },
        features: ['Up to 3 products', 'Social media integration', '5% transaction fee']
    },
    {
        id: 'pro',
        name: 'Pro',
        description: 'For growing creators who need more power.',
        price: 99900, // ₹999
        displayOrder: 1,
        isActive: true,
        isVisible: true,
        isHighlighted: true,
        badge: 'Popular',
        limits: {
            products: 25,
            stores: 1,
            emailSubscribers: 5000,
            emailCampaigns: -1,
            autoDMAutomations: 10,
            scheduledPosts: -1,
            aiGenerations: 100,
            analyticsRetentionDays: 90,
            transactionFeePercent: 2,
            customDomain: true,
            affiliateSystem: true,
            advancedAnalytics: true,
            autoDMHub: true,
            schedulify: true,
            emailMarketing: true,
            aiTools: true,
            prioritySupport: true,
            whiteLabel: false,
        },
        features: ['Up to 25 products', 'Custom Domain', '2% transaction fee', 'AutoDM Hub', 'Email Marketing']
    },
    {
        id: 'elite',
        name: 'Elite',
        description: 'The ultimate toolkit for professional creators.',
        price: 249900, // ₹2499
        displayOrder: 2,
        isActive: true,
        isVisible: true,
        limits: {
            products: -1,
            stores: 1,
            emailSubscribers: -1,
            emailCampaigns: -1,
            autoDMAutomations: -1,
            scheduledPosts: -1,
            aiGenerations: -1,
            analyticsRetentionDays: 365,
            transactionFeePercent: 0,
            customDomain: true,
            affiliateSystem: true,
            advancedAnalytics: true,
            autoDMHub: true,
            schedulify: true,
            emailMarketing: true,
            aiTools: true,
            prioritySupport: true,
            whiteLabel: true,
        },
        features: ['Unlimited everything', '0% transaction fee', 'White-labeling', 'Dedicated Support']
    }
];

async function seed() {
    try {
        await connectToDatabase();
        console.log('Connected to database...');

        for (const planData of plans) {
            console.log(`Upserting plan: ${planData.id}`);
            await Plan.findOneAndUpdate(
                { id: planData.id },
                { $set: planData },
                { upsert: true, new: true }
            );
        }

        console.log('Seeding complete!');
        process.exit(0);
    } catch (err) {
        console.error('Seeding failed:', err);
        process.exit(1);
    }
}

seed();
