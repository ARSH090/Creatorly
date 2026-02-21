'use client';

import React, { useState, useEffect } from 'react';
import {
    CreditCard, Check, Sparkles, AlertCircle,
    ArrowRight, Download, Calendar, Zap, Shield,
    TrendingUp, Wallet, ArrowUpRight, DollarSign,
    RefreshCcw, FileText, CheckCircle2, Clock
} from 'lucide-react';
import { useAuth as useClerkAuth } from '@clerk/nextjs';
import { useAuth } from '@/hooks/useAuth';

export default function BillingPage() {
    const { user } = useAuth();
    const { getToken } = useClerkAuth();
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'subscription' | 'earnings'>('subscription');

    // Subscription Data
    const [subscription, setSubscription] = useState<any>(null);
    const [plans, setPlans] = useState<any[]>([]);

    // Earnings Data
    const [overview, setOverview] = useState<any>({ totalEarnings: 0, currentBalance: 0, totalPaidOut: 0 });
    const [earningsData, setEarningsData] = useState<any[]>([]);
    const [invoices, setInvoices] = useState<any[]>([]);
    const [payouts, setPayouts] = useState<any[]>([]);
    const [isRequestingPayout, setIsRequestingPayout] = useState(false);

    useEffect(() => {
        async function loadBilling() {
            setLoading(true);
            try {
                const token = await getToken();
                const headers = { 'Authorization': `Bearer ${token}` };

                // Fetch data in parallel
                const [plansRes, subRes, overviewRes, invoicesRes, payoutsRes, earningsRes] = await Promise.all([
                    fetch('/api/plans'),
                    fetch('/api/creator/subscription'),
                    fetch('/api/creator/billing/overview', { headers }),
                    fetch('/api/creator/billing/invoices', { headers }),
                    fetch('/api/creator/billing/payouts', { headers }),
                    fetch('/api/creator/billing/earnings?range=daily', { headers })
                ]);

                const plansData = await plansRes.json();
                const subData = await subRes.json();
                const overviewData = await overviewRes.json();
                const invoicesData = await invoicesRes.json();
                const payoutsData = await payoutsRes.json();
                const earningsData = await earningsRes.json();

                setPlans(plansData.plans || []);
                setOverview(overviewData);
                setInvoices(invoicesData);
                setPayouts(payoutsData);
                setEarningsData(earningsData);

                if (subData.subscription) {
                    const sub = subData.subscription;
                    const planInfo = (plansData.plans || []).find((p: any) => p.tier === sub.plan) || {};

                    setSubscription({
                        planName: planInfo.name || sub.plan.charAt(0).toUpperCase() + sub.plan.slice(1),
                        status: sub.isExpired ? 'expired' : 'active',
                        price: planInfo.price || 0,
                        nextBillingDate: sub.expiresAt ? new Date(sub.expiresAt).toLocaleDateString() : 'Never',
                        features: planInfo.features || ['Unlimited Storefronts', 'Basic Analytics'],
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

    async function handleRequestPayout() {
        if (overview.currentBalance <= 0) return;

        setIsRequestingPayout(true);
        try {
            const token = await getToken();
            const res = await fetch('/api/creator/billing/payouts', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ amount: overview.currentBalance, notes: 'Self-requested payout' })
            });

            if (res.ok) {
                alert('Payout requested successfully! It usually takes 2-3 business days to process.');
                window.location.reload();
            }
        } catch (error) {
            console.error('Payout Request Error:', error);
        } finally {
            setIsRequestingPayout(false);
        }
    }

    if (loading) return (
        <div className="min-h-[400px] flex items-center justify-center">
            <div className="flex flex-col items-center gap-4">
                <RefreshCcw className="w-8 h-8 text-indigo-500 animate-spin" />
                <p className="text-zinc-500 font-bold uppercase tracking-widest text-xs">Syncing Financial Data...</p>
            </div>
        </div>
    );

    return (
        <div className="max-w-7xl mx-auto space-y-8 pb-20">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div>
                    <h1 className="text-4xl font-black text-white mb-2 tracking-tight">Financial Center</h1>
                    <p className="text-zinc-500 font-medium">Manage your platform costs, revenue, and payouts in one place.</p>
                </div>

                {/* Tabs */}
                <div className="flex p-1.5 bg-zinc-900 border border-white/5 rounded-2xl">
                    <button
                        onClick={() => setActiveTab('subscription')}
                        className={`px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${activeTab === 'subscription' ? 'bg-white text-black shadow-lg shadow-white/5' : 'text-zinc-500 hover:text-white'}`}
                    >
                        Subscription
                    </button>
                    <button
                        onClick={() => setActiveTab('earnings')}
                        className={`px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${activeTab === 'earnings' ? 'bg-white text-black shadow-lg shadow-white/5' : 'text-zinc-500 hover:text-white'}`}
                    >
                        Earnings & Payouts
                    </button>
                </div>
            </div>

            {activeTab === 'subscription' ? (
                /* SUBSCRIPTION TAB */
                <div className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        <div className="lg:col-span-2 space-y-8">
                            <div className="bg-gradient-to-br from-indigo-900/40 to-purple-900/40 rounded-[2.5rem] p-10 border border-white/5 relative overflow-hidden">
                                <div className="absolute top-0 right-0 w-80 h-80 bg-indigo-500/20 blur-[120px] rounded-full -mr-20 -mt-20" />
                                <div className="relative z-10 flex flex-col md:flex-row justify-between gap-8">
                                    <div className="space-y-6">
                                        <div className="flex items-center gap-2">
                                            <span className="px-3 py-1 bg-white/10 text-white text-[10px] font-black uppercase tracking-[0.2em] rounded-full border border-white/10">
                                                Active Plan
                                            </span>
                                        </div>
                                        <h2 className="text-5xl font-black text-white">{subscription?.planName}</h2>
                                        <p className="text-zinc-400 max-w-sm leading-relaxed">
                                            Your next billing date is <span className="text-white font-bold">{subscription?.nextBillingDate}</span>. We'll automatically charge your default card.
                                        </p>
                                        <div className="flex flex-wrap gap-4 pt-4">
                                            <button className="px-8 py-4 bg-white text-black text-[10px] font-black uppercase tracking-[0.2em] rounded-2xl hover:bg-zinc-200 transition-all shadow-xl shadow-white/10">
                                                Manage Subscription
                                            </button>
                                            <button className="px-8 py-4 bg-transparent border border-white/10 text-white text-[10px] font-black uppercase tracking-[0.2em] rounded-2xl hover:bg-white/5 transition-all">
                                                View Documentation
                                            </button>
                                        </div>
                                    </div>
                                    <div className="bg-black/40 backdrop-blur-3xl rounded-3xl p-8 border border-white/10 flex-1 max-w-sm">
                                        <h3 className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.2em] mb-6 flex items-center gap-2">
                                            <Sparkles className="w-3 h-3" />
                                            Tier Features
                                        </h3>
                                        <ul className="space-y-4">
                                            {subscription?.features.map((feature: string, i: number) => (
                                                <li key={i} className="flex items-center gap-3 text-xs text-zinc-300 font-bold">
                                                    <div className="w-5 h-5 rounded-full bg-emerald-500/20 flex items-center justify-center border border-emerald-500/20">
                                                        <Check className="w-3 h-3 text-emerald-400" />
                                                    </div>
                                                    {feature}
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-8">
                            <div className="bg-zinc-900/50 rounded-[2.5rem] p-8 border border-white/5 space-y-8">
                                <h3 className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em]">Usage Analytics</h3>
                                <div className="space-y-8">
                                    <div className="space-y-3">
                                        <div className="flex justify-between items-end">
                                            <p className="text-xs font-bold text-white uppercase tracking-widest">Storage</p>
                                            <p className="text-[10px] font-bold text-zinc-500">{(subscription?.limits?.usedStorageMb || 0).toFixed(1)} / {subscription?.limits?.maxStorageMb} MB</p>
                                        </div>
                                        <div className="h-2 bg-black rounded-full overflow-hidden border border-white/5">
                                            <div
                                                className="h-full bg-indigo-500 shadow-[0_0_15px_rgba(99,102,241,0.5)] transition-all duration-1000"
                                                style={{ width: `${Math.min(100, ((subscription?.limits?.usedStorageMb || 0) / (subscription?.limits?.maxStorageMb || 100)) * 100)}%` }}
                                            />
                                        </div>
                                    </div>
                                    <div className="space-y-3">
                                        <div className="flex justify-between items-end">
                                            <p className="text-xs font-bold text-white uppercase tracking-widest">Storefronts</p>
                                            <p className="text-[10px] font-bold text-zinc-500">{subscription?.limits?.products || 0} / {subscription?.limits?.products || 1} Active</p>
                                        </div>
                                        <div className="h-2 bg-black rounded-full overflow-hidden border border-white/5">
                                            <div
                                                className="h-full bg-purple-500 shadow-[0_0_15px_rgba(168,85,247,0.5)] transition-all duration-1000"
                                                style={{ width: `100%` }}
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div className="bg-zinc-900/50 rounded-[2.5rem] p-8 border border-white/5 flex items-center gap-4">
                                <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 flex items-center justify-center border border-emerald-500/10">
                                    <Shield className="w-6 h-6 text-emerald-400" />
                                </div>
                                <div>
                                    <p className="text-xs font-black text-white uppercase tracking-widest">Secure Billing</p>
                                    <p className="text-[10px] text-zinc-500 mt-1 font-medium">PCI Compliant • SSL Encrypted</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Pricing Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8 pt-12">
                        {plans.map((plan, i) => (
                            <div key={i} className={`rounded-[2.5rem] p-10 border transition-all duration-500 hover:scale-[1.02] ${plan.tier === subscription?.planName.toLowerCase() ? 'bg-indigo-500 shadow-2xl shadow-indigo-500/20 border-indigo-500' : 'bg-zinc-900/50 border-white/5 grayscale opacity-50'}`}>
                                <h3 className="text-2xl font-black text-white mb-6 uppercase tracking-tight">{plan.name}</h3>
                                <div className="flex items-baseline gap-1 mb-8">
                                    <span className="text-4xl font-black text-white">₹{plan.price}</span>
                                    <span className={`text-[10px] font-black uppercase tracking-widest ${plan.tier === subscription?.planName.toLowerCase() ? 'text-indigo-200' : 'text-zinc-500'}`}>/month</span>
                                </div>
                                <ul className="space-y-5 mb-12">
                                    {plan.features.map((f: any, j: number) => (
                                        <li key={j} className="flex items-center gap-3 text-xs font-bold text-white/80">
                                            <Check className="w-4 h-4 flex-shrink-0" />
                                            {f}
                                        </li>
                                    ))}
                                </ul>
                                <button className={`w-full py-4 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] transition-all ${plan.tier === subscription?.planName.toLowerCase() ? 'bg-white text-black' : 'bg-white/5 text-white/50'}`}>
                                    {plan.tier === subscription?.planName.toLowerCase() ? 'Selected Plan' : 'Select Tier'}
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
            ) : (
                /* EARNINGS TAB */
                <div className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
                    {/* Stats Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        <div className="bg-zinc-900/50 border border-white/5 rounded-[2.5rem] p-8 space-y-4">
                            <div className="flex items-center justify-between">
                                <p className="text-xs font-black text-zinc-500 uppercase tracking-widest">Available Balance</p>
                                <Wallet className="w-4 h-4 text-indigo-400" />
                            </div>
                            <h2 className="text-4xl font-black text-white">₹{overview.currentBalance.toLocaleString()}</h2>
                            <button
                                onClick={handleRequestPayout}
                                disabled={isRequestingPayout || overview.currentBalance <= 0}
                                className="w-full py-3 bg-white text-black rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] hover:bg-zinc-200 transition-all flex items-center justify-center gap-2"
                            >
                                {isRequestingPayout ? 'Processing...' : 'Withdraw Funds'}
                                <ArrowUpRight className="w-4 h-4" />
                            </button>
                        </div>
                        <div className="bg-zinc-900/50 border border-white/5 rounded-[2.5rem] p-8 space-y-4">
                            <div className="flex items-center justify-between">
                                <p className="text-xs font-black text-zinc-500 uppercase tracking-widest">Paid Out</p>
                                <TrendingUp className="w-4 h-4 text-emerald-400" />
                            </div>
                            <h2 className="text-4xl font-black text-white">₹{overview.totalPaidOut.toLocaleString()}</h2>
                            <p className="text-[10px] font-black text-emerald-500 uppercase tracking-widest">+12.5% from last month</p>
                        </div>
                        <div className="bg-zinc-900/50 border border-white/5 rounded-[2.5rem] p-8 space-y-4">
                            <div className="flex items-center justify-between">
                                <p className="text-xs font-black text-zinc-500 uppercase tracking-widest">Lifetime Earnings</p>
                                <DollarSign className="w-4 h-4 text-purple-400" />
                            </div>
                            <h2 className="text-4xl font-black text-white">₹{overview.totalEarnings.toLocaleString()}</h2>
                            <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">{overview.orderCount} Orders fulfilled</p>
                        </div>
                    </div>

                    {/* Chart & History Area */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        <div className="lg:col-span-2 space-y-8">
                            {/* Earnings Chart Placeholder/Simple View */}
                            <div className="bg-zinc-900/50 border border-white/5 rounded-[2.5rem] p-10 space-y-8">
                                <div className="flex items-center justify-between">
                                    <h3 className="text-xl font-black text-white uppercase tracking-tight">Earnings Trend</h3>
                                    <div className="flex bg-black p-1 rounded-xl">
                                        <button className="px-3 py-1 text-[8px] font-black uppercase bg-zinc-800 text-white rounded-lg">30D</button>
                                        <button className="px-3 py-1 text-[8px] font-black uppercase text-zinc-500">12M</button>
                                        <button className="px-3 py-1 text-[8px] font-black uppercase text-zinc-500">ALL</button>
                                    </div>
                                </div>
                                <div className="h-64 flex items-end justify-between gap-1">
                                    {/* Responsive Chart Bars */}
                                    {(earningsData.length > 0 ? earningsData : Array(30).fill({ total: 0 })).slice(-30).map((day: any, i: number) => {
                                        const maxAmount = Math.max(...(earningsData.map(d => d.total) || [1000]));
                                        const height = day.total ? (day.total / (maxAmount || 1)) * 100 : 2;
                                        return (
                                            <div key={i} className="flex-1 space-y-2 group cursor-pointer h-full flex flex-col justify-end">
                                                <div
                                                    className={`w-full ${day.total > 0 ? 'bg-indigo-500' : 'bg-zinc-800/30'} group-hover:bg-indigo-400 transition-all rounded-t-sm relative`}
                                                    style={{ height: `${Math.max(height, 5)}%` }}
                                                >
                                                    <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-white text-black text-[8px] font-black px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-20">
                                                        ₹{day.total.toLocaleString()}
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                                <div className="flex justify-between text-[8px] font-black text-zinc-700 uppercase tracking-widest border-t border-white/5 pt-4">
                                    <span>30 Days Ago</span>
                                    <span>Today</span>
                                </div>
                            </div>
                            <div className="bg-zinc-900/50 border border-white/5 rounded-[2.5rem] p-10 overflow-hidden">
                                <div className="flex items-center justify-between mb-10">
                                    <h3 className="text-xl font-black text-white uppercase tracking-tight">Recent Invoices</h3>
                                    <button className="text-indigo-400 text-[10px] font-black uppercase tracking-widest hover:text-indigo-300">View All</button>
                                </div>
                                <div className="overflow-x-auto">
                                    <table className="w-full">
                                        <thead>
                                            <tr className="text-[10px] font-black text-zinc-600 uppercase tracking-[0.2em] text-left border-b border-white/5">
                                                <th className="pb-6">ID</th>
                                                <th className="pb-6">Date</th>
                                                <th className="pb-6">Customer</th>
                                                <th className="pb-6">Amount</th>
                                                <th className="pb-6">Status</th>
                                                <th className="pb-6 text-right">Action</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-white/5">
                                            {invoices.length === 0 ? (
                                                <tr><td colSpan={6} className="py-20 text-center text-zinc-500 font-bold italic">No invoices found.</td></tr>
                                            ) : (
                                                invoices.map((inv) => (
                                                    <tr key={inv._id} className="group hover:bg-white/[0.02] transition-colors">
                                                        <td className="py-6 font-mono text-zinc-400 text-xs">{inv.invoiceNumber}</td>
                                                        <td className="py-6 text-xs font-bold text-white">{new Date(inv.issuedAt).toLocaleDateString()}</td>
                                                        <td className="py-6">
                                                            <div>
                                                                <p className="text-xs font-bold text-white">{inv.customerDetails.name || 'Anonymous'}</p>
                                                                <p className="text-[10px] text-zinc-600">{inv.customerDetails.email}</p>
                                                            </div>
                                                        </td>
                                                        <td className="py-6 text-xs font-black text-white">₹{inv.amount.toLocaleString()}</td>
                                                        <td className="py-6">
                                                            <span className={`px-2 py-1 text-[8px] font-black uppercase tracking-widest rounded-md border ${inv.status === 'paid' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/10' : 'bg-amber-500/10 text-amber-400 border-amber-500/10'
                                                                }`}>
                                                                {inv.status}
                                                            </span>
                                                        </td>
                                                        <td className="py-6 text-right">
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

                        {/* Recent Payouts Sidebar */}
                        <div className="bg-zinc-900/50 border border-white/5 rounded-[2.5rem] p-10 space-y-10">
                            <h3 className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em]">Payout Tracking</h3>
                            <div className="space-y-8">
                                {payouts.length === 0 ? (
                                    <div className="text-center py-12 space-y-4">
                                        <Clock className="w-8 h-8 text-zinc-800 mx-auto" />
                                        <p className="text-xs text-zinc-700 font-bold italic">No payout history yet.</p>
                                    </div>
                                ) : (
                                    payouts.map((p) => (
                                        <div key={p._id} className="flex items-start justify-between group">
                                            <div className="flex items-start gap-4">
                                                <div className={`mt-1 w-2 h-2 rounded-full ${p.status === 'paid' ? 'bg-emerald-400 shadow-[0_0_10px_rgba(52,211,153,0.5)]' : 'bg-amber-400 shadow-[0_0_10px_rgba(251,191,36,0.5)]'}`} />
                                                <div>
                                                    <p className="text-xs font-bold text-white">₹{p.amount.toLocaleString()}</p>
                                                    <p className="text-[10px] text-zinc-600 mt-1">{new Date(p.createdAt).toLocaleDateString()}</p>
                                                </div>
                                            </div>
                                            <span className="text-[9px] font-black text-zinc-500 uppercase tracking-widest group-hover:text-white transition-colors">
                                                {p.status}
                                            </span>
                                        </div>
                                    ))
                                )}
                            </div>

                            <div className="pt-10 border-t border-white/5 space-y-4">
                                <div className="flex items-center gap-3 text-zinc-500">
                                    <FileText className="w-4 h-4" />
                                    <p className="text-[10px] font-bold uppercase tracking-widest">Tax Information</p>
                                </div>
                                <p className="text-[10px] text-zinc-600 leading-relaxed">
                                    You are responsible for declaring and paying any applicable taxes on your earnings. Invoices provided are for record-keeping purposes.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
