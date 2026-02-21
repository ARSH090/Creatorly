'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart3, TrendingUp, Users, MessageSquare, MousePointer2, AlertCircle } from 'lucide-react';
import { Loader2 } from 'lucide-react';

export function AutomationAnalytics() {
    const [loading, setLoading] = useState(true);
    const [data, setData] = useState<any>(null);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const res = await fetch('/api/creator/dm/analytics?timeframe=7d');
                if (res.ok) setData(await res.json());
            } catch (error) {
                console.error('Failed to fetch analytics:', error);
            } finally {
                setLoading(false);
            }
        };
        fetchStats();
    }, []);

    if (loading) return <div className="flex justify-center p-12"><Loader2 className="animate-spin" /></div>;
    if (!data) return null;

    const { summary } = data;
    const engagementRate = summary.totalSent > 0
        ? ((summary.clicks / summary.totalSent) * 100).toFixed(1)
        : '0';

    return (
        <div className="space-y-6">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Automations</CardTitle>
                        <MessageSquare className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{summary.totalSent}</div>
                        <p className="text-xs text-muted-foreground">Sent in last 7 days</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Delivery Rate</CardTitle>
                        <TrendingUp className="h-4 w-4 text-emerald-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {summary.totalSent > 0 ? ((summary.delivered / summary.totalSent) * 100).toFixed(1) : 0}%
                        </div>
                        <p className="text-xs text-muted-foreground">{summary.delivered} successful deliveries</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Link Clicks</CardTitle>
                        <MousePointer2 className="h-4 w-4 text-indigo-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{summary.clicks}</div>
                        <p className="text-xs text-muted-foreground">{engagementRate}% engagement rate</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Failures</CardTitle>
                        <AlertCircle className="h-4 w-4 text-red-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{summary.failed}</div>
                        <p className="text-xs text-muted-foreground">Requires attention</p>
                    </CardContent>
                </Card>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
                <Card className="col-span-4">
                    <CardHeader>
                        <CardTitle>Channel Performance</CardTitle>
                    </CardHeader>
                    <CardContent className="h-[200px] flex items-end gap-4 justify-around pt-10">
                        {data.providers.map((p: any) => (
                            <div key={p._id} className="flex flex-col items-center gap-2 w-full max-w-[100px]">
                                <div
                                    className="w-full bg-indigo-500 rounded-t-sm transition-all hover:bg-indigo-600"
                                    style={{ height: `${(p.count / summary.totalSent) * 150}px` }}
                                />
                                <span className="text-xs font-medium capitalize">{p._id}</span>
                                <span className="text-[10px] text-muted-foreground">{p.count} sent</span>
                            </div>
                        ))}
                    </CardContent>
                </Card>

                <Card className="col-span-3">
                    <CardHeader>
                        <CardTitle>Recent Insights</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex items-center gap-4">
                            <div className="bg-indigo-100 p-2 rounded-full"><Users className="h-4 w-4 text-indigo-600" /></div>
                            <div>
                                <p className="text-sm font-medium">High Engagement on Post</p>
                                <p className="text-xs text-muted-foreground">"Keyword: Sale" triggered 45 times today.</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-4">
                            <div className="bg-emerald-100 p-2 rounded-full"><TrendingUp className="h-4 w-4 text-emerald-600" /></div>
                            <div>
                                <p className="text-sm font-medium">Reach Expansion</p>
                                <p className="text-xs text-muted-foreground">Follow-first led to 12 new followers today.</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
