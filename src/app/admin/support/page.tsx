'use client';

/* eslint-disable react-hooks/exhaustive-deps, react/no-unescaped-entities, @next/next/no-img-element, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars, prefer-const, import/no-anonymous-default-export */

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
    LifeBuoy, MessageSquare, Clock, AlertCircle,
    CheckCircle2, Loader2, Search, User,
    ArrowRight, Send, Eye, ShieldAlert,
    Zap, Activity
} from 'lucide-react';
import { Skeleton, TableSkeleton } from '@/components/ui/skeleton-loaders';
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

export default function AdminSupportPage() {
    const [tickets, setTickets] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [status, setStatus] = useState('all');
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [selectedTicket, setSelectedTicket] = useState<any>(null);
    const [messages, setMessages] = useState<any[]>([]);
    const [reply, setReply] = useState('');
    const [sending, setSending] = useState(false);

    useEffect(() => {
        fetchTickets();
    }, [status, page]);

    const fetchTickets = async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams({
                page: page.toString(),
                limit: '10',
                status
            });
            const res = await fetch(`/api/admin/support?${params}`);
            if (!res.ok) throw new Error('Relay Outage');
            const data = await res.json();
            setTickets(data.tickets);
            setTotalPages(data.pagination.pages);
        } catch (error) {
            toast.error('Failed to query support relay');
        } finally {
            setLoading(false);
        }
    };

    const fetchTicketDetails = async (ticket: any) => {
        setSelectedTicket(ticket);
        setMessages([]);
        try {
            const res = await fetch(`/api/admin/support/${ticket._id}`);
            if (!res.ok) throw new Error('Signal Interrupted');
            const data = await res.json();
            setMessages(data.messages);
        } catch (error) {
            toast.error('Failed to load message stream');
        }
    };

    const handleSendReply = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!reply.trim()) return;
        setSending(true);
        try {
            const res = await fetch(`/api/admin/support/${selectedTicket._id}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ message: reply, status: 'open' }),
            });
            if (res.ok) {
                setReply('');
                fetchTicketDetails(selectedTicket);
                toast.success('Signal Transmitted');
            }
        } catch (error) {
            toast.error('Transmission failure');
        } finally {
            setSending(false);
        }
    };

    const closeTicket = async (id: string) => {
        try {
            const res = await fetch(`/api/admin/support/${id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: 'closed' }),
            });
            if (res.ok) {
                toast.success('Ticket Terminated');
                fetchTickets();
                if (selectedTicket?._id === id) setSelectedTicket(null);
            }
        } catch (error) {
            toast.error('Termination failed');
        }
    };

    return (
        <div className="space-y-12 max-w-[1600px] mx-auto pb-24 animate-in fade-in duration-700">
            <header className="space-y-4">
                <h1 className="text-5xl font-black text-white italic uppercase tracking-tighter flex items-center gap-4">
                    <LifeBuoy className="w-12 h-12 text-indigo-500 shadow-[0_0_30px_rgba(99,102,241,0.4)]" />
                    SUPPORT RELAY
                </h1>
                <p className="text-[10px] font-black text-zinc-600 uppercase tracking-[0.4em] ml-16">
                    Incident Response • Creator Liaison • Comms Protocol
                </p>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
                {/* Ticket List */}
                <div className="lg:col-span-7 space-y-8">
                    <div className="flex items-center gap-4">
                        <Select value={status} onValueChange={setStatus}>
                            <SelectTrigger className="w-[200px] bg-zinc-900/40 border-white/5 text-white font-black uppercase tracking-widest text-[10px] rounded-2xl h-14 focus:ring-indigo-500/20 px-6">
                                <SelectValue placeholder="INCIDENT FILTER" />
                            </SelectTrigger>
                            <SelectContent className="bg-zinc-900 border-white/10 text-white rounded-2xl overflow-hidden">
                                <SelectItem value="all" className="focus:bg-white/5 uppercase text-[9px] font-black h-12 px-6">Full Spectrum</SelectItem>
                                <SelectItem value="open" className="focus:bg-white/5 uppercase text-[9px] font-black h-12 px-6">Active Signals</SelectItem>
                                <SelectItem value="closed" className="focus:bg-white/5 uppercase text-[9px] font-black h-12 px-6">Archived Logs</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    {loading ? (
                        <TableSkeleton rows={10} />
                    ) : tickets.length === 0 ? (
                        <EmptyState
                            icon={CheckCircle2}
                            title="FREQUENCY CLEAR"
                            description="No unresolved incidents detected in the current relay spectrum."
                        />
                    ) : (
                        <div className="bg-zinc-900/40 backdrop-blur-3xl rounded-[3rem] p-10 border border-white/5">
                            <div className="overflow-x-auto rounded-[2rem] border border-white/5">
                                <table className="w-full text-left">
                                    <thead>
                                        <tr className="bg-white/5 text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em] italic">
                                            <th className="py-6 px-10">INCIDENT ID</th>
                                            <th className="py-6 px-10">ORIGIN ENTITY</th>
                                            <th className="py-6 px-10">SUBJECT MATTER</th>
                                            <th className="py-6 px-10 text-right">PROTOCOL</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-white/5">
                                        {tickets.map((t) => (
                                            <tr
                                                key={t._id}
                                                onClick={() => fetchTicketDetails(t)}
                                                className={cn(
                                                    "text-sm cursor-pointer transition-all group",
                                                    selectedTicket?._id === t._id ? "bg-indigo-500/10" : "hover:bg-white/[0.02]"
                                                )}
                                            >
                                                <td className="py-8 px-10">
                                                    <div className="flex flex-col">
                                                        <span className="text-[11px] font-black text-white italic tracking-widest uppercase">{t.ticketId}</span>
                                                        <span className="text-[9px] font-bold text-zinc-600 font-mono mt-1">{new Date(t.createdAt).toLocaleDateString()}</span>
                                                    </div>
                                                </td>
                                                <td className="py-8 px-10">
                                                    <div className="flex flex-col">
                                                        <span className="font-black text-xs text-indigo-400 uppercase tracking-tight italic">{t.userId?.displayName || 'UNKNOWN OBJECT'}</span>
                                                        <span className="text-[9px] font-bold text-zinc-700 tracking-tighter uppercase">{t.userId?.email}</span>
                                                    </div>
                                                </td>
                                                <td className="py-8 px-10">
                                                    <div className="flex flex-col">
                                                        <span className="font-black text-sm text-white uppercase italic tracking-tighter truncate max-w-[200px]">{t.subject}</span>
                                                        <Badge variant="ghost" className={cn(
                                                            "uppercase text-[8px] font-black tracking-widest mt-2 px-2 py-0.5 rounded-md w-fit border",
                                                            t.priority === 'high' ? 'bg-rose-500/10 text-rose-500 border-rose-500/20' : 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20'
                                                        )}>
                                                            {t.priority} PRIORITY
                                                        </Badge>
                                                    </div>
                                                </td>
                                                <td className="py-8 px-10 text-right">
                                                    <Badge className={cn(
                                                        "uppercase text-[9px] font-black tracking-widest px-4 py-1.5 rounded-lg border",
                                                        t.status === 'open' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-zinc-800 text-zinc-500 border-white/5'
                                                    )}>
                                                        {t.status}
                                                    </Badge>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}
                </div>

                {/* Comms Panel */}
                <div className="lg:col-span-5">
                    {selectedTicket ? (
                        <div className="bg-zinc-900/60 backdrop-blur-3xl border border-white/5 rounded-[4rem] h-[800px] flex flex-col overflow-hidden sticky top-24 shadow-4xl animate-in slide-in-from-right-10 duration-700">
                            <div className="p-12 border-b border-white/5 bg-white/[0.02]">
                                <div className="flex items-center justify-between mb-8">
                                    <Badge variant="outline" className="border-indigo-500/30 text-indigo-400 font-black italic text-[9px] px-4 py-1.5 tracking-[0.2em]">{selectedTicket.ticketId}</Badge>
                                    <Button
                                        variant="ghost"
                                        onClick={() => closeTicket(selectedTicket._id)}
                                        className="h-10 px-6 text-[10px] font-black uppercase tracking-widest text-rose-500 hover:bg-rose-500/10 rounded-xl"
                                    >
                                        TERMINATE
                                    </Button>
                                </div>
                                <h2 className="text-3xl font-black text-white italic uppercase tracking-tighter leading-tight mb-4">{selectedTicket.subject}</h2>
                                <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest flex items-center gap-3">
                                    <Activity size={14} className="text-emerald-500" /> SOURCE: {selectedTicket.userId?.email}
                                </p>
                            </div>

                            <div className="flex-1 overflow-y-auto p-12 space-y-10 scrollbar-hide">
                                {messages.map((m) => (
                                    <div key={m._id} className={cn(
                                        "flex flex-col max-w-[85%] space-y-3",
                                        m.senderType === 'admin' ? "ml-auto items-end" : "items-start"
                                    )}>
                                        <div className={cn(
                                            "px-8 py-6 rounded-[2.5rem] text-[13px] leading-relaxed font-bold italic",
                                            m.senderType === 'admin'
                                                ? "bg-indigo-600 text-white rounded-tr-sm shadow-2xl shadow-indigo-600/30"
                                                : "bg-white/5 text-zinc-300 rounded-tl-sm border border-white/5"
                                        )}>
                                            {m.message}
                                        </div>
                                        <span className="text-[9px] font-black text-zinc-700 uppercase tracking-widest px-4">{new Date(m.createdAt).toLocaleTimeString()} • {m.senderType.toUpperCase()} RELAY</span>
                                    </div>
                                ))}
                            </div>

                            <div className="p-10 bg-black/40 border-t border-white/5">
                                <form onSubmit={handleSendReply} className="relative">
                                    <textarea
                                        value={reply}
                                        onChange={(e) => setReply(e.target.value)}
                                        placeholder="INPUT SIGNAL..."
                                        className="w-full bg-zinc-950/50 border border-white/10 rounded-[2.5rem] p-8 pr-24 text-sm text-white placeholder:text-zinc-800 focus:outline-none focus:border-indigo-500/50 min-h-[140px] resize-none font-black italic uppercase tracking-tight"
                                    />
                                    <Button
                                        type="submit"
                                        disabled={sending}
                                        className="absolute right-6 bottom-6 h-14 w-14 rounded-2xl bg-indigo-500 hover:bg-indigo-600 text-white shadow-xl shadow-indigo-500/20"
                                    >
                                        {sending ? <Loader2 className="animate-spin" size={24} /> : <Send size={24} />}
                                    </Button>
                                </form>
                            </div>
                        </div>
                    ) : (
                        <div className="bg-zinc-950/20 border-2 border-dashed border-white/5 rounded-[4rem] h-[800px] flex flex-col items-center justify-center text-center p-20 gap-8">
                            <div className="p-10 bg-indigo-500/5 rounded-full border border-indigo-500/10">
                                <ShieldAlert className="w-20 h-20 text-zinc-800 animate-pulse" />
                            </div>
                            <div className="space-y-4">
                                <p className="text-[10px] font-black text-zinc-600 uppercase tracking-[0.5em] italic">AWAITING SIGNAL SELECTION</p>
                                <p className="text-zinc-700 font-bold text-xs uppercase tracking-widest max-w-xs leading-relaxed">
                                    Select an incident from the relay spectrum to initialize encrypted communications.
                                </p>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
