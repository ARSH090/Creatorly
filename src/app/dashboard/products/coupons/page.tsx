'use client';

import React, { useState, useEffect } from "react";
import {
    Plus, Search, Ticket, Calendar,
    ArrowRight, MoreVertical, Trash2,
    Zap, Percent, Tag, Users,
    TrendingUp, MousePointer2, AlertCircle,
    Copy, Download, Eye, Edit3,
    Pause, Play, BarChart3, Filter,
    Gift, Clock, CheckCircle2
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function CouponManagement() {
    const [coupons, setCoupons] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [showBulkModal, setShowBulkModal] = useState(false);
    const [showAnalyticsModal, setShowAnalyticsModal] = useState(false);
    const [analytics, setAnalytics] = useState<any>(null);
    const [filterStatus, setFilterStatus] = useState("all");
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedProducts, setSelectedProducts] = useState<string[]>([]);
    const [timeframe, setTimeframe] = useState("30d");
    const [newCoupon, setNewCoupon] = useState({
        code: '',
        discountType: 'percentage',
        discountValue: '',
        maxDiscountCap: '',
        appliesTo: 'all',
        applicableProductIds: [],
        minimumPurchaseAmount: '',
        maxUses: '',
        perCustomerLimit: 1,
        firstTimeOnly: false,
        validFrom: '',
        expiresAt: '',
        showHintOnStorefront: false,
        internalNote: ''
    });
    const [bulkCoupon, setBulkCoupon] = useState({
        quantity: 100,
        prefix: 'INFL-',
        discountType: 'percentage',
        discountValue: '',
        maxUses: 1,
        expiresAt: ''
    });

    useEffect(() => {
        fetchCoupons();
    }, [filterStatus, searchTerm]);

    const fetchCoupons = async () => {
        try {
            const res = await fetch(`/api/coupons?status=${filterStatus}&search=${searchTerm}`);
            const data = await res.json();
            setCoupons(data.data || []);
        } catch (error) {
            console.error("Failed to fetch coupons:", error);
        } finally {
            setLoading(false);
        }
    };

    const fetchAnalytics = async () => {
        try {
            const res = await fetch(`/api/coupons/analytics?timeframe=${timeframe}`);
            const data = await res.json();
            setAnalytics(data.data);
        } catch (error) {
            console.error("Failed to fetch analytics:", error);
        }
    };

    const handleCreateCoupon = async () => {
        try {
            const res = await fetch('/api/coupons', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(newCoupon)
            });
            const data = await res.json();
            if (data.data) {
                setCoupons([data.data, ...coupons]);
                setShowModal(false);
                setNewCoupon({
                    code: '',
                    discountType: 'percentage',
                    discountValue: '',
                    maxDiscountCap: '',
                    appliesTo: 'all',
                    applicableProductIds: [],
                    minimumPurchaseAmount: '',
                    maxUses: '',
                    perCustomerLimit: 1,
                    firstTimeOnly: false,
                    validFrom: '',
                    expiresAt: '',
                    showHintOnStorefront: false,
                    internalNote: ''
                });
            }
        } catch (error) {
            console.error("Failed to create coupon:", error);
        }
    };

    const handleBulkGenerate = async () => {
        try {
            const res = await fetch('/api/coupons/bulk', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(bulkCoupon)
            });
            const data = await res.json();
            if (data.data) {
                setCoupons([...data.data.coupons, ...coupons]);
                setShowBulkModal(false);
            }
        } catch (error) {
            console.error("Failed to generate bulk coupons:", error);
        }
    };

    const copyCouponCode = (code: string) => {
        navigator.clipboard.writeText(code);
    };

    const generateCouponCode = () => {
        const adjectives = ['SAVE', 'LAUNCH', 'SUMMER', 'WINTER', 'SPRING', 'FALL', 'FLASH', 'MEGA', 'SUPER', 'EXTRA'];
        const numbers = Math.floor(Math.random() * 100);
        const adjective = adjectives[Math.floor(Math.random() * adjectives.length)];
        return `${adjective}${numbers}`;
    };

    const filteredCoupons = coupons.filter(coupon => {
        const matchesSearch = coupon.code.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesStatus = filterStatus === 'all' || 
            (filterStatus === 'active' && coupon.isActive && (!coupon.expiresAt || new Date(coupon.expiresAt) >= new Date())) ||
            (filterStatus === 'expired' && new Date(coupon.expiresAt) < new Date()) ||
            (filterStatus === 'paused' && !coupon.isActive);
        return matchesSearch && matchesStatus;
    });

    const stats = {
        active: coupons.filter(c => c.isActive && (!c.expiresAt || new Date(c.expiresAt) >= new Date())).length,
        totalUsed: coupons.reduce((acc, c) => acc + (c.usedCount || 0), 0),
        revenue: coupons.reduce((acc, c) => acc + (c.totalRevenueDriven || 0), 0),
        avgDiscount: coupons.length > 0 ? coupons.reduce((acc, c) => acc + (c.discountValue || 0), 0) / coupons.length : 0
    };

    return (
        <div className="space-y-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-black text-white tracking-tightest mb-2 flex items-center gap-3">
                        <Ticket className="w-8 h-8 text-indigo-500" />
                        Discount Coupons
                    </h1>
                    <p className="text-zinc-500 font-medium">Boost sales with promotional codes and strategic discounts</p>
                </div>
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => {
                            fetchAnalytics();
                            setShowAnalyticsModal(true);
                        }}
                        className="flex items-center gap-2 bg-zinc-900/50 border border-white/5 text-white px-5 py-2.5 rounded-xl font-bold text-sm uppercase tracking-wider hover:bg-zinc-800 transition-all"
                    >
                        <BarChart3 className="w-4 h-4" />
                        Analytics
                    </button>
                    <button
                        onClick={() => setShowBulkModal(true)}
                        className="flex items-center gap-2 bg-zinc-900/50 border border-white/5 text-white px-5 py-2.5 rounded-xl font-bold text-sm uppercase tracking-wider hover:bg-zinc-800 transition-all"
                    >
                        <Gift className="w-4 h-4" />
                        Bulk Generate
                    </button>
                    <button
                        onClick={() => setShowModal(true)}
                        className="flex items-center gap-2 bg-white text-black px-5 py-2.5 rounded-xl font-bold text-sm uppercase tracking-wider hover:bg-zinc-200 transition-all shadow-xl shadow-white/5 group"
                    >
                        <Plus className="w-4 h-4 group-hover:rotate-90 transition-transform" />
                        Create Coupon
                    </button>
                </div>

            {/* Quick Insights */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {[
                    { label: 'Active Coupons', value: coupons.filter(c => c.isActive).length, icon: Zap, color: 'indigo' },
                    { label: 'Total Uses', value: coupons.reduce((acc, c) => acc + (c.usedCount || 0), 0), icon: MousePointer2, color: 'emerald' },
                    { label: 'Revenue Driven', value: `₹${coupons.reduce((acc, c) => acc + (c.totalRevenueDriven || 0), 0).toLocaleString()}`, icon: TrendingUp, color: 'amber' }
                ].map((stat, i) => (
                    <motion.div
                        key={stat.label}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.1 }}
                        className="bg-zinc-900/40 border border-white/5 p-6 rounded-[2.5rem] group hover:border-white/10 transition-all"
                    >
                        <p className="text-[10px] font-black uppercase tracking-widest text-zinc-600 mb-2">{stat.label}</p>
                        <div className="flex items-end justify-between">
                            <h3 className="text-3xl font-black text-white">{stat.value}</h3>
                            <div className={`p-3 rounded-2xl bg-${stat.color}-500/10 text-${stat.color}-400`}>
                                <stat.icon className="w-5 h-5" />
                            </div>
                        </div>
                    </motion.div>
                ))}
            </div>

            {/* Coupons Table/List */}
            <div className="bg-zinc-900/40 border border-white/5 rounded-[3rem] overflow-hidden">
                <div className="p-8 border-b border-white/5 flex items-center justify-between">
                    <h2 className="text-xl font-black text-white uppercase italic">Active Codes</h2>
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-600" />
                        <input
                            type="text"
                            placeholder="Search code..."
                            className="bg-black/40 border border-white/5 rounded-xl py-2 pl-10 pr-4 text-sm text-white focus:outline-none focus:border-indigo-500/30 transition-all font-sans"
                        />
                    </div>
                </div>

                {loading ? (
                    <div className="p-20 flex justify-center">
                        <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
                    </div>
                ) : coupons.length > 0 ? (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="text-[10px] font-black uppercase tracking-widest text-zinc-600 border-b border-white/5">
                                    <th className="px-8 py-5">Coupon Code</th>
                                    <th className="px-8 py-5">Value</th>
                                    <th className="px-8 py-5">Usage</th>
                                    <th className="px-8 py-5">Revenue</th>
                                    <th className="px-8 py-5">Expires</th>
                                    <th className="px-8 py-5">Status</th>
                                    <th className="px-8 py-5 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5">
                                {coupons.map((coupon) => (
                                    <tr key={coupon._id} className="group hover:bg-white/[0.02] transition-colors">
                                        <td className="px-8 py-6">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-xl bg-indigo-500/10 flex items-center justify-center text-indigo-400 border border-indigo-500/10 uppercase font-black text-xs">
                                                    {coupon.discountType === 'percentage' ? '%' : '₹'}
                                                </div>
                                                <span className="text-base font-black text-white group-hover:text-indigo-400 transition-colors uppercase tracking-tight">{coupon.code}</span>
                                            </div>
                                        </td>
                                        <td className="px-8 py-6">
                                            <span className="text-sm font-bold text-white">
                                                {coupon.discountType === 'percentage' ? `${coupon.discountValue}% Off` : `₹${coupon.discountValue} Off`}
                                            </span>
                                        </td>
                                        <td className="px-8 py-6">
                                            <div className="flex flex-col gap-1">
                                                <span className="text-sm font-black text-white">{coupon.usedCount || 0} used</span>
                                                <span className="text-[10px] text-zinc-600 font-bold uppercase tracking-wider">Limit: {coupon.maxUses || 'Unlimited'}</span>
                                            </div>
                                        </td>
                                        <td className="px-8 py-6">
                                            <span className="text-sm font-black text-emerald-400 tracking-tighter">₹{(coupon.totalRevenueDriven || 0).toLocaleString()}</span>
                                        </td>
                                        <td className="px-8 py-6">
                                            <span className="text-sm font-medium text-zinc-500">
                                                {coupon.expiresAt ? new Date(coupon.expiresAt).toLocaleDateString() : 'Never'}
                                            </span>
                                        </td>
                                        <td className="px-8 py-6">
                                            <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-tighter ${coupon.isActive ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-500'}`}>
                                                <div className={`w-1.5 h-1.5 rounded-full ${coupon.isActive ? 'bg-emerald-500' : 'bg-red-500'}`} />
                                                {coupon.isActive ? 'Active' : 'Disabled'}
                                            </div>
                                        </td>
                                        <td className="px-8 py-6 text-right">
                                            <button className="p-2 text-zinc-600 hover:text-white transition-colors">
                                                <MoreVertical className="w-5 h-5" />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <div className="p-20 text-center">
                        <div className="w-16 h-16 bg-zinc-900 rounded-full flex items-center justify-center mx-auto mb-6">
                            <Tag className="w-8 h-8 text-zinc-700" />
                        </div>
                        <h3 className="text-xl font-bold text-white mb-2">No coupons yet</h3>
                        <p className="text-zinc-500 mb-8 max-w-sm mx-auto">Create discount codes to drive more sales and reward your loyal audience.</p>
                        <button
                            onClick={() => setShowModal(true)}
                            className="bg-indigo-500 text-white px-8 py-3 rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-indigo-600 transition-all shadow-xl shadow-indigo-500/20"
                        >
                            Create First Coupon
                        </button>
                    </div>
                )}
            </div>
            {/* Create Coupon Modal */}
            <AnimatePresence>
                {showModal && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setShowModal(false)}
                            className="absolute inset-0 bg-black/80 backdrop-blur-2xl"
                        />
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9, y: 20 }}
                            className="relative w-full max-w-xl bg-[#0A0A0A] border border-white/10 rounded-[3rem] shadow-3xl overflow-hidden"
                        >
                            <div className="p-10 space-y-8">
                                <div className="space-y-2">
                                    <h2 className="text-3xl font-black text-white uppercase italic tracking-tightest">New Promo Code</h2>
                                    <p className="text-zinc-500 font-medium font-sans">Set up your discount logic below.</p>
                                </div>

                                <div className="space-y-6">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-zinc-600 uppercase tracking-widest ml-2">Coupon Code</label>
                                        <input
                                            type="text"
                                            placeholder="E.G. LAUNCH50"
                                            value={newCoupon.code}
                                            onChange={(e) => setNewCoupon({ ...newCoupon, code: e.target.value.toUpperCase() })}
                                            className="w-full bg-black border border-white/5 rounded-2xl py-4 px-6 text-xl font-black text-white placeholder:text-zinc-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500/40 transition-all uppercase tracking-tightest"
                                        />
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black text-zinc-600 uppercase tracking-widest ml-2">Type</label>
                                            <select
                                                value={newCoupon.discountType}
                                                onChange={(e) => setNewCoupon({ ...newCoupon, discountType: e.target.value })}
                                                className="w-full bg-black border border-white/5 rounded-2xl py-4 px-6 text-white font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all appearance-none"
                                            >
                                                <option value="percentage">Percentage (%)</option>
                                                <option value="fixed">Fixed (INR)</option>
                                            </select>
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black text-zinc-600 uppercase tracking-widest ml-2">Value</label>
                                            <input
                                                type="number"
                                                placeholder="Value"
                                                value={newCoupon.discountValue}
                                                onChange={(e) => setNewCoupon({ ...newCoupon, discountValue: e.target.value })}
                                                className="w-full bg-black border border-white/5 rounded-2xl py-4 px-6 text-white font-bold transition-all"
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div className="flex items-center gap-4 pt-4">
                                    <button
                                        onClick={() => setShowModal(false)}
                                        className="flex-1 bg-zinc-900 border border-white/5 text-zinc-400 py-4 rounded-2xl font-black text-xs uppercase tracking-widest hover:text-white transition-all shadow-xl shadow-black/20"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        onClick={handleCreateCoupon}
                                        className="flex-2 bg-indigo-500 text-white py-4 rounded-2xl font-black text-xs uppercase tracking-[0.2em] hover:bg-indigo-600 transition-all shadow-2xl shadow-indigo-500/20 px-12"
                                    >
                                        Create Coupon
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
            </div>
        </div>
    );
}
