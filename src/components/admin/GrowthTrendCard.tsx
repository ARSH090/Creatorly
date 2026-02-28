'use client';

import React, { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import { Loader2, TrendingUp } from 'lucide-react';

const AreaChartComponent = dynamic(() => import('@/components/charts/AreaChartComponent'), {
    ssr: false,
    loading: () => <div className="h-64 flex flex-col items-center justify-center rounded-3xl border border-white/5 bg-black/20 animate-pulse" />
});

const MultiAreaChart = dynamic(() => import('recharts').then(mod => {
    const { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } = mod;
    return function DynamicMultiAreaChart({ data }: { data: any[] }) {
        return (
            <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                    <defs>
                        <linearGradient id="colorUsers" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                            <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                        </linearGradient>
                        <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                            <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                        </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#ffffff10" />
                    <XAxis
                        dataKey="month"
                        axisLine={false}
                        tickLine={false}
                        tick={{ fill: '#71717a', fontSize: 10, fontWeight: 'bold' }}
                        dy={10}
                    />
                    <YAxis hide />
                    <Tooltip
                        contentStyle={{ backgroundColor: '#09090b', border: '1px solid #ffffff10', borderRadius: '12px' }}
                        itemStyle={{ fontSize: '10px', fontWeight: 'bold', textTransform: 'uppercase' }}
                    />
                    <Area
                        type="monotone"
                        dataKey="users"
                        stroke="#6366f1"
                        strokeWidth={4}
                        fillOpacity={1}
                        fill="url(#colorUsers)"
                    />
                    <Area
                        type="monotone"
                        dataKey="revenue"
                        stroke="#10b981"
                        strokeWidth={4}
                        fillOpacity={1}
                        fill="url(#colorRevenue)"
                    />
                </AreaChart>
            </ResponsiveContainer>
        );
    };
}), { ssr: false, loading: () => <div className="h-64 flex flex-col items-center justify-center rounded-3xl border border-white/5 bg-black/20 animate-pulse" /> });

export default function GrowthTrendCard() {
    const [data, setData] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchGrowth() {
            try {
                const res = await fetch('/api/admin/dashboard/growth');
                const json = await res.json();

                // Merge User and Revenue growth data for the chart
                const merged = json.userGrowth.map((u: any) => {
                    const r = json.revenueGrowth.find((rg: any) => rg._id === u._id);
                    return {
                        month: u._id,
                        users: u.count,
                        revenue: r ? r.revenue : 0
                    };
                });
                setData(merged);
            } catch (err) {
                console.error('Failed to fetch growth data:', err);
            } finally {
                setLoading(false);
            }
        }
        fetchGrowth();
    }, []);

    if (loading) {
        return (
            <div className="h-64 flex flex-col items-center justify-center rounded-3xl border border-white/5 bg-black/20">
                <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
                <p className="text-[10px] font-black uppercase tracking-widest text-zinc-600 mt-4">Analyzing Growth...</p>
            </div>
        );
    }

    return (
        <div className="h-72 w-full mt-4">
            <MultiAreaChart data={data} />
            <div className="flex items-center gap-6 mt-6 px-4">
                <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-indigo-500" />
                    <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">New Creators</span>
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-emerald-500" />
                    <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Gross Revenue</span>
                </div>
            </div>
        </div>
    );
}
