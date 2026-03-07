'use client';

import React, { useState, useEffect, useCallback } from "react";
import {
    Plus, Search, Package,
    LayoutGrid, List, Zap,
    Eye, BarChart3, Download, Users, DollarSign, TrendingUp,
    MoreVertical, Trash2, Archive, CheckCircle2, XCircle, ChevronLeft, ChevronRight,
    Filter, ArrowUpDown, Loader2, LayoutDashboard
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { toast } from "react-hot-toast";
import EmptyState from "@/components/dashboard/EmptyState";
import ProductRow from "@/components/products/ProductRow";
import ProductGridCard from "@/components/products/ProductGridCard";

export default function ProductsOverview() {
    const [view, setView] = useState<'grid' | 'list'>('grid');
    const [products, setProducts] = useState<any[]>([]);
    const [stats, setStats] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [debouncedSearch, setDebouncedSearch] = useState("");
    const [filterStatus, setFilterStatus] = useState("All");
    const [filterType, setFilterType] = useState("All");
    const [sortBy, setSortBy] = useState("newest");
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);

    // Bulk Action State
    const [selectedIds, setSelectedIds] = useState<string[]>([]);
    const [isBulkLoading, setIsBulkLoading] = useState(false);

    // Debounce search
    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearch(search);
            setPage(1); // Reset to page 1 on search
        }, 400);
        return () => clearTimeout(timer);
    }, [search]);

    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            const query = new URLSearchParams({
                status: filterStatus,
                type: filterType,
                search: debouncedSearch,
                sort: sortBy,
                page: page.toString(),
                limit: '12'
            });
            const res = await fetch(`/api/creator/products?${query}`);
            const data = await res.json();

            if (res.ok) {
                setProducts(data.products || []);
                setStats(data.stats);
                setTotalPages(data.pagination.totalPages);
            }
        } catch (error) {
            console.error("Failed to fetch products:", error);
            toast.error("Failed to load products");
        } finally {
            setLoading(false);
        }
    }, [filterStatus, filterType, debouncedSearch, sortBy, page]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const handleBulkAction = async (action: 'publish' | 'unpublish' | 'archive' | 'delete') => {
        if (selectedIds.length === 0) return;
        if (action === 'delete' && !confirm(`Are you sure you want to delete ${selectedIds.length} products?`)) return;

        setIsBulkLoading(true);
        try {
            const res = await fetch('/api/creator/products', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action, productIds: selectedIds })
            });

            if (res.ok) {
                toast.success(`Bulk ${action} successful`);
                setSelectedIds([]);
                fetchData();
            } else {
                toast.error(`Bulk ${action} failed`);
            }
        } catch (err) {
            toast.error("An error occurred");
        } finally {
            setIsBulkLoading(false);
        }
    };

    const toggleSelect = (id: string) => {
        setSelectedIds(prev =>
            prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
        );
    };

    const handleArchive = async (id: string) => {
        if (!confirm('Archive this product?')) return;
        try {
            const res = await fetch(`/api/creator/products/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: 'archived' })
            });
            if (res.ok) {
                toast.success('Product archived');
                fetchData();
            }
        } catch (err) {
            toast.error('Failed to archive');
        }
    };

    return (
        <div className="space-y-10 pb-24">
            {/* Header section */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                <div>
                    <h1 className="text-4xl font-black text-white tracking-tightest mb-2 flex items-center gap-4 italic uppercase">
                        <Package className="w-10 h-10 text-indigo-500" />
                        Inventory Control
                    </h1>
                    <p className="text-zinc-600 font-black text-[10px] uppercase tracking-[0.3em] italic">Precision Management • Revenue Tracking • Bulk Fulfillment</p>
                </div>
                <div className="flex items-center gap-4">
                    <div className="flex bg-zinc-900/80 backdrop-blur-xl p-1.5 rounded-2xl border border-white/5 shadow-2xl">
                        <button
                            onClick={() => setView('grid')}
                            className={`p-2.5 rounded-xl transition-all ${view === 'grid' ? 'bg-white text-black shadow-xl shadow-white/10' : 'text-zinc-600 hover:text-white'}`}
                        >
                            <LayoutGrid className="w-5 h-5" />
                        </button>
                        <button
                            onClick={() => setView('list')}
                            className={`p-2.5 rounded-xl transition-all ${view === 'list' ? 'bg-white text-black shadow-xl shadow-white/10' : 'text-zinc-600 hover:text-white'}`}
                        >
                            <List className="w-5 h-5" />
                        </button>
                    </div>
                    <Link
                        href="/dashboard/storefront"
                        className="flex items-center gap-3 bg-zinc-900/50 text-zinc-400 border border-white/5 px-7 py-3.5 rounded-2xl font-black text-xs uppercase tracking-widest hover:text-white hover:border-white/10 transition-all italic"
                    >
                        <LayoutDashboard className="w-5 h-5 text-indigo-400" />
                        DESIGN STORE
                    </Link>
                    <Link
                        href="/dashboard/products/new"
                        className="flex items-center gap-3 bg-white text-black px-7 py-3.5 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-zinc-200 transition-all shadow-2xl shadow-white/5 group italic"
                    >
                        <Plus className="w-5 h-5 group-hover:rotate-90 transition-transform" />
                        GENERATE UNIT
                    </Link>
                </div>
            </div>

            {/* Performance Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-5">
                {[
                    { label: 'Total Units', value: stats?.total || 0, icon: Package, color: 'indigo' },
                    { label: 'Published', value: stats?.published || 0, icon: CheckCircle2, color: 'emerald' },
                    { label: 'In Draft', value: stats?.draft || 0, icon: Trash2, color: ' amber' },
                    { label: 'Archived', value: stats?.archived || 0, icon: Archive, color: 'rose' },
                    { label: 'Gross Revenue', value: stats?.totalRevenue ? `₹${(stats.totalRevenue / 100).toLocaleString()}` : '₹0', icon: TrendingUp, color: 'purple' }
                ].map((stat, i) => (
                    <motion.div
                        key={stat.label}
                        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}
                        className="bg-zinc-900/40 backdrop-blur-md border border-white/5 p-6 rounded-[2.5rem] group hover:border-white/10 transition-all relative overflow-hidden"
                    >
                        <p className="text-[9px] font-black uppercase tracking-[0.2em] text-zinc-600 mb-4 italic">{stat.label}</p>
                        <div className="flex items-end justify-between">
                            <h3 className="text-2xl font-black text-white italic tracking-tighter">{stat.value}</h3>
                            <div className={`p-3 rounded-2xl bg-white/5 text-zinc-400 group-hover:scale-110 transition-transform`}>
                                <stat.icon className="w-4 h-4" />
                            </div>
                        </div>
                    </motion.div>
                ))}
            </div>

            {/* Controller Bar */}
            <div className="flex flex-col gap-6 bg-zinc-900/20 p-8 rounded-[3rem] border border-white/5 relative">
                <div className="flex flex-col md:flex-row gap-6">
                    <div className="relative flex-1 group">
                        <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-700 group-focus-within:text-white transition-all" />
                        <input
                            type="text"
                            placeholder="SEARCH REGISTRY..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="w-full bg-black/40 border border-white/5 rounded-full py-5 pl-16 pr-8 text-xs font-black italic tracking-widest text-white placeholder:text-zinc-800 focus:outline-none focus:border-indigo-500/30 transition-all uppercase"
                        />
                    </div>
                    <div className="flex items-center gap-3 bg-black/40 p-2 rounded-full border border-white/5">
                        <div className="px-4 text-[9px] font-black text-zinc-700 uppercase tracking-widest italic flex items-center gap-2">
                            <Filter className="w-3 h-3" />
                            Scope
                        </div>
                        {['All', 'Published', 'Draft', 'Archived'].map(status => (
                            <button
                                key={status}
                                onClick={() => setFilterStatus(status)}
                                className={`px-6 py-3 rounded-full text-[9px] font-black uppercase tracking-widest italic transition-all ${filterStatus === status
                                    ? 'bg-white text-black shadow-xl shadow-white/5'
                                    : 'text-zinc-600 hover:text-white'
                                    }`}
                            >
                                {status}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Bulk Actions Overlay */}
                <AnimatePresence>
                    {selectedIds.length > 0 && (
                        <motion.div
                            initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 20, opacity: 0 }}
                            className="bg-indigo-600 p-4 rounded-3xl flex items-center justify-between shadow-[0_0_50px_rgba(79,70,229,0.4)]"
                        >
                            <div className="flex items-center gap-4 ml-4">
                                <span className="text-xs font-black text-white italic tracking-widest uppercase">
                                    {selectedIds.length} UNITS CAPTURED
                                </span>
                                <button onClick={() => setSelectedIds([])} className="text-white/60 hover:text-white"><XCircle className="w-5 h-5" /></button>
                            </div>
                            <div className="flex items-center gap-2 pr-2">
                                <button onClick={() => handleBulkAction('publish')} className="bg-white/10 hover:bg-white/20 text-white px-5 py-2.5 rounded-2xl text-[10px] font-black uppercase tracking-widest disabled:opacity-50 transition-all">Publish</button>
                                <button onClick={() => handleBulkAction('unpublish')} className="bg-white/10 hover:bg-white/20 text-white px-5 py-2.5 rounded-2xl text-[10px] font-black uppercase tracking-widest disabled:opacity-50 transition-all">Draft</button>
                                <button onClick={() => handleBulkAction('archive')} className="bg-white/10 hover:bg-white/20 text-white px-5 py-2.5 rounded-2xl text-[10px] font-black uppercase tracking-widest disabled:opacity-50 transition-all">Archive</button>
                                <button onClick={() => handleBulkAction('delete')} className="bg-red-500 hover:bg-red-600 text-white px-5 py-2.5 rounded-2xl text-[10px] font-black uppercase tracking-widest disabled:opacity-50 transition-all">Purge</button>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* Content Area */}
            {loading && !isBulkLoading ? (
                <div className={view === 'grid' ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8" : "bg-zinc-900/20 rounded-[3rem] border border-white/5 overflow-hidden"}>
                    {Array.from({ length: 8 }).map((_, i) => (
                        <div key={i} className={`bg-zinc-900/40 border border-white/5 animate-pulse rounded-[3rem] ${view === 'grid' ? 'h-96' : 'h-24 m-4'}`} />
                    ))}
                </div>
            ) : products.length > 0 ? (
                <div className="space-y-8">
                    <div className={view === 'grid' ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8" : "bg-zinc-900/20 border border-white/5 rounded-[3rem] overflow-hidden"}>
                        {products.map((product, i) => (
                            view === 'grid' ? (
                                <ProductGridCard key={product._id} product={product} index={i} onArchive={handleArchive} />
                            ) : (
                                <ProductRow
                                    key={product._id}
                                    product={product}
                                    index={i}
                                    onArchive={handleArchive}
                                    isSelected={selectedIds.includes(product._id)}
                                    onSelect={toggleSelect}
                                />
                            )
                        ))}
                    </div>

                    {/* Pagination */}
                    {totalPages > 1 && (
                        <div className="flex items-center justify-center gap-4 mt-12">
                            <button
                                onClick={() => setPage(p => Math.max(1, p - 1))}
                                disabled={page === 1}
                                className="p-4 rounded-2xl bg-zinc-900 border border-white/5 text-zinc-500 hover:text-white disabled:opacity-30 transition-all"
                            >
                                <ChevronLeft className="w-5 h-5" />
                            </button>
                            <div className="flex items-center gap-2">
                                {Array.from({ length: totalPages }).map((_, i) => (
                                    <button
                                        key={i}
                                        onClick={() => setPage(i + 1)}
                                        className={`w-12 h-12 rounded-2xl font-black text-xs transition-all ${page === i + 1 ? 'bg-white text-black shadow-2xl' : 'bg-zinc-900 text-zinc-500 hover:text-white border border-white/5'}`}
                                    >
                                        {i + 1}
                                    </button>
                                ))}
                            </div>
                            <button
                                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                                disabled={page === totalPages}
                                className="p-4 rounded-2xl bg-zinc-900 border border-white/5 text-zinc-500 hover:text-white disabled:opacity-30 transition-all"
                            >
                                <ChevronRight className="w-5 h-5" />
                            </button>
                        </div>
                    )}
                </div>
            ) : (
                <div className="py-20">
                    <EmptyState
                        imageUrl="/empty-products.png"
                        title="REGISTRY VOID"
                        description="No units detected in the current scope. Accelerate your empire by deploying your first digital asset today."
                        actionLabel="DEPLOY FIRST UNIT"
                        onAction={() => window.location.href = '/dashboard/products/new'}
                    />
                </div>
            )}
        </div>
    );
}
