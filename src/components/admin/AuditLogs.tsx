'use client';

import React, { useState, useEffect } from 'react';
import {
    History, Search, Filter, Calendar,
    User, Activity, Shield, Loader2,
    AlertCircle, ChevronLeft, ChevronRight,
    ArrowUpRight
} from 'lucide-react';
import { toast } from 'react-hot-toast';

export default function AuditLogs() {
    const [logs, setLogs] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);

    const fetchLogs = async () => {
        try {
            setLoading(true);
            const res = await fetch(`/api/admin/logs?page=${page}&search=${search}`);
            const json = await res.json();
            setLogs(json.logs || []);
            setTotalPages(json.pagination?.pages || 1);
        } catch (err) {
            console.error('Failed to fetch logs:', err);
            toast.error('Failed to load audit logs');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        const timer = setTimeout(fetchLogs, 500);
        return () => clearTimeout(timer);
    }, [search, page]);

    return (
        <div className="bg-zinc-900 rounded-[2.5rem] border border-white/10 shadow-2xl overflow-hidden">
            <div className="p-8 border-b border-white/5 space-y-6">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div>
                        <h2 className="text-xl font-black text-white flex items-center gap-3 uppercase tracking-tighter italic">
                            <div className="w-2 h-6 bg-amber-500 rounded-full" />
                            Audit Trail
                        </h2>
                        <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mt-1">Founders Command Center • Live Monitoring</p>
                    </div>

                    <div className="flex items-center gap-4">
                        <div className="relative group">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-600 group-focus-within:text-amber-500 transition-colors" />
                            <input
                                type="text"
                                placeholder="Search admin or action..."
                                value={search}
                                onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                                className="bg-black/40 border border-white/5 rounded-2xl pl-12 pr-6 py-3 text-sm text-white focus:outline-none focus:border-amber-500/50 transition-all w-64 placeholder:text-zinc-700 font-medium"
                            />
                        </div>
                    </div>
                </div>
            </div>

            <div className="overflow-x-auto">
                <table className="w-full text-left">
                    <thead>
                        <tr className="text-[10px] font-black text-zinc-600 uppercase tracking-[0.2em] border-b border-white/5 bg-white/[0.01]">
                            <th className="px-8 py-5">Administrator</th>
                            <th className="px-8 py-5">Action & Scope</th>
                            <th className="px-8 py-5">Intel Shift</th>
                            <th className="px-8 py-5 text-right">Timestamp</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                        {loading ? (
                            <tr>
                                <td colSpan={4} className="py-20 text-center">
                                    <Loader2 className="w-8 h-8 text-amber-500 animate-spin mx-auto mb-4" />
                                    <p className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Decrypting Logs...</p>
                                </td>
                            </tr>
                        ) : logs.length === 0 ? (
                            <tr>
                                <td colSpan={4} className="py-20 text-center">
                                    <AlertCircle className="w-8 h-8 text-zinc-700 mx-auto mb-4" />
                                    <p className="text-[10px] font-black uppercase tracking-widest text-zinc-500">No events logged</p>
                                </td>
                            </tr>
                        ) : logs.map((log) => (
                            <tr key={log._id} className="hover:bg-white/[0.02] transition-colors group">
                                <td className="px-8 py-6">
                                    <div className="flex items-center gap-4">
                                        <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center font-black text-amber-500 border border-amber-500/20">
                                            <Shield size={16} />
                                        </div>
                                        <div>
                                            <p className="font-black text-white text-xs tracking-tight uppercase italic">{log.adminEmail.split('@')[0]}</p>
                                            <p className="text-[10px] font-medium text-zinc-500 italic">{log.adminEmail}</p>
                                        </div>
                                    </div>
                                </td>
                                <td className="px-8 py-6">
                                    <div className="flex items-center gap-3">
                                        <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border bg-white/5 text-zinc-400 border-white/5`}>
                                            {log.action.replace('_', ' ')}
                                        </span>
                                        <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">
                                            {log.targetType}
                                        </span>
                                    </div>
                                </td>
                                <td className="px-8 py-6">
                                    <div className="max-w-[200px] truncate">
                                        <p className="text-[10px] font-medium text-zinc-400">
                                            {JSON.stringify(log.changes || {})}
                                        </p>
                                    </div>
                                </td>
                                <td className="px-8 py-6 text-right">
                                    <p className="text-[10px] font-black text-white italic tracking-tighter">
                                        {new Date(log.timestamp).toLocaleString()}
                                    </p>
                                    <p className="text-[8px] font-bold text-zinc-600 uppercase tracking-widest">
                                        {log.ipAddress || '0.0.0.0'}
                                    </p>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            <div className="p-8 bg-black/20 border-t border-white/5 flex items-center justify-between">
                <p className="text-[10px] font-black text-zinc-600 uppercase tracking-widest">
                    Immutable Audit Trail • SHA-256 Verified
                </p>
                <div className="flex items-center gap-4">
                    <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Fragment {page} / {totalPages}</span>
                    <div className="flex gap-2">
                        <button
                            onClick={() => setPage(p => Math.max(1, p - 1))}
                            disabled={page === 1}
                            className="p-2 bg-white/5 border border-white/10 rounded-xl text-zinc-500 hover:text-white transition-all disabled:opacity-20"
                        >
                            <ChevronLeft size={16} />
                        </button>
                        <button
                            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                            disabled={page === totalPages}
                            className="p-2 bg-white/5 border border-white/10 rounded-xl text-zinc-500 hover:text-white transition-all disabled:opacity-20"
                        >
                            <ChevronRight size={16} />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
