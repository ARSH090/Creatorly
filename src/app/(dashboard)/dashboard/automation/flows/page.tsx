'use client';

import { useState, useEffect } from 'react';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import { FlowBuilder } from '@/components/dashboard/FlowBuilder';
import { Plus, Zap, Trash2, Edit, ToggleLeft, ToggleRight, Loader2 } from 'lucide-react';
import { toast } from 'react-hot-toast';

export default function AutomationFlowsPage() {
    const [flows, setFlows] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [editingFlow, setEditingFlow] = useState<any | null>(null);
    const [creating, setCreating] = useState(false);

    const fetchFlows = async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/autodm/flows');
            const json = await res.json();
            if (res.ok) setFlows(json.flows ?? []);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchFlows(); }, []);

    const deleteFlow = async (id: string) => {
        if (!confirm('Delete this flow?')) return;
        try {
            await fetch(`/api/autodm/flows/${id}`, { method: 'DELETE' });
            toast.success('Flow deleted');
            fetchFlows();
        } catch {
            toast.error('Failed to delete');
        }
    };

    const toggleActive = async (flow: any) => {
        try {
            await fetch(`/api/autodm/flows/${flow._id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ isActive: !flow.isActive }),
            });
            fetchFlows();
        } catch {
            toast.error('Failed to update');
        }
    };

    if (editingFlow || creating) {
        return (
            <DashboardLayout>
                <div className="p-4 md:p-8">
                    <div className="flex items-center gap-4 mb-6">
                        <button
                            onClick={() => { setEditingFlow(null); setCreating(false); fetchFlows(); }}
                            className="text-sm text-zinc-500 hover:text-white transition-colors"
                        >
                            ← Back to flows
                        </button>
                        <h1 className="text-2xl font-black text-white">
                            {creating ? 'Create New Flow' : `Edit: ${editingFlow?.name}`}
                        </h1>
                    </div>
                    <FlowBuilder
                        flowId={editingFlow?._id}
                        initialFlow={editingFlow ?? undefined}
                    />
                </div>
            </DashboardLayout>
        );
    }

    return (
        <DashboardLayout>
            <div className="p-4 md:p-8 space-y-8">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-black text-white">DM Flows</h1>
                        <p className="text-zinc-500 text-sm mt-1">Multi-step Instagram automation flows — like ManyChat, built in.</p>
                    </div>
                    <button
                        onClick={() => setCreating(true)}
                        className="flex items-center gap-2 bg-indigo-500 hover:bg-indigo-600 text-white text-sm font-black px-4 py-2.5 rounded-xl transition-colors"
                    >
                        <Plus size={15} /> New Flow
                    </button>
                </div>

                {/* Flows List */}
                {loading ? (
                    <div className="flex justify-center py-16">
                        <Loader2 className="h-8 w-8 animate-spin text-zinc-600" />
                    </div>
                ) : flows.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 rounded-2xl border-2 border-dashed border-white/5 gap-4 text-center">
                        <Zap size={40} className="text-zinc-700" />
                        <div>
                            <h3 className="text-lg font-black text-white">No flows yet</h3>
                            <p className="text-zinc-600 text-sm mt-1">Create your first multi-step DM flow to automate Instagram conversations.</p>
                        </div>
                        <button
                            onClick={() => setCreating(true)}
                            className="flex items-center gap-2 bg-indigo-500 hover:bg-indigo-600 text-white font-black px-5 py-2.5 rounded-xl text-sm"
                        >
                            <Plus size={14} /> Create First Flow
                        </button>
                    </div>
                ) : (
                    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                        {flows.map(flow => (
                            <div
                                key={flow._id}
                                className="rounded-2xl border border-white/5 bg-white/[0.02] p-5 flex flex-col gap-4 hover:border-white/10 transition-colors"
                            >
                                <div className="flex items-start justify-between gap-2">
                                    <div className="flex-1 min-w-0">
                                        <h3 className="font-black text-white truncate">{flow.name}</h3>
                                        <p className="text-xs text-zinc-600 mt-0.5 capitalize">
                                            {flow.trigger?.type?.replace('_', ' ')}
                                            {flow.trigger?.keywords?.[0] && ` · "${flow.trigger.keywords[0]}"`}
                                        </p>
                                    </div>
                                    <button onClick={() => toggleActive(flow)}>
                                        {flow.isActive
                                            ? <ToggleRight size={24} className="text-emerald-400" />
                                            : <ToggleLeft size={24} className="text-zinc-600" />}
                                    </button>
                                </div>

                                {/* Stats */}
                                <div className="grid grid-cols-3 gap-2">
                                    {[
                                        { label: 'Triggered', value: flow.stats?.triggered ?? 0 },
                                        { label: 'Sent', value: flow.stats?.dmsSent ?? 0 },
                                        { label: 'Emails', value: flow.stats?.emailsCollected ?? 0 },
                                    ].map(s => (
                                        <div key={s.label} className="text-center py-2 rounded-xl bg-black/30">
                                            <p className="text-lg font-black text-white">{s.value}</p>
                                            <p className="text-[10px] text-zinc-600">{s.label}</p>
                                        </div>
                                    ))}
                                </div>

                                <div className="text-xs text-zinc-600">{flow.steps?.length ?? 0} steps</div>

                                <div className="flex gap-2">
                                    <button
                                        onClick={() => setEditingFlow(flow)}
                                        className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl border border-white/8 bg-white/5 text-xs font-bold text-zinc-300 hover:text-white hover:bg-white/10 transition-all"
                                    >
                                        <Edit size={12} /> Edit
                                    </button>
                                    <button
                                        onClick={() => deleteFlow(flow._id)}
                                        className="p-2 rounded-xl border border-white/8 text-zinc-600 hover:text-rose-400 hover:bg-rose-500/10 transition-all"
                                    >
                                        <Trash2 size={13} />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </DashboardLayout>
    );
}
