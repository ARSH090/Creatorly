'use client';

import React, { useState, useEffect } from 'react';
import {
    Plus,
    Edit2,
    Trash2,
    Copy,
    Archive,
    Check,
    X,
    Shield,
    HardDrive,
    Zap,
    Users,
    BarChart,
    Layers,
    AlertCircle,
    Loader2
} from 'lucide-react';
import { PlanTier, BillingPeriod } from '@/lib/models/plan.types';

export default function PlansManagement() {
    const [plans, setPlans] = useState([]);
    const [loading, setLoading] = useState(true);
    const [open, setOpen] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [editingPlan, setEditingPlan] = useState<any>(null);

    const initialFormState = {
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
            console.error('Failed to fetch plans', err);
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
        setError(null);
        setOpen(true);
    };

    const handleClose = () => {
        setOpen(false);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const method = editingPlan ? 'PUT' : 'POST';
            const url = editingPlan ? `/api/admin/plans/${editingPlan._id}` : '/api/admin/plans';

            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });

            const result = await res.json();
            if (!res.ok) throw new Error(result.error || 'Failed to save plan');

            handleClose();
            fetchPlans();
        } catch (err: any) {
            setError(err.message);
        }
    };

    const handleDelete = async (id: string) => {
        if (window.confirm('Are you sure you want to delete or archive this plan?')) {
            try {
                const res = await fetch(`/api/admin/plans/${id}`, { method: 'DELETE' });
                const result = await res.json();
                alert(result.message);
                fetchPlans();
            } catch (err: any) {
                alert(err.message);
            }
        }
    };

    const handleTierChange = (e: any) => {
        const tier = e.target.value;
        if (tier === PlanTier.FREE) {
            setFormData({
                ...formData,
                tier,
                monthlyPrice: 0,
                yearlyPrice: 0,
                maxUsers: 1,
                maxStorageMb: 100,
                maxApiCalls: 1000,
                hasAnalytics: false,
                hasPrioritySupport: false,
                hasCustomDomain: false,
                hasTeamCollaboration: false,
                hasWebhooks: false
            });
        } else {
            setFormData({ ...formData, tier });
        }
    };

    return (
        <div className="space-y-10">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <div className="w-2 h-8 bg-emerald-500 rounded-full" />
                    <h2 className="text-2xl font-black text-white uppercase tracking-tighter italic">Tier Configuration Hub</h2>
                </div>
                <button
                    onClick={() => handleOpen()}
                    className="px-8 py-4 bg-emerald-500 hover:bg-emerald-600 text-black font-black uppercase text-[10px] tracking-widest rounded-2xl transition-all shadow-xl shadow-emerald-500/20 active:scale-95 flex items-center gap-3"
                >
                    <Plus className="w-5 h-5" /> CREATE NEW TIER
                </button>
            </div>

            <div className="bg-zinc-900/40 rounded-[3rem] border border-white/5 shadow-2xl backdrop-blur-md overflow-hidden">
                <table className="w-full text-left">
                    <thead className="bg-white/[0.02] border-b border-white/5">
                        <tr className="px-8">
                            <th className="px-10 py-8 text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em]">Tier Name</th>
                            <th className="px-10 py-8 text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em]">Classification</th>
                            <th className="px-10 py-8 text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em]">Monthly Flux</th>
                            <th className="px-10 py-8 text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em]">Annual Flux</th>
                            <th className="px-10 py-8 text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em]">Protocol Status</th>
                            <th className="px-10 py-8 text-right text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em]">Directive</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                        {loading ? (
                            <tr>
                                <td colSpan={6} className="px-10 py-20 text-center">
                                    <div className="flex flex-col items-center gap-4">
                                        <Loader2 className="h-10 w-10 animate-spin text-emerald-500" />
                                        <p className="text-[10px] font-black text-zinc-600 uppercase tracking-[0.3em]">Synching Registry</p>
                                    </div>
                                </td>
                            </tr>
                        ) : plans.length === 0 ? (
                            <tr>
                                <td colSpan={6} className="px-10 py-20 text-center">
                                    <p className="text-[10px] font-black text-zinc-700 uppercase tracking-widest">No Active Registries</p>
                                </td>
                            </tr>
                        ) : (
                            plans.map((plan: any) => (
                                <tr key={plan._id} className="hover:bg-white/[0.02] transition-colors group">
                                    <td className="px-10 py-8 font-black text-white uppercase italic tracking-tight">{plan.name}</td>
                                    <td className="px-10 py-8">
                                        <span className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest border border-white/5 ${plan.tier === 'free' ? 'bg-zinc-800 text-zinc-400' : 'bg-emerald-500/10 text-emerald-500'
                                            }`}>
                                            {plan.tier}
                                        </span>
                                    </td>
                                    <td className="px-10 py-8 font-mono font-black text-white italic">₹{plan.monthlyPrice}</td>
                                    <td className="px-10 py-8 font-mono font-black text-white italic">₹{plan.yearlyPrice}</td>
                                    <td className="px-10 py-8">
                                        <div className="flex items-center gap-2">
                                            <div className={`w-2 h-2 rounded-full ${plan.isActive ? 'bg-emerald-500' : 'bg-rose-500'} animate-pulse shadow-[0_0_10px_rgba(16,185,129,0.5)]`} />
                                            <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">{plan.isActive ? 'OPERATIONAL' : 'OFFLINE'}</span>
                                        </div>
                                    </td>
                                    <td className="px-10 py-8 text-right">
                                        <div className="flex items-center justify-end gap-3">
                                            <button onClick={() => handleOpen(plan)} className="p-3 bg-white/5 rounded-xl border border-white/5 text-zinc-500 hover:text-white hover:border-white/20 transition-all">
                                                <Edit2 className="w-4 h-4" />
                                            </button>
                                            <button onClick={() => handleDelete(plan._id)} className="p-3 bg-white/5 rounded-xl border border-white/5 text-zinc-500 hover:text-rose-500 hover:bg-rose-500/10 hover:border-rose-500/20 transition-all">
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {open && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/80 backdrop-blur-xl animate-in fade-in duration-300">
                    <div className="bg-zinc-900 border border-white/10 rounded-[3rem] shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto custom-scrollbar relative p-10">
                        <button onClick={handleClose} className="absolute top-8 right-8 p-4 text-zinc-500 hover:text-white transition-all">
                            <X className="w-6 h-6" />
                        </button>
                        <div className="space-y-12">
                            <h3 className="text-3xl font-black text-white uppercase italic tracking-tighter flex items-center gap-4">
                                <div className="w-2 h-8 bg-emerald-500 rounded-full" />
                                {editingPlan ? 'Optimize Parameters' : 'Initialize New Tier'}
                            </h3>
                            {error && <div className="p-4 bg-rose-500/10 border border-rose-500/20 rounded-2xl text-rose-500 text-[10px] font-black uppercase tracking-widest">{error}</div>}
                            <form onSubmit={handleSubmit} className="space-y-12 pb-10">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-1">Registry Name</label>
                                        <input required value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} className="w-full bg-black/40 border-white/5 border-2 rounded-2xl h-14 px-6 text-white font-black uppercase italic focus:border-indigo-500 transition-all outline-none" />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-1">Tier Classification</label>
                                        <select required value={formData.tier} onChange={handleTierChange} className="w-full bg-black/40 border-white/5 border-2 rounded-2xl h-14 px-6 text-white font-black uppercase tracking-widest focus:border-indigo-500 transition-all outline-none appearance-none cursor-pointer">
                                            {Object.values(PlanTier).map((tier) => (
                                                <option key={tier} value={tier} className="bg-zinc-900">{tier.toUpperCase()}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-1">Monthly Yield (₹)</label>
                                        <input type="number" required value={formData.monthlyPrice} onChange={(e) => setFormData({ ...formData, monthlyPrice: Number(e.target.value) })} className="w-full bg-black/40 border-white/5 border-2 rounded-2xl h-14 px-6 text-white font-black italic focus:border-emerald-500 transition-all outline-none" />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-1">Annual Sustenance (₹)</label>
                                        <input type="number" required value={formData.yearlyPrice} onChange={(e) => setFormData({ ...formData, yearlyPrice: Number(e.target.value) })} className="w-full bg-black/40 border-white/5 border-2 rounded-2xl h-14 px-6 text-white font-black italic focus:border-emerald-500 transition-all outline-none" />
                                    </div>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                                    <div className="space-y-2 p-6 bg-black/20 rounded-2xl border border-white/5">
                                        <label className="text-[9px] font-black text-zinc-600 uppercase tracking-widest flex items-center gap-2 mb-4">Users Quota</label>
                                        <input type="number" value={formData.maxUsers} onChange={(e) => setFormData({ ...formData, maxUsers: Number(e.target.value) })} className="w-full bg-transparent border-b-2 border-white/10 text-xl font-black text-white focus:border-rose-500 transition-all outline-none py-2" />
                                    </div>
                                    <div className="space-y-2 p-6 bg-black/20 rounded-2xl border border-white/5">
                                        <label className="text-[9px] font-black text-zinc-600 uppercase tracking-widest flex items-center gap-2 mb-4">Storage (MB)</label>
                                        <input type="number" value={formData.maxStorageMb} onChange={(e) => setFormData({ ...formData, maxStorageMb: Number(e.target.value) })} className="w-full bg-transparent border-b-2 border-white/10 text-xl font-black text-white focus:border-rose-500 transition-all outline-none py-2" />
                                    </div>
                                    <div className="space-y-2 p-6 bg-black/20 rounded-2xl border border-white/5">
                                        <label className="text-[9px] font-black text-zinc-600 uppercase tracking-widest flex items-center gap-2 mb-4">API Bursts</label>
                                        <input type="number" value={formData.maxApiCalls} onChange={(e) => setFormData({ ...formData, maxApiCalls: Number(e.target.value) })} className="w-full bg-transparent border-b-2 border-white/10 text-xl font-black text-white focus:border-rose-500 transition-all outline-none py-2" />
                                    </div>
                                </div>
                                <div className="flex gap-6">
                                    <button type="button" onClick={handleClose} className="flex-1 h-20 bg-black/40 text-zinc-600 font-black uppercase text-xs tracking-[0.2em] rounded-[1.5rem] border border-white/5 hover:text-white hover:border-white/10 transition-all italic">ABORT</button>
                                    <button type="submit" className="flex-[2] h-20 bg-emerald-500 text-black font-black uppercase text-xs tracking-[0.3em] rounded-[1.5rem] shadow-2xl shadow-emerald-500/20 hover:bg-emerald-400 active:scale-[0.98] transition-all italic">COMMIT</button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
