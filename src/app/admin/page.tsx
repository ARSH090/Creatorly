'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, ShoppingBag, CreditCard, TrendingUp, ShieldCheck, Activity } from 'lucide-react';
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip } from 'recharts';
import { StatsSkeleton, Skeleton } from '@/components/ui/skeleton-loaders';
import { EmptyState } from '@/components/ui/empty-state';
import { toast } from 'react-hot-toast';
import { cn } from '@/lib/utils';

interface DashboardStats {
    totalUsers: number;
    activeCreators: number;
    totalProducts: number;
    totalRevenue: number;
    recentRevenue: any[];
}

export default function AdminDashboard() {
    const [stats, setStats] = useState<DashboardStats | null>(null);
    const [loading, setLoading] = useState(true);

    const fetchStats = async () => {
        try {
            const res = await fetch('/api/admin/analytics/summary');
            if (res.ok) {
                const data = await res.json();
                setStats(data);
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
        fetchStats();
    }, []);

    if (loading) {
        return (
            <div className="space-y-12 animate-in fade-in duration-700">
                <header>
                    <Skeleton className="w-64 h-10 mb-4" />
                    <Skeleton className="w-48 h-3 opacity-50" />
                </header>
                <StatsSkeleton />
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-7">
                    <Skeleton className="col-span-4 h-[450px] rounded-[3rem]" />
                    <Skeleton className="col-span-3 h-[450px] rounded-[3rem]" />
                </div>
            </div>
        );
    }

    if (!stats) {
        return (
            <EmptyState
                icon={Activity}
                title="Telemetry Offline"
                description="The analytics relay is not transmitting data at this frequency."
                actionLabel="Retry Link"
                onAction={fetchStats}
            />
        );
    }

    return (
        <div className="max-w-7xl mx-auto space-y-12 pb-24 animate-in fade-in duration-700">
            <header>
                <h1 className="text-4xl font-black text-white italic uppercase tracking-tighter flex items-center gap-4">
                    <ShieldCheck className="w-10 h-10 text-indigo-500 shadow-[0_0_20px_rgba(99,102,241,0.4)]" />
                    CONTROL CENTER
                </h1>
                <p className="text-[10px] font-black text-zinc-600 uppercase tracking-[0.4em] mt-2 ml-14">
                    Platform Overview • Real-time Metrics
                </p>
            </header>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                {[
                    { label: 'Total Revenue', value: `₹${stats.totalRevenue.toLocaleString()}`, icon: CreditCard, color: 'text-emerald-500', trend: '+20.1% growth' },
                    { label: 'Active Users', value: stats.totalUsers, icon: Users, color: 'text-blue-500', trend: `${stats.activeCreators} active creators` },
                    { label: 'Total Products', value: stats.totalProducts, icon: ShoppingBag, color: 'text-purple-500', trend: '+12 new this week' },
                    { label: 'Conversion', value: '3.2%', icon: TrendingUp, color: 'text-orange-500', trend: '+0.4% from average' }
                ].map((s, i) => (
                    <Card key={i} className="bg-zinc-900/40 border-white/5 rounded-[2rem] overflow-hidden backdrop-blur-sm group hover:border-white/10 transition-colors">
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">{s.label}</CardTitle>
                            <s.icon className={cn("h-4 w-4 transition-transform group-hover:scale-110", s.color)} />
                        </CardHeader>
                        <CardContent>
                            <div className="text-3xl font-black text-white italic tracking-tighter">{s.value}</div>
                            <p className="text-[9px] font-bold text-zinc-600 uppercase tracking-widest mt-1">{s.trend}</p>
                        </CardContent>
                    </Card>
                ))}
            </div>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-7">
                <Card className="col-span-4 bg-zinc-900/40 border-white/5 rounded-[3rem] overflow-hidden backdrop-blur-sm">
                    <CardHeader className="p-8 border-b border-white/5">
                        <CardTitle className="text-sm font-black text-white uppercase tracking-widest">Revenue Trajectory</CardTitle>
                    </CardHeader>
                    <CardContent className="p-8">
                        <div className="h-[350px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={stats.recentRevenue}>
                                    <XAxis
                                        dataKey="date"
                                        stroke="#3f3f46"
                                        fontSize={10}
                                        tickLine={false}
                                        axisLine={false}
                                        tickFormatter={(v) => v.toUpperCase()}
                                    />
                                    <YAxis
                                        stroke="#3f3f46"
                                        fontSize={10}
                                        tickLine={false}
                                        axisLine={false}
                                        tickFormatter={(v) => `₹${v}`}
                                    />
                                    <Tooltip
                                        cursor={{ fill: 'rgba(255,255,255,0.03)' }}
                                        contentStyle={{
                                            backgroundColor: '#09090b',
                                            border: '1px solid rgba(255,255,255,0.05)',
                                            borderRadius: '1rem',
                                            fontSize: '10px',
                                            fontWeight: '900',
                                            textTransform: 'uppercase'
                                        }}
                                    />
                                    <Bar dataKey="value" fill="#6366f1" radius={[8, 8, 8, 8]} barSize={24} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </CardContent>
                </Card>

                <Card className="col-span-3 bg-zinc-900/40 border-white/5 rounded-[3rem] overflow-hidden backdrop-blur-sm">
                    <CardHeader className="p-8 border-b border-white/5">
                        <CardTitle className="text-sm font-black text-white uppercase tracking-widest">Platform Integrity</CardTitle>
                    </CardHeader>
                    <CardContent className="p-8">
                        <div className="space-y-6">
                            {[
                                { label: 'Database (MongoDB)', status: 'Operational', color: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' },
                                { label: 'Cache (Redis)', status: 'Operational', color: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' },
                                { label: 'Storage (S3)', status: 'Operational', color: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' },
                                { label: 'Payments (Razorpay)', status: 'Operational', color: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' },
                                { label: 'Security (Clerk)', status: 'Active', color: 'bg-blue-500/10 text-blue-400 border-blue-500/20' }
                            ].map((s, i) => (
                                <div key={i} className="flex items-center justify-between group">
                                    <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-widest group-hover:text-white transition-colors">{s.label}</span>
                                    <span className={cn("px-3 py-1 rounded-full border text-[9px] font-black uppercase tracking-widest", s.color)}>
                                        {s.status}
                                    </span>
                                </div>
                            ))}
                        </div>
                        <div className="mt-12 p-6 rounded-2xl bg-indigo-500/5 border border-indigo-500/10">
                            <p className="text-[9px] font-black text-indigo-400 uppercase tracking-widest mb-2 flex items-center gap-2">
                                <Activity size={10} /> System Load
                            </p>
                            <div className="h-1.5 w-full bg-indigo-500/10 rounded-full overflow-hidden">
                                <div className="h-full w-[24%] bg-indigo-500 shadow-[0_0_10px_rgba(99,102,241,0.5)]" />
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
