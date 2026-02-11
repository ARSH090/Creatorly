'use client';

import React, { useEffect, useMemo, useState } from 'react';
import {
    BarChart3, TrendingUp, Users, DollarSign,
    ArrowUpRight, ArrowDownRight, Globe,
    Download, Package
} from 'lucide-react';
import { motion } from 'framer-motion';

type RangeKey = '7D' | '30D' | '90D' | 'All';

interface DashboardStatsResponse {
    todayRevenue: number;
    todayVisitors: number;
    totalProducts: number;
    pendingPayout: number;
}

interface ConversionRow {
    productId: string;
    clicks: number;
    sales: number;
    conversionRate: number;
}

interface TrafficRow {
    name: string;
    count: number;
}

interface SeriesPoint {
    _id: string; // yyyy-mm-dd
    count?: number;
    amount?: number;
}

interface SeriesResponse {
    visits: SeriesPoint[];
    productClicks: SeriesPoint[];
    revenue: SeriesPoint[];
}

export default function AnalyticsPage() {
    const [range, setRange] = useState<RangeKey>('30D');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const [stats, setStats] = useState<DashboardStatsResponse | null>(null);
    const [conversion, setConversion] = useState<ConversionRow[]>([]);
    const [traffic, setTraffic] = useState<TrafficRow[]>([]);
    const [series, setSeries] = useState<SeriesResponse | null>(null);

    useEffect(() => {
        let cancelled = false;
        async function loadData() {
            try {
                setLoading(true);
                setError(null);

                const daysParam = range === 'All' ? '90' : range.replace('D', '');

                const [statsRes, convRes, trafficRes, seriesRes] = await Promise.all([
                    fetch('/api/creator/analytics'),
                    fetch('/api/creator/analytics/conversion'),
                    fetch('/api/creator/analytics/traffic'),
                    fetch(`/api/creator/analytics/series?days=${daysParam}`)
                ]);

                if (!statsRes.ok) throw new Error('Failed to load overview');

                const statsJson = await statsRes.json();
                const convJson = convRes.ok ? await convRes.json() : [];
                const trafficJson = trafficRes.ok ? await trafficRes.json() : [];
                const seriesJson = seriesRes.ok ? await seriesRes.json() : null;

                if (cancelled) return;

                setStats(statsJson);
                setConversion(convJson);
                setTraffic(trafficJson);
                setSeries(seriesJson);
            } catch (e: any) {
                if (!cancelled) {
                    setError(e.message || 'Failed to load analytics');
                }
            } finally {
                if (!cancelled) setLoading(false);
            }
        }

        loadData();
        return () => {
            cancelled = true;
        };
    }, [range]);

    const topProducts = useMemo(() => {
        return conversion
            .slice()
            .sort((a, b) => b.sales - a.sales)
            .slice(0, 3);
    }, [conversion]);

    const totalRevenue = useMemo(() => {
        if (!series?.revenue) return 0;
        return series.revenue.reduce((sum, p) => sum + (p.amount || 0), 0);
    }, [series]);

    const totalViews = useMemo(() => {
        if (!series?.visits) return 0;
        return series.visits.reduce((sum, p) => sum + (p.count || 0), 0);
    }, [series]);

    const overallConversion = useMemo(() => {
        const totalClicks = conversion.reduce((sum, row) => sum + row.clicks, 0);
        const totalSales = conversion.reduce((sum, row) => sum + row.sales, 0);
        if (!totalClicks) return 0;
        return (totalSales / totalClicks) * 100;
    }, [conversion]);

    const statCards = [
        {
            name: 'Total Revenue',
            value: `₹${totalRevenue.toLocaleString('en-IN')}`,
            change: '+', // we don’t have comparison yet
            icon: DollarSign,
            color: 'emerald'
        },
        {
            name: 'Active Customers',
            value: stats ? stats.todayVisitors.toString() : '0',
            change: '+',
            icon: Users,
            color: 'indigo'
        },
        {
            name: 'Conv. Rate',
            value: `${overallConversion.toFixed(1)}%`,
            change: overallConversion >= 0 ? '+' : '-',
            icon: TrendingUp,
            color: 'amber'
        },
        {
            name: 'Total Views',
            value: totalViews ? totalViews.toLocaleString('en-IN') : '0',
            change: '+',
            icon: Globe,
            color: 'purple'
        }
    ];

    const isLoadingSkeleton = loading && !stats && !series;

    return (
        <div className="max-w-7xl mx-auto space-y-12 pb-20">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div className="space-y-1">
                    <h1 className="text-3xl font-black text-white">Analytics</h1>
                    <p className="text-zinc-500 font-medium">Track your growth and understand your audience.</p>
                </div>
                <div className="flex bg-white/5 p-1 rounded-2xl border border-white/5">
                    {(['7D', '30D', '90D', 'All'] as RangeKey[]).map(r => (
                        <button
                            key={r}
                            type="button"
                            onClick={() => setRange(r)}
                            className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${range === r ? 'bg-white text-black' : 'text-zinc-500 hover:text-white'}`}
                        >
                            {r}
                        </button>
                    ))}
                </div>
            </div>

            {error && (
                <div className="bg-rose-500/10 border border-rose-500/30 text-rose-200 text-sm rounded-2xl px-4 py-3">
                    {error} — numbers may be incomplete.
                </div>
            )}

            {/* Quick Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {statCards.map((stat, idx) => (
                    <motion.div
                        key={stat.name}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: idx * 0.08 }}
                        className={`bg-[#0A0A0A] border border-white/5 p-8 rounded-[2.5rem] space-y-4 hover:border-white/10 transition-colors group ${isLoadingSkeleton ? 'animate-pulse' : ''}`}
                    >
                        <div className="flex items-center justify-between">
                            <div className="w-12 h-12 rounded-2xl flex items-center justify-center bg-white/5 text-zinc-300 group-hover:scale-110 transition-transform">
                                <stat.icon className="w-6 h-6" />
                            </div>
                            <div className="flex items-center gap-1 text-xs font-bold text-emerald-400">
                                <ArrowUpRight className="w-3 h-3" />
                            </div>
                        </div>
                        <div>
                            <p className="text-[10px] font-black uppercase tracking-widest text-zinc-600">{stat.name}</p>
                            <h3 className="text-2xl font-black mt-1">
                                {isLoadingSkeleton ? '—' : stat.value}
                            </h3>
                        </div>
                    </motion.div>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Main Graph */}
                <div className="lg:col-span-2 bg-[#0A0A0A] border border-white/5 rounded-[3rem] p-10 space-y-8 flex flex-col">
                    <div className="flex items-center justify-between">
                        <div className="space-y-1">
                            <h3 className="text-lg font-bold">Revenue Trends</h3>
                            <p className="text-xs text-zinc-500 font-medium">
                                Daily revenue, clicks, and visits over the last {range === 'All' ? '90' : range.replace('D', '')} days
                            </p>
                        </div>
                        <button
                            type="button"
                            onClick={() => {
                                window.open('/api/creator/analytics/export?range=' + range, '_blank');
                            }}
                            className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-indigo-400 hover:text-indigo-300"
                        >
                            Download CSV
                            <Download className="w-3 h-3" />
                        </button>
                    </div>

                    <div className="flex-1 min-h-[300px] border border-dashed border-white/5 rounded-3xl relative overflow-hidden">
                        {(!series || isLoadingSkeleton) && (
                            <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 text-zinc-600 text-[10px] font-black uppercase tracking-widest">
                                <BarChart3 className="w-8 h-8 animate-pulse" />
                                <span>Loading chart data…</span>
                            </div>
                        )}

                        {series && !isLoadingSkeleton && (
                            <div className="absolute inset-0 p-6 flex flex-col justify-end gap-4">
                                {/* Simple CSS-based "sparkline" bars for revenue */}
                                <div className="flex items-end gap-1 h-40">
                                    {series.revenue.map((point, idx) => {
                                        const max = Math.max(...series.revenue.map(p => p.amount || 0), 1);
                                        const height = ((point.amount || 0) / max) * 100;
                                        return (
                                            <div
                                                key={point._id + idx}
                                                className="flex-1 bg-indigo-500/15 rounded-t-full relative group"
                                                style={{ height: `${height || 4}%` }}
                                            >
                                                <div className="absolute -top-8 left-1/2 -translate-x-1/2 whitespace-nowrap px-2 py-1 rounded bg-black text-[10px] text-white opacity-0 group-hover:opacity-100 transition-opacity">
                                                    ₹{(point.amount || 0).toLocaleString('en-IN')}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                                <p className="text-[10px] text-zinc-600 font-black uppercase tracking-widest">
                                    Hover bars to see daily revenue
                                </p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Top Products View */}
                <div className="bg-[#0A0A0A] border border-white/5 rounded-[3rem] p-10 space-y-8">
                    <div className="space-y-1">
                        <h3 className="text-lg font-bold">Top Products</h3>
                        <p className="text-xs text-zinc-500 font-medium">Top performance by revenue</p>
                    </div>

                    <div className="space-y-6">
                        {topProducts.length === 0 && !isLoadingSkeleton && (
                            <p className="text-sm text-zinc-500">
                                No product performance data yet. Share your store and start making sales.
                            </p>
                        )}

                        {isLoadingSkeleton && (
                            Array.from({ length: 3 }).map((_, idx) => (
                                <div key={idx} className="flex items-center gap-4 group animate-pulse">
                                    <div className="w-12 h-12 rounded-xl bg-white/5" />
                                    <div className="flex-1 space-y-2">
                                        <div className="w-32 h-3 bg-white/5 rounded" />
                                        <div className="w-20 h-3 bg-white/5 rounded" />
                                    </div>
                                    <div className="w-12 h-3 bg-white/5 rounded" />
                                </div>
                            ))
                        )}

                        {!isLoadingSkeleton && topProducts.map((p) => (
                            <div key={p.productId} className="flex items-center gap-4 group">
                                <div className="w-12 h-12 rounded-xl bg-white/5 border border-white/5 flex items-center justify-center group-hover:bg-indigo-500/10 transition-colors">
                                    <Package className="w-6 h-6 text-zinc-700 group-hover:text-indigo-400 transition-colors" />
                                </div>
                                <div className="flex-1">
                                    <h4 className="text-sm font-bold line-clamp-1">Product #{p.productId.slice(-6)}</h4>
                                    <p className="text-[10px] font-medium text-zinc-500">
                                        {p.sales} sales, {p.clicks} clicks
                                    </p>
                                </div>
                                <div className="text-right">
                                    <p className="font-bold text-sm">{p.conversionRate.toFixed(1)}%</p>
                                </div>
                            </div>
                        ))}
                    </div>

                    <button className="w-full py-4 border border-white/5 rounded-2xl text-[10px] font-black uppercase tracking-widest text-zinc-500 hover:bg-white/5 transition-all">
                        View Detailed Report
                    </button>
                </div>
            </div>

            {/* Traffic Sources */}
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
                    {isLoadingSkeleton && (
                        Array.from({ length: 3 }).map((_, idx) => (
                            <div key={idx} className="space-y-2 animate-pulse">
                                <div className="flex items-center justify-between text-xs font-bold mb-2">
                                    <span className="w-20 h-3 bg-white/5 rounded" />
                                    <span className="w-8 h-3 bg-white/5 rounded" />
                                </div>
                                <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                                    <div className="h-full bg-indigo-500 rounded-full w-1/3" />
                                </div>
                            </div>
                        ))
                    )}

                    {!isLoadingSkeleton && traffic.length === 0 && (
                        <p className="text-sm text-zinc-500">
                            No traffic data yet. Share your store link to start tracking sources.
                        </p>
                    )}

                    {!isLoadingSkeleton && traffic.map((src, idx) => {
                        const total = traffic.reduce((sum, s) => sum + s.count, 0) || 1;
                        const pct = Math.round((src.count / total) * 100);
                        const colors = ['bg-indigo-500', 'bg-emerald-500', 'bg-purple-500', 'bg-zinc-500'];
                        const color = colors[idx % colors.length];
                        return (
                            <div key={src.name} className="space-y-2">
                                <div className="flex items-center justify-between text-xs font-bold mb-2">
                                    <span className="text-zinc-500 uppercase tracking-widest text-[9px]">
                                        {src.name}
                                    </span>
                                    <span>{pct}%</span>
                                </div>
                                <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                                    <div className={`h-full rounded-full ${color}`} style={{ width: `${pct}%` }} />
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}
