// @ts-nocheck
'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogFooter,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Loader2, CheckCircle, XCircle, IndianRupee, ShieldCheck, Activity, ChevronRight, X } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'react-hot-toast';

export default function PayoutsPage() {
    const [payouts, setPayouts] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [status, setStatus] = useState('all');
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);

    // Action State
    const [processingId, setProcessingId] = useState<string | null>(null);
    const [actionType, setActionType] = useState<'approve' | 'reject' | null>(null);
    const [actionNotes, setActionNotes] = useState('');
    const [transactionId, setTransactionId] = useState('');

    const fetchPayouts = async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams({
                page: page.toString(),
                limit: '10',
                status
            });
            const res = await fetch(`/api/admin/payouts?${params}`);
            if (res.ok) {
                const data = await res.json();
                setPayouts(data.payouts);
                setTotalPages(data.pagination.pages);
            }
        } catch (error) {
            console.error('Failed to fetch payouts', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchPayouts();
    }, [status, page]);

    const handleAction = async () => {
        if (!processingId || !actionType) return;

        try {
            const body: any = {
                status: actionType === 'approve' ? 'paid' : 'rejected',
                notes: actionNotes
            };
            if (actionType === 'approve') {
                body.transactionId = transactionId;
            }

            const res = await fetch(`/api/admin/payouts/${processingId}`, {
                method: 'PUT',
                body: JSON.stringify(body),
                headers: { 'Content-Type': 'application/json' }
            });

            if (res.ok) {
                toast.success(`Payout ${actionType === 'approve' ? 'approved' : 'rejected'}`);
                setProcessingId(null);
                setActionType(null);
                setActionNotes('');
                setTransactionId('');
                fetchPayouts();
            } else {
                toast.error('Action failed');
            }
        } catch (error) {
            toast.error('Error processing payout');
        }
    };

    const openActionDialog = (id: string, type: 'approve' | 'reject') => {
        setProcessingId(id);
        setActionType(type);
        setActionNotes('');
        setTransactionId('');
    };

    return (
        <div className="space-y-12">
            {/* Header & Breadcrumbs */}
            <div className="flex items-center justify-between">
                <div className="space-y-4">
                    <nav className="flex items-center gap-3 text-[10px] font-black uppercase tracking-[0.3em]">
                        <span className="text-zinc-600 hover:text-white transition-colors cursor-pointer">Admin</span>
                        <ChevronRight className="w-3 h-3 text-zinc-800" />
                        <span className="text-emerald-500">Payouts</span>
                    </nav>
                    <div className="space-y-1">
                        <h1 className="text-4xl font-black text-white tracking-tighter italic uppercase flex items-center gap-4">
                            <IndianRupee className="w-10 h-10 text-emerald-500 shadow-[0_0_20px_rgba(16,185,129,0.4)]" />
                            PAYOUT ORCHESTRATOR
                        </h1>
                        <p className="text-[10px] font-black text-zinc-600 uppercase tracking-[0.4em] mt-2 ml-14">
                            Authorized Financial Core • Real-time Liquidity Sync
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-4">
                    <Select value={status} onValueChange={setStatus}>
                        <SelectTrigger className="w-[200px] bg-zinc-900/60 border-white/5 text-white font-black uppercase tracking-widest text-[10px] rounded-2xl h-14 backdrop-blur-md focus:ring-emerald-500">
                            <SelectValue placeholder="Protocol State" />
                        </SelectTrigger>
                        <SelectContent className="bg-zinc-900 border-white/10 text-white font-black uppercase text-[10px] tracking-widest">
                            <SelectItem value="all">Global Matrix</SelectItem>
                            <SelectItem value="pending">Awaiting Auth</SelectItem>
                            <SelectItem value="paid">Settled Pulse</SelectItem>
                            <SelectItem value="rejected">Deauthorized</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </div>

            {/* Action Dialog Polished */}
            <Dialog open={!!processingId} onOpenChange={(open) => !open && setProcessingId(null)}>
                <DialogContent className="bg-zinc-900 border-white/10 rounded-[3rem] shadow-2xl p-10 max-w-2xl">
                    <DialogHeader className="mb-10">
                        <DialogTitle className="text-3xl font-black text-white uppercase italic tracking-tighter flex items-center gap-4">
                            <div className={`w-2 h-8 ${actionType === 'approve' ? 'bg-emerald-500' : 'bg-rose-500'} rounded-full`} />
                            {actionType === 'approve' ? 'AUTHORIZE SETTLEMENT' : 'DEAUTHORIZE SETTLEMENT'}
                        </DialogTitle>
                    </DialogHeader>
                    <div className="space-y-8">
                        {actionType === 'approve' && (
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-1">Protocol Transaction ID (Optional)</label>
                                <input
                                    placeholder="Ex: TXN_892301..."
                                    value={transactionId}
                                    onChange={(e) => setTransactionId(e.target.value)}
                                    className="w-full bg-black/40 border-white/5 border-2 rounded-2xl h-14 px-6 text-white font-black uppercase italic focus:border-emerald-500 transition-all outline-none"
                                />
                            </div>
                        )}
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-1">Mission Notes / Reason</label>
                            <textarea
                                placeholder={actionType === 'approve' ? "Settlement Confirmation Details" : "Detailed Deauthorization Objective"}
                                value={actionNotes} rows={3}
                                onChange={(e) => setActionNotes(e.target.value)}
                                className="w-full bg-black/40 border-white/5 border-2 rounded-2xl p-6 text-white font-bold uppercase tracking-tighter text-xs focus:border-rose-500 transition-all outline-none resize-none"
                            />
                        </div>
                    </div>
                    <DialogFooter className="mt-12 gap-4">
                        <button onClick={() => setProcessingId(null)} className="flex-1 h-16 bg-black/40 text-zinc-600 font-black uppercase text-[10px] tracking-[0.2em] rounded-2xl border border-white/5 hover:text-white transition-all italic">ABORT</button>
                        <button
                            onClick={handleAction}
                            className={`flex-[2] h-16 ${actionType === 'approve' ? 'bg-emerald-500 group-hover:bg-emerald-400' : 'bg-rose-500 group-hover:bg-rose-400'} text-black font-black uppercase text-[10px] tracking-[0.3em] rounded-2xl shadow-xl transition-all h-16`}
                        >
                            COMMIT_PROTOCOL
                        </button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Main Registry Table */}
            <div className="bg-zinc-900/40 rounded-[3rem] border border-white/5 shadow-2xl backdrop-blur-md overflow-hidden">
                <Table>
                    <TableHeader className="bg-white/[0.02] border-b border-white/5">
                        <TableRow className="hover:bg-transparent border-none">
                            <TableHead className="px-10 py-8 text-[10px] font-black text-zinc-500 uppercase tracking-widest">Entity Signature</TableHead>
                            <TableHead className="px-10 py-8 text-[10px] font-black text-zinc-500 uppercase tracking-widest">Aggregate Amount</TableHead>
                            <TableHead className="px-10 py-8 text-[10px] font-black text-zinc-500 uppercase tracking-widest">Protocol Path</TableHead>
                            <TableHead className="px-10 py-8 text-[10px] font-black text-zinc-500 uppercase tracking-widest">Current State</TableHead>
                            <TableHead className="px-10 py-8 text-[10px] font-black text-zinc-500 uppercase tracking-widest">Timestamp</TableHead>
                            <TableHead className="px-10 py-8 text-right text-[10px] font-black text-zinc-500 uppercase tracking-widest">Directives</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody className="divide-y divide-white/5">
                        {loading ? (
                            <TableRow className="border-none">
                                <TableCell colSpan={6} className="h-64 text-center">
                                    <div className="flex flex-col items-center gap-6">
                                        <Loader2 className="h-10 w-10 animate-spin text-emerald-500" />
                                        <p className="text-[10px] font-black text-zinc-600 uppercase tracking-[0.5em] animate-pulse">Syncing Payout Matrix</p>
                                    </div>
                                </TableCell>
                            </TableRow>
                        ) : payouts.length === 0 ? (
                            <TableRow className="border-none">
                                <TableCell colSpan={6} className="h-64 text-center">
                                    <p className="text-[10px] font-black text-zinc-700 uppercase tracking-[0.3em]">No Active Settlement Records</p>
                                </TableCell>
                            </TableRow>
                        ) : (
                            payouts.map((payout) => (
                                <TableRow key={payout._id} className="border-none hover:bg-white/[0.02] transition-colors group">
                                    <TableCell className="px-10 py-8">
                                        <div className="flex flex-col">
                                            <span className="font-black text-base text-white tracking-tight uppercase italic underline decoration-indigo-500/30 decoration-2 underline-offset-4 group-hover:decoration-indigo-500 transition-all">{payout.userId?.displayName || 'Unknown Signal'}</span>
                                            <span className="text-[10px] font-bold text-zinc-600 uppercase tracking-tighter mt-1">{payout.userId?.email}</span>
                                        </div>
                                    </TableCell>
                                    <TableCell className="px-10 py-8">
                                        <span className="text-2xl font-black text-white tracking-tighter italic">₹{payout.amount.toLocaleString()}</span>
                                    </TableCell>
                                    <TableCell className="px-10 py-8">
                                        <span className="px-4 py-1.5 bg-black/40 rounded-xl border border-white/5 text-[9px] font-black text-zinc-400 uppercase tracking-[0.2em]">{payout.payoutMethod}</span>
                                    </TableCell>
                                    <TableCell className="px-10 py-8">
                                        <div className="flex items-center gap-2">
                                            <div className={`w-2 h-2 rounded-full ${payout.status === 'paid' ? 'bg-emerald-500' : payout.status === 'rejected' ? 'bg-rose-500' : 'bg-amber-500'} animate-pulse`} />
                                            <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">{payout.status.toUpperCase()}</span>
                                        </div>
                                    </TableCell>
                                    <TableCell className="px-10 py-8 text-[10px] font-black text-zinc-600 uppercase tracking-widest italic">{format(new Date(payout.createdAt), 'MMM d, yyyy')}</TableCell>
                                    <TableCell className="px-10 py-8 text-right">
                                        {payout.status === 'pending' && (
                                            <div className="flex justify-end gap-3">
                                                <button
                                                    onClick={() => openActionDialog(payout._id, 'approve')}
                                                    className="p-4 bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 rounded-xl hover:bg-emerald-500 hover:text-black transition-all shadow-lg shadow-emerald-500/5 active:scale-95"
                                                >
                                                    <CheckCircle className="h-5 w-5" />
                                                </button>
                                                <button
                                                    onClick={() => openActionDialog(payout._id, 'reject')}
                                                    className="p-4 bg-rose-500/10 border border-rose-500/20 text-rose-500 rounded-xl hover:bg-rose-500 hover:text-black transition-all shadow-lg shadow-rose-500/5 active:scale-95"
                                                >
                                                    <XCircle className="h-5 w-5" />
                                                </button>
                                            </div>
                                        )}
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>

                {/* Footer Controls */}
                <div className="bg-black/20 border-t border-white/5 px-10 py-8 flex items-center justify-between">
                    <p className="text-[10px] font-black text-zinc-700 uppercase tracking-[0.4em] italic flex items-center gap-3">
                        <Activity className="w-4 h-4 text-emerald-500/30" />
                        Secure Settlement Ledger Active
                    </p>
                    <div className="flex items-center gap-6">
                        <button
                            onClick={() => setPage((p) => Math.max(1, p - 1))}
                            disabled={page === 1 || loading}
                            className="px-6 py-3 bg-zinc-900 border border-white/5 text-zinc-500 hover:text-white rounded-xl uppercase font-black text-[9px] tracking-widest transition-all disabled:opacity-30"
                        >
                            Decrement Frame
                        </button>
                        <div className="text-[11px] font-black text-white italic tracking-tighter bg-zinc-800 px-4 py-2 rounded-lg border border-white/5">
                            {page} / {totalPages}
                        </div>
                        <button
                            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                            disabled={page === totalPages || loading}
                            className="px-6 py-3 bg-zinc-900 border border-white/5 text-zinc-500 hover:text-white rounded-xl uppercase font-black text-[9px] tracking-widest transition-all disabled:opacity-30"
                        >
                            Increment Frame
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
