const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config({ path: '.env.local' });

const PlanSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  description: { type: String, default: '' },
  badge: { type: String, default: '' },
  isActive: { type: Boolean, default: true },
  isHighlighted: { type: Boolean, default: false },
  displayOrder: { type: Number, default: 0 },
  price: { type: Number, required: true },
  currency: { type: String, default: 'INR' },
  razorpayPlanId: { type: String, default: null },
  limits: { type: mongoose.Schema.Types.Mixed },
  features: [{ type: String }],
}, { timestamps: true });

const Plan = mongoose.models.Plan || mongoose.model('Plan', PlanSchema);

async function runSeeder() {
  console.log('Connecting to MongoDB...');
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('Connected.');

  console.log('Clearing old plans (Fresh start)...');
  await Plan.deleteMany({});
  console.log('Old plans cleared.');

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
      price: 99900,
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
      price: 199900,
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
  console.log('SUCCESS: Seeded 3 plans.');
  process.exit(0);
}

runSeeder().catch(err => {
    console.error('SEED FAILED:', err);
    process.exit(1);
});
