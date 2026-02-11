'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { Check, ArrowRight, Loader2, Sparkles, ShieldCheck, Zap } from 'lucide-react';
import { motion } from 'framer-motion';

export default function PricingPage() {
    const [plans, setPlans] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchPlans() {
            try {
                const res = await fetch('/api/plans');
                const data = await res.json();
                setPlans(data.plans || []);
            } catch (error) {
                console.error('Failed to fetch plans:', error);
            } finally {
                setLoading(false);
            }
        }
        fetchPlans();
    }, []);

    return (
        <div className="min-h-screen bg-[#030303] text-white pt-32 pb-20 selection:bg-indigo-500/30">
            <div className="max-w-7xl mx-auto px-6 space-y-20">
                {/* Hero Header */}
                <div className="max-w-3xl space-y-8 text-center mx-auto">
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-rose-500/10 border border-rose-500/20 text-rose-400 text-[10px] font-black uppercase tracking-[0.2em]">
                        <Zap size={12} fill="currentColor" /> Simple Transparent Pricing
                    </div>
                    <h1 className="text-7xl font-black uppercase tracking-tighter italic leading-[0.9]">
                        MONETIZE <br />
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-rose-500 via-indigo-500 to-purple-500">YOUR MAGIC</span> <br />
                        INSTANTLY.
                    </h1>
                    <p className="text-xl text-zinc-500 font-medium max-w-xl mx-auto">
                        Powerful tools for creators of all sizes. Choose the plan that scales with your ambition.
                    </p>
                </div>

                {/* Plans Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {loading ? (
                        [1, 2, 3].map(i => (
                            <div key={i} className="bg-zinc-900/50 animate-pulse h-[30rem] rounded-[2.5rem] border border-white/5" />
                        ))
                    ) : plans.map((plan, idx) => (
                        <motion.div
                            key={plan.id}
                            initial={{ opacity: 0, y: 30 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: idx * 0.1 }}
                            className={`relative group bg-[#0A0A0A] border rounded-[2.5rem] p-10 flex flex-col space-y-10 transition-all hover:border-white/20 ${plan.isPopular ? 'border-indigo-500/50 shadow-[0_0_50px_rgba(99,102,241,0.1)]' : 'border-white/5'
                                }`}
                        >
                            {plan.isPopular && (
                                <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-6 py-2 bg-indigo-500 rounded-full text-[10px] font-black uppercase tracking-widest text-white shadow-xl">
                                    Most Popular
                                </div>
                            )}

                            <div>
                                <h3 className="text-2xl font-black uppercase tracking-tighter italic italic">{plan.name}</h3>
                                <p className="text-zinc-500 text-sm font-medium mt-2">{plan.description}</p>
                            </div>

                            <div className="flex items-baseline gap-2">
                                <span className="text-5xl font-black tracking-tighter italic">₹{plan.price}</span>
                                <span className="text-zinc-600 text-sm font-bold uppercase tracking-widest">/ {plan.interval}</span>
                            </div>

                            <div className="space-y-4 flex-1">
                                {plan.features.map((feature: string, fIdx: number) => (
                                    <div key={fIdx} className="flex items-center gap-3">
                                        <div className="w-5 h-5 rounded-full bg-indigo-500/10 flex items-center justify-center text-indigo-400">
                                            <Check size={12} strokeWidth={4} />
                                        </div>
                                        <span className="text-sm font-bold text-zinc-400">{feature}</span>
                                    </div>
                                ))}
                            </div>

                            <Link
                                href="/auth/register"
                                className={`w-full py-5 rounded-2xl font-black text-xs uppercase tracking-[0.2em] flex items-center justify-center gap-3 transition-all active:scale-95 ${plan.isPopular
                                        ? 'bg-indigo-600 text-white hover:bg-indigo-500 shadow-xl shadow-indigo-500/20'
                                        : 'bg-white/5 text-zinc-400 hover:bg-white/10 border border-white/5'
                                    }`}
                            >
                                Get Started <ArrowRight size={16} />
                            </Link>
                        </motion.div>
                    ))}
                </div>

                {/* Trust Footer */}
                <div className="flex flex-col md:flex-row items-center justify-center gap-12 pt-20 border-t border-white/5">
                    <div className="flex items-center gap-3 text-zinc-600">
                        <ShieldCheck className="w-6 h-6" />
                        <span className="text-[10px] font-black uppercase tracking-widest">No hidden platform fees</span>
                    </div>
                    <div className="flex items-center gap-3 text-zinc-600">
                        <Zap className="w-6 h-6" />
                        <span className="text-[10px] font-black uppercase tracking-widest">Instant Payouts enabled</span>
                    </div>
                </div>
            </div>
        </div>
    );
}
