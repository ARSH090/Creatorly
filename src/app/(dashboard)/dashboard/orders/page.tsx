'use client';

import React, { useState, useEffect } from 'react';
import {
    Search, Filter, ShoppingBag, Clock, CheckCircle, XCircle, RefreshCw, ChevronRight, Eye
} from 'lucide-react';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import { auth } from '@/lib/firebase/client';

export default function OrdersPage() {
    const { user } = useAuth();
    const [loading, setLoading] = useState(true);
    const [orders, setOrders] = useState<any[]>([]);

    useEffect(() => {
        async function fetchOrders() {
            if (!user) return;
            try {
                const tokenIds = auth.currentUser ? await auth.currentUser.getIdToken() : null;
                if (!tokenIds) return;
                const response = await fetch('/api/orders', {
                    headers: {
                        'Authorization': `Bearer ${tokenIds}`
                    }
                });
                const data = await response.json();
                setOrders(data.orders || []);
            } catch (error) {
                console.error('Failed to fetch orders:', error);
            } finally {
                setLoading(false);
            }
        }
        fetchOrders();
    }, [user]);

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'success': return 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20';
            case 'pending': return 'text-amber-400 bg-amber-500/10 border-amber-500/20';
            case 'failed': return 'text-red-400 bg-red-500/10 border-red-500/20';
            case 'refunded': return 'text-zinc-400 bg-zinc-500/10 border-zinc-500/20';
            default: return 'text-zinc-400 bg-zinc-500/10 border-zinc-500/20';
        }
    };

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'success': return CheckCircle;
            case 'pending': return Clock;
            case 'failed': return XCircle;
            case 'refunded': return RefreshCw;
            default: return Clock;
        }
    };

    return (
        <div className="max-w-7xl mx-auto space-y-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-black text-white mb-2">Orders</h1>
                    <p className="text-zinc-500">Track and manage your sales and customers.</p>
                </div>
            </div>

            {/* Filters & Search */}
            <div className="flex flex-col md:flex-row gap-4">
                <div className="relative flex-1">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                    <input
                        type="text"
                        placeholder="Search orders by ID or email..."
                        className="w-full bg-zinc-900/50 border border-white/5 rounded-2xl pl-12 pr-4 py-3 text-white focus:outline-none focus:border-indigo-500/50 transition-colors"
                    />
                </div>
                <div className="flex gap-4">
                    <button className="bg-zinc-900/50 border border-white/5 rounded-2xl px-6 py-3 text-white text-sm font-medium hover:bg-zinc-900 flex items-center gap-2">
                        <Filter className="w-4 h-4" />
                        Filters
                    </button>
                </div>
            </div>

            {/* Orders List */}
            {loading ? (
                <div className="space-y-4">
                    {[1, 2, 3].map(i => (
                        <div key={i} className="bg-zinc-900/50 rounded-2xl border border-white/5 h-24 animate-pulse" />
                    ))}
                </div>
            ) : orders.length === 0 ? (
                <div className="bg-zinc-900/50 rounded-[3rem] border border-dashed border-white/10 p-20 text-center flex flex-col items-center justify-center space-y-6">
                    <div className="w-24 h-24 bg-white/5 rounded-full flex items-center justify-center">
                        <ShoppingBag className="w-12 h-12 text-zinc-700" />
                    </div>
                    <div>
                        <h2 className="text-2xl font-bold text-white mb-2">No orders yet</h2>
                        <p className="text-zinc-500 max-w-sm mx-auto">Share your products to start getting sales.</p>
                    </div>
                </div>
            ) : (
                <div className="space-y-4">
                    {orders.map((order) => {
                        const StatusIcon = getStatusIcon(order.status);
                        return (
                            <div key={order._id} className="bg-zinc-900/50 rounded-2xl border border-white/5 p-4 md:p-6 flex flex-col md:flex-row md:items-center gap-4 hover:bg-zinc-900 transition-all group">
                                <div className="w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center flex-shrink-0">
                                    <ShoppingBag className="w-6 h-6 text-zinc-400 group-hover:text-white transition-colors" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-3 mb-1">
                                        <h3 className="text-white font-bold truncate">Order #{order.razorpayOrderId || order._id.toString().slice(-8).toUpperCase()}</h3>
                                        <span className={`px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest rounded-md border flex items-center gap-1.5 ${getStatusColor(order.status)}`}>
                                            <StatusIcon className="w-3 h-3" />
                                            {order.status}
                                        </span>
                                    </div>
                                    <p className="text-sm text-zinc-500 truncate">{order.customerEmail} • {new Date(order.createdAt).toLocaleDateString()}</p>
                                </div>
                                <div className="md:text-right">
                                    <p className="text-lg font-bold text-white">₹{order.amount}</p>
                                    <p className="text-xs text-zinc-500">{order.items?.length || 1} items</p>
                                </div>
                                <button className="p-2 rounded-xl hover:bg-white/10 text-zinc-400 hover:text-white transition-colors">
                                    <ChevronRight className="w-5 h-5" />
                                </button>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
