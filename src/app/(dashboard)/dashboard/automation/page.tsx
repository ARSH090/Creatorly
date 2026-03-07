'use client';

import React, { useState, useEffect } from 'react';
import {
    Zap, MessageSquare, History, Users,
    Settings, Activity, Plus, RefreshCw,
    ExternalLink, Instagram, ShieldCheck,
    AlertCircle, CheckCircle2, MoreHorizontal,
    Play, Pause, Trash2, Edit2, Loader2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { AutomationRuleModal } from '@/components/dashboard/automation-rule-modal';
import { toast } from 'react-hot-toast';
import { cn } from '@/lib/utils';
import Image from 'next/image';

export default function AutomationPage() {
    const [activeTab, setActiveTab] = useState('rules');
    const [isLoading, setIsLoading] = useState(true);
    const [status, setStatus] = useState<any>(null);
    const [rules, setRules] = useState<any[]>([]);
    const [logs, setLogs] = useState<any[]>([]);
    const [pending, setPending] = useState<any[]>([]);

    const fetchData = async () => {
        setIsLoading(true);
        try {
            const [statusRes, rulesRes] = await Promise.all([
                fetch('/api/instagram/status'),
                fetch('/api/creator/autodm/rules')
            ]);

            const statusData = await statusRes.json();
            const rulesData = await rulesRes.json();

            setStatus(statusData);
            setRules(Array.isArray(rulesData) ? rulesData : (rulesData.rules || []));
        } catch (error) {
            toast.error('Failed to initialize automation hub');
        } finally {
            setIsLoading(false);
        }
    };

    const fetchLogs = async () => {
        try {
            const res = await fetch('/api/creator/autodm/logs');
            const data = await res.json();
            setLogs(data);
        } catch (error) {
            console.error('Failed to fetch logs');
        }
    };

    const fetchPending = async () => {
        try {
            const res = await fetch('/api/creator/autodm/pending');
            const data = await res.json();
            setPending(data);
        } catch (error) {
            console.error('Failed to fetch pending');
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    useEffect(() => {
        if (activeTab === 'logs') fetchLogs();
        if (activeTab === 'pending') fetchPending();
    }, [activeTab]);

    const handleToggleRule = async (ruleId: string, isActive: boolean) => {
        try {
            const res = await fetch(`/api/creator/autodm/rules/${ruleId}/toggle`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ isActive: !isActive })
            });

            if (res.ok) {
                toast.success(isActive ? 'Rule paused' : 'Rule activated');
                fetchData();
            }
        } catch (error) {
            toast.error('Failed to toggle rule');
        }
    };

    const handleDeleteRule = async (ruleId: string) => {
        if (!confirm('Permanent deletion. Continue?')) return;
        try {
            const res = await fetch(`/api/creator/autodm/rules/${ruleId}`, {
                method: 'DELETE'
            });

            if (res.ok) {
                toast.success('Rule purged from system');
                fetchData();
            }
        } catch (error) {
            toast.error('Failed to delete rule');
        }
    };

    return (
        <div className="max-w-7xl mx-auto space-y-10 pb-20 animate-in fade-in duration-700">
            {/* Header Section */}
            <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div className="space-y-4">
                    <h1 className="text-5xl font-black text-white italic uppercase tracking-tighter flex items-center gap-4">
                        <Zap className="w-12 h-12 text-yellow-400 fill-yellow-400/20 shadow-[0_0_30px_rgba(250,204,21,0.4)]" />
                        AUTO-DM HUB
                    </h1>
                    <p className="text-[10px] font-black text-zinc-600 uppercase tracking-[0.4em]">
                        Instagram Automation • Keyword Triggers • Growth Engineering
                    </p>
                </div>
                <div className="flex gap-4">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={fetchData}
                        className="bg-zinc-900/50 border-white/5 text-zinc-400 hover:text-white rounded-full h-12 px-6 uppercase text-[10px] font-black tracking-widest italic"
                    >
                        <RefreshCw className={cn("w-3 h-3 mr-2", isLoading && "animate-spin")} /> REFRESH HUB
                    </Button>
                    <AutomationRuleModal onSuccess={fetchData}>
                        <Button className="bg-indigo-600 hover:bg-indigo-500 text-white rounded-full h-12 px-8 uppercase text-[10px] font-black tracking-widest italic shadow-xl shadow-indigo-600/20">
                            <Plus className="w-4 h-4 mr-2" /> NEW AUTOMATION
                        </Button>
                    </AutomationRuleModal>
                </div>
            </header>

            {/* Performance Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {[
                    { label: 'Active Rules', val: status?.stats?.activeRules || 0, icon: <Zap className="text-yellow-400" /> },
                    { label: 'DMs Sent Today', val: status?.stats?.dmsSentToday || 0, icon: <MessageSquare className="text-indigo-400" /> },
                    { label: 'Total Conversions', val: status?.stats?.totalDMsSent || 0, icon: <CheckCircle2 className="text-emerald-400" /> },
                    { label: 'Pending Follows', val: status?.stats?.followGateWait || 0, icon: <Users className="text-orange-400" /> }
                ].map((stat, i) => (
                    <Card key={i} className="bg-zinc-900/40 backdrop-blur-2xl border-white/5 rounded-[2rem] overflow-hidden group hover:border-white/10 transition-all duration-500">
                        <CardContent className="p-8">
                            <div className="flex justify-between items-start mb-6">
                                <div className="p-3 bg-white/5 rounded-2xl border border-white/5 group-hover:scale-110 transition-transform duration-500">
                                    {stat.icon}
                                </div>
                                <Badge className="bg-white/5 text-zinc-500 border-none rounded-full px-3 py-1 text-[8px] font-black italic">LIVE</Badge>
                            </div>
                            <h4 className="text-[10px] font-black text-zinc-600 uppercase tracking-[0.2em] mb-1 italic">{stat.label}</h4>
                            <p className="text-4xl font-black text-white italic">{stat.val}</p>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {/* Connection Bar */}
            {!status?.isConnected && !isLoading && (
                <div className="bg-red-500/10 border border-red-500/20 rounded-[2.5rem] p-10 flex flex-col items-center text-center space-y-6 animate-pulse-subtle">
                    <div className="w-20 h-20 rounded-full bg-red-500/20 flex items-center justify-center">
                        <Instagram className="w-10 h-10 text-red-500" />
                    </div>
                    <div className="space-y-2">
                        <h3 className="text-2xl font-black text-white italic uppercase tracking-tight">Instagram Link Disconnected</h3>
                        <p className="text-zinc-500 text-sm font-bold italic max-w-md">Your automation brain is offline. Connect your Instagram Business account to begin processing keyword triggers and automated DM sequences.</p>
                    </div>
                    <Button
                        onClick={() => window.location.href = '/api/instagram/connect'}
                        className="bg-red-500 hover:bg-red-400 text-white h-14 px-10 rounded-full font-black uppercase text-[10px] tracking-widest italic shadow-xl shadow-red-500/20"
                    >
                        INITIALIZE CONNECTION
                    </Button>
                </div>
            )}

            <div className={cn(
                "bg-zinc-900/40 backdrop-blur-3xl rounded-[2.5rem] p-6 border flex flex-col md:flex-row items-center justify-between gap-6 transition-all duration-700",
                status?.isConnected ? "border-emerald-500/20" : "border-red-500/20 grayscale"
            )}>
                <div className="flex items-center gap-6">
                    <div className="relative">
                        <div className="w-16 h-16 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 border-2 border-white/10 overflow-hidden">
                            {status?.profilePicUrl ? (
                                <Image src={status.profilePicUrl} alt="IG" fill className="object-cover" />
                            ) : (
                                <Instagram className="w-full h-full p-4 text-white/50" />
                            )}
                        </div>
                        <div className={cn(
                            "absolute -bottom-1 -right-1 w-6 h-6 rounded-full border-4 border-zinc-900 flex items-center justify-center",
                            status?.isConnected ? "bg-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.5)]" : "bg-red-500"
                        )}>
                            {status?.isConnected ? <CheckCircle2 className="w-3 h-3 text-white" /> : <AlertCircle className="w-3 h-3 text-white" />}
                        </div>
                    </div>
                    <div className="space-y-1">
                        <h3 className="text-xl font-black text-white italic uppercase tracking-tight">
                            {status?.username || 'NOT CONNECTED'}
                        </h3>
                        <p className="text-[10px] font-black text-zinc-600 uppercase tracking-widest italic">
                            {status?.isConnected ? 'INTEGRATION AUTHORIZED • RECEIVING WEBHOOKS' : 'ACTION REQUIRED • CONNECTION INTERRUPTED'}
                        </p>
                    </div>
                </div>
                <div className="flex gap-4">
                    <Button
                        variant="outline"
                        className="bg-white/5 border-white/10 text-white rounded-full h-12 px-8 uppercase text-[10px] font-black tracking-widest italic hover:bg-white hover:text-black transition-all"
                        onClick={() => window.location.href = '/api/instagram/connect'}
                    >
                        {status?.isConnected ? 'RECONFIGURE' : 'CONNECT INSTAGRAM'}
                    </Button>
                </div>
            </div>

            {/* Main Tabs UI */}
            <Tabs defaultValue="rules" className="w-full" onValueChange={setActiveTab}>
                <TabsList className="bg-zinc-900/40 backdrop-blur-2xl p-1 rounded-full border border-white/5 mb-10 h-16 w-full md:w-fit">
                    <TabsTrigger value="rules" className="rounded-full px-10 data-[state=active]:bg-white data-[state=active]:text-black text-zinc-500 font-black uppercase text-[10px] tracking-[0.2em] italic h-full transition-all">
                        <Zap className="w-3 h-3 mr-2" /> RULES
                    </TabsTrigger>
                    <TabsTrigger value="pending" className="rounded-full px-10 data-[state=active]:bg-white data-[state=active]:text-black text-zinc-500 font-black uppercase text-[10px] tracking-[0.2em] italic h-full transition-all">
                        <Users className="w-3 h-3 mr-2" /> PENDING
                    </TabsTrigger>
                    <TabsTrigger value="logs" className="rounded-full px-10 data-[state=active]:bg-white data-[state=active]:text-black text-zinc-500 font-black uppercase text-[10px] tracking-[0.2em] italic h-full transition-all">
                        <History className="w-3 h-3 mr-2" /> ACTIVITY
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="rules" className="space-y-6">
                    {rules.length === 0 && !isLoading ? (
                        <Card className="bg-zinc-900/20 border-dashed border-white/10 rounded-[3rem] p-20 flex flex-col items-center text-center">
                            <div className="w-24 h-24 bg-white/5 rounded-full flex items-center justify-center mb-8">
                                <Plus className="w-10 h-10 text-zinc-700" />
                            </div>
                            <h3 className="text-2xl font-black text-white italic uppercase tracking-tight mb-4">INITIALIZE AUTOMATION</h3>
                            <p className="text-zinc-500 text-sm max-w-sm mb-10 font-bold italic">
                                Your automation repository is empty. Deployment of first keyword rule recommended to begin growth sequence.
                            </p>
                            <AutomationRuleModal onSuccess={fetchData}>
                                <Button className="bg-white text-black h-16 px-12 rounded-[2rem] font-black uppercase text-xs tracking-widest italic hover:scale-105 transition-all shadow-2xl">
                                    CREATE FIRST RULE
                                </Button>
                            </AutomationRuleModal>
                        </Card>
                    ) : (
                        <div className="grid grid-cols-1 gap-6">
                            {rules.map((rule) => (
                                <Card key={rule._id} className="bg-zinc-900/40 backdrop-blur-2xl border-white/5 rounded-[2.5rem] overflow-hidden group hover:border-white/10 transition-all duration-500">
                                    <CardContent className="p-8 flex flex-col md:flex-row md:items-center justify-between gap-8">
                                        <div className="flex items-center gap-6">
                                            <div className={cn(
                                                "w-16 h-16 rounded-2xl flex items-center justify-center border transition-all duration-500 group-hover:scale-110",
                                                rule.isActive ? "bg-indigo-500/10 border-indigo-500/20 text-indigo-400" : "bg-zinc-800/40 border-white/5 text-zinc-600"
                                            )}>
                                                <Zap className={cn("w-8 h-8", rule.isActive && "fill-indigo-400/20")} />
                                            </div>
                                            <div className="space-y-1">
                                                <div className="flex items-center gap-3">
                                                    <h3 className="text-xl font-black text-white italic uppercase tracking-tight">
                                                        {rule.name || rule.keyword}
                                                    </h3>
                                                    <Badge className={cn(
                                                        "px-3 py-1 rounded-full text-[8px] font-black uppercase italic border-none",
                                                        rule.isActive ? "bg-emerald-500/10 text-emerald-400" : "bg-zinc-800 text-zinc-500"
                                                    )}>
                                                        {rule.isActive ? 'OPERATIONAL' : 'DORMANT'}
                                                    </Badge>
                                                </div>
                                                <p className="text-[10px] font-black text-zinc-600 uppercase tracking-widest italic flex items-center gap-2">
                                                    TRIGGER: <span className="text-zinc-400">KEYWORD &quot;{rule.keyword}&quot;</span> •
                                                    MATCH: <span className="text-zinc-400 uppercase">{rule.matchType}</span>
                                                </p>
                                            </div>
                                        </div>

                                        <div className="flex flex-wrap items-center gap-10">
                                            <div className="space-y-1">
                                                <p className="text-[8px] font-black text-zinc-600 uppercase tracking-widest italic uppercase">Conversions</p>
                                                <p className="text-xl font-black text-white italic">{rule.totalDMsSent || 0}</p>
                                            </div>
                                            <div className="space-y-1">
                                                <p className="text-[8px] font-black text-zinc-600 uppercase tracking-widest italic uppercase">Blocked (Gate)</p>
                                                <p className="text-xl font-black text-white italic">{rule.totalFollowGateBlocked || 0}</p>
                                            </div>
                                            <div className="flex gap-2">
                                                <Button
                                                    size="icon"
                                                    variant="ghost"
                                                    onClick={() => handleToggleRule(rule._id, rule.isActive)}
                                                    className="w-12 h-12 rounded-2xl hover:bg-white/5 text-zinc-500 hover:text-white transition-all"
                                                >
                                                    {rule.isActive ? <Pause size={18} /> : <Play size={18} />}
                                                </Button>
                                                <AutomationRuleModal rule={rule} onSuccess={fetchData}>
                                                    <Button size="icon" variant="ghost" className="w-12 h-12 rounded-2xl hover:bg-white/5 text-zinc-500 hover:text-white transition-all">
                                                        <Edit2 size={18} />
                                                    </Button>
                                                </AutomationRuleModal>
                                                <Button
                                                    size="icon"
                                                    variant="ghost"
                                                    onClick={() => handleDeleteRule(rule._id)}
                                                    className="w-12 h-12 rounded-2xl hover:bg-red-500/10 text-red-500 hover:text-red-400 transition-all border border-transparent hover:border-red-500/20"
                                                >
                                                    <Trash2 size={18} />
                                                </Button>
                                            </div>
                                        </div>
                                    </CardContent>
                                    <div className="h-1 w-full bg-white/5 overflow-hidden">
                                        {rule.isActive && <div className="h-full bg-indigo-500 animate-[shimmer_2s_infinite] w-full" style={{ background: 'linear-gradient(90deg, transparent, rgba(99,102,241,0.5), transparent)' }} />}
                                    </div>
                                </Card>
                            ))}
                        </div>
                    )}
                </TabsContent>

                <TabsContent value="pending" className="space-y-6">
                    <Card className="bg-zinc-900/40 backdrop-blur-2xl border-white/5 rounded-[2.5rem] overflow-hidden">
                        <div className="p-8 border-b border-white/5">
                            <h3 className="text-xl font-black text-white italic uppercase tracking-tight">FOLLOW GATE QUEUE</h3>
                            <p className="text-[10px] font-black text-zinc-600 uppercase tracking-widest italic mt-2">
                                Entities awaiting follow verification before system deployment
                            </p>
                        </div>
                        <div className="divide-y divide-white/5">
                            {pending.length === 0 ? (
                                <div className="p-20 text-center space-y-4">
                                    <ShieldCheck className="w-12 h-12 text-zinc-800 mx-auto" />
                                    <p className="text-zinc-600 text-[10px] font-black uppercase tracking-widest italic">All entities verified. Queue cleared.</p>
                                </div>
                            ) : (
                                pending.map((item) => (
                                    <div key={item._id} className="p-6 flex items-center justify-between group hover:bg-white/5 transition-all">
                                        <div className="flex items-center gap-4">
                                            <div className="w-12 h-12 bg-white/5 rounded-full border border-white/5 flex items-center justify-center font-black italic text-zinc-400 uppercase text-xs">
                                                {item.instagramUsername[0]}
                                            </div>
                                            <div>
                                                <p className="text-sm font-black text-white italic truncate">@{item.instagramUsername}</p>
                                                <p className="text-[8px] font-black text-zinc-500 uppercase italic">Awaiting Follow • Logic: &quot;{item.keyword}&quot;</p>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-[8px] font-black text-zinc-500 uppercase italic">Expires In</p>
                                            <p className="text-xs font-black text-orange-400 italic">
                                                {(() => {
                                                    const diff = new Date(item.expiresAt).getTime() - new Date().getTime();
                                                    if (diff <= 0) return 'EXPIRED';
                                                    const hours = Math.floor(diff / (1000 * 60 * 60));
                                                    const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
                                                    return `${hours}H ${mins}M`;
                                                })()}
                                            </p>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </Card>
                </TabsContent>

                <TabsContent value="logs" className="space-y-6">
                    <Card className="bg-zinc-900/40 backdrop-blur-2xl border-white/5 rounded-[2.5rem] overflow-hidden">
                        <div className="p-8 border-b border-white/5">
                            <h3 className="text-xl font-black text-white italic uppercase tracking-tight">LOG CHRONICLE</h3>
                            <p className="text-[10px] font-black text-zinc-600 uppercase tracking-widest italic mt-2">
                                Historical record of system triggers and artifact delivery
                            </p>
                        </div>
                        <div className="divide-y divide-white/5">
                            {logs.length === 0 ? (
                                <div className="p-20 text-center space-y-4">
                                    <History className="w-12 h-12 text-zinc-800 mx-auto" />
                                    <p className="text-zinc-600 text-[10px] font-black uppercase tracking-widest italic">Hub archives empty.</p>
                                </div>
                            ) : (
                                logs.map((log) => (
                                    <div key={log._id} className="p-6 flex items-center justify-between group hover:bg-white/5 transition-all">
                                        <div className="flex items-center gap-4">
                                            <div className={cn(
                                                "w-10 h-10 rounded-xl flex items-center justify-center border",
                                                log.dmSent ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400" : "bg-red-500/10 border-red-500/20 text-red-500"
                                            )}>
                                                {log.dmSent ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
                                            </div>
                                            <div>
                                                <p className="text-sm font-black text-white italic">@{log.instagramUsername}</p>
                                                <p className="text-[8px] font-black text-zinc-500 uppercase italic">
                                                    Action: {log.triggerType === 'comment' ? 'Comment Reply' : 'Direct Message'} • Match: &quot;{log.matchedKeyword}&quot;
                                                </p>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-xs font-black text-white italic">{new Date(log.createdAt).toLocaleTimeString()}</p>
                                            <p className="text-[8px] font-black text-zinc-500 uppercase italic">{new Date(log.createdAt).toLocaleDateString()}</p>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
}
