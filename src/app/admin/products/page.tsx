// @ts-nocheck
'use client';

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
import { Loader2, Search, Eye, Star } from 'lucide-react';
import { format } from 'date-fns';
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
                setProducts(data.products);
                setTotalPages(data.pagination.pages);
            }
        } catch (error) {
            console.error('Failed to fetch products', error);
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
            }
        } catch (error) {
            toast.error('Failed to toggle feature');
        }
    };

    return (
        <div className="space-y-8">
            <div className="flex items-center justify-between">
                <div className="space-y-1">
                    <h1 className="text-4xl font-black text-white tracking-tighter italic uppercase flex items-center gap-4">
                        <div className="w-3 h-10 bg-indigo-500 rounded-full shadow-[0_0_15px_rgba(99,102,241,0.3)]" />
                        Inventory Control
                    </h1>
                    <p className="text-[10px] font-black text-zinc-600 uppercase tracking-[0.3em] ml-7">Platform Assets • Live Verification</p>
                </div>
            </div>

            <div className="flex items-center gap-4">
                <div className="relative flex-1 max-w-sm group">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-600 group-focus-within:text-indigo-500 transition-colors" />
                    <Input
                        placeholder="Search platform assets..."
                        className="pl-12 bg-black/40 border-white/5 rounded-2xl h-12 text-sm text-white placeholder:text-zinc-700 focus:border-indigo-500/50 transition-all font-medium"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>
                <Select value={status} onValueChange={setStatus}>
                    <SelectTrigger className="w-[180px] bg-zinc-900 border-white/5 text-white font-bold uppercase tracking-widest text-[10px] rounded-xl h-12">
                        <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent className="bg-zinc-900 border-white/10 text-white">
                        <SelectItem value="all">All Assets</SelectItem>
                        <SelectItem value="published">Verified</SelectItem>
                        <SelectItem value="draft">Pending</SelectItem>
                        <SelectItem value="archived">Decommissioned</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            <div className="rounded-[2.5rem] border border-white/5 bg-zinc-900/40 overflow-hidden shadow-2xl backdrop-blur-sm">
                <Table>
                    <TableHeader className="bg-white/[0.02]">
                        <TableRow className="border-white/5 hover:bg-transparent">
                            <TableHead className="px-8 py-6 text-[10px] font-black text-zinc-500 uppercase tracking-widest border-b border-white/5">Product</TableHead>
                            <TableHead className="px-8 py-6 text-[10px] font-black text-zinc-500 uppercase tracking-widest border-b border-white/5">Creator</TableHead>
                            <TableHead className="px-8 py-6 text-[10px] font-black text-zinc-500 uppercase tracking-widest border-b border-white/5">Type</TableHead>
                            <TableHead className="px-8 py-6 text-[10px] font-black text-zinc-500 uppercase tracking-widest border-b border-white/5">Valuation</TableHead>
                            <TableHead className="px-8 py-6 text-[10px] font-black text-zinc-500 uppercase tracking-widest border-b border-white/5">Status</TableHead>
                            <TableHead className="px-8 py-6 text-right text-[10px] font-black text-zinc-500 uppercase tracking-widest border-b border-white/5">Operations</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {loading ? (
                            <TableRow>
                                <TableCell colSpan={6} className="h-24 text-center">
                                    <Loader2 className="mx-auto h-6 w-6 animate-spin text-muted-foreground" />
                                </TableCell>
                            </TableRow>
                        ) : products.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={6} className="h-24 text-center">
                                    No products found.
                                </TableCell>
                            </TableRow>
                        ) : (
                            products.map((product) => (
                                <TableRow key={product._id} className="border-white/5 hover:bg-white/[0.02] transition-colors group">
                                    <TableCell className="px-8 py-6">
                                        <div className="flex flex-col">
                                            <span className="font-black text-sm text-white tracking-tight uppercase italic flex items-center gap-2">
                                                {product.name}
                                                {product.isFeatured && <Star className="h-4 w-4 fill-amber-400 text-amber-400 animate-pulse shadow-[0_0_10px_rgba(251,191,36,0.5)]" />}
                                            </span>
                                            <span className="text-[10px] font-black text-zinc-600 uppercase tracking-widest mt-1">ID: {product._id}</span>
                                        </div>
                                    </TableCell>
                                    <TableCell className="px-8 py-6">
                                        <div className="flex flex-col">
                                            <span className="font-black text-xs text-white uppercase tracking-tight italic">{product.creatorId?.displayName || 'Unknown'}</span>
                                            <span className="text-[9px] font-bold text-zinc-600 uppercase tracking-tighter">{product.creatorId?.email}</span>
                                        </div>
                                    </TableCell>
                                    <TableCell className="px-8 py-6 uppercase text-[9px] font-black text-zinc-500 tracking-[0.2em]">{product.type}</TableCell>
                                    <TableCell className="px-8 py-6 font-black text-lg text-white tracking-tighter italic">₹{product.price}</TableCell>
                                    <TableCell className="px-8 py-6">
                                        <Badge variant={product.status === 'published' ? 'default' : 'secondary'} className="uppercase text-[9px] font-black tracking-widest">
                                            {product.status}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="px-8 py-6 text-right">
                                        <div className="flex justify-end gap-2">
                                            <Button variant="ghost" size="sm" className="bg-zinc-900 border border-white/5 h-10 w-10 p-0 text-zinc-500 hover:text-white rounded-xl transition-all" onClick={() => handleFeatureToggle(product._id)} title="Toggle Feature">
                                                <Star className={cn("h-4 w-4 transition-all", product.isFeatured ? "fill-amber-400 text-amber-400" : "text-zinc-700")} />
                                            </Button>
                                            <Button variant="ghost" size="sm" className="bg-zinc-900 border border-white/5 h-10 w-10 p-0 text-zinc-500 hover:text-white rounded-xl transition-all" asChild>
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
            <div className="flex items-center justify-between p-8 bg-black/20 border-t border-white/5">
                <p className="text-[9px] font-black text-zinc-700 uppercase tracking-[0.4em]">Asset Tracking Active • Node Verified</p>
                <div className="flex items-center space-x-4">
                    <Button
                        variant="ghost"
                        size="sm"
                        className="bg-zinc-900 border border-white/5 text-zinc-500 hover:text-white rounded-xl uppercase font-black text-[9px] tracking-widest px-4 h-10"
                        onClick={() => setPage((p) => Math.max(1, p - 1))}
                        disabled={page === 1 || loading}
                    >
                        Previous
                    </Button>
                    <div className="text-[10px] font-black text-zinc-600 uppercase tracking-widest font-mono">
                        Frame {page} / {totalPages}
                    </div>
                    <Button
                        variant="ghost"
                        size="sm"
                        className="bg-zinc-900 border border-white/5 text-zinc-500 hover:text-white rounded-xl uppercase font-black text-[9px] tracking-widest px-4 h-10"
                        onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                        disabled={page === totalPages || loading}
                    >
                        Next
                    </Button>
                </div>
            </div>
        </div>
    );
}
