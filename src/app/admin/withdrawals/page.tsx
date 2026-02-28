'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
    Banknote, CheckCircle2, XCircle, Clock,
    ExternalLink, Filter, Search, ShieldCheck,
    TrendingUp, ArrowDownLeft
} from 'lucide-react';
import { Skeleton, StatsSkeleton, TableSkeleton } from '@/components/ui/skeleton-loaders';
import { EmptyState } from '@/components/ui/empty-state';
import { toast } from 'react-hot-toast';
import { cn } from '@/lib/utils';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';

export default function AdminWithdrawalsPage() {
    const [payouts, setPayouts] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [status, setStatus] = useState('all');
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);

    useEffect(() => {
        fetchPayouts();
    }, [status, page]);

    const fetchPayouts = async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams({
                page: page.toString(),
                limit: '10',
                status
            });
            const res = await fetch(`/api/admin/withdrawals?${params}`);
            if (!res.ok) throw new Error('Ledger Sync Failed');
            const data = await res.json();
            setPayouts(data.payouts);
            setTotalPages(data.pagination.pages);
        } catch (error) {
            toast.error('Failed to load financial transmission');
        } finally {
            setLoading(false);
        }
    };

    const handleAction = async (id: string, action: string, reason: string = '') => {
        try {
            const res = await fetch(`/api/admin/withdrawals/${id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: action, rejectionReason: reason }),
            });
            if (res.ok) {
                toast.success(`Protocol ${action.toUpperCase()} initialized.`);
                fetchPayouts();
            }
        } catch (error) {
            toast.error('Transactional override failed');
        }
    };

    return (
        <div className="space-y-12 max-w-7xl mx-auto pb-24 animate-in fade-in duration-700">
            <header className="flex flex-col md:flex-row md:items-center justify-between gap-8">
                <div className="space-y-4">
                    <h1 className="text-5xl font-black text-white italic uppercase tracking-tighter flex items-center gap-4">
                        <Banknote className="w-12 h-12 text-emerald-500 shadow-[0_0_30px_rgba(16,185,129,0.4)]" />
                        TREASURY OPS
                    </h1>
                    <p className="text-[10px] font-black text-zinc-600 uppercase tracking-[0.4em] ml-16">
                        Liquidity Settlement • Withdrawal Controls • Global Ledger
                    </p>
                </div>
                <div className="flex items-center gap-4 ml-16 md:ml-0">
                    <Select value={status} onValueChange={setStatus}>
                        <SelectTrigger className="w-[200px] bg-zinc-900/40 border-white/5 text-white font-black uppercase tracking-widest text-[10px] rounded-2xl h-14 px-6 focus:ring-emerald-500/20">
                            <SelectValue placeholder="SIGNAL FILTER" />
                        </SelectTrigger>
                        <SelectContent className="bg-zinc-900 border-white/10 text-white rounded-2xl overflow-hidden">
                            <SelectItem value="all" className="focus:bg-white/5 uppercase text-[9px] font-black h-12">Full Ledger</SelectItem>
                            <SelectItem value="pending" className="focus:bg-white/5 uppercase text-[9px] font-black h-12">Pending Buffer</SelectItem>
                            <SelectItem value="approved" className="focus:bg-white/5 uppercase text-[9px] font-black h-12">Processed Signals</SelectItem>
                            <SelectItem value="paid" className="focus:bg-white/5 uppercase text-[9px] font-black h-12">Settled Protocols</SelectItem>
                            <SelectItem value="rejected" className="focus:bg-white/5 uppercase text-[9px] font-black h-12">Terminated Comms</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </header>

            {loading ? (
                <div className="space-y-10">
                    <StatsSkeleton count={3} />
                    <TableSkeleton rows={8} />
                </div>
            ) : payouts.length === 0 ? (
                <EmptyState
                    icon={ShieldCheck}
                    title="TREASURY CLEAR"
                    description="No pending settlement requests detected in the current buffer."
                />
            ) : (
                <div className="bg-zinc-900/40 backdrop-blur-3xl rounded-[3rem] p-10 border border-white/5 space-y-10">
                    <div className="overflow-x-auto rounded-[2rem] border border-white/5">
                        <table className="w-full text-left">
                            <thead>
                                <tr className="bg-white/5 text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em] italic">
                                    <th className="py-6 px-10">INITIATION TIMESTAMP</th>
                                    <th className="py-6 px-10">BENEFICIARY ENTITY</th>
                                    <th className="py-6 px-10">SETTLEMENT VALUE</th>
                                    <th className="py-6 px-10">SIGNAL STATUS</th>
                                    <th className="py-6 px-10 text-right">AUTHORIZATION</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5">
                                {payouts.map((p) => (
                                    <tr key={p._id} className="text-sm hover:bg-white/[0.02] transition-colors group">
                                        <td className="py-8 px-10">
                                            <div className="flex flex-col">
                                                <span className="text-[10px] font-black text-white italic tracking-widest uppercase">{new Date(p.createdAt).toLocaleDateString()}</span>
                                                <span className="text-[9px] font-bold text-zinc-600 font-mono mt-1">{new Date(p.createdAt).toLocaleTimeString()}</span>
                                            </div>
                                        </td>
                                        <td className="py-8 px-10">
                                            <div className="flex flex-col">
                                                <span className="font-black text-xs text-indigo-400 uppercase tracking-tight italic">{p.creatorId?.displayName}</span>
                                                <span className="text-[9px] font-bold text-zinc-600 tracking-tighter uppercase">{p.creatorId?.email}</span>
                                            </div>
                                        </td>
                                        <td className="py-8 px-10">
                                            <span className="font-black text-2xl text-white tracking-tighter italic">₹{p.amount.toLocaleString()}</span>
                                        </td>
                                        <td className="py-8 px-10">
                                            <Badge className={cn(
                                                "uppercase text-[9px] font-black tracking-widest px-4 py-1.5 rounded-lg border",
                                                p.status === 'pending' ? "bg-amber-500/10 text-amber-500 border-amber-500/20" :
                                                    p.status === 'paid' ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" :
                                                        p.status === 'rejected' ? "bg-rose-500/10 text-rose-400 border-rose-500/20" :
                                                            "bg-indigo-500/10 text-indigo-400 border-indigo-500/20"
                                            )}>
                                                {p.status}
                                            </Badge>
                                        </td>
                                        <td className="py-8 px-10 text-right">
                                            <div className="flex justify-end gap-3 opacity-0 group-hover:opacity-100 transition-all translate-x-4 group-hover:translate-x-0">
                                                {p.status === 'pending' ? (
                                                    <>
                                                        <Button
                                                            size="icon"
                                                            className="h-12 w-12 rounded-xl bg-emerald-500 shadow-lg shadow-emerald-500/20 text-white"
                                                            onClick={() => handleAction(p._id, 'approved')}
                                                        >
                                                            <CheckCircle2 size={20} />
                                                        </Button>
                                                        <Button
                                                            size="icon"
                                                            className="h-12 w-12 rounded-xl bg-rose-500 shadow-lg shadow-rose-500/20 text-white"
                                                            onClick={() => {
                                                                const r = prompt('TERMINATION REASON:');
                                                                if (r) handleAction(p._id, 'rejected', r);
                                                            }}
                                                        >
                                                            <XCircle size={20} />
                                                        </Button>
                                                    </>
                                                ) : p.status === 'approved' ? (
                                                    <Button
                                                        onClick={() => handleAction(p._id, 'paid')}
                                                        className="h-12 px-6 bg-white text-black font-black uppercase text-[10px] tracking-widest rounded-xl hover:scale-105 transition-all"
                                                    >
                                                        SETTLE PROTOCOL
                                                    </Button>
                                                ) : (
                                                    <span className="text-[9px] font-black text-zinc-700 uppercase tracking-widest italic">Signal Locked</span>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    <footer className="flex justify-between items-center px-4">
                        <p className="text-[10px] font-black text-zinc-600 uppercase tracking-widest italic">
                            Page {page} <span className="text-zinc-800">/</span> {totalPages}
                        </p>
                        <div className="flex gap-4">
                            <Button
                                variant="ghost"
                                disabled={page <= 1}
                                onClick={() => setPage(p => p - 1)}
                                className="text-[10px] font-black text-zinc-500 hover:text-white uppercase tracking-widest disabled:opacity-20"
                            >
                                PREV CYCLE
                            </Button>
                            <Button
                                variant="ghost"
                                disabled={page >= totalPages}
                                onClick={() => setPage(p => p + 1)}
                                className="text-[10px] font-black text-zinc-500 hover:text-white uppercase tracking-widest disabled:opacity-20"
                            >
                                NEXT CYCLE
                            </Button>
                        </div>
                    </footer>
                </div>
            )}
        </div>
    );
}
