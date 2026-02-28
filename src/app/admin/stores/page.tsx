'use client';

/* eslint-disable react-hooks/exhaustive-deps, react/no-unescaped-entities, @next/next/no-img-element, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars, prefer-const, import/no-anonymous-default-export */

import { useState, useEffect } from 'react';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
    Store,
    Search,
    Filter,
    ExternalLink,
    ShieldAlert,
    ShieldCheck,
    Flag,
    ShoppingBag,
    DollarSign,
    MoreHorizontal,
    Eye
} from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'react-hot-toast';
import { cn } from '@/lib/utils';
import { TableSkeleton } from '@/components/ui/skeleton-loaders';
import { EmptyState } from '@/components/ui/empty-state';
import Link from 'next/link';
import Image from 'next/image';

export default function AdminStoresPage() {
    const [stores, setStores] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [search, setSearch] = useState('');
    const [status, setStatus] = useState('all');
    const [stats, setStats] = useState({
        total: 0,
        active: 0,
        suspended: 0,
        flagged: 0
    });

    const fetchStores = async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams({
                page: page.toString(),
                limit: '20',
                search,
                status: status !== 'all' ? status : ''
            });
            const res = await fetch(`/api/admin/stores?${params}`);
            if (res.ok) {
                const result = await res.json();
                setStores(result.data.stores);
                setTotalPages(result.meta.totalPages);
                setStats(result.data.stats || stats);
            }
        } catch (error) {
            toast.error('Failed to query the store relay');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        const debounce = setTimeout(() => {
            fetchStores();
        }, 500);
        return () => clearTimeout(debounce);
    }, [search, status, page]);

    const handleUpdateStatus = async (id: string, newStatus: string) => {
        if (!confirm(`Are you sure you want to change store status to ${newStatus}?`)) return;
        try {
            const res = await fetch(`/api/admin/stores/${id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: newStatus }),
            });
            if (res.ok) {
                toast.success(`Store ${newStatus} successfully`);
                fetchStores();
            }
        } catch (error) {
            toast.error('Transactional override failed');
        }
    };

    return (
        <div className="max-w-7xl mx-auto space-y-12 pb-24">
            <header className="flex items-center justify-between">
                <div>
                    <h1 className="text-4xl font-black text-white italic uppercase tracking-tighter flex items-center gap-4">
                        <Store className="w-10 h-10 text-rose-500 shadow-[0_0_20px_rgba(244,63,94,0.4)]" />
                        CREATOR STOREFRONT REDISTRY
                    </h1>
                    <p className="text-[10px] font-black text-zinc-600 uppercase tracking-[0.4em] mt-2 ml-14">
                        Platform Governance • Store Operations
                    </p>
                </div>
            </header>

            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                {[
                    { label: 'Total Stores', value: stats.total, color: 'text-white' },
                    { label: 'Active Signals', value: stats.active, color: 'text-emerald-500' },
                    { label: 'Suspended', value: stats.suspended, color: 'text-rose-500' },
                    { label: 'Flagged', value: stats.flagged, color: 'text-amber-500' }
                ].map((s, i) => (
                    <div key={i} className="bg-zinc-900/40 border border-white/5 rounded-[2rem] p-8 backdrop-blur-sm">
                        <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-2">{s.label}</p>
                        <p className={cn("text-3xl font-black italic tracking-tighter", s.color)}>{s.value.toLocaleString()}</p>
                    </div>
                ))}
            </div>

            {/* Filters */}
            <div className="flex items-center gap-6">
                <div className="relative flex-1">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-600" />
                    <Input
                        placeholder="SEARCH CREATOR, USERNAME, OR STORE NAME..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="bg-zinc-900/40 border-white/5 rounded-2xl h-14 pl-12 text-white font-black uppercase text-[10px] tracking-widest placeholder:text-zinc-700"
                    />
                </div>
                <div className="flex gap-3">
                    {['all', 'active', 'suspended', 'flagged'].map((s) => (
                        <Button
                            key={s}
                            variant="ghost"
                            onClick={() => setStatus(s)}
                            className={cn(
                                "h-14 px-6 rounded-2xl text-[10px] font-black uppercase tracking-widest border transition-all",
                                status === s ? "bg-white text-black border-white" : "bg-white/5 text-zinc-500 border-white/5 hover:bg-white/10"
                            )}
                        >
                            {s}
                        </Button>
                    ))}
                </div>
            </div>

            <div className="rounded-[3rem] border border-white/5 bg-zinc-900/40 overflow-hidden backdrop-blur-sm">
                <Table>
                    <TableHeader className="bg-white/[0.02]">
                        <TableRow className="border-white/5">
                            <TableHead className="px-8 py-6 text-[10px] font-black text-zinc-500 uppercase tracking-widest border-b border-white/5">Storefront</TableHead>
                            <TableHead className="px-8 py-6 text-[10px] font-black text-zinc-500 uppercase tracking-widest border-b border-white/5">Creator</TableHead>
                            <TableHead className="px-8 py-6 text-[10px] font-black text-zinc-500 uppercase tracking-widest border-b border-white/5 text-center">Inv (SKU)</TableHead>
                            <TableHead className="px-8 py-6 text-[10px] font-black text-zinc-500 uppercase tracking-widest border-b border-white/5 text-right">Gross GMV</TableHead>
                            <TableHead className="px-8 py-6 text-[10px] font-black text-zinc-500 uppercase tracking-widest border-b border-white/5">Status</TableHead>
                            <TableHead className="px-8 py-6 text-right text-[10px] font-black text-zinc-500 uppercase tracking-widest border-b border-white/5">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {loading ? (
                            <TableRow>
                                <TableCell colSpan={6} className="py-24">
                                    <TableSkeleton rows={5} cols={6} />
                                </TableCell>
                            </TableRow>
                        ) : stores.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={6} className="py-24">
                                    <EmptyState
                                        icon={ShoppingBag}
                                        title="Registry Empty"
                                        description="No creator storefronts match the current query signature."
                                    />
                                </TableCell>
                            </TableRow>
                        ) : (
                            stores.map((store) => (
                                <TableRow key={store._id} className="border-white/5 hover:bg-white/[0.01] transition-colors group">
                                    <TableCell className="px-8 py-8">
                                        <div className="flex items-center gap-4">
                                            <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-zinc-800 to-zinc-900 border border-white/5 flex items-center justify-center text-zinc-600 relative overflow-hidden">
                                                {store.logo ? (
                                                    <Image
                                                        src={store.logo}
                                                        alt={store.storeName}
                                                        fill
                                                        sizes="48px"
                                                        className="object-cover rounded-xl"
                                                    />
                                                ) : (
                                                    <Store size={20} />
                                                )}
                                            </div>
                                            <div className="flex flex-col">
                                                <span className="text-sm font-black text-white italic uppercase tracking-tighter">{store.storeName}</span>
                                                <Link
                                                    href={`https://${store.customDomain || `${store.creatorId?.username}.creatorly.in`}`}
                                                    target="_blank"
                                                    className="text-[10px] font-bold text-indigo-500 hover:text-indigo-400 flex items-center gap-1 mt-1 transition-colors"
                                                >
                                                    {store.customDomain || `${store.creatorId?.username}.creatorly.in`}
                                                    <ExternalLink size={10} />
                                                </Link>
                                            </div>
                                        </div>
                                    </TableCell>
                                    <TableCell className="px-8 py-8">
                                        <div className="flex flex-col">
                                            <span className="font-black text-[11px] text-zinc-300 uppercase italic tracking-tight">{store.creatorId?.displayName}</span>
                                            <span className="text-[9px] font-bold text-zinc-600 tracking-tighter">@{store.creatorId?.username}</span>
                                        </div>
                                    </TableCell>
                                    <TableCell className="px-8 py-8 text-center">
                                        <Badge variant="outline" className="bg-white/5 border-white/10 text-white text-[10px] font-mono px-3 py-1">
                                            {store.productCount || 0}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="px-8 py-8 text-right">
                                        <div className="flex flex-col">
                                            <span className="font-black text-lg text-white tracking-tighter italic">₹{store.revenue?.toLocaleString() || '0'}</span>
                                            <span className="text-[9px] font-bold text-zinc-600 uppercase tracking-widest mt-1">{store.totalOrders || 0} Transactions</span>
                                        </div>
                                    </TableCell>
                                    <TableCell className="px-8 py-8">
                                        <Badge className={cn(
                                            "uppercase text-[9px] font-black tracking-widest px-3 py-1.5 rounded-lg border",
                                            store.isPublished ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" : "bg-zinc-800 text-zinc-500 border-white/5",
                                            store.isFlagged && "bg-amber-500/10 text-amber-500 border-amber-500/20"
                                        )}>
                                            {store.isFlagged ? 'FLAGGED' : (store.isPublished ? 'ACTIVE' : 'DRAFT')}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="px-8 py-8 text-right">
                                        <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-all translate-x-4 group-hover:translate-x-0">
                                            <Button variant="ghost" className="h-10 w-10 p-0 bg-white/5 border border-white/10 hover:bg-white/10 rounded-xl" title="Detailed Analysis">
                                                <Eye size={16} className="text-zinc-400" />
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                onClick={() => handleUpdateStatus(store._id, store.isFlagged ? 'unflag' : 'flag')}
                                                className={cn(
                                                    "h-10 w-10 p-0 border rounded-xl",
                                                    store.isFlagged ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400" : "bg-amber-500/10 border-amber-500/20 text-amber-400"
                                                )}
                                                title={store.isFlagged ? "Remove Flag" : "Flag Signal"}
                                            >
                                                <Flag size={16} />
                                            </Button>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>
        </div>
    );
}
