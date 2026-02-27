'use client';

import React, { useState, useEffect } from 'react';
import { Settings, Bell, Shield, Globe, Zap, Loader2, CheckCircle2, AlertCircle, ExternalLink, ShieldAlert } from 'lucide-react';
import { toast } from 'react-hot-toast';

export default function SettingsPage() {
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const [settings, setSettings] = useState<any>({
        autoSendEnabled: true,
        googleSheetsConnected: false,
        notificationPrefs: { email: true, whatsapp: false },
        storeSlug: ''
    });

    useEffect(() => {
        fetchSettings();
    }, []);

    const fetchSettings = async () => {
        try {
            const res = await fetch('/api/creator/settings');
            if (res.ok) {
                const data = await res.json();
                setSettings(data);
            }
        } catch (error) {
            console.error('Failed to fetch settings:', error);
        } finally {
            setLoading(false);
        }
    };

    const updateSetting = async (key: string, value: any) => {
        try {
            setSaving(true);
            const newSettings = { ...settings };
            if (key.includes('.')) {
                const [parent, child] = key.split('.');
                newSettings[parent][child] = value;
            } else {
                newSettings[key] = value;
            }

            const res = await fetch('/api/creator/settings', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(newSettings)
            });

            if (res.ok) {
                setSettings(newSettings);
                toast.success('Settings updated');
            } else {
                toast.error('Failed to update settings');
            }
        } catch (error) {
            toast.error('Network error');
        } finally {
            setSaving(false);
        }
    };

    const handleDeleteStore = async () => {
        if (!confirm('Are you absolutely sure you want to delete your store? This action cannot be undone and will permanently delete your storefront data.')) return;
        try {
            setIsDeleting(true);
            const res = await fetch('/api/creator/store/delete', { method: 'DELETE' });
            if (res.ok) {
                toast.success('Store deleted successfully');
                window.location.href = '/dashboard';
            } else {
                toast.error('Failed to delete store');
            }
        } catch (error) {
            toast.error('An error occurred while deleting store');
        } finally {
            setIsDeleting(false);
        }
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[400px]">
                <Loader2 className="w-12 h-12 text-indigo-500 animate-spin mb-4" />
                <p className="text-zinc-500 font-bold uppercase tracking-widest text-xs">Accessing Neural Settings...</p>
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in duration-700">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-black text-white mb-2 uppercase italic tracking-tighter">System Configuration</h1>
                    <p className="text-zinc-500 font-medium">Manage your digital presence and automation protocols.</p>
                </div>
                {saving && (
                    <div className="flex items-center gap-2 text-indigo-400 text-[10px] font-black uppercase tracking-widest bg-indigo-500/10 px-4 py-2 rounded-full border border-indigo-500/20">
                        <Loader2 className="w-3 h-3 animate-spin" />
                        Syncing...
                    </div>
                )}
            </div>

            <div className="space-y-6">
                {/* General Settings */}
                <div className="bg-zinc-900/50 rounded-[2.5rem] border border-white/5 overflow-hidden">
                    <div className="p-8 border-b border-white/5">
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-indigo-500/10 rounded-2xl border border-indigo-500/20">
                                <Globe className="w-6 h-6 text-indigo-400" />
                            </div>
                            <div>
                                <h3 className="text-lg font-bold text-white uppercase italic tracking-tight">Identity & Reach</h3>
                                <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mt-0.5">Global Identification Markers</p>
                            </div>
                        </div>
                    </div>

                    <div className="p-8 space-y-8">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div className="space-y-3">
                                <label className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em] ml-1">Store / Display Name</label>
                                <div className="flex group">
                                    <input
                                        type="text"
                                        value={settings?.settings?.profile?.displayName || settings.displayName || ''}
                                        onChange={(e) => {
                                            const val = e.target.value;
                                            if (settings?.settings?.profile) {
                                                setSettings({
                                                    ...settings,
                                                    settings: {
                                                        ...settings.settings,
                                                        profile: { ...settings.settings.profile, displayName: val }
                                                    }
                                                });
                                            } else {
                                                setSettings({ ...settings, displayName: val });
                                            }
                                        }}
                                        className="flex-1 bg-black border border-white/5 rounded-l-2xl px-5 py-4 text-white text-sm font-bold transition-all focus:outline-none focus:border-indigo-500/50"
                                    />
                                    <button
                                        onClick={async () => {
                                            try {
                                                setSaving(true);
                                                const name = settings?.settings?.profile?.displayName || settings.displayName || '';
                                                const res = await fetch('/api/creator/profile', {
                                                    method: 'PATCH',
                                                    headers: { 'Content-Type': 'application/json' },
                                                    body: JSON.stringify({ displayName: name })
                                                });
                                                if (res.ok) {
                                                    toast.success('Store name updated successfully!');
                                                } else {
                                                    toast.error('Failed to update store name');
                                                }
                                            } catch (error) {
                                                toast.error('Network error');
                                            } finally {
                                                setSaving(false);
                                            }
                                        }}
                                        className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-r-2xl px-6 py-4 text-[10px] font-black uppercase tracking-[0.2em] transition-colors"
                                    >
                                        Update
                                    </button>
                                </div>
                            </div>

                            <div className="space-y-3">
                                <label className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em] ml-1">Universal Store Slug</label>
                                <div className="flex group">
                                    <span className="bg-zinc-800/80 border border-white/10 border-r-0 rounded-l-2xl px-5 py-4 text-zinc-500 text-sm font-bold">creatorly.in/</span>
                                    <input
                                        type="text"
                                        value={settings?.settings?.profile?.storeSlug || settings.storeSlug || ''}
                                        onChange={(e) => {
                                            const val = e.target.value.toLowerCase().replace(/[^a-z0-9_-]/g, '');
                                            if (settings?.settings?.profile) {
                                                setSettings({
                                                    ...settings,
                                                    settings: {
                                                        ...settings.settings,
                                                        profile: { ...settings.settings.profile, storeSlug: val }
                                                    }
                                                });
                                            } else {
                                                setSettings({ ...settings, storeSlug: val });
                                            }
                                        }}
                                        className="flex-1 bg-black border border-white/5 px-5 py-4 text-white text-sm font-bold transition-all focus:outline-none focus:border-indigo-500/50"
                                    />
                                    <button
                                        onClick={async () => {
                                            try {
                                                setSaving(true);
                                                const slug = settings?.settings?.profile?.storeSlug || settings.storeSlug || '';
                                                const res = await fetch('/api/user/update-username', {
                                                    method: 'POST',
                                                    headers: { 'Content-Type': 'application/json' },
                                                    body: JSON.stringify({ username: slug })
                                                });
                                                const data = await res.json();
                                                if (res.ok) {
                                                    toast.success('Store slug updated successfully!');
                                                    // Invalidate queries / refresh cache
                                                    window.location.reload();
                                                } else {
                                                    toast.error(data.error || 'Failed to update store slug');
                                                }
                                            } catch (error) {
                                                toast.error('Network error while updating slug');
                                            } finally {
                                                setSaving(false);
                                            }
                                        }}
                                        className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-r-2xl px-6 py-4 text-[10px] font-black uppercase tracking-[0.2em] transition-colors"
                                    >
                                        Update
                                    </button>
                                </div>
                                <p className="text-[9px] text-zinc-600 font-bold uppercase tracking-widest flex items-center gap-1.5 ml-1">
                                    <CheckCircle2 size={10} className="text-emerald-500" />
                                    Slug update will instantly migrate your storefront
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Automation & Connectivity */}
                <div className="bg-zinc-900/50 rounded-[2.5rem] border border-white/5 overflow-hidden">
                    <div className="p-8 border-b border-white/5">
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-amber-500/10 rounded-2xl border border-amber-500/20">
                                <Zap className="w-6 h-6 text-amber-400" />
                            </div>
                            <div>
                                <h3 className="text-lg font-bold text-white uppercase italic tracking-tight">Neural Protocols</h3>
                                <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mt-0.5">Automation & External Integration</p>
                            </div>
                        </div>
                    </div>

                    <div className="p-8 space-y-8 divide-y divide-white/5">
                        {/* Auto DM */}
                        <div className="flex items-center justify-between pb-8">
                            <div className="space-y-1">
                                <h4 className="text-sm font-bold text-white uppercase italic tracking-tight">Auto-DM Status</h4>
                                <p className="text-[10px] font-medium text-zinc-500 uppercase tracking-widest">Toggle global Instagram automation engine</p>
                            </div>
                            <button
                                onClick={() => updateSetting('autoSendEnabled', !settings.autoSendEnabled)}
                                className={`w-14 h-8 rounded-full transition-all duration-500 p-1 relative ${settings.autoSendEnabled ? 'bg-indigo-600' : 'bg-zinc-800'}`}
                            >
                                <div className={`w-6 h-6 rounded-full bg-white shadow-xl transition-all duration-500 transform ${settings.autoSendEnabled ? 'translate-x-6' : 'translate-x-0'}`} />
                            </button>
                        </div>

                        {/* Google Sheets */}
                        <div className="py-8 space-y-4">
                            <div className="flex items-center justify-between">
                                <div className="space-y-1">
                                    <h4 className="text-sm font-bold text-white uppercase italic tracking-tight">Google Sheets Data Pulse</h4>
                                    <p className="text-[10px] font-medium text-zinc-500 uppercase tracking-widest">Synchonize leads with your external spreadsheets</p>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border ${settings.googleSheetsConnected ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-zinc-800 text-zinc-500 border-white/5'}`}>
                                        {settings.googleSheetsConnected ? 'Pulse Active' : 'Disconnected'}
                                    </span>
                                </div>
                            </div>

                            <div className="flex gap-3">
                                <input
                                    type="text"
                                    placeholder="Enter your Google Sheet URL..."
                                    className="flex-1 bg-black border border-white/10 rounded-2xl px-5 py-4 text-white text-sm focus:outline-none focus:border-indigo-500/50 transition-all"
                                    value={settings.googleSheetUrl || ''}
                                    onChange={(e) => setSettings({ ...settings, googleSheetUrl: e.target.value })}
                                />
                                <button
                                    onClick={() => updateSetting('googleSheetUrl', settings.googleSheetUrl)}
                                    className="bg-white text-black px-6 py-4 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] hover:bg-zinc-200 transition-colors"
                                >
                                    Connect
                                </button>
                            </div>
                        </div>

                        {/* Webhook (Data Pulse) */}
                        <div className="py-8 space-y-4">
                            <div className="flex items-center justify-between">
                                <div className="space-y-1">
                                    <h4 className="text-sm font-bold text-white uppercase italic tracking-tight">Neural Webhook (Beta)</h4>
                                    <p className="text-[10px] font-medium text-zinc-500 uppercase tracking-widest">Push events to your custom endpoints in real-time</p>
                                </div>
                            </div>

                            <div className="flex gap-3">
                                <input
                                    type="text"
                                    placeholder="https://your-api.com/webhook"
                                    className="flex-1 bg-black border border-white/10 rounded-2xl px-5 py-4 text-white text-sm font-mono focus:outline-none focus:border-amber-500/50 transition-all"
                                    value={settings.webhookUrl || ''}
                                    onChange={(e) => setSettings({ ...settings, webhookUrl: e.target.value })}
                                />
                                <button
                                    onClick={() => updateSetting('webhookUrl', settings.webhookUrl)}
                                    className="bg-amber-500 text-black px-6 py-4 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] hover:bg-amber-400 transition-colors"
                                >
                                    Test
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* System Logs / Terminal */}
                <div className="bg-black border border-white/5 rounded-[2.5rem] overflow-hidden">
                    <div className="p-6 border-b border-white/5 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                            <h3 className="text-xs font-black text-emerald-500 uppercase tracking-[0.3em]">System Terminal</h3>
                        </div>
                        <div className="flex gap-1.5">
                            <div className="w-2 h-2 rounded-full bg-zinc-800" />
                            <div className="w-2 h-2 rounded-full bg-zinc-800" />
                            <div className="w-2 h-2 rounded-full bg-zinc-800" />
                        </div>
                    </div>
                    <div className="p-8 font-mono text-[10px] text-zinc-400 h-48 overflow-y-auto space-y-2 bg-[#050505]">
                        <p><span className="text-emerald-500">[SYSTEM]</span> Authentication sequence established...</p>
                        <p><span className="text-emerald-500">[SYSTEM]</span> Instagram Engine: <span className="text-white">STANDBY</span></p>
                        <p><span className="text-zinc-600">[DEBUG]</span> Fetching user configuration from shard-0...</p>
                        <p><span className="text-emerald-500">[SYSTEM]</span> Neural link initialized at path /settings</p>
                        <p><span className="text-zinc-500 transition-opacity animate-pulse">_</span></p>
                    </div>
                </div>

                {/* Communication Matrix */}
                <div className="bg-zinc-900/50 rounded-[2.5rem] border border-white/5 overflow-hidden">
                    <div className="p-8 border-b border-white/5">
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-indigo-500/10 rounded-2xl border border-indigo-500/20">
                                <Bell className="w-6 h-6 text-indigo-400" />
                            </div>
                            <div>
                                <h3 className="text-lg font-bold text-white uppercase italic tracking-tight">Communication Matrix</h3>
                                <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mt-0.5">Platform Feedback Channels</p>
                            </div>
                        </div>
                    </div>

                    <div className="p-8 space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div
                                onClick={() => updateSetting('notificationPrefs.email', !settings.notificationPrefs.email)}
                                className={`p-6 rounded-[2rem] border transition-all cursor-pointer group ${settings.notificationPrefs.email ? 'bg-indigo-500/5 border-indigo-500/20' : 'bg-black/20 border-white/5 hover:border-white/10'}`}
                            >
                                <div className="flex items-center justify-between mb-4">
                                    <div className={`p-3 rounded-xl transition-colors ${settings.notificationPrefs.email ? 'bg-indigo-500/10 text-indigo-400' : 'bg-zinc-800 text-zinc-500'}`}>
                                        <Bell size={18} />
                                    </div>
                                    <div className={`w-2 h-2 rounded-full ${settings.notificationPrefs.email ? 'bg-indigo-400 animate-pulse' : 'bg-zinc-700'}`} />
                                </div>
                                <h5 className="font-black text-white text-xs uppercase italic mb-1">Email Matrix</h5>
                                <p className="text-[10px] font-medium text-zinc-600 uppercase tracking-widest">Broadcasts to primary inbox</p>
                            </div>

                            <div
                                onClick={() => updateSetting('notificationPrefs.whatsapp', !settings.notificationPrefs.whatsapp)}
                                className={`p-6 rounded-[2rem] border transition-all cursor-pointer group ${settings.notificationPrefs.whatsapp ? 'bg-emerald-500/5 border-emerald-500/20' : 'bg-black/20 border-white/5 hover:border-white/10'}`}
                            >
                                <div className="flex items-center justify-between mb-4">
                                    <div className={`p-3 rounded-xl transition-colors ${settings.notificationPrefs.whatsapp ? 'bg-emerald-500/10 text-emerald-400' : 'bg-zinc-800 text-zinc-500'}`}>
                                        <Zap size={18} />
                                    </div>
                                    <div className={`w-2 h-2 rounded-full ${settings.notificationPrefs.whatsapp ? 'bg-emerald-400 animate-pulse' : 'bg-zinc-700'}`} />
                                </div>
                                <h5 className="font-black text-white text-xs uppercase italic mb-1">WhatsApp Stream</h5>
                                <p className="text-[10px] font-medium text-zinc-600 uppercase tracking-widest">Real-time mobile resonance</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Danger Zone */}
                <div className="bg-red-500/5 rounded-[2.5rem] border border-red-500/20 overflow-hidden mt-8">
                    <div className="p-8 border-b border-red-500/10">
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-red-500/10 rounded-2xl border border-red-500/20">
                                <ShieldAlert className="w-6 h-6 text-red-500" />
                            </div>
                            <div>
                                <h3 className="text-lg font-bold text-white uppercase italic tracking-tight">Danger Zone</h3>
                                <p className="text-[10px] font-bold text-red-500 uppercase tracking-widest mt-0.5">Irreversible Actions</p>
                            </div>
                        </div>
                    </div>

                    <div className="p-8 space-y-6 flex items-center justify-between">
                        <div>
                            <h4 className="text-sm font-bold text-white uppercase italic tracking-tight">Delete Storefront</h4>
                            <p className="text-[10px] font-medium text-zinc-500 uppercase tracking-widest max-w-sm mt-1">Permanently delete your public storefront and reset your store slug. Your products will remain but will not be publicly accessible.</p>
                        </div>
                        <button
                            onClick={handleDeleteStore}
                            disabled={isDeleting}
                            className="bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-red-500 px-6 py-4 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] transition-all disabled:opacity-50"
                        >
                            {isDeleting ? 'Deleting...' : 'Delete Store'}
                        </button>
                    </div>
                </div>
            </div>

            <div className="flex items-center justify-center gap-6 py-12 opacity-50 grayscale hover:grayscale-0 hover:opacity-100 transition-all duration-700">
                <div className="flex -space-x-3">
                    {[1, 2, 3].map(i => (
                        <div key={i} className="w-8 h-8 rounded-full bg-zinc-800 border-2 border-black" />
                    ))}
                </div>
                <p className="text-[10px] font-black uppercase tracking-[0.3em] text-zinc-500">End-to-End Encryption Sequence Active</p>
            </div>
        </div>
    );
}
