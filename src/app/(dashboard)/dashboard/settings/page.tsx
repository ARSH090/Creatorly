'use client';

import React, { useState } from 'react';
import {
    Settings, Bell, Shield, Globe, Zap,
    User, Mail, Link2, Monitor, CreditCard,
    Check, ArrowRight, Eye, EyeOff
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { toast } from 'react-hot-toast';
import { cn } from '@/lib/utils';

export default function SettingsPage() {
    const [loading, setLoading] = useState(false);
    const [showApiKey, setShowApiKey] = useState(false);

    const handleSave = () => {
        setLoading(true);
        toast.promise(
            new Promise((resolve) => setTimeout(resolve, 1500)),
            {
                loading: 'Synchronizing preferences...',
                success: 'Protocols updated successfully.',
                error: 'Synchronization failed. Retry requested.',
            }
        );
        setTimeout(() => setLoading(false), 1500);
    };

    return (
        <div className="max-w-5xl mx-auto space-y-12 pb-24 animate-in fade-in duration-700">
            <header className="space-y-4">
                <h1 className="text-5xl font-black text-white italic uppercase tracking-tighter flex items-center gap-4">
                    <Settings className="w-12 h-12 text-indigo-500 shadow-[0_0_30px_rgba(99,102,241,0.4)]" />
                    SYSTEM PREFERENCES
                </h1>
                <p className="text-[10px] font-black text-zinc-600 uppercase tracking-[0.4em] ml-16">
                    Core Configuration • Identity • Global Protocols
                </p>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
                <div className="lg:col-span-2 space-y-10">
                    {/* General Settings */}
                    <section className="bg-zinc-900/40 backdrop-blur-3xl rounded-[3rem] p-10 border border-white/5 relative overflow-hidden group">
                        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/5 blur-[100px] rounded-full -mr-16 -mt-16 group-hover:bg-indigo-500/10 transition-all duration-700" />

                        <div className="relative z-10 space-y-10">
                            <div className="flex items-center gap-5">
                                <div className="p-4 bg-indigo-500/10 rounded-2xl border border-indigo-500/20">
                                    <Globe className="w-6 h-6 text-indigo-400" />
                                </div>
                                <div>
                                    <h3 className="text-2xl font-black text-white italic uppercase tracking-tight">IDENTITY PIPELINE</h3>
                                    <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mt-1">Store Slug • Localization • Custom Domain</p>
                                </div>
                            </div>

                            <div className="space-y-8 pl-4 border-l-2 border-indigo-500/20">
                                <div className="space-y-3">
                                    <label className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.2em] ml-1">Creator URL</label>
                                    <div className="flex group/input">
                                        <div className="bg-black/60 border border-white/10 border-r-0 rounded-l-2xl px-6 py-4 text-zinc-500 font-black text-xs italic flex items-center">
                                            creatorly.in/
                                        </div>
                                        <Input
                                            value="john-doe"
                                            disabled
                                            className="flex-1 bg-black/40 border-white/10 rounded-r-2xl h-14 px-6 text-zinc-400 font-black italic cursor-not-allowed border-l-0 focus:ring-0"
                                        />
                                    </div>
                                    <p className="text-[9px] font-bold text-zinc-600 uppercase tracking-widest ml-1 italic">Identity slug is immutable once initialized.</p>
                                </div>

                                <div className="space-y-3">
                                    <label className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.2em] ml-1">Support Email</label>
                                    <Input
                                        placeholder="SUPPORT@CREATOR.COM"
                                        className="bg-black/40 border-white/10 rounded-2xl h-14 px-6 text-white font-black italic focus:ring-indigo-500/20 transition-all"
                                    />
                                </div>
                            </div>
                        </div>
                    </section>

                    {/* API & Dev Settings */}
                    <section className="bg-zinc-900/40 backdrop-blur-3xl rounded-[3rem] p-10 border border-white/5">
                        <div className="space-y-10">
                            <div className="flex items-center gap-5">
                                <div className="p-4 bg-amber-500/10 rounded-2xl border border-amber-500/20">
                                    <Zap className="w-6 h-6 text-amber-400" />
                                </div>
                                <div>
                                    <h3 className="text-2xl font-black text-white italic uppercase tracking-tight">DEVELOPER ARTIFACTS</h3>
                                    <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mt-1">API Integrations • Webhook Sensors</p>
                                </div>
                            </div>

                            <div className="space-y-6">
                                <div className="bg-black/40 rounded-[2rem] border border-white/5 p-8 flex items-center justify-between group hover:border-amber-500/20 transition-all">
                                    <div className="space-y-2">
                                        <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest italic">Secret Key</p>
                                        <div className="flex items-center gap-3">
                                            <code className="text-white font-black italic tracking-widest text-sm">
                                                {showApiKey ? 'crly_live_67a8b9c0d1e2f3g4h5i6j7k8' : '••••••••••••••••••••••••••••'}
                                            </code>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                onClick={() => setShowApiKey(!showApiKey)}
                                                className="text-zinc-500 hover:text-white"
                                            >
                                                {showApiKey ? <EyeOff size={16} /> : <Eye size={16} />}
                                            </Button>
                                        </div>
                                    </div>
                                    <Badge className="bg-amber-500/10 text-amber-500 border border-amber-500/20 px-4 py-1.5 rounded-lg text-[9px] font-black tracking-widest">LIVE KEY</Badge>
                                </div>
                            </div>
                        </div>
                    </section>
                </div>

                {/* Right: Security & Quick Info */}
                <div className="space-y-8">
                    <section className="bg-zinc-900/40 backdrop-blur-2xl rounded-[3rem] p-8 border border-white/5 space-y-8">
                        <div className="flex items-center gap-3">
                            <Shield className="w-5 h-5 text-emerald-400" />
                            <h3 className="text-[10px] font-black text-white uppercase tracking-[0.3em]">SECURITY PROTOCOLS</h3>
                        </div>

                        <div className="space-y-6">
                            <div className="flex items-center justify-between group">
                                <div className="space-y-1">
                                    <p className="text-[11px] font-black text-zinc-300 uppercase tracking-widest italic">2FA Initialization</p>
                                    <p className="text-[9px] font-bold text-zinc-600 uppercase tracking-widest">Extra layer of encryption</p>
                                </div>
                                <Switch className="data-[state=checked]:bg-indigo-500" />
                            </div>

                            <div className="flex items-center justify-between group">
                                <div className="space-y-1">
                                    <p className="text-[11px] font-black text-zinc-300 uppercase tracking-widest italic">Login Notifications</p>
                                    <p className="text-[9px] font-bold text-zinc-600 uppercase tracking-widest">Access telemetry alerts</p>
                                </div>
                                <Switch defaultChecked className="data-[state=checked]:bg-indigo-500" />
                            </div>
                        </div>

                        <Button className="w-full bg-white/5 text-white border border-white/10 h-14 rounded-2xl font-black uppercase text-[10px] tracking-widest hover:bg-white/10 transition-all">
                            VERIFY SECURITY REPUTATION
                        </Button>
                    </section>

                    <div className="p-1 text-center">
                        <p className="text-[9px] font-black text-zinc-700 uppercase tracking-[0.4em] italic leading-loose">
                            More config slots arriving in next update cyclic batch. 🚀
                        </p>
                    </div>
                </div>
            </div>

            <footer className="pt-8 border-t border-white/5 flex justify-end">
                <Button
                    onClick={handleSave}
                    disabled={loading}
                    className="bg-indigo-600 text-white h-16 px-12 rounded-[2rem] font-black uppercase text-xs tracking-[0.2em] italic hover:scale-105 transition-all shadow-2xl shadow-indigo-600/30"
                >
                    {loading ? 'INITIALIZING SYNC...' : 'INITIALIZE PROTOCOLS'}
                </Button>
            </footer>
        </div>
    );
}
