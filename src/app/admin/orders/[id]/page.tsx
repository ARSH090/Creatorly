'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, ArrowLeft, RefreshCw } from 'lucide-react';
import { toast } from 'react-hot-toast';
import Link from 'next/link';
import { format } from 'date-fns';

export default function OrderDetailPage() {
    const params = useParams();
    const router = useRouter();
    const [order, setOrder] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [refunding, setRefunding] = useState(false);

    const fetchOrder = async () => {
        try {
            const res = await fetch(`/api/admin/orders/${params.id}`);
            if (res.ok) {
                const data = await res.json();
                setOrder(data.order);
            } else {
                toast.error('Failed to load order');
            }
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchOrder();
    }, [params.id]);

    const handleRefund = async () => {
        if (!confirm('Are you sure you want to refund this order? This action cannot be undone.')) return;

        setRefunding(true);
        try {
            const res = await fetch(`/api/admin/orders/${params.id}/refund`, {
                method: 'POST'
            });
            if (res.ok) {
                toast.success('Refund processed successfully');
                fetchOrder();
            } else {
                const data = await res.json();
                toast.error(data.error || 'Refund failed');
            }
        } catch (error) {
            toast.error('Error processing refund');
        } finally {
            setRefunding(false);
        }
    };

    if (loading) return <div className="p-8"><Loader2 className="animate-spin h-8 w-8" /></div>;
    if (!order) return <div className="p-8">Order not found</div>;

    return (
        <div className="space-y-8">
            <div className="flex items-center gap-6">
                <Link href="/admin/orders">
                    <Button variant="ghost" size="sm" className="bg-zinc-900 border border-white/5 h-12 w-12 rounded-2xl text-zinc-400 hover:text-white transition-all">
                        <ArrowLeft className="h-5 w-5" />
                    </Button>
                </Link>
                <div className="flex-1">
                    <h1 className="text-4xl font-black text-white tracking-tighter italic uppercase flex items-center gap-4">
                        <div className="w-3 h-10 bg-indigo-500 rounded-full shadow-[0_0_15px_rgba(99,102,241,0.3)]" />
                        Transaction Audit
                    </h1>
                    <p className="text-[10px] font-black text-zinc-600 uppercase tracking-[0.3em] ml-7">Record: #{order._id}</p>
                </div>
                {order.status === 'paid' && (
                    <Button variant="ghost" className="bg-rose-500/10 text-rose-500 border border-rose-500/20 uppercase font-black text-[10px] tracking-widest rounded-xl px-6 h-12 hover:bg-rose-500 hover:text-white transition-all shadow-lg shadow-rose-500/10" onClick={handleRefund} disabled={refunding}>
                        {refunding ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCw className="mr-2 h-4 w-4" />}
                        Process Reversal
                    </Button>
                )}
            </div>

            <div className="grid gap-8 md:grid-cols-2">
                <Card className="bg-zinc-900/40 border-white/5 rounded-[2.5rem] shadow-2xl backdrop-blur-sm overflow-hidden">
                    <CardHeader className="bg-white/[0.02] px-10 py-8 border-b border-white/5">
                        <CardTitle className="text-xl font-black text-white uppercase tracking-tighter italic flex items-center gap-3">
                            <div className="w-2 h-6 bg-indigo-500 rounded-full" />
                            Financial Brief
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="px-10 py-8 space-y-6">
                        <div className="flex justify-between items-center border-b border-white/5 pb-4">
                            <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Status</span>
                            <Badge variant={order.status === 'paid' ? 'default' : 'destructive'} className="uppercase text-[9px] font-black tracking-widest px-4 py-1">
                                {order.status}
                            </Badge>
                        </div>
                        <div className="flex justify-between items-center border-b border-white/5 pb-4">
                            <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Gross Settlement</span>
                            <span className="text-2xl font-black text-white tracking-tighter italic">₹{order.total}</span>
                        </div>
                        <div className="flex justify-between items-center border-b border-white/5 pb-4">
                            <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Timestamp</span>
                            <span className="text-xs font-bold text-zinc-300 uppercase tracking-tight">{format(new Date(order.createdAt), 'PPP p')}</span>
                        </div>
                        <div className="flex justify-between items-center border-b border-white/5 pb-4">
                            <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Gateway Reference</span>
                            <span className="font-mono text-[11px] text-zinc-400 bg-black/40 px-3 py-1.5 rounded-lg border border-white/5 uppercase font-bold tracking-tighter">
                                {order.paymentDetails?.razorpayPaymentId || 'N/A'}
                            </span>
                        </div>
                    </CardContent>
                </Card>

                <Card className="bg-zinc-900/40 border-white/5 rounded-[2.5rem] shadow-2xl backdrop-blur-sm overflow-hidden">
                    <CardHeader className="bg-white/[0.02] px-10 py-8 border-b border-white/5">
                        <CardTitle className="text-xl font-black text-white uppercase tracking-tighter italic flex items-center gap-3">
                            <div className="w-2 h-6 bg-amber-500 rounded-full" />
                            Entity Association
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="px-10 py-8 space-y-8">
                        <div className="space-y-3">
                            <h3 className="text-[9px] font-black text-zinc-600 uppercase tracking-[0.3em]">Associated Customer</h3>
                            <div className="flex flex-col bg-black/20 p-5 rounded-2xl border border-white/5">
                                <Link href={`/admin/users/${order.userId?._id}`} className="font-black text-sm text-indigo-400 hover:text-indigo-300 transition-colors uppercase italic tracking-tight">
                                    {order.userId?.displayName || 'Unknown Entity'}
                                </Link>
                                <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-tighter mt-1">{order.userId?.email}</span>
                            </div>
                        </div>

                        <div className="space-y-3">
                            <h3 className="text-[9px] font-black text-zinc-600 uppercase tracking-[0.3em]">Core Product</h3>
                            <div className="flex flex-col bg-black/20 p-5 rounded-2xl border border-white/5">
                                {order.productId ? (
                                    <Link href={`/admin/products/${order.productId._id}`} className="font-black text-sm text-white hover:text-indigo-400 transition-colors uppercase italic tracking-tight">
                                        {order.productId.name}
                                    </Link>
                                ) : (
                                    <span className="text-[10px] font-black text-rose-500 uppercase tracking-[0.2em]">Redacted • Discontinued</span>
                                )}
                            </div>
                        </div>

                        <div className="space-y-3">
                            <h3 className="text-[9px] font-black text-zinc-600 uppercase tracking-[0.3em]">Primary Creator</h3>
                            <div className="flex flex-col bg-black/20 p-5 rounded-2xl border border-white/5">
                                <Link href={`/admin/users/${order.creatorId?._id}`} className="font-black text-sm text-zinc-300 hover:text-white transition-colors uppercase italic tracking-tight">
                                    {order.creatorId?.displayName || 'Unknown Creator'}
                                </Link>
                                <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-tighter mt-1">{order.creatorId?.email}</span>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
