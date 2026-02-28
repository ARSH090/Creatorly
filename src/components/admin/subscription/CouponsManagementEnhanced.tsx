'use client';

import React, { useState, useEffect } from 'react';
import {
    Plus, Edit2, Trash2, Tag,
    Zap, Shield, Globe, Users,
    Activity, Check, X, AlertTriangle,
    Search, Filter, Percent, Calendar,
    Lock, ArrowRight, ShieldAlert, BadgeInfo
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
import { TableSkeleton } from '@/components/ui/skeleton-loaders';
import { toast } from 'react-hot-toast';
import { cn } from '@/lib/utils';

export default function CouponsManagementEnhanced() {
    const [coupons, setCoupons] = useState([]);
    const [plans, setPlans] = useState([]);
    const [loading, setLoading] = useState(true);
    const [open, setOpen] = useState(false);
    const [editingCoupon, setEditingCoupon] = useState<any>(null);

    const initialFormState = {
        code: '',
        description: '',
        discountType: 'percentage',
        discountValue: 10,
        appliesTo: 'all_plans',
        applicableTiers: [],
        applicablePlanIds: [],
        usageLimit: 100,
        usagePerUser: 1,
        minOrderAmount: 0,
        minimumPlanTier: null,
        validFrom: new Date().toISOString().split('T')[0],
        validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        cannotCombineWithOtherCoupons: true,
        excludeDiscountedItems: false,
        status: 'active'
    };

    const [formData, setFormData] = useState(initialFormState);

    useEffect(() => {
        fetchCoupons();
        fetchPlans();
    }, []);

    const fetchCoupons = async () => {
        try {
            setLoading(true);
            const res = await fetch('/api/admin/coupons');
            const data = await res.json();
            if (data.coupons) setCoupons(data.coupons);
        } catch (err) {
            toast.error('Failed to query incentive spectrum');
        } finally {
            setLoading(false);
        }
    };

    const fetchPlans = async () => {
        const res = await fetch('/api/admin/plans');
        const data = await res.json();
        if (data.plans) setPlans(data.plans.filter((p: any) => p.tier !== 'free'));
    };

    const handleOpen = (coupon: any = null) => {
        if (coupon) {
            setEditingCoupon(coupon);
            setFormData({
                ...coupon,
                validFrom: new Date(coupon.validFrom).toISOString().split('T')[0],
                validUntil: new Date(coupon.validUntil).toISOString().split('T')[0]
            });
        } else {
            setEditingCoupon(null);
            setFormData(initialFormState);
        }
        setOpen(true);
    };

    const handleSubmit = async () => {
        try {
            const method = editingCoupon ? 'PUT' : 'POST';
            const url = '/api/admin/coupons';

            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ...formData, id: editingCoupon?._id })
            });

            if (!res.ok) throw new Error('Relay Error');

            toast.success('Incentive Logic Deployed');
            setOpen(false);
            fetchCoupons();
        } catch (err: any) {
            toast.error('Deployment Failure: Protocol Denied');
        }
    };

    return (
        <div className="space-y-10 animate-in fade-in duration-700">
            <header className="flex items-center justify-between">
                <div className="space-y-1">
                    <h2 className="text-2xl font-black text-white italic uppercase tracking-tighter">INCENTIVE SPECTRUM</h2>
                    <p className="text-[10px] font-black text-zinc-600 uppercase tracking-widest">Protocol Overrides & Acquisition Logic</p>
                </div>
                <Button
                    onClick={() => handleOpen()}
                    className="bg-indigo-600 text-white font-black uppercase text-[10px] tracking-[0.2em] rounded-2xl h-14 px-8 hover:bg-indigo-500 transition-all shadow-xl shadow-indigo-600/20"
                >
                    <Plus className="w-4 h-4 mr-3" />
                    Forge New Code
                </Button>
            </header>

            {loading ? (
                <TableSkeleton rows={8} />
            ) : (
                <div className="bg-zinc-900/40 backdrop-blur-3xl rounded-[3rem] p-10 border border-white/5 space-y-10 overflow-hidden">
                    <div className="overflow-x-auto rounded-[2rem] border border-white/5">
                        <table className="w-full text-left">
                            <thead>
                                <tr className="bg-white/5 text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em] italic">
                                    <th className="py-6 px-10">SIGNAL CODE</th>
                                    <th className="py-6 px-10">MODULATION</th>
                                    <th className="py-6 px-10">UTILIZATION</th>
                                    <th className="py-6 px-10">EXPIRY_SYNC</th>
                                    <th className="py-6 px-10 text-right">PROTOCOL</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5">
                                {coupons.map((c: any) => (
                                    <tr key={c._id} className="text-sm hover:bg-white/[0.02] transition-colors group cursor-pointer" onClick={() => handleOpen(c)}>
                                        <td className="py-8 px-10">
                                            <div className="flex items-center gap-4">
                                                <div className="w-10 h-10 rounded-xl bg-indigo-500/10 flex items-center justify-center">
                                                    <Tag className="w-4 h-4 text-indigo-400" />
                                                </div>
                                                <span className="text-[11px] font-black text-white italic tracking-[0.2em] uppercase">{c.code}</span>
                                            </div>
                                        </td>
                                        <td className="py-8 px-10">
                                            <div className="flex flex-col">
                                                <span className="font-black text-xs text-indigo-400 uppercase tracking-tight italic">
                                                    {c.discountType === 'percentage' ? `${c.discountValue}% SHIFT` : `₹${c.discountValue} FLAT`}
                                                </span>
                                                <span className="text-[9px] font-bold text-zinc-700 tracking-tighter uppercase">{c.discountType} modulation</span>
                                            </div>
                                        </td>
                                        <td className="py-8 px-10">
                                            <div className="space-y-2 max-w-[120px]">
                                                <div className="flex justify-between text-[9px] font-black text-zinc-600 uppercase">
                                                    <span>USAGE</span>
                                                    <span>{(c.usedCount / c.usageLimit * 100).toFixed(0)}%</span>
                                                </div>
                                                <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                                                    <div
                                                        className="h-full bg-indigo-500 rounded-full transition-all duration-1000"
                                                        style={{ width: `${(c.usedCount / c.usageLimit * 100)}%` }}
                                                    />
                                                </div>
                                                <span className="text-[9px] font-bold text-zinc-700 uppercase tracking-tighter">{c.usedCount} / {c.usageLimit}</span>
                                            </div>
                                        </td>
                                        <td className="py-8 px-10">
                                            <span className="text-[10px] font-black text-white italic tracking-widest uppercase">{new Date(c.validUntil).toLocaleDateString()}</span>
                                        </td>
                                        <td className="py-8 px-10 text-right">
                                            <Badge className={cn(
                                                "uppercase text-[9px] font-black tracking-widest px-4 py-1.5 rounded-lg border shadow-sm",
                                                c.status === 'active' ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" : "bg-zinc-800 text-zinc-500 border-white/5"
                                            )}>
                                                {c.status}
                                            </Badge>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            <Dialog open={open} onOpenChange={setOpen}>
                <DialogContent className="bg-zinc-950 border-white/5 text-white max-w-4xl p-0 overflow-hidden rounded-[3rem]">
                    <div className="p-12 space-y-12">
                        <header className="space-y-2">
                            <h2 className="text-3xl font-black italic uppercase tracking-tighter">FORGE INCENTIVE</h2>
                            <p className="text-[10px] font-black text-zinc-600 uppercase tracking-widest">Initialize Acquisition Logic Variable</p>
                        </header>

                        <div className="grid grid-cols-2 gap-10">
                            <div className="space-y-8">
                                <section className="space-y-4">
                                    <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-4 italic">Signal Identifier</label>
                                    <Input
                                        value={formData.code}
                                        onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                                        className="bg-zinc-900 border-white/5 rounded-2xl h-14 px-6 text-white font-black italic tracking-widest"
                                        placeholder="SIGNAL_HEX"
                                    />
                                </section>

                                <div className="grid grid-cols-2 gap-4">
                                    <section className="space-y-4">
                                        <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-4 italic">Mod Type</label>
                                        <Select
                                            value={formData.discountType}
                                            onValueChange={(val) => setFormData({ ...formData, discountType: val })}
                                        >
                                            <SelectTrigger className="bg-zinc-900 border-white/5 rounded-2xl h-14 px-6">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent className="bg-zinc-900 border-white/10 text-white font-black uppercase text-[10px] tracking-widest">
                                                <SelectItem value="percentage" className="h-12">PERCENT</SelectItem>
                                                <SelectItem value="fixed_amount" className="h-12">FLAT_AMT</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </section>
                                    <section className="space-y-4">
                                        <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-4 italic">Value</label>
                                        <Input
                                            type="number"
                                            value={formData.discountValue}
                                            onChange={(e) => setFormData({ ...formData, discountValue: Number(e.target.value) })}
                                            className="bg-zinc-900 border-white/5 rounded-2xl h-14 px-6 text-white font-black italic"
                                        />
                                    </section>
                                </div>
                            </div>

                            <div className="space-y-8">
                                <section className="space-y-4">
                                    <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-4 italic">Constraints</label>
                                    <div className="bg-zinc-900/50 border border-white/5 rounded-[2rem] p-8 space-y-6">
                                        <div className="flex items-center justify-between">
                                            <span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Single Signal Only</span>
                                            <Switch
                                                checked={formData.cannotCombineWithOtherCoupons}
                                                onCheckedChange={(val) => setFormData({ ...formData, cannotCombineWithOtherCoupons: val })}
                                            />
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Exclude Promo Tiers</span>
                                            <Switch
                                                checked={formData.excludeDiscountedItems}
                                                onCheckedChange={(val) => setFormData({ ...formData, excludeDiscountedItems: val })}
                                            />
                                        </div>
                                    </div>
                                </section>
                            </div>
                        </div>

                        <footer className="flex gap-4 pt-10">
                            <Button onClick={() => setOpen(false)} variant="ghost" className="flex-1 h-16 rounded-2xl text-[10px] font-black uppercase tracking-widest text-zinc-500 hover:text-white">Abort Signal</Button>
                            <Button onClick={handleSubmit} className="flex-1 h-16 rounded-2xl bg-indigo-600 text-white font-black uppercase text-[10px] tracking-widest hover:scale-105 transition-all shadow-xl shadow-indigo-600/20">Forge Protocol</Button>
                        </footer>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}
