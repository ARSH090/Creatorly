import { connectToDatabase } from '@/lib/db/mongodb';
import Plan from '@/lib/models/Plan';

export async function seedDefaultPlans() {
    await connectToDatabase();

    const count = await Plan.countDocuments();
    if (count > 0) {
        console.log('Plans already exist. Skipping seed.');
        return { skipped: true, existingCount: count };
    }

    const defaultPlans = [
        {
            id: 'free',
            name: 'Free',
            description: 'Perfect to get started. No credit card.',
            badge: '',
            isActive: true,
            isHighlighted: false,
            displayOrder: 0,
            price: 0,
            currency: 'INR',
            razorpayPlanId: null,
            limits: {
                products: 5,
                stores: 1,
                emailSubscribers: 100,
                emailCampaigns: 2,
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
            features: [
                '5 products',
                '1 store',
                '100 email subscribers',
                '5% transaction fee',
                'Basic analytics (7 days)',
                '5 scheduled posts',
            ]
        },
        {
            id: 'pro',
            name: 'Pro',
            description: 'For serious creators scaling revenue.',
            badge: 'Most Popular',
            isActive: true,
            isHighlighted: true,
            displayOrder: 1,
            price: 99900,       // ₹999/month in paise
            currency: 'INR',
            razorpayPlanId: null,
            limits: {
                products: 50,
                stores: 3,
                emailSubscribers: 5000,
                emailCampaigns: 20,
                autoDMAutomations: 10,
                scheduledPosts: 50,
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
                prioritySupport: false,
                whiteLabel: false,
            },
            features: [
                '50 products',
                '3 stores',
                '5,000 email subscribers',
                '2% transaction fee',
                'Custom domain',
                'AutoDM Hub',
                'Schedulify',
                'Email marketing',
                'Affiliate system',
                'Analytics (90 days)',
                'AI tools (100/mo)',
            ]
        },
        {
            id: 'elite',
            name: 'Elite',
            description: 'For full creator businesses.',
            badge: 'Best Value',
            isActive: true,
            isHighlighted: false,
            displayOrder: 2,
            price: 199900,      // ₹1,999/month in paise
            currency: 'INR',
            razorpayPlanId: null,
            limits: {
                products: -1,
                stores: -1,
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
            features: [
                'Unlimited products',
                'Unlimited stores',
                'Unlimited subscribers',
                '0% transaction fee',
                'Everything in Pro',
                'Priority support',
                'White label',
                'Analytics (1 year)',
            ]
        }
    ];

    await Plan.insertMany(defaultPlans);

    console.log('Default plans seeded.');
    return { seeded: true, count: defaultPlans.length };
}

// Self-invoking if run directly (uncomment for manual script use)
// seedDefaultPlans().then(() => process.exit(0)).catch(err => { console.error(err); process.exit(1); });
