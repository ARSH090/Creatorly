import * as dotenv from 'dotenv';
import path from 'path';

// Load environment variables before any other imports
dotenv.config({ path: '.env.local' });

const isDryRun = process.argv.includes('--dry-run');

async function seedPlans() {
    console.log(`Starting seedPlans function... ${isDryRun ? '[DRY RUN]' : ''}`);

    try {
        // Dynamic imports to ensure env vars are loaded first
        const { connectToDatabase } = await import('../src/lib/db/mongodb');
        const { default: Plan } = await import('../src/lib/models/Plan');
        const { PlanTier, BillingPeriod } = await import('../src/lib/models/plan.types');
        const { syncRazorpayPlan } = await import('../src/lib/payments/razorpay');

        console.log('Connecting to database...');
        await connectToDatabase();
        console.log('Connected successfully.');

        const plansToSeed = [
            {
                name: 'Starter',
                description: 'Ideal for growing creators.',
                tier: PlanTier.STARTER,
                billingPeriod: [BillingPeriod.MONTHLY, BillingPeriod.YEARLY],
                monthlyPrice: 99900, // ₹999 in paise
                yearlyPrice: 999900, // ₹9,999 in paise
                maxUsers: 1,
                maxStorageMb: 2048,
                maxAutoDms: 500,
                maxApiCalls: 5000,
                rateLimitPerMin: 50,
                hasAnalytics: true,
                isActive: true,
                isVisible: true,
                sortOrder: 1,
                trialLimits: {
                    maxProducts: 5,
                    transactionFeePercent: 3,
                    hasAutoDM: false
                },
                displayFeatures: ['5 products', '1 booking', '3% fee']
            },
            {
                name: 'Pro',
                description: 'Everything you need to scale.',
                tier: PlanTier.PRO,
                billingPeriod: [BillingPeriod.MONTHLY, BillingPeriod.YEARLY],
                monthlyPrice: 199900, // ₹1,999 in paise
                yearlyPrice: 1999900, // ₹19,999 in paise
                maxUsers: 5,
                maxStorageMb: 10240,
                maxAutoDms: 5000,
                maxApiCalls: 50000,
                rateLimitPerMin: 200,
                hasAnalytics: true,
                hasPrioritySupport: true,
                hasAutoDM: true,
                isActive: true,
                isVisible: true,
                sortOrder: 2,
                trialLimits: {
                    maxProducts: 20,
                    transactionFeePercent: 0,
                    hasAutoDM: true
                },
                displayFeatures: ['Unlimited products', '0% fee', 'AutoDM + AI']
            },
            {
                name: 'Business',
                description: 'For large agencies and teams.',
                tier: PlanTier.BUSINESS,
                billingPeriod: [BillingPeriod.MONTHLY, BillingPeriod.YEARLY],
                monthlyPrice: 399900, // ₹3,999 in paise
                yearlyPrice: 3999900, // ₹39,999 in paise
                maxUsers: 20,
                maxStorageMb: 51200,
                maxAutoDms: 50000,
                maxApiCalls: 500000,
                rateLimitPerMin: 1000,
                hasAnalytics: true,
                hasPrioritySupport: true,
                hasCustomDomain: true,
                hasTeamCollaboration: true,
                hasWebhooks: true,
                isActive: true,
                isVisible: true,
                sortOrder: 3,
                trialLimits: {
                    maxProducts: 100,
                    transactionFeePercent: 0,
                    hasAutoDM: true
                },
                displayFeatures: ['5 team members', 'WhatsApp DM', 'White-label']
            }
        ];

        for (const planData of plansToSeed) {
            console.log(`\nProcessing plan: ${planData.name} (${planData.tier})...`);

            const existingPlan = await Plan.findOne({ tier: planData.tier });

            if (existingPlan) {
                console.log(`Plan already exists. Checking for missing Razorpay IDs or price mismatches...`);
                const updates: any = { ...planData };

                let needsUpdate = false;

                // Check for price mismatch (Rupees vs Paise)
                if (existingPlan.monthlyPrice !== planData.monthlyPrice || existingPlan.yearlyPrice !== planData.yearlyPrice) {
                    console.log(`Price mismatch detected (${existingPlan.monthlyPrice} vs ${planData.monthlyPrice}). Updating to paise...`);
                    needsUpdate = true;
                }

                if (!existingPlan.razorpayMonthlyPlanId || !existingPlan.razorpayYearlyPlanId) {
                    console.log(`Razorpay IDs missing. Syncing...`);

                    if (!isDryRun) {
                        try {
                            if (!existingPlan.razorpayMonthlyPlanId) {
                                const monthlyRp = await syncRazorpayPlan({
                                    name: planData.name,
                                    description: planData.description,
                                    amount: planData.monthlyPrice,
                                    interval: 'monthly'
                                });
                                updates.razorpayMonthlyPlanId = monthlyRp.id;
                                updates.razorpayPlanId = monthlyRp.id; // Legacy
                            }

                            if (!existingPlan.razorpayYearlyPlanId) {
                                const yearlyRp = await syncRazorpayPlan({
                                    name: planData.name,
                                    description: planData.description,
                                    amount: planData.yearlyPrice,
                                    interval: 'yearly'
                                });
                                updates.razorpayYearlyPlanId = yearlyRp.id;
                            }
                            needsUpdate = true;
                        } catch (err: any) {
                            console.error(`⚠️ Razorpay sync failed for ${planData.name}: ${err.message}`);
                            // We still want to update metadata/prices even if sync fails (for local dev)
                            delete updates.razorpayMonthlyPlanId;
                            delete updates.razorpayYearlyPlanId;
                            delete updates.razorpayPlanId;
                        }
                    } else {
                        console.log(`[DRY RUN] Would sync Razorpay IDs for ${planData.name}`);
                    }
                }

                // Always initialize history if it doesn't exist
                if (!existingPlan.razorpayPlanHistory || existingPlan.razorpayPlanHistory.length === 0) {
                    updates.razorpayPlanHistory = [];
                    needsUpdate = true;
                }

                const featuresChanged = JSON.stringify(existingPlan.displayFeatures) !== JSON.stringify(planData.displayFeatures);

                if (!isDryRun && (needsUpdate || featuresChanged)) {
                    await Plan.findOneAndUpdate({ tier: planData.tier }, { $set: updates });
                    console.log(`Updated plan ${planData.name} in MongoDB.`);
                } else if (isDryRun) {
                    console.log(`[DRY RUN] Would update ${planData.name} if needed.`);
                }
            }
            else {
                console.log(`Creating new plan with Razorpay sync...`);

                let monthlyRpId = 'mock_monthly_id';
                let yearlyRpId = 'mock_yearly_id';

                if (!isDryRun) {
                    // Create Monthly Plan in Razorpay
                    const monthlyRp = await syncRazorpayPlan({
                        name: planData.name,
                        description: planData.description,
                        amount: planData.monthlyPrice, // paise
                        interval: 'monthly'
                    });
                    monthlyRpId = monthlyRp.id;

                    // Create Yearly Plan in Razorpay
                    const yearlyRp = await syncRazorpayPlan({
                        name: planData.name,
                        description: planData.description,
                        amount: planData.yearlyPrice, // paise
                        interval: 'yearly'
                    });
                    yearlyRpId = yearlyRp.id;

                    await Plan.create({
                        ...planData,
                        razorpayMonthlyPlanId: monthlyRpId,
                        razorpayYearlyPlanId: yearlyRpId,
                        razorpayPlanId: monthlyRpId, // Legacy
                        razorpayPlanHistory: []
                    });
                    console.log(`Created plan: ${planData.name} with Razorpay IDs: ${monthlyRpId}, ${yearlyRpId}`);
                } else {
                    console.log(`[DRY RUN] Would create plan ${planData.name} and sync with Razorpay`);
                }
            }
        }

        // Handle Free Tier
        const freePlanData = {
            name: 'Free Tier',
            description: 'Perfect for getting started.',
            tier: PlanTier.FREE,
            billingPeriod: [BillingPeriod.MONTHLY],
            monthlyPrice: 0,
            yearlyPrice: 0,
            maxUsers: 1,
            maxStorageMb: 100,
            maxAutoDms: 100,
            maxApiCalls: 1000,
            rateLimitPerMin: 10,
            hasAnalytics: false,
            isActive: true,
            isVisible: true,
            sortOrder: 0
        };

        const existingFree = await Plan.findOne({ tier: PlanTier.FREE });
        if (!existingFree) {
            console.log('\nCreating Free Tier...');
            if (!isDryRun) {
                await Plan.create({ ...freePlanData, razorpayPlanHistory: [] });
                console.log('Free Tier created.');
            } else {
                console.log('[DRY RUN] Would create Free Tier');
            }
        } else {
            console.log('\nFree Tier already exists.');
        }

        console.log('\nSeed script finished successfully!');
        if (!isDryRun) process.exit(0);
    } catch (error) {
        console.error('Seeding failed:', error);
        process.exit(1);
    }
}

seedPlans();
