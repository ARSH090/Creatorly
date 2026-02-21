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
        <div className="space-y-12">
            <h1 className="text-4xl font-black text-white tracking-tighter italic uppercase flex items-center gap-4">
                <div className="w-3 h-10 bg-indigo-500 rounded-full shadow-[0_0_15px_rgba(99,102,241,0.3)]" />
                SYSTEM CONTROL
            </h1>

            <Tabs defaultValue="general" className="w-full">
                <TabsList className="bg-zinc-900/50 p-1 border border-white/5 rounded-2xl mb-8">
                    <TabsTrigger value="general" className="px-8 py-3 rounded-xl uppercase font-black text-[10px] tracking-widest data-[state=active]:bg-zinc-800">Parameters</TabsTrigger>
                    <TabsTrigger value="subscriptions" className="px-8 py-3 rounded-xl uppercase font-black text-[10px] tracking-widest data-[state=active]:bg-zinc-800">Financials</TabsTrigger>
                    <TabsTrigger value="governance" className="px-8 py-3 rounded-xl uppercase font-black text-[10px] tracking-widest data-[state=active]:bg-zinc-800">Governance</TabsTrigger>
                    <TabsTrigger value="maintenance" className="px-8 py-3 rounded-xl uppercase font-black text-[10px] tracking-widest data-[state=active]:bg-zinc-800">Security</TabsTrigger>
                </TabsList>

                <TabsContent value="general" className="space-y-8">
                    <Card className="bg-zinc-900/40 border-white/5 rounded-[2.5rem] shadow-2xl backdrop-blur-sm overflow-hidden">
                        <CardHeader className="bg-white/[0.02] px-10 py-8 border-b border-white/5">
                            <CardTitle className="text-xl font-black text-white uppercase tracking-tighter italic flex items-center gap-3">
                                <div className="w-2 h-6 bg-indigo-500 rounded-full" />
                                Operational Constants
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="px-10 py-10 space-y-8">
                            <div className="grid gap-4 max-w-md">
                                <Label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-1">Platform Surcharge (%)</Label>
                                <Input
                                    type="number"
                                    className="bg-black/40 border-white/5 rounded-2xl h-14 text-white font-black tracking-tighter italic text-lg"
                                    value={settings.commissionRate || 10}
                                    onChange={(e) => setSettings({ ...settings, commissionRate: parseFloat(e.target.value) })}
                                />
                                <p className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest">Calculated per atomic transaction.</p>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="subscriptions" className="space-y-8">
                    <Card className="bg-zinc-900/40 border-white/5 rounded-[2.5rem] shadow-2xl backdrop-blur-sm overflow-hidden">
                        <CardHeader className="bg-white/[0.02] px-10 py-8 border-b border-white/5">
                            <CardTitle className="text-xl font-black text-white uppercase tracking-tighter italic flex items-center gap-3">
                                <div className="w-2 h-6 bg-emerald-500 rounded-full" />
                                Revenue Architecture
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="px-10 py-10 space-y-10">
                            <div className="grid grid-cols-2 gap-10">
                                <div className="grid gap-4">
                                    <Label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-1">Creator Tier (Monthly)</Label>
                                    <Input
                                        type="number"
                                        className="bg-black/40 border-white/5 rounded-2xl h-14 text-white font-black tracking-tighter italic text-lg"
                                        value={settings.subscriptionPlans?.monthly?.price || 0}
                                        onChange={(e) => setSettings({
                                            ...settings,
                                            subscriptionPlans: {
                                                ...settings.subscriptionPlans,
                                                monthly: { ...settings.subscriptionPlans?.monthly, price: parseFloat(e.target.value) }
                                            }
                                        })}
                                    />
                                </div>
                                <div className="grid gap-4">
                                    <Label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-1">Elite Tier (Yearly)</Label>
                                    <Input
                                        type="number"
                                        className="bg-black/40 border-white/5 rounded-2xl h-14 text-white font-black tracking-tighter italic text-lg"
                                        value={settings.subscriptionPlans?.yearly?.price || 0}
                                        onChange={(e) => setSettings({
                                            ...settings,
                                            subscriptionPlans: {
                                                ...settings.subscriptionPlans,
                                                yearly: { ...settings.subscriptionPlans?.yearly, price: parseFloat(e.target.value) }
                                            }
                                        })}
                                    />
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="governance" className="space-y-8">
                    <div className="grid lg:grid-cols-2 gap-8">
                        {/* Feature Toggles */}
                        <Card className="bg-zinc-900/40 border-white/5 rounded-[2.5rem] shadow-2xl backdrop-blur-sm overflow-hidden">
                            <CardHeader className="bg-white/[0.02] px-10 py-8 border-b border-white/5">
                                <CardTitle className="text-xl font-black text-white uppercase tracking-tighter italic flex items-center gap-3">
                                    <div className="w-2 h-6 bg-indigo-500 rounded-full" />
                                    Feature Oversight
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="px-10 py-10 space-y-6">
                                <div className="flex items-center justify-between p-6 bg-black/20 rounded-2xl border border-white/5">
                                    <Label className="font-bold text-sm text-zinc-300 uppercase tracking-widest">AI Generation</Label>
                                    <Switch
                                        checked={settings.featureToggles?.aiEnabled ?? true}
                                        onCheckedChange={(c) => setSettings({
                                            ...settings,
                                            featureToggles: { ...settings.featureToggles, aiEnabled: c }
                                        })}
                                    />
                                </div>
                                <div className="flex items-center justify-between p-6 bg-black/20 rounded-2xl border border-white/5">
                                    <Label className="font-bold text-sm text-zinc-300 uppercase tracking-widest">Booking System</Label>
                                    <Switch
                                        checked={settings.featureToggles?.bookingEnabled ?? true}
                                        onCheckedChange={(c) => setSettings({
                                            ...settings,
                                            featureToggles: { ...settings.featureToggles, bookingEnabled: c }
                                        })}
                                    />
                                </div>
                            </CardContent>
                        </Card>

                        {/* Announcement Banner */}
                        <Card className="bg-zinc-900/40 border-white/5 rounded-[2.5rem] shadow-2xl backdrop-blur-sm overflow-hidden">
                            <CardHeader className="bg-white/[0.02] px-10 py-8 border-b border-white/5">
                                <CardTitle className="text-xl font-black text-white uppercase tracking-tighter italic flex items-center gap-3">
                                    <div className="w-2 h-6 bg-amber-500 rounded-full" />
                                    Broadcast Banner
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="px-10 py-10 space-y-6">
                                <div className="flex items-center justify-between mb-4">
                                    <Label className="font-bold text-sm text-zinc-300 uppercase tracking-widest">Active Status</Label>
                                    <Switch
                                        checked={settings.announcementBanner?.enabled || false}
                                        onCheckedChange={(c) => setSettings({
                                            ...settings,
                                            announcementBanner: { ...settings.announcementBanner, enabled: c }
                                        })}
                                    />
                                </div>
                                <div className="space-y-4">
                                    <Label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Banner Message</Label>
                                    <Input
                                        className="bg-black/40 border-white/5 rounded-xl text-white font-medium"
                                        placeholder="Enter transmission message..."
                                        value={settings.announcementBanner?.text || ''}
                                        onChange={(e) => setSettings({
                                            ...settings,
                                            announcementBanner: { ...settings.announcementBanner, text: e.target.value }
                                        })}
                                    />
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </TabsContent>

                <TabsContent value="maintenance" className="space-y-8">
                    <Card className="bg-zinc-900/40 border-white/5 rounded-[2.5rem] shadow-2xl backdrop-blur-sm overflow-hidden border-rose-500/10">
                        <CardHeader className="bg-rose-500/5 px-10 py-8 border-b border-rose-500/10">
                            <CardTitle className="text-xl font-black text-rose-500 uppercase tracking-tighter italic flex items-center gap-3">
                                <div className="w-2 h-6 bg-rose-500 rounded-full animate-pulse" />
                                Lockdown Protocol
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="px-10 py-10">
                            <div className="flex items-center justify-between bg-black/20 p-8 rounded-3xl border border-white/5">
                                <div className="space-y-2">
                                    <Label className="text-lg font-black text-white italic tracking-tight">Maintenance Isolation</Label>
                                    <p className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest">
                                        Immediately disconnect all non-admin traffic.
                                    </p>
                                </div>
                                <Switch
                                    checked={settings.maintenanceMode || false}
                                    onCheckedChange={(c) => setSettings({ ...settings, maintenanceMode: c })}
                                    className="data-[state=checked]:bg-rose-600 h-8 w-14"
                                />
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>

            <div className="flex justify-end pt-8">
                <Button onClick={handleSave} disabled={saving} className="bg-indigo-600 hover:bg-indigo-500 text-white font-black uppercase tracking-[0.2em] h-16 px-12 rounded-2xl shadow-2xl shadow-indigo-500/20 transition-all active:scale-95">
                    {saving && <Loader2 className="mr-2 h-6 w-6 animate-spin" />}
                    <Save className="mr-3 h-6 w-6" /> Save New Protocol
                </Button>
            </div>
        </div>
    );
}
