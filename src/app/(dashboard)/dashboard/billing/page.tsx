'use client';

import React, { useState, useEffect } from 'react';
import {
    CreditCard, Check, Sparkles, AlertCircle,
    ArrowRight, Download, Calendar, Zap, Shield
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';

export default function BillingPage() {
    const { user } = useAuth();
    const [loading, setLoading] = useState(true);
    const [subscription, setSubscription] = useState<any>(null);
    const [plans, setPlans] = useState<any[]>([]);
    const [history, setHistory] = useState<any[]>([]);

    useEffect(() => {
        async function loadBilling() {
            try {
                // Fetch live plans
                const [plansRes, subRes, historyRes] = await Promise.all([
                    fetch('/api/plans'),
                    fetch('/api/creator/subscription'),
                    fetch('/api/creator/billing/history')
                ]);

                const plansData = await plansRes.json();
                const subData = await subRes.json();
                const historyData = await historyRes.json();

                setPlans(plansData.plans || []);
                setHistory(historyData.history || []);

                if (subData.subscription) {
                    const sub = subData.subscription;
                    const planInfo = (plansData.plans || []).find((p: any) => p.tier === sub.plan) || {};

                    setSubscription({
                        planName: planInfo.name || sub.plan.charAt(0).toUpperCase() + sub.plan.slice(1),
                        status: sub.isExpired ? 'expired' : 'active',
                        price: planInfo.price || 0,
                        billingPeriod: planInfo.interval === 'year' ? 'yearly' : 'monthly',
                        nextBillingDate: sub.expiresAt ? new Date(sub.expiresAt).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric'
                        }) : 'Never',
                        features: planInfo.features || [
                            'Unlimited Storefronts',
                            'Basic Analytics'
                        ],
                        limits: sub.limits
                    });
                }
            } catch (err) {
                console.error('Failed to load billing details:', err);
            } finally {
                setLoading(false);
            }
        }

        if (user) {
            loadBilling();
        }
    }, [user]);

    if (loading) return <div className="animate-pulse">Loading...</div>;

    return (
        <div className="max-w-6xl mx-auto space-y-8 pb-12">
            <div>
                <h1 className="text-3xl font-black text-white mb-2">Billing & Subscription</h1>
                <p className="text-zinc-500">Manage your plan, payment methods, and billing history.</p>
            </div>

            {/* Current Plan Overview */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 space-y-8">
                    <div className="bg-gradient-to-br from-indigo-900/40 to-purple-900/40 rounded-3xl p-8 border border-white/5 relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 blur-[100px] rounded-full -mr-16 -mt-16" />

                        <div className="relative z-10 flex flex-col md:flex-row justify-between gap-8">
                            <div>
                                <div className="flex items-center gap-2 mb-4">
                                    <span className="px-3 py-1 bg-white/10 text-white text-[10px] font-bold uppercase tracking-widest rounded-full border border-white/10">
                                        Current Plan
                                    </span>
                                    {subscription?.status === 'active' && (
                                        <span className="px-3 py-1 bg-emerald-500/10 text-emerald-400 text-[10px] font-bold uppercase tracking-widest rounded-full border border-emerald-500/20">
                                            Active
                                        </span>
                                    )}
                                </div>
                                <h2 className="text-4xl font-black text-white mb-2">{subscription?.planName}</h2>
                                <p className="text-zinc-300 text-sm mb-6 max-w-md">
                                    You are currently on the {subscription?.planName} plan. Your next payment of ₹{subscription?.price} is scheduled for {subscription?.nextBillingDate}.
                                </p>
                                <div className="flex flex-wrap gap-4">
                                    <button className="px-6 py-2 bg-white text-black text-xs font-black uppercase tracking-wider rounded-xl hover:bg-zinc-200 transition-colors">
                                        Upgrade Plan
                                    </button>
                                    <button className="px-6 py-2 bg-transparent border border-white/10 text-white text-xs font-black uppercase tracking-wider rounded-xl hover:bg-white/5 transition-colors">
                                        Cancel Subscription
                                    </button>
                                </div>
                            </div>

                            <div className="bg-black/40 backdrop-blur-xl rounded-2xl p-6 border border-white/10 min-w-[240px]">
                                <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-widest mb-4">Plan Features</h3>
                                <ul className="space-y-3">
                                    {subscription?.features.map((feature: string, i: number) => (
                                        <li key={i} className="flex items-center gap-3 text-sm text-zinc-300">
                                            <div className="w-4 h-4 rounded-full bg-emerald-500/20 flex items-center justify-center">
                                                <Check className="w-3 h-3 text-emerald-400" />
                                            </div>
                                            {feature}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        </div>
                    </div>

                    {/* Payment Method */}
                    <div className="bg-zinc-900/50 rounded-3xl p-8 border border-white/5">
                        <div className="flex items-center justify-between mb-8">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-indigo-500/10 rounded-lg">
                                    <CreditCard className="w-5 h-5 text-indigo-400" />
                                </div>
                                <h3 className="text-lg font-bold text-white">Payment Method</h3>
                            </div>
                            <button className="text-xs font-bold text-indigo-400 hover:text-indigo-300 transition-colors">
                                Add New Card
                            </button>
                        </div>

                        <div className="p-6 bg-black rounded-2xl border border-white/5 flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-8 bg-zinc-800 rounded flex items-center justify-center font-bold text-[10px] text-zinc-400">
                                    VISA
                                </div>
                                <div>
                                    <p className="text-white font-bold text-sm">•••• •••• •••• 4242</p>
                                    <p className="text-xs text-zinc-500">Expires 12/26</p>
                                </div>
                            </div>
                            <span className="px-3 py-1 bg-white/5 text-zinc-400 text-[10px] font-bold rounded uppercase">Default</span>
                        </div>
                    </div>
                </div>

                {/* Right: Quick Stats & Security */}
                <div className="space-y-6">
                    <div className="bg-zinc-900/50 rounded-3xl p-6 border border-white/5">
                        <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-widest mb-6">Usage Meter</h3>
                        <div className="space-y-6">
                            <div className="space-y-2">
                                <div className="flex justify-between text-xs mb-1">
                                    <span className="text-zinc-500">Storage</span>
                                    <span className="text-white font-bold">
                                        {subscription?.limits?.maxStorageMb ? `${(subscription.limits.usedStorageMb || 0).toFixed(1)} MB / ${subscription.limits.maxStorageMb} MB` : '0 / 100 MB'}
                                    </span>
                                </div>
                                <div className="w-full h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                                    <div
                                        className="h-full bg-indigo-500"
                                        style={{ width: `${Math.min(100, ((subscription?.limits?.usedStorageMb || 0) / (subscription?.limits?.maxStorageMb || 100)) * 100)}%` }}
                                    />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <div className="flex justify-between text-xs mb-1">
                                    <span className="text-zinc-500">Products</span>
                                    <span className="text-white font-bold">
                                        {subscription?.limits?.products ? `${subscription.limits.usedProducts || 0} / ${subscription.limits.products}` : '0 / 3'}
                                    </span>
                                </div>
                                <div className="w-full h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                                    <div
                                        className="h-full bg-purple-500"
                                        style={{ width: `${Math.min(100, ((subscription?.limits?.usedProducts || 0) / (subscription?.limits?.products || 3)) * 100)}%` }}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="bg-zinc-900/50 rounded-3xl p-6 border border-white/5">
                        <div className="flex items-center gap-2 mb-4">
                            <Shield className="w-4 h-4 text-emerald-400" />
                            <h3 className="text-xs font-bold text-white uppercase tracking-widest">Secure Payments</h3>
                        </div>
                        <p className="text-xs text-zinc-500 leading-relaxed">
                            Payments are processed securely via Razorpay. We do not store your full card details on our servers.
                        </p>
                    </div>
                </div>
            </div>

            {/* Plans List */}
            <div className="space-y-6">
                <div className="text-center mb-12">
                    <h2 className="text-2xl font-black text-white mb-2">Change Your Plan</h2>
                    <p className="text-zinc-500">Switch to a plan that fits your growth.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {plans.map((plan, i) => (
                        <div key={i} className={`rounded-3xl p-8 border relative overflow-hidden flex flex-col ${plan.popular ? 'bg-indigo-500/5 border-indigo-500/30' : 'bg-zinc-900/50 border-white/5'}`}>
                            {plan.popular && (
                                <div className="absolute top-0 right-0 bg-indigo-500 text-white text-[10px] font-black uppercase tracking-wider px-4 py-1.5 rounded-bl-xl shadow-lg">
                                    Most Popular
                                </div>
                            )}

                            <h3 className="text-xl font-black text-white mb-2">{plan.name}</h3>
                            <div className="flex items-baseline gap-1 mb-4">
                                <span className="text-3xl font-black text-white">₹{plan.price}</span>
                                <span className="text-zinc-500 text-sm">/{plan.period}</span>
                            </div>
                            <p className="text-zinc-400 text-xs mb-8 leading-relaxed">
                                {plan.description}
                            </p>

                            <ul className="space-y-4 mb-8 flex-1">
                                {plan.features.map((f: string, j: number) => (
                                    <li key={j} className="flex items-start gap-3 text-xs text-zinc-300">
                                        <Check className="w-4 h-4 text-indigo-400 flex-shrink-0" />
                                        {f}
                                    </li>
                                ))}
                            </ul>

                            <button
                                disabled={plan.isCurrent}
                                className={`w-full py-3 rounded-xl text-xs font-black uppercase tracking-wider transition-all ${plan.isCurrent
                                    ? 'bg-zinc-800 text-zinc-500 cursor-not-allowed'
                                    : plan.popular
                                        ? 'bg-indigo-500 text-white hover:bg-indigo-600 shadow-lg shadow-indigo-500/20'
                                        : 'bg-white text-black hover:bg-zinc-200'
                                    }`}
                            >
                                {plan.isCurrent ? 'Current Plan' : 'Select Plan'}
                            </button>
                        </div>
                    ))}
                </div>
            </div>

            {/* Billing History */}
            <div className="bg-zinc-900/50 rounded-3xl p-8 border border-white/5">
                <div className="flex items-center justify-between mb-8">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-white/5 rounded-lg">
                            <Download className="w-5 h-5 text-white" />
                        </div>
                        <h3 className="text-lg font-bold text-white">Billing History</h3>
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="text-xs font-bold text-zinc-500 uppercase tracking-widest border-b border-white/5">
                                <th className="pb-4 px-4 font-bold">Date</th>
                                <th className="pb-4 px-4 font-bold">Amount</th>
                                <th className="pb-4 px-4 font-bold">Plan</th>
                                <th className="pb-4 px-4 font-bold text-right">Invoice</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {history.length === 0 ? (
                                <tr>
                                    <td colSpan={4} className="py-8 text-center text-zinc-500 text-sm">
                                        No billing history found.
                                    </td>
                                </tr>
                            ) : (
                                history.map((item) => (
                                    <tr key={item.id} className="text-sm hover:bg-white/3 transition-colors group">
                                        <td className="py-4 px-4 text-zinc-400">
                                            {new Date(item.date).toLocaleDateString('en-US', {
                                                month: 'short',
                                                day: 'numeric',
                                                year: 'numeric'
                                            })}
                                        </td>
                                        <td className="py-4 px-4 text-white font-bold">
                                            {item.currency === 'INR' ? '₹' : (item.currency || '₹')}
                                            {item.amount.toLocaleString('en-IN')}
                                        </td>
                                        <td className="py-4 px-4 text-zinc-300">{item.plan}</td>
                                        <td className="py-4 px-4 text-right">
                                            <button className="p-2 text-zinc-500 hover:text-white transition-colors">
                                                <Download className="w-4 h-4" />
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
