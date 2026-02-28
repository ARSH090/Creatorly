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
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-3xl font-bold tracking-tight">Products</h1>
            </div>

            <div className="flex items-center gap-4">
                <div className="relative flex-1 max-w-sm">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Search products..."
                        className="pl-8"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>
                <Select value={status} onValueChange={setStatus}>
                    <SelectTrigger className="w-[180px]">
                        <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All Status</SelectItem>
                        <SelectItem value="published">Published</SelectItem>
                        <SelectItem value="draft">Draft</SelectItem>
                        <SelectItem value="archived">Archived</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            <div className="rounded-md border bg-white">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Product</TableHead>
                            <TableHead>Creator</TableHead>
                            <TableHead>Type</TableHead>
                            <TableHead>Price</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
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
                                <TableRow key={product._id}>
                                    <TableCell>
                                        <div className="flex flex-col">
                                            <span className="font-medium flex items-center gap-2">
                                                {product.name}
                                                {product.isFeatured && <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />}
                                            </span>
                                            <span className="text-xs text-muted-foreground">ID: {product._id}</span>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex flex-col">
                                            <span className="text-sm font-medium">{product.creatorId?.displayName || 'Unknown'}</span>
                                            <span className="text-xs text-muted-foreground">{product.creatorId?.email}</span>
                                        </div>
                                    </TableCell>
                                    <TableCell className="capitalize">{product.type}</TableCell>
                                    <TableCell>â‚¹{product.price}</TableCell>
                                    <TableCell>
                                        <Badge variant={product.status === 'published' ? 'default' : 'secondary'}>
                                            {product.status}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <div className="flex justify-end gap-2">
                                            <Button variant="ghost" size="icon" onClick={() => handleFeatureToggle(product._id)} title="Toggle Feature">
                                                <Star className={`h-4 w-4 ${product.isFeatured ? 'fill-yellow-400 text-yellow-400' : 'text-muted-foreground'}`} />
                                            </Button>
                                            <Button variant="ghost" size="icon" asChild>
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
            <div className="flex items-center justify-end space-x-2">
                <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page === 1 || loading}
                >
                    Previous
                </Button>
                <div className="text-sm text-muted-foreground">
                    Page {page} of {totalPages}
                </div>
                <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages || loading}
                >
                    Next
                </Button>
            </div>
        </div>
    );
}
