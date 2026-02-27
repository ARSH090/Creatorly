'use client';

import Link from 'next/link';
import { Check, Zap } from 'lucide-react';
import { useState } from 'react';

const plans = [
  {
    name: 'Starter',
    price: 0,
    description: 'Perfect for creators just getting started',
    trialDays: 14,
    features: [
      'Up to 5 products',
      'Basic storefront',
      'Community support',
      'Standard analytics',
      '14-day Pro trial included'
    ],
    cta: 'Start Free (14-day Pro trial)',
    href: '/auth/register',
    tier: 'free'
  },
  {
    name: 'Pro',
    price: 999,
    period: 'month',
    description: 'For growing creators ready to scale',
    features: [
      'Unlimited products',
      'Custom domain',
      'Priority support',
      'Advanced analytics',
      'Email marketing',
      'Affiliate program',
      'AI tools included',
      'Automation workflows'
    ],
    cta: 'Start Pro Trial',
    href: '/auth/register?plan=pro',
    popular: true,
    tier: 'pro'
  },
  {
    name: 'Enterprise',
    price: 2999,
    period: 'month',
    description: 'For established creators and teams',
    features: [
      'Everything in Pro',
      'White-label option',
      'Dedicated support',
      'Custom integrations',
      'Team collaboration',
      'API access',
      'Advanced reporting',
      'Priority onboarding'
    ],
    cta: 'Contact Sales',
    href: '/contact',
    tier: 'enterprise'
  }
];

export default function PricingPage() {
  const [showRazorpay, setShowRazorpay] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);

  const handleProPayment = (planName: string) => {
    setSelectedPlan(planName);
    setShowRazorpay(true);
    
    // Initialize Razorpay
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    script.onload = () => {
      const options = {
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || 'your_key_id',
        amount: 999 * 100, // Amount in paise (₹999)
        currency: 'INR',
        name: 'Creatorly',
        description: 'Pro Plan Subscription',
        handler: function (response: any) {
          // Handle successful payment
          console.log('Payment successful:', response);
          // Redirect to dashboard or confirmation page
          window.location.href = '/dashboard?payment_id=' + response.razorpay_payment_id;
        },
        prefill: {
          name: 'Creator Name',
          email: 'creator@example.com'
        },
        theme: {
          color: '#4F46E5'
        }
      };

      const rzp = new (window as any).Razorpay(options);
      rzp.open();
    };
    document.body.appendChild(script);
  };

  return (
    <div className="min-h-screen bg-[#030303] text-white">
      <div className="max-w-7xl mx-auto px-6 py-24">
        {/* Header */}
        <div className="text-center mb-16">
          <span className="inline-block px-4 py-2 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-semibold uppercase tracking-wider mb-6">
            Pricing
          </span>
          <h1 className="text-5xl md:text-6xl font-bold tracking-tight mb-6">
            Simple, Transparent <span className="text-indigo-400">Pricing</span>
          </h1>
          <p className="text-xl text-zinc-400 max-w-2xl mx-auto mb-4">
            Start free, upgrade as you grow.
          </p>
          <p className="text-lg text-indigo-400 font-semibold max-w-2xl mx-auto">
            ✨ 14-Day Free Pro Trial Included On All Plans
          </p>
        </div>

        {/* Pricing Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-24">
          {plans.map((plan) => (
            <div
              key={plan.name}
              className={`relative bg-zinc-900/50 border rounded-3xl p-8 h-full flex flex-col ${
                plan.popular
                  ? 'border-indigo-500/50 shadow-2xl shadow-indigo-500/10 md:scale-105'
                  : 'border-white/5'
              }`}
            >
              {plan.popular && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                  <div className="bg-indigo-500 text-white px-4 py-1 rounded-full text-sm font-bold flex items-center gap-1">
                    <Zap size={14} />
                    Most Popular
                  </div>
                </div>
              )}

              <div className="mb-6">
                <h3 className="text-xl font-bold mb-2">{plan.name}</h3>
                <p className="text-zinc-400 text-sm">{plan.description}</p>
              </div>

              <div className="mb-6">
                <div className="flex items-baseline gap-1">
                  <span className="text-4xl font-bold">₹{plan.price}</span>
                  {plan.period && <span className="text-zinc-500">/{plan.period}</span>}
                </div>
                {plan.trialDays && (
                  <p className="text-xs text-indigo-400 mt-2">{plan.trialDays}-day Pro trial included</p>
                )}
              </div>

              <ul className="space-y-3 mb-8 flex-1">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-center gap-3 text-zinc-300">
                    <Check size={18} className="text-emerald-400 shrink-0" />
                    <span className="text-sm">{feature}</span>
                  </li>
                ))}
              </ul>

              {plan.tier === 'pro' ? (
                <button
                  onClick={() => handleProPayment(plan.name)}
                  className={`block w-full py-4 rounded-2xl font-bold transition-all ${
                    plan.popular
                      ? 'bg-white text-black hover:bg-zinc-100'
                      : 'bg-white/5 text-white hover:bg-white/10 border border-white/10'
                  }`}
                >
                  {plan.cta}
                </button>
              ) : (
                <Link
                  href={plan.href}
                  className={`block w-full py-4 rounded-2xl font-bold transition-all text-center ${
                    plan.popular
                      ? 'bg-white text-black hover:bg-zinc-100'
                      : 'bg-white/5 text-white hover:bg-white/10 border border-white/10'
                  }`}
                >
                  {plan.cta}
                </Link>
              )}
            </div>
          ))}
        </div>

        {/* Features Comparison */}
        <div className="mb-24">
          <h2 className="text-3xl font-bold text-center mb-12">Plan Comparison</h2>
          
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-white/10">
                  <th className="py-4 px-4 font-semibold">Feature</th>
                  <th className="py-4 px-4 font-semibold text-center">Starter</th>
                  <th className="py-4 px-4 font-semibold text-center text-indigo-400">Pro</th>
                  <th className="py-4 px-4 font-semibold text-center">Enterprise</th>
                </tr>
              </thead>
              <tbody>
                {[
                  { feature: 'Products', starter: '5', pro: '∞', enterprise: '∞' },
                  { feature: 'Store Builder', starter: '✓', pro: '✓', enterprise: '✓' },
                  { feature: 'Email Marketing', starter: '✗', pro: '✓', enterprise: '✓' },
                  { feature: 'Courses & Memberships', starter: '✗', pro: '✓', enterprise: '✓' },
                  { feature: 'Analytics', starter: 'Basic', pro: 'Advanced', enterprise: 'Enterprise' },
                  { feature: 'Affiliate System', starter: '✗', pro: '✓', enterprise: '✓' },
                  { feature: 'AI Tools', starter: '✗', pro: '✓', enterprise: '✓' },
                  { feature: 'Custom Domain', starter: '✗', pro: '✓', enterprise: '✓' },
                  { feature: 'Automation', starter: '✗', pro: '✓', enterprise: '✓' },
                  { feature: 'Transaction Fee', starter: '2%', pro: '0%', enterprise: '0%' },
                  { feature: 'Support', starter: 'Community', pro: 'Priority', enterprise: 'Dedicated' },
                  { feature: 'API Access', starter: '✗', pro: '✗', enterprise: '✓' }
                ].map((row, idx) => (
                  <tr key={idx} className="border-b border-white/5 hover:bg-white/2 transition-colors">
                    <td className="py-4 px-4 font-medium">{row.feature}</td>
                    <td className="py-4 px-4 text-center text-zinc-400">{row.starter}</td>
                    <td className="py-4 px-4 text-center text-indigo-300 font-semibold">{row.pro}</td>
                    <td className="py-4 px-4 text-center text-zinc-400">{row.enterprise}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* FAQ Section */}
        <div className="bg-gradient-to-r from-indigo-500/10 to-purple-500/10 border border-indigo-500/20 rounded-2xl p-12 text-center">
          <h2 className="text-3xl font-bold mb-4">Frequently Asked Questions</h2>
          <p className="text-zinc-400 mb-8">
            Have pricing questions? We&apos;re here to help.
          </p>
          <Link
            href="/contact"
            className="inline-block text-indigo-400 hover:text-indigo-300 font-medium"
          >
            Contact Support →
          </Link>
        </div>
      </div>
    </div>
  );
}
