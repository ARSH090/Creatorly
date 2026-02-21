'use client';

import React, { useState, useEffect } from 'react';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AutomationRuleModal } from '@/components/dashboard/automation-rule-modal';
import { BroadcastManager } from '@/components/dashboard/broadcast-manager';
import { AutomationAnalytics } from '@/components/dashboard/automation-analytics';
import { Zap, MessageSquare, Loader2, Edit, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';

export default function AutomationPage() {
    const [loading, setLoading] = useState(true);
    const [rules, setRules] = useState<any[]>([]);

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
    }, []);

    const handleDelete = async (ruleId: string) => {
        if (!confirm('Are you sure you want to delete this rule?')) return;
        try {
            const res = await fetch(`/api/creator/automation/rules/${ruleId}`, { method: 'DELETE' });
            if (res.ok) {
                toast.success('Rule deleted');
                fetchRules();
            }
        } catch (error) {
            toast.error('Failed to delete rule');
        }
    };

    return (
        <DashboardLayout>
            <div className="p-6 space-y-8 max-w-7xl mx-auto">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">AutoMessage Center</h1>
                    <p className="text-muted-foreground">Automate your Instagram & WhatsApp interactions with 1-click growth logic.</p>
                </div>

                <Tabs defaultValue="rules" className="space-y-6">
                    <TabsList className="bg-zinc-100/50 p-1">
                        <TabsTrigger value="rules" className="gap-2"><Zap className="h-4 w-4" /> Rules</TabsTrigger>
                        <TabsTrigger value="broadcast" className="gap-2"><MessageSquare className="h-4 w-4" /> Broadcast</TabsTrigger>
                        <TabsTrigger value="analytics" className="gap-2"><Loader2 className="h-4 w-4" /> Analytics</TabsTrigger>
                    </TabsList>

                    <TabsContent value="rules" className="space-y-6">
                        <div className="flex justify-between items-center">
                            <h2 className="text-xl font-semibold">Active Automations</h2>
                            <AutomationRuleModal onSuccess={fetchRules} />
                        </div>

                        <div className="grid gap-4">
                            {loading ? (
                                <div className="flex justify-center p-12"><Loader2 className="h-8 w-8 animate-spin" /></div>
                            ) : rules.length === 0 ? (
                                <Card className="border-dashed py-20">
                                    <div className="flex flex-col items-center justify-center space-y-4">
                                        <Zap className="h-12 w-12 text-muted-foreground opacity-20" />
                                        <p className="text-muted-foreground">No automation rules created yet.</p>
                                        <AutomationRuleModal onSuccess={fetchRules} />
                                    </div>
                                </Card>
                            ) : (
                                rules.map((rule) => (
                                    <Card key={rule._id} className="overflow-hidden border-zinc-200/60 shadow-sm hover:shadow-md transition-shadow">
                                        <CardContent className="p-0">
                                            <div className="p-5 flex items-start justify-between">
                                                <div className="space-y-3 flex-1">
                                                    <div className="flex items-center gap-3">
                                                        <span className="text-lg">
                                                            {rule.triggerType === 'comment' ? '💬' : '📩'}
                                                        </span>
                                                        <h3 className="font-bold text-zinc-900 leading-none">
                                                            {rule.triggerType === 'dm' && rule.keywords?.length > 0
                                                                ? `Keyword: "${rule.keywords.join(', ')}"`
                                                                : rule.triggerType.replace('_', ' ').toUpperCase()}
                                                        </h3>
                                                        <Badge variant="secondary" className={rule.isActive ? 'bg-emerald-50 text-emerald-700' : 'bg-zinc-100 text-zinc-500'}>
                                                            {rule.isActive ? 'Active' : 'Paused'}
                                                        </Badge>
                                                        {rule.followRequired && (
                                                            <Badge className="bg-indigo-600 text-white border-0">Follow Filter</Badge>
                                                        )}
                                                    </div>

                                                    <div className="text-sm text-zinc-600 line-clamp-1 bg-zinc-50/50 p-2 rounded border border-zinc-100 italic">
                                                        "{rule.replyText || rule.response}"
                                                    </div>

                                                    <div className="flex items-center gap-4 text-[11px] text-zinc-400 font-medium uppercase tracking-wider">
                                                        <span className="flex items-center gap-1"><Zap className="h-3 w-3" /> {rule.triggerCount || 0} Triggers</span>
                                                        <span className="w-1 h-1 bg-zinc-200 rounded-full" />
                                                        <span>{rule.attachmentType !== 'none' ? `Media: ${rule.attachmentType}` : 'Text only'}</span>
                                                    </div>
                                                </div>

                                                <div className="flex gap-1">
                                                    <AutomationRuleModal rule={rule} onSuccess={fetchRules} trigger={
                                                        <Button variant="ghost" size="icon" className="h-8 w-8 text-zinc-400 hover:text-zinc-600"><Edit className="h-4 w-4" /></Button>
                                                    } />
                                                    <Button variant="ghost" size="icon" onClick={() => handleDelete(rule._id)} className="h-8 w-8 text-red-300 hover:text-red-500 hover:bg-red-50"><Trash2 className="h-4 w-4" /></Button>
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>
                                ))
                            )}
                        </div>
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
            </div>
        </DashboardLayout>
    );
}
