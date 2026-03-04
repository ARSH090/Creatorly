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
    ShoppingBag, IndianRupee
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function CouponManagement() {
    const [coupons, setCoupons] = useState<any[]>([]);
    const [products, setProducts] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [search, setSearch] = useState("");
    const [filterStatus, setFilterStatus] = useState("All");

    const [newCoupon, setNewCoupon] = useState({
        code: '',
        discountType: 'percentage',
        discountValue: '',
        appliesTo: 'all',
        applicableProductIds: [] as string[],
        minOrderAmount: '',
        usageLimit: '',
        usageLimitPerUser: 1,
        validFrom: '',
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
            setCoupons(Array.isArray(cData) ? cData : []);
            setProducts(Array.isArray(pData) ? pData : []);
        } catch (error) {
            console.error("Failed to fetch data:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleCreate = async () => {
        try {
            const res = await fetch('/api/creator/coupons', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ...newCoupon,
                    discountValue: Number(newCoupon.discountValue),
                    minOrderAmount: Number(newCoupon.minOrderAmount) * 100, // to paisa
                    usageLimit: newCoupon.usageLimit ? Number(newCoupon.usageLimit) : undefined
                })
            });
            if (res.ok) {
                const created = await res.json();
                setCoupons([created, ...coupons]);
                setShowModal(false);
                setNewCoupon({
                    code: '', discountType: 'percentage', discountValue: '',
                    appliesTo: 'all', applicableProductIds: [],
                    minOrderAmount: '', usageLimit: '', usageLimitPerUser: 1,
                    validFrom: '', validUntil: '', isActive: true
                });
            }
        } catch (error) {
            console.error(error);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Delete this coupon?')) return;
        try {
            const res = await fetch(`/api/creator/coupons/${id}`, { method: 'DELETE' });
            if (res.ok) setCoupons(coupons.filter(c => c._id !== id));
        } catch (err) { console.error(err); }
    };

    const toggleStatus = async (coupon: any) => {
        try {
            const res = await fetch(`/api/creator/coupons/${coupon._id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ isActive: !coupon.isActive })
            });
            if (res.ok) {
                setCoupons(coupons.map(c => c._id === coupon._id ? { ...c, isActive: !c.isActive } : c));
            }
        } catch (err) { console.error(err); }
    };

    const filteredCoupons = coupons.filter(c =>
        c.code.toLowerCase().includes(search.toLowerCase()) &&
        (filterStatus === 'All' || (filterStatus === 'Active' ? c.isActive : !c.isActive))
    );

    return (
        <div className="space-y-10 pb-20">
            {/* Header */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                <div>
                    <h1 className="text-4xl font-black text-white tracking-tightest mb-2 italic uppercase flex items-center gap-4">
                        <Ticket className="w-10 h-10 text-indigo-500" />
                        Promo Strategy
                    </h1>
                    <p className="text-zinc-500 font-medium text-lg">Weaponize discounts to scale your conversions.</p>
                </div>
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => setShowModal(true)}
                        className="flex items-center gap-3 bg-white text-black px-8 py-4 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-zinc-200 transition-all shadow-2xl shadow-white/5 group"
                    >
                        <Plus className="w-5 h-5 group-hover:rotate-90 transition-transform" />
                        Generate Code
                    </button>
                </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {[
                    { label: 'Active Campaigns', value: coupons.filter(c => c.isActive).length, icon: Zap, color: 'indigo' },
                    { label: 'Total Redemptions', value: coupons.reduce((acc, c) => acc + (c.usageCount || 0), 0), icon: MousePointer2, color: 'emerald' },
                    { label: 'Attributed Revenue', value: `₹${(coupons.reduce((acc, c) => acc + (c.totalRevenueDriven || 0), 0) / 100).toLocaleString()}`, icon: TrendingUp, color: 'amber' }
                ].map((stat, i) => (
                    <motion.div
                        key={stat.label}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.1 }}
                        className="bg-zinc-900/40 backdrop-blur-xl border border-white/5 p-8 rounded-[2.5rem] group hover:border-white/10 transition-all cursor-default relative overflow-hidden"
                    >
                        <div className={`absolute -right-4 -top-4 w-24 h-24 bg-${stat.color}-500/5 rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-opacity`} />
                        <p className="text-[10px] font-black uppercase tracking-widest text-zinc-600 mb-4">{stat.label}</p>
                        <div className="flex items-end justify-between">
                            <h3 className="text-4xl font-black text-white tracking-tighter">{stat.value}</h3>
                            <div className={`p-3 rounded-2xl bg-${stat.color}-500/10 text-${stat.color}-400`}>
                                <stat.icon className="w-5 h-5" />
                            </div>
                        </div>
                    </motion.div>
                ))}
            </div>

            {/* Coupons List */}
            <div className="bg-zinc-900/40 backdrop-blur-2xl border border-white/5 rounded-[3rem] overflow-hidden">
                <div className="p-8 border-b border-white/5 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex bg-black/40 p-1.5 rounded-2xl border border-white/5">
                        {['All', 'Active', 'Inactive'].map(s => (
                            <button
                                key={s}
                                onClick={() => setFilterStatus(s)}
                                className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${filterStatus === s ? 'bg-white text-black' : 'text-zinc-500 hover:text-white'}`}
                            >
                                {s}
                            </button>
                        ))}
                    </div>
                    <div className="relative group">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-600 group-focus-within:text-white transition-colors" />
                        <input
                            type="text"
                            placeholder="Scan by code..."
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            className="bg-black/60 border border-white/5 rounded-2xl py-3.5 pl-12 pr-6 text-sm text-white focus:outline-none focus:border-indigo-500/30 transition-all w-full md:w-64"
                        />
                    </div>
                </div>

                <div className="overflow-x-auto">
                    {loading ? (
                        <div className="p-20 flex justify-center"><div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" /></div>
                    ) : filteredCoupons.length > 0 ? (
                        <table className="w-full text-left">
                            <thead>
                                <tr className="text-[10px] font-black uppercase tracking-widest text-zinc-600 border-b border-white/5">
                                    <th className="px-10 py-6">Code / Type</th>
                                    <th className="px-10 py-6">Discount</th>
                                    <th className="px-10 py-6">Performance</th>
                                    <th className="px-10 py-6">Status</th>
                                    <th className="px-10 py-6 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5">
                                {filteredCoupons.map((coupon) => (
                                    <tr key={coupon._id} className="group hover:bg-white/[0.02] transition-colors">
                                        <td className="px-10 py-8">
                                            <div className="flex items-center gap-4">
                                                <div className="w-12 h-12 rounded-[1.25rem] bg-indigo-500/10 flex items-center justify-center text-indigo-400 border border-indigo-500/10 italic font-black">
                                                    {coupon.discountType === 'percentage' ? '%' : '₹'}
                                                </div>
                                                <div>
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-xl font-black text-white italic uppercase tracking-tighter">{coupon.code}</span>
                                                        <button
                                                            onClick={() => { navigator.clipboard.writeText(coupon.code) }}
                                                            className="opacity-0 group-hover:opacity-100 p-1.5 hover:bg-white/10 rounded-lg text-zinc-600 hover:text-white transition-all"
                                                        >
                                                            <Copy className="w-3.5 h-3.5" />
                                                        </button>
                                                    </div>
                                                    <p className="text-[10px] text-zinc-500 font-black uppercase tracking-widest mt-0.5">
                                                        {coupon.appliesTo === 'all' ? 'Site-wide' : `${coupon.applicableProductIds?.length || 0} Products`}
                                                    </p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-10 py-8">
                                            <div className="space-y-1">
                                                <span className="text-lg font-black text-white tracking-tight">
                                                    {coupon.discountType === 'percentage' ? `${coupon.discountValue}%` : `₹${coupon.discountValue}`}
                                                </span>
                                                {coupon.minOrderAmount > 0 && (
                                                    <p className="text-[10px] text-zinc-600 font-bold uppercase tracking-wider">Min: ₹{coupon.minOrderAmount / 100}</p>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-10 py-8">
                                            <div className="space-y-2">
                                                <div className="flex items-center gap-2">
                                                    <div className="flex-1 h-1.5 bg-white/5 rounded-full overflow-hidden max-w-[100px]">
                                                        <div
                                                            className="h-full bg-emerald-500"
                                                            style={{ width: `${Math.min((coupon.usageCount / (coupon.usageLimit || 100)) * 100, 100)}%` }}
                                                        />
                                                    </div>
                                                    <span className="text-xs font-bold text-white">{coupon.usageCount || 0}</span>
                                                </div>
                                                <p className="text-[9px] text-zinc-500 font-black uppercase tracking-widest">
                                                    Limit: {coupon.usageLimit || '∞'} • Rev: ₹{(coupon.totalRevenueDriven || 0) / 100}
                                                </p>
                                            </div>
                                        </td>
                                        <td className="px-10 py-8">
                                            <button
                                                onClick={() => toggleStatus(coupon)}
                                                className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-tighter transition-all ${coupon.isActive ? 'bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20' : 'bg-red-500/10 text-red-400 hover:bg-red-500/20'}`}
                                            >
                                                {coupon.isActive ? 'Active' : 'Disabled'}
                                            </button>
                                        </td>
                                        <td className="px-10 py-8 text-right">
                                            <button
                                                onClick={() => handleDelete(coupon._id)}
                                                className="p-3 text-zinc-700 hover:text-red-400 hover:bg-red-400/10 rounded-2xl transition-all"
                                            >
                                                <Trash2 className="w-5 h-5" />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    ) : (
                        <div className="py-24 text-center">
                            <Ticket className="w-16 h-16 text-zinc-800 mx-auto mb-6" />
                            <h3 className="text-2xl font-black text-white italic uppercase mb-2">No active strategies</h3>
                            <p className="text-zinc-500 max-w-sm mx-auto font-medium">Your promo shelf is empty. Deploy your first discount code to start conversion scaling.</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Creation Modal */}
            <AnimatePresence>
                {showModal && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
                        <motion.div
                            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                            onClick={() => setShowModal(false)}
                            className="absolute inset-0 bg-black/90 backdrop-blur-xl"
                        />
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9, y: 30 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9, y: 30 }}
                            className="relative w-full max-w-2xl bg-zinc-950 border border-white/10 rounded-[3.5rem] shadow-3xl overflow-hidden"
                        >
                            <div className="p-12 space-y-10">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <h2 className="text-3xl font-black text-white uppercase italic tracking-tightest leading-none mb-2">Deploy Strategy</h2>
                                        <p className="text-zinc-500 font-medium font-sans">Configure your discount parameters.</p>
                                    </div>
                                    <button onClick={() => setShowModal(false)} className="p-3 bg-white/5 rounded-2xl text-zinc-500 hover:text-white transition-all"><X className="w-5 h-5" /></button>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-zinc-600 uppercase tracking-widest ml-1">Strategy Code</label>
                                        <input
                                            type="text"
                                            placeholder="E.G. SCALER50"
                                            value={newCoupon.code}
                                            onChange={e => setNewCoupon({ ...newCoupon, code: e.target.value.toUpperCase() })}
                                            className="w-full bg-black border border-white/5 rounded-2xl py-5 px-6 text-2xl font-black text-white placeholder:text-zinc-900 focus:border-indigo-500 transition-all uppercase italic tracking-tighter"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-zinc-600 uppercase tracking-widest ml-1">Discount Type</label>
                                        <div className="flex bg-black p-1.5 rounded-2xl border border-white/5">
                                            {['percentage', 'fixed'].map(t => (
                                                <button
                                                    key={t}
                                                    onClick={() => setNewCoupon({ ...newCoupon, discountType: t as any })}
                                                    className={`flex-1 py-3.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${newCoupon.discountType === t ? 'bg-white text-black shadow-lg' : 'text-zinc-600 hover:text-zinc-300'}`}
                                                >
                                                    {t === 'percentage' ? 'Percent' : 'Float'}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-zinc-600 uppercase tracking-widest ml-1">Magnitude ({newCoupon.discountType === 'percentage' ? '%' : '₹'})</label>
                                        <input
                                            type="number"
                                            value={newCoupon.discountValue}
                                            onChange={e => setNewCoupon({ ...newCoupon, discountValue: e.target.value })}
                                            className="w-full bg-black border border-white/5 rounded-2xl py-5 px-6 text-2xl font-black text-white focus:border-indigo-500 transition-all font-sans"
                                            placeholder="0"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-zinc-600 uppercase tracking-widest ml-1">Min. Order (INR)</label>
                                        <input
                                            type="number"
                                            value={newCoupon.minOrderAmount}
                                            onChange={e => setNewCoupon({ ...newCoupon, minOrderAmount: e.target.value })}
                                            className="w-full bg-black border border-white/5 rounded-2xl py-5 px-6 text-2xl font-black text-white focus:border-indigo-500 transition-all font-sans"
                                            placeholder="0"
                                        />
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <label className="text-[10px] font-black text-zinc-600 uppercase tracking-widest ml-1">Applicable Scope</label>
                                    <div className="flex flex-wrap gap-2">
                                        <button
                                            onClick={() => setNewCoupon({ ...newCoupon, appliesTo: 'all' })}
                                            className={`px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-all ${newCoupon.appliesTo === 'all' ? 'bg-indigo-500 border-indigo-500 text-white' : 'bg-black border-white/5 text-zinc-500'}`}
                                        >
                                            Global (All Products)
                                        </button>
                                        <button
                                            onClick={() => setNewCoupon({ ...newCoupon, appliesTo: 'specific' })}
                                            className={`px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-all ${newCoupon.appliesTo === 'specific' ? 'bg-indigo-500 border-indigo-500 text-white' : 'bg-black border-white/5 text-zinc-500'}`}
                                        >
                                            Targeted (Specific)
                                        </button>
                                    </div>

                                    {newCoupon.appliesTo === 'specific' && (
                                        <div className="p-6 bg-black rounded-3xl border border-white/5 max-h-48 overflow-y-auto space-y-2 scrollbar-hide">
                                            {products.map(p => (
                                                <button
                                                    key={p._id}
                                                    onClick={() => {
                                                        const exists = newCoupon.applicableProductIds.includes(p._id);
                                                        setNewCoupon({
                                                            ...newCoupon,
                                                            applicableProductIds: exists
                                                                ? newCoupon.applicableProductIds.filter(id => id !== p._id)
                                                                : [...newCoupon.applicableProductIds, p._id]
                                                        });
                                                    }}
                                                    className={`w-full flex items-center justify-between p-3 rounded-2xl transition-all ${newCoupon.applicableProductIds.includes(p._id) ? 'bg-indigo-500/10 text-white border border-indigo-500/20' : 'text-zinc-600 hover:text-zinc-400 border border-transparent'}`}
                                                >
                                                    <span className="text-xs font-bold truncate">{p.title}</span>
                                                    {newCoupon.applicableProductIds.includes(p._id) && <CheckCircle2 className="w-4 h-4 text-indigo-400" />}
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                <div className="flex gap-4 pt-4">
                                    <button
                                        onClick={() => setShowModal(false)}
                                        className="flex-1 bg-white/5 text-zinc-500 py-5 rounded-[2rem] font-black text-xs uppercase tracking-widest hover:text-white transition-all shadow-xl"
                                    >
                                        Abort
                                    </button>
                                    <button
                                        onClick={handleCreate}
                                        className="flex-[2] bg-white text-black py-5 rounded-[2rem] font-black text-xs uppercase tracking-[0.2em] hover:bg-zinc-200 transition-all shadow-2xl shadow-indigo-500/10 flex items-center justify-center gap-3 group"
                                    >
                                        Deploy Strategy
                                        <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}
