'use client';

import React, { useState, useEffect } from 'react';
import {
    Plus,
    Globe,
    CheckCircle2,
    XCircle,
    Clock,
    Shield,
    MoreVertical,
    Trash2,
    Play,
    ExternalLink,
    AlertCircle,
    Activity
} from 'lucide-react';
import { toast } from 'react-hot-toast';

export default function WebhookManager() {
    const [endpoints, setEndpoints] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [showAddForm, setShowAddForm] = useState(false);
    const [deliveries, setDeliveries] = useState<any[]>([]);
    const [selectedEndpoint, setSelectedEndpoint] = useState<any>(null);
    const [showLogs, setShowLogs] = useState(false);

    // Form state
    const [newUrl, setNewUrl] = useState('');
    const [selectedEvents, setSelectedEvents] = useState<string[]>([]);

    const availableEvents = [
        'purchase.completed',
        'refund.issued',
        'subscription.created',
        'subscription.cancelled',
        'lead.captured'
    ];

    useEffect(() => {
        fetchEndpoints();
    }, []);

    const fetchEndpoints = async () => {
        try {
            const res = await fetch('/api/v1/webhooks');
            const data = await res.json();
            if (data.endpoints) setEndpoints(data.endpoints);
        } catch (err) {
            toast.error('Failed to load webhook endpoints');
        } finally {
            setLoading(false);
        }
    };

    const handleCreate = async () => {
        if (!newUrl || selectedEvents.length === 0) {
            toast.error('URL and at least one event are required');
            return;
        }
        try {
            const res = await fetch('/api/v1/webhooks', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ url: newUrl, events: selectedEvents })
            });
            if (res.ok) {
                toast.success('Webhook endpoint created');
                fetchEndpoints();
                setShowAddForm(false);
                setNewUrl('');
                setSelectedEvents([]);
            }
        } catch (err) {
            toast.error('Failed to create webhook');
        }
    };

    const toggleEvent = (event: string) => {
        setSelectedEvents(prev =>
            prev.includes(event) ? prev.filter(e => e !== event) : [...prev, event]
        );
    };

    const fetchLogs = async (endpoint: any) => {
        setSelectedEndpoint(endpoint);
        setShowLogs(true);
        try {
            const res = await fetch(`/api/v1/webhooks/${endpoint._id}/deliveries`);
            const data = await res.json();
            if (data.deliveries) setDeliveries(data.deliveries);
        } catch (err) {
            toast.error('Failed to load delivery logs');
        }
    };

    const runTest = async (endpointId: string) => {
        const toastId = toast.loading('Sending test ping...');
        try {
            const res = await fetch(`/api/v1/webhooks/${endpointId}/test`, { method: 'POST' });
            const data = await res.json();
            if (data.success) {
                toast.success('Test successful - status ' + data.statusCode, { id: toastId });
            } else {
                toast.error('Test failed: ' + (data.error || 'Connection error'), { id: toastId });
            }
            fetchEndpoints();
        } catch (err) {
            toast.error('Failed to run test', { id: toastId });
        }
    };

    if (loading) return <div className="animate-pulse space-y-4 pt-10 px-4">
        {[1, 2, 3].map(i => <div key={i} className="h-24 bg-white/5 rounded-2xl" />)}
    </div>;

    return (
        <div className="space-y-8 max-w-6xl mx-auto py-8 px-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-3xl font-black uppercase tracking-tighter italic text-white flex items-center gap-3">
                        <Globe className="text-indigo-500" /> Webhook Integrations
                    </h2>
                    <p className="text-zinc-500 text-sm italic font-medium">Connect Creatorly to Zapier, Make, or your custom backends.</p>
                </div>
                <button
                    onClick={() => setShowAddForm(true)}
                    className="bg-indigo-500 hover:bg-indigo-600 text-white px-6 py-3 rounded-full font-black text-xs uppercase tracking-widest flex items-center gap-2 transition-all active:scale-95"
                >
                    <Plus size={16} /> Add Endpoint
                </button>
            </div>

            {/* List View */}
            <div className="grid gap-4">
                {endpoints.length === 0 ? (
                    <div className="border-2 border-dashed border-white/10 rounded-3xl p-12 text-center space-y-4 bg-white/[0.01]">
                        <Activity className="w-16 h-16 text-zinc-800 mx-auto" />
                        <div className="space-y-2">
                            <h4 className="text-white font-black uppercase tracking-tighter text-xl">No Webhooks Registered</h4>
                            <p className="text-zinc-600 text-sm max-w-xs mx-auto italic">Automate your workflows by sending real-time data to external apps.</p>
                        </div>
                    </div>
                ) : (
                    endpoints.map((ep) => (
                        <div key={ep._id} className="bg-white/[0.03] border border-white/10 rounded-3xl p-6 transition-all hover:bg-white/[0.05] group">
                            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                                <div className="space-y-3 flex-1">
                                    <div className="flex items-center gap-3">
                                        <div className={`w-3 h-3 rounded-full ${ep.isActive ? 'bg-green-500' : 'bg-zinc-700'}`} />
                                        <code className="text-indigo-400 font-mono text-sm break-all">{ep.url}</code>
                                    </div>
                                    <div className="flex flex-wrap gap-2">
                                        {ep.events.map((ev: string) => (
                                            <span key={ev} className="bg-white/5 text-zinc-500 px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-widest border border-white/5">
                                                {ev.split('.')[1] || ev}
                                            </span>
                                        ))}
                                    </div>
                                </div>

                                <div className="flex items-center gap-8 text-sm">
                                    <div className="space-y-1">
                                        <span className="text-zinc-600 text-[10px] uppercase font-black tracking-widest block">Status</span>
                                        <div className="flex items-center gap-2">
                                            {ep.lastStatusCode ? (
                                                ep.lastStatusCode >= 200 && ep.lastStatusCode < 300 ? (
                                                    <CheckCircle2 size={14} className="text-green-500" />
                                                ) : (
                                                    <XCircle size={14} className="text-red-500" />
                                                )
                                            ) : (
                                                <Clock size={14} className="text-zinc-700" />
                                            )}
                                            <span className="text-white font-mono">{ep.lastStatusCode || '---'}</span>
                                        </div>
                                    </div>

                                    <div className="space-y-1">
                                        <span className="text-zinc-600 text-[10px] uppercase font-black tracking-widest block">Last Delivery</span>
                                        <span className="text-zinc-400 block tabular-nums">
                                            {ep.lastDeliveryAt ? new Date(ep.lastDeliveryAt).toLocaleTimeString() : 'Never'}
                                        </span>
                                    </div>

                                    <div className="flex items-center gap-2">
                                        <button
                                            onClick={() => runTest(ep._id)}
                                            className="p-2.5 hover:bg-white/5 rounded-xl text-zinc-500 hover:text-white transition-all"
                                            title="Send Test Ping"
                                        >
                                            <Play size={18} />
                                        </button>
                                        <button
                                            onClick={() => fetchLogs(ep)}
                                            className="p-2.5 hover:bg-white/5 rounded-xl text-zinc-500 hover:text-white transition-all"
                                            title="View Logs"
                                        >
                                            <ExternalLink size={18} />
                                        </button>
                                        <button className="p-2.5 hover:bg-red-500/10 rounded-xl text-zinc-800 hover:text-red-500 transition-all">
                                            <Trash2 size={18} />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* Add Form Modal */}
            {showAddForm && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowAddForm(false)} />
                    <div className="relative bg-zinc-900 border border-white/10 rounded-[40px] w-full max-w-xl p-10 overflow-hidden shadow-2xl">
                        <div className="space-y-8">
                            <div className="flex items-center justify-between">
                                <h3 className="text-2xl font-black uppercase tracking-tighter italic text-white underline decoration-indigo-500 decoration-4 underline-offset-8">New Endpoint</h3>
                                <button onClick={() => setShowAddForm(false)} className="text-zinc-600 hover:text-white"><XCircle /></button>
                            </div>

                            <div className="space-y-6">
                                <div className="space-y-2">
                                    <label className="text-[10px] uppercase font-black tracking-widest text-zinc-500 ml-4">Target URL</label>
                                    <input
                                        type="url"
                                        placeholder="https://hooks.zapier.com/..."
                                        className="w-full bg-black/50 border border-white/10 rounded-2xl px-6 py-4 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                                        value={newUrl}
                                        onChange={(e) => setNewUrl(e.target.value)}
                                    />
                                </div>

                                <div className="space-y-3">
                                    <label className="text-[10px] uppercase font-black tracking-widest text-zinc-500 ml-4">Events to Subscribe</label>
                                    <div className="grid grid-cols-1 gap-2">
                                        {availableEvents.map(event => (
                                            <button
                                                key={event}
                                                onClick={() => toggleEvent(event)}
                                                className={`flex items-center justify-between px-6 py-3 rounded-2xl border transition-all ${selectedEvents.includes(event)
                                                        ? 'bg-indigo-500/10 border-indigo-500/50 text-indigo-400'
                                                        : 'bg-black/20 border-white/5 text-zinc-600 hover:border-white/10'
                                                    }`}
                                            >
                                                <span className="text-xs font-black uppercase tracking-widest">{event}</span>
                                                {selectedEvents.includes(event) && <CheckCircle2 size={14} />}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div className="bg-amber-400/5 border border-amber-400/20 rounded-2xl p-4 flex gap-3 italic">
                                    <Shield className="text-amber-400 shrink-0" size={20} />
                                    <p className="text-amber-400/70 text-xs font-medium">Signing secrets are automatically generated to verify origins.</p>
                                </div>
                            </div>

                            <button
                                onClick={handleCreate}
                                className="w-full bg-indigo-500 hover:bg-indigo-600 text-white py-5 rounded-3xl font-black text-sm uppercase tracking-widest shadow-xl shadow-indigo-500/20"
                            >
                                Register Webhook
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Logs Modal */}
            {showLogs && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowLogs(false)} />
                    <div className="relative bg-[#080808] border border-white/10 rounded-[40px] w-full max-w-4xl max-h-[80vh] flex flex-col overflow-hidden shadow-2xl">
                        <div className="p-8 border-b border-white/5 flex items-center justify-between">
                            <div className="space-y-1">
                                <h3 className="text-2xl font-black uppercase tracking-tighter italic text-white flex items-center gap-3">
                                    <Activity size={24} className="text-indigo-500" /> Delivery Logs
                                </h3>
                                <p className="text-zinc-600 font-mono text-xs">{selectedEndpoint?.url}</p>
                            </div>
                            <button onClick={() => setShowLogs(false)} className="text-zinc-600 hover:text-white"><XCircle /></button>
                        </div>

                        <div className="flex-1 overflow-y-auto p-8">
                            <table className="w-full text-left">
                                <thead className="text-[10px] uppercase font-black tracking-widest text-zinc-700">
                                    <tr>
                                        <th className="pb-4">Status</th>
                                        <th className="pb-4">Event</th>
                                        <th className="pb-4">Time</th>
                                        <th className="pb-4">Runtime</th>
                                        <th className="pb-4 text-right">Action</th>
                                    </tr>
                                </thead>
                                <tbody className="text-sm border-t border-white/5">
                                    {deliveries.map(log => (
                                        <tr key={log._id} className="border-b border-zinc-900 group">
                                            <td className="py-4">
                                                <div className="flex items-center gap-2">
                                                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${log.responseCode >= 200 && log.responseCode < 300
                                                            ? 'bg-green-500/10 text-green-500'
                                                            : 'bg-red-500/10 text-red-500'
                                                        }`}>
                                                        {log.responseCode || 'ERR'}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="py-4 font-black uppercase tracking-tighter text-white italic">
                                                {log.eventType}
                                            </td>
                                            <td className="py-4 text-zinc-500 tabular-nums">
                                                {new Date(log.createdAt).toLocaleString()}
                                            </td>
                                            <td className="py-4 text-zinc-600 text-xs">
                                                {log.attemptCount > 1 ? `${log.attemptCount} ATTEMPTS` : 'INSTANT'}
                                            </td>
                                            <td className="py-4 text-right">
                                                <button className="text-indigo-500 hover:underline text-xs font-black uppercase tracking-widest p-2">
                                                    Resend
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                    {deliveries.length === 0 && (
                                        <tr>
                                            <td colSpan={5} className="py-12 text-center text-zinc-700 italic font-medium">
                                                No activity recorded for this endpoint yet.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
