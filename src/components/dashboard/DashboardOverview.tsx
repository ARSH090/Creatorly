
'use client';

import React, { useState, useEffect } from 'react';
import { TrendingUp, TrendingDown, Users, ShoppingBag, Wallet, Eye, ArrowRight, Plus, Zap, Loader2, Globe } from "lucide-react";
import Link from 'next/link';
import { useUser, useAuth } from '@clerk/nextjs';
import { motion } from 'framer-motion';

import { WelcomeTour } from './WelcomeTour';
import DMSection from './DMSection';

export default function DashboardOverview() {
    // Fetch real data from backend
    const [analytics, setAnalytics] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [showTour, setShowTour] = useState(false);
    const { user } = useUser();

    // Note: useAuth headers are handled automatically if using same-origin cookies with Clerk middleware.
    // However, if we need explicit tokens for API routes not covered by middleware matcher, we use getToken.
    // Our /api/v1/* routes check user via getMongoUser which uses auth() on server side.
    // So standard fetch is fine as long as session cookie is passed (browser default).

    useEffect(() => {
        const hasSeenTour = localStorage.getItem('creatorly_tour_done');
        if (!hasSeenTour) {
            const timer = setTimeout(() => setShowTour(true), 1500);
            return () => clearTimeout(timer);
        }
    }, []);

    const handleTourClose = () => {
        localStorage.setItem('creatorly_tour_done', 'true');
        setShowTour(false);
    };

    useEffect(() => {
        const fetchAnalytics = async () => {
            if (!user) return;
            try {
                // New Endpoint: /api/v1/dashboard/summary
                const res = await fetch('/api/v1/dashboard/summary');
                if (!res.ok) {
                    throw new Error(`Error ${res.status}: ${res.statusText}`);
                }
                const data = await res.json();

                // Also fetch recent activity (conceptually 'recent orders' for now)
                // or /api/v1/dashboard/activity.
                // For this overview, let's try to get recent orders from cache or separate call if needed.
                // The summary endpoint returns { revenue, leads, ai_credits }.
                // We might need a separate call for recent orders if not included.
                // Plan: Fetch Summary, use it for stats.
                // Summary response structure from my impl: { revenue: { total, trend, history }, leads: {...}, ai_credits: {...} }

                setAnalytics(data);
            } catch (err) {
                console.error('Failed to load dashboard data:', err);
                // Fallback / Error state handled in UI
            } finally {
                setLoading(false);
            }
        };

        fetchAnalytics();
    }, [user]);

    const stats = [
        {
            title: "Total Revenue",
            value: `₹${analytics?.revenue?.total || 0}`,
            change: analytics?.revenue?.trend || 0,
            icon: Wallet,
            color: "text-emerald-400",
            bgColor: "bg-emerald-500/10",
            borderColor: "border-emerald-500/20"
        },
        {
            title: "Total Leads",
            value: analytics?.leads?.total || 0,
            change: analytics?.leads?.trend || 0,
            icon: Users, // Changed from ShoppingBag to Users for Leads/Customers context
            color: "text-blue-400",
            bgColor: "bg-blue-500/10",
            borderColor: "border-blue-500/20"
        },
        {
            title: "Ai Credits",
            value: analytics?.ai_credits?.remaining || 0,
            change: 0, // No trend for credits usually
            icon: Zap,
            color: "text-amber-400", // Changed color
            bgColor: "bg-amber-500/10",
            borderColor: "border-amber-500/20"
        },
        {
            title: "Store Visitors", // Placeholder until we have analytics integration
            value: "0",
            change: 0,
            icon: Eye,
            color: "text-indigo-400",
            bgColor: "bg-indigo-500/10",
            borderColor: "border-indigo-500/20"
        }
    ];

    if (loading) {
        return (
            <div className="flex h-96 items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
            </div>
        );
    }

    return (
        <div className="space-y-8 max-w-7xl mx-auto">
            <WelcomeTour run={showTour} onClose={handleTourClose} />

            {/* Welcome Card */}
            <div className="bg-[#0A0A0A]/40 rounded-[2.5rem] p-10 md:p-12 border border-white/[0.03] backdrop-blur-3xl relative overflow-hidden group shadow-2xl">
                {/* Dynamic Glow Effect */}
                <div className="absolute -top-24 -right-24 w-96 h-96 bg-indigo-500/10 rounded-full blur-[100px] pointer-events-none group-hover:bg-indigo-500/15 transition-all duration-700" />
                <div className="absolute -bottom-24 -left-24 w-72 h-72 bg-purple-500/5 rounded-full blur-[80px] pointer-events-none" />

                <div className="flex flex-col md:flex-row items-center justify-between relative z-10 gap-8">
                    <div className="text-center md:text-left">
                        <div className="flex items-center justify-center md:justify-start gap-3 mb-6">
                            <div className={`w-2.5 h-2.5 rounded-full ${analytics?.store?.isLive ? 'bg-emerald-500 shadow-[0_0_12px_rgba(16,185,129,0.5)] animate-pulse' : 'bg-zinc-700'}`} />
                            <span className="text-[11px] font-black uppercase tracking-[0.25em] text-zinc-500">
                                {analytics?.store?.isLive ? 'Your Store is Live' : 'Store is Offline'}
                            </span>
                        </div>
                        <h2 className="text-4xl md:text-5xl font-bold text-white mb-4 tracking-tight leading-tight">
                            Welcome back, <span className="bg-gradient-to-r from-white via-white to-zinc-500 bg-clip-text text-transparent">{user?.firstName || 'Creator'}</span>! 👋
                        </h2>
                        <p className="text-zinc-400 text-lg max-w-xl leading-relaxed font-medium">
                            Your creator hub is performing well. You've earned <span className="text-white font-bold">₹{analytics?.revenue?.total || 0}</span> this period. Keep building your brand.
                        </p>
                    </div>

                    {/* Balance Widget */}
                    <div className="w-full md:w-auto bg-white/[0.02] border border-white/[0.05] backdrop-blur-2xl rounded-3xl p-8 min-w-[280px] shadow-xl">
                        <div className="text-center md:text-right">
                            <p className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em] mb-2">Available Balance</p>
                            <p className="text-4xl font-black text-white tracking-tighter mb-4">₹{analytics?.revenue?.total || 0}</p>
                            <div className="flex justify-center md:justify-end">
                                <span className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest ${analytics?.store?.isLive ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-zinc-500/10 text-zinc-500 border border-zinc-500/20'}`}>
                                    <Globe size={12} />
                                    {analytics?.store?.isLive ? 'Active' : 'Inactive'}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {stats.map((stat, index) => (
                    <motion.div
                        key={index}
                        whileHover={{ y: -4 }}
                        className="bg-[#0A0A0A]/40 backdrop-blur-3xl rounded-[2rem] p-7 border border-white/[0.03] group hover:border-white/[0.08] transition-all shadow-xl"
                    >
                        <div className="flex items-center justify-between mb-6">
                            <div className={`p-3.5 rounded-2xl ${stat.bgColor} border ${stat.borderColor} group-hover:scale-110 transition-transform duration-500`}>
                                <stat.icon className={`w-5 h-5 ${stat.color}`} />
                            </div>
                            <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full ${stat.change >= 0 ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'} text-[10px] font-black`}>
                                {stat.change >= 0 ? (
                                    <TrendingUp className="w-3.5 h-3.5" />
                                ) : (
                                    <TrendingDown className="w-3.5 h-3.5" />
                                )}
                                <span>{Math.abs(stat.change)}%</span>
                            </div>
                        </div>
                        <p className="text-3xl font-black text-white mb-2 tracking-tight group-hover:translate-x-1 transition-transform">{stat.value}</p>
                        <p className="text-[10px] font-black text-zinc-600 uppercase tracking-[0.2em]">{stat.title}</p>
                    </motion.div>
                ))}
            </div>

            {/* Usage & Quick Actions */}
            <div className="grid lg:grid-cols-2 gap-6">
                {/* Usage Meters */}
                <div className="bg-[#050505] rounded-3xl p-8 border border-white/5 space-y-8">
                    <h3 className="text-lg font-bold text-white">Usage Limits</h3>

                    {[
                        { label: 'AI Generations', used: analytics?.usage?.ai?.used, total: analytics?.usage?.ai?.total, percentage: analytics?.usage?.ai?.percentage, color: 'from-emerald-500 to-teal-500' },
                        { label: 'Storage', used: `${analytics?.usage?.storage?.used}MB`, total: `${analytics?.usage?.storage?.total}MB`, percentage: analytics?.usage?.storage?.percentage, color: 'from-blue-500 to-indigo-500' },
                        { label: 'Products', used: analytics?.usage?.products?.used, total: analytics?.usage?.products?.total, percentage: analytics?.usage?.products?.percentage, color: 'from-purple-500 to-pink-500' }
                    ].map((meter, i) => (
                        <div key={i} className="space-y-3">
                            <div className="flex justify-between items-end">
                                <div>
                                    <p className="text-[10px] font-black text-zinc-600 uppercase tracking-widest mb-1">{meter.label}</p>
                                    <p className="text-sm font-bold text-white">
                                        {meter.used} / {meter.total}
                                    </p>
                                </div>
                                <span className="text-xs font-bold text-zinc-400">
                                    {meter.percentage}%
                                </span>
                            </div>
                            <div className="w-full h-1.5 bg-zinc-900 rounded-full overflow-hidden">
                                <motion.div
                                    initial={{ width: 0 }}
                                    animate={{ width: `${Math.min(100, meter.percentage || 0)}%` }}
                                    className={`h-full bg-gradient-to-r ${meter.color}`}
                                />
                            </div>
                        </div>
                    ))}
                </div>

                <div className="bg-indigo-500/5 rounded-3xl p-8 border border-indigo-500/20">
                    <h3 className="text-lg font-bold text-white mb-6">Quick Actions</h3>
                    <div className="grid grid-cols-2 gap-4">
                        <Link href="/dashboard/projects/new" className="p-4 bg-white/5 rounded-2xl border border-white/5 hover:bg-white/10 transition-all text-center group">
                            <Plus className="w-5 h-5 text-zinc-400 mx-auto mb-2 group-hover:text-white transition-colors" />
                            <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest group-hover:text-white transition-colors">Add Project</span>
                        </Link>
                        <Link href="/dashboard/billing" className="p-4 bg-indigo-500/10 rounded-2xl border border-indigo-500/20 hover:bg-indigo-500/20 transition-all text-center group">
                            <Zap className="w-5 h-5 text-indigo-400 mx-auto mb-2 group-hover:scale-110 transition-transform" />
                            <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest">Upgrade Plan</span>
                        </Link>
                        <Link href={`/u/${analytics?.store?.username}`} target="_blank" className="p-4 bg-zinc-900/50 rounded-2xl border border-white/5 hover:bg-zinc-900 transition-all text-center group">
                            <Eye className="w-5 h-5 text-zinc-400 mx-auto mb-2 group-hover:text-white transition-colors" />
                            <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest group-hover:text-white transition-colors">View Store</span>
                        </Link>
                        <Link href="/dashboard/domain" className="p-4 bg-zinc-900/50 rounded-2xl border border-white/5 hover:bg-zinc-900 transition-all text-center group">
                            <Globe className="w-5 h-5 text-zinc-400 mx-auto mb-2 group-hover:text-white transition-colors" />
                            <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest group-hover:text-white transition-colors">Custom Domain</span>
                        </Link>
                    </div>
                </div>
            </div>

            {/* DM Section */}
            <DMSection />
        </div>
    );
}
