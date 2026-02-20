'use client';

import { useState, useEffect } from 'react';
import { 
    MessageCircle, 
    Send, 
    XCircle, 
    Clock, 
    TrendingUp,
    RefreshCw,
    Loader2,
    CheckCircle,
    MessageSquare,
    Instagram,
    Phone
} from 'lucide-react';

interface DMStats {
    summary: {
        totalDMs: number;
        dmSent: number;
        dmFailed: number;
        dmPending: number;
        successRate: number;
    };
    byProvider: Record<string, number>;
    dailyStats: Array<{
        _id: string;
        sent: number;
        failed: number;
        pending: number;
    }>;
    recentActivity: Array<{
        _id: string;
        recipientUsername: string;
        messageSent: string;
        status: string;
        provider: string;
        createdAt: string;
    }>;
}

export default function DMSection() {
    const [stats, setStats] = useState<DMStats | null>(null);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const fetchStats = async () => {
        setRefreshing(true);
        try {
            const res = await fetch('/api/creator/dm/stats');
            if (!res.ok) throw new Error('Failed to fetch');
            const data = await res.json();
            setStats(data);
        } catch (err) {
            console.error('Failed to fetch DM stats:', err);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        fetchStats();
    }, []);

    const getProviderIcon = (provider: string) => {
        switch (provider) {
            case 'instagram':
                return <Instagram className="w-4 h-4 text-pink-400" />;
            case 'whatsapp':
                return <Phone className="w-4 h-4 text-green-400" />;
            default:
                return <MessageCircle className="w-4 h-4 text-blue-400" />;
        }
    };

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'success':
                return <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-400 text-xs rounded-full font-bold">Sent</span>;
            case 'failed':
                return <span className="px-2 py-0.5 bg-rose-500/20 text-rose-400 text-xs rounded-full font-bold">Failed</span>;
            case 'pending':
                return <span className="px-2 py-0.5 bg-amber-500/20 text-amber-400 text-xs rounded-full font-bold">Pending</span>;
            default:
                return <span className="px-2 py-0.5 bg-zinc-500/20 text-zinc-400 text-xs rounded-full font-bold">{status}</span>;
        }
    };

    if (loading) {
        return (
            <div className="bg-zinc-900 rounded-3xl p-8 border border-white/10">
                <div className="flex items-center justify-center h-40">
                    <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
                </div>
            </div>
        );
    }

    return (
        <div className="bg-zinc-900 rounded-3xl p-8 border border-white/10">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                    <div className="p-3 bg-indigo-500/10 rounded-xl">
                        <MessageSquare className="w-6 h-6 text-indigo-400" />
                    </div>
                    <div>
                        <h3 className="text-lg font-black text-white">AutoDM Performance</h3>
                        <p className="text-xs text-zinc-500">Track your automated messaging</p>
                    </div>
                </div>
                <button
                    onClick={fetchStats}
                    disabled={refreshing}
                    className="p-2 bg-white/5 rounded-xl text-zinc-400 hover:text-white hover:bg-white/10 transition-colors"
                >
                    <RefreshCw className={`w-5 h-5 ${refreshing ? 'animate-spin' : ''}`} />
                </button>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                <div className="bg-black/20 rounded-2xl p-4">
                    <div className="flex items-center gap-2 mb-2">
                        <MessageCircle className="w-4 h-4 text-blue-400" />
                        <span className="text-xs text-zinc-500 font-bold uppercase">Total</span>
                    </div>
                    <p className="text-2xl font-black text-white">{stats?.summary.totalDMs || 0}</p>
                </div>

                <div className="bg-black/20 rounded-2xl p-4">
                    <div className="flex items-center gap-2 mb-2">
                        <Send className="w-4 h-4 text-emerald-400" />
                        <span className="text-xs text-zinc-500 font-bold uppercase">Sent</span>
                    </div>
                    <p className="text-2xl font-black text-white">{stats?.summary.dmSent || 0}</p>
                </div>

                <div className="bg-black/20 rounded-2xl p-4">
                    <div className="flex items-center gap-2 mb-2">
                        <XCircle className="w-4 h-4 text-rose-400" />
                        <span className="text-xs text-zinc-500 font-bold uppercase">Failed</span>
                    </div>
                    <p className="text-2xl font-black text-white">{stats?.summary.dmFailed || 0}</p>
                </div>

                <div className="bg-black/20 rounded-2xl p-4">
                    <div className="flex items-center gap-2 mb-2">
                        <TrendingUp className="w-4 h-4 text-indigo-400" />
                        <span className="text-xs text-zinc-500 font-bold uppercase">Success</span>
                    </div>
                    <p className="text-2xl font-black text-white">{stats?.summary.successRate || 0}%</p>
                </div>
            </div>

            {/* Provider Breakdown */}
            {stats?.byProvider && Object.keys(stats.byProvider).length > 0 && (
                <div className="mb-6">
                    <p className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-3">By Provider</p>
                    <div className="flex gap-4">
                        {Object.entries(stats.byProvider).map(([provider, count]) => (
                            <div key={provider} className="flex items-center gap-2 bg-black/20 px-4 py-2 rounded-xl">
                                {getProviderIcon(provider)}
                                <span className="text-sm font-bold text-white capitalize">{provider}</span>
                                <span className="text-xs text-zinc-500">({count})</span>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Recent Activity */}
            <div>
                <p className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-3">Recent Activity</p>
                <div className="space-y-2 max-h-60 overflow-y-auto">
                    {stats?.recentActivity && stats.recentActivity.length > 0 ? (
                        stats.recentActivity.slice(0, 10).map((activity) => (
                            <div key={activity._id} className="flex items-center gap-3 p-3 bg-black/20 rounded-xl">
                                {getProviderIcon(activity.provider)}
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-bold text-white truncate">@{activity.recipientUsername || 'Unknown'}</p>
                                    <p className="text-xs text-zinc-500 truncate">{activity.messageSent}</p>
                                </div>
                                <div className="text-right">
                                    {getStatusBadge(activity.status)}
                                    <p className="text-[10px] text-zinc-600 mt-1">
                                        {new Date(activity.createdAt).toLocaleDateString()}
                                    </p>
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="flex flex-col items-center py-8 text-zinc-500">
                            <MessageCircle className="w-8 h-8 mb-2 opacity-50" />
                            <p className="text-sm font-bold">No DM activity yet</p>
                            <p className="text-xs">Start capturing leads to see your DM performance</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Quick Actions */}
            <div className="mt-6 pt-6 border-t border-white/5">
                <div className="flex gap-3">
                    <a 
                        href="/dashboard/automations" 
                        className="flex-1 py-3 bg-indigo-600 hover:bg-indigo-700 rounded-xl text-center text-sm font-bold text-white transition-colors"
                    >
                        Manage Automations
                    </a>
                    <a 
                        href="/dashboard/leads" 
                        className="flex-1 py-3 bg-white/5 hover:bg-white/10 rounded-xl text-center text-sm font-bold text-white transition-colors"
                    >
                        View Leads
                    </a>
                </div>
            </div>
        </div>
    );
}
