'use client';

import React, { useState, useEffect } from 'react';
import { AutomationRuleModal } from '@/components/dashboard/automation-rule-modal';
import { BroadcastManager } from '@/components/dashboard/broadcast-manager';
import { AutomationAnalytics } from '@/components/dashboard/automation-analytics';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
    Zap, MessageSquare, BarChart3, Loader2, Edit, Trash2,
    Instagram, Phone, CheckCircle2, XCircle, AlertTriangle,
    Send, TrendingUp, Users, Plus, ToggleLeft, ToggleRight,
    ShieldCheck, X
} from 'lucide-react';
import toast from 'react-hot-toast';
import EmptyState from '@/components/dashboard/EmptyState';

export default function AutomationPage() {
    const [loading, setLoading] = useState(true);
    const [rules, setRules] = useState<any[]>([]);
    const [togglingId, setTogglingId] = useState<string | null>(null);
    const [showConnectModal, setShowConnectModal] = useState(false);

    const [platforms, setPlatforms] = useState([
        {
            id: 'instagram',
            name: 'Instagram',
            icon: Instagram,
            connected: false,
            status: 'disconnected', // 'connected' | 'disconnected' | 'expired'
            handle: null,
        },
        {
            id: 'whatsapp',
            name: 'WhatsApp',
            icon: Phone,
            connected: false,
            status: 'disconnected',
            handle: null,
        }
    ]);

    const fetchStatus = async () => {
        try {
            const res = await fetch('/api/creator/social/status');
            const data = await res.json();
            if (res.ok && data.instagram) {
                setPlatforms(prev => prev.map(p =>
                    p.id === 'instagram'
                        ? { ...p, connected: data.instagram.connected, status: data.instagram.status, handle: data.instagram.handle }
                        : p
                ));
            }
        } catch (error) {
            console.error('Failed to fetch social status:', error);
        }
    };

    const fetchRules = async () => {
        try {
            const res = await fetch('/api/creator/automation/rules');
            const json = await res.json();
            if (res.ok) setRules(json.rules || []);
        } catch (error) {
            console.error('Failed to fetch rules:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchRules();
        fetchStatus();

        // Handle OAuth callback status
        const params = new URLSearchParams(window.location.search);
        if (params.get('success') === 'true') {
            toast.success('Instagram connected successfully! 🚀');
            // Clean up URL
            window.history.replaceState({}, '', window.location.pathname);
        } else if (params.get('error')) {
            toast.error(params.get('error') || 'Failed to connect Instagram');
            window.history.replaceState({}, '', window.location.pathname);
        } else if (params.get('denied')) {
            toast.error('Instagram permissions were denied');
            window.history.replaceState({}, '', window.location.pathname);
        }
    }, []);

    const handleDisconnect = async (platformId: string) => {
        if (!confirm(`Are you sure you want to disconnect ${platformId}?`)) return;
        try {
            const res = await fetch(`/api/creator/social/${platformId}`, { method: 'DELETE' });
            if (res.ok) {
                toast.success(`${platformId} disconnected`);
                fetchStatus();
            }
        } catch {
            toast.error(`Failed to disconnect ${platformId}`);
        }
    };

    const handleConnect = (platformId: string) => {
        if (platformId === 'instagram') {
            setShowConnectModal(true);
        } else {
            toast.error('WhatsApp connection coming soon');
        }
    };

    const handleInstagramOAuth = () => {
        window.location.href = '/api/social/instagram/connect';
    };

    const handleDelete = async (ruleId: string) => {
        if (!confirm('Are you sure you want to delete this rule?')) return;
        try {
            const res = await fetch(`/api/creator/automation/rules/${ruleId}`, { method: 'DELETE' });
            if (res.ok) {
                toast.success('Rule deleted');
                fetchRules();
            }
        } catch {
            toast.error('Failed to delete rule');
        }
    };

    const handleToggle = async (rule: any) => {
        setTogglingId(rule._id);
        try {
            const res = await fetch(`/api/creator/automation/rules/${rule._id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ isActive: !rule.isActive })
            });
            if (res.ok) {
                setRules(prev => prev.map(r => r._id === rule._id ? { ...r, isActive: !r.isActive } : r));
                toast.success(rule.isActive ? 'Rule paused' : 'Rule activated');
            }
        } catch {
            toast.error('Failed to toggle rule');
        } finally {
            setTogglingId(null);
        }
    };

    const totalSent = rules.reduce((a, r) => a + (r.triggerCount || 0), 0);
    const activeRules = rules.filter(r => r.isActive).length;

    const platformStatusConfig: Record<string, { color: string; icon: React.ElementType; label: string }> = {
        connected: { color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20', icon: CheckCircle2, label: 'Connected' },
        disconnected: { color: 'text-zinc-500 bg-zinc-800 border-white/5', icon: XCircle, label: 'Disconnected' },
        expired: { color: 'text-amber-400 bg-amber-500/10 border-amber-500/20', icon: AlertTriangle, label: 'Token Expired' },
        error: { color: 'text-rose-400 bg-rose-500/10 border-rose-500/20', icon: XCircle, label: 'Connection Error' },
        denied: { color: 'text-rose-400 bg-rose-500/10 border-rose-500/20', icon: AlertTriangle, label: 'Denied' },
    };

    return (
        <div className="space-y-8 max-w-7xl mx-auto pb-20">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-black text-white tracking-tight italic uppercase">AutoDM Hub</h1>
                    <p className="text-zinc-500 text-xs font-bold uppercase tracking-widest mt-1">Automate Instagram & WhatsApp with 1-click growth logic</p>
                </div>
            </div>

            {/* Platform Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {platforms.map((platform) => {
                    const cfg = platformStatusConfig[platform.status];
                    const StatusIcon = cfg.icon;
                    const PlatformIcon = platform.icon;
                    return (
                        <div key={platform.id} className="bg-[#0a0a0a] border border-white/5 rounded-[2rem] p-8 flex items-center justify-between group hover:border-white/10 transition-all">
                            <div className="flex items-center gap-5">
                                <div className="w-14 h-14 rounded-2xl bg-white/5 border border-white/5 flex items-center justify-center">
                                    <PlatformIcon className="w-7 h-7 text-white/70" />
                                </div>
                                <div>
                                    <p className="font-black text-white text-sm uppercase tracking-widest">{platform.name}</p>
                                    <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-[10px] font-black uppercase tracking-widest mt-2 ${cfg.color}`}>
                                        <StatusIcon className="w-3 h-3" />
                                        {platform.handle ? `@${platform.handle}` : cfg.label}
                                    </div>
                                </div>
                            </div>
                            <button
                                onClick={() => platform.connected ? handleDisconnect(platform.id) : handleConnect(platform.id)}
                                className={`px-5 py-2.5 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${platform.connected ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20 hover:bg-rose-500/20' : 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 hover:bg-indigo-500/20'}`}
                            >
                                {platform.connected ? 'Disconnect' : 'Connect'}
                            </button>
                        </div>
                    );
                })}
            </div>

            {/* Stats Bar */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                    { label: 'Total DMs Sent', value: totalSent.toLocaleString(), icon: Send, color: 'text-indigo-400' },
                    { label: 'Active Rules', value: activeRules.toString(), icon: Zap, color: 'text-emerald-400' },
                    { label: 'Delivery Rate', value: '—', icon: TrendingUp, color: 'text-purple-400' },
                    { label: 'Total Rules', value: rules.length.toString(), icon: Users, color: 'text-amber-400' },
                ].map((stat) => {
                    const Icon = stat.icon;
                    return (
                        <div key={stat.label} className="bg-[#0a0a0a] border border-white/5 rounded-2xl p-5 space-y-3">
                            <div className="flex items-center justify-between">
                                <p className="text-[10px] font-black text-zinc-600 uppercase tracking-widest">{stat.label}</p>
                                <Icon className={`w-4 h-4 ${stat.color}`} />
                            </div>
                            <p className="text-2xl font-black text-white">{stat.value}</p>
                        </div>
                    );
                })}
            </div>

            {/* Tabs */}
            <Tabs defaultValue="rules" className="space-y-6">
                <TabsList className="bg-zinc-900/80 border border-white/5 p-1.5 rounded-2xl">
                    <TabsTrigger value="rules" className="gap-2 rounded-xl data-[state=active]:bg-white data-[state=active]:text-black font-black text-xs uppercase tracking-widest">
                        <Zap className="h-3.5 w-3.5" /> Rules
                    </TabsTrigger>
                    <TabsTrigger value="broadcast" className="gap-2 rounded-xl data-[state=active]:bg-white data-[state=active]:text-black font-black text-xs uppercase tracking-widest">
                        <MessageSquare className="h-3.5 w-3.5" /> Broadcast
                    </TabsTrigger>
                    <TabsTrigger value="analytics" className="gap-2 rounded-xl data-[state=active]:bg-white data-[state=active]:text-black font-black text-xs uppercase tracking-widest">
                        <BarChart3 className="h-3.5 w-3.5" /> Analytics
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="rules" className="space-y-4">
                    {loading ? (
                        <div className="flex justify-center p-20"><Loader2 className="h-8 w-8 animate-spin text-indigo-400" /></div>
                    ) : rules.length === 0 ? (
                        <EmptyState
                            icon={Zap}
                            title="No Automation Rules Yet"
                            description="Create your first rule to start automating your Instagram or WhatsApp growth."
                            actionLabel="Create My First Rule"
                        />
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {rules.map((rule) => (
                                <div key={rule._id} className="bg-[#0a0a0a] border border-white/5 rounded-[2rem] p-6 space-y-4 hover:border-white/10 transition-all group">
                                    {/* Card Header */}
                                    <div className="flex items-start justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-2xl bg-white/5 flex items-center justify-center border border-white/5 text-xl">
                                                {rule.triggerType === 'comment' ? '💬' : '📩'}
                                            </div>
                                            <div>
                                                <p className="font-black text-white text-xs uppercase tracking-wide">
                                                    {rule.triggerType === 'dm' && rule.keywords?.length > 0
                                                        ? `Keyword: "${rule.keywords.slice(0, 2).join(', ')}"`
                                                        : rule.triggerType.replace('_', ' ')}
                                                </p>
                                                <p className="text-[10px] text-zinc-600 font-bold mt-0.5">{rule.triggerCount || 0} triggers fired</p>
                                            </div>
                                        </div>

                                        {/* Toggle */}
                                        <button
                                            onClick={() => handleToggle(rule)}
                                            disabled={togglingId === rule._id}
                                            className="transition-all"
                                        >
                                            {togglingId === rule._id ? (
                                                <Loader2 className="w-7 h-7 animate-spin text-zinc-500" />
                                            ) : rule.isActive ? (
                                                <ToggleRight className="w-8 h-8 text-emerald-400" />
                                            ) : (
                                                <ToggleLeft className="w-8 h-8 text-zinc-600" />
                                            )}
                                        </button>
                                    </div>

                                    {/* Message Preview */}
                                    <div className="bg-white/3 border border-white/5 rounded-2xl p-4">
                                        <p className="text-xs text-zinc-400 italic line-clamp-2">"{rule.replyText || rule.response}"</p>
                                    </div>

                                    {/* Tags */}
                                    <div className="flex flex-wrap gap-2">
                                        <span className={`px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border ${rule.isActive ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-zinc-800 text-zinc-500 border-white/5'}`}>
                                            {rule.isActive ? 'Active' : 'Paused'}
                                        </span>
                                        {rule.followRequired && (
                                            <span className="px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-widest bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                                                Follow Filter
                                            </span>
                                        )}
                                        <span className="px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-widest bg-white/3 text-zinc-500 border border-white/5">
                                            {rule.attachmentType !== 'none' ? `Media: ${rule.attachmentType}` : 'Text only'}
                                        </span>
                                    </div>

                                    {/* Actions */}
                                    <div className="flex gap-2 pt-2 border-t border-white/5">
                                        <AutomationRuleModal
                                            rule={rule}
                                            onSuccess={fetchRules}
                                            trigger={
                                                <button className="flex-1 py-2.5 text-[10px] font-black uppercase tracking-widest text-zinc-500 hover:text-white hover:bg-white/5 rounded-xl transition-all flex items-center justify-center gap-1.5">
                                                    <Edit className="w-3.5 h-3.5" /> Edit
                                                </button>
                                            }
                                        />
                                        <button
                                            onClick={() => handleDelete(rule._id)}
                                            className="flex-1 py-2.5 text-[10px] font-black uppercase tracking-widest text-rose-500/60 hover:text-rose-400 hover:bg-rose-500/10 rounded-xl transition-all flex items-center justify-center gap-1.5"
                                        >
                                            <Trash2 className="w-3.5 h-3.5" /> Delete
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </TabsContent>

                <TabsContent value="broadcast">
                    <div className="max-w-2xl mx-auto py-4">
                        <BroadcastManager />
                    </div>
                </TabsContent>

                <TabsContent value="analytics">
                    <AutomationAnalytics />
                </TabsContent>
            </Tabs>

            {/* Floating Add Button */}
            {rules.length > 0 && (
                <div className="fixed bottom-8 right-8 z-50">
                    <AutomationRuleModal
                        onSuccess={fetchRules}
                        trigger={
                            <button className="w-14 h-14 bg-indigo-600 hover:bg-indigo-500 text-white rounded-full flex items-center justify-center shadow-2xl shadow-indigo-500/30 transition-all hover:scale-110 active:scale-95">
                                <Plus className="w-6 h-6" />
                            </button>
                        }
                    />
                </div>
            )}

            {/* Instagram Connect Modal */}
            {showConnectModal && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-[#0a0a0a] border border-white/10 rounded-[2.5rem] p-8 max-w-md w-[90%] shadow-2xl animate-in slide-in-from-bottom-4 duration-300 relative">
                        <button
                            onClick={() => setShowConnectModal(false)}
                            className="absolute top-6 right-6 text-zinc-600 hover:text-white transition-colors"
                        >
                            <X className="w-5 h-5" />
                        </button>

                        <h3 className="text-xl font-black text-white uppercase tracking-tight">Connect Instagram</h3>
                        <p className="text-xs text-zinc-500 font-medium mt-1 mb-6">Creatorly needs these permissions to send automated DMs on your behalf.</p>

                        <div className="space-y-4">
                            {[
                                { icon: '💬', title: 'Read comments', desc: 'Detect keyword triggers on your posts' },
                                { icon: '📩', title: 'Send DMs', desc: 'Deliver automated replies to commenters' },
                                { icon: '👥', title: 'Check followers', desc: 'Verify follow status for follow-first rules' },
                            ].map((perm, i) => (
                                <div key={i} className="flex items-start gap-4 py-3 border-b border-white/5 last:border-0">
                                    <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-lg shrink-0">
                                        {perm.icon}
                                    </div>
                                    <div>
                                        <p className="text-sm font-bold text-white">{perm.title}</p>
                                        <p className="text-[11px] text-zinc-500 mt-0.5">{perm.desc}</p>
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div className="mt-6 p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl flex items-center gap-3">
                            <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                            <p className="text-[11px] text-emerald-400 font-bold">We never post on your behalf or access your DM history.</p>
                        </div>

                        <button
                            onClick={handleInstagramOAuth}
                            className="w-full mt-6 py-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl font-black text-xs uppercase tracking-[0.2em] transition-all active:scale-[0.98] shadow-xl shadow-indigo-500/20"
                        >
                            Connect with Instagram
                        </button>
                        <button
                            onClick={() => setShowConnectModal(false)}
                            className="w-full mt-2 py-3 text-zinc-600 text-[10px] font-black uppercase tracking-widest hover:text-zinc-400 transition-colors"
                        >
                            Cancel
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
