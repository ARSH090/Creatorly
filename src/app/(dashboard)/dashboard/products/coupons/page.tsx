'use client';

import React, { useState, useEffect } from "react";
import {
    Plus, Search, Ticket, Calendar,
    ArrowRight, MoreVertical, Trash2,
    Zap, Percent, Tag, Users,
    TrendingUp, MousePointer2, AlertCircle,
    Copy, Download, Eye, Edit3,
    Pause, Play, BarChart3, Filter,
    Gift, Clock, CheckCircle2, X, ChevronRight,
    ShoppingBag, IndianRupee, Loader2,
    Settings, ShieldCheck
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "react-hot-toast";
import { cn } from "@/lib/utils";

export default function CouponManagement() {
    const [coupons, setCoupons] = useState<any[]>([]);
    const [products, setProducts] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [search, setSearch] = useState("");
    const [filterStatus, setFilterStatus] = useState("All");

    const [newCoupon, setNewCoupon] = useState({
        code: '',
        discountType: 'percentage',
        discountValue: '',
        bogoConfig: {
            buyQuantity: 1,
            getQuantity: 1,
            getDiscountValue: 100 // 100 for FREE
        },
        appliesTo: 'all',
        applicableProducts: [] as string[],
        minOrderAmount: '',
        usageLimit: '',
        usageLimitPerUser: 1,
        validFrom: new Date().toISOString().split('T')[0],
        validUntil: '',
        isActive: true
    });

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const [cRes, pRes] = await Promise.all([
                fetch('/api/creator/coupons'),
                fetch('/api/creator/products?status=published')
            ]);
            const cData = await cRes.json();
            const pData = await pRes.json();
            setCoupons(Array.isArray(cData.coupons) ? cData.coupons : []);
            setProducts(pData.products || []);
        } catch (error) {
            console.error("Failed to fetch data:", error);
            toast.error("Failed to load strategy data");
        } finally {
            setLoading(false);
        }
    };

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newCoupon.code) {
            toast.error("Code required");
            return;
        }

        setIsSaving(true);
        try {
            const payload = {
                ...newCoupon,
                code: newCoupon.code.toUpperCase().trim(),
                discountValue: Number(newCoupon.discountValue) || 0,
                minOrderAmount: Number(newCoupon.minOrderAmount) * 100, // to paisa
                usageLimit: newCoupon.usageLimit ? Number(newCoupon.usageLimit) : 0,
                usageLimitPerUser: Number(newCoupon.usageLimitPerUser),
                validFrom: new Date(newCoupon.validFrom).toISOString(),
                validUntil: newCoupon.validUntil ? new Date(newCoupon.validUntil).toISOString() : undefined,
                applicableProducts: newCoupon.appliesTo === 'specific' ? newCoupon.applicableProducts : []
            };

            const res = await fetch('/api/creator/coupons', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.error || data.message || 'Failed to deploy strategy');

            toast.success('Promo strategy deployed successfully');
            fetchData();
            setShowModal(false);
            setNewCoupon({
                code: '', discountType: 'percentage', discountValue: '',
                bogoConfig: { buyQuantity: 1, getQuantity: 1, getDiscountValue: 100 },
                appliesTo: 'all', applicableProducts: [],
                minOrderAmount: '', usageLimit: '', usageLimitPerUser: 1,
                validFrom: new Date().toISOString().split('T')[0], validUntil: '', isActive: true
            });
        } catch (error: any) {
            toast.error(error.message);
        } finally {
            setIsSaving(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Abort this strategy permanently?')) return;
        try {
            const res = await fetch(`/api/creator/coupons/${id}`, { method: 'DELETE' });
            if (res.ok) {
                toast.success('Strategy purged');
                setCoupons(coupons.filter(c => c._id !== id));
            }
        } catch (err) { toast.error('Failed to purge strategy'); }
    };

    const toggleStatus = async (coupon: any) => {
        try {
            const res = await fetch(`/api/creator/coupons/${coupon._id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ isActive: !coupon.isActive })
            });
            if (res.ok) {
                toast.success(coupon.isActive ? 'Strategy paused' : 'Strategy activated');
                setCoupons(coupons.map(c => c._id === coupon._id ? { ...c, isActive: !c.isActive } : c));
            }
        } catch (err) { toast.error('Failed to toggle status'); }
    };

    const filteredCoupons = coupons.filter(c =>
        c.code.toLowerCase().includes(search.toLowerCase()) &&
        (filterStatus === 'All' || (filterStatus === 'Active' ? c.isActive : !c.isActive))
    );

    return (
        <div className="max-w-7xl mx-auto space-y-12 pb-20 animate-in fade-in duration-700">
            {/* Header Section */}
            <header className="flex flex-col md:flex-row md:items-end justify-between gap-8">
                <div className="space-y-4">
                    <h1 className="text-5xl font-black text-white italic uppercase tracking-tighter flex items-center gap-4">
                        <Ticket className="w-12 h-12 text-indigo-500 shadow-[0_0_30px_rgba(99,102,241,0.4)]" />
                        PROMO REGISTRY
                    </h1>
                    <p className="text-[10px] font-black text-zinc-600 uppercase tracking-[0.4em]">
                        Conversion Engineering • Discount Architecture • Yield Optimization
                    </p>
                </div>
                <button
                    onClick={() => setShowModal(true)}
                    className="bg-white text-black rounded-3xl h-16 px-10 uppercase text-[11px] font-black tracking-[0.2em] italic shadow-2xl shadow-indigo-500/10 hover:scale-105 transition-all flex items-center gap-3 group"
                >
                    <Plus className="w-5 h-5 group-hover:rotate-90 transition-transform" />
                    CREATE STRATEGY
                </button>
            </header>

            {/* Matrix View */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                {[
                    { label: 'Active Codes', value: coupons.filter(c => c.isActive).length, icon: Zap, color: 'indigo' },
                    { label: 'Total Claims', value: coupons.reduce((acc, c) => acc + (c.usageCount || 0), 0), icon: MousePointer2, color: 'emerald' },
                    { label: 'Revenue Vector', value: `₹${(coupons.reduce((acc, c) => acc + (c.totalRevenueDriven || 0) / 100, 0)).toLocaleString()}`, icon: TrendingUp, color: 'amber' },
                    { label: 'Dormant', value: coupons.filter(c => !c.isActive).length, icon: Pause, color: 'rose' }
                ].map((stat, i) => (
                    <div key={i} className="bg-zinc-900/40 backdrop-blur-2xl border border-white/5 p-8 rounded-[2.5rem] group hover:border-white/10 transition-all duration-500">
                        <p className="text-[9px] font-black uppercase tracking-[0.3em] text-zinc-600 mb-4 italic">{stat.label}</p>
                        <div className="flex items-end justify-between">
                            <h3 className="text-2xl font-black text-white italic tracking-tighter">{stat.value}</h3>
                            <div className={cn("p-3 rounded-2xl bg-white/5 text-zinc-500 group-hover:scale-110 transition-transform")}>
                                <stat.icon className="w-4 h-4" />
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Registry Table */}
            <div className="bg-zinc-900/30 backdrop-blur-2xl border border-white/5 rounded-[3rem] overflow-hidden">
                <div className="p-10 border-b border-white/5 flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div className="flex bg-black/40 p-1.5 rounded-full border border-white/5">
                        {['All', 'Active', 'Inactive'].map(s => (
                            <button
                                key={s}
                                onClick={() => setFilterStatus(s)}
                                className={cn(
                                    "px-8 py-3 rounded-full text-[9px] font-black uppercase tracking-widest italic transition-all",
                                    filterStatus === s ? "bg-white text-black shadow-xl" : "text-zinc-600 hover:text-white"
                                )}
                            >
                                {s}
                            </button>
                        ))}
                    </div>
                    <div className="relative group w-full md:w-80">
                        <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-700 group-focus-within:text-white transition-colors" />
                        <input
                            type="text"
                            placeholder="SEARCH CODES..."
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            className="bg-black/60 border border-white/5 rounded-full py-5 pl-14 pr-8 text-[10px] font-black tracking-widest text-white placeholder:text-zinc-800 focus:outline-none focus:border-indigo-500/30 transition-all w-full uppercase italic"
                        />
                    </div>
                </div>

                <div className="overflow-x-auto">
                    {loading ? (
                        <div className="p-32 flex flex-col items-center gap-6">
                            <Loader2 className="w-12 h-12 text-indigo-500 animate-spin" />
                            <p className="text-[10px] font-black text-zinc-700 uppercase tracking-widest italic animate-pulse">Scanning Strategy Repository...</p>
                        </div>
                    ) : filteredCoupons.length > 0 ? (
                        <table className="w-full text-left font-black transition-all">
                            <thead>
                                <tr className="text-[9px] font-black uppercase tracking-[0.2em] text-zinc-700 border-b border-white/5 italic">
                                    <th className="px-12 py-8 uppercase">Definition</th>
                                    <th className="px-12 py-8 uppercase">Magnitude</th>
                                    <th className="px-12 py-8 uppercase">Redemptions</th>
                                    <th className="px-12 py-8 uppercase">Status</th>
                                    <th className="px-12 py-8 text-right uppercase">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5">
                                {filteredCoupons.map((coupon) => (
                                    <tr key={coupon._id} className="group hover:bg-white/[0.02] transition-colors">
                                        <td className="px-12 py-10">
                                            <div className="flex items-center gap-6">
                                                <div className="w-14 h-14 rounded-2xl bg-indigo-500/5 flex items-center justify-center text-indigo-400 border border-white/5 italic font-black">
                                                    {coupon.discountType === 'percentage' ? <Percent className="w-5 h-5" /> :
                                                        coupon.discountType === 'bogo' ? <Gift className="w-5 h-5" /> : <IndianRupee className="w-5 h-5" />}
                                                </div>
                                                <div>
                                                    <div className="flex items-center gap-3">
                                                        <span className="text-xl font-black text-white italic uppercase tracking-tighter group-hover:text-indigo-400 transition-colors">{coupon.code}</span>
                                                    </div>
                                                    <p className="text-[8px] text-zinc-600 font-black uppercase tracking-widest mt-1 italic">
                                                        {coupon.appliesTo === 'all' ? 'GLOBAL ACCESS' : `SPECIFIC SCOPE: ${coupon.applicableProducts?.length || 0} UNITS`}
                                                    </p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-12 py-10">
                                            <div className="space-y-1">
                                                <span className="text-lg font-black text-white italic">
                                                    {coupon.discountType === 'percentage' ? `${coupon.discountValue}% OFF` :
                                                        coupon.discountType === 'bogo' ? `B${coupon.bogoConfig?.buyQuantity}G${coupon.bogoConfig?.getQuantity}` :
                                                            `₹${coupon.discountValue} FLAT`}
                                                </span>
                                                {coupon.minOrderAmount > 0 && (
                                                    <p className="text-[8px] text-zinc-700 font-black uppercase tracking-widest italic">GATE: ₹{coupon.minOrderAmount / 100}</p>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-12 py-10">
                                            <div className="flex items-center gap-4">
                                                <div className="flex-1 h-1.5 bg-white/5 rounded-full overflow-hidden max-w-[120px]">
                                                    <div
                                                        className="h-full bg-indigo-500 shadow-[0_0_10px_rgba(99,102,241,0.5)]"
                                                        style={{ width: `${Math.min(((coupon.usageCount || 0) / (coupon.usageLimit || 100)) * 100, 100)}%` }}
                                                    />
                                                </div>
                                                <span className="text-xs font-black text-white italic">{coupon.usageCount || 0}/{coupon.usageLimit || '∞'}</span>
                                            </div>
                                        </td>
                                        <td className="px-12 py-10">
                                            <button
                                                onClick={() => toggleStatus(coupon)}
                                                className={cn(
                                                    "px-6 py-2 rounded-full text-[8px] font-black uppercase tracking-widest transition-all italic border",
                                                    coupon.isActive ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" : "bg-zinc-800 text-zinc-600 border-transparent"
                                                )}
                                            >
                                                {coupon.isActive ? 'OPERATIONAL' : 'DORMANT'}
                                            </button>
                                        </td>
                                        <td className="px-12 py-10 text-right">
                                            <button
                                                onClick={() => handleDelete(coupon._id)}
                                                className="w-10 h-10 bg-white/5 text-zinc-700 hover:text-red-500 hover:bg-red-500/10 rounded-xl transition-all border border-transparent hover:border-red-500/10 flex items-center justify-center ml-auto"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    ) : (
                        <div className="py-40 text-center space-y-8">
                            <Ticket className="w-16 h-16 text-zinc-900 mx-auto" />
                            <div className="space-y-4">
                                <h3 className="text-2xl font-black text-white italic uppercase tracking-tightest">COLLECTION VOID</h3>
                                <p className="text-zinc-700 max-w-sm mx-auto font-black text-[9px] uppercase tracking-widest italic">
                                    Deploy a promo strategy to accelerate conversion rates.
                                </p>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Strategy Creation Modal */}
            <AnimatePresence>
                {showModal && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 sm:p-12 overflow-y-auto scrollbar-hide py-20">
                        <motion.div
                            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                            onClick={() => setShowModal(false)}
                            className="fixed inset-0 bg-black/98 backdrop-blur-3xl"
                        />
                        <motion.div
                            initial={{ opacity: 0, y: 50, scale: 0.95 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: 50, scale: 0.95 }}
                            className="relative w-full max-w-4xl bg-zinc-950 border border-white/5 rounded-[3.5rem] shadow-[0_0_100px_rgba(0,0,0,1)] overflow-hidden"
                        >
                            <form onSubmit={handleCreate} className="p-12 md:p-16 space-y-12 h-full overflow-y-auto max-h-[90vh] scrollbar-hide">
                                <div className="flex items-center justify-between border-b border-white/5 pb-10">
                                    <div className="space-y-1">
                                        <h2 className="text-4xl font-black text-white italic tracking-tighter uppercase">Strategy Genesis</h2>
                                        <p className="text-[9px] font-black text-zinc-600 uppercase tracking-[0.4em] italic">Constraint Definition & Distribution Logic</p>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => setShowModal(false)}
                                        className="w-14 h-14 bg-white/5 rounded-2xl flex items-center justify-center text-zinc-600 hover:text-white transition-all border border-white/5"
                                    >
                                        <X className="w-6 h-6" />
                                    </button>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                                    {/* Column 1: Core Params */}
                                    <div className="space-y-10">
                                        <div className="space-y-4">
                                            <label className="text-[10px] font-black text-indigo-500 uppercase tracking-widest ml-1">Promotional Code</label>
                                            <input
                                                type="text"
                                                placeholder="E.G. IMPACT50"
                                                value={newCoupon.code}
                                                onChange={e => setNewCoupon({ ...newCoupon, code: e.target.value.toUpperCase() })}
                                                className="w-full bg-white/5 border border-white/5 rounded-3xl py-6 px-10 text-3xl font-black text-white placeholder:text-zinc-900 focus:border-indigo-500/50 transition-all uppercase italic tracking-tighter outline-none"
                                                required
                                            />
                                        </div>

                                        <div className="space-y-4">
                                            <label className="text-[10px] font-black text-indigo-500 uppercase tracking-widest ml-1">Discount Logic</label>
                                            <div className="grid grid-cols-3 gap-2 bg-white/5 p-2 rounded-3xl border border-white/5">
                                                {['percentage', 'fixed', 'bogo'].map(t => (
                                                    <button
                                                        key={t}
                                                        type="button"
                                                        onClick={() => setNewCoupon({ ...newCoupon, discountType: t as any })}
                                                        className={cn(
                                                            "py-4 rounded-2xl text-[9px] font-black uppercase tracking-widest transition-all italic",
                                                            newCoupon.discountType === t ? "bg-white text-black shadow-xl" : "text-zinc-600 hover:text-white"
                                                        )}
                                                    >
                                                        {t}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>

                                        {newCoupon.discountType !== 'bogo' ? (
                                            <div className="space-y-4">
                                                <label className="text-[10px] font-black text-indigo-500 uppercase tracking-widest ml-1">Magnitude ({newCoupon.discountType === 'percentage' ? '%' : '₹'})</label>
                                                <input
                                                    type="number"
                                                    value={newCoupon.discountValue}
                                                    onChange={e => setNewCoupon({ ...newCoupon, discountValue: e.target.value })}
                                                    className="w-full bg-white/5 border border-white/5 rounded-3xl py-6 px-10 text-3xl font-black text-white focus:border-indigo-500/50 transition-all outline-none italic"
                                                    placeholder="0"
                                                    required
                                                />
                                            </div>
                                        ) : (
                                            <div className="p-8 bg-zinc-900/40 rounded-3xl border border-white/5 space-y-6">
                                                <div className="flex items-center gap-4">
                                                    <div className="flex-1 space-y-2">
                                                        <label className="text-[9px] font-black text-zinc-600 uppercase italic">Buy Qty</label>
                                                        <input
                                                            type="number"
                                                            value={newCoupon.bogoConfig.buyQuantity}
                                                            onChange={e => setNewCoupon({ ...newCoupon, bogoConfig: { ...newCoupon.bogoConfig, buyQuantity: Number(e.target.value) } })}
                                                            className="w-full bg-black/40 border border-white/5 rounded-xl p-4 text-white font-black"
                                                        />
                                                    </div>
                                                    <div className="flex-1 space-y-2">
                                                        <label className="text-[9px] font-black text-zinc-600 uppercase italic">Get Qty</label>
                                                        <input
                                                            type="number"
                                                            value={newCoupon.bogoConfig.getQuantity}
                                                            onChange={e => setNewCoupon({ ...newCoupon, bogoConfig: { ...newCoupon.bogoConfig, getQuantity: Number(e.target.value) } })}
                                                            className="w-full bg-black/40 border border-white/5 rounded-xl p-4 text-white font-black"
                                                        />
                                                    </div>
                                                </div>
                                                <div className="space-y-2">
                                                    <label className="text-[9px] font-black text-zinc-600 uppercase italic">Discount on 'Get' (%)</label>
                                                    <input
                                                        type="number"
                                                        value={newCoupon.bogoConfig.getDiscountValue}
                                                        onChange={e => setNewCoupon({ ...newCoupon, bogoConfig: { ...newCoupon.bogoConfig, getDiscountValue: Number(e.target.value) } })}
                                                        className="w-full bg-black/40 border border-white/5 rounded-xl p-4 text-white font-black"
                                                    />
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    {/* Column 2: Constraints */}
                                    <div className="space-y-10">
                                        <div className="space-y-4">
                                            <label className="text-[10px] font-black text-emerald-500 uppercase tracking-widest ml-1">Threshold (Min Order INR)</label>
                                            <input
                                                type="number"
                                                value={newCoupon.minOrderAmount}
                                                onChange={e => setNewCoupon({ ...newCoupon, minOrderAmount: e.target.value })}
                                                className="w-full bg-white/5 border border-white/5 rounded-3xl py-6 px-10 text-xl font-black text-white focus:border-emerald-500/50 transition-all outline-none italic"
                                                placeholder="0 (Unlimited)"
                                            />
                                        </div>

                                        <div className="space-y-4">
                                            <label className="text-[10px] font-black text-emerald-500 uppercase tracking-widest ml-1">Global Limit (Max Claims)</label>
                                            <input
                                                type="number"
                                                value={newCoupon.usageLimit}
                                                onChange={e => setNewCoupon({ ...newCoupon, usageLimit: e.target.value })}
                                                className="w-full bg-white/5 border border-white/5 rounded-3xl py-6 px-10 text-xl font-black text-white focus:border-emerald-500/50 transition-all outline-none italic"
                                                placeholder="0 (Unlimited)"
                                            />
                                        </div>

                                        <div className="space-y-4">
                                            <label className="text-[10px] font-black text-zinc-600 uppercase tracking-widest ml-1 italic">Scope Perimeter</label>
                                            <div className="flex gap-2 p-1.5 bg-white/5 rounded-2xl border border-white/5">
                                                {['all', 'specific'].map(s => (
                                                    <button
                                                        key={s}
                                                        type="button"
                                                        onClick={() => setNewCoupon({ ...newCoupon, appliesTo: s as any })}
                                                        className={cn(
                                                            "flex-1 py-3 rounded-xl text-[9px] font-black uppercase tracking-widest italic transition-all",
                                                            newCoupon.appliesTo === s ? "bg-zinc-800 text-white" : "text-zinc-600"
                                                        )}
                                                    >
                                                        {s}
                                                    </button>
                                                ))}
                                            </div>
                                            {newCoupon.appliesTo === 'specific' && (
                                                <div className="mt-4 p-6 bg-black rounded-3xl border border-white/5 max-h-40 overflow-y-auto space-y-2 scrollbar-hide">
                                                    {products.map(p => (
                                                        <button
                                                            key={p._id}
                                                            type="button"
                                                            onClick={() => {
                                                                const exists = newCoupon.applicableProducts.includes(p._id);
                                                                setNewCoupon({
                                                                    ...newCoupon,
                                                                    applicableProducts: exists
                                                                        ? newCoupon.applicableProducts.filter(id => id !== p._id)
                                                                        : [...newCoupon.applicableProducts, p._id]
                                                                });
                                                            }}
                                                            className={cn(
                                                                "w-full flex items-center justify-between p-4 rounded-xl transition-all border text-[10px] font-black uppercase italic",
                                                                newCoupon.applicableProducts.includes(p._id)
                                                                    ? "bg-indigo-500/10 text-white border-indigo-500/20"
                                                                    : "text-zinc-700 hover:text-zinc-500 border-transparent"
                                                            )}
                                                        >
                                                            <span className="truncate pr-4">{p.title}</span>
                                                            {newCoupon.applicableProducts.includes(p._id) && <CheckCircle2 className="w-4 h-4" />}
                                                        </button>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                <div className="flex flex-col md:flex-row gap-6 pt-10 border-t border-white/5">
                                    <button
                                        type="button"
                                        onClick={() => setShowModal(false)}
                                        className="flex-1 bg-zinc-900 text-zinc-600 py-6 rounded-3xl font-black text-[11px] uppercase tracking-widest hover:text-white transition-all italic border border-white/5"
                                    >
                                        ABORT GENESIS
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={isSaving}
                                        className="flex-[2] bg-white text-black py-6 rounded-3xl font-black text-[11px] uppercase tracking-[0.3em] hover:bg-zinc-200 transition-all flex items-center justify-center gap-4 italic group"
                                    >
                                        {isSaving ? <Loader2 className="w-5 h-5 animate-spin" /> : <>DEPLOY STRATEGY <ChevronRight className="w-5 h-5 group-hover:translate-x-2 transition-transform" /></>}
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}
