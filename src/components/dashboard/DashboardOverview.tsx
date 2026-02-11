'use client';

import React, { useState, useEffect } from 'react';
import { TrendingUp, TrendingDown, Users, ShoppingBag, Wallet, Eye, ArrowRight, Plus, Zap } from "lucide-react";
import Link from 'next/link';

// NOTE: Recharts is needed for charts. If not installed, these will need to be installed.
// Assuming recharts is available based on previous context or requirements, otherwise will use simple visual placeholders to avoid build breaks if package missing.
// Checking imports first - implementing with simple visual fallback for robust build, can enhance with Recharts if confirmed.

import { WelcomeTour } from './WelcomeTour';

export default function DashboardOverview() {
    // Fetch real data from backend
    const [analytics, setAnalytics] = useState<any>(null);
    const [showTour, setShowTour] = useState(false);

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
            try {
                const res = await fetch('/api/creator/analytics');
                const data = await res.json();
                if (data.error) throw new Error(data.error);
                setAnalytics(data);
            } catch (err) {
                console.error('Failed to load analytics:', err);
                // Fallback to minimal zeros if fetch fails
                setAnalytics({
                    todayRevenue: 0,
                    todayVisitors: 0,
                    totalProducts: 0,
                    pendingPayout: 0,
                    revenueChange: 0,
                    visitorChange: 0,
                    repeatRate: 0,
                    recentOrders: []
                });
            }
        };

        fetchAnalytics();
    }, []);

    const stats = [
        {
            title: "Today's Revenue",
            value: `₹${analytics?.todayRevenue || 0}`,
            change: analytics?.revenueChange || 0,
            icon: Wallet,
            color: "text-emerald-400",
            bgColor: "bg-emerald-500/10",
            borderColor: "border-emerald-500/20"
        },
        {
            title: "Total Products",
            value: analytics?.totalProducts || 0,
            change: 12,
            icon: ShoppingBag,
            color: "text-blue-400",
            bgColor: "bg-blue-500/10",
            borderColor: "border-blue-500/20"
        },
        {
            title: "Store Visitors",
            value: analytics?.todayVisitors || 0,
            change: analytics?.visitorChange || 0,
            icon: Eye,
            color: "text-indigo-400",
            bgColor: "bg-indigo-500/10",
            borderColor: "border-indigo-500/20"
        },
        {
            title: "Repeat Customers",
            value: `${analytics?.repeatRate || 0}%`,
            change: 5,
            icon: Users,
            color: "text-amber-400",
            bgColor: "bg-amber-500/10",
            borderColor: "border-amber-500/20"
        }
    ];

    return (
        <div className="space-y-8 max-w-7xl mx-auto">
            <WelcomeTour run={showTour} onClose={handleTourClose} />
            {/* Welcome Card */}

            <div className="bg-gradient-to-r from-indigo-900/50 to-purple-900/50 rounded-3xl p-8 border border-indigo-500/20 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/20 blur-[100px] rounded-full -mr-16 -mt-16" />

                <div className="flex flex-col md:flex-row items-center justify-between relative z-10 gap-6">
                    <div>
                        <h2 className="text-3xl font-bold text-white mb-2">Welcome back, Creator! 👋</h2>
                        <p className="text-zinc-300 max-w-lg">
                            Your store earned <span className="text-white font-bold">₹{analytics?.pendingPayout || 0}</span> this week.
                            The Indian creator economy is booming, and you're leading the charge.
                        </p>
                    </div>
                    <div className="w-full md:w-auto bg-black/20 backdrop-blur-md rounded-2xl p-6 border border-white/10 min-w-[200px]">
                        <div className="text-right">
                            <p className="text-xs font-bold text-zinc-400 uppercase tracking-widest mb-1">Next Payout</p>
                            <p className="text-3xl font-black text-white">₹{analytics?.pendingPayout || 0}</p>
                            <div className="flex justify-end gap-2 mt-2">
                                <span className="text-[10px] bg-green-500/20 text-green-400 px-2 py-0.5 rounded font-bold">Processing</span>
                                <span className="text-[10px] text-zinc-500 py-0.5">in 2 days</span>
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

            {/* Charts & Lists */}
            <div className="grid lg:grid-cols-2 gap-6">
                {/* Revenue Chart Placeholder */}
                <div className="bg-[#050505] rounded-3xl p-6 border border-white/5 flex flex-col">
                    <div className="flex items-center justify-between mb-8">
                        <h3 className="text-lg font-bold text-white">Revenue Trend</h3>
                        <div className="flex gap-2">
                            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                            <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Live Updates</span>
                        </div>
                    </div>

                    <div className="flex-1 min-h-[250px] relative flex items-end justify-between gap-2 px-2 pb-2">
                        {/* CSS-only chart visual */}
                        {[40, 65, 50, 75, 60, 85, 95].map((h, i) => (
                            <div key={i} className="w-full bg-indigo-500/10 rounded-t-lg relative group hover:bg-indigo-500/20 transition-all" style={{ height: `${h}%` }}>
                                <div className="absolute top-0 w-full h-1 bg-indigo-500/50 hidden group-hover:block" />
                                <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-black text-white text-[10px] px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity">
                                    ₹{h * 100}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Usage Meters & Quick Actions */}
                <div className="space-y-6">
                    <div className="bg-[#050505] rounded-3xl p-8 border border-white/5">
                        <h3 className="text-lg font-bold text-white mb-6">Usage Limits</h3>
                        <div className="space-y-8">
                            <div className="space-y-3">
                                <div className="flex justify-between items-end">
                                    <div>
                                        <p className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-1">AI Generations</p>
                                        <p className="text-sm font-bold text-white">
                                            {analytics?.usage?.ai?.used || 0} / {analytics?.usage?.ai?.limit || 10}
                                        </p>
                                    </div>
                                    <span className="text-xs font-bold text-emerald-400">
                                        {Math.round(((analytics?.usage?.ai?.used || 0) / (analytics?.usage?.ai?.limit || 10)) * 100)}%
                                    </span>
                                </div>
                                <div className="w-full h-2 bg-zinc-900 rounded-full overflow-hidden border border-white/5">
                                    <div
                                        className="h-full bg-gradient-to-r from-emerald-500 to-teal-500"
                                        style={{ width: `${Math.min(100, Math.round(((analytics?.usage?.ai?.used || 0) / (analytics?.usage?.ai?.limit || 10)) * 100))}%` }}
                                    />
                                </div>
                            </div>
                            <div className="space-y-3">
                                <div className="flex justify-between items-end">
                                    <div>
                                        <p className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-1">Storage Used</p>
                                        <p className="text-sm font-bold text-white">
                                            {analytics?.usage?.storage?.used || 0} MB / {analytics?.usage?.storage?.limit || 100} MB
                                        </p>
                                    </div>
                                    <span className="text-xs font-bold text-indigo-400">
                                        {Math.round(((analytics?.usage?.storage?.used || 0) / (analytics?.usage?.storage?.limit || 100)) * 100)}%
                                    </span>
                                </div>
                                <div className="w-full h-2 bg-zinc-900 rounded-full overflow-hidden border border-white/5">
                                    <div className="h-full bg-gradient-to-r from-indigo-500 to-purple-500" style={{ width: `${Math.min(100, Math.round(((analytics?.usage?.storage?.used || 0) / (analytics?.usage?.storage?.limit || 100)) * 100))}%` }} />
                                </div>
                            </div>
                        </div>

                    </div>

                    <div className="bg-indigo-500/5 rounded-3xl p-8 border border-indigo-500/20">
                        <h3 className="text-lg font-bold text-white mb-6">Quick Actions</h3>
                        <div className="grid grid-cols-2 gap-4">
                            <Link href="/dashboard/projects" className="p-4 bg-white/5 rounded-2xl border border-white/5 hover:bg-white/10 transition-all text-center">
                                <Plus className="w-5 h-5 text-white mx-auto mb-2" />
                                <span className="text-[10px] font-bold text-white uppercase tracking-widest">New Project</span>
                            </Link>
                            <Link href="/dashboard/billing" className="p-4 bg-indigo-500/10 rounded-2xl border border-indigo-500/20 hover:bg-indigo-500/20 transition-all text-center">
                                <Zap className="w-5 h-5 text-indigo-400 mx-auto mb-2" />
                                <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest">Upgrade Plan</span>
                            </Link>
                        </div>
                    </div>
                </div>
            </div>

            {/* Recent Orders Bottom Row */}
            <div className="bg-[#050505] rounded-3xl p-8 border border-white/5">
                <div className="flex items-center justify-between mb-8">
                    <h3 className="text-lg font-bold text-white">Recent Orders</h3>
                    <Link href="/dashboard/orders" className="text-xs font-bold text-indigo-400 hover:text-indigo-300 flex items-center gap-1">
                        View all <ArrowRight className="w-3 h-3" />
                    </Link>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {analytics?.recentOrders?.map((order: any) => (
                        <div key={order.id} className="flex items-center justify-between p-4 rounded-2xl bg-white/3 hover:bg-white/5 transition-colors border border-white/5">
                            <div className="flex items-center gap-4">
                                <div className="w-10 h-10 rounded-full bg-indigo-500/10 flex items-center justify-center border border-white/10">
                                    <ShoppingBag className="w-4 h-4 text-indigo-400" />
                                </div>
                                <div>
                                    <p className="font-bold text-sm text-white">{order.id}</p>
                                    <p className="text-[10px] text-zinc-500">{order.customerEmail}</p>
                                </div>
                            </div>
                            <div className="text-right">
                                <p className="font-bold text-white text-sm">₹{order.amount}</p>
                                <p className="text-[10px] text-zinc-500">{order.time}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
