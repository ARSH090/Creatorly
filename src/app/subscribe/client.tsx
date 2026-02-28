'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
    Loader2, Check, Zap, Shield, Star, ArrowRight,
    Sparkles, Clock, ChevronDown, ChevronUp
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';

declare global {
    interface Window { Razorpay: any; }
}

interface Plan {
    id: string;
    name: string;
    tier: string;
    monthlyPrice: number;
    yearlyPrice: number;
    displayFeatures: string[];
    razorpayMonthlyPlanId?: string;
    razorpayYearlyPlanId?: string;
}

interface SubscribeClientProps {
    plans: Plan[];
    user: { name: string; email: string; contact?: string };
    userId: string;
}

const FAQS = [
    {
        q: 'Will I be charged today?',
        a: 'No. Your 14-day free trial starts immediately. We set up an AutoPay mandate now so your subscription can auto-renew after the trial — but zero is charged today.'
    },
    {
        q: 'Can I cancel before the trial ends?',
        a: 'Yes, anytime. Cancel from your dashboard before Day 14 and you won\'t be charged a single Rupee. No hoops, no calls required.'
    },
    {
        q: 'What payment methods are accepted?',
        a: 'UPI, Credit/Debit cards, Net Banking, and Wallets — powered by Razorpay, India\'s most trusted payment gateway.'
    },
    {
        q: 'Is there a difference between monthly and yearly?',
        a: 'Same features, same access. Yearly saves you 2 months worth of billing — pay once, use all year.'
    },
];

export default function SubscribeClient({ plans, user, userId }: SubscribeClientProps) {
    const router = useRouter();
    const [billing, setBilling] = useState<'monthly' | 'yearly'>('yearly');
    const [isLoading, setIsLoading] = useState<string | null>(null);
    const [coupon, setCoupon] = useState('');
    const [couponApplied, setCouponApplied] = useState(false);
    const [openFaq, setOpenFaq] = useState<number | null>(null);

    // Load Razorpay
    useEffect(() => {
        const s = document.createElement('script');
        s.src = 'https://checkout.razorpay.com/v1/checkout.js';
        s.async = true;
        document.body.appendChild(s);
        return () => { document.body.removeChild(s); };
    }, []);

    const handleSubscribe = async (plan: Plan) => {
        setIsLoading(plan.id);
        try {
            const res = await fetch('/api/subscriptions/create', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    planId: plan.id,
                    interval: billing,
                    couponCode: coupon.trim()
                })
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Failed to initialize subscription');

            if (data.status === 'active') {
                toast.success('🎉 Welcome to Creatorly! Redirecting...');
                router.push('/dashboard');
                return;
            }

            const { razorpaySubscriptionId, razorpayKey } = data;

            const options = {
                key: razorpayKey,
                subscription_id: razorpaySubscriptionId,
                name: 'Creatorly',
                description: `${plan.name} (${billing === 'monthly' ? 'Monthly' : 'Yearly'}) — 14-Day Free Trial`,
                handler: () => {
                    toast.success('🎉 Welcome to Creatorly! Redirecting...');
                    router.push('/dashboard');
                },
                prefill: { name: user.name, email: user.email, contact: user.contact },
                theme: { color: '#6366f1' },
                modal: {
                    ondismiss: () => {
                        setIsLoading(null);
                        toast('Checkout closed', { icon: '⚠️' });
                    }
                }
            };

            const rzp = new window.Razorpay(options);
            rzp.on('payment.failed', (r: any) => {
                toast.error(r.error.description || 'Payment failed. Please try again.');
                setIsLoading(null);
            });
            rzp.open();
        } catch (err: any) {
            toast.error(err.message);
            setIsLoading(null);
        }
    };

    return (
        <div className="min-h-screen bg-[#030303] text-white selection:bg-indigo-500/30 antialiased">
            {/* Ambient glow */}
            <div className="fixed inset-0 pointer-events-none overflow-hidden">
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[900px] h-[500px] bg-indigo-600/10 rounded-full blur-[120px]" />
            </div>

            <div className="relative z-10 max-w-7xl mx-auto px-4 py-12 md:py-20">

                {/* Header */}
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-center mb-14"
                >
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-[10px] font-black uppercase tracking-[0.2em] mb-6">
                        <Sparkles size={11} fill="currentColor" />
                        Zero Risk • 14-Day Free Trial
                    </div>
                    <h1 className="text-5xl md:text-7xl font-black tracking-tight text-white mb-4">
                        Scale Your Influence
                    </h1>
                    <p className="text-zinc-500 text-lg max-w-xl mx-auto uppercase font-black tracking-widest text-xs">
                        Pick a tier. AutoPay setup required. Charged only after 14 days.
                    </p>
                </motion.div>

                {/* Billing Toggle */}
                <div className="flex justify-center mb-16">
                    <div className="bg-zinc-900/80 p-1.5 rounded-2xl border border-white/5 flex gap-1">
                        <button
                            onClick={() => setBilling('monthly')}
                            className={`px-8 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${billing === 'monthly' ? 'bg-white text-black' : 'text-zinc-600 hover:text-white'}`}
                        >
                            Monthly
                        </button>
                        <button
                            onClick={() => setBilling('yearly')}
                            className={`px-8 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all flex items-center gap-2 ${billing === 'yearly' ? 'bg-white text-black' : 'text-zinc-600 hover:text-white'}`}
                        >
                            Yearly
                            <span className="bg-emerald-500/20 text-emerald-400 text-[9px] px-2 py-0.5 rounded-full">Save 20%</span>
                        </button>
                    </div>
                </div>

                {/* Pricing Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-20">
                    {plans.map((plan, idx) => {
                        const price = billing === 'monthly' ? plan.monthlyPrice : plan.yearlyPrice;
                        const label = billing === 'monthly' ? '/mo' : '/yr';
                        const isFeatured = plan.tier === 'pro';

                        return (
                            <motion.div
                                key={plan.id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: idx * 0.1 }}
                                className={`relative rounded-[3rem] p-10 flex flex-col ${isFeatured
                                    ? 'bg-[#0A0A0A] border-2 border-indigo-500/40 shadow-[0_0_80px_rgba(99,102,241,0.15)] scale-105 z-20'
                                    : 'bg-zinc-900/40 border border-white/5 z-10'
                                    }`}
                            >
                                {isFeatured && (
                                    <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-indigo-500 text-white text-[10px] font-black uppercase tracking-[0.2em] px-6 py-2 rounded-full shadow-lg">
                                        Recommended
                                    </div>
                                )}

                                <div className="mb-8">
                                    <p className="text-zinc-500 text-[10px] font-black uppercase tracking-[0.3em] mb-3">{plan.name}</p>
                                    <div className="flex items-baseline gap-1">
                                        <span className="text-5xl font-black italic tracking-tighter">₹{price.toLocaleString('en-IN')}</span>
                                        <span className="text-zinc-600 font-bold text-sm tracking-widest uppercase">{label}</span>
                                    </div>
                                    {billing === 'yearly' && (
                                        <p className="text-emerald-400 text-[10px] font-black uppercase tracking-tighter mt-2">
                                            ₹{Math.round(plan.yearlyPrice / 12).toLocaleString('en-IN')}/mo inclusive
                                        </p>
                                    )}
                                </div>

                                <div className="space-y-4 mb-10 flex-1">
                                    {plan.displayFeatures.map((f, i) => (
                                        <div key={i} className="flex items-center gap-3">
                                            <div className="w-5 h-5 rounded-full bg-indigo-500/10 flex items-center justify-center flex-shrink-0">
                                                <Check size={10} className="text-indigo-400" strokeWidth={4} />
                                            </div>
                                            <span className="text-xs font-bold text-white/80 uppercase tracking-tight">{f}</span>
                                        </div>
                                    ))}
                                </div>

                                <button
                                    onClick={() => handleSubscribe(plan)}
                                    disabled={!!isLoading}
                                    className={`w-full py-5 rounded-2xl font-black text-xs uppercase tracking-[0.2em] transition-all flex items-center justify-center gap-3 ${isFeatured
                                        ? 'bg-white text-black hover:bg-zinc-200'
                                        : 'bg-white/5 border border-white/10 text-white hover:bg-white/10'
                                        }`}
                                >
                                    {isLoading === plan.id ? (
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                    ) : (
                                        <>Deploy Flow <ArrowRight size={14} /></>
                                    )}
                                </button>
                            </motion.div>
                        );
                    })}
                </div>

                {/* Trust & FAQ */}
                <div className="max-w-4xl mx-auto">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-20">
                        {[
                            { icon: Shield, l: 'Secure' },
                            { icon: Clock, l: '14D Trial' },
                            { icon: Star, l: 'Top Rated' },
                            { icon: Zap, l: 'Instant' }
                        ].map((i, idx) => (
                            <div key={idx} className="bg-zinc-900/20 border border-white/5 p-4 rounded-2xl flex items-center justify-center gap-3">
                                <i.icon size={14} className="text-indigo-500" />
                                <span className="text-[10px] font-black text-zinc-600 uppercase tracking-widest">{i.l}</span>
                            </div>
                        ))}
                    </div>

                    <div className="space-y-4">
                        <h3 className="text-center text-xs font-black text-white/20 uppercase tracking-[0.4em] mb-10 text-pretty">Common Queries</h3>
                        {FAQS.map((faq, i) => (
                            <div key={i} className="bg-zinc-900/40 border border-white/5 rounded-3xl overflow-hidden">
                                <button
                                    onClick={() => setOpenFaq(openFaq === i ? null : i)}
                                    className="w-full flex items-center justify-between px-8 py-6 text-left"
                                >
                                    <span className="text-[11px] font-black text-white uppercase tracking-widest">{faq.q}</span>
                                    {openFaq === i ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                                </button>
                                <AnimatePresence>
                                    {openFaq === i && (
                                        <motion.div
                                            initial={{ height: 0, opacity: 0 }}
                                            animate={{ height: 'auto', opacity: 1 }}
                                            exit={{ height: 0, opacity: 0 }}
                                            className="px-8 pb-8 text-xs text-zinc-500 font-bold leading-loose uppercase tracking-tighter"
                                        >
                                            {faq.a}
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>
                        ))}
                    </div>
                </div>

            </div>
        </div>
    );
}
