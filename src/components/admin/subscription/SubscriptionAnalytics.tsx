'use client';

import React, { useState, useEffect } from 'react';
import {
    TrendingUp,
    Users,
    Activity,
    Wallet,
    PieChart as PieChartIcon,
    BarChart3 as BarChartIcon,
    ArrowUpRight,
    ArrowDownRight,
    Zap
} from 'lucide-react';
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    PieChart,
    Pie,
    Cell
} from 'recharts';
import { Card } from '@/components/ui/card';
import { StatsSkeleton } from '@/components/ui/skeleton-loaders';
import { cn } from '@/lib/utils';

const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ef4444'];

export default function SubscriptionAnalytics() {
    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchAnalytics();
    }, []);

    const fetchAnalytics = async () => {
        try {
            setLoading(true);
            const res = await fetch('/api/admin/analytics');
            const json = await res.json();
            setData(json);
        } catch (err) {
            console.error('Failed to fetch analytics', err);
        } finally {
            setLoading(false);
        }
    };

    if (loading) return <StatsSkeleton count={4} />;

    const stats = [
        {
            title: 'TOTAL MRR',
            value: `₹${data.mrr?.toLocaleString()}`,
            icon: Wallet,
            color: 'text-indigo-400',
            bg: 'bg-indigo-500/10',
            trend: '+12.5%',
            isUp: true
        },
        {
            title: 'ACTIVE SIGNALS',
            value: data.activeCount,
            icon: Users,
            color: 'text-emerald-400',
            bg: 'bg-emerald-500/10',
            trend: '+4.2%',
            isUp: true
        },
        {
            title: 'CHURN VELOCITY',
            value: `${data.churnRate}%`,
            icon: Activity,
            color: 'text-rose-400',
            bg: 'bg-rose-500/10',
            trend: '-1.8%',
            isUp: false
        },
        {
            title: 'GROWTH INDEX',
            value: '1.2x',
            icon: Zap,
            color: 'text-amber-400',
            bg: 'bg-amber-500/10',
            trend: 'STABLE',
            isUp: true
        },
    ];

    return (
        <div className="space-y-12 animate-in fade-in duration-700">
            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {stats.map((stat, i) => (
                    <div key={i} className="bg-zinc-900/40 backdrop-blur-xl border border-white/5 rounded-[2.5rem] p-8 space-y-6 hover:border-white/10 transition-all group relative overflow-hidden">
                        <div className={cn("w-14 h-14 rounded-2xl flex items-center justify-center transition-transform group-hover:scale-110 duration-500", stat.bg)}>
                            <stat.icon className={cn("w-6 h-6", stat.color)} />
                        </div>
                        <div className="space-y-2">
                            <p className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em]">{stat.title}</p>
                            <div className="flex items-end justify-between">
                                <h3 className="text-3xl font-black text-white italic tracking-tighter italic">{stat.value}</h3>
                                <div className={cn(
                                    "flex items-center gap-1 text-[10px] font-black px-2 py-1 rounded-lg border",
                                    stat.isUp ? "text-emerald-400 border-emerald-500/20 bg-emerald-500/5" : "text-rose-400 border-rose-500/20 bg-rose-500/5"
                                )}>
                                    {stat.isUp ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
                                    {stat.trend}
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Charts Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
                <div className="lg:col-span-8 bg-zinc-900/40 backdrop-blur-xl border border-white/5 rounded-[3.5rem] p-10 space-y-8">
                    <div className="flex items-center justify-between px-4">
                        <div className="space-y-1">
                            <h3 className="text-xl font-black text-white italic uppercase tracking-tighter">FISCAL TRAJECTORY</h3>
                            <p className="text-[10px] font-black text-zinc-600 uppercase tracking-widest">Revenue Distribution by Tier Spectrum</p>
                        </div>
                        <div className="flex gap-2">
                            <div className="w-3 h-3 rounded-full bg-indigo-500" />
                            <div className="w-3 h-3 rounded-full bg-zinc-800" />
                        </div>
                    </div>
                    <div className="h-[400px] w-full mt-6">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={data.tierStats}>
                                <defs>
                                    <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="0%" stopColor="#6366f1" stopOpacity={1} />
                                        <stop offset="100%" stopColor="#6366f1" stopOpacity={0.2} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#ffffff05" />
                                <XAxis
                                    dataKey="_id"
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fill: '#52525b', fontSize: 10, fontWeight: 900, textTransform: 'uppercase' }}
                                />
                                <YAxis
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fill: '#52525b', fontSize: 10, fontWeight: 900 }}
                                />
                                <Tooltip
                                    cursor={{ fill: 'rgba(255,255,255,0.03)' }}
                                    contentStyle={{ backgroundColor: '#09090b', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '1.5rem', padding: '1.5rem' }}
                                    itemStyle={{ fontSize: '12px', fontWeight: 900, textTransform: 'uppercase', color: '#fff' }}
                                />
                                <Bar dataKey="revenue" fill="url(#barGradient)" radius={[12, 12, 0, 0]} barSize={40} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                <div className="lg:col-span-4 bg-zinc-900/40 backdrop-blur-xl border border-white/5 rounded-[3.5rem] p-10 space-y-8 flex flex-col justify-between">
                    <div className="space-y-1 px-4 text-center">
                        <h3 className="text-xl font-black text-white italic uppercase tracking-tighter">POPULATION DENSITY</h3>
                        <p className="text-[10px] font-black text-zinc-600 uppercase tracking-widest">Active Signal Distribution</p>
                    </div>

                    <div className="h-[300px] w-full relative">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={data.tierStats}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={80}
                                    outerRadius={100}
                                    paddingAngle={8}
                                    dataKey="count"
                                    stroke="none"
                                >
                                    {data.tierStats?.map((entry: any, index: number) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip
                                    contentStyle={{ backgroundColor: '#09090b', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '1.5rem' }}
                                />
                            </PieChart>
                        </ResponsiveContainer>
                        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                            <span className="text-[10px] font-black text-zinc-600 uppercase tracking-widest">TOTAL</span>
                            <span className="text-3xl font-black text-white italic tracking-tighter">{data.activeCount}</span>
                        </div>
                    </div>

                    <div className="space-y-4 px-4">
                        {data.tierStats?.map((tier: any, i: number) => (
                            <div key={i} className="flex items-center justify-between group">
                                <div className="flex items-center gap-3">
                                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                                    <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest group-hover:text-white transition-colors">{tier._id}</span>
                                </div>
                                <span className="text-xs font-black text-white italic">{tier.count}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
