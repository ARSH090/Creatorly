'use client';

import React, { useState, useEffect } from 'react';
import {
    Wallet, Search, Filter, CheckCircle, XCircle,
    CreditCard, ExternalLink, Loader2, AlertCircle,
    ArrowUpRight, Clock, Ban, ChevronRight
} from 'lucide-react';

interface Payout {
    _id: string;
    creatorId: {
        _id: string;
        displayName: string;
        email: string;
        username: string;
    };
    amount: number;
    currency: string;
    status: 'pending' | 'approved' | 'paid' | 'rejected' | 'failed';
    payoutMethod: string;
    notes?: string;
    transactionId?: string;
    rejectionReason?: string;
    createdAt: string;
    processedAt?: string;
}

export function PayoutsManagement() {
    const [payouts, setPayouts] = useState<Payout[]>([]);
    const [loading, setLoading] = useState(true);
    const [summary, setSummary] = useState<any>(null);
    const [filter, setFilter] = useState('pending');
    const [actionLoading, setActionLoading] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);

    const fetchPayouts = async () => {
        try {
            setLoading(true);
            const res = await fetch(`/api/admin/payouts?status=${filter === 'all' ? '' : filter}&page=${page}&limit=20`);
            const json = await res.json();
            if (json.success) {
                setPayouts(json.data.payouts);
                setSummary(json.data.summary);
                setTotalPages(json.data.pagination.pages);
            }
        } catch (err) {
            console.error('Failed to fetch payouts:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchPayouts();
    }, [filter, page]);

    const handleAction = async (id: string, action: string, data: any = {}) => {
        try {
            setActionLoading(id);
            const res = await fetch(`/api/admin/payouts/${id}?action=${action}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });
            const json = await res.json();
            if (json.success) {
                fetchPayouts(); // Refresh list
            } else {
                alert(json.error || 'Action failed');
            }
        } catch (err) {
            console.error(`Action ${action} failed:`, err);
        } finally {
            setActionLoading(null);
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'pending': return 'bg-amber-500/10 text-amber-500 border-amber-500/20';
            case 'approved': return 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20';
            case 'paid': return 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20';
            case 'rejected': return 'bg-rose-500/10 text-rose-500 border-rose-500/20';
            default: return 'bg-zinc-800 text-zinc-400 border-white/5';
        }
    };

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            {/* Stats Overview */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="bg-zinc-900/50 p-6 rounded-[2rem] border border-white/5 shadow-xl">
                    <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-1">Total Volume</p>
                    <p className="text-2xl font-black text-white italic">₹{summary?.totalAmount?.toLocaleString() || 0}</p>
                </div>
                <div className="bg-zinc-900/50 p-6 rounded-[2rem] border border-white/5 shadow-xl">
                    <p className="text-[10px] font-black text-amber-500 uppercase tracking-widest mb-1">Queue Depth</p>
                    <p className="text-2xl font-black text-white italic">{summary?.pending || 0} PENDING</p>
                </div>
                <div className="bg-zinc-900/50 p-6 rounded-[2rem] border border-white/5 shadow-xl">
                    <p className="text-[10px] font-black text-emerald-500 uppercase tracking-widest mb-1">Completed</p>
                    <p className="text-2xl font-black text-white italic">{summary?.paid || 0} SETTLED</p>
                </div>
                <div className="bg-zinc-900/50 p-6 rounded-[2rem] border border-white/5 shadow-xl">
                    <p className="text-[10px] font-black text-rose-500 uppercase tracking-widest mb-1">Rejected</p>
                    <p className="text-2xl font-black text-white italic">{summary?.rejected || 0} DENIED</p>
                </div>
            </div>

            {/* Main Container */}
            <div className="bg-zinc-900 rounded-[2.5rem] border border-white/10 shadow-2xl overflow-hidden">
                <div className="p-8 border-b border-white/5 flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div>
                        <h2 className="text-xl font-black text-white flex items-center gap-3 uppercase tracking-tighter italic">
                            <div className="w-2 h-6 bg-amber-500 rounded-full" />
                            Financial Settlement
                        </h2>
                        <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mt-1">Capital Disbursement Node</p>
                    </div>

                    <div className="flex items-center gap-4">
                        <div className="flex bg-black/40 rounded-2xl p-1 border border-white/5">
                            {['all', 'pending', 'approved', 'paid'].map((s) => (
                                <button
                                    key={s}
                                    onClick={() => { setFilter(s); setPage(1); }}
                                    className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${filter === s ? 'bg-amber-500 text-black shadow-lg shadow-amber-500/20' : 'text-zinc-500 hover:text-white'
                                        }`}
                                >
                                    {s}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="text-[10px] font-black text-zinc-600 uppercase tracking-[0.2em] border-b border-white/5 bg-white/[0.01]">
                                <th className="px-8 py-5">Origin / Creator</th>
                                <th className="px-8 py-5">Quantum / Status</th>
                                <th className="px-8 py-5">Intelligence</th>
                                <th className="px-8 py-5 text-right">Operations</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {loading ? (
                                <tr>
                                    <td colSpan={4} className="py-20 text-center">
                                        <Loader2 className="w-8 h-8 text-amber-500 animate-spin mx-auto mb-4" />
                                        <p className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Syncing Ledger...</p>
                                    </td>
                                </tr>
                            ) : payouts.length === 0 ? (
                                <tr>
                                    <td colSpan={4} className="py-20 text-center">
                                        <AlertCircle className="w-8 h-8 text-zinc-700 mx-auto mb-4" />
                                        <p className="text-[10px] font-black uppercase tracking-widest text-zinc-500">No transactions recorded</p>
                                    </td>
                                </tr>
                            ) : payouts.map((p) => (
                                <tr key={p._id} className="hover:bg-white/[0.02] transition-colors group">
                                    <td className="px-8 py-6">
                                        <div className="flex items-center gap-4">
                                            <div className="w-12 h-12 rounded-2xl bg-amber-500/10 flex items-center justify-center font-black text-amber-500 border border-amber-500/20 group-hover:scale-110 transition-transform">
                                                {p.creatorId?.displayName?.charAt(0) || 'C'}
                                            </div>
                                            <div>
                                                <p className="font-black text-white text-sm tracking-tight group-hover:text-amber-500 transition-colors uppercase italic">{p.creatorId?.displayName}</p>
                                                <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mt-0.5">@{p.creatorId?.username}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-8 py-6">
                                        <div className="space-y-2">
                                            <p className="font-black text-white text-lg tracking-tighter italic">₹{p.amount.toLocaleString()}</p>
                                            <span className={`px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-widest border ${getStatusColor(p.status)}`}>
                                                {p.status}
                                            </span>
                                        </div>
                                    </td>
                                    <td className="px-8 py-6">
                                        <div className="space-y-1.5">
                                            <div className="flex items-center gap-2 text-zinc-500 group-hover:text-zinc-300 transition-colors">
                                                <Clock size={12} />
                                                <span className="text-[10px] font-bold uppercase tracking-widest">{new Date(p.createdAt).toLocaleDateString()}</span>
                                            </div>
                                            <div className="flex items-center gap-2 text-zinc-500 group-hover:text-zinc-300 transition-colors">
                                                <CreditCard size={12} />
                                                <span className="text-[10px] font-bold uppercase tracking-widest">{p.payoutMethod || 'Direct Transfer'}</span>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-8 py-6 text-right">
                                        <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                            {p.status === 'pending' && (
                                                <>
                                                    <button
                                                        onClick={() => handleAction(p._id, 'approve')}
                                                        disabled={actionLoading === p._id}
                                                        className="px-4 py-2 bg-indigo-500 text-black rounded-xl text-[10px] font-black uppercase tracking-widest hover:scale-105 transition-all shadow-lg shadow-indigo-500/20"
                                                    >
                                                        Approve
                                                    </button>
                                                    <button
                                                        onClick={() => {
                                                            const reason = prompt('Rejection reason:');
                                                            if (reason) handleAction(p._id, 'reject', { reason });
                                                        }}
                                                        disabled={actionLoading === p._id}
                                                        className="p-2 bg-rose-500/10 text-rose-500 border border-rose-500/20 rounded-xl hover:bg-rose-500 hover:text-white transition-all"
                                                        title="Reject"
                                                    >
                                                        <XCircle size={18} />
                                                    </button>
                                                </>
                                            )}
                                            {p.status === 'approved' && (
                                                <button
                                                    onClick={() => {
                                                        const txId = prompt('Transaction ID:');
                                                        if (txId) handleAction(p._id, 'process', { transactionId: txId });
                                                    }}
                                                    disabled={actionLoading === p._id}
                                                    className="px-4 py-2 bg-emerald-500 text-black rounded-xl text-[10px] font-black uppercase tracking-widest hover:scale-105 transition-all shadow-lg shadow-emerald-500/20"
                                                >
                                                    Confirm Payment
                                                </button>
                                            )}
                                            {p.status === 'paid' && (
                                                <div className="flex items-center gap-2 text-emerald-500">
                                                    <CheckCircle size={16} />
                                                    <span className="text-[10px] font-black uppercase tracking-widest">Settled</span>
                                                </div>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* Footer / Pagination */}
                <div className="p-8 bg-black/20 border-t border-white/5 flex items-center justify-between">
                    <p className="text-[10px] font-black text-zinc-600 uppercase tracking-widest">
                        Node Identity: PLATFORM-ADMIN-NODE-01 • Secure Encryption Active
                    </p>
                    <div className="flex items-center gap-4">
                        <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Page {page} of {totalPages}</span>
                        <div className="flex gap-2">
                            <button
                                onClick={() => setPage(p => Math.max(1, p - 1))}
                                disabled={page === 1}
                                className="p-2 bg-white/5 border border-white/10 rounded-xl text-zinc-500 hover:text-white transition-all disabled:opacity-20"
                            >
                                <ChevronRight className="rotate-180" size={16} />
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
        </div>
    );
}
