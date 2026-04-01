'use client';
import Image from 'next/image';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@clerk/nextjs';
import {
    Loader2, Instagram, TrendingUp, Users,
    MessageCircle, AlertCircle, Plus, MoreVertical,
    Trash2, Power, PowerOff, Filter, Search,
    History, Clock
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'react-hot-toast';
import { Switch } from '@/components/ui/switch';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface IGStatus {
    isConnected: boolean;
    username: string | null;
    profilePicUrl: string | null;
    stats: {
        activeRules: number;
        dmsSentToday: number;
        totalDMsSent: number;
        followGateWait: number;
        conversionRate: string;
    } | null;
}

interface Rule {
    _id: string;
    name: string;
    keyword: string;
    matchType: 'exact' | 'contains' | 'startsWith';
    dmMessage: string;
    isActive: boolean;
    totalDMsSent: number;
    dmsSentToday: number;
}

export default function AutoDMDashboard() {
    const { isLoaded, userId } = useAuth();
    const [status, setStatus] = useState<IGStatus | null>(null);
    const [rules, setRules] = useState<Rule[]>([]);
    const [loading, setLoading] = useState(true);
    const [rulesLoading, setRulesLoading] = useState(true);
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

    useEffect(() => {
        if (isLoaded && userId) {
            initDashboard();
        }
    }, [isLoaded, userId]);

    const initDashboard = async () => {
        setLoading(true);
        await Promise.all([
            fetchStatus(),
            fetchRules()
        ]);
        setLoading(false);
    };

    const fetchStatus = async () => {
        try {
            const res = await fetch('/api/instagram/status');
            if (res.ok) {
                const data = await res.json();
                setStatus(data);
            }
        } catch (e) {
            console.error(e);
        }
    };

    const fetchRules = async () => {
        try {
            setRulesLoading(true);
            const res = await fetch('/api/creator/autodm/rules');
            if (res.ok) {
                const data = await res.json();
                setRules(Array.isArray(data) ? data : (data.data || []));
            }
        } catch (e) {
            console.error(e);
            toast.error("Failed to load rules");
        } finally {
            setRulesLoading(false);
        }
    };

    const toggleRule = async (id: string, currentStatus: boolean) => {
        try {
            const res = await fetch(`/api/creator/autodm/rules/${id}/toggle`, {
                method: 'PATCH'
            });
            if (res.ok) {
                setRules(rules.map(r => r._id === id ? { ...r, isActive: !currentStatus } : r));
                toast.success(`Rule ${!currentStatus ? 'activated' : 'deactivated'}`);
            }
        } catch (e) {
            toast.error("Failed to toggle rule");
        }
    };

    const deleteRule = async (id: string) => {
        if (!confirm("Are you sure you want to delete this rule?")) return;
        try {
            const res = await fetch(`/api/creator/autodm/rules/${id}`, {
                method: 'DELETE'
            });
            if (res.ok) {
                setRules(rules.filter(r => r._id !== id));
                toast.success("Rule deleted");
            }
        } catch (e) {
            toast.error("Failed to delete rule");
        }
    };

    const handleConnect = () => {
        window.location.href = '/api/instagram/connect';
    };

    if (!isLoaded || loading) {
        return (
            <div className="flex justify-center items-center min-h-[500px]">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    if (!status?.isConnected) {
        return (
            <div className="max-w-4xl mx-auto py-12 px-6">
                <div className="bg-white dark:bg-zinc-900 border dark:border-zinc-800 rounded-2xl p-8 shadow-sm">
                    <div className="text-center max-w-lg mx-auto space-y-6">
                        <div className="mx-auto w-16 h-16 bg-gradient-to-tr from-pink-500 via-red-500 to-yellow-500 rounded-full flex items-center justify-center text-white mb-6 shadow-lg shadow-pink-500/20">
                            <Instagram className="h-8 w-8" />
                        </div>

                        <h1 className="text-3xl font-bold tracking-tight">Connect Your Instagram</h1>
                        <p className="text-zinc-500 dark:text-zinc-400">
                            Automate your DMs, capture leads from comments, and grow your audience on autopilot.
                        </p>

                        <div className="bg-zinc-50 dark:bg-zinc-800/50 rounded-xl p-6 text-left border border-zinc-100 dark:border-zinc-800">
                            <h3 className="font-semibold mb-4 flex items-center gap-2">
                                <AlertCircle className="w-4 h-4 text-blue-500" />
                                Requirements:
                            </h3>
                            <ul className="space-y-3 text-sm text-zinc-600 dark:text-zinc-300">
                                <li className="flex items-start gap-2">
                                    <span className="text-green-500">✅</span> Instagram Business or Creator account
                                </li>
                                <li className="flex items-start gap-2">
                                    <span className="text-green-500">✅</span> Connected to a Facebook Page
                                </li>
                            </ul>
                        </div>

                        <Button
                            onClick={handleConnect}
                            className="w-full sm:w-auto mt-8 bg-gradient-to-r from-pink-500 to-violet-600 hover:from-pink-600 hover:to-violet-700 text-white shadow-md transition-all rounded-full px-8 py-6 text-lg"
                        >
                            Connect Instagram Account
                        </Button>
                    </div>
                </div>
            </div>
        );
    }

    const s = status.stats || {
        activeRules: 0, dmsSentToday: 0, totalDMsSent: 0, followGateWait: 0, conversionRate: '0%'
    };

    return (
        <div className="max-w-6xl mx-auto px-4 py-8 space-y-8">
            {/* Header Profile */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white dark:bg-zinc-900 border dark:border-zinc-800 rounded-2xl p-6 shadow-sm">
                <div className="flex items-center gap-4">
                    {status.profilePicUrl ? (
                        <Image width={800} height={800} src={status.profilePicUrl} alt="IG Profile" className="w-16 h-16 rounded-full border border-zinc-200" />
                    ) : (
                        <div className="w-16 h-16 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center">
                            <Instagram className="text-zinc-400 w-8 h-8" />
                        </div>
                    )}
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight">AutoDM Dashboard</h1>
                        <p className="text-zinc-500">Connected as @{status.username}</p>
                    </div>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" className="rounded-full">Settings</Button>
                    <CreateRuleModal onSuccess={fetchRules} />
                </div>
            </div>

            {/* Stats row */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard label="Rules Active" value={s.activeRules} icon={<TrendingUp className="w-4 h-4" />} />
                <StatCard label="Sent Today" value={s.dmsSentToday} icon={<MessageCircle className="w-4 h-4 text-green-500" />} />
                <StatCard label="Total Sent" value={s.totalDMsSent} icon={<Users className="w-4 h-4 text-blue-500" />} />
                <StatCard label="Conversion" value={s.conversionRate} icon={<TrendingUp className="w-4 h-4 text-orange-400" />} />
            </div>

            <Tabs defaultValue="rules" className="w-full">
                <TabsList className="bg-zinc-100 dark:bg-zinc-800 p-1 rounded-full mb-8">
                    <TabsTrigger value="rules" className="rounded-full px-6">Active Rules</TabsTrigger>
                    <TabsTrigger value="pending" className="rounded-full px-6">Pending Follows</TabsTrigger>
                    <TabsTrigger value="activity" className="rounded-full px-6">Activity Log</TabsTrigger>
                </TabsList>

                <TabsContent value="rules" className="space-y-6">
                    {rulesLoading ? (
                        <div className="flex justify-center p-12"><Loader2 className="animate-spin" /></div>
                    ) : rules.length === 0 ? (
                        <div className="text-center p-16 bg-zinc-50 dark:bg-zinc-900/50 rounded-2xl border-2 border-dashed border-zinc-200 dark:border-zinc-800">
                            <div className="max-w-xs mx-auto space-y-4">
                                <div className="w-12 h-12 bg-zinc-100 dark:bg-zinc-800 rounded-full flex items-center justify-center mx-auto">
                                    <PowerOff className="text-zinc-400" />
                                </div>
                                <h3 className="font-semibold text-lg">No rules created yet</h3>
                                <p className="text-zinc-500 text-sm">Create your first automation rule to start engaging with your audience.</p>
                                <CreateRuleModal onSuccess={fetchRules} />
                            </div>
                        </div>
                    ) : (
                        <div className="grid gap-4">
                            {rules.map(rule => (
                                <div key={rule._id} className="bg-white dark:bg-zinc-900 border dark:border-zinc-800 rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow">
                                    <div className="flex items-center justify-between">
                                        <div className="space-y-1">
                                            <div className="flex items-center gap-2">
                                                <h3 className="font-bold text-lg">{rule.name}</h3>
                                                <span className="px-2 py-0.5 bg-zinc-100 dark:bg-zinc-800 rounded text-xs font-mono text-zinc-500 uppercase">{rule.matchType}</span>
                                            </div>
                                            <p className="text-zinc-500 text-sm">
                                                Triggers on: <span className="text-indigo-600 font-semibold">"{rule.keyword}"</span>
                                            </p>
                                        </div>
                                        <div className="flex items-center gap-4">
                                            <div className="text-right">
                                                <p className="text-xs text-zinc-400 uppercase font-bold tracking-wider">Sent Today</p>
                                                <p className="text-xl font-black">{rule.dmsSentToday}</p>
                                            </div>
                                            <div className="h-8 w-px bg-zinc-100 dark:bg-zinc-800" />
                                            <Switch
                                                checked={rule.isActive}
                                                onCheckedChange={() => toggleRule(rule._id, rule.isActive)}
                                            />
                                            <Button variant="ghost" size="icon" onClick={() => deleteRule(rule._id)}>
                                                <Trash2 className="w-4 h-4 text-red-500" />
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </TabsContent>

                <TabsContent value="pending" className="text-center p-20 text-zinc-500 bg-white dark:bg-zinc-900 border dark:border-zinc-800 rounded-2xl">
                    <Clock className="mx-auto mb-4 w-12 h-12 opacity-20" />
                    <p>No followers waiting in the verification gate.</p>
                </TabsContent>

                <TabsContent value="activity" className="text-center p-20 text-zinc-500 bg-white dark:bg-zinc-900 border dark:border-zinc-800 rounded-2xl">
                    <History className="mx-auto mb-4 w-12 h-12 opacity-20" />
                    <p>Live activity log will appear here as trigger events are detected.</p>
                </TabsContent>
            </Tabs>
        </div>
    );
}

function StatCard({ label, value, icon }: { label: string, value: string | number, icon: React.ReactNode }) {
    return (
        <div className="bg-white dark:bg-zinc-900 border dark:border-zinc-800 rounded-2xl p-6 shadow-sm">
            <div className="flex items-center gap-2 text-zinc-500 mb-2 font-medium text-sm">
                {icon}
                {label}
            </div>
            <p className="text-3xl font-black tracking-tight">{value}</p>
        </div>
    );
}

function CreateRuleModal({ onSuccess }: { onSuccess: () => void }) {
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        keyword: '',
        matchType: 'contains',
        dmMessage: '',
        followGate: false
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            const res = await fetch('/api/creator/autodm/rules', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ...formData,
                    followGate: { enabled: formData.followGate }
                })
            });
            if (res.ok) {
                toast.success('Rule created successfully');
                setOpen(false);
                onSuccess();
            } else {
                const err = await res.json();
                toast.error(err.error || 'Failed to create rule');
            }
        } catch (e) {
            toast.error('Network error');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button className="bg-black dark:bg-white text-white dark:text-black rounded-full px-6">
                    <Plus className="w-4 h-4 mr-2" /> Create Rule
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px] rounded-2xl">
                <DialogHeader>
                    <DialogTitle className="text-2xl font-bold">New Automation Rule</DialogTitle>
                    <DialogDescription>
                        Set up a trigger to automatically send DMs based on comments or messages.
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-6 pt-4">
                    <div className="space-y-2">
                        <Label htmlFor="name">Rule Name</Label>
                        <Input
                            id="name"
                            placeholder="e.g. eBook Lead Magnet"
                            required
                            className="rounded-xl"
                            value={formData.name}
                            onChange={e => setFormData(p => ({ ...p, name: e.target.value }))}
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="keyword">Trigger Keyword</Label>
                            <Input
                                id="keyword"
                                placeholder="e.g. BOOK"
                                required
                                className="rounded-xl"
                                value={formData.keyword}
                                onChange={e => setFormData(p => ({ ...p, keyword: e.target.value }))}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="matchType">Match Type</Label>
                            <Select
                                value={formData.matchType}
                                onValueChange={(v: string) => setFormData(p => ({ ...p, matchType: v as any }))}
                            >
                                <SelectTrigger id="matchType" className="rounded-xl">
                                    <SelectValue placeholder="Select" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="exact">Exact Match</SelectItem>
                                    <SelectItem value="contains">Contains</SelectItem>
                                    <SelectItem value="startsWith">Starts With</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="message">DM Message</Label>
                        <textarea
                            id="message"
                            className="w-full min-h-[100px] rounded-xl border border-zinc-200 dark:border-zinc-800 bg-transparent p-3 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                            placeholder="Hi {{name}}! Here's the link you requested..."
                            required
                            value={formData.dmMessage}
                            onChange={e => setFormData(p => ({ ...p, dmMessage: e.target.value }))}
                        />
                    </div>

                    <div className="flex items-center justify-between p-4 bg-zinc-50 dark:bg-zinc-900 rounded-xl border dark:border-zinc-800">
                        <div className="space-y-0.5">
                            <Label>Follow-Gate</Label>
                            <p className="text-xs text-zinc-500">Only send DM if user follows you</p>
                        </div>
                        <Switch
                            checked={formData.followGate}
                            onCheckedChange={v => setFormData(p => ({ ...p, followGate: v }))}
                        />
                    </div>

                    <Button type="submit" disabled={loading} className="w-full rounded-full py-6 text-lg">
                        {loading ? <Loader2 className="animate-spin" /> : 'Activate Rule'}
                    </Button>
                </form>
            </DialogContent>
        </Dialog>
    );
}
