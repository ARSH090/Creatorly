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
    Loader2,
    CheckCircle
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
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [period]);

    if (loading) {
        return (
            <div className="min-h-screen bg-[#030303] flex items-center justify-center">
                <div className="flex flex-col items-center gap-6">
                    <div className="w-16 h-16 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin" />
                    <p className="text-[10px] font-black text-zinc-600 uppercase tracking-[0.5em] animate-pulse">Initializing Comms Surveillance</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#030303] space-y-12">
            <div className="max-w-7xl mx-auto space-y-12">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div className="space-y-1">
                        <h1 className="text-4xl font-black text-white flex items-center gap-4 tracking-tighter italic uppercase">
                            <MessageCircle className="w-10 h-10 text-indigo-500 shadow-[0_0_20px_rgba(99,102,241,0.4)]" />
                            COMMS SURVEILLANCE
                        </h1>
                        <p className="text-[10px] font-black text-zinc-600 mt-2 uppercase tracking-[0.4em] ml-14">
                            AutoDM Stream Monitoring • Global Protocol Status
                        </p>
                    </div>
                    <div className="flex items-center gap-6">
                        <select
                            value={period}
                            onChange={(e) => setPeriod(e.target.value)}
                            className="bg-zinc-900 border border-white/5 rounded-2xl px-6 py-3 text-white text-[10px] font-black uppercase tracking-widest focus:outline-none focus:border-indigo-500 transition-all cursor-pointer"
                        >
                            <option value="7">WEEKLINK 7D</option>
                            <option value="30">MOONLOG 30D</option>
                            <option value="90">QUARTERTRACE 90D</option>
                        </select>
                        <button
                            onClick={fetchStats}
                            disabled={refreshing}
                            className="p-4 bg-zinc-900 border border-white/5 rounded-2xl text-zinc-500 hover:text-white hover:bg-zinc-800 transition-all disabled:opacity-50 active:scale-95 group shadow-xl"
                        >
                            <RefreshCw className={`w-6 h-6 ${refreshing ? 'animate-spin' : ''}`} />
                        </button>
                    </div>
                </div>

                {/* Summary Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
                    <DMStatCard
                        label="Flux Volume"
                        value={stats?.summary.totalDMs || 0}
                        icon={MessageCircle}
                        color="text-indigo-400"
                        bgColor="bg-indigo-500/10"
                    />
                    <DMStatCard
                        label="Transmission"
                        value={stats?.summary.dmSent || 0}
                        icon={Send}
                        color="text-emerald-400"
                        bgColor="bg-emerald-500/10"
                    />
                    <DMStatCard
                        label="Protocol Breach"
                        value={stats?.summary.dmFailed || 0}
                        icon={XCircle}
                        color="text-rose-400"
                        bgColor="bg-rose-500/10"
                    />
                    <DMStatCard
                        label="En Route"
                        value={stats?.summary.dmPending || 0}
                        icon={Clock}
                        color="text-amber-400"
                        bgColor="bg-amber-500/10"
                    />
                    <DMStatCard
                        label="Efficiency"
                        value={`${stats?.summary.successRate || 0}%`}
                        icon={TrendingUp}
                        color="text-indigo-500"
                        bgColor="bg-indigo-500/10"
                    />
                </div>

                {/* Top Creators & Daily Stats */}
                <div className="grid lg:grid-cols-2 gap-10">
                    {/* Top Creators */}
                    <div className="bg-zinc-900/40 rounded-[3rem] border border-white/5 p-10 shadow-2xl backdrop-blur-md">
                        <h2 className="text-2xl font-black text-white mb-8 flex items-center gap-4 uppercase tracking-tighter italic">
                            <div className="w-2 h-8 bg-indigo-500 rounded-full" />
                            Dominant Entities
                        </h2>
                        <div className="space-y-4">
                            {stats?.topCreators && stats.topCreators.length > 0 ? (
                                stats.topCreators.map((creator, idx) => (
                                    <div key={creator.creatorId} className="flex items-center gap-5 p-5 bg-black/20 rounded-2xl border border-white/5 hover:border-white/10 transition-all group">
                                        <div className="w-12 h-12 bg-zinc-900 rounded-xl flex items-center justify-center text-indigo-500 font-black italic border border-white/5 group-hover:border-indigo-500/30 transition-all">
                                            {String(idx + 1).padStart(2, '0')}
                                        </div>
                                        <div className="flex-1">
                                            <p className="font-black text-white uppercase italic tracking-tight">{creator.username}</p>
                                            <p className="text-[10px] font-bold text-zinc-600 uppercase tracking-tighter">{creator.email}</p>
                                        </div>
                                        <div className="text-right">
                                            <p className="font-black text-white text-xl tracking-tighter italic">{creator.totalDMs}</p>
                                            <p className="text-[9px] font-black text-emerald-500 uppercase tracking-widest">{creator.successRate}% STABILITY</p>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="text-center py-12 rounded-2xl border border-dashed border-white/5 bg-black/10">
                                    <p className="text-[10px] font-black text-zinc-700 uppercase tracking-widest">Core Archive Empty</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Daily Stats */}
                    <div className="bg-zinc-900/40 rounded-[3rem] border border-white/5 p-10 shadow-2xl backdrop-blur-md">
                        <h2 className="text-2xl font-black text-white mb-8 flex items-center gap-4 uppercase tracking-tighter italic">
                            <div className="w-2 h-8 bg-emerald-500 rounded-full" />
                            Chronological Flux
                        </h2>
                        <div className="space-y-6">
                            {stats?.dailyStats && stats.dailyStats.length > 0 ? (
                                stats.dailyStats.slice(-7).map((day) => (
                                    <div key={day._id} className="flex items-center gap-6">
                                        <p className="text-[10px] font-black text-zinc-600 uppercase tracking-widest w-24 italic">{day._id}</p>
                                        <div className="flex-1 h-3 bg-black/40 rounded-full overflow-hidden flex border border-white/5">
                                            <div
                                                className="h-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.3)]"
                                                style={{ width: `${(day.sent / (day.sent + day.failed + day.pending || 1)) * 100}%` }}
                                            />
                                            <div
                                                className="h-full bg-rose-500 shadow-[0_0_10px_rgba(244,63,94,0.3)]"
                                                style={{ width: `${(day.failed / (day.sent + day.failed + day.pending || 1)) * 100}%` }}
                                            />
                                            <div
                                                className="h-full bg-amber-500 shadow-[0_0_10px_rgba(245,158,11,0.3)]"
                                                style={{ width: `${(day.pending / (day.sent + day.failed + day.pending || 1)) * 100}%` }}
                                            />
                                        </div>
                                        <div className="flex gap-4 text-[10px] font-black font-mono">
                                            <span className="text-emerald-500">{day.sent}</span>
                                            <span className="text-rose-500">{day.failed}</span>
                                            <span className="text-amber-500">{day.pending}</span>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="text-center py-12 rounded-2xl border border-dashed border-white/5 bg-black/10">
                                    <p className="text-[10px] font-black text-zinc-700 uppercase tracking-widest">Chronos Silent</p>
                                </div>
                            )}
                        </div>
                        <div className="flex gap-6 mt-10 text-[9px] font-black uppercase tracking-widest border-t border-white/5 pt-6 justify-center">
                            <div className="flex items-center gap-2">
                                <div className="w-2 h-2 bg-emerald-500 rounded-full shadow-[0_0_5px_rgba(16,185,129,0.5)]" />
                                <span className="text-zinc-500">Committed</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="w-2 h-2 bg-rose-500 rounded-full shadow-[0_0_5px_rgba(244,63,94,0.5)]" />
                                <span className="text-zinc-500">Breached</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="w-2 h-2 bg-amber-500 rounded-full shadow-[0_0_5px_rgba(245,158,11,0.5)]" />
                                <span className="text-zinc-500">Queued</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Recent Failures & Common Errors */}
                <div className="grid lg:grid-cols-2 gap-10">
                    {/* Recent Failures */}
                    <div className="bg-zinc-900/40 rounded-[3rem] border border-white/5 p-10 shadow-2xl backdrop-blur-md">
                        <h2 className="text-2xl font-black text-white mb-8 flex items-center gap-4 uppercase tracking-tighter italic">
                            <div className="w-2 h-8 bg-rose-500 rounded-full" />
                            Breach Feed
                        </h2>
                        <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                            {stats?.recentFailures && stats.recentFailures.length > 0 ? (
                                stats.recentFailures.map((failure) => (
                                    <div key={failure._id} className="p-6 bg-rose-500/5 rounded-[2rem] border border-rose-500/10 hover:border-rose-500/20 transition-all group">
                                        <div className="flex justify-between items-center mb-4">
                                            <p className="font-black text-white uppercase italic tracking-tight text-sm">@{failure.recipientUsername || 'UNKNOWN_ENTITY'}</p>
                                            <span className="text-[9px] font-black text-zinc-600 uppercase tracking-widest">
                                                {new Date(failure.createdAt).toLocaleDateString()}
                                            </span>
                                        </div>
                                        <div className="p-4 bg-black/40 rounded-xl border border-white/5 text-[10px] font-bold text-rose-400/80 leading-relaxed font-mono uppercase tracking-tighter line-clamp-2 italic">
                                            {failure.errorDetails || failure.errorCode || 'UNDEFINED_PROTOCOL_ERROR'}
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="text-center py-16 rounded-2xl border border-dashed border-emerald-500/20 bg-emerald-500/5 flex flex-col items-center gap-4">
                                    <CheckCircle className="w-10 h-10 text-emerald-500/40" />
                                    <span className="text-[10px] font-black text-emerald-500 uppercase tracking-[0.3em]">Protocol Stability 100%</span>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Common Errors */}
                    <div className="bg-zinc-900/40 rounded-[3rem] border border-white/5 p-10 shadow-2xl backdrop-blur-md">
                        <h2 className="text-2xl font-black text-white mb-8 flex items-center gap-4 uppercase tracking-tighter italic">
                            <div className="w-2 h-8 bg-amber-500 rounded-full" />
                            Anomaly Patterns
                        </h2>
                        <div className="space-y-4">
                            {stats?.commonErrors && stats.commonErrors.length > 0 ? (
                                stats.commonErrors.map((error, idx) => (
                                    <div key={idx} className="flex items-center gap-5 p-5 bg-black/20 rounded-2xl border border-white/5 hover:border-white/10 transition-all group">
                                        <div className="w-12 h-12 bg-amber-500/10 rounded-xl flex items-center justify-center border border-amber-500/20 group-hover:bg-amber-500/20 transition-all">
                                            <AlertTriangle className="w-5 h-5 text-amber-500 shadow-[0_0_10px_rgba(245,158,11,0.3)]" />
                                        </div>
                                        <div className="flex-1">
                                            <p className="text-[11px] font-black text-white uppercase italic tracking-tight line-clamp-1">{error._id || 'UNIDENTIFIED_ERR'}</p>
                                            <p className="text-[9px] font-bold text-zinc-600 uppercase tracking-widest mt-1">RECURRING_ANOMALY</p>
                                        </div>
                                        <div className="text-right">
                                            <p className="font-black text-white text-xl tracking-tighter italic">{error.count}</p>
                                            <p className="text-[9px] font-black text-zinc-700 uppercase tracking-widest">FREQUENCY</p>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="text-center py-16 rounded-2xl border border-dashed border-white/5 bg-black/10">
                                    <p className="text-[10px] font-black text-zinc-700 uppercase tracking-widest">No Pattern Detected</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

function DMStatCard({ label, value, icon: Icon, color, bgColor }: { label: string, value: string | number, icon: any, color: string, bgColor: string }) {
    return (
        <div className="bg-zinc-900/40 rounded-[2.5rem] p-8 border border-white/5 shadow-2xl backdrop-blur-sm relative overflow-hidden group">
            <div className={`absolute top-0 right-0 w-24 h-24 ${bgColor} blur-[60px] -mr-12 -mt-12 group-hover:scale-150 transition-transform duration-700`} />
            <div className="flex items-center justify-between mb-6 relative z-10">
                <div className={`p-4 ${bgColor} rounded-2xl border border-white/5 group-hover:scale-110 transition-transform duration-500`}>
                    <Icon className={`w-6 h-6 ${color}`} />
                </div>
            </div>
            <div className="relative z-10">
                <p className="text-4xl font-black text-white tracking-tighter italic group-hover:translate-x-1 transition-transform">{value}</p>
                <p className="text-[10px] font-black text-zinc-600 uppercase tracking-[0.3em] mt-2 ml-1">{label}</p>
            </div>
        </div>
    );
}
