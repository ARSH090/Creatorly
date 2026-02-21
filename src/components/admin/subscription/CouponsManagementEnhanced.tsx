'use client';

import React, { useState, useEffect } from 'react';
import {
    Plus,
    Edit2,
    Trash2,
    Tag,
    Clock,
    CheckCircle,
    X,
    AlertTriangle,
    Loader2,
    Calendar,
    Target,
    Settings,
    ShieldAlert
} from 'lucide-react';

export default function CouponsManagementEnhanced() {
    const [coupons, setCoupons] = useState([]);
    const [plans, setPlans] = useState([]);
    const [loading, setLoading] = useState(true);
    const [open, setOpen] = useState(false);
    const [error, setError] = useState<string | null>(null);
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
            console.error('Failed to fetch coupons', err);
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
        setError(null);
        setOpen(true);
    };

    const handleClose = () => setOpen(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const method = editingCoupon ? 'PUT' : 'POST';
            const url = '/api/admin/coupons';

            const payload = {
                ...formData,
                id: editingCoupon?._id
            };

            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            const result = await res.json();
            if (!res.ok) throw new Error(result.error || 'Failed to save coupon');

            handleClose();
            fetchCoupons();
        } catch (err: any) {
            setError(err.message);
        }
    };

    return (
        <div className="space-y-10">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <div className="w-2 h-8 bg-rose-500 rounded-full" />
                    <h2 className="text-2xl font-black text-white uppercase tracking-tighter italic">Promotion Console Enhanced</h2>
                </div>
                <button
                    onClick={() => handleOpen()}
                    className="px-8 py-4 bg-rose-500 hover:bg-rose-600 text-black font-black uppercase text-[10px] tracking-widest rounded-2xl transition-all shadow-xl shadow-rose-500/20 active:scale-95 flex items-center gap-3"
                >
                    <Plus className="w-5 h-5" /> INITIALIZE PROMO
                </button>
            </div>

            <div className="bg-zinc-900/40 rounded-[3rem] border border-white/5 shadow-2xl backdrop-blur-md overflow-hidden">
                <table className="w-full text-left">
                    <thead className="bg-white/[0.02] border-b border-white/5">
                        <tr className="px-8">
                            <th className="px-10 py-8 text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em]">Promo Code</th>
                            <th className="px-10 py-8 text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em]">Discount Core</th>
                            <th className="px-10 py-8 text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em]">Utilization Hub</th>
                            <th className="px-10 py-8 text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em]">Expiration Window</th>
                            <th className="px-10 py-8 text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em]">Status</th>
                            <th className="px-10 py-8 text-right text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em]">Directive</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                        {loading ? (
                            <tr>
                                <td colSpan={6} className="px-10 py-20 text-center">
                                    <div className="flex flex-col items-center gap-4">
                                        <Loader2 className="h-10 w-10 animate-spin text-rose-500" />
                                        <p className="text-[10px] font-black text-zinc-600 uppercase tracking-[0.3em]">Querying Registry</p>
                                    </div>
                                </td>
                            </tr>
                        ) : coupons.length === 0 ? (
                            <tr>
                                <td colSpan={6} className="px-10 py-20 text-center">
                                    <p className="text-[10px] font-black text-zinc-700 uppercase tracking-widest">No Active Promotions</p>
                                </td>
                            </tr>
                        ) : (
                            coupons.map((coupon: any) => (
                                <tr key={coupon._id} className="hover:bg-white/[0.02] transition-colors group">
                                    <td className="px-10 py-8 font-mono font-black text-rose-500 text-base tracking-widest uppercase italic">{coupon.code}</td>
                                    <td className="px-10 py-8">
                                        <span className="text-xl font-black text-white italic tracking-tighter">
                                            {coupon.discountType === 'percentage' ? `${coupon.discountValue}%` : `₹${coupon.discountValue}`}
                                        </span>
                                    </td>
                                    <td className="px-10 py-8">
                                        <div className="flex items-center gap-3">
                                            <div className="w-32 h-2 bg-black/40 rounded-full overflow-hidden border border-white/5">
                                                <div
                                                    className="h-full bg-rose-500 shadow-[0_0_10px_rgba(244,63,94,0.5)]"
                                                    style={{ width: `${Math.min(100, (coupon.usedCount / (coupon.usageLimit || 1)) * 100)}%` }}
                                                />
                                            </div>
                                            <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">{coupon.usedCount} / {coupon.usageLimit}</span>
                                        </div>
                                    </td>
                                    <td className="px-10 py-8 font-black text-zinc-500 text-[10px] uppercase tracking-widest italic">{new Date(coupon.validUntil).toLocaleDateString()}</td>
                                    <td className="px-10 py-8">
                                        <div className="flex items-center gap-2">
                                            <div className={`w-2 h-2 rounded-full ${coupon.status === 'active' ? 'bg-emerald-500' : 'bg-zinc-600'} animate-pulse`} />
                                            <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">{coupon.status === 'active' ? 'OPERATIONAL' : 'OFFLINE'}</span>
                                        </div>
                                    </td>
                                    <td className="px-10 py-8 text-right">
                                        <div className="flex items-center justify-end gap-3">
                                            <button onClick={() => handleOpen(coupon)} className="p-3 bg-white/5 rounded-xl border border-white/5 text-zinc-500 hover:text-white transition-all"><Edit2 className="w-4 h-4" /></button>
                                            <button className="p-3 bg-white/5 rounded-xl border border-white/5 text-zinc-500 hover:text-rose-500 transition-all"><Trash2 className="w-4 h-4" /></button>
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
                        <button onClick={handleClose} className="absolute top-8 right-8 p-4 text-zinc-500 hover:text-white transition-all"><X className="w-6 h-6" /></button>
                        <div className="space-y-12">
                            <h3 className="text-3xl font-black text-white uppercase italic tracking-tighter flex items-center gap-4">
                                <div className="w-2 h-8 bg-rose-500 rounded-full" />
                                {editingCoupon ? 'Configure Promotion' : 'Initialize Promotion'}
                            </h3>
                            <form onSubmit={handleSubmit} className="space-y-12 pb-10">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-1">Voucher Code</label>
                                        <input required value={formData.code} onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase().replace(/\s/g, '') })} disabled={!!editingCoupon} className="w-full bg-black/40 border-white/5 border-2 rounded-2xl h-14 px-6 text-white font-mono font-black italic focus:border-rose-500 transition-all outline-none" />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-1">Description</label>
                                        <input value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} className="w-full bg-black/40 border-white/5 border-2 rounded-2xl h-14 px-6 text-white font-black uppercase italic focus:border-rose-500 transition-all outline-none" />
                                    </div>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-1">Protocol Type</label>
                                        <select value={formData.discountType} onChange={(e) => setFormData({ ...formData, discountType: e.target.value })} className="w-full bg-black/40 border-white/5 border-2 rounded-2xl h-14 px-6 text-white font-black uppercase tracking-widest focus:border-rose-500 transition-all outline-none appearance-none cursor-pointer">
                                            <option value="percentage" className="bg-zinc-900">PERCENTAGE (%)</option>
                                            <option value="fixed_amount" className="bg-zinc-900">FIXED AMOUNT (₹)</option>
                                        </select>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-1">Market Value</label>
                                        <input type="number" required value={formData.discountValue} onChange={(e) => setFormData({ ...formData, discountValue: Number(e.target.value) })} className="w-full bg-black/40 border-white/5 border-2 rounded-2xl h-14 px-6 text-white font-black italic focus:border-rose-500 transition-all outline-none" />
                                    </div>
                                </div>
                                <div className="flex gap-6">
                                    <button type="button" onClick={handleClose} className="flex-1 h-20 bg-black/40 text-zinc-600 font-black uppercase text-xs tracking-[0.2em] rounded-[1.5rem] border border-white/5 hover:text-white transition-all italic">ABORT</button>
                                    <button type="submit" className="flex-[2] h-20 bg-rose-500 text-black font-black uppercase text-xs tracking-[0.3em] rounded-[1.5rem] shadow-2xl shadow-rose-500/20 hover:bg-rose-400 transition-all italic">COMMIT_PROTOCOL</button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
