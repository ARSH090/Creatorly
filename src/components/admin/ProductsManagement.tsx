'use client';

import React, { useState, useEffect } from 'react';
import {
    Package, Search, Filter, Edit, Trash2,
    Eye, MoreVertical, Loader2, AlertCircle,
    Archive, Tag, IndianRupee, User,
    ChevronLeft, ChevronRight, Globe
} from 'lucide-react';

interface Product {
    _id: string;
    name: string;
    description: string;
    price: number;
    type: string;
    status: 'draft' | 'published' | 'archived';
    creatorId: {
        _id: string;
        displayName: string;
        email: string;
        username: string;
    };
    category?: string;
    thumbnail?: string;
    createdAt: string;
}

export function ProductsManagement() {
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [typeFilter, setTypeFilter] = useState('all');
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [actionLoading, setActionLoading] = useState<string | null>(null);

    const fetchProducts = async () => {
        try {
            setLoading(true);
            const params = new URLSearchParams({
                page: page.toString(),
                limit: '15',
                ...(search && { search }),
                ...(statusFilter !== 'all' && { status: statusFilter }),
                ...(typeFilter !== 'all' && { type: typeFilter }),
            });

            const res = await fetch(`/api/admin/products?${params}`);
            const json = await res.json();
            if (json.success) {
                setProducts(json.data.products);
                setTotalPages(json.data.pagination.pages);
            }
        } catch (err) {
            console.error('Failed to fetch products:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        const timer = setTimeout(fetchProducts, 500);
        return () => clearTimeout(timer);
    }, [search, statusFilter, typeFilter, page]);

    const handleAction = async (id: string, method: string, data: any = {}) => {
        if (method === 'DELETE' && !confirm('Are you sure? This will archive the product.')) return;

        try {
            setActionLoading(id);
            const res = await fetch(`/api/admin/products/${id}`, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: method !== 'DELETE' ? JSON.stringify(data) : undefined
            });
            const json = await res.json();
            if (json.success) {
                fetchProducts();
            } else {
                alert(json.error || 'Action failed');
            }
        } catch (err) {
            console.error('Action failed:', err);
        } finally {
            setActionLoading(null);
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'published': return 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20';
            case 'draft': return 'bg-zinc-500/10 text-zinc-500 border-zinc-500/20';
            case 'archived': return 'bg-rose-500/10 text-rose-500 border-rose-500/20';
            default: return 'bg-zinc-800 text-zinc-400 border-white/5';
        }
    };

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            {/* Header Area */}
            <div className="bg-zinc-900 rounded-[2.5rem] border border-white/10 shadow-2xl overflow-hidden">
                <div className="p-8 border-b border-white/5 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                    <div>
                        <h2 className="text-xl font-black text-white flex items-center gap-3 uppercase tracking-tighter italic">
                            <div className="w-2 h-6 bg-indigo-500 rounded-full" />
                            Inventory Moderation
                        </h2>
                        <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mt-1">Product Governance Node</p>
                    </div>

                    <div className="flex flex-wrap items-center gap-4">
                        <div className="relative group">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-600 group-focus-within:text-indigo-500 transition-colors" />
                            <input
                                type="text"
                                placeholder="Search products..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="bg-black/40 border border-white/5 rounded-2xl pl-12 pr-6 py-3 text-sm text-white focus:outline-none focus:border-indigo-500/50 transition-all w-64 placeholder:text-zinc-700 font-medium"
                            />
                        </div>

                        <select
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                            className="bg-black/40 border border-white/5 rounded-2xl px-6 py-3 text-sm text-white focus:outline-none focus:border-indigo-500/50 font-bold uppercase tracking-widest cursor-pointer"
                        >
                            <option value="all">All Status</option>
                            <option value="published">Published</option>
                            <option value="draft">Drafts</option>
                            <option value="archived">Archived</option>
                        </select>
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="text-[10px] font-black text-zinc-600 uppercase tracking-[0.2em] border-b border-white/5 bg-white/[0.01]">
                                <th className="px-8 py-5">Product Identity</th>
                                <th className="px-8 py-5">Value & Metrics</th>
                                <th className="px-8 py-5">Origin / Creator</th>
                                <th className="px-8 py-5 text-right">Moderation</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {loading ? (
                                <tr>
                                    <td colSpan={4} className="py-20 text-center">
                                        <Loader2 className="w-8 h-8 text-indigo-500 animate-spin mx-auto mb-4" />
                                        <p className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Indexing Global Repository...</p>
                                    </td>
                                </tr>
                            ) : products.length === 0 ? (
                                <tr>
                                    <td colSpan={4} className="py-20 text-center">
                                        <Package className="w-8 h-8 text-zinc-700 mx-auto mb-4" />
                                        <p className="text-[10px] font-black uppercase tracking-widest text-zinc-500">No assets discovered</p>
                                    </td>
                                </tr>
                            ) : products.map((p) => (
                                <tr key={p._id} className="hover:bg-white/[0.02] transition-colors group">
                                    <td className="px-8 py-6">
                                        <div className="flex items-center gap-4">
                                            <div className="w-14 h-14 rounded-2xl bg-black border border-white/5 overflow-hidden flex-shrink-0">
                                                {p.thumbnail ? (
                                                    <img src={p.thumbnail} alt={p.name} className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity" />
                                                ) : (
                                                    <div className="w-full h-full flex items-center justify-center text-zinc-800">
                                                        <Package size={24} />
                                                    </div>
                                                )}
                                            </div>
                                            <div>
                                                <p className="font-black text-white text-sm tracking-tight group-hover:text-indigo-400 transition-colors uppercase italic">{p.name}</p>
                                                <div className="flex items-center gap-2 mt-1">
                                                    <span className={`px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-widest border ${getStatusColor(p.status)}`}>
                                                        {p.status}
                                                    </span>
                                                    <span className="text-[9px] font-bold text-zinc-600 uppercase tracking-widest">{p.type}</span>
                                                </div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-8 py-6">
                                        <div className="space-y-1">
                                            <p className="font-black text-white text-lg tracking-tighter italic">₹{p.price.toLocaleString()}</p>
                                            <div className="flex items-center gap-2 text-zinc-500 italic">
                                                <IndianRupee size={10} />
                                                <span className="text-[9px] font-black uppercase tracking-widest">Pricing Model Stable</span>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-8 py-6">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-xl bg-zinc-800 flex items-center justify-center text-[10px] font-black text-zinc-400 uppercase">
                                                {p.creatorId?.displayName?.charAt(0)}
                                            </div>
                                            <div>
                                                <p className="text-[10px] font-black text-zinc-300 uppercase italic leading-none">{p.creatorId?.displayName}</p>
                                                <p className="text-[8px] font-bold text-zinc-600 uppercase tracking-widest mt-1">@{p.creatorId?.username}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-8 py-6 text-right">
                                        <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <a
                                                href={`/products/${p._id}`}
                                                target="_blank"
                                                className="p-2 bg-white/5 border border-white/10 rounded-xl text-zinc-500 hover:text-white transition-all"
                                                title="View Live"
                                            >
                                                <Eye size={16} />
                                            </a>
                                            <button
                                                onClick={() => {
                                                    const newStatus = p.status === 'published' ? 'draft' : 'published';
                                                    handleAction(p._id, 'PUT', { status: newStatus });
                                                }}
                                                disabled={actionLoading === p._id}
                                                className="p-2 bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 rounded-xl hover:bg-indigo-500 hover:text-white transition-all disabled:opacity-50"
                                                title={p.status === 'published' ? 'Unpublish' : 'Publish'}
                                            >
                                                {p.status === 'published' ? <Archive size={16} /> : <Globe size={16} />}
                                            </button>
                                            <button
                                                onClick={() => handleAction(p._id, 'DELETE')}
                                                disabled={actionLoading === p._id}
                                                className="p-2 bg-rose-500/10 text-rose-500 border border-rose-500/20 rounded-xl hover:bg-rose-500 hover:text-white transition-all disabled:opacity-50"
                                                title="Archive / Delete"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* Surveillance Footer */}
                <div className="p-8 bg-black/20 border-t border-white/5 flex items-center justify-between">
                    <p className="text-[10px] font-black text-zinc-600 uppercase tracking-widest animate-pulse">
                        Real-Time Assets Surveillance Active • Platform Moderation Level 4
                    </p>
                    <div className="flex items-center gap-4">
                        <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Index {page} / {totalPages}</span>
                        <div className="flex gap-2">
                            <button
                                onClick={() => setPage(p => Math.max(1, p - 1))}
                                disabled={page === 1}
                                className="p-2 bg-white/5 border border-white/10 rounded-xl text-zinc-500 hover:text-white transition-all disabled:opacity-20"
                            >
                                <ChevronLeft size={16} />
                            </button>
                            <button
                                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                                disabled={page === totalPages}
                                className="p-2 bg-white/5 border border-white/10 rounded-xl text-zinc-500 hover:text-white transition-all disabled:opacity-20"
                            >
                                <ChevronRight size={16} />
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
