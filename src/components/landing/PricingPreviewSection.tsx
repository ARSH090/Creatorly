'use client';

import React from 'react';
import Link from 'next/link';
import { Check } from 'lucide-react';

const PricingPreviewSection: React.FC = () => {
    return (
        <section className="py-24 px-6 bg-black relative">
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(99,102,241,0.15),transparent_70%)] pointer-events-none" />

            <div className="max-w-5xl mx-auto relative z-10">
                <div className="text-center mb-16">
                    <span className="inline-block px-4 py-2 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-semibold uppercase tracking-wider mb-6">
                        Pricing
                    </span>
                    <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">Simple, transparent pricing.</h2>
                    <p className="text-zinc-500 text-lg mb-3">Start free, upgrade as you grow.</p>
                    <p className="text-indigo-400 font-semibold text-lg">✨ 14-Day Free Pro Trial Included</p>
                </div>

                <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto mb-12">
                    {/* Free Plan */}
                    <div className="p-8 rounded-3xl border border-white/10 bg-zinc-900/30 flex flex-col">
                        <h3 className="text-xl font-bold text-white mb-2">Starter</h3>
                        <div className="flex items-baseline gap-1 mb-2">
                            <span className="text-4xl font-bold text-white">₹0</span>
                            <span className="text-zinc-500">/month</span>
                        </div>
                        <p className="text-xs text-indigo-400 mb-6">14-day Pro trial included</p>
                        <p className="text-zinc-400 text-sm mb-8">Perfect for getting started.</p>

                        <ul className="space-y-4 mb-8 flex-1">
                            {["5 Products", "Basic Analytics", "Store Builder", "Community Support"].map((feat, i) => (
                                <li key={i} className="flex gap-3 text-sm text-zinc-300">
                                    <Check className="w-5 h-5 text-indigo-500 shrink-0" /> {feat}
                                </li>
                            ))}
                        </ul>

                        <Link href="/auth/register" target="_blank" rel="noopener noreferrer" className="w-full py-4 rounded-xl bg-white/10 text-white font-bold text-center hover:bg-white/20 transition-colors">
                            Start Free
                        </Link>
                    </div>

                    {/* Pro Plan */}
                    <div className="p-8 rounded-3xl border border-indigo-500/30 bg-indigo-500/5 flex flex-col relative overflow-hidden">
                        <div className="absolute top-0 right-0 bg-indigo-500 text-white text-xs font-bold px-3 py-1 rounded-bl-xl">POPULAR</div>

                        <h3 className="text-xl font-bold text-white mb-2">Pro</h3>
                        <div className="flex items-baseline gap-1 mb-6">
                            <span className="text-4xl font-bold text-white">₹999</span>
                            <span className="text-zinc-500">/month</span>
                        </div>
                        <p className="text-zinc-400 text-sm mb-8">For serious creators scaling up.</p>

                        <ul className="space-y-4 mb-8 flex-1">
                            {["Unlimited Products", "0% Transaction Fees", "Custom Domain", "Advanced Analytics", "Email Marketing", "Affiliate Program"].map((feat, i) => (
                                <li key={i} className="flex gap-3 text-sm text-zinc-300">
                                    <Check className="w-5 h-5 text-indigo-400 shrink-0" /> {feat}
                                </li>
                            ))}
                        </ul>

                        <button className="w-full py-4 rounded-xl bg-indigo-600 text-white font-bold text-center hover:bg-indigo-500 transition-colors shadow-lg shadow-indigo-500/20">
                            Start Pro Trial
                        </button>
                    </div>
                </div>

                {/* View Full Pricing Link */}
                <div className="text-center">
                    <Link
                        href="/pricing"
                        className="text-indigo-400 hover:text-indigo-300 font-bold text-lg transition-colors"
                    >
                        View Full Pricing & Comparison Table →
                    </Link>
                </div>
            </div>
        </section>
    );
};

export default PricingPreviewSection;
