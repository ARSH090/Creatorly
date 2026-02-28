'use client';

import React, { useState, useEffect } from "react";
import {
    Plus, Search, Filter, MoreVertical, ExternalLink,
    Download, Users, DollarSign, TrendingUp, Package,
    Layers, BookOpen, Clock, Star, ArrowUpRight,
    LayoutGrid, List, Table, ChevronRight, Zap,
    Eye, Copy, Archive, Trash2, Edit, Share2, BarChart3
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { useUser } from "@clerk/nextjs";
import EmptyState from "@/components/dashboard/EmptyState";
import { useRouter } from "next/navigation";


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
                setProducts(prods);
                setStats(st);
            } catch (error) {
                console.error("Failed to fetch products:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [filterStatus, filterType]);

    const filteredProducts = products.filter(p =>
        p.title.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div className="space-y-8">
            {/* Header section */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-black text-white tracking-tightest mb-2 flex items-center gap-3">
                        <Package className="w-8 h-8 text-indigo-500" />
                        Digital Products
                    </h1>
                    <p className="text-zinc-500 font-medium">Manage your ebooks, courses, and more.</p>
                </div>
                <div className="flex items-center gap-3">
                    <div className="flex bg-zinc-900/50 p-1 rounded-xl border border-white/5">
                        <button
                            onClick={() => setView('grid')}
                            className={`p-2 rounded-lg transition-all ${view === 'grid' ? 'bg-indigo-500 text-white shadow-lg shadow-indigo-500/20' : 'text-zinc-500 hover:text-white'}`}
                        >
                            <LayoutGrid className="w-4 h-4" />
                        </button>
                        <button
                            onClick={() => setView('list')}
                            className={`p-2 rounded-lg transition-all ${view === 'list' ? 'bg-indigo-500 text-white shadow-lg shadow-indigo-500/20' : 'text-zinc-500 hover:text-white'}`}
                        >
                            <List className="w-4 h-4" />
                        </button>
                        <button
                            onClick={() => setView('table')}
                            className={`p-2 rounded-lg transition-all ${view === 'table' ? 'bg-indigo-500 text-white shadow-lg shadow-indigo-500/20' : 'text-zinc-500 hover:text-white'}`}
                        >
                            <Table className="w-4 h-4" />
                        </button>
                    </div>
                    <Link
                        href="/dashboard/products/new"
                        className="flex items-center gap-2 bg-white text-black px-5 py-2.5 rounded-xl font-bold text-sm uppercase tracking-wider hover:bg-zinc-200 transition-all shadow-xl shadow-white/5 group"
                    >
                        <Plus className="w-4 h-4 group-hover:rotate-90 transition-transform" />
                        New Product
                    </Link>
                </div>
            </div>

            {/* Quick Actions Row */}
            <div className="flex flex-wrap items-center gap-3">
                <Link
                    href="/dashboard/products/new"
                    className="flex items-center gap-2 bg-white text-black px-5 py-2.5 rounded-xl font-bold text-sm uppercase tracking-wider hover:bg-zinc-200 transition-all shadow-xl shadow-white/5 group"
                >
                    <Plus className="w-4 h-4 group-hover:rotate-90 transition-transform" />
                    New Product
                </Link>
                <Link
                    href="/dashboard/products/coupons"
                    className="flex items-center gap-2 bg-zinc-900/50 border border-white/5 text-white px-5 py-2.5 rounded-xl font-bold text-sm uppercase tracking-wider hover:bg-zinc-800 hover:border-white/10 transition-all"
                >
                    <Zap className="w-4 h-4" />
                    Manage Coupons
                </Link>
                <button className="flex items-center gap-2 bg-zinc-900/50 border border-white/5 text-white px-5 py-2.5 rounded-xl font-bold text-sm uppercase tracking-wider hover:bg-zinc-800 hover:border-white/10 transition-all">
                    <Eye className="w-4 h-4" />
                    View Storefront
                </button>
                <button className="flex items-center gap-2 bg-zinc-900/50 border border-white/5 text-white px-5 py-2.5 rounded-xl font-bold text-sm uppercase tracking-wider hover:bg-zinc-800 hover:border-white/10 transition-all">
                    <BarChart3 className="w-4 h-4" />
                    Analytics
                </button>
                <button className="flex items-center gap-2 bg-zinc-900/50 border border-white/5 text-white px-5 py-2.5 rounded-xl font-bold text-sm uppercase tracking-wider hover:bg-zinc-800 hover:border-white/10 transition-all">
                    <Download className="w-4 h-4" />
                    Export Products
                </button>
            </div>

            {/* Enhanced Stats Bar */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                {[
                    { label: 'Published', value: stats?.publishedProducts || 0, icon: Package, color: 'indigo', change: '+12%' },
                    { label: 'Total Sales', value: stats?.totalSales || 0, icon: Users, color: 'emerald', change: '+8%' },
                    { label: 'Today\'s Revenue', value: `₹${(stats?.todayRevenue || 0).toLocaleString()}`, icon: DollarSign, color: 'amber', change: '+23%' },
                    { label: 'Monthly Revenue', value: `₹${(stats?.monthlyRevenue || 0).toLocaleString()}`, icon: TrendingUp, color: 'purple', change: '+15%' },
                    { label: 'All Time Revenue', value: `₹${(stats?.allTimeRevenue || 0).toLocaleString()}`, icon: BarChart3, color: 'rose', change: '+45%' }
                ].map((stat, i) => (
                    <motion.div
                        key={stat.label}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.1 }}
                        className="bg-zinc-900/40 border border-white/5 p-4 rounded-2xl relative overflow-hidden group hover:border-white/10 transition-all cursor-pointer"
                    >
                        <div className={`absolute top-0 right-0 w-20 h-20 bg-${stat.color}-500/5 rounded-full blur-2xl -mr-6 -mt-6`} />
                        <div className="flex items-start justify-between mb-2">
                            <p className="text-[9px] font-black uppercase tracking-widest text-zinc-500">{stat.label}</p>
                            {stat.change && (
                                <span className="text-[9px] font-black text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded-md">
                                    {stat.change}
                                </span>
                            )}
                        </div>
                        <div className="flex items-end justify-between">
                            <h3 className="text-xl font-black text-white">{stat.value}</h3>
                            <div className={`p-1.5 rounded-lg bg-${stat.color}-500/10 text-${stat.color}-400 group-hover:scale-110 transition-transform`}>
                                <stat.icon className="w-3.5 h-3.5" />
                            </div>
                        </div>
                    </motion.div>
                ))}
            </div>

            {/* Filters & Search */}
            <div className="flex flex-col md:flex-row gap-4">
                <div className="relative flex-1 group">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500 group-focus-within:text-indigo-400 transition-colors" />
                    <input
                        type="text"
                        placeholder="Search products..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full bg-zinc-900/50 border border-white/5 rounded-2xl py-3 pl-11 pr-4 text-white placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500/40 transition-all"
                    />
                </div>
                <div className="flex items-center gap-2 overflow-x-auto pb-2 md:pb-0 scrollbar-hide">
                    {/* Status Filters */}
                    <div className="flex items-center gap-1 border-r border-white/10 pr-2">
                        {['All', 'Published', 'Draft', 'Paused', 'Archived'].map(status => (
                            <button
                                key={status}
                                onClick={() => setFilterStatus(status)}
                                className={`px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-widest whitespace-nowrap transition-all ${filterStatus === status
                                    ? 'bg-white text-black'
                                    : 'bg-zinc-900/50 text-zinc-500 border border-white/5 hover:border-white/10'
                                    }`}
                            >
                                {status}
                            </button>
                        ))}
                    </div>
                    {/* Type Filters */}
                    <div className="flex items-center gap-1">
                        {['All', 'Ebook', 'Template', 'Preset', 'Course', 'Bundle', 'Free'].map(type => (
                            <button
                                key={type}
                                onClick={() => setFilterType(type)}
                                className={`px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-widest whitespace-nowrap transition-all ${filterType === type
                                    ? 'bg-indigo-500 text-white'
                                    : 'bg-zinc-900/50 text-zinc-500 border border-white/5 hover:border-white/10'
                                    }`}
                            >
                                {type}
                            </button>
                        ))}
                    </div>
                </div>
            </div>
            {/* Products Display */}
            {loading ? (
                <div className={view === 'table' ? 'space-y-2' : 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'}>
                    {view === 'table' ?
                        Array.from({ length: 5 }).map((_, i) => (
                            <div key={`loading-table-${i}`} className="h-16 bg-zinc-900/50 rounded-xl animate-pulse" />
                        )) :
                        Array.from({ length: 6 }).map((_, i) => (
                            <div key={`loading-grid-${i}`} className="h-64 bg-zinc-900/50 rounded-3xl animate-pulse" />
                        ))
                    }
                </div>
            ) : filteredProducts.length > 0 ? (
                <div>
                    {/* Table Header */}
                    {view === 'table' && (
                        <div className="flex items-center gap-4 p-4 bg-zinc-900/40 border-b border-white/10 text-xs font-black uppercase tracking-widest text-zinc-500">
                            <input type="checkbox" className="rounded border-white/20 bg-zinc-800" />
                            <div className="w-12"></div>
                            <div className="flex-1">Name</div>
                            <div className="w-20">Type</div>
                            <div className="w-24">Price</div>
                            <div className="w-16">Sales</div>
                            <div className="w-24">Revenue</div>
                            <div className="w-24">Status</div>
                            <div className="w-20">Actions</div>
                        </div>
                    )}
                    <div className={view === 'grid' ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" : view === 'list' ? "space-y-4" : "bg-zinc-900/20 border border-white/5 rounded-2xl overflow-hidden"}>
                        <AnimatePresence mode="popLayout">
                            {filteredProducts.map((product, i) => (
                                <ProductCard key={product._id} product={product} view={view} index={i} />
                            ))}
                        </AnimatePresence>
                    </div>
                </div>
            ) : (
                <EmptyState
                    imageUrl="/empty-products.png"
                    title="No products found"
                    description="Get started by creating your first digital product. It only takes a few minutes to set up and start selling."
                    actionLabel="Create My First Product"
                    onAction={() => window.location.href = '/dashboard/products/new'}
                />
            )}

        </div>
    );
}

function ProductCard({ product, view, index }: { product: any, view: 'grid' | 'list' | 'table', index: number }) {
    const isGrid = view === 'grid';
    const isTable = view === 'table';

    // Status dot colors
    const getStatusColor = (status: string) => {
        switch (status) {
            case 'published': return 'bg-emerald-500';
            case 'active': return 'bg-emerald-500';
            case 'draft': return 'bg-yellow-500';
            case 'paused': return 'bg-zinc-500';
            case 'archived': return 'bg-red-500';
            default: return 'bg-zinc-500';
        }
    };

    const handleArchive = async () => {
        if (!confirm('Are you sure you want to unpublish/archive this product?')) return;
        try {
            const res = await fetch(`/api/products/${product._id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: 'archived', isActive: false, isPublic: false })
            });
            if (res.ok) {
                window.location.reload();
            } else {
                alert('Failed to archive product.');
            }
        } catch (err) {
            console.error(err);
            alert('Failed to archive product.');
        }
    };

    // Product type icons
    const getProductIcon = (type: string) => {
        switch (type) {
            case 'ebook': return '📚';
            case 'course': return '🎓';
            case 'template': return '📄';
            case 'preset': return '🎨';
            case 'audio': return '🎵';
            case 'video': return '🎬';
            case 'bundle': return '📦';
            case 'free': return '🎁';
            default: return '📄';
        }
    };

    if (isTable) {
        return (
            <motion.div
                layout
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ delay: index * 0.05 }}
                className="flex items-center gap-4 p-4 border-b border-white/5 hover:bg-white/5 transition-all group"
            >
                <input type="checkbox" className="rounded border-white/20 bg-zinc-800 text-indigo-500" />

                {/* Thumbnail */}
                <div className="w-12 h-12 rounded-lg bg-zinc-900 relative overflow-hidden border border-white/5">
                    <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/10 to-purple-500/10" />
                    <div className="absolute inset-0 flex items-center justify-center text-xs">
                        {getProductIcon(product.productType)}
                    </div>
                </div>

                {/* Name */}
                <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-bold text-white truncate">{product.title}</h3>
                    <p className="text-xs text-zinc-500">{product.productType}</p>
                </div>

                {/* Type */}
                <div className="text-xs text-zinc-400 w-20">
                    {product.productType}
                </div>

                {/* Price */}
                <div className="text-sm font-bold text-white w-24">
                    ₹{product.price || 0}
                </div>

                {/* Sales */}
                <div className="text-sm text-zinc-400 w-16">
                    {product.totalSales || 0}
                </div>

                {/* Revenue */}
                <div className="text-sm font-bold text-emerald-400 w-24">
                    ₹{((product.totalSales || 0) * (product.price || 0)).toLocaleString()}
                </div>

                {/* Status */}
                <div className="flex items-center gap-2 w-24">
                    <div className={`w-2 h-2 rounded-full ${getStatusColor(product.status)}`} />
                    <span className="text-xs text-zinc-400 capitalize">{product.status}</span>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all">
                    <Link
                        href={`/dashboard/products/${product._id}`}
                        className="p-1.5 rounded hover:bg-white/10 text-zinc-400 hover:text-white transition-all"
                    >
                        <Eye className="w-3.5 h-3.5" />
                    </Link>
                    <Link
                        href={`/dashboard/products/${product._id}/edit`}
                        className="p-1.5 rounded hover:bg-white/10 text-zinc-400 hover:text-white transition-all"
                    >
                        <Edit className="w-3.5 h-3.5" />
                    </Link>
                    <button className="p-1.5 rounded hover:bg-white/10 text-zinc-400 hover:text-white transition-all">
                        <MoreVertical className="w-3.5 h-3.5" />
                    </button>
                </div>
            </motion.div>
        );
    }

    return (
        <motion.div
            layout
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ delay: index * 0.05 }}
            className={`group relative ${isGrid ? 'flex flex-col' : 'flex items-center gap-6 p-4'} bg-zinc-900/40 border border-white/5 rounded-[2rem] hover:border-white/20 transition-all duration-500 hover:bg-zinc-900/60 overflow-hidden`}
        >
            {/* Image Placeholder */}
            <div className={`${isGrid ? 'aspect-video w-full' : 'w-24 h-24 shrink-0'} bg-zinc-900 relative overflow-hidden rounded-2xl border border-white/5`}>
                <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/10 to-purple-500/10" />
                <div className="absolute inset-0 flex items-center justify-center text-2xl">
                    {getProductIcon(product.productType)}
                </div>
                {product.productType && (
                    <div className="absolute top-3 left-3 bg-black/60 backdrop-blur-md px-2.5 py-1 rounded-lg border border-white/10 flex items-center gap-1.5">
                        <Zap className="w-3 h-3 text-indigo-400" />
                        <span className="text-[10px] font-black text-white uppercase tracking-widest">{product.productType}</span>
                    </div>
                )}
                {/* Status Dot */}
                <div className={`absolute top-3 right-3 w-3 h-3 rounded-full ${getStatusColor(product.status)} ${product.status === 'published' ? 'animate-pulse' : ''}`} />
            </div>

            <div className={`p-6 ${!isGrid && 'flex-1 p-0'}`}>
                <div className="flex items-start justify-between mb-2">
                    <h3 className="text-lg font-bold text-white group-hover:text-indigo-400 transition-colors line-clamp-1">{product.title}</h3>
                    <div className="flex items-center gap-1.5 text-zinc-500">
                        <Star className="w-3 h-3 fill-amber-500 text-amber-500" />
                        <span className="text-xs font-bold">{product.avgRating?.toFixed(1) || '0.0'}</span>
                    </div>
                </div>

                <p className="text-sm text-zinc-500 line-clamp-2 mb-4 font-medium leading-relaxed">{product.shortDescription || product.description || 'No description provided.'}</p>

                {/* Stats */}
                <div className="flex items-center gap-4 mb-4 text-xs text-zinc-500">
                    <div className="flex items-center gap-1">
                        <Users className="w-3 h-3" />
                        <span>{product.totalSales || 0} sales</span>
                    </div>
                    <div className="flex items-center gap-1">
                        <TrendingUp className="w-3 h-3" />
                        <span>₹{((product.totalSales || 0) * (product.price || 0)).toLocaleString()}</span>
                    </div>
                </div>

                <div className="flex items-center justify-between mt-auto">
                    <div className="flex flex-col">
                        <p className="text-[10px] font-black text-zinc-600 uppercase tracking-widest mb-1">Pricing</p>
                        <p className="text-xl font-black text-white tracking-tight">₹{product.price || 0}</p>
                    </div>
                    <div className="flex items-center gap-2">
                        <Link
                            href={`/dashboard/products/${product._id}`}
                            className="bg-white/5 hover:bg-white/10 p-3 rounded-2xl text-white transition-all border border-white/5"
                        >
                            <Eye className="w-4 h-4" />
                        </Link>
                        <Link
                            href={`/dashboard/products/${product._id}/edit`}
                            className="bg-indigo-500/10 text-indigo-400 px-5 py-2.5 rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-indigo-500 hover:text-white transition-all border border-indigo-500/20"
                        >
                            Edit
                        </Link>
                    </div>
                </div>
            </div>

            {/* Hover overlay with quick actions */}
            <div className="absolute top-4 right-4 flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-all translate-x-4 group-hover:translate-x-0">
                <button className="bg-black/80 backdrop-blur-xl p-3 rounded-2xl border border-white/10 flex flex-col items-center hover:bg-white/10 transition-all">
                    <Copy className="w-3.5 h-3.5 text-zinc-400 mb-1" />
                    <span className="text-[9px] font-bold text-white">Copy</span>
                </button>
                <button className="bg-black/80 backdrop-blur-xl p-3 rounded-2xl border border-white/10 flex flex-col items-center hover:bg-white/10 transition-all">
                    <Share2 className="w-3.5 h-3.5 text-zinc-400 mb-1" />
                    <span className="text-[9px] font-bold text-white">Share</span>
                </button>
                <button onClick={handleArchive} className="bg-black/80 backdrop-blur-xl p-3 rounded-2xl border border-white/10 flex flex-col items-center hover:bg-white/10 transition-all z-10">
                    <Archive className="w-3.5 h-3.5 text-zinc-400 mb-1" />
                    <span className="text-[9px] font-bold text-white">Archive</span>
                </button>
            </div>
        </motion.div>
    );
}

// Custom ShoppingBag icon missing in lucide-react (using Package as fallback in card)
function ShoppingBag(props: any) {
    return <Package {...props} />
}
