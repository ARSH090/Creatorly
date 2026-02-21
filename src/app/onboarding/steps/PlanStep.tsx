'use client';

import { useState, useEffect } from 'react';
import { Check, Flame, Zap, Briefcase, Loader2, ArrowLeft } from 'lucide-react';

interface PlanStepProps {
    selectedPlan: any;
    billingCycle: 'monthly' | 'yearly';
    onSelect: (plan: any, cycle: 'monthly' | 'yearly') => void;
    onBack: () => void;
}

export default function PlanStep({ selectedPlan, billingCycle, onSelect, onBack }: PlanStepProps) {
    const [plans, setPlans] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [cycle, setCycle] = useState<'monthly' | 'yearly'>(billingCycle);

    useEffect(() => {
        fetchPlans();
    }, []);

    const fetchPlans = async () => {
        try {
            const res = await fetch('/api/onboarding/plans');
            const data = await res.json();
            setPlans(data.plans || []);
        } catch (err) {
            console.error('Failed to fetch plans');
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center py-20 space-y-4">
                <Loader2 className="w-10 h-10 animate-spin text-indigo-500" />
                <p className="text-xs font-black uppercase tracking-widest text-zinc-600">Loading premium plans...</p>
            </div>
        );
    }

    return (
        <div className="space-y-8">
            <div className="text-center space-y-4">
                <h2 className="text-3xl font-black text-white italic tracking-tight">
                    Pick your plan, start earning today 💸
                </h2>

                {/* Toggle */}
                <div className="inline-flex items-center p-1 bg-white/5 border border-white/10 rounded-2xl">
                    <button
                        onClick={() => setCycle('monthly')}
                        className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${cycle === 'monthly' ? 'bg-indigo-600 text-white shadow-lg' : 'text-zinc-500 hover:text-zinc-300'
                            }`}
                    >
                        Monthly
                    </button>
                    <button
                        onClick={() => setCycle('yearly')}
                        className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all relative ${cycle === 'yearly' ? 'bg-indigo-600 text-white shadow-lg' : 'text-zinc-500 hover:text-zinc-300'
                            }`}
                    >
                        Yearly
                        <span className="absolute -top-3 -right-3 bg-emerald-500 text-[8px] px-2 py-0.5 rounded-full text-white ring-2 ring-[#030303]">
                            SAVE 20%
                        </span>
                    </button>
                </div>
            </div>

            <div className="grid gap-4">
                {plans.map((plan) => (
                    <div
                        key={plan.id}
                        onClick={() => onSelect(plan, cycle)}
                        className={`relative p-6 bg-white/3 border-2 rounded-3xl cursor-pointer transition-all hover:bg-white/5 group ${selectedPlan?.id === plan.id ? 'border-indigo-500 bg-indigo-500/5' : 'border-white/5'
                            }`}
                    >
                        {plan.badge && (
                            <div className="absolute -top-3 left-6 px-3 py-1 bg-indigo-600 text-[8px] font-black uppercase tracking-widest text-white rounded-full flex items-center gap-1 shadow-lg shadow-indigo-500/20">
                                <Flame size={10} fill="currentColor" /> {plan.badge}
                            </div>
                        )}

                        <div className="flex justify-between items-start mb-6">
                            <div>
                                <h3 className="text-xl font-black text-white italic group-hover:text-indigo-400 transition-colors uppercase tracking-tight">
                                    {plan.name}
                                </h3>
                                <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest">{plan.description || 'Professional features'}</p>
                            </div>
                            <div className="text-right">
                                <div className="text-2xl font-black text-white italic tracking-tighter">
                                    {cycle === 'monthly' ? plan.monthly.display : plan.yearly.display}
                                </div>
                                <div className="text-[9px] text-zinc-600 font-black uppercase tracking-widest font-mono italic">
                                    / {cycle === 'monthly' ? 'month' : 'year'}
                                </div>
                            </div>
                        </div>

                        <div className="space-y-3">
                            {plan.features.slice(0, 4).map((feature: any, i: number) => (
                                <div key={i} className="flex items-center gap-3 text-xs leading-none">
                                    <div className={`p-1 rounded-full ${feature.included ? 'bg-emerald-500/10 text-emerald-500' : 'bg-red-500/10 text-red-500'}`}>
                                        <Check size={10} />
                                    </div>
                                    <span className={feature.included ? 'text-zinc-300 font-bold uppercase tracking-widest text-[9px]' : 'text-zinc-600 line-through font-bold uppercase tracking-widest text-[9px]'}>
                                        {feature.name} {feature.value && <span className="text-white ml-1">({feature.value})</span>}
                                    </span>
                                </div>
                            ))}
                        </div>

                        {selectedPlan?.id === plan.id && (
                            <div className="mt-6 p-3 bg-indigo-500/10 border border-indigo-500/20 rounded-2xl">
                                <p className="text-center text-[10px] font-black text-indigo-400 uppercase tracking-widest flex items-center justify-center gap-2">
                                    <Zap size={12} fill="currentColor" /> Selected — Due today ₹0 🙌
                                </p>
                            </div>
                        )}
                    </div>
                ))}
            </div>

            <div className="pt-4 space-y-4">
                <button
                    onClick={onBack}
                    className="w-full py-4 text-zinc-600 hover:text-zinc-400 font-black text-[10px] uppercase tracking-[0.3em] transition-all flex items-center justify-center gap-2"
                >
                    <ArrowLeft size={14} /> Back to details
                </button>

                <div className="text-center p-4 bg-white/2 border border-white/5 rounded-3xl">
                    <p className="text-[9px] text-zinc-600 font-black uppercase tracking-[0.2em] leading-relaxed">
                        Free for 14 days • Cancel anytime <br />
                        <span className="text-indigo-500/50 italic font-medium">Safe & Secure Payment via Razorpay</span>
                    </p>
                </div>
            </div>
        </div>
    );
}
