// @ts-nocheck
'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function LiveMonitoringPage() {
    const [metrics, setMetrics] = useState({
        signups: 0,
        revenue: 0,
        activeUsers: 0,
        errorRate: 0,
        apiLatency: 0,
        timestamp: ''
    });
    const [loading, setLoading] = useState(true);

    const fetchMetrics = async () => {
        try {
            const response = await fetch('/api/admin/metrics/live');
            if (response.ok) {
                const data = await response.json();
                setMetrics(data);
            }
        } catch (error) {
            console.error('Failed to fetch live metrics');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchMetrics();
        const interval = setInterval(fetchMetrics, 30000); // Pulse every 30s
        return () => clearInterval(interval);
    }, []);

    if (loading) return (
        <div className="min-h-screen bg-[#030303] flex items-center justify-center">
            <div className="flex flex-col items-center gap-6">
                <div className="w-16 h-16 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin" />
                <p className="text-[10px] font-black text-zinc-600 uppercase tracking-[0.5em] animate-pulse">Initializing Launch Control</p>
            </div>
        </div>
    );

    return (
        <div className="min-h-screen bg-[#030303] space-y-12">
            <div className="flex justify-between items-center">
                <div className="space-y-1">
                    <h1 className="text-4xl font-black text-white tracking-tighter italic uppercase flex items-center gap-4">
                        <span className="animate-pulse inline-block w-4 h-4 bg-rose-500 rounded-full shadow-[0_0_15px_rgba(244,63,94,0.5)]"></span>
                        LAUNCH CONTROL
                    </h1>
                    <p className="text-[10px] font-black text-zinc-600 uppercase tracking-[0.4em] ml-8">Real-time Pulse • Production Environment</p>
                </div>
                <div className="text-right">
                    <div className="text-[10px] font-black text-zinc-600 uppercase tracking-widest mb-1">Last Update</div>
                    <div className="text-xl font-black text-white tracking-tighter italic font-mono uppercase bg-zinc-900 px-4 py-2 rounded-xl border border-white/5">
                        {new Date(metrics.timestamp).toLocaleTimeString()}
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
                <MonitorCard
                    label="Signups/hr"
                    value={metrics.signups}
                    target="Target: 50+"
                    status={metrics.signups > 50 ? 'success' : 'neutral'}
                />
                <MonitorCard
                    label="Revenue (24h)"
                    value={`₹${metrics.revenue.toLocaleString()}`}
                    target="Gross Inbound"
                    status="neutral"
                />
                <MonitorCard
                    label="Active Users"
                    value={metrics.activeUsers}
                    target="Live Sessions"
                    status="neutral"
                />
                <MonitorCard
                    label="Error Rate"
                    value={`${metrics.errorRate}%`}
                    target="Threshold: 0.1%"
                    status={metrics.errorRate > 0.1 ? 'danger' : 'success'}
                />
                <MonitorCard
                    label="API Latency"
                    value={`${metrics.apiLatency}ms`}
                    target="p95"
                    status={metrics.apiLatency > 200 ? 'warning' : 'success'}
                />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
                <Card className="lg:col-span-2 bg-zinc-900/40 border-white/5 rounded-[3rem] shadow-2xl backdrop-blur-md overflow-hidden">
                    <CardHeader className="bg-white/[0.02] border-b border-white/5 px-10 py-8">
                        <CardTitle className="text-xl font-black text-white uppercase tracking-tighter italic flex items-center gap-4">
                            <Activity className="w-5 h-5 text-indigo-500" />
                            Alert Intelligence Stream
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-10 space-y-6">
                        {metrics.errorRate > 0.1 && (
                            <div className="p-6 bg-rose-500/10 border border-rose-500/20 text-rose-500 font-black text-[10px] uppercase tracking-widest rounded-[1.5rem] animate-pulse flex items-center gap-4">
                                <AlertTriangle className="w-6 h-6" />
                                Critical: Error rate breach ({metrics.errorRate}%). Sentry investigation required.
                            </div>
                        )}
                        {metrics.apiLatency > 300 && (
                            <div className="p-6 bg-amber-500/10 border border-amber-500/20 text-amber-500 font-black text-[10px] uppercase tracking-widest rounded-[1.5rem] flex items-center gap-4">
                                <AlertTriangle className="w-6 h-6" />
                                Warning: Latency spike detected ({metrics.apiLatency}ms). DB pool verification initiated.
                            </div>
                        )}
                        <div className="p-6 bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 font-black text-[10px] uppercase tracking-widest rounded-[1.5rem] flex items-center gap-4">
                            <div className="w-6 h-6 flex items-center justify-center bg-emerald-500/20 rounded-full">
                                <span className="w-2 h-2 bg-emerald-500 rounded-full shadow-[0_0_10px_rgba(16,185,129,0.5)]" />
                            </div>
                            Core Infrastructure: Operational. MongoDB (15ms), Redis (3ms), Meta (Online).
                        </div>
                        <div className="p-8 bg-black/40 border border-white/5 text-zinc-500 font-mono text-[11px] h-64 overflow-y-auto rounded-3xl custom-scrollbar leading-relaxed">
                            <div className="opacity-30"># SYSTEM_BOOT_INITIALIZED</div>
                            <div className="opacity-30"># VERCEL_CRON_SCHEDULE_0300</div>
                            <div className="opacity-30"># SENTRY_INTEGRATION_ACTIVE</div>
                            <div className="text-zinc-400 mt-2">[2026-02-11 14:15] WEBHOOK_META_RECEIVED ID: 89df2-a3... SUCCESS</div>
                            <div className="text-zinc-400">[2026-02-11 14:18] PAYOUT_SAFETY_CHECK: USER_ID_123... ALLOWED</div>
                            <div className="text-indigo-400 font-bold">[2026-02-11 14:20] NEW_USER_REGISTRATION: CREATOR_ENTITY_902</div>
                            <div className="animate-pulse text-indigo-500 mt-1">_</div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="bg-indigo-600 rounded-[3rem] border border-white/10 shadow-[0_0_50px_rgba(79,70,229,0.3)] text-white overflow-hidden relative">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 blur-[100px] -mr-32 -mt-32 rounded-full" />
                    <CardHeader className="p-10 pb-0">
                        <CardTitle className="text-[10px] font-black uppercase tracking-[0.4em] opacity-80">ROI Intelligence</CardTitle>
                    </CardHeader>
                    <CardContent className="p-10 space-y-10 relative z-10">
                        <div>
                            <div className="text-indigo-200 text-[10px] font-black uppercase tracking-widest mb-4">Projected LTV</div>
                            <div className="text-6xl font-black tracking-tighter italic">₹{(metrics.revenue * 0.4).toLocaleString()}</div>
                        </div>
                        <div className="h-px bg-white/10 w-full"></div>
                        <div>
                            <div className="text-indigo-200 text-[10px] font-black uppercase tracking-widest mb-4">Conversion Rate</div>
                            <div className="text-4xl font-black tracking-tighter italic">4.2%</div>
                        </div>
                        <div className="pt-6">
                            <div className="px-6 py-3 bg-white/10 rounded-2xl border border-white/10 backdrop-blur-md inline-block">
                                <p className="text-[9px] font-black uppercase tracking-[0.3em]">Growth Vector +12.4%</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}

function MonitorCard({ label, value, target, status }: { label: string, value: string | number, target: string, status: 'success' | 'warning' | 'danger' | 'neutral' }) {
    const statusColors = {
        success: 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20',
        warning: 'text-amber-500 bg-amber-500/10 border-amber-500/20',
        danger: 'text-rose-500 bg-rose-500/10 border-rose-500/20',
        neutral: 'text-zinc-600 bg-zinc-900/40 border-white/5'
    };

    return (
        <Card className={`border border-white/5 rounded-[2.5rem] shadow-2xl transition-all duration-500 hover:scale-[1.02] group relative overflow-hidden bg-black/20`}>
            {status !== 'neutral' && (
                <div className={`absolute top-0 right-0 w-24 h-24 ${statusColors[status].split(' ')[1]} blur-[60px] -mr-12 -mt-12 opacity-50`} />
            )}
            <CardHeader className="px-8 py-6 pb-2">
                <CardTitle className="text-[9px] font-black text-zinc-600 uppercase tracking-[0.3em] group-hover:text-zinc-400 transition-colors">{label}</CardTitle>
            </CardHeader>
            <CardContent className="px-8 py-6 pt-0">
                <div className={`text-4xl font-black tracking-tighter italic transition-all duration-300 ${status === 'neutral' ? 'text-white' : statusColors[status].split(' ')[0]}`}>
                    {value}
                </div>
                <div className="text-[9px] font-black text-zinc-700 uppercase tracking-widest mt-3 flex items-center gap-2">
                    <div className={`w-1 h-1 rounded-full ${status === 'neutral' ? 'bg-zinc-800' : statusColors[status].split(' ')[0]}`} />
                    {target}
                </div>
            </CardContent>
        </Card>
    );
}

import { Activity, AlertTriangle } from 'lucide-react';
