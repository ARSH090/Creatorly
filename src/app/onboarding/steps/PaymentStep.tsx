'use client';

import { useState } from 'react';
import { ShieldCheck, Zap, ArrowLeft, Loader2, CreditCard } from 'lucide-react';
import Script from 'next/script';

interface PaymentStepProps {
    data: any;
    onBack: () => void;
}

export default function PaymentStep({ data, onBack }: PaymentStepProps) {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handlePayment = async () => {
        setLoading(true);
        setError('');

        try {
            // 1. Create Subscription Mandate on Backend
            const res = await fetch('/api/onboarding/subscription/create', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    planId: data.selectedPlan.id,
                    cycle: data.billingCycle,
                    userData: {
                        username: data.username,
                        fullName: data.fullName,
                        email: data.email,
                        password: data.password
                    }
                })
            });

            const result = await res.json();
            if (!res.ok) throw new Error(result.error || 'Failed to initialize payment');

            const { subscriptionId, apiKey } = result;

            // 2. Open Razorpay Checkout
            const options = {
                key: apiKey,
                subscription_id: subscriptionId,
                name: "Creatorly",
                description: `${data.selectedPlan.name} Plan - 14 Day Free Trial`,
                image: "https://creatorly.in/logo.png",
                handler: async function (response: any) {
                    // Verification and account creation happens on backend via webhook
                    // but we can also call a dedicated verify endpoint for immediate redirect
                    setLoading(true);
                    try {
                        const verifyRes = await fetch('/api/onboarding/complete', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                                razorpay_payment_id: response.razorpay_payment_id,
                                razorpay_subscription_id: response.razorpay_subscription_id,
                                razorpay_signature: response.razorpay_signature,
                                onboardingData: {
                                    username: data.username,
                                    fullName: data.fullName,
                                    email: data.email,
                                    password: data.password,
                                    plan: data.selectedPlan.id,
                                    cycle: data.billingCycle
                                }
                            })
                        });

                        if (verifyRes.ok) {
                            window.location.href = '/dashboard?new_store=true';
                        } else {
                            const verifyData = await verifyRes.json();
                            throw new Error(verifyData.error || 'Verification failed');
                        }
                    } catch (err: any) {
                        setError(err.message);
                        setLoading(false);
                    }
                },
                prefill: {
                    name: data.fullName,
                    email: data.email
                },
                theme: { color: "#6366f1" }
            };

            const rzp = new (window as any).Razorpay(options);
            rzp.on('payment.failed', function (response: any) {
                setError(response.error.description);
                setLoading(false);
            });
            rzp.open();

        } catch (err: any) {
            setError(err.message);
            setLoading(false);
        }
    };

    const trialEndDate = new Date();
    trialEndDate.setDate(trialEndDate.getDate() + 14);
    const formattedDate = trialEndDate.toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'long',
        year: 'numeric'
    });

    return (
        <div className="space-y-8">
            <Script src="https://checkout.razorpay.com/v1/checkout.js" />

            <div className="text-center space-y-4">
                <div className="mx-auto w-16 h-16 bg-emerald-500/10 rounded-full flex items-center justify-center text-emerald-400 mb-4 ring-4 ring-emerald-500/5">
                    <ShieldCheck size={32} />
                </div>
                <h2 className="text-3xl font-black text-white italic tracking-tight underline decoration-emerald-500 decoration-4 underline-offset-8">
                    One Last Step!
                </h2>
                <div className="pt-6 space-y-1">
                    <p className="text-zinc-500 text-xs font-black uppercase tracking-widest italic">
                        Your store runs 100% free till
                    </p>
                    <p className="text-xl font-black text-white italic tracking-tighter">
                        {formattedDate} 🗓️
                    </p>
                </div>
            </div>

            <div className="bg-white/3 border border-indigo-500/20 rounded-3xl p-6 space-y-6">
                <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest text-zinc-500">
                    <span>Selected Plan</span>
                    <span className="text-indigo-400">{data.selectedPlan.name} ({data.billingCycle})</span>
                </div>

                <div className="h-[1px] w-full bg-white/5" />

                <div className="space-y-4">
                    <div className="flex justify-between items-center">
                        <span className="text-sm font-bold text-white uppercase tracking-widest">Due Today</span>
                        <span className="text-2xl font-black text- emerald-500 italic">₹0.00</span>
                    </div>
                    <p className="text-[9px] text-zinc-600 font-medium leading-relaxed">
                        A ₹1 verification may be charged and refunded immediately to setup your autopay mandate.
                        No charges will be made until your trial ends on {formattedDate}.
                    </p>
                </div>
            </div>

            {error && (
                <div className="p-4 bg-rose-500/10 border border-rose-500/20 rounded-2xl">
                    <p className="text-[10px] text-rose-500 font-bold uppercase tracking-widest text-center italic">
                        ✗ {error}
                    </p>
                </div>
            )}

            <div className="space-y-4 pt-4">
                <button
                    onClick={handlePayment}
                    disabled={loading}
                    className="w-full py-5 bg-indigo-600 text-white rounded-3xl font-black text-xs uppercase tracking-[0.2em] hover:bg-indigo-500 active:scale-[0.98] transition-all shadow-2xl shadow-indigo-500/30 flex items-center justify-center gap-3"
                >
                    {loading ? (
                        <>
                            <Loader2 className="w-5 h-5 animate-spin" />
                            Initializing...
                        </>
                    ) : (
                        <>
                            <Zap size={18} fill="currentColor" /> Start Your 14 Day Free Trial
                        </>
                    )}
                </button>

                <button
                    onClick={onBack}
                    disabled={loading}
                    className="w-full py-4 text-zinc-600 hover:text-zinc-400 font-black text-[10px] uppercase tracking-[0.3em] transition-all flex items-center justify-center gap-2"
                >
                    <ArrowLeft size={14} /> Back to plans
                </button>
            </div>

            <div className="flex items-center justify-center gap-6 opacity-30 grayscale hover:grayscale-0 transition-all">
                <CreditCard size={24} className="text-white" />
                <p className="text-[8px] font-black uppercase tracking-widest text-white leading-tight">
                    Razorpay Secure <br /> Autopay Enabled
                </p>
            </div>
        </div>
    );
}
