'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Check, ArrowRight } from 'lucide-react';
import type { PricingTableSettings } from '@/types/storefront-blocks.types';

interface Props {
    settings: PricingTableSettings;
    theme: Record<string, string>;
}

export default function PricingTableWidget({ settings, theme }: Props) {
    // Fallback plans for preview
    const plans = settings.plans?.length ? settings.plans : [
        {
            id: '1',
            name: 'Basic',
            price: '₹999',
            features: ['Live Sessions', 'Email Support', 'Basic Templates'],
            buttonText: 'Get Started',
        },
        {
            id: '2',
            name: 'Pro',
            price: '₹2,499',
            features: ['Everything in Basic', '1-on-1 Coaching', 'Custom Branded Store', 'Priority Support'],
            isFeatured: true,
            buttonText: 'Go Pro',
        },
        {
            id: '3',
            name: 'Enterprise',
            price: '₹9,999',
            features: ['Unlimited Everything', 'Dedicated Manager', 'API Access', 'Custom Integrations'],
            buttonText: 'Contact Us',
        }
    ];

    return (
        <div className="space-y-8">
            {settings.title && (
                <h2 className="text-3xl font-black text-center tracking-tighter" style={{ color: theme.textColor }}>
                    {settings.title}
                </h2>
            )}

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {plans.map((plan, idx) => (
                    <motion.div
                        key={plan.id}
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        transition={{ delay: idx * 0.1 }}
                        viewport={{ once: true }}
                        className={`
                            relative p-8 rounded-[calc(var(--border-radius)*2)] border flex flex-col transition-all duration-500
                            ${plan.isFeatured ? 'bg-white/[0.05] border-indigo-500/50 scale-105 z-10 shadow-2xl shadow-indigo-500/10' : 'bg-white/[0.02] border-white/5 hover:border-white/10'}
                        `}
                        style={{
                            borderRadius: `${Number(theme.borderRadius) * 2}px`
                        }}
                    >
                        {plan.isFeatured && (
                            <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                                <span className="bg-indigo-500 text-white text-[10px] font-black uppercase tracking-widest px-4 py-1.5 rounded-full shadow-lg">
                                    Most Popular
                                </span>
                            </div>
                        )}

                        <div className="mb-6">
                            <h3 className="text-xl font-black mb-1 uppercase tracking-tight" style={{ color: theme.textColor }}>
                                {plan.name}
                            </h3>
                            <div className="flex items-baseline gap-1">
                                <span className="text-3xl font-black tracking-tighter" style={{ color: theme.primaryColor }}>{plan.price}</span>
                                <span className="text-xs font-bold text-zinc-500 uppercase tracking-widest">/ lifelong</span>
                            </div>
                        </div>

                        <ul className="space-y-4 mb-8 flex-1">
                            {plan.features.map((feature, fidx) => (
                                <li key={fidx} className="flex gap-3 text-sm">
                                    <Check size={16} className="text-indigo-400 shrink-0" />
                                    <span className="opacity-70">{feature}</span>
                                </li>
                            ))}
                        </ul>

                        <button
                            className={`
                                w-full py-4 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all hover:scale-[1.02] active:scale-[0.98]
                                ${plan.isFeatured ? 'bg-indigo-500 text-white shadow-xl shadow-indigo-500/20' : 'bg-white/5 text-white hover:bg-white/10 border border-white/10'}
                            `}
                            onClick={() => plan.url && window.open(plan.url, '_blank')}
                        >
                            {plan.buttonText || 'Choose Plan'}
                            <ArrowRight size={16} />
                        </button>
                    </motion.div>
                ))}
            </div>
        </div>
    );
}
