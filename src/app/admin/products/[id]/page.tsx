// @ts-nocheck
'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Loader2, Save, Trash2, Globe, ArrowLeft } from 'lucide-react';
import { toast } from 'react-hot-toast';
import Link from 'next/link';

export default function ProductDetailPage() {
    const params = useParams();
    const router = useRouter();
    const [product, setProduct] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    const [form, setForm] = useState({
        name: '',
        description: '',
        price: 0,
        status: '',
        isFeatured: false
    });

    const fetchProduct = async () => {
        try {
            const res = await fetch(`/api/admin/products/${params.id}`);
            if (res.ok) {
                const data = await res.json();
                setProduct(data.product);
                setForm({
                    name: data.product.name,
                    description: data.product.description,
                    price: data.product.price,
                    status: data.product.status,
                    isFeatured: data.product.isFeatured
                });
            } else {
                toast.error('Failed to load product');
            }
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchProduct();
    }, [params.id]);

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        try {
            const res = await fetch(`/api/admin/products/${params.id}`, {
                method: 'PUT',
                body: JSON.stringify(form),
                headers: { 'Content-Type': 'application/json' }
            });
            if (res.ok) {
                toast.success('Product updated');
                fetchProduct();
            } else {
                toast.error('Update failed');
            }
        } catch (error) {
            toast.error('Error updating product');
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async () => {
        if (!confirm('Are you sure you want to delete this product? This action cannot be undone.')) return;

        try {
            const res = await fetch(`/api/admin/products/${params.id}`, {
                method: 'DELETE'
            });
            if (res.ok) {
                toast.success('Product deleted');
                router.push('/admin/products');
            } else {
                toast.error('Delete failed');
            }
        } catch (error) {
            toast.error('Error deleting product');
        }
    };

    if (loading) return <div className="p-8"><Loader2 className="animate-spin h-8 w-8" /></div>;
    if (!product) return <div className="p-8">Product not found</div>;

    return (
        <div className="space-y-8">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-6">
                    <Link href="/admin/products">
                        <Button variant="ghost" size="sm" className="bg-zinc-900 border border-white/5 h-12 w-12 rounded-2xl text-zinc-400 hover:text-white transition-all">
                            <ArrowLeft className="h-5 w-5" />
                        </Button>
                    </Link>
                    <div className="space-y-1">
                        <h1 className="text-4xl font-black text-white tracking-tighter italic uppercase flex items-center gap-4">
                            <div className="w-3 h-10 bg-indigo-500 rounded-full shadow-[0_0_15px_rgba(99,102,241,0.3)]" />
                            Inventory Editor
                        </h1>
                        <p className="text-[10px] font-black text-zinc-600 uppercase tracking-[0.3em] ml-7">Serial: {product._id}</p>
                    </div>
                </div>
                <Button variant="ghost" className="bg-rose-500/10 text-rose-500 border border-rose-500/20 uppercase font-black text-[10px] tracking-widest rounded-xl px-6 h-12 hover:bg-rose-500 hover:text-white transition-all shadow-lg shadow-rose-500/10" onClick={handleDelete}>
                    <Trash2 className="mr-2 h-4 w-4" /> Purge Asset
                </Button>
            </div>

            <div className="grid gap-8 md:grid-cols-3">
                <div className="md:col-span-2 space-y-8">
                    <Card className="bg-zinc-900/40 border-white/5 rounded-[2.5rem] shadow-2xl backdrop-blur-sm overflow-hidden">
                        <CardHeader className="bg-white/[0.02] px-10 py-8 border-b border-white/5">
                            <CardTitle className="text-xl font-black text-white uppercase tracking-tighter italic flex items-center gap-3">
                                <div className="w-2 h-6 bg-indigo-500 rounded-full" />
                                Asset Specifications
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="px-10 py-8">
                            <form onSubmit={handleSave} className="space-y-8">
                                <div className="grid gap-3">
                                    <Label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-1">Asset Nomenclature</Label>
                                    <Input
                                        className="bg-black/40 border-white/5 rounded-2xl h-14 text-white placeholder:text-zinc-700 focus:border-indigo-500/50 transition-all font-black uppercase tracking-tight italic"
                                        value={form.name}
                                        onChange={(e) => setForm({ ...form, name: e.target.value })}
                                    />
                                </div>
                                <div className="grid gap-3">
                                    <Label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-1">Descriptive Metadata</Label>
                                    <Textarea
                                        className="bg-black/40 border-white/5 rounded-2xl p-5 text-white placeholder:text-zinc-700 focus:border-indigo-500/50 transition-all min-h-[150px]"
                                        value={form.description}
                                        onChange={(e) => setForm({ ...form, description: e.target.value })}
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-8">
                                    <div className="grid gap-3">
                                        <Label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-1">Valuation (₹)</Label>
                                        <Input
                                            type="number"
                                            className="bg-black/40 border-white/5 rounded-2xl h-14 text-white font-black tracking-tighter italic text-lg"
                                            value={form.price}
                                            onChange={(e) => setForm({ ...form, price: parseFloat(e.target.value) })}
                                        />
                                    </div>
                                    <div className="grid gap-3">
                                        <Label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-1">Lifecycle Status</Label>
                                        <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v })}>
                                            <SelectTrigger className="bg-black/40 border-white/5 rounded-2xl h-14 text-white font-black uppercase tracking-widest text-[10px]">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent className="bg-zinc-900 border-white/10 text-white">
                                                <SelectItem value="draft" className="uppercase font-black text-[10px] tracking-widest text-zinc-500">Draft</SelectItem>
                                                <SelectItem value="published" className="uppercase font-black text-[10px] tracking-widest text-emerald-500">Live</SelectItem>
                                                <SelectItem value="archived" className="uppercase font-black text-[10px] tracking-widest text-rose-500">Vaulted</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>
                                <div className="flex items-center gap-4 bg-black/20 p-6 rounded-2xl border border-white/5">
                                    <input
                                        type="checkbox"
                                        id="featured"
                                        checked={form.isFeatured}
                                        onChange={(e) => setForm({ ...form, isFeatured: e.target.checked })}
                                        className="h-5 w-5 rounded-lg border-zinc-700 bg-zinc-900 accent-indigo-500 focus:ring-offset-zinc-900"
                                    />
                                    <Label htmlFor="featured" className="text-[10px] font-black text-white uppercase tracking-[0.2em] cursor-pointer">Promote to Spotlight</Label>
                                </div>
                                <Button type="submit" disabled={saving} className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-black uppercase tracking-[0.2em] h-14 rounded-2xl shadow-xl shadow-indigo-500/20 transition-all">
                                    {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                    Commit Configuration
                                </Button>
                            </form>
                        </CardContent>
                    </Card>
                </div>

                <div className="space-y-8">
                    <Card className="bg-zinc-900/40 border-white/5 rounded-[2.5rem] shadow-2xl backdrop-blur-sm overflow-hidden">
                        <CardHeader className="bg-white/[0.02] px-10 py-8 border-b border-white/5">
                            <CardTitle className="text-xl font-black text-white uppercase tracking-tighter italic flex items-center gap-3">
                                <div className="w-2 h-6 bg-amber-500 rounded-full" />
                                Architect
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="px-10 py-8">
                            <div className="bg-black/20 p-6 rounded-2xl border border-white/5 flex flex-col gap-2">
                                <span className="text-[9px] font-black text-zinc-600 uppercase tracking-widest">Ownership</span>
                                <Link href={`/admin/users/${product.creatorId._id}`} className="font-black text-sm text-indigo-400 hover:text-indigo-300 transition-colors uppercase italic tracking-tight">
                                    {product.creatorId.displayName}
                                </Link>
                                <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-tighter mt-1">{product.creatorId.email}</span>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="bg-zinc-900/40 border-white/5 rounded-[2.5rem] shadow-2xl backdrop-blur-sm overflow-hidden">
                        <CardHeader className="bg-white/[0.02] px-10 py-8 border-b border-white/5">
                            <CardTitle className="text-xl font-black text-white uppercase tracking-tighter italic flex items-center gap-3">
                                <div className="w-2 h-6 bg-indigo-500 rounded-full" />
                                Classification
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="px-10 py-8 space-y-6">
                            <div className="flex justify-between items-center border-b border-white/5 pb-4">
                                <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Asset Category</span>
                                <Badge variant="secondary" className="bg-white/5 text-zinc-300 border-white/5 uppercase text-[9px] font-black tracking-widest px-4 py-1">
                                    {product.category}
                                </Badge>
                            </div>
                            <div className="flex justify-between items-center border-b border-white/5 pb-4">
                                <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Registry Date</span>
                                <span className="text-xs font-bold text-zinc-400 uppercase tracking-tight italic font-mono">{new Date(product.createdAt).toLocaleDateString()}</span>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
