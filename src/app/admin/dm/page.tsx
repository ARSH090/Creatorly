'use client';

import { useState, useEffect } from 'react';
import { 
    MessageCircle, 
    Send, 
    XCircle, 
    Clock, 
    TrendingUp, 
    AlertTriangle, 
    RefreshCw,
    Filter,
    Loader2,
    CheckCircle,
    X
} from 'lucide-react';

interface DMStats {
    summary: {
        totalDMs: number;
        dmSent: number;
        dmFailed: number;
        dmPending: number;
        successRate: number;
        period: number;
    };
    byProvider: Record<string, number>;
    topCreators: Array<{
        creatorId: string;
        username: string;
        email: string;
        totalDMs: number;
        sent: number;
        failed: number;
        successRate: number;
    }>;
    dailyStats: Array<{
        _id: string;
        sent: number;
        failed: number;
        pending: number;
    }>;
    recentFailures: Array<{
        _id: string;
        recipientUsername: string;
        messageSent: string;
        errorDetails: string;
        errorCode: string;
        createdAt: string;
    }>;
    commonErrors: Array<{
        _id: string;
        count: number;
    }>;
}

export default function AdminDMPage() {
    const [stats, setStats] = useState<DMStats | null>(null);
    const [loading, setLoading] = useState(true);
    const [period, setPeriod] = useState('30');
    const [refreshing, setRefreshing] = useState(false);

    const fetchStats = async () => {
        setRefreshing(true);
        try {
            const res = await fetch(`/api/admin/dm/overview?period=${period}`);
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
    }, [period]);

    if (loading) {
        return (
            <div className="flex h-96 items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-950 p-6 lg:p-10">
            <div className="max-w-7xl mx-auto space-y-8">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-black text-white flex items-center gap-3 tracking-tight">
                            <MessageCircle className="w-8 h-8 text-indigo-500" />
                            DM OVERVIEW
                        </h1>
                        <p className="text-xs font-bold text-zinc-500 mt-1 uppercase tracking-widest">
                            Monitor AutoDM performance across all creators
                        </p>
                    </div>
                    <div className="flex items-center gap-4">
                        <select
                            value={period}
                            onChange={(e) => setPeriod(e.target.value)}
                            className="bg-zinc-900 border border-white/10 rounded-xl px-4 py-2 text-white text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        >
                            <option value="7">Last 7 days</option>
                            <option value="30">Last 30 days</option>
                            <option value="90">Last 90 days</option>
                        </select>
                        <button
                            onClick={fetchStats}
                            disabled={refreshing}
                            className="p-2 bg-indigo-600 rounded-xl text-white hover:bg-indigo-700 transition-colors disabled:opacity-50"
                        >
                            <RefreshCw className={`w-5 h-5 ${refreshing ? 'animate-spin' : ''}`} />
                        </button>
                    </div>
                </div>

                {/* Summary Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                    <div className="bg-zinc-900 rounded-2xl p-6 border border-white/10">
                        <div className="flex items-center justify-between mb-4">
                            <div className="p-3 bg-blue-500/10 rounded-xl">
                                <MessageCircle className="w-5 h-5 text-blue-400" />
                            </div>
                        </div>
                        <p className="text-3xl font-black text-white">{stats?.summary.totalDMs || 0}</p>
                        <p className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Total DMs</p>
                    </div>

                    <div className="bg-zinc-900 rounded-2xl p-6 border border-white/10">
                        <div className="flex items-center justify-between mb-4">
                            <div className="p-3 bg-emerald-500/10 rounded-xl">
                                <Send className="w-5 h-5 text-emerald-400" />
                            </div>
                        </div>
                        <p className="text-3xl font-black text-white">{stats?.summary.dmSent || 0}</p>
                        <p className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Sent</p>
                    </div>

                    <div className="bg-zinc-900 rounded-2xl p-6 border border-white/10">
                        <div className="flex items-center justify-between mb-4">
                            <div className="p-3 bg-rose-500/10 rounded-xl">
                                <XCircle className="w-5 h-5 text-rose-400" />
                            </div>
                        </div>
                        <p className="text-3xl font-black text-white">{stats?.summary.dmFailed || 0}</p>
                        <p className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Failed</p>
                    </div>

                    <div className="bg-zinc-900 rounded-2xl p-6 border border-white/10">
                        <div className="flex items-center justify-between mb-4">
                            <div className="p-3 bg-amber-500/10 rounded-xl">
                                <Clock className="w-5 h-5 text-amber-400" />
                            </div>
                        </div>
                        <p className="text-3xl font-black text-white">{stats?.summary.dmPending || 0}</p>
                        <p className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Pending</p>
                    </div>

                    <div className="bg-zinc-900 rounded-2xl p-6 border border-white/10">
                        <div className="flex items-center justify-between mb-4">
                            <div className="p-3 bg-indigo-500/10 rounded-xl">
                                <TrendingUp className="w-5 h-5 text-indigo-400" />
                            </div>
                        </div>
                        <p className="text-3xl font-black text-white">{stats?.summary.successRate || 0}%</p>
                        <p className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Success Rate</p>
                    </div>
                </div>

                {/* Top Creators & Daily Stats */}
                <div className="grid lg:grid-cols-2 gap-8">
                    {/* Top Creators */}
                    <div className="bg-zinc-900 rounded-[2.5rem] border border-white/10 p-8">
                        <h2 className="text-xl font-black text-white mb-6 flex items-center gap-3 uppercase tracking-tighter">
                            <div className="w-2 h-6 bg-indigo-500 rounded-full" />
                            Top Creators by DM Volume
                        </h2>
                        <div className="space-y-4">
                            {stats?.topCreators && stats.topCreators.length > 0 ? (
                                stats.topCreators.map((creator, idx) => (
                                    <div key={creator.creatorId} className="flex items-center gap-4 p-4 bg-white/5 rounded-2xl">
                                        <div className="w-8 h-8 bg-indigo-600 rounded-xl flex items-center justify-center text-white font-black">
                                            {idx + 1}
                                        </div>
                                        <div className="flex-1">
                                            <p className="font-bold text-white">{creator.username}</p>
                                            <p className="text-xs text-zinc-500">{creator.email}</p>
                                        </div>
                                        <div className="text-right">
                                            <p className="font-black text-white">{creator.totalDMs}</p>
                                            <p className="text-xs text-emerald-400">{creator.successRate}% success</p>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <p className="text-zinc-500 text-center py-8">No data available</p>
                            )}
                        </div>
                    </div>

                    {/* Daily Stats */}
                    <div className="bg-zinc-900 rounded-[2.5rem] border border-white/10 p-8">
                        <h2 className="text-xl font-black text-white mb-6 flex items-center gap-3 uppercase tracking-tighter">
                            <div className="w-2 h-6 bg-emerald-500 rounded-full" />
                            Daily DM Activity
                        </h2>
                        <div className="space-y-3">
                            {stats?.dailyStats && stats.dailyStats.length > 0 ? (
                                stats.dailyStats.slice(-7).map((day) => (
                                    <div key={day._id} className="flex items-center gap-4">
                                        <p className="text-xs text-zinc-500 w-20">{day._id}</p>
                                        <div className="flex-1 h-6 bg-zinc-800 rounded-full overflow-hidden flex">
                                            <div 
                                                className="h-full bg-emerald-500" 
                                                style={{ width: `${(day.sent / (day.sent + day.failed + day.pending || 1)) * 100}%` }}
                                            />
                                            <div 
                                                className="h-full bg-rose-500" 
                                                style={{ width: `${(day.failed / (day.sent + day.failed + day.pending || 1)) * 100}%` }}
                                            />
                                            <div 
                                                className="h-full bg-amber-500" 
                                                style={{ width: `${(day.pending / (day.sent + day.failed + day.pending || 1)) * 100}%` }}
                                            />
                                        </div>
                                        <div className="flex gap-3 text-xs">
                                            <span className="text-emerald-400">{day.sent}</span>
                                            <span className="text-rose-400">{day.failed}</span>
                                            <span className="text-amber-400">{day.pending}</span>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <p className="text-zinc-500 text-center py-8">No data available</p>
                            )}
                        </div>
                        <div className="flex gap-4 mt-4 text-xs">
                            <div className="flex items-center gap-2">
                                <div className="w-3 h-3 bg-emerald-500 rounded-full" />
                                <span className="text-zinc-500">Sent</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="w-3 h-3 bg-rose-500 rounded-full" />
                                <span className="text-zinc-500">Failed</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="w-3 h-3 bg-amber-500 rounded-full" />
                                <span className="text-zinc-500">Pending</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Recent Failures & Common Errors */}
                <div className="grid lg:grid-cols-2 gap-8">
                    {/* Recent Failures */}
                    <div className="bg-zinc-900 rounded-[2.5rem] border border-white/10 p-8">
                        <h2 className="text-xl font-black text-white mb-6 flex items-center gap-3 uppercase tracking-tighter">
                            <div className="w-2 h-6 bg-rose-500 rounded-full" />
                            Recent Failures
                        </h2>
                        <div className="space-y-3 max-h-80 overflow-y-auto">
                            {stats?.recentFailures && stats.recentFailures.length > 0 ? (
                                stats.recentFailures.map((failure) => (
                                    <div key={failure._id} className="p-4 bg-rose-500/10 rounded-2xl border border-rose-500/20">
                                        <div className="flex justify-between items-start mb-2">
                                            <p className="font-bold text-white">@{failure.recipientUsername || 'Unknown'}</p>
                                            <span className="text-xs text-zinc-500">
                                                {new Date(failure.createdAt).toLocaleDateString()}
                                            </span>
                                        </div>
                                        <p className="text-xs text-zinc-400 line-clamp-2">{failure.errorDetails || failure.errorCode || 'Unknown error'}</p>
                                    </div>
                                ))
                            ) : (
                                <div className="flex items-center gap-2 text-emerald-400 py-8">
                                    <CheckCircle className="w-5 h-5" />
                                    <span className="font-bold">No recent failures</span>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Common Errors */}
                    <div className="bg-zinc-900 rounded-[2.5rem] border border-white/10 p-8">
                        <h2 className="text-xl font-black text-white mb-6 flex items-center gap-3 uppercase tracking-tighter">
                            <div className="w-2 h-6 bg-amber-500 rounded-full" />
                            Common Error Patterns
                        </h2>
                        <div className="space-y-3">
                            {stats?.commonErrors && stats.commonErrors.length > 0 ? (
                                stats.commonErrors.map((error, idx) => (
                                    <div key={idx} className="flex items-center gap-4 p-4 bg-white/5 rounded-2xl">
                                        <div className="w-8 h-8 bg-amber-500/20 rounded-xl flex items-center justify-center">
                                            <AlertTriangle className="w-4 h-4 text-amber-400" />
                                        </div>
                                        <div className="flex-1">
                                            <p className="text-sm text-white line-clamp-1">{error._id || 'Unknown error'}</p>
                                        </div>
                                        <div className="text-right">
                                            <p className="font-black text-white">{error.count}</p>
                                            <p className="text-xs text-zinc-500">occurrences</p>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <p className="text-zinc-500 text-center py-8">No error data available</p>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
