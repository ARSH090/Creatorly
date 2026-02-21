'use client';

import React, { useState, useEffect } from 'react';
import {
    TrendingUp,
    Users,
    Activity,
    Wallet,
    Loader2,
    PieChart as PieChartIcon,
    BarChart3
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

const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#f43f5e', '#8b5cf6'];

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

    if (loading) return (
        <div className="h-96 flex flex-col items-center justify-center gap-6">
            <div className="w-16 h-16 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin" />
            <p className="text-[10px] font-black text-zinc-600 uppercase tracking-[0.4em] animate-pulse">Scanning Revenue Flux</p>
        </div>
    );

    const stats = [
        { title: 'Total MRR', value: `₹${data?.mrr?.toLocaleString() || 0}`, icon: Wallet, color: 'text-indigo-500', bgColor: 'bg-indigo-500/10' },
        { title: 'Active Subs', value: data?.activeCount || 0, icon: Users, color: 'text-emerald-500', bgColor: 'bg-emerald-500/10' },
        { title: 'Churn Rate', value: `${data?.churnRate || 0}%`, icon: Activity, color: 'text-rose-500', bgColor: 'bg-rose-500/10' },
        { title: 'Growth Index', value: '1.2x', icon: TrendingUp, color: 'text-amber-500', bgColor: 'bg-amber-500/10' },
    ];

    return (
        <div className="space-y-10">
            <div className="flex items-center gap-4 mb-2">
                <div className="w-2 h-8 bg-indigo-500 rounded-full" />
                <h2 className="text-2xl font-black text-white uppercase tracking-tighter italic">REVENUE INTELLIGENCE</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {stats.map((stat, i) => (
                    <div key={i} className="bg-zinc-900/40 rounded-[2.5rem] p-8 border border-white/5 shadow-2xl backdrop-blur-sm relative overflow-hidden group">
                        <div className={`absolute top-0 right-0 w-24 h-24 ${stat.bgColor} blur-[60px] -mr-12 -mt-12 group-hover:scale-150 transition-transform duration-700`} />
                        <div className="flex items-center justify-between mb-6 relative z-10">
                            <div className={`p-4 ${stat.bgColor} rounded-2xl border border-white/5 group-hover:scale-110 transition-transform duration-500`}>
                                <stat.icon className={`w-6 h-6 ${stat.color}`} />
                            </div>
                        </div>
                        <div className="relative z-10">
                            <p className="text-4xl font-black text-white tracking-tighter italic group-hover:translate-x-1 transition-transform">{stat.value}</p>
                            <p className="text-[10px] font-black text-zinc-600 uppercase tracking-[0.3em] mt-2 ml-1">{stat.title}</p>
                        </div>
                    </div>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-5 gap-10">
                <div className="lg:col-span-3 bg-zinc-900/40 rounded-[3rem] border border-white/5 p-10 shadow-2xl backdrop-blur-md">
                    <h3 className="text-xl font-black text-white mb-10 flex items-center gap-4 uppercase tracking-tighter italic">
                        <BarChart3 className="w-5 h-5 text-indigo-500" />
                        Tier Performance Distribution
                    </h3>
                    <div className="h-[350px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={data?.tierStats}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#ffffff05" />
                                <XAxis
                                    dataKey="_id"
                                    stroke="#52525b"
                                    fontSize={10}
                                    fontWeight="900"
                                    tickFormatter={(v) => v.toUpperCase()}
                                />
                                <YAxis
                                    stroke="#52525b"
                                    fontSize={10}
                                    fontWeight="900"
                                />
                                <Tooltip
                                    contentStyle={{ backgroundColor: '#09090b', border: '1px solid #ffffff10', borderRadius: '12px' }}
                                    itemStyle={{ color: '#fff', fontSize: '12px', fontWeight: '900' }}
                                />
                                <Bar dataKey="revenue" fill="#6366f1" radius={[8, 8, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                <div className="lg:col-span-2 bg-zinc-900/40 rounded-[3rem] border border-white/5 p-10 shadow-2xl backdrop-blur-md">
                    <h3 className="text-xl font-black text-white mb-10 flex items-center gap-4 uppercase tracking-tighter italic">
                        <PieChartIcon className="w-5 h-5 text-emerald-500" />
                        Substructure Allocations
                    </h3>
                    <div className="h-[350px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={data?.tierStats}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={80}
                                    outerRadius={110}
                                    paddingAngle={8}
                                    dataKey="count"
                                    stroke="none"
                                >
                                    {data?.tierStats?.map((entry: any, index: number) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip
                                    contentStyle={{ backgroundColor: '#09090b', border: '1px solid #ffffff10', borderRadius: '12px' }}
                                    itemStyle={{ color: '#fff', fontSize: '12px', fontWeight: '900' }}
                                />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>
        </div>
    );
}
