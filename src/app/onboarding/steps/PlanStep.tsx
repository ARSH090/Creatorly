'use client';

import { useState, useEffect } from 'react';
import { Check } from 'lucide-react';

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
                <div className="w-10 h-10 rounded-full border-4 border-zinc-100 border-t-indigo-600 animate-spin" />
                <p className="text-sm font-bold text-zinc-400">Loading plans...</p>
            </div>
        );
    }

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-12">
            <div className="text-center space-y-4">
                <h2 className="text-3xl font-black text-zinc-900 tracking-tight leading-tight">
                    Pick your plan, start <br /> earning today 💸
                </h2>

                <div className="space-y-3 text-left max-w-xs mx-auto">
                    <div className="flex items-center gap-2 text-zinc-900 font-bold text-sm">
                        <Check className="text-indigo-600" size={18} strokeWidth={3} />
                        <span>Save thousands by choosing Creatorly</span>
                    </div>
                    <div className="flex items-center gap-2 text-zinc-900 font-bold text-sm">
                        <Check className="text-indigo-600" size={18} strokeWidth={3} />
                        <span>All-In-One store, easy to set up</span>
                    </div>
                </div>
            </div>

            {/* Billing Cycle Toggle */}
            <div className="flex justify-center mb-6">
                <div className="bg-zinc-100 p-1 rounded-xl inline-flex gap-1 shadow-inner relative">
                    <button
                        onClick={() => setCycle('monthly')}
                        className={`px-6 py-2 rounded-lg text-xs font-black uppercase tracking-widest transition-all z-10 ${cycle === 'monthly' ? 'text-indigo-600' : 'text-zinc-400 hover:text-zinc-600'}`}
                    >
                        Monthly
                    </button>
                    <button
                        onClick={() => setCycle('yearly')}
                        className={`px-6 py-2 rounded-lg text-xs font-black uppercase tracking-widest transition-all z-10 ${cycle === 'yearly' ? 'text-indigo-600' : 'text-zinc-400 hover:text-zinc-600'}`}
                    >
                        Yearly
                    </button>
                    {/* Sliding Background */}
                    <div
                        className={`absolute top-1 bottom-1 w-[calc(50%-4px)] bg-white rounded-lg shadow-sm transition-all duration-300 ${cycle === 'monthly' ? 'left-1' : 'left-[50%]'}`}
                    />
                </div>
            </div>

            <div className="grid gap-4">
                {plans.map((plan) => (
                    <div
                        key={plan.id}
                        onClick={() => onSelect(plan, cycle)}
                        className={`relative p-5 bg-white border-2 rounded-2xl cursor-pointer transition-all flex items-center gap-4 ${selectedPlan?.id === plan.id ? 'border-indigo-600 ring-4 ring-indigo-600/10' : 'border-zinc-200 hover:border-zinc-300'} ${plan.id === 'pro' ? 'shadow-lg shadow-indigo-600/5' : ''}`}
                    >
                        {plan.badge && (
                            <div className="absolute -top-3 right-4 bg-indigo-600 text-[10px] font-black uppercase tracking-widest text-white px-3 py-1 rounded-full shadow-lg">
                                {plan.badge}
                            </div>
                        )}
                        <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${selectedPlan?.id === plan.id ? 'border-indigo-600' : 'border-zinc-300'}`}>
                            {selectedPlan?.id === plan.id && <div className="w-3 h-3 bg-indigo-600 rounded-full" />}
                        </div>
                        <div className="flex-1">
                            <div className="flex items-center gap-2">
                                <h3 className="text-lg font-black text-zinc-900">{plan.name}</h3>
                                {plan.id === 'pro' && <span className="text-indigo-600 text-[10px] font-black uppercase tracking-widest bg-indigo-50 px-2 py-0.5 rounded-full">Best Value</span>}
                            </div>
                            <p className="text-zinc-500 font-bold text-sm">
                                {cycle === 'monthly'
                                    ? `₹0 for 14 days, then ${plan.monthly.display}/mo`
                                    : `₹0 for 14 days, then ${plan.yearly.display}/yr`}
                            </p>
                            {cycle === 'yearly' && plan.yearly.savings && (
                                <p className="text-emerald-600 text-[10px] font-black uppercase tracking-widest mt-1">
                                    {plan.yearly.savings}
                                </p>
                            )}
                        </div>
                    </div>
                ))}
            </div>

            <div className="text-center py-4 bg-zinc-50 rounded-2xl border border-zinc-100">
                <p className="text-zinc-500 font-bold text-sm uppercase tracking-widest mb-1">Due today</p>
                <p className="text-zinc-900 font-black text-3xl tracking-tighter">
                    ₹0 <span className="text-zinc-400 text-lg ml-1">🙌</span>
                </p>
                <p className="text-zinc-400 text-[10px] font-bold mt-1 tracking-wider uppercase">14-Day Free Trial Starts Now</p>
            </div>

            <div className="pt-4">
                <button
                    onClick={() => {
                        if (selectedPlan) onSelect(selectedPlan, cycle);
                    }}
                    disabled={!selectedPlan}
                    className="w-full py-5 bg-indigo-600 text-white rounded-[2rem] font-bold text-lg shadow-xl shadow-indigo-600/20 hover:bg-indigo-700 active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {selectedPlan ? 'Start 14-Day Free Trial' : 'Select a Plan'}
                </button>
            </div>
        </div>
    );
}
