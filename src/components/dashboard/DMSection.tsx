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
    summary?: {
        totalDMs: number;
        dmSent: number;
        dmFailed: number;
        dmPending: number;
        successRate: number;
    };
    byProvider?: Record<string, number>;
    recentActivity?: Array<{
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
    const [error, setError] = useState(false);

    const fetchStats = async () => {
        setRefreshing(true);
        setError(false);
        try {
            const res = await fetch('/api/creator/dm/stats');
            if (!res.ok) throw new Error('Failed to fetch');
            const data = await res.json();

            // Validate data shape
            if (data && typeof data === 'object') {
                setStats(data);
            } else {
                console.error('Invalid DM stats format received:', data);
                setError(true);
            }
        } catch (err) {
            console.error('Failed to fetch DM stats:', err);
            setError(true);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        fetchStats();
    }, []);

    const getProviderIcon = (provider: string) => {
        switch (provider?.toLowerCase()) {
            case 'instagram':
                return <Instagram className="w-4 h-4 text-pink-400" />;
            case 'whatsapp':
                return <Phone className="w-4 h-4 text-green-400" />;
            default:
                return <MessageCircle className="w-4 h-4 text-blue-400" />;
        }
    };

    const getStatusBadge = (status: string) => {
        switch (status?.toLowerCase()) {
            case 'success':
            case 'sent':
                return <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-400 text-xs rounded-full font-bold">Sent</span>;
            case 'failed':
                return <span className="px-2 py-0.5 bg-rose-500/20 text-rose-400 text-xs rounded-full font-bold">Failed</span>;
            case 'pending':
                return <span className="px-2 py-0.5 bg-amber-500/20 text-amber-400 text-xs rounded-full font-bold">Pending</span>;
            default:
                return <span className="px-2 py-0.5 bg-zinc-500/20 text-zinc-400 text-xs rounded-full font-bold">{status || 'Unknown'}</span>;
        }
    };

    if (loading) {
        return (
            <div className="bg-zinc-900 rounded-3xl p-8 border border-white/10">
                <div className="flex items-center justify-center h-48">
                    <div className="flex flex-col items-center gap-4">
                        <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
                        <p className="text-sm font-bold text-zinc-600 uppercase tracking-widest">Loading Neutral Engine Analytics...</p>
                    </div>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="bg-zinc-900 rounded-3xl p-8 border border-white/10 text-center">
                <XCircle className="w-12 h-12 text-rose-500 mx-auto mb-4 opacity-50" />
                <h3 className="text-lg font-bold text-white mb-2">Analytics Sync Error</h3>
                <p className="text-zinc-500 text-sm mb-6">We couldn't reach the DM engine. Please try again.</p>
                <button
                    onClick={fetchStats}
                    className="px-6 py-2 bg-white/5 hover:bg-white/10 rounded-xl text-white font-bold transition-all border border-white/10"
                >
                    Retry Connection
                </button>
            </div>
        );
    }

    return (
        <div className="bg-zinc-900 rounded-3xl p-8 border border-white/10">
            {/* Header */}
            <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-3">
                    <div className="p-3 bg-indigo-500/10 rounded-xl">
                        <MessageSquare className="w-6 h-6 text-indigo-400" />
                    </div>
                    <div>
                        <h3 className="text-xl font-black text-white tracking-tight">AutoDM Performance</h3>
                        <p className="text-xs text-zinc-500 font-bold uppercase tracking-widest">Autonomous Protocol Tracking</p>
                    </div>
                </div>
                <button
                    onClick={fetchStats}
                    disabled={refreshing}
                    className="p-3 bg-white/5 rounded-xl text-zinc-400 hover:text-white hover:bg-white/10 transition-all active:scale-95"
                    title="Refresh Stats"
                >
                    <RefreshCw className={`w-5 h-5 ${refreshing ? 'animate-spin' : ''}`} />
                </button>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                <div className="bg-black/40 rounded-2xl p-5 border border-white/5">
                    <div className="flex items-center gap-2 mb-3">
                        <MessageCircle className="w-4 h-4 text-indigo-400" />
                        <span className="text-[10px] text-zinc-500 font-black uppercase tracking-widest">Total Protocols</span>
                    </div>
                    <p className="text-3xl font-black text-white">{stats?.summary?.totalDMs ?? 0}</p>
                </div>

                <div className="bg-black/40 rounded-2xl p-5 border border-white/5">
                    <div className="flex items-center gap-2 mb-3">
                        <Send className="w-4 h-4 text-emerald-400" />
                        <span className="text-[10px] text-zinc-500 font-black uppercase tracking-widest">Delivered</span>
                    </div>
                    <p className="text-3xl font-black text-white">{stats?.summary?.dmSent ?? 0}</p>
                </div>

                <div className="bg-black/40 rounded-2xl p-5 border border-white/5">
                    <div className="flex items-center gap-2 mb-3">
                        <XCircle className="w-4 h-4 text-rose-400" />
                        <span className="text-[10px] text-zinc-500 font-black uppercase tracking-widest">Failed</span>
                    </div>
                    <p className="text-3xl font-black text-white">{stats?.summary?.dmFailed ?? 0}</p>
                </div>

                <div className="bg-black/40 rounded-2xl p-5 border border-white/5">
                    <div className="flex items-center gap-2 mb-3">
                        <TrendingUp className="w-4 h-4 text-indigo-400" />
                        <span className="text-[10px] text-zinc-500 font-black uppercase tracking-widest">Success Rate</span>
                    </div>
                    <p className="text-3xl font-black text-white">{stats?.summary?.successRate ?? 0}%</p>
                </div>
            </div>

            {/* Provider Breakdown */}
            {stats?.byProvider && Object.keys(stats.byProvider).length > 0 && (
                <div className="mb-8">
                    <p className="text-[10px] font-black text-zinc-600 uppercase tracking-[0.2em] mb-4">Transmission Channels</p>
                    <div className="flex flex-wrap gap-3">
                        {Object.entries(stats.byProvider).map(([provider, count]) => (
                            <div key={provider} className="flex items-center gap-3 bg-black/40 border border-white/5 px-4 py-3 rounded-2xl">
                                {getProviderIcon(provider)}
                                <span className="text-sm font-bold text-white capitalize">{provider}</span>
                                <div className="h-4 w-[1px] bg-white/10 mx-1" />
                                <span className="text-xs font-black text-indigo-400">{count}</span>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Recent Activity */}
            <div>
                <p className="text-[10px] font-black text-zinc-600 uppercase tracking-[0.2em] mb-4">Neural Log (Latest 10)</p>
                <div className="space-y-2 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                    {stats?.recentActivity && stats.recentActivity.length > 0 ? (
                        stats.recentActivity.slice(0, 10).map((activity) => (
                            <div key={activity._id} className="flex items-center gap-4 p-4 bg-black/40 border border-white/5 rounded-2xl hover:bg-black/60 transition-colors group">
                                <div className="p-2 bg-white/5 rounded-lg group-hover:bg-indigo-500/10 transition-colors">
                                    {getProviderIcon(activity.provider)}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-black text-white truncate group-hover:text-indigo-400 transition-colors">
                                        @{activity.recipientUsername || 'Anonymous User'}
                                    </p>
                                    <p className="text-xs text-zinc-500 truncate mt-0.5 italic">{activity.messageSent || 'System triggered message'}</p>
                                </div>
                                <div className="text-right">
                                    {getStatusBadge(activity.status)}
                                    <p className="text-[10px] font-bold text-zinc-700 mt-1.5 uppercase tracking-tighter">
                                        {new Date(activity.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                    </p>
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="flex flex-col items-center justify-center py-12 bg-black/20 rounded-3xl border border-dashed border-white/5">
                            <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mb-4">
                                <MessageCircle className="w-8 h-8 text-zinc-700" />
                            </div>
                            <p className="text-sm font-bold text-zinc-500 uppercase tracking-widest">No Transmissions Logged</p>
                            <p className="text-[10px] text-zinc-600 mt-1 font-bold">Start capturing leads to activate the DM engine</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Quick Actions */}
            <div className="mt-8 pt-8 border-t border-white/5">
                <div className="flex gap-4">
                    <a
                        href="/dashboard/automation"
                        className="flex-1 py-4 bg-indigo-600 hover:bg-indigo-500 rounded-2xl text-center text-xs font-black text-white uppercase tracking-widest transition-all shadow-lg shadow-indigo-500/10 active:scale-95"
                    >
                        Configure Engine
                    </a>
                    <a
                        href="/dashboard/settings"
                        className="flex-1 py-4 bg-white/5 hover:bg-white/10 rounded-2xl text-center text-xs font-black text-white uppercase tracking-widest transition-all border border-white/5 active:scale-95"
                    >
                        Terminal Settings
                    </a>
                </div>
            </div>
        </div>
    );
}
