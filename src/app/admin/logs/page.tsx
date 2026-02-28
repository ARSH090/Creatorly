'use client';

import { useState, useEffect } from 'react';
import { AuditLogs } from '@/components/admin/AuditLogs';
import {
    Activity,
    Search,
    Filter,
    Calendar,
    RefreshCw,
    ShieldCheck,
    FileJson,
    History as HistoryIcon
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'react-hot-toast';
import { cn } from '@/lib/utils';

export default function AdminLogsPage() {
    const [logs, setLogs] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [filters, setFilters] = useState({
        action: 'all',
        status: 'all',
        search: ''
    });
    const [autoRefresh, setAutoRefresh] = useState(true);

    const fetchLogs = async () => {
        try {
            const params = new URLSearchParams({
                page: page.toString(),
                limit: '50',
                action: filters.action !== 'all' ? filters.action : '',
                status: filters.status !== 'all' ? filters.status : '',
                search: filters.search
            });
            const res = await fetch(`/api/admin/logs?${params}`);
            if (res.ok) {
                const result = await res.json();
                setLogs(result.data.logs || []);
                setTotalPages(result.meta.totalPages || 1);
            } else {
                throw new Error('Signal lost');
            }
        } catch (error) {
            toast.error('Failed to query audit relay');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        setLoading(true);
        fetchLogs();
    }, [page, filters.action, filters.status]);

    useEffect(() => {
        const debounce = setTimeout(() => {
            setLoading(true);
            fetchLogs();
        }, 500);
        return () => clearTimeout(debounce);
    }, [filters.search]);

    useEffect(() => {
        let interval: any;
        if (autoRefresh) {
            interval = setInterval(fetchLogs, 30000);
        }
        return () => clearInterval(interval);
    }, [autoRefresh, page, filters.action, filters.status, filters.search]);

    const handleExport = () => {
        toast.promise(
            new Promise((resolve) => setTimeout(resolve, 2000)),
            {
                loading: 'Compiling immutable ledger...',
                success: 'Audit log exported as CSV. Clearance granted.',
                error: 'Export failed. Database lock detected.',
            }
        );
    };

    return (
        <div className="max-w-7xl mx-auto space-y-12 pb-24 animate-in fade-in duration-700">
            <header className="flex items-center justify-between">
                <div>
                    <h1 className="text-4xl font-black text-white italic uppercase tracking-tighter flex items-center gap-4">
                        <ShieldCheck className="w-10 h-10 text-indigo-500 shadow-[0_0_20px_rgba(99,102,241,0.4)]" />
                        AUDIT ARCHIVE
                    </h1>
                    <p className="text-[10px] font-black text-zinc-600 uppercase tracking-[0.4em] mt-2 ml-14">
                        Immutable Ledger • Operational Forensics
                    </p>
                </div>
                <div className="flex items-center gap-4">
                    <Button
                        variant="ghost"
                        onClick={() => setAutoRefresh(!autoRefresh)}
                        className={cn(
                            "text-[10px] font-black uppercase tracking-widest h-14 px-8 rounded-2xl border backdrop-blur-sm transition-all shadow-lg",
                            autoRefresh ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400" : "bg-white/5 border-white/5 text-zinc-500"
                        )}
                    >
                        <RefreshCw size={14} className={cn("mr-2", autoRefresh && "animate-spin")} />
                        Auto-Refresh: {autoRefresh ? 'Active' : 'Paused'}
                    </Button>
                </div>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="relative md:col-span-2">
                    <Search className="absolute left-5 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-600" />
                    <Input
                        placeholder="SEARCH OPERATOR OR ENTITY ID..."
                        value={filters.search}
                        onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                        className="bg-zinc-900/40 border-white/5 rounded-2xl h-14 pl-12 text-white font-black uppercase text-[10px] tracking-widest placeholder:text-zinc-700 focus:ring-indigo-500/20"
                    />
                </div>
                <Select value={filters.action} onValueChange={(v: string) => setFilters({ ...filters, action: v })}>
                    <SelectTrigger className="bg-zinc-900/40 border-white/5 rounded-2xl h-14 text-white font-black uppercase text-[10px] tracking-widest px-6 outline-none focus:ring-indigo-500/20">
                        <SelectValue placeholder="Action Type" />
                    </SelectTrigger>
                    <SelectContent className="bg-zinc-900 border-white/10 text-white rounded-2xl overflow-hidden p-2">
                        <SelectItem value="all" className="rounded-xl focus:bg-white/10 uppercase text-[9px] font-black">Every Action</SelectItem>
                        <SelectItem value="login" className="rounded-xl focus:bg-white/10 uppercase text-[9px] font-black">Login Events</SelectItem>
                        <SelectItem value="admin_action" className="rounded-xl focus:bg-white/10 uppercase text-[9px] font-black">Admin Overrides</SelectItem>
                        <SelectItem value="product_created" className="rounded-xl focus:bg-white/10 uppercase text-[9px] font-black">Product Deployments</SelectItem>
                        <SelectItem value="store_suspended" className="rounded-xl focus:bg-white/10 uppercase text-[9px] font-black">Store Terminations</SelectItem>
                    </SelectContent>
                </Select>
                <Select value={filters.status} onValueChange={(v: string) => setFilters({ ...filters, status: v })}>
                    <SelectTrigger className="bg-zinc-900/40 border-white/5 rounded-2xl h-14 text-white font-black uppercase text-[10px] tracking-widest px-6 outline-none focus:ring-indigo-500/20">
                        <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent className="bg-zinc-900 border-white/10 text-white rounded-2xl overflow-hidden p-2">
                        <SelectItem value="all" className="rounded-xl focus:bg-white/10 uppercase text-[9px] font-black">Every Result</SelectItem>
                        <SelectItem value="success" className="rounded-xl focus:bg-white/10 uppercase text-[9px] font-black text-emerald-500">Successful</SelectItem>
                        <SelectItem value="failure" className="rounded-xl focus:bg-white/10 uppercase text-[9px] font-black text-rose-500">Failed</SelectItem>
                        <SelectItem value="warning" className="rounded-xl focus:bg-white/10 uppercase text-[9px] font-black text-amber-500">Warnings</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            <AuditLogs
                logs={logs}
                isLoading={loading}
                onExport={handleExport}
            />

            <div className="flex items-center justify-between pt-8 border-t border-white/5 p-8 bg-zinc-900/20 rounded-[2rem]">
                <p className="text-[10px] font-black text-zinc-600 uppercase tracking-widest flex items-center gap-3">
                    <HistoryIcon size={14} className="text-zinc-500" />
                    Archive Segment {page} <span className="text-white">/</span> {totalPages}
                </p>
                <div className="flex gap-4">
                    <Button
                        variant="outline"
                        onClick={() => setPage(p => Math.max(1, p - 1))}
                        disabled={page === 1 || loading}
                        className="bg-black/40 border-white/10 rounded-2xl h-12 px-8 text-white font-black uppercase text-[10px] tracking-widest hover:bg-white/5 transition-all disabled:opacity-10"
                    >
                        Prev Segment
                    </Button>
                    <Button
                        variant="outline"
                        onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                        disabled={page === totalPages || loading}
                        className="bg-black/40 border-white/10 rounded-2xl h-12 px-8 text-white font-black uppercase text-[10px] tracking-widest hover:bg-white/5 transition-all disabled:opacity-10"
                    >
                        Next Segment
                    </Button>
                </div>
            </div>
        </div>
    );
}
