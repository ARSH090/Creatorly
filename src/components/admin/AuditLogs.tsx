'use client';

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
import {
    FileText,
    Eye,
    Download,
    ChevronDown,
    ChevronUp,
    CheckCircle2,
    XCircle,
    AlertTriangle,
    Clock
} from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { TableSkeleton } from '@/components/ui/skeleton-loaders';
import { EmptyState } from '@/components/ui/empty-state';

interface AuditLog {
    _id: string;
    createdAt: string;
    adminId: {
        displayName: string;
        email: string;
    };
    action: string;
    entityType: string;
    entityId?: string;
    ipAddress?: string;
    userAgent?: string;
    status?: 'success' | 'failure' | 'warning';
    details?: any;
    metadata?: any;
}

interface AuditLogsProps {
    logs: AuditLog[];
    isLoading: boolean;
    onExport: () => void;
}

export function AuditLogs({ logs, isLoading, onExport }: AuditLogsProps) {
    const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());

    const toggleRow = (id: string) => {
        const newExpanded = new Set(expandedRows);
        if (newExpanded.has(id)) newExpanded.delete(id);
        else newExpanded.add(id);
        setExpandedRows(newExpanded);
    };

    const getStatusStyles = (status?: string, action?: string) => {
        const isFailure = status === 'failure' || action?.toLowerCase().includes('fail') || action?.toLowerCase().includes('reject');
        const isWarning = status === 'warning' || action?.toLowerCase().includes('suspend') || action?.toLowerCase().includes('flag');

        if (isFailure) return "bg-rose-500/10 text-rose-500 border-rose-500/20";
        if (isWarning) return "bg-amber-500/10 text-amber-500 border-amber-500/20";
        return "bg-emerald-500/10 text-emerald-500 border-emerald-500/20";
    };

    const getStatusIcon = (status?: string, action?: string) => {
        const isFailure = status === 'failure' || action?.toLowerCase().includes('fail') || action?.toLowerCase().includes('reject');
        const isWarning = status === 'warning' || action?.toLowerCase().includes('suspend') || action?.toLowerCase().includes('flag');

        if (isFailure) return <XCircle size={12} />;
        if (isWarning) return <AlertTriangle size={12} />;
        return <CheckCircle2 size={12} />;
    };

    if (isLoading) return <TableSkeleton rows={10} cols={5} />;

    if (logs.length === 0) {
        return (
            <EmptyState
                icon={FileText}
                title="Silence in the Archive"
                description="No audit signals have been recorded for the selected frequency."
            />
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex justify-end">
                <Button
                    variant="outline"
                    size="sm"
                    onClick={onExport}
                    className="bg-zinc-900 border-white/5 text-white font-black uppercase tracking-widest text-[10px] rounded-xl h-10 px-4 gap-2 hover:bg-white/5"
                >
                    <Download size={14} />
                    Export Ledger (CSV)
                </Button>
            </div>

            <div className="rounded-[2.5rem] border border-white/5 bg-zinc-900/40 overflow-hidden backdrop-blur-sm">
                <Table>
                    <TableHeader className="bg-white/[0.02]">
                        <TableRow className="border-white/5 hover:bg-transparent">
                            <TableHead className="w-10 border-b border-white/5"></TableHead>
                            <TableHead className="px-6 py-5 text-[10px] font-black text-zinc-500 uppercase tracking-widest border-b border-white/5">Timestamp</TableHead>
                            <TableHead className="px-6 py-5 text-[10px] font-black text-zinc-500 uppercase tracking-widest border-b border-white/5">Operator</TableHead>
                            <TableHead className="px-6 py-5 text-[10px] font-black text-zinc-500 uppercase tracking-widest border-b border-white/5">Action</TableHead>
                            <TableHead className="px-6 py-5 text-[10px] font-black text-zinc-500 uppercase tracking-widest border-b border-white/5">Entity</TableHead>
                            <TableHead className="px-6 py-5 text-[10px] font-black text-zinc-500 uppercase tracking-widest border-b border-white/5">Status</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {logs.map((log) => (
                            <React.Fragment key={log._id}>
                                <TableRow
                                    className={cn(
                                        "border-white/5 transition-colors cursor-pointer",
                                        expandedRows.has(log._id) ? "bg-white/[0.03]" : "hover:bg-white/[0.01]"
                                    )}
                                    onClick={() => toggleRow(log._id)}
                                >
                                    <TableCell className="px-4 py-5">
                                        {expandedRows.has(log._id) ? <ChevronUp size={14} className="text-zinc-600" /> : <ChevronDown size={14} className="text-zinc-600" />}
                                    </TableCell>
                                    <TableCell className="px-6 py-5">
                                        <div className="flex flex-col">
                                            <span className="text-[10px] font-black text-white italic tracking-tight uppercase">
                                                {format(new Date(log.createdAt), 'MMM d, HH:mm:ss')}
                                            </span>
                                            <span className="text-[9px] font-bold text-zinc-600 font-mono mt-0.5 flex items-center gap-1">
                                                <Clock size={8} /> {log.ipAddress || '0.0.0.0'}
                                            </span>
                                        </div>
                                    </TableCell>
                                    <TableCell className="px-6 py-5">
                                        <div className="flex flex-col">
                                            <span className="font-black text-[11px] text-zinc-300 uppercase italic tracking-tight">
                                                {log.adminId?.displayName || 'SYSTEM'}
                                            </span>
                                            <span className="text-[9px] font-bold text-zinc-600 tracking-tighter">
                                                {log.adminId?.email || 'automated@creatorly.in'}
                                            </span>
                                        </div>
                                    </TableCell>
                                    <TableCell className="px-6 py-5">
                                        <span className="font-black text-xs text-white uppercase italic tracking-tighter">
                                            {log.action.replace(/_/g, ' ')}
                                        </span>
                                    </TableCell>
                                    <TableCell className="px-6 py-5">
                                        <Badge variant="outline" className="bg-white/5 border-white/10 text-zinc-400 text-[9px] font-black uppercase px-2 py-0.5 rounded-md">
                                            {log.entityType}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="px-6 py-5">
                                        <div className={cn(
                                            "flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-[9px] font-black uppercase tracking-widest w-fit",
                                            getStatusStyles(log.status, log.action)
                                        )}>
                                            {getStatusIcon(log.status, log.action)}
                                            {log.status || (log.action.toLowerCase().includes('fail') ? 'Failure' : 'Success')}
                                        </div>
                                    </TableCell>
                                </TableRow>

                                {expandedRows.has(log._id) && (
                                    <TableRow className="border-white/5 bg-black/40 hover:bg-black/40">
                                        <TableCell colSpan={6} className="px-12 py-8">
                                            <div className="space-y-4">
                                                <div className="flex items-center justify-between">
                                                    <h4 className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.3em]">Metadata Stream</h4>
                                                    <span className="text-[9px] font-mono text-zinc-700">ID: {log._id}</span>
                                                </div>
                                                <pre className="bg-zinc-900 border border-white/5 rounded-2xl p-6 overflow-auto max-h-60 text-[11px] font-mono text-indigo-300 leading-relaxed shadow-inner">
                                                    {JSON.stringify(log.details || log.metadata || {}, null, 2)}
                                                </pre>
                                                <div className="flex items-center gap-4 text-[9px] font-bold text-zinc-600 uppercase tracking-widest pt-2">
                                                    <span>User Agent: {log.userAgent || 'Unknown'}</span>
                                                    {log.entityId && <span>Entity ID: {log.entityId}</span>}
                                                </div>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                )}
                            </React.Fragment>
                        ))}
                    </TableBody>
                </Table>
            </div>
        </div>
    );
}

import React from 'react';
