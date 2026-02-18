'use client';

import { useState, useEffect } from 'react';
import { Calendar, CreditCard, Shield, RefreshCcw, Loader2, StopCircle, CheckCircle2, ChevronRight } from 'lucide-react';
import { motion } from 'framer-motion';
import Link from 'next/link';

interface Subscription {
    _id: string;
    productId: {
        _id: string;
        name: string;
        image: string;
        price: number;
    };
    status: 'active' | 'canceled' | 'expired' | 'past_due' | 'pending';
    billingPeriod: string;
    startDate: string;
    endDate: string;
    autoRenew: boolean;
    finalPrice: number;
}

export default function SubscriptionsPage() {
    const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchSubscriptions();
    }, []);

    const fetchSubscriptions = async () => {
        try {
            const res = await fetch('/api/user/subscriptions');
            const data = await res.json();
            setSubscriptions(data.subscriptions || []);
        } catch (err) {
            console.error('Failed to fetch subscriptions', err);
        } finally {
            setLoading(false);
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'active': return 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20';
            case 'canceled': return 'text-zinc-400 bg-zinc-500/10 border-zinc-500/20';
            case 'expired': return 'text-rose-400 bg-rose-500/10 border-rose-500/20';
            default: return 'text-zinc-500 bg-zinc-500/10 border-zinc-500/20';
        }
    };

    return (
        <div className="min-h-screen bg-[#030303] text-white p-6 md:p-12">
            <div className="max-w-6xl mx-auto space-y-12">
                <div className="space-y-2">
                    <h1 className="text-4xl font-black tracking-tight italic uppercase">Memberships</h1>
                    <p className="text-zinc-500 font-medium tracking-tight">Manage your recurring subscriptions and exclusive community access.</p>
                </div>

                {loading ? (
                    <div className="flex flex-col items-center justify-center py-32 space-y-4 opacity-50">
                        <Loader2 className="w-8 h-8 animate-spin" />
                        <p className="text-[10px] font-black tracking-widest uppercase">Syncing your status...</p>
                    </div>
                ) : subscriptions.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {subscriptions.map((sub) => (
                            <motion.div
                                key={sub._id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="bg-[#0A0A0A] border border-white/5 rounded-[2.5rem] p-8 space-y-8 hover:border-white/10 transition-all group"
                            >
                                <div className="flex items-center justify-between">
                                    <div className="w-14 h-14 bg-zinc-800 rounded-2xl overflow-hidden border border-white/5">
                                        <img src={sub.productId.image} className="w-full h-full object-cover" alt={sub.productId.name} />
                                    </div>
                                    <div className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border ${getStatusColor(sub.status)}`}>
                                        {sub.status}
                                    </div>
                                </div>

                                <div className="space-y-1">
                                    <h3 className="text-xl font-bold line-clamp-1">{sub.productId.name}</h3>
                                    <p className="text-zinc-500 text-sm font-medium">₹{sub.finalPrice.toLocaleString()} / {sub.billingPeriod}</p>
                                </div>

                                <div className="space-y-4 pt-6 border-t border-white/5">
                                    <div className="flex items-center justify-between text-xs">
                                        <div className="flex items-center gap-2 text-zinc-500">
                                            <Calendar className="w-4 h-4" />
                                            <span>Next Billing</span>
                                        </div>
                                        <span className="font-bold text-zinc-300">{new Date(sub.endDate).toLocaleDateString()}</span>
                                    </div>
                                    <div className="flex items-center justify-between text-xs">
                                        <div className="flex items-center gap-2 text-zinc-500">
                                            <Shield className="w-4 h-4" />
                                            <span>Auto-Renew</span>
                                        </div>
                                        <div className="flex items-center gap-1.5">
                                            <div className={`w-1.5 h-1.5 rounded-full ${sub.autoRenew ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                                            <span className="font-bold text-zinc-300 uppercase tracking-widest text-[10px]">
                                                {sub.autoRenew ? 'Enabled' : 'Disabled'}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex gap-3">
                                    <Link
                                        href={`/u/shared/community/${sub.productId._id}`}
                                        className="flex-1 bg-white text-black py-4 rounded-2xl font-black uppercase tracking-widest text-[10px] flex items-center justify-center gap-2 hover:bg-zinc-200 transition-all"
                                    >
                                        <RefreshCcw className="w-4 h-4" />
                                        Access Area
                                    </Link>
                                    <button
                                        title="Cancel Subscription"
                                        className="p-4 bg-rose-500/10 text-rose-500 rounded-2xl border border-rose-500/20 hover:bg-rose-500/20 transition-all"
                                    >
                                        <StopCircle className="w-4 h-4" />
                                    </button>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                ) : (
                    <div className="flex flex-col items-center justify-center py-32 space-y-8 bg-[#0A0A0A] border border-white/5 border-dashed rounded-[3rem]">
                        <div className="w-20 h-20 bg-zinc-800/30 rounded-full flex items-center justify-center">
                            <Shield className="w-10 h-10 text-zinc-600" />
                        </div>
                        <div className="text-center space-y-2">
                            <h3 className="text-xl font-bold italic uppercase tracking-tight">No active memberships</h3>
                            <p className="text-zinc-500 text-sm font-medium">Join exclusive communities to support your favorite creators.</p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
