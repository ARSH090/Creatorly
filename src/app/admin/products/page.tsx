/* eslint-disable react-hooks/exhaustive-deps, react/no-unescaped-entities, @next/next/no-img-element, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars, prefer-const, import/no-anonymous-default-export */
﻿'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Search, Eye, Star, ShoppingBag, PackageX } from 'lucide-react';
import { TableSkeleton } from '@/components/ui/skeleton-loaders';
import { EmptyState } from '@/components/ui/empty-state';
import { toast } from 'react-hot-toast';
import { cn } from '@/lib/utils';

export default function ProductsPage() {
    const [products, setProducts] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [status, setStatus] = useState('all');
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);

    const fetchProducts = async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams({
                page: page.toString(),
                limit: '10',
                search,
                status
            });
            const res = await fetch(`/api/admin/products?${params}`);
            if (res.ok) {
                const data = await res.json();
                setProducts(data.products || []);
                setTotalPages(data.pagination?.pages || 1);
            } else {
                throw new Error('Signal lost');
            }
        } catch (error) {
            toast.error('Failed to sync with product relay');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        const debounce = setTimeout(() => {
            fetchProducts();
        }, 500);
        return () => clearTimeout(debounce);
    }, [search, status, page]);

    const handleFeatureToggle = async (id: string) => {
        try {
            const res = await fetch(`/api/admin/products/${id}/feature`, { method: 'POST' });
            if (res.ok) {
                const data = await res.json();
                setProducts(products.map(p => p._id === id ? { ...p, isFeatured: data.isFeatured } : p));
                toast.success(data.message);
            } else {
                throw new Error('Action failed');
            }
        } catch (error) {
            toast.error('Failed to toggle feature status');
        }
    };

    return (
        <div className="max-w-7xl mx-auto space-y-12 pb-24 animate-in fade-in duration-700">
            <header className="flex items-center justify-between">
                <div>
                    <h1 className="text-4xl font-black text-white italic uppercase tracking-tighter flex items-center gap-4">
                        <ShoppingBag className="w-10 h-10 text-amber-500 shadow-[0_0_20px_rgba(245,158,11,0.4)]" />
                        INVENTORY CORE
                    </h1>
                    <p className="text-[10px] font-black text-zinc-600 uppercase tracking-[0.4em] mt-2 ml-14">
                        Product Distribution • SKU Control
                    </p>
                </div>
            </header>

            <div className="flex flex-col md:flex-row items-center gap-6">
                <div className="relative flex-1 w-full">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
                    <Input
                        placeholder="SEARCH PRODUCT IDENTITIES..."
                        className="pl-12 bg-zinc-900/40 border-white/5 h-14 rounded-2xl text-white font-black uppercase text-xs tracking-widest focus:ring-amber-500/20"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>
                <Select value={status} onValueChange={setStatus}>
                    <SelectTrigger className="w-full md:w-[240px] bg-zinc-900/40 border-white/5 h-14 rounded-2xl text-zinc-400 font-black uppercase text-[10px] tracking-[0.2em]">
                        <SelectValue placeholder="LIFECYCLE STATUS" />
                    </SelectTrigger>
                    <SelectContent className="bg-zinc-900 border-white/10 rounded-2xl overflow-hidden">
                        <SelectItem value="all" className="text-[10px] font-black uppercase tracking-widest text-zinc-400 focus:text-white">All Units</SelectItem>
                        <SelectItem value="published" className="text-[10px] font-black uppercase tracking-widest text-zinc-400 focus:text-white">Published</SelectItem>
                        <SelectItem value="draft" className="text-[10px] font-black uppercase tracking-widest text-zinc-400 focus:text-white">Draft</SelectItem>
                        <SelectItem value="archived" className="text-[10px] font-black uppercase tracking-widest text-zinc-400 focus:text-white">Archived</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            <div className="rounded-[3rem] border border-white/5 bg-zinc-900/40 backdrop-blur-xl overflow-hidden min-h-[400px]">
                <Table>
                    <TableHeader className="bg-white/5">
                        <TableRow className="border-b-white/5 hover:bg-transparent">
                            <TableHead className="text-[10px] font-black text-zinc-500 uppercase tracking-widest py-6 pl-8">Unit</TableHead>
                            <TableHead className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Origin (Creator)</TableHead>
                            <TableHead className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Classification</TableHead>
                            <TableHead className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Value</TableHead>
                            <TableHead className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Protocol</TableHead>
                            <TableHead className="text-[10px] font-black text-zinc-500 uppercase tracking-widest text-right pr-8">Control</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {loading ? (
                            <TableRow>
                                <TableCell colSpan={6} className="p-8">
                                    <TableSkeleton rows={5} />
                                </TableCell>
                            </TableRow>
                        ) : products.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={6} className="p-0">
                                    <EmptyState
                                        icon={PackageX}
                                        title="No Products Found"
                                        description="The product registry returned zero matches for your current signal."
                                        actionLabel="Reset Filters"
                                        onAction={() => { setSearch(''); setStatus('all'); }}
                                        className="border-none bg-transparent"
                                    />
                                </TableCell>
                            </TableRow>
                        ) : (
                            products.map((product) => (
                                <TableRow key={product._id} className="border-b-white/5 transition-colors hover:bg-white/[0.02] group">
                                    <TableCell className="py-6 pl-8">
                                        <div className="flex flex-col">
                                            <span className="text-sm font-black text-white italic tracking-tight flex items-center gap-2">
                                                {product.name}
                                                {product.isFeatured && <Star className="h-3 w-3 fill-amber-500 text-amber-500 shadow-[0_0_10px_rgba(245,158,11,0.5)]" />}
                                            </span>
                                            <span className="text-[9px] font-bold text-zinc-600 uppercase tracking-widest">ID: {product._id}</span>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex flex-col">
                                            <span className="text-sm font-black text-white italic tracking-tight">
                                                {product.creatorId?.displayName || 'UNKNOWN ORIGIN'}
                                            </span>
                                            <span className="text-[9px] font-bold text-zinc-600 uppercase tracking-widest">
                                                {product.creatorId?.email}
                                            </span>
                                        </div>
                                    </TableCell>
                                    <TableCell className="text-[10px] font-black text-zinc-300 uppercase tracking-widest italic">{product.type}</TableCell>
                                    <TableCell className="text-[11px] font-black text-white italic tracking-tighter">₹{product.price.toLocaleString()}</TableCell>
                                    <TableCell>
                                        <Badge variant="outline" className={cn(
                                            "uppercase text-[9px] font-black tracking-widest px-3 py-1 rounded-lg border",
                                            product.status === 'published' ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" : "bg-zinc-800 text-zinc-400 border-white/5"
                                        )}>
                                            {product.status}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="text-right pr-8">
                                        <div className="flex justify-end gap-3 opacity-0 group-hover:opacity-100 transition-all">
                                            <Button variant="ghost" size="sm" onClick={() => handleFeatureToggle(product._id)} className={cn("h-9 w-9 rounded-xl p-0 transition-all", product.isFeatured ? "text-amber-500 bg-amber-500/10 border border-amber-500/20" : "text-zinc-500 hover:text-white bg-white/5 border border-white/5")}>
                                                <Star className={cn("h-4 w-4", product.isFeatured && "fill-amber-500")} />
                                            </Button>
                                            <Button variant="ghost" size="sm" asChild className="h-9 w-9 bg-white/5 hover:bg-white/10 text-white rounded-xl p-0 border border-white/5">
                                                <Link href={`/admin/products/${product._id}`}>
                                                    <Eye className="h-4 w-4" />
                                                </Link>
                                            </Button>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>

            {totalPages > 1 && (
                <div className="flex items-center justify-between mt-8 p-6 bg-zinc-900/40 border border-white/5 rounded-3xl backdrop-blur-sm">
                    <p className="text-[10px] font-black text-zinc-600 uppercase tracking-widest">
                        Inventory Batch {page} <span className="text-white mx-1 text-xs">/</span> {totalPages}
                    </p>
                    <div className="flex gap-4">
                        <Button
                            variant="outline"
                            className="bg-black/40 border-white/10 text-white h-12 px-8 rounded-2xl font-black uppercase text-[10px] tracking-widest hover:bg-white/5 disabled:opacity-20 transition-all"
                            onClick={() => setPage((p) => Math.max(1, p - 1))}
                            disabled={page === 1 || loading}
                        >
                            Prev Phase
                        </Button>
                        <Button
                            variant="outline"
                            className="bg-black/40 border-white/10 text-white h-12 px-8 rounded-2xl font-black uppercase text-[10px] tracking-widest hover:bg-white/5 disabled:opacity-20 transition-all"
                            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                            disabled={page === totalPages || loading}
                        >
                            Next Phase
                        </Button>
                    </div>
                </div>
            )}
        </div>
    );
}
