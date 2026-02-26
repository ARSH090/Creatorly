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
                    <h2 className="text-3xl sm:text-5xl font-semibold text-white mb-6">Simple, transparent pricing.</h2>
                    <p className="text-zinc-500">Start for free. Upgrade as you scale.</p>
                </div>

                <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
                    {/* Free Plan */}
                    <div className="p-8 rounded-3xl border border-white/10 bg-zinc-900/30 flex flex-col">
                        <h3 className="text-xl font-bold text-white mb-2">Creator</h3>
                        <div className="flex items-baseline gap-1 mb-6">
                            <span className="text-4xl font-bold text-white">₹0</span>
                            <span className="text-zinc-500">/month</span>
                        </div>
                        <p className="text-zinc-400 text-sm mb-8">Perfect for getting started.</p>

                        <ul className="space-y-4 mb-8 flex-1">
                            {["Unlimited Links", "Basic Analytics", "Link Thumbnails", "Standard Support"].map((feat, i) => (
                                <li key={i} className="flex gap-3 text-sm text-zinc-300">
                                    <Check className="w-5 h-5 text-indigo-500" /> {feat}
                                </li>
                            ))}
                        </ul>

                        <Link href="/auth/register" target="_blank" rel="noopener noreferrer" className="w-full py-4 rounded-xl bg-white/10 text-white font-bold text-center hover:bg-white/20 transition-colors">
                            Start for Free
                        </Link>
                    </div>

                    {/* Pro Plan */}
                    <div className="p-8 rounded-3xl border border-indigo-500/30 bg-indigo-500/5 flex flex-col relative overflow-hidden">
                        <div className="absolute top-0 right-0 bg-indigo-500 text-white text-xs font-bold px-3 py-1 rounded-bl-xl">POPULAR</div>

                        <h3 className="text-xl font-bold text-white mb-2">Pro</h3>
                        <div className="flex items-baseline gap-1 mb-6">
                            <span className="text-4xl font-bold text-white">₹499</span>
                            <span className="text-zinc-500">/month</span>
                        </div>
                        <p className="text-zinc-400 text-sm mb-8">For serious creators scaling up.</p>

                        <ul className="space-y-4 mb-8 flex-1">
                            {["Everything in Free", "0% Transaction Fees", "Custom Domain", "Advanced Analytics", "Email Collection", "Priority Support"].map((feat, i) => (
                                <li key={i} className="flex gap-3 text-sm text-zinc-300">
                                    <Check className="w-5 h-5 text-indigo-400" /> {feat}
                                </li>
                            ))}
                        </ul>

                        <Link href="/auth/register" target="_blank" rel="noopener noreferrer" className="w-full py-4 rounded-xl bg-indigo-600 text-white font-bold text-center hover:bg-indigo-500 transition-colors shadow-lg shadow-indigo-500/20">
                            Get Pro
                        </Link>
                    </div>
                </div>
            </div>
        </section>
    );
};

export default PricingPreviewSection;
