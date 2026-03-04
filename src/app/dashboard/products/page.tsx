'use client';

import React, { useState, useEffect } from "react";
import {
    Plus, Search, Package,
    LayoutGrid, List, Table, Zap,
    Eye, BarChart3, Download, Users, DollarSign, TrendingUp
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { useUser } from "@clerk/nextjs";
import EmptyState from "@/components/dashboard/EmptyState";
import ProductRow from "@/components/products/ProductRow";
import ProductGridCard from "@/components/products/ProductGridCard";

export default function ProductsOverview() {
    const { user } = useUser();
    const [view, setView] = useState<'grid' | 'list' | 'table'>('grid');
    const [products, setProducts] = useState<any[]>([]);
    const [stats, setStats] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [filterStatus, setFilterStatus] = useState("All");
    const [filterType, setFilterType] = useState("All");

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [prodRes, statsRes] = await Promise.all([
                    fetch(`/api/creator/products?status=${filterStatus}&type=${filterType}`),
                    fetch('/api/creator/products/stats')
                ]);
                const prods = await prodRes.json();
                const st = await statsRes.json();
                setProducts(Array.isArray(prods) ? prods : []);
                setStats(st);
            } catch (error) {
                console.error("Failed to fetch products:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [filterStatus, filterType]);

    const handleArchive = async (id: string) => {
        if (!confirm('Are you sure you want to archive this product?')) return;
        try {
            const res = await fetch(`/api/creator/products/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: 'archived', isActive: false })
            });
            if (res.ok) {
                setProducts(prev => prev.map(p => p._id === id ? { ...p, status: 'archived' } : p));
            } else {
                alert('Failed to archive product.');
            }
        } catch (err) {
            console.error(err);
            alert('Failed to archive product.');
        }
    };

    const filteredProducts = products.filter(p =>
        p.title.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div className="space-y-10 pb-20">
            {/* Header section */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                <div>
                    <h1 className="text-4xl font-black text-white tracking-tightest mb-2 flex items-center gap-4">
                        <Package className="w-10 h-10 text-indigo-500" />
                        Products Dashboard
                    </h1>
                    <p className="text-zinc-500 font-medium text-lg">Manage your digital empire with precision and style.</p>
                </div>
                <div className="flex items-center gap-4">
                    <div className="flex bg-zinc-900/80 backdrop-blur-xl p-1.5 rounded-2xl border border-white/5 shadow-2xl">
                        <button
                            onClick={() => setView('grid')}
                            className={`p-2.5 rounded-xl transition-all ${view === 'grid' ? 'bg-indigo-500 text-white shadow-xl shadow-indigo-500/20' : 'text-zinc-500 hover:text-white'}`}
                            title="Grid View"
                        >
                            <LayoutGrid className="w-5 h-5" />
                        </button>
                        <button
                            onClick={() => setView('list')}
                            className={`p-2.5 rounded-xl transition-all ${view === 'list' ? 'bg-indigo-500 text-white shadow-xl shadow-indigo-500/20' : 'text-zinc-500 hover:text-white'}`}
                            title="List View"
                        >
                            <List className="w-5 h-5" />
                        </button>
                    </div>
                    <Link
                        href="/dashboard/products/new"
                        className="flex items-center gap-3 bg-white text-black px-7 py-3.5 rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-zinc-200 transition-all shadow-2xl shadow-white/10 group"
                    >
                        <Plus className="w-5 h-5 group-hover:rotate-90 transition-transform" />
                        Create Product
                    </Link>
                </div>
            </div>

            {/* Stats Bar */}
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-5">
                {[
                    { label: 'Live Products', value: stats?.publishedProducts || 0, icon: Package, color: 'indigo' },
                    { label: 'Total Sales', value: stats?.totalSales || 0, icon: Users, color: 'emerald' },
                    { label: 'Today\'s Revenue', value: `₹${(stats?.todayRevenue || 0).toLocaleString()}`, icon: DollarSign, color: 'amber' },
                    { label: 'Monthly Growth', value: `₹${(stats?.monthlyRevenue || 0).toLocaleString()}`, icon: TrendingUp, color: 'purple' },
                    { label: 'Net Revenue', value: `₹${(stats?.allTimeRevenue || 0).toLocaleString()}`, icon: BarChart3, color: 'rose' }
                ].map((stat, i) => (
                    <motion.div
                        key={stat.label}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.1 }}
                        className="bg-zinc-900/40 backdrop-blur-md border border-white/5 p-5 rounded-3xl relative overflow-hidden group hover:border-white/10 hover:bg-zinc-900/60 transition-all cursor-default"
                    >
                        <div className={`absolute -right-4 -top-4 w-24 h-24 bg-${stat.color}-500/5 rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-opacity`} />
                        <p className="text-[10px] font-black uppercase tracking-widest text-zinc-500 mb-3">{stat.label}</p>
                        <div className="flex items-end justify-between">
                            <h3 className="text-2xl font-black text-white">{stat.value}</h3>
                            <div className={`p-2 rounded-xl bg-${stat.color}-500/10 text-${stat.color}-400 group-hover:scale-110 transition-transform`}>
                                <stat.icon className="w-4 h-4" />
                            </div>
                        </div>
                    </motion.div>
                ))}
            </div>

            {/* Quick Navigation & Filters */}
            <div className="flex flex-col gap-6 bg-zinc-900/20 p-6 rounded-[2.5rem] border border-white/5">
                <div className="flex flex-wrap items-center gap-4">
                    <Link
                        href="/dashboard/products/coupons"
                        className="flex items-center gap-3 bg-zinc-900/80 border border-white/5 text-white px-6 py-3 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-zinc-800 hover:border-white/10 transition-all shadow-xl"
                    >
                        <Zap className="w-4 h-4 text-indigo-400" />
                        Manage Coupons
                    </Link>
                    <button className="flex items-center gap-3 bg-zinc-900/80 border border-white/5 text-white px-6 py-3 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-zinc-800 transition-all shadow-xl">
                        <Eye className="w-4 h-4 text-zinc-400" />
                        Storefront Prev
                    </button>
                    <button className="flex items-center gap-3 bg-zinc-900/80 border border-white/5 text-white px-6 py-3 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-zinc-800 transition-all shadow-xl">
                        <Download className="w-4 h-4 text-zinc-400" />
                        Export Data
                    </button>
                </div>

                <div className="flex flex-col md:flex-row gap-4">
                    <div className="relative flex-1 group">
                        <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-600 group-focus-within:text-white transition-colors" />
                        <input
                            type="text"
                            placeholder="Find a product by name..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="w-full bg-black/40 border border-white/5 rounded-2xl py-4 pl-14 pr-6 text-white placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-white/10 transition-all"
                        />
                    </div>
                    <div className="flex items-center gap-3 bg-black/40 p-2 rounded-2xl border border-white/5 overflow-x-auto scrollbar-hide">
                        {['All', 'Active', 'Draft', 'Archived'].map(status => (
                            <button
                                key={status}
                                onClick={() => setFilterStatus(status)}
                                className={`px-5 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest whitespace-nowrap transition-all ${filterStatus === status
                                    ? 'bg-white text-black shadow-lg shadow-white/5'
                                    : 'text-zinc-500 hover:text-white'
                                    }`}
                            >
                                {status}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Products Display */}
            {loading ? (
                <div className={view === 'grid' ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8" : "space-y-4"}>
                    {Array.from({ length: 6 }).map((_, i) => (
                        <div key={`skeleton-${i}`} className={`bg-zinc-900/40 border border-white/5 rounded-[2.5rem] animate-pulse ${view === 'grid' ? 'h-96' : 'h-24'}`} />
                    ))}
                </div>
            ) : filteredProducts.length > 0 ? (
                <div className={view === 'grid' ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8" : "bg-zinc-900/20 border border-white/5 rounded-[2.5rem] overflow-hidden"}>
                    <AnimatePresence mode="popLayout">
                        {filteredProducts.map((product, i) => (
                            view === 'grid' ? (
                                <ProductGridCard
                                    key={product._id}
                                    product={product}
                                    index={i}
                                    onArchive={handleArchive}
                                />
                            ) : (
                                <ProductRow
                                    key={product._id}
                                    product={product}
                                    index={i}
                                    onArchive={handleArchive}
                                />
                            )
                        ))}
                    </AnimatePresence>
                </div>
            ) : (
                <div className="py-10">
                    <EmptyState
                        imageUrl="/empty-products.png"
                        title="Your Digital Shelf is Empty"
                        description="Start your journey by uploading your first digital product. Whether it's an ebook, a course, or a template, your audience is waiting."
                        actionLabel="Add First Product"
                        onAction={() => window.location.href = '/dashboard/products/new'}
                    />
                </div>
            )}
        </div>
    );
}
