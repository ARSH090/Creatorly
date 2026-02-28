'use client';

/* eslint-disable react-hooks/exhaustive-deps, react/no-unescaped-entities, @next/next/no-img-element, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars, prefer-const, import/no-anonymous-default-export */

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
        <div className="space-y-6">
            <div className="flex items-center gap-4">
                <Link href="/admin/orders">
                    <Button variant="ghost" size="icon"><ArrowLeft className="h-4 w-4" /></Button>
                </Link>
                <div className="flex-1">
                    <h1 className="text-3xl font-bold tracking-tight">Order Details</h1>
                    <p className="text-muted-foreground">#{order._id}</p>
                </div>
                {order.status === 'paid' && (
                    <Button variant="destructive" onClick={handleRefund} disabled={refunding}>
                        {refunding && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        <RefreshCw className="mr-2 h-4 w-4" /> Process Refund
                    </Button>
                )}
            </div>

            <div className="grid gap-6 md:grid-cols-2">
                <Card>
                    <CardHeader>
                        <CardTitle>Summary</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex justify-between items-center border-b pb-2">
                            <span className="font-medium">Status</span>
                            <Badge variant={order.status === 'paid' ? 'default' : 'destructive'}>
                                {order.status}
                            </Badge>
                        </div>
                        <div className="flex justify-between items-center border-b pb-2">
                            <span className="font-medium">Total Amount</span>
                            <span className="text-xl font-bold">₹{order.total}</span>
                        </div>
                        <div className="flex justify-between items-center border-b pb-2">
                            <span className="font-medium">Date</span>
                            <span>{format(new Date(order.createdAt), 'PPP p')}</span>
                        </div>
                        <div className="flex justify-between items-center border-b pb-2">
                            <span className="font-medium">Payment ID</span>
                            <span className="font-mono text-sm">{order.paymentDetails?.razorpayPaymentId}</span>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Customer & Product</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-1">
                            <h3 className="font-medium text-sm text-muted-foreground">Customer</h3>
                            <div className="flex flex-col">
                                <Link href={`/admin/users/${order.userId?._id}`} className="text-indigo-600 hover:underline">
                                    {order.userId?.displayName || 'Unknown'}
                                </Link>
                                <span className="text-sm text-muted-foreground">{order.userId?.email}</span>
                            </div>
                        </div>

                        <div className="space-y-1 pt-4">
                            <h3 className="font-medium text-sm text-muted-foreground">Product</h3>
                            <div className="flex flex-col">
                                {order.productId ? (
                                    <Link href={`/admin/products/${order.productId._id}`} className="text-indigo-600 hover:underline">
                                        {order.productId.name}
                                    </Link>
                                ) : (
                                    <span>Product Deleted</span>
                                )}
                            </div>
                        </div>

                        <div className="space-y-1 pt-4">
                            <h3 className="font-medium text-sm text-muted-foreground">Creator</h3>
                            <div className="flex flex-col">
                                <Link href={`/admin/users/${order.creatorId?._id}`} className="text-indigo-600 hover:underline">
                                    {order.creatorId?.displayName || 'Unknown'}
                                </Link>
                                <span className="text-sm text-muted-foreground">{order.creatorId?.email}</span>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
