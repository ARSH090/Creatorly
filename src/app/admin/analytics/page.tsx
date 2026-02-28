'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
    BarChart3,
    TrendingUp,
    Users,
    ShoppingBag,
    ArrowUpRight,
    ArrowDownRight,
    PieChart,
    Calendar,
    Filter,
    BarChart,
    LineChart,
    Download,
    Activity
} from 'lucide-react';
import {
    ResponsiveContainer,
    Bar,
    BarChart as RechartsBarChart,
    XAxis,
    YAxis,
    Tooltip,
    Cell,
    Line,
    LineChart as RechartsLineChart
} from 'recharts';
import { StatsSkeleton, Skeleton } from '@/components/ui/skeleton-loaders';
import { EmptyState } from '@/components/ui/empty-state';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { toast } from 'react-hot-toast';

export default function AdminAnalyticsPage() {
    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [range, setRange] = useState('7d');

    const fetchAnalytics = async () => {
        setLoading(true);
        try {
            const res = await fetch(`/api/admin/analytics?range=${range}`);
            if (res.ok) {
                const result = await res.json();
                setData(result.data);
            } else {
                throw new Error('Signal lost');
            }
        } catch (error) {
            toast.error('Failed to sync with analytics relay');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchAnalytics();
    }, [range]);

    if (loading) {
        return (
            <div className="max-w-7xl mx-auto space-y-12 animate-in fade-in duration-700">
                <header className="flex justify-between items-end">
                    <div className="space-y-4">
                        <Skeleton className="w-64 h-10" />
                        <Skeleton className="w-48 h-3 opacity-50" />
                    </div>
                    <Skeleton className="w-48 h-12 rounded-2xl" />
                </header>
                <StatsSkeleton />
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <Skeleton className="h-[400px] rounded-[3rem]" />
                    <Skeleton className="h-[400px] rounded-[3rem]" />
                </div>
            </div>
        );
    }

    if (!data) {
        return (
            <EmptyState
                icon={PieChart}
                title="Telemetry Offline"
                description="The analytics engine is currently processing real-time signals."
                actionLabel="Reconnect Relay"
                onAction={fetchAnalytics}
            />
        );
    }

    return (
        <div className="max-w-7xl mx-auto space-y-12 pb-24 animate-in fade-in duration-700">
            <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div>
                    <h1 className="text-4xl font-black text-white italic uppercase tracking-tighter flex items-center gap-4">
                        <BarChart3 className="w-10 h-10 text-indigo-500 shadow-[0_0_20px_rgba(99,102,241,0.4)]" />
                        ANALYTICS ENGINE
                    </h1>
                    <p className="text-[10px] font-black text-zinc-600 uppercase tracking-[0.4em] mt-2 ml-14">
                        Revenue Intelligence • Growth Extraction
                    </p>
                </div>

                <div className="flex bg-zinc-900 border border-white/5 p-1.5 rounded-2xl backdrop-blur-sm">
                    {['24h', '7d', '30d', 'all'].map((r) => (
                        <button
                            key={r}
                            onClick={() => setRange(r)}
                            className={cn(
                                "px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all",
                                range === r ? "bg-white text-black shadow-lg" : "text-zinc-500 hover:text-white"
                            )}
                        >
                            {r}
                        </button>
                    ))}
                </div>
            </header>

            {/* Core Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                {[
                    { label: 'Gross Volume', value: `₹${(data.totalRevenue || 0).toLocaleString()}`, icon: TrendingUp, delta: '+12.5%', isUp: true },
                    { label: 'Active Creators', value: data.activeCreators || 0, icon: Users, delta: '+2.4%', isUp: true },
                    { label: 'Platform Sales', value: data.totalSales || 0, icon: ShoppingBag, delta: '-1.2%', isUp: false },
                    { label: 'Avg AOV', value: `₹${Math.round(data.totalRevenue / (data.totalSales || 1))}`, icon: Activity, delta: '+0.8%', isUp: true }
                ].map((s, i) => (
                    <div key={i} className="bg-zinc-900/40 border border-white/5 rounded-[2rem] p-8 backdrop-blur-sm group hover:border-white/10 transition-colors">
                        <div className="flex justify-between items-start mb-4">
                            <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">{s.label}</span>
                            <div className={cn(
                                "flex items-center gap-1 px-2 py-0.5 rounded text-[9px] font-black italic",
                                s.isUp ? "bg-emerald-500/10 text-emerald-400" : "bg-rose-500/10 text-rose-500"
                            )}>
                                {s.isUp ? <ArrowUpRight size={10} /> : <ArrowDownRight size={10} />}
                                {s.delta}
                            </div>
                        </div>
                        <p className="text-3xl font-black text-white italic tracking-tighter">{s.value}</p>
                    </div>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card className="bg-zinc-900/40 border-white/5 rounded-[3rem] overflow-hidden backdrop-blur-sm">
                    <CardHeader className="p-8 border-b border-white/5 flex flex-row items-center justify-between">
                        <CardTitle className="text-sm font-black text-white uppercase tracking-widest">Revenue Flow</CardTitle>
                        <BarChart className="w-4 h-4 text-zinc-600" />
                    </CardHeader>
                    <CardContent className="p-8">
                        <div className="h-[300px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <RechartsBarChart data={data.dailyRevenue || []}>
                                    <XAxis dataKey="date" hide />
                                    <YAxis hide />
                                    <Tooltip
                                        cursor={{ fill: 'rgba(255,255,255,0.03)' }}
                                        contentStyle={{ backgroundColor: '#09090b', border: 'none', borderRadius: '1rem', fontSize: '10px', fontWeight: '900' }}
                                    />
                                    <Bar dataKey="value" fill="#6366f1" radius={[4, 4, 4, 4]} />
                                </RechartsBarChart>
                            </ResponsiveContainer>
                        </div>
                    </CardContent>
                </Card>

                <Card className="bg-zinc-900/40 border-white/5 rounded-[3rem] overflow-hidden backdrop-blur-sm">
                    <CardHeader className="p-8 border-b border-white/5 flex flex-row items-center justify-between">
                        <CardTitle className="text-sm font-black text-white uppercase tracking-widest">Growth Velocity</CardTitle>
                        <TrendingUp className="w-4 h-4 text-zinc-600" />
                    </CardHeader>
                    <CardContent className="p-8">
                        <div className="h-[300px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <RechartsLineChart data={data.dailyGrowth || []}>
                                    <XAxis dataKey="date" hide />
                                    <YAxis hide />
                                    <Tooltip
                                        contentStyle={{ backgroundColor: '#09090b', border: 'none', borderRadius: '1rem', fontSize: '10px', fontWeight: '900' }}
                                    />
                                    <Line type="monotone" dataKey="value" stroke="#8b5cf6" strokeWidth={4} dot={false} />
                                </RechartsLineChart>
                            </ResponsiveContainer>
                        </div>
                    </CardContent>
                </Card>
            </div>

            <footer className="flex justify-center">
                <Button variant="ghost" className="text-[10px] font-black text-zinc-600 uppercase tracking-[0.4em] hover:text-white transition-colors">
                    <Download size={14} className="mr-2" />
                    Downlink Full Dataset (JSON)
                </Button>
            </footer>
        </div>
    );
}
