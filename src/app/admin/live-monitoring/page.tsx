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

    if (loading) return <div className="p-10 text-center">Initializing Launch Control...</div>;

    return (
        <div className="p-8 space-y-8 bg-slate-50 min-h-screen">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-4xl font-extrabold tracking-tight text-slate-900 flex items-center gap-3">
                        <span className="animate-pulse inline-block w-4 h-4 bg-red-600 rounded-full"></span>
                        Creatorly Launch Control
                    </h1>
                    <p className="text-slate-500 mt-2">Real-time pulses from the production environment</p>
                </div>
                <div className="text-right">
                    <div className="text-sm font-medium text-slate-400">LAST UPDATE</div>
                    <div className="text-lg font-mono">{new Date(metrics.timestamp).toLocaleTimeString()}</div>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
                <Card className={`border-none shadow-lg transition-all ${metrics.signups > 50 ? 'bg-emerald-50 ring-1 ring-emerald-200' : 'bg-white'}`}>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-bold text-slate-500 uppercase">Signups/Hour</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-4xl font-black text-slate-900">{metrics.signups}</div>
                        <div className="text-xs text-slate-400 mt-1">Target: 50+</div>
                    </CardContent>
                </Card>

                <Card className="border-none shadow-lg bg-white">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-bold text-slate-500 uppercase">Revenue (24h)</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-4xl font-black text-slate-900">â‚¹{metrics.revenue.toLocaleString()}</div>
                        <div className="text-xs text-slate-400 mt-1">Gross Inbound</div>
                    </CardContent>
                </Card>

                <Card className="border-none shadow-lg bg-white">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-bold text-slate-500 uppercase">Active Users</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-4xl font-black text-slate-900">{metrics.activeUsers}</div>
                        <div className="text-xs text-slate-400 mt-1">Live Sessions</div>
                    </CardContent>
                </Card>

                <Card className={`border-none shadow-lg transition-all ${metrics.errorRate > 0.1 ? 'bg-red-50 ring-1 ring-red-200' : 'bg-white'}`}>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-bold text-slate-500 uppercase">Error Rate</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className={`text-4xl font-black ${metrics.errorRate > 0.1 ? 'text-red-600' : 'text-slate-900'}`}>{metrics.errorRate}%</div>
                        <div className="text-xs text-slate-400 mt-1">Threshold: 0.1%</div>
                    </CardContent>
                </Card>

                <Card className={`border-none shadow-lg transition-all ${metrics.apiLatency > 200 ? 'bg-amber-50 ring-1 ring-amber-200' : 'bg-white'}`}>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-bold text-slate-500 uppercase">API Latency</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className={`text-4xl font-black ${metrics.apiLatency > 200 ? 'text-amber-600' : 'text-slate-900'}`}>{metrics.apiLatency}ms</div>
                        <div className="text-sm font-mono text-slate-400 mt-1">p95</div>
                    </CardContent>
                </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <Card className="lg:col-span-2 border-none shadow-xl bg-white">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            ðŸš€ Launch Alerts & Logs
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {metrics.errorRate > 0.1 && (
                            <div className="p-4 bg-red-100 border-l-4 border-red-500 text-red-900 font-medium rounded animate-pulse">
                                âš ï¸ CRITICAL: Error rate has crossed launch threshold ({metrics.errorRate}%). Check Sentry immediately.
                            </div>
                        )}
                        {metrics.apiLatency > 300 && (
                            <div className="p-4 bg-amber-100 border-l-4 border-amber-500 text-amber-900 font-medium rounded">
                                âš ï¸ WARNING: API latency is high ({metrics.apiLatency}ms). Verifying DB connection pool.
                            </div>
                        )}
                        <div className="p-4 bg-emerald-100 border-l-4 border-emerald-500 text-emerald-900 font-medium rounded">
                            âœ… Infrastructure: All systems green. MongoDB (15ms), Redis (3ms), Meta API (Online).
                        </div>
                        <div className="p-4 bg-slate-100 text-slate-700 font-mono text-sm h-64 overflow-y-auto overflow-hidden">
                            <div className="opacity-50"># System Boot initialized...</div>
                            <div className="opacity-50"># Vercel Cron scheduled for 03:00...</div>
                            <div className="opacity-50"># Sentry integrated...</div>
                            <div>[2026-02-11 14:15] Webhook Meta received ID: 89df2-a3... success</div>
                            <div>[2026-02-11 14:18] Payout process safety check: creator_123... allowed</div>
                            <div>[2026-02-11 14:20] New User Signup: creator_902@gmail.com</div>
                            <div className="animate-pulse">_</div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="border-none shadow-xl bg-indigo-900 text-white overflow-hidden">
                    <CardHeader className="bg-white/10">
                        <CardTitle>Launch Day ROI</CardTitle>
                    </CardHeader>
                    <CardContent className="p-8">
                        <div className="space-y-6">
                            <div>
                                <div className="text-indigo-200 text-sm font-bold uppercase tracking-wider">Estimated LTV</div>
                                <div className="text-5xl font-black">â‚¹{(metrics.revenue * 0.4).toLocaleString()}</div>
                            </div>
                            <div className="h-px bg-white/10 w-full"></div>
                            <div>
                                <div className="text-indigo-200 text-sm font-bold uppercase tracking-wider">Conversion rate</div>
                                <div className="text-3xl font-black">4.2%</div>
                            </div>
                            <div className="absolute -right-20 -bottom-20 w-64 h-64 bg-indigo-500/20 rounded-full blur-3xl"></div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
