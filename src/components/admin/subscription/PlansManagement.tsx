'use client';

import React, { useState, useEffect } from 'react';
import {
    Plus, Edit2, Trash2, Copy, Archive,
    Zap, Shield, Globe, Users, Database,
    Activity, Check, X, AlertTriangle,
    LayoutGrid, ChevronRight, Crown
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from '@/components/ui/dialog';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { PlanTier, BillingPeriod } from '@/lib/models/plan.types';
import { TableSkeleton } from '@/components/ui/skeleton-loaders';
import { toast } from 'react-hot-toast';
import { cn } from '@/lib/utils';

export default function PlansManagement() {
    const [plans, setPlans] = useState([]);
    const [loading, setLoading] = useState(true);
    const [open, setOpen] = useState(false);
    const [editingPlan, setEditingPlan] = useState<any>(null);

    const initialFormState: any = {
        name: '',
        description: '',
        tier: PlanTier.FREE,
        billingPeriod: [BillingPeriod.MONTHLY],
        monthlyPrice: 0,
        yearlyPrice: 0,
        maxUsers: 1,
        maxStorageMb: 100,
        maxApiCalls: 1000,
        rateLimitPerMin: 10,
        hasAnalytics: false,
        hasPrioritySupport: false,
        hasCustomDomain: false,
        hasTeamCollaboration: false,
        hasWebhooks: false,
        isActive: true,
        isVisible: true,
        sortOrder: 0
    };

    const [formData, setFormData] = useState(initialFormState);

    useEffect(() => {
        fetchPlans();
    }, []);

    const fetchPlans = async () => {
        try {
            setLoading(true);
            const res = await fetch('/api/admin/plans');
            const data = await res.json();
            if (data.plans) setPlans(data.plans);
        } catch (err) {
            toast.error('Failed to sync tier logic');
        } finally {
            setLoading(false);
        }
    };

    const handleOpen = (plan: any = null) => {
        if (plan) {
            setEditingPlan(plan);
            setFormData(plan);
        } else {
            setEditingPlan(null);
            setFormData(initialFormState);
        }
        setOpen(true);
    };

    const handleSubmit = async () => {
        try {
            const method = editingPlan ? 'PUT' : 'POST';
            const url = editingPlan ? `/api/admin/plans/${editingPlan._id}` : '/api/admin/plans';

            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });

            if (!res.ok) throw new Error('Protocol Error');

            toast.success('Tier Definition Recompiled');
            setOpen(false);
            fetchPlans();
        } catch (err: any) {
            toast.error('Definition Error: Protocol Rejected');
        }
    };

    return (
        <div className="space-y-10 animate-in fade-in duration-700">
            <header className="flex items-center justify-between">
                <div className="space-y-1">
                    <h2 className="text-2xl font-black text-white italic uppercase tracking-tighter">TIER ARCHITECTURE</h2>
                    <p className="text-[10px] font-black text-zinc-600 uppercase tracking-widest">Protocol Definitions & Access Tunnels</p>
                </div>
                <Button
                    onClick={() => handleOpen()}
                    className="bg-white text-black font-black uppercase text-[10px] tracking-[0.2em] rounded-2xl h-14 px-8 hover:scale-105 transition-all shadow-xl shadow-white/5"
                >
                    <Plus className="w-4 h-4 mr-3" />
                    Inject New Tier
                </Button>
            </header>

            {loading ? (
                <TableSkeleton rows={6} />
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
                    {plans.map((plan: any) => (
                        <div key={plan._id} className="bg-zinc-900/40 backdrop-blur-xl border border-white/5 rounded-[3rem] p-10 flex flex-col justify-between group hover:border-white/10 transition-all relative overflow-hidden h-[600px]">
                            {/* Decorative element */}
                            <div className="absolute -right-10 -top-10 opacity-5 group-hover:opacity-10 transition-opacity">
                                <Crown className="w-64 h-64 text-white" />
                            </div>

                            <div className="space-y-8 relative z-10">
                                <div className="flex items-start justify-between">
                                    <div className="space-y-2">
                                        <Badge variant="outline" className="border-indigo-500/30 text-indigo-400 font-black italic text-[9px] px-3 py-1 tracking-[0.2em] uppercase">
                                            {plan.tier}
                                        </Badge>
                                        <h3 className="text-3xl font-black text-white italic uppercase tracking-tighter">{plan.name}</h3>
                                    </div>
                                    <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-500 translate-y-2 group-hover:translate-y-0">
                                        <Button variant="ghost" size="icon" onClick={() => handleOpen(plan)} className="h-10 w-10 rounded-xl bg-white/5 text-zinc-400 hover:bg-white hover:text-black transition-all">
                                            <Edit2 size={16} />
                                        </Button>
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <div className="flex items-baseline gap-2">
                                        <span className="text-4xl font-black text-white tracking-tighter italic">₹{plan.monthlyPrice}</span>
                                        <span className="text-[10px] font-black text-zinc-600 uppercase tracking-widest">/ month</span>
                                    </div>
                                    <p className="text-xs font-bold text-zinc-500 uppercase tracking-tight leading-relaxed line-clamp-2">
                                        {plan.description}
                                    </p>
                                </div>

                                <div className="space-y-4 pt-6 border-t border-white/5">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-3 text-zinc-500">
                                            <Users size={14} className="text-indigo-400" />
                                            <span className="text-[10px] font-black uppercase tracking-widest">Capacitance</span>
                                        </div>
                                        <span className="text-xs font-black text-white italic">{plan.maxUsers} Entities</span>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-3 text-zinc-500">
                                            <Database size={14} className="text-emerald-400" />
                                            <span className="text-[10px] font-black uppercase tracking-widest">Storage Matrix</span>
                                        </div>
                                        <span className="text-xs font-black text-white italic">{plan.maxStorageMb} MB</span>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-3 text-zinc-500">
                                            <Zap size={14} className="text-amber-400" />
                                            <span className="text-[10px] font-black uppercase tracking-widest">Signal Burst</span>
                                        </div>
                                        <span className="text-xs font-black text-white italic">{plan.maxApiCalls} Calls/D</span>
                                    </div>
                                </div>

                                <div className="flex flex-wrap gap-2 pt-4">
                                    {plan.hasCustomDomain && <Badge className="bg-white/5 text-zinc-400 border-none font-black text-[8px] tracking-widest">CUSTOM DOMAIN</Badge>}
                                    {plan.hasAnalytics && <Badge className="bg-white/5 text-zinc-400 border-none font-black text-[8px] tracking-widest">INTELLIGENCE</Badge>}
                                    {plan.hasPrioritySupport && <Badge className="bg-white/5 text-zinc-400 border-none font-black text-[8px] tracking-widest">HIGH PRIORITY</Badge>}
                                </div>
                            </div>

                            <div className="pt-8">
                                <Button
                                    className={cn(
                                        "w-full h-14 rounded-2xl font-black uppercase text-[10px] tracking-[0.2em] transition-all",
                                        plan.isActive ? "bg-zinc-800 text-white hover:bg-zinc-700" : "bg-rose-500/10 text-rose-500 border border-rose-500/20"
                                    )}
                                >
                                    {plan.isActive ? 'ACTIVE SIGNAL' : 'SIGNAL TERM'}
                                </Button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Definitions Dialog */}
            <Dialog open={open} onOpenChange={setOpen}>
                <DialogContent className="bg-zinc-950 border-white/5 text-white max-w-4xl p-0 overflow-hidden rounded-[3rem]">
                    <div className="p-12 space-y-12">
                        <header className="space-y-2">
                            <h2 className="text-3xl font-black italic uppercase tracking-tighter">DEF TIER_LOGIC</h2>
                            <p className="text-[10px] font-black text-zinc-600 uppercase tracking-widest">Initialize New Protocol Parameter</p>
                        </header>

                        <div className="grid grid-cols-2 gap-10">
                            {/* Left Side */}
                            <div className="space-y-8">
                                <section className="space-y-4">
                                    <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-4">Identifier</label>
                                    <Input
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                        className="bg-zinc-900 border-white/5 rounded-2xl h-14 px-6 text-white font-bold italic"
                                        placeholder="TIER_NAME"
                                    />
                                </section>

                                <section className="space-y-4">
                                    <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-4">Spectrum Tier</label>
                                    <Select
                                        value={formData.tier}
                                        onValueChange={(val: any) => setFormData({ ...formData, tier: val })}
                                    >
                                        <SelectTrigger className="bg-zinc-900 border-white/5 rounded-2xl h-14 px-6">
                                            <SelectValue placeholder="SELECT_SPECTRUM" />
                                        </SelectTrigger>
                                        <SelectContent className="bg-zinc-900 border-white/10 text-white font-black uppercase text-[10px] tracking-widest">
                                            {Object.values(PlanTier).map((tier) => (
                                                <SelectItem key={tier} value={tier} className="h-12 focus:bg-white/5">{tier}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </section>

                                <section className="space-y-4">
                                    <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-4">Fiscal Load (Monthly)</label>
                                    <div className="relative">
                                        <span className="absolute left-6 top-1/2 -translate-y-1/2 text-zinc-700 font-black italic">₹</span>
                                        <Input
                                            type="number"
                                            value={formData.monthlyPrice}
                                            onChange={(e) => setFormData({ ...formData, monthlyPrice: Number(e.target.value) })}
                                            className="bg-zinc-900 border-white/5 rounded-2xl h-14 pl-10 pr-6 text-white font-black italic"
                                        />
                                    </div>
                                </section>
                            </div>

                            {/* Right Side */}
                            <div className="space-y-8">
                                <section className="space-y-4">
                                    <div className="flex items-center justify-between px-4">
                                        <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Feature Flags</label>
                                    </div>
                                    <div className="bg-zinc-900/50 border border-white/5 rounded-[2rem] p-8 space-y-4">
                                        {[
                                            { id: 'hasAnalytics', label: 'Intelligence Feed' },
                                            { id: 'hasCustomDomain', label: 'Domain Relocation' },
                                            { id: 'hasPrioritySupport', label: 'Shield Response' },
                                            { id: 'hasWebhooks', label: 'Signal Hooks' },
                                        ].map((tool) => (
                                            <div key={tool.id} className="flex items-center justify-between group">
                                                <span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest group-hover:text-white transition-colors">{tool.label}</span>
                                                <Switch
                                                    checked={formData[tool.id]}
                                                    onCheckedChange={(val: any) => setFormData({ ...formData, [tool.id]: val })}
                                                    className="data-[state=checked]:bg-indigo-500"
                                                />
                                            </div>
                                        ))}
                                    </div>
                                </section>
                            </div>
                        </div>

                        <footer className="flex gap-4 pt-10">
                            <Button onClick={() => setOpen(false)} variant="ghost" className="flex-1 h-16 rounded-2xl text-[10px] font-black uppercase tracking-widest text-zinc-500 hover:text-white">Abort Signal</Button>
                            <Button onClick={handleSubmit} className="flex-1 h-16 rounded-2xl bg-white text-black font-black uppercase text-[10px] tracking-widest hover:scale-105 transition-all">Compile Protocol</Button>
                        </footer>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}
