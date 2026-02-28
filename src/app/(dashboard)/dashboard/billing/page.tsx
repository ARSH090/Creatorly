'use client';

import React, { useState, useEffect } from 'react';
import {
    CreditCard, Check, Sparkles, AlertCircle,
    ArrowRight, Download, Calendar, Zap, Shield,
    Trophy, Rocket, Crown, History as HistoryIcon
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton, StatsSkeleton, TableSkeleton } from '@/components/ui/skeleton-loaders';
import { toast } from 'react-hot-toast';
import { cn } from '@/lib/utils';

export default function BillingPage() {
    const { user } = useAuth();
    const [loading, setLoading] = useState(true);
    const [subscription, setSubscription] = useState<any>(null);
    const [plans, setPlans] = useState<any[]>([]);
    const [history, setHistory] = useState<any[]>([]);

    useEffect(() => {
        async function loadBilling() {
            try {
                const [plansRes, subRes, historyRes] = await Promise.all([
                    fetch('/api/plans'),
                    fetch('/api/creator/subscription'),
                    fetch('/api/creator/billing/history')
                ]);

                if (!plansRes.ok || !subRes.ok || !historyRes.ok) throw new Error('Signal Interrupted');

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
                toast.error('Failed to sync billing telemetry');
            } finally {
                setLoading(false);
            }
        }

        if (user) {
            loadBilling();
        }
    }, [user]);

    if (loading) {
        return (
            <div className="max-w-6xl mx-auto space-y-12 pb-24 animate-in fade-in duration-500">
                <div className="space-y-4">
                    <Skeleton className="h-12 w-64 rounded-xl" />
                    <Skeleton className="h-4 w-96 rounded-lg" />
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <div className="lg:col-span-2 space-y-8">
                        <Skeleton className="h-[300px] w-full rounded-[2.5rem]" />
                        <Skeleton className="h-[150px] w-full rounded-[2.5rem]" />
                    </div>
                    <StatsSkeleton count={2} />
                </div>
                <TableSkeleton rows={5} />
            </div>
        );
    }

    return (
        <div className="max-w-6xl mx-auto space-y-12 pb-24 animate-in fade-in duration-700">
            <header className="space-y-4">
                <h1 className="text-5xl font-black text-white italic uppercase tracking-tighter flex items-center gap-4">
                    <CreditCard className="w-12 h-12 text-indigo-500 shadow-[0_0_30px_rgba(99,102,241,0.4)]" />
                    BILLING & SUBSCRIPTION
                </h1>
                <p className="text-[10px] font-black text-zinc-600 uppercase tracking-[0.4em] ml-16">
                    Financial Protocols • Plan Management • Transaction History
                </p>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
                <div className="lg:col-span-2 space-y-10">
                    <div className="bg-zinc-900/40 backdrop-blur-3xl rounded-[3rem] p-10 border border-white/5 relative overflow-hidden group">
                        <div className="absolute top-0 right-0 w-80 h-80 bg-indigo-500/10 blur-[120px] rounded-full -mr-20 -mt-20 group-hover:bg-indigo-500/20 transition-all duration-700" />

                        <div className="relative z-10 flex flex-col xl:flex-row justify-between gap-10">
                            <div className="space-y-6">
                                <div className="flex items-center gap-3">
                                    <Badge className="bg-white/5 text-white text-[9px] font-black uppercase tracking-[0.2em] px-4 py-1.5 rounded-full border border-white/10 italic">
                                        CURRENT STATUS
                                    </Badge>
                                    {subscription?.status === 'active' && (
                                        <Badge className="bg-emerald-500/10 text-emerald-400 text-[9px] font-black uppercase tracking-[0.2em] px-4 py-1.5 rounded-full border border-emerald-500/20 animate-pulse">
                                            ENCRYPTED & ACTIVE
                                        </Badge>
                                    )}
                                </div>

                                <div>
                                    <h2 className="text-5xl font-black text-white italic uppercase tracking-tighter mb-2 flex items-center gap-3">
                                        {subscription?.planName} {subscription?.planName === 'Pro' ? <Rocket className="w-8 h-8 text-amber-500" /> : <Sparkles className="w-8 h-8 text-indigo-500" />}
                                    </h2>
                                    <p className="text-zinc-400 font-bold leading-relaxed max-w-md">
                                        Your system is operating under the <span className="text-white italic">{subscription?.planName}</span> protocol.
                                        Next cycle initialization: <span className="text-white">₹{subscription?.price}</span> on <span className="text-white font-black">{subscription?.nextBillingDate}</span>.
                                    </p>
                                </div>

                                <div className="flex flex-wrap gap-4 pt-4">
                                    <Button className="bg-white text-black h-14 px-10 rounded-2xl font-black uppercase text-xs tracking-widest hover:scale-105 transition-all shadow-xl shadow-white/5">
                                        UPGRADE PROTOCOL
                                    </Button>
                                    <Button variant="ghost" className="bg-white/5 text-zinc-500 hover:text-white h-14 px-8 rounded-2xl font-black uppercase text-[10px] tracking-widest border border-white/5 hover:bg-white/10 transition-all">
                                        TERMINATE SUBSCRIPTION
                                    </Button>
                                </div>
                            </div>

                            <div className="bg-black/60 backdrop-blur-md rounded-[2.5rem] p-8 border border-white/10 min-w-[300px] shadow-2xl">
                                <h3 className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.3em] mb-6 flex items-center gap-2">
                                    <Shield className="w-3 h-3" /> ENABLED ENHANCEMENTS
                                </h3>
                                <ul className="space-y-4">
                                    {subscription?.features.map((feature: string, i: number) => (
                                        <li key={i} className="flex items-center gap-3 text-sm font-black text-zinc-300 italic group/item">
                                            <div className="w-6 h-6 rounded-lg bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20 group-hover/item:scale-110 transition-all">
                                                <Check className="w-4 h-4 text-emerald-400" />
                                            </div>
                                            {feature.toUpperCase()}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        </div>
                    </div>

                    {/* Payment Method */}
                    <div className="bg-zinc-900/40 backdrop-blur-2xl rounded-[3rem] p-10 border border-white/5">
                        <div className="flex items-center justify-between mb-10">
                            <div className="flex items-center gap-4">
                                <div className="p-3 bg-indigo-500/10 rounded-2xl border border-indigo-500/20">
                                    <CreditCard className="w-6 h-6 text-indigo-400" />
                                </div>
                                <h3 className="text-2xl font-black text-white italic uppercase tracking-tight">PAYMENT ARTIFACTS</h3>
                            </div>
                            <Button variant="ghost" className="text-[10px] font-black text-indigo-400 hover:text-indigo-300 uppercase tracking-widest hover:bg-indigo-500/5 px-6 rounded-xl">
                                SYNC NEW ARTIFACT
                            </Button>
                        </div>

                        <div className="p-8 bg-black/40 rounded-[2rem] border border-white/5 flex items-center justify-between group hover:border-indigo-500/20 transition-all">
                            <div className="flex items-center gap-6">
                                <div className="w-16 h-10 bg-zinc-800 rounded-xl flex items-center justify-center font-black text-[11px] text-zinc-500 border border-white/5 italic">
                                    VISA
                                </div>
                                <div className="space-y-1">
                                    <p className="text-white font-black text-base tracking-widest">•••• •••• •••• 4242</p>
                                    <p className="text-[10px] text-zinc-600 font-bold uppercase tracking-widest">EXPIRATION AUTH: 12/26</p>
                                </div>
                            </div>
                            <Badge className="bg-white/5 text-zinc-500 px-4 py-1.5 rounded-lg border border-white/5 text-[9px] font-black uppercase tracking-widest">SYSTEM DEFAULT</Badge>
                        </div>
                    </div>
                </div>

                {/* Right: Resources & Security */}
                <div className="space-y-8">
                    <div className="bg-zinc-900/40 backdrop-blur-2xl rounded-[3rem] p-8 border border-white/5">
                        <h3 className="text-[10px] font-black text-zinc-600 uppercase tracking-[0.3em] mb-8">TELEMETRY METER</h3>
                        <div className="space-y-10">
                            <div className="space-y-4">
                                <div className="flex justify-between items-end mb-1">
                                    <span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest italic">Vault Storage</span>
                                    <span className="text-xs font-black text-white italic">
                                        {subscription?.limits?.maxStorageMb ? `${(subscription.limits.usedStorageMb || 0).toFixed(1)} MB / ${subscription.limits.maxStorageMb} MB` : '0 / 100 MB'}
                                    </span>
                                </div>
                                <div className="w-full h-2 bg-black/40 rounded-full overflow-hidden border border-white/5">
                                    <div
                                        className="h-full bg-indigo-500 shadow-[0_0_15px_rgba(99,102,241,0.5)] transition-all duration-1000"
                                        style={{ width: `${Math.min(100, ((subscription?.limits?.usedStorageMb || 0) / (subscription?.limits?.maxStorageMb || 100)) * 100)}%` }}
                                    />
                                </div>
                            </div>
                            <div className="space-y-4">
                                <div className="flex justify-between items-end mb-1">
                                    <span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest italic">Unit Deployment</span>
                                    <span className="text-xs font-black text-white italic">
                                        {subscription?.limits?.products ? `${subscription.limits.usedProducts || 0} / ${subscription.limits.products}` : '0 / 3'}
                                    </span>
                                </div>
                                <div className="w-full h-2 bg-black/40 rounded-full overflow-hidden border border-white/5">
                                    <div
                                        className="h-full bg-purple-500 shadow-[0_0_15px_rgba(168,85,247,0.5)] transition-all duration-1000"
                                        style={{ width: `${Math.min(100, ((subscription?.limits?.usedProducts || 0) / (subscription?.limits?.products || 3)) * 100)}%` }}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="bg-gradient-to-br from-indigo-900/20 to-zinc-900/40 backdrop-blur-2xl rounded-[3rem] p-8 border border-white/5 text-center space-y-4">
                        <div className="w-16 h-16 bg-white/5 rounded-[1.5rem] flex items-center justify-center mx-auto border border-white/10 group-hover:scale-110 transition-all">
                            <Shield className="w-8 h-8 text-indigo-400 drop-shadow-[0_0_10px_rgba(129,140,248,0.5)]" />
                        </div>
                        <h3 className="text-sm font-black text-white uppercase tracking-widest italic">SECURE PIPELINE</h3>
                        <p className="text-[10px] text-zinc-500 font-bold leading-relaxed uppercase tracking-wider">
                            ENCRYPTED VIA RAZORPAY SHA-256. NO DATA RESIDUE ON CORE SERVERS.
                        </p>
                    </div>
                </div>
            </div>

            {/* Plans List */}
            <div className="space-y-12">
                <div className="text-center space-y-4">
                    <h2 className="text-4xl font-black text-white italic uppercase tracking-tighter">ALTER PROTOCOL</h2>
                    <p className="text-[10px] font-black text-zinc-600 uppercase tracking-widest">Select a trajectory that matches your evolution.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {plans.map((plan, i) => (
                        <div key={i} className={cn(
                            "rounded-[3rem] p-10 border relative overflow-hidden flex flex-col transition-all duration-500 hover:scale-[1.02]",
                            plan.popular ? 'bg-zinc-900/60 border-indigo-500/30' : 'bg-zinc-900/40 border-white/5'
                        )}>
                            {plan.popular && (
                                <div className="absolute top-0 right-10 bg-indigo-600 text-white text-[9px] font-black uppercase tracking-[0.2em] px-6 py-2 rounded-b-2xl shadow-xl shadow-indigo-600/20 italic">
                                    ELITE CHOICE
                                </div>
                            )}

                            <h3 className="text-2xl font-black text-white italic uppercase tracking-tight mb-2">{plan.name}</h3>
                            <div className="flex items-baseline gap-2 mb-6">
                                <span className="text-4xl font-black text-white tracking-widest italic">₹{plan.price}</span>
                                <span className="text-zinc-500 font-black uppercase text-[10px] tracking-widest">/{plan.interval}</span>
                            </div>

                            <p className="text-zinc-400 font-bold text-xs mb-10 leading-relaxed italic opacity-80">
                                {plan.description.toUpperCase()}
                            </p>

                            <ul className="space-y-5 mb-12 flex-1">
                                {plan.features.map((f: string, j: number) => (
                                    <li key={j} className="flex items-start gap-4 text-[11px] font-black text-zinc-300 uppercase tracking-wide italic">
                                        <div className="mt-0.5"><Zap size={14} className="text-indigo-400 fill-indigo-400/20" /></div>
                                        {f}
                                    </li>
                                ))}
                            </ul>

                            <Button
                                disabled={plan.isCurrent}
                                className={cn(
                                    "w-full h-14 rounded-2xl font-black uppercase text-xs tracking-widest transition-all",
                                    plan.isCurrent
                                        ? 'bg-white/5 text-zinc-600 cursor-not-allowed border border-white/5'
                                        : plan.popular
                                            ? 'bg-indigo-600 text-white hover:bg-indigo-500 shadow-xl shadow-indigo-600/20'
                                            : 'bg-white text-black hover:scale-105'
                                )}
                            >
                                {plan.isCurrent ? 'ACTIVE PROTOCOL' : 'ENGAGE PLAN'}
                            </Button>
                        </div>
                    ))}
                </div>
            </div>

            {/* History Table */}
            <div className="bg-zinc-900/40 backdrop-blur-2xl rounded-[3rem] p-10 border border-white/5">
                <div className="flex items-center justify-between mb-10">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-white/5 rounded-2xl border border-white/10">
                            <HistoryIcon className="w-6 h-6 text-zinc-400" />
                        </div>
                        <h3 className="text-2xl font-black text-white italic uppercase tracking-tight">LEDGER HISTORY</h3>
                    </div>
                </div>

                <div className="overflow-x-auto rounded-[2rem] border border-white/5">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="bg-white/5 text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em] italic">
                                <th className="py-6 px-8">TIMESTAMP</th>
                                <th className="py-6 px-8">VALUE</th>
                                <th className="py-6 px-8">PROTOCOL</th>
                                <th className="py-6 px-8 text-right">ARTIFACT</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {history.length === 0 ? (
                                <tr>
                                    <td colSpan={4} className="py-20 text-center">
                                        <div className="flex flex-col items-center gap-4 opacity-20">
                                            <Shield className="w-12 h-12" />
                                            <p className="font-black uppercase tracking-widest text-xs">NO LEDGER RECORDS DEPLOYED</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                history.map((item) => (
                                    <tr key={item.id} className="text-sm hover:bg-white/[0.02] transition-colors group">
                                        <td className="py-6 px-8 text-zinc-400 font-bold uppercase tracking-tighter">
                                            {format(new Date(item.date), 'MMM dd, yyyy')}
                                        </td>
                                        <td className="py-6 px-8 text-white font-black italic">
                                            ₹{item.amount.toLocaleString()}
                                        </td>
                                        <td className="py-6 px-8">
                                            <Badge className="bg-white/5 text-zinc-400 px-3 py-1 rounded-lg border border-white/5 font-black uppercase text-[9px] tracking-widest">{item.plan}</Badge>
                                        </td>
                                        <td className="py-6 px-8 text-right">
                                            <Button variant="ghost" size="icon" className="h-10 w-10 bg-white/5 rounded-xl hover:bg-white/10 text-zinc-400 hover:text-white transition-all">
                                                <Download className="w-4 h-4" />
                                            </Button>
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

import { format } from 'date-fns';
