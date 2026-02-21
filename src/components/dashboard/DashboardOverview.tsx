
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
            <div className="bg-gradient-to-r from-indigo-900/50 to-purple-900/50 rounded-3xl p-8 border border-indigo-500/20 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/20 blur-[100px] rounded-full -mr-16 -mt-16" />

                <div className="flex flex-col md:flex-row items-center justify-between relative z-10 gap-6">
                    <div>
                        <div className="flex items-center gap-2 mb-4">
                            <div className={`w-2 h-2 rounded-full ${analytics?.store?.isLive ? 'bg-emerald-500 animate-pulse' : 'bg-zinc-600'}`} />
                            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400">
                                {analytics?.store?.isLive ? 'Store Live' : 'Store Offline'}
                            </span>
                        </div>
                        <h2 className="text-3xl font-bold text-white mb-2">Welcome back, {user?.firstName || 'Creator'}! 👋</h2>
                        <p className="text-zinc-300 max-w-lg">
                            Your store earned <span className="text-white font-bold">₹{analytics?.revenue?.total || 0}</span>.
                            The Indian creator economy is booming, and you're leading the charge.
                        </p>
                    </div>
                    {/* Simplified Payout Widget */}
                    <div className="w-full md:w-auto bg-black/20 backdrop-blur-md rounded-2xl p-6 border border-white/10 min-w-[200px]">
                        <div className="text-right">
                            <p className="text-xs font-bold text-zinc-400 uppercase tracking-widest mb-1">Balance</p>
                            <p className="text-3xl font-black text-white">₹{analytics?.revenue?.total || 0}</p>
                            <div className="flex justify-end gap-2 mt-2">
                                <span className={`text-[10px] px-2 py-0.5 rounded font-bold ${analytics?.store?.isLive ? 'bg-emerald-500/20 text-green-400' : 'bg-zinc-500/20 text-zinc-400'}`}>
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
                    <div key={index} className={`bg-zinc-900/50 rounded-2xl p-6 border ${stat.borderColor} group hover:bg-zinc-900 transition-all`}>
                        <div className="flex items-center justify-between mb-4">
                            <div className={`p-3 rounded-xl ${stat.bgColor}`}>
                                <stat.icon className={`w-5 h-5 ${stat.color}`} />
                            </div>
                            <div className={`flex items-center gap-1 ${stat.change >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                                {stat.change >= 0 ? (
                                    <TrendingUp className="w-3 h-3" />
                                ) : (
                                    <TrendingDown className="w-3 h-3" />
                                )}
                                <span className="text-xs font-bold">{Math.abs(stat.change)}%</span>
                            </div>
                        </div>
                        <p className="text-3xl font-bold text-white mb-1">{stat.value}</p>
                        <p className="text-xs font-medium text-zinc-500 uppercase tracking-widest">{stat.title}</p>
                    </div>
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
                            <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest group-hover:text-white transition-colors">Add Product</span>
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
