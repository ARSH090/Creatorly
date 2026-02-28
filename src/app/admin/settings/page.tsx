// @ts-nocheck
'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { Loader2, Save } from 'lucide-react';
import { toast } from 'react-hot-toast';

export default function SettingsPage() {
    const [settings, setSettings] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        const fetchSettings = async () => {
            try {
                const res = await fetch('/api/admin/settings');
                if (res.ok) {
                    const data = await res.json();
                    setSettings(data);
                }
            } catch (error) {
                console.error(error);
            } finally {
                setLoading(false);
            }
        };
        fetchSettings();
    }, []);

    const handleSave = async () => {
        setSaving(true);
        try {
            const res = await fetch('/api/admin/settings', {
                method: 'PUT',
                body: JSON.stringify(settings),
                headers: { 'Content-Type': 'application/json' }
            });
            if (res.ok) {
                toast.success('Settings updated');
            } else {
                toast.error('Failed to update settings');
            }
        } catch (error) {
            toast.error('Error saving settings');
        } finally {
            setSaving(false);
        }
    };

    if (loading) return <div className="p-8"><Loader2 className="animate-spin h-8 w-8" /></div>;
    if (!settings) return <div className="p-8">Failed to load settings</div>;

    return (
        <div className="space-y-6">
            <h1 className="text-3xl font-bold tracking-tight">Platform Settings</h1>

            <Tabs defaultValue="general">
                <TabsList>
                    <TabsTrigger value="general">General</TabsTrigger>
                    <TabsTrigger value="subscriptions">Subscriptions</TabsTrigger>
                    <TabsTrigger value="maintenance">Maintenance</TabsTrigger>
                </TabsList>

                <TabsContent value="general" className="space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>Global Configuration</CardTitle>
                            <CardDescription>General settings for the entire platform.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid gap-2">
                                <Label>Platform Fee (%)</Label>
                                <Input
                                    type="number"
                                    value={settings.platformFeePercent || 5}
                                    onChange={(e) => setSettings({ ...settings, platformFeePercent: parseFloat(e.target.value) })}
                                />
                                <p className="text-xs text-muted-foreground">Percentage taken from each transaction.</p>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="subscriptions" className="space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>Plan Pricing</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="grid gap-2">
                                    <Label>Creator Plan Price (Monthly)</Label>
                                    <Input
                                        type="number"
                                        value={settings.plans?.creator?.monthlyPrice || 0}
                                        onChange={(e) => setSettings({
                                            ...settings,
                                            plans: {
                                                ...settings.plans,
                                                creator: { ...settings.plans?.creator, monthlyPrice: parseFloat(e.target.value) }
                                            }
                                        })}
                                    />
                                </div>
                                <div className="grid gap-2">
                                    <Label>Creator Pro Plan Price (Monthly)</Label>
                                    <Input
                                        type="number"
                                        value={settings.plans?.creatorPro?.monthlyPrice || 0}
                                        onChange={(e) => setSettings({
                                            ...settings,
                                            plans: {
                                                ...settings.plans,
                                                creatorPro: { ...settings.plans?.creatorPro, monthlyPrice: parseFloat(e.target.value) }
                                            }
                                        })}
                                    />
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="maintenance" className="space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>System Status</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex items-center justify-between">
                                <div className="space-y-0.5">
                                    <Label className="text-base">Maintenance Mode</Label>
                                    <div className="text-sm text-muted-foreground">
                                        Disable access to the platform for all users.
                                    </div>
                                </div>
                                <Switch
                                    checked={settings.maintenanceMode || false}
                                    onCheckedChange={(c) => setSettings({ ...settings, maintenanceMode: c })}
                                />
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>

            <div className="flex justify-end">
                <Button onClick={handleSave} disabled={saving}>
                    {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    <Save className="mr-2 h-4 w-4" /> Save Changes
                </Button>
            </div>
        </div>
    );
}
