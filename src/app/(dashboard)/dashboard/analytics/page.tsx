'use client';

import React from 'react';
import {
    BarChart3, TrendingUp, Users, DollarSign,
    ArrowUpRight, ArrowDownRight, Globe, MousePointer2,
    Calendar, Download, ExternalLink, Package
} from 'lucide-react';
import { motion } from 'framer-motion';

const STATS = [
    { name: 'Total Revenue', value: '₹142,890', change: '+12.5%', icon: DollarSign, color: 'emerald' },
    { name: 'Active Customers', value: '1,284', change: '+8.2%', icon: Users, color: 'indigo' },
    { name: 'Conv. Rate', value: '4.8%', change: '-2.1%', icon: TrendingUp, color: 'amber' },
    { name: 'Total Views', value: '42.5K', change: '+24.3%', icon: Globe, color: 'purple' },
];

const TOP_PRODUCTS = [
    { name: 'Instagram Masterclass', sales: 420, revenue: '₹84,000', trend: 'up' },
    { name: 'Creator Presets Pack', sales: 280, revenue: '₹28,000', trend: 'up' },
    { name: 'Workflow Sheet', sales: 154, revenue: '₹3,080', trend: 'down' },
];

export default function AnalyticsPage() {
    return (
        <div className="max-w-7xl mx-auto space-y-12 pb-20">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div className="space-y-1">
                    <h1 className="text-3xl font-black text-white">Analytics</h1>
                    <p className="text-zinc-500 font-medium">Track your growth and understand your audience.</p>
                </div>
                <div className="flex bg-white/5 p-1 rounded-2xl border border-white/5">
                    {['7D', '30D', '90D', 'All'].map(range => (
                        <button key={range} className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${range === '30D' ? 'bg-white text-black' : 'text-zinc-500 hover:text-white'}`}>
                            {range}
                        </button>
                    ))}
                </div>
            </div>

            {/* Quick Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {STATS.map((stat, idx) => (
                    <motion.div
                        key={stat.name}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: idx * 0.1 }}
                        className="bg-[#0A0A0A] border border-white/5 p-8 rounded-[2.5rem] space-y-4 hover:border-white/10 transition-colors group"
                    >
                        <div className="flex items-center justify-between">
                            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center bg-${stat.color}-500/10 text-${stat.color}-400 group-hover:scale-110 transition-transform`}>
                                <stat.icon className="w-6 h-6" />
                            </div>
                            <div className={`flex items-center gap-1 text-xs font-bold ${stat.change.startsWith('+') ? 'text-emerald-400' : 'text-rose-400'}`}>
                                {stat.change}
                                {stat.change.startsWith('+') ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                            </div>
                        </div>
                        <div>
                            <p className="text-[10px] font-black uppercase tracking-widest text-zinc-600">{stat.name}</p>
                            <h3 className="text-2xl font-black mt-1">{stat.value}</h3>
                        </div>
                    </motion.div>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Main Graph Placeholder */}
                <div className="lg:col-span-2 bg-[#0A0A0A] border border-white/5 rounded-[3rem] p-10 space-y-8 flex flex-col">
                    <div className="flex items-center justify-between">
                        <div className="space-y-1">
                            <h3 className="text-lg font-bold">Revenue Trends</h3>
                            <p className="text-xs text-zinc-500 font-medium">Daily revenue across all products</p>
                        </div>
                        <button className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-indigo-400">
                            Download CSV
                            <Download className="w-3 h-3" />
                        </button>
                    </div>

                    <div className="flex-1 min-h-[300px] border border-dashed border-white/5 rounded-3xl flex flex-col items-center justify-center relative overflow-hidden group">
                        <div className="absolute inset-0 bg-gradient-to-t from-indigo-500/5 to-transparent" />
                        <BarChart3 className="w-12 h-12 text-zinc-800 group-hover:scale-110 transition-transform" />
                        <p className="text-zinc-600 text-[10px] font-black uppercase tracking-widest mt-4">Chart visualization arriving soon</p>
                    </div>
                </div>

                {/* Top Products View */}
                <div className="bg-[#0A0A0A] border border-white/5 rounded-[3rem] p-10 space-y-8">
                    <div className="space-y-1">
                        <h3 className="text-lg font-bold">Top Products</h3>
                        <p className="text-xs text-zinc-500 font-medium">Top performance by revenue</p>
                    </div>

                    <div className="space-y-6">
                        {TOP_PRODUCTS.map((p, idx) => (
                            <div key={p.name} className="flex items-center gap-4 group">
                                <div className="w-12 h-12 rounded-xl bg-white/5 border border-white/5 flex items-center justify-center group-hover:bg-indigo-500/10 transition-colors">
                                    <Package className="w-6 h-6 text-zinc-700 group-hover:text-indigo-400 transition-colors" />
                                </div>
                                <div className="flex-1">
                                    <h4 className="text-sm font-bold line-clamp-1">{p.name}</h4>
                                    <p className="text-[10px] font-medium text-zinc-500">{p.sales} sales this month</p>
                                </div>
                                <div className="text-right">
                                    <p className="font-bold text-sm">{p.revenue}</p>
                                    <div className={`flex items-center justify-end gap-1 text-[10px] font-bold ${p.trend === 'up' ? 'text-emerald-400' : 'text-rose-400'}`}>
                                        {p.trend === 'up' ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    <button className="w-full py-4 border border-white/5 rounded-2xl text-[10px] font-black uppercase tracking-widest text-zinc-500 hover:bg-white/5 transition-all">
                        View Detailed Report
                    </button>
                </div>
            </div>

            {/* Traffic Sources Mock */}
            <div className="bg-[#0A0A0A] border border-white/5 rounded-[3rem] p-10">
                <div className="flex items-center justify-between mb-10">
                    <div className="space-y-1">
                        <h3 className="text-lg font-bold">Traffic Sources</h3>
                        <p className="text-xs text-zinc-500 font-medium">Where your customers are coming from</p>
                    </div>
                    <div className="flex items-center gap-6">
                        <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-indigo-500" />
                            <span className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Social</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-emerald-500" />
                            <span className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Direct</span>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
                    <div className="space-y-2">
                        <div className="flex items-center justify-between text-xs font-bold mb-2">
                            <span className="text-zinc-500 uppercase tracking-widest text-[9px]">Instagram</span>
                            <span>64%</span>
                        </div>
                        <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                            <div className="h-full bg-indigo-500 rounded-full" style={{ width: '64%' }} />
                        </div>
                    </div>
                    <div className="space-y-2">
                        <div className="flex items-center justify-between text-xs font-bold mb-2">
                            <span className="text-zinc-500 uppercase tracking-widest text-[9px]">YouTube</span>
                            <span>22%</span>
                        </div>
                        <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                            <div className="h-full bg-purple-500 rounded-full" style={{ width: '22%' }} />
                        </div>
                    </div>
                    <div className="space-y-2">
                        <div className="flex items-center justify-between text-xs font-bold mb-2">
                            <span className="text-zinc-500 uppercase tracking-widest text-[9px]">Twitter / X</span>
                            <span>14%</span>
                        </div>
                        <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                            <div className="h-full bg-zinc-500 rounded-full" style={{ width: '14%' }} />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
