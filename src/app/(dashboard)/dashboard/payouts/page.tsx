'use client';

import { useEffect, useState } from 'react';
import { PayoutRequestModal } from '@/components/dashboard/payout-request-modal';
import { PayoutSettingsModal } from '@/components/dashboard/payout-settings-modal';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { format } from 'date-fns';
import {
    ArrowUpRight, CheckCircle2, Clock, Wallet,
    History, Download, ShieldCheck, TrendingUp,
    AlertCircle
} from 'lucide-react';
import { Skeleton, StatsSkeleton, TableSkeleton } from '@/components/ui/skeleton-loaders';
import { EmptyState } from '@/components/ui/empty-state';
import { toast } from 'react-hot-toast';
import { cn } from '@/lib/utils';

export default function CreatorPayoutsPage() {
    const [loading, setLoading] = useState(true);
    const [data, setData] = useState<any>({ payouts: [], summary: {} });

    const fetchPayouts = async () => {
        try {
            const res = await fetch('/api/creator/payouts');
            if (!res.ok) throw new Error('Telemetry Link Dead');
            const json = await res.json();
            setData(json);
        } catch (error) {
            toast.error('Failed to sync financial ledger');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchPayouts();
    }, []);

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'paid': return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
            case 'pending': return 'bg-amber-500/10 text-amber-400 border-amber-500/20';
            case 'processed': return 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20';
            case 'rejected': return 'bg-rose-500/10 text-rose-400 border-rose-500/20';
            default: return 'bg-zinc-500/10 text-zinc-400 border-zinc-500/20';
        }
    };

    if (loading) {
        return (
            <div className="max-w-7xl mx-auto space-y-12 pb-24 animate-in fade-in duration-500">
                <div className="space-y-4">
                    <Skeleton className="h-12 w-64 rounded-xl" />
                    <Skeleton className="h-4 w-96 rounded-lg" />
                </div>
                <StatsSkeleton count={3} />
                <TableSkeleton rows={8} />
            </div>
        );
    }

    return (
        <div className="max-w-7xl mx-auto space-y-12 pb-24 animate-in fade-in duration-700">
            <header className="flex flex-col md:flex-row md:items-center justify-between gap-8">
                <div className="space-y-4">
                    <h1 className="text-5xl font-black text-white italic uppercase tracking-tighter flex items-center gap-4">
                        <Wallet className="w-12 h-12 text-indigo-500 shadow-[0_0_30px_rgba(99,102,241,0.4)]" />
                        EARNINGS & PAYOUTS
                    </h1>
                    <p className="text-[10px] font-black text-zinc-600 uppercase tracking-[0.4em] ml-16">
                        Financial Liquidity • Withdrawal Protocols • Revenue Ledger
                    </p>
                </div>
                <div className="flex items-center gap-4 ml-16 md:ml-0">
                    <PayoutSettingsModal onSuccess={fetchPayouts} />
                    <PayoutRequestModal
                        availableBalance={data.summary.available || 0}
                        onSuccess={fetchPayouts}
                    />
                </div>
            </header>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {[
                    { label: 'AVAILABLE LIQUIDITY', val: data.summary.available, icon: TrendingUp, color: 'text-emerald-400', sub: 'Ready for withdrawal' },
                    { label: 'PENDING PROCESSING', val: ((data.summary.pending || 0) - (data.summary.available || 0)), icon: Clock, color: 'text-amber-400', sub: 'In-flight requests' },
                    { label: 'LIFETIME EARNINGS', val: data.summary.paidOut, icon: ShieldCheck, color: 'text-indigo-400', sub: 'Successfully settled' }
                ].map((stat, i) => (
                    <div key={i} className="bg-zinc-900/40 backdrop-blur-3xl rounded-[2.5rem] p-10 border border-white/5 group hover:border-white/10 transition-all">
                        <div className="flex justify-between items-start mb-6">
                            <p className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.3em] italic">{stat.label}</p>
                            <stat.icon className={cn("w-5 h-5 opacity-40 group-hover:opacity-100 transition-opacity", stat.color)} />
                        </div>
                        <div className="text-4xl font-black text-white tracking-tighter italic">₹{(stat.val || 0).toLocaleString()}</div>
                        <p className="text-[9px] font-black text-zinc-600 uppercase tracking-widest mt-4 italic">{stat.sub}</p>
                    </div>
                ))}
            </div>

            {/* Payout History */}
            <div className="bg-zinc-900/40 backdrop-blur-3xl rounded-[3rem] p-10 border border-white/5 space-y-10">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-white/5 rounded-2xl border border-white/10">
                            <History className="w-6 h-6 text-zinc-400" />
                        </div>
                        <h3 className="text-2xl font-black text-white italic uppercase tracking-tight">TRANSACTION ARCHIVE</h3>
                    </div>
                    <Button variant="ghost" className="text-[10px] font-black text-zinc-500 hover:text-white uppercase tracking-widest">
                        <Download className="w-4 h-4 mr-2" /> Export CSV
                    </Button>
                </div>

                {data.payouts.length === 0 ? (
                    <EmptyState
                        icon={AlertCircle}
                        title="NO TRANSACTIONS DEPLOYED"
                        description="Your financial ledger is currently empty. Start selling to initialize payouts."
                    />
                ) : (
                    <div className="overflow-x-auto rounded-[2rem] border border-white/5">
                        <table className="w-full text-left">
                            <thead>
                                <tr className="bg-white/5 text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em] italic">
                                    <th className="py-6 px-8">TIMESTAMP</th>
                                    <th className="py-6 px-8">QUANTITY</th>
                                    <th className="py-6 px-8">STATUS</th>
                                    <th className="py-6 px-8">PROTOCOL</th>
                                    <th className="py-6 px-8 text-right">REFERENCE</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5">
                                {data.payouts.map((payout: any) => (
                                    <tr key={payout._id} className="text-sm hover:bg-white/[0.02] transition-colors group">
                                        <td className="py-6 px-8 text-zinc-400 font-bold italic">
                                            {format(new Date(payout.createdAt), 'MMM dd, yyyy')}
                                        </td>
                                        <td className="py-6 px-8 text-white font-black italic">
                                            ₹{payout.amount.toLocaleString()}
                                        </td>
                                        <td className="py-6 px-8">
                                            <Badge variant="outline" className={cn("px-4 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest italic", getStatusColor(payout.status))}>
                                                {payout.status.toUpperCase()}
                                            </Badge>
                                        </td>
                                        <td className="py-6 px-8 text-[10px] font-black text-zinc-300 uppercase italic">
                                            {payout.payoutMethod || 'Direct Bank'}
                                        </td>
                                        <td className="py-6 px-8 text-right text-[10px] font-bold text-zinc-600 uppercase italic truncate max-w-[150px]">
                                            {payout.description || 'System Auto-Gen'}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
}
