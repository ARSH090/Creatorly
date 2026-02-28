'use client';

import { useEffect, useState } from 'react';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import { AutomationRuleModal } from '@/components/dashboard/automation-rule-modal';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Loader2, MessageSquare, Zap, Trash2, Edit } from 'lucide-react';
import { toast } from 'react-hot-toast';

export default function AutomationPage() {
    const [loading, setLoading] = useState(true);
    const [rules, setRules] = useState<any[]>([]);

    const fetchRules = async () => {
        try {
            const res = await fetch('/api/creator/automation/rules');
            const json = await res.json();
            if (res.ok) setRules(json.rules);
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
            const res = await fetch(`/api/creator/automation/rules/${ruleId}`, {
                method: 'DELETE'
            });
            if (res.ok) {
                toast.success('Rule deleted');
                fetchRules();
            } else {
                throw new Error('Failed to delete');
            }
        } catch (error) {
            toast.error('Failed to delete rule');
        }
    };

    return (
        <DashboardLayout>
            <div className="p-6 space-y-8">
                <div className="flex justify-between items-center">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">Automation Rules</h1>
                        <p className="text-muted-foreground">Manage automatic replies and triggers for Instagram</p>
                    </div>
                    <AutomationRuleModal onSuccess={fetchRules} />
                </div>

                <div className="grid gap-6">
                    {loading ? (
                        <div className="flex justify-center p-12">
                            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                        </div>
                    ) : rules.length === 0 ? (
                        <Card className="border-dashed">
                            <CardContent className="flex flex-col items-center justify-center p-12 space-y-4">
                                <Zap className="h-12 w-12 text-muted-foreground opacity-50" />
                                <div className="text-center">
                                    <h3 className="text-lg font-medium">No rules yet</h3>
                                    <p className="text-muted-foreground">Create your first automation rule to save time.</p>
                                </div>
                                <AutomationRuleModal onSuccess={fetchRules} />
                            </CardContent>
                        </Card>
                    ) : (
                        rules.map((rule) => (
                            <Card key={rule._id}>
                                <CardContent className="p-6">
                                    <div className="flex items-start justify-between">
                                        <div className="space-y-1">
                                            <div className="flex items-center space-x-2">
                                                <h3 className="font-semibold text-lg flex items-center">
                                                    {rule.platform === 'instagram' && <span className="mr-2">📸</span>}
                                                    {rule.trigger === 'keyword' ? `Keyword: "${rule.keywords?.join(', ')}"` :
                                                        rule.trigger === 'dm' ? 'Incoming DM' :
                                                            rule.trigger === 'comment' ? 'Post Comment' : 'Story Mention'}
                                                </h3>
                                                <Badge variant="outline" className={rule.isActive ? 'bg-green-50 text-green-700' : 'bg-gray-100 text-gray-500'}>
                                                    {rule.isActive ? 'Active' : 'Paused'}
                                                </Badge>
                                            </div>
                                            <div className="text-sm text-muted-foreground flex items-center mt-2">
                                                <MessageSquare className="h-4 w-4 mr-1" />
                                                Response: &quot;{rule.response?.substring(0, 60)}{rule.response?.length > 60 ? '...' : ''}&quot;
                                            </div>
                                            <p className="text-xs text-muted-foreground mt-1">
                                                To: {rule.action === 'auto_reply' ? 'Reply via DM' : rule.action} • Triggered: {rule.triggerCount} times
                                            </p>
                                        </div>
                                        <div className="flex space-x-2">
                                            <AutomationRuleModal
                                                rule={rule}
                                                onSuccess={fetchRules}
                                                trigger={
                                                    <Button variant="ghost" size="sm">
                                                        <Edit className="h-4 w-4" />
                                                    </Button>
                                                }
                                            />
                                            <Button variant="ghost" size="sm" onClick={() => handleDelete(rule._id)} className="text-red-600 hover:text-red-700 hover:bg-red-50">
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        ))
                    )}
                </div>
            </div>
        </DashboardLayout>
    );
}
