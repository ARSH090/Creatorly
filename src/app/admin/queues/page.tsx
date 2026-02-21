'use client';

import { useState, useEffect } from 'react';
import {
    LayoutDashboard,
    Activity,
    Clock,
    CheckCircle,
    AlertCircle,
    Pause,
    Play,
    RefreshCw
} from 'lucide-react';

interface QueueStats {
    name: string;
    counts: {
        wait: number;
        active: number;
        completed: number;
        failed: number;
        delayed: number;
        paused: number;
    };
    recentJobs: any[];
}

export default function QueuesPage() {
    const [queues, setQueues] = useState<QueueStats[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const fetchQueues = async () => {
        try {
            setLoading(true);
            const res = await fetch('/api/admin/queues');
            const data = await res.json();
            if (data.success) {
                setQueues(data.queues);
            } else {
                setError(data.error || 'Failed to fetch queues');
            }
        } catch (err) {
            setError('Failed to connect to queue API');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchQueues();
        const interval = setInterval(fetchQueues, 30000); // Poll every 30s
        return () => clearInterval(interval);
    }, []);

    return (
        <div className="space-y-12">
            <header className="flex items-center justify-between">
                <div className="space-y-1">
                    <h1 className="text-4xl font-black text-white tracking-tighter italic uppercase flex items-center gap-4">
                        <Activity className="w-10 h-10 text-indigo-500 shadow-[0_0_20px_rgba(99,102,241,0.4)]" />
                        NODE ORCHESTRATOR
                    </h1>
                    <p className="text-[10px] font-black text-zinc-600 uppercase tracking-[0.4em] mt-2 ml-14">
                        Distributed Task Clusters • Real-time Monitoring Active
                    </p>
                </div>
                <button
                    onClick={fetchQueues}
                    className="p-4 bg-zinc-900 border border-white/5 rounded-2xl hover:bg-zinc-800 transition-all shadow-xl active:scale-95 group"
                >
                    <RefreshCw className={`w-6 h-6 text-zinc-500 group-hover:text-white ${loading ? 'animate-spin' : ''}`} />
                </button>
            </header>

            {error && (
                <div className="p-6 bg-rose-500/10 border border-rose-500/20 rounded-3xl text-rose-500 font-black text-[10px] uppercase tracking-widest flex items-center gap-4 animate-pulse">
                    <AlertCircle className="w-6 h-6" />
                    Protocol Breach: {error}
                </div>
            )}

            <div className="grid md:grid-cols-2 gap-10">
                {queues.map((queue) => (
                    <div key={queue.name} className="bg-zinc-900/40 rounded-[3rem] border border-white/5 p-10 shadow-2xl backdrop-blur-md space-y-8 relative overflow-hidden group">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 blur-[80px] -mr-10 -mt-10 group-hover:bg-indigo-500/10 transition-colors" />

                        <div className="flex items-center justify-between relative z-10">
                            <h2 className="text-2xl font-black text-white uppercase tracking-tighter italic flex items-center gap-4">
                                <div className="w-2 h-8 bg-indigo-500 rounded-full" />
                                {queue.name.replace(/-/g, ' ')}
                            </h2>
                            <div className="px-4 py-1.5 bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 uppercase text-[9px] font-black tracking-[0.2em] rounded-xl flex items-center gap-2">
                                <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
                                SYNCED
                            </div>
                        </div>

                        <div className="grid grid-cols-3 gap-5 relative z-10">
                            <StatBox label="Pending" value={queue.counts.wait} icon={Clock} color="text-amber-500" />
                            <StatBox label="Exec" value={queue.counts.active} icon={Activity} color="text-indigo-400" />
                            <StatBox label="Success" value={queue.counts.completed} icon={CheckCircle} color="text-emerald-400" />
                            <StatBox label="Fail" value={queue.counts.failed} icon={AlertCircle} color="text-rose-500" />
                            <StatBox label="Hold" value={queue.counts.delayed} icon={LayoutDashboard} color="text-zinc-600" />
                            <StatBox label="Pause" value={queue.counts.paused} icon={Pause} color="text-zinc-600" />
                        </div>

                        <div className="pt-8 border-t border-white/5 relative z-10">
                            <h3 className="text-[9px] font-black text-zinc-600 uppercase tracking-[0.3em] mb-6 flex items-center gap-2">
                                <div className="w-1.5 h-1.5 bg-zinc-700 rounded-full animate-pulse" />
                                Live Intelligence Stream
                            </h3>
                            <div className="space-y-4">
                                {queue.recentJobs.length > 0 ? queue.recentJobs.map(job => (
                                    <div key={job.id} className="flex items-center justify-between p-4 bg-black/30 rounded-2xl border border-white/5 hover:border-white/10 transition-colors">
                                        <div className="flex items-center gap-4">
                                            <div className="w-10 h-10 bg-zinc-900 rounded-xl flex items-center justify-center text-[9px] font-black border border-white/5 text-zinc-500 italic">
                                                ID
                                            </div>
                                            <div>
                                                <p className="text-xs font-black text-white leading-none mb-1.5 uppercase italic">#{job.id.substring(0, 8)}</p>
                                                <p className="text-[9px] text-zinc-600 font-black uppercase tracking-widest font-mono">
                                                    {new Date(job.timestamp).toLocaleTimeString()}
                                                </p>
                                            </div>
                                        </div>
                                        {job.failedReason && (
                                            <span className="text-[8px] font-black text-rose-500 bg-rose-500/5 px-3 py-1.5 rounded-lg border border-rose-500/10 max-w-[150px] truncate uppercase">
                                                {job.failedReason}
                                            </span>
                                        )}
                                    </div>
                                )) : (
                                    <div className="text-center py-8 rounded-2xl border border-dashed border-white/5 bg-black/10">
                                        <p className="text-[10px] font-black text-zinc-700 uppercase tracking-widest">System Silent</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

function StatBox({ label, value, icon: Icon, color }: { label: string, value: number, icon: any, color: string }) {
    return (
        <div className="StatContainer p-6 bg-zinc-900/40 rounded-[2rem] border border-white/5 hover:border-indigo-500/30 transition-all group relative overflow-hidden">
            <div className="absolute top-0 right-0 w-16 h-16 bg-white/[0.02] -mr-8 -mt-8 rounded-full blur-xl group-hover:bg-indigo-500/10 transition-colors" />
            <div className="flex items-center justify-between mb-4 relative z-10">
                <Icon className={`w-6 h-6 ${color} opacity-80 group-hover:scale-110 transition-transform`} />
                <span className="text-2xl font-black text-white italic tracking-tighter">
                    {value}
                </span>
            </div>
            <p className="text-[10px] font-black text-zinc-600 uppercase tracking-widest relative z-10">{label}</p>
        </div>
    );
}
