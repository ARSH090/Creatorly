'use client';

import Link from 'next/link';
import { Check, Zap } from 'lucide-react';

const plans = [
  {
    name: 'Starter',
    price: 0,
    description: 'Perfect for creators just getting started',
    features: [
      'Up to 3 products',
      'Basic storefront',
      'Community support',
      'Standard analytics'
    ],
    cta: 'Get Started Free',
    href: '/sign-up'
  },
  {
    name: 'Pro',
    price: 999,
    description: 'For growing creators ready to scale',
    features: [
      'Unlimited products',
      'Custom domain',
      'Priority support',
      'Advanced analytics',
      'Email marketing',
      'Affiliate program'
    ],
    cta: 'Start Pro Trial',
    href: '/sign-up',
    popular: true
  },
  {
    name: 'Enterprise',
    price: 2999,
    description: 'For established creators and teams',
    features: [
      'Everything in Pro',
      'White-label option',
      'Dedicated support',
      'Custom integrations',
      'Team collaboration',
      'API access'
    ],
    cta: 'Contact Sales',
    href: '/contact'
  }
];

export default function PricingPage() {
  return (
    <div className="min-h-screen bg-[#030303] text-white">
      <div className="max-w-7xl mx-auto px-6 py-24">
        {/* Header */}
        <div className="text-center mb-16">
          <h1 className="text-5xl font-bold tracking-tight mb-6">
            Simple, Transparent <span className="text-indigo-400">Pricing</span>
          </h1>
          <p className="text-xl text-zinc-400 max-w-2xl mx-auto">
            Choose the perfect plan for your creator business. Start free, upgrade as you grow.
          </p>
        </div>

        {/* Pricing Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {plans.map((plan) => (
            <div
              key={plan.name}
              className={`relative bg-zinc-900/50 border rounded-3xl p-8 ${plan.popular
                  ? 'border-indigo-500/50 shadow-2xl shadow-indigo-500/10'
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
                <span className="text-4xl font-bold">₹{plan.price}</span>
                <span className="text-zinc-500">/month</span>
              </div>

              <ul className="space-y-3 mb-8">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-center gap-3 text-zinc-300">
                    <Check size={18} className="text-emerald-400 flex-shrink-0" />
                    <span className="text-sm">{feature}</span>
                  </li>
                ))}
              </ul>

              <Link
                href={plan.href}
                className={`block w-full py-4 text-center rounded-2xl font-bold transition-all ${plan.popular
                    ? 'bg-white text-black hover:bg-zinc-100'
                    : 'bg-white/5 text-white hover:bg-white/10 border border-white/10'
                  }`}
              >
                {plan.cta}
              </Link>
            </div>
          ))}
        </div>

        {/* Comparison Section Header for and SEO/Tests */}
        <div className="mt-24 text-center mb-12">
          <h2 className="text-3xl font-bold">Plan Comparison</h2>
          <p className="text-zinc-400 mt-2">Compare our features and find the best fit for your needs.</p>
        </div>

        {/* FAQ Section */}
        <div className="mt-24 text-center">
          <h2 className="text-3xl font-bold mb-4">Frequently Asked Questions</h2>
          <p className="text-zinc-400 mb-8">
            Have questions? We&apos;re here to help.
          </p>
          <Link
            href="/contact"
            className="text-indigo-400 hover:text-indigo-300 font-medium"
          >
            Contact Support →
          </Link>
        </div>
      </div>
    </div>
  );
}
