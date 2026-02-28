'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Activity, ShieldAlert, CheckCircle2, XCircle, Clock } from 'lucide-react';
import { Loader2 } from 'lucide-react';

export function AdminAutomationHealth() {
    const [stats, setStats] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchHealth = async () => {
            try {
                // Endpoint to be created or using aggregate analytics
                const res = await fetch('/api/admin/automation/health');
                if (res.ok) setStats(await res.json());
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        fetchHealth();
    }, []);

    if (loading) return <div className="flex justify-center p-8"><Loader2 className="animate-spin" /></div>;
    if (!stats) return null;

    return (
        <div className="space-y-6">
            <div className="grid gap-4 md:grid-cols-3">
                <Card className="bg-emerald-50/30 border-emerald-100">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium text-emerald-900">Delivery Health</CardTitle>
                        <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-emerald-700">{stats.successRate}%</div>
                        <p className="text-[10px] text-emerald-600 font-medium tracking-tight">GLOBAL SUCCESS RATE</p>
                    </CardContent>
                </Card>

                <Card className="bg-amber-50/30 border-amber-100">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium text-amber-900">Webhook Latency</CardTitle>
                        <Clock className="h-4 w-4 text-amber-600" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-amber-700">{stats.avgLatency}ms</div>
                        <p className="text-[10px] text-amber-600 font-medium tracking-tight">AVG RESPONSE TIME</p>
                    </CardContent>
                </Card>

                <Card className="bg-rose-50/30 border-rose-100">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium text-rose-900">Recent Failures</CardTitle>
                        <XCircle className="h-4 w-4 text-rose-600" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-rose-700">{stats.failedToday}</div>
                        <p className="text-[10px] text-rose-600 font-medium tracking-tight">ERRORS IN LAST 24H</p>
                    </CardContent>
                </Card>
            </div>

            <Card>
                <CardHeader>
                    <div className="flex justify-between items-center">
                        <CardTitle className="flex items-center gap-2">
                            <Activity className="h-5 w-5 text-indigo-600" />
                            Live Webhook Pulse
                        </CardTitle>
                        <Badge variant="outline" className="bg-emerald-50 text-emerald-700 animate-pulse">SYSTEM LIVE</Badge>
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        {stats.recentLogs.map((log: any) => (
                            <div key={log.id} className="flex items-center justify-between p-3 bg-zinc-50 rounded-lg border border-zinc-100">
                                <div className="flex items-center gap-3">
                                    <div className={log.success ? "text-emerald-500" : "text-rose-500"}>
                                        {log.success ? <CheckCircle2 className="h-4 w-4" /> : <ShieldAlert className="h-4 w-4" />}
                                    </div>
                                    <div>
                                        <p className="text-sm font-bold text-zinc-800 uppercase tracking-tighter">{log.event}</p>
                                        <p className="text-[10px] text-zinc-500">{new Date(log.timestamp).toLocaleTimeString()}</p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className="text-xs font-mono text-zinc-500">{log.latency}ms</p>
                                    <p className="text-[9px] text-zinc-400 capitalize">{log.platform}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
