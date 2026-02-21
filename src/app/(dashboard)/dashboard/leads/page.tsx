'use client';

import { useState, useEffect } from 'react';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import {
    Users, Search, Download, Filter,
    MoreHorizontal, Mail, Phone, Calendar,
    Zap, Loader2, ArrowUpDown
} from 'lucide-react';
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
import { Badge } from '@/components/ui/badge';
import { toast } from 'react-hot-toast';

export default function LeadsPage() {
    const [leads, setLeads] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [exporting, setExporting] = useState(false);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [search, setSearch] = useState('');

    const fetchLeads = async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams({
                page: page.toString(),
                limit: '10',
                search
            });
            const res = await fetch(`/api/creator/leads?${params}`);
            if (res.ok) {
                const data = await res.json();
                setLeads(data.leads || []);
                setTotalPages(data.pagination?.pages || 1);
            }
        } catch (error) {
            console.error('Failed to fetch leads', error);
            toast.error('Failed to load leads');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        const debounce = setTimeout(fetchLeads, 500);
        return () => clearTimeout(debounce);
    }, [page, search]);

    const handleExport = async () => {
        setExporting(true);
        try {
            const res = await fetch('/api/creator/leads/export');
            if (!res.ok) throw new Error('Export failed');

            const blob = await res.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `leads_export_${new Date().toISOString().split('T')[0]}.csv`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            toast.success('Leads exported successfully');
        } catch (error) {
            console.error(error);
            toast.error('Failed to export leads');
        } finally {
            setExporting(false);
        }
    };

    return (
        <DashboardLayout>
            <div className="space-y-8 max-w-7xl mx-auto">
                {/* Header Section */}
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                    <div className="space-y-2">
                        <div className="flex items-center gap-3">
                            <div className="p-3 bg-indigo-500/10 rounded-2xl">
                                <Users className="w-6 h-6 text-indigo-400" />
                            </div>
                            <h1 className="text-3xl font-black text-white tracking-tight italic uppercase">Neural Terminal</h1>
                        </div>
                        <p className="text-[10px] font-black text-zinc-600 uppercase tracking-[0.3em] ml-1">Autonomous Lead Capture • Real-time Protocol Synchronization</p>
                    </div>

                    <div className="flex items-center gap-3">
                        <Button
                            onClick={handleExport}
                            disabled={exporting || leads.length === 0}
                            className="bg-white/5 hover:bg-white/10 text-white font-black text-[10px] uppercase tracking-widest rounded-xl border border-white/5 h-12 px-6 flex items-center gap-2 group transition-all"
                        >
                            {exporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4 text-indigo-400 group-hover:scale-110 transition-transform" />}
                            Export Data
                        </Button>
                    </div>
                </div>

                {/* Filters & Search */}
                <div className="bg-[#0A0A0A] border border-white/5 rounded-[2rem] p-4 flex flex-col md:flex-row gap-4 items-center">
                    <div className="relative flex-1 w-full">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-600" />
                        <Input
                            placeholder="Search by name, email, or protocol..."
                            className="bg-transparent border-none focus-visible:ring-1 focus-visible:ring-indigo-500/50 pl-12 h-12 text-sm text-white placeholder-zinc-600 rounded-xl"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>
                    <Button variant="ghost" className="h-12 px-6 text-zinc-500 hover:text-white hover:bg-white/5 rounded-xl uppercase font-black text-[10px] tracking-widest gap-2">
                        <Filter className="w-3.5 h-3.5" />
                        Detailed Filters
                    </Button>
                </div>

                {/* Table Section */}
                <div className="rounded-[2.5rem] border border-white/5 bg-zinc-900/40 overflow-hidden shadow-2xl backdrop-blur-sm">
                    <Table>
                        <TableHeader className="bg-white/[0.02]">
                            <TableRow className="border-white/5 hover:bg-transparent">
                                <TableHead className="px-8 py-6 text-[10px] font-black text-zinc-500 uppercase tracking-widest border-b border-white/5">Identity</TableHead>
                                <TableHead className="px-8 py-6 text-[10px] font-black text-zinc-500 uppercase tracking-widest border-b border-white/5">Communication</TableHead>
                                <TableHead className="px-8 py-6 text-[10px] font-black text-zinc-500 uppercase tracking-widest border-b border-white/5">Protocol</TableHead>
                                <TableHead className="px-8 py-6 text-[10px] font-black text-zinc-500 uppercase tracking-widest border-b border-white/5">Status</TableHead>
                                <TableHead className="px-8 py-6 text-right text-[10px] font-black text-zinc-500 uppercase tracking-widest border-b border-white/5">Time Captured</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {loading ? (
                                Array.from({ length: 5 }).map((_, i) => (
                                    <TableRow key={i} className="border-white/5 animate-pulse">
                                        <TableCell colSpan={5} className="h-20 px-8">
                                            <div className="h-4 bg-white/5 rounded-full w-full" />
                                        </TableCell>
                                    </TableRow>
                                ))
                            ) : leads.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={5} className="h-64 text-center border-white/5">
                                        <div className="flex flex-col items-center gap-4 py-12">
                                            <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center border border-white/5">
                                                <Zap className="w-6 h-6 text-zinc-700" />
                                            </div>
                                            <div className="space-y-1">
                                                <p className="text-sm font-black text-white uppercase tracking-widest">No Protocols Detected</p>
                                                <p className="text-[10px] text-zinc-600 font-medium max-w-xs mx-auto">Share your storefront link to start capturing leads through the Neural Engine.</p>
                                            </div>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ) : (
                                leads.map((lead) => (
                                    <TableRow key={lead._id} className="border-white/5 hover:bg-white/[0.02] transition-colors group">
                                        <TableCell className="px-8 py-6">
                                            <div className="flex flex-col">
                                                <span className="font-black text-sm text-white tracking-tight uppercase italic group-hover:text-indigo-400 transition-colors uppercase">{lead.name || 'Anonymous Entity'}</span>
                                                <span className="text-[10px] font-bold text-zinc-600 uppercase tracking-tighter mt-0.5">{lead.email}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell className="px-8 py-6">
                                            <div className="flex flex-col gap-1">
                                                <div className="flex items-center gap-2 text-zinc-400">
                                                    <Mail className="w-3 h-3 text-indigo-500/50" />
                                                    <span className="text-xs font-medium">{lead.email}</span>
                                                </div>
                                                {lead.phone && (
                                                    <div className="flex items-center gap-2 text-zinc-400">
                                                        <Phone className="w-3 h-3 text-emerald-500/50" />
                                                        <span className="text-xs font-medium">{lead.phone}</span>
                                                    </div>
                                                )}
                                            </div>
                                        </TableCell>
                                        <TableCell className="px-8 py-6">
                                            <Badge variant="outline" className="bg-indigo-500/5 text-indigo-400 border-indigo-500/10 uppercase text-[9px] font-black tracking-widest px-3 py-1">
                                                {lead.interest || 'Unknown Protocol'}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="px-8 py-6">
                                            <div className="flex items-center gap-2">
                                                <div className={`w-1.5 h-1.5 rounded-full ${lead.dmStatus === 'sent' ? 'bg-emerald-500' : 'bg-amber-500'}`} />
                                                <span className="text-[10px] font-black uppercase tracking-widest text-zinc-400">
                                                    {lead.dmStatus === 'sent' ? 'Protocol Delivered' : 'DM Pending'}
                                                </span>
                                            </div>
                                        </TableCell>
                                        <TableCell className="px-8 py-6 text-right">
                                            <div className="flex flex-col items-end">
                                                <span className="text-xs font-bold text-white uppercase italic">
                                                    {new Date(lead.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                                                </span>
                                                <span className="text-[10px] font-black text-zinc-700 uppercase tracking-tighter mt-0.5">
                                                    {new Date(lead.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                </span>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </div>

                {/* Pagination */}
                <div className="flex items-center justify-between pb-10">
                    <p className="text-[10px] font-black text-zinc-600 uppercase tracking-widest">
                        Neural Log Page {page} of {totalPages}
                    </p>
                    <div className="flex items-center gap-2">
                        <Button
                            variant="outline"
                            size="sm"
                            className="bg-zinc-900 border-white/5 text-white font-black text-[10px] uppercase tracking-widest rounded-xl hover:bg-white/5 h-10 px-4 disabled:opacity-20"
                            onClick={() => setPage(p => Math.max(1, p - 1))}
                            disabled={page === 1 || loading}
                        >
                            Previous Log
                        </Button>
                        <Button
                            variant="outline"
                            size="sm"
                            className="bg-zinc-900 border-white/5 text-white font-black text-[10px] uppercase tracking-widest rounded-xl hover:bg-white/5 h-10 px-4 disabled:opacity-20"
                            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                            disabled={page === totalPages || loading}
                        >
                            Next Entry
                        </Button>
                    </div>
                </div>
            </div>
        </DashboardLayout>
    );
}
