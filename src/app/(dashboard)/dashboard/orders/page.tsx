'use client';

import React, { useState, useEffect } from 'react';
import {
    Search, Filter, ShoppingBag, Clock, CheckCircle, XCircle, RefreshCw, ChevronRight, Eye, User, Mail, Calendar, FileText, Download, X, Save, Share
} from 'lucide-react';
import { useAuth } from '@clerk/nextjs';
import EmptyState from '@/components/dashboard/EmptyState';
import { generateCSV, downloadCSV } from '@/lib/utils/export-utils';

export default function OrdersPage() {
    const { isLoaded, isSignedIn, getToken } = useAuth();
    const [loading, setLoading] = useState(true);
    const [orders, setOrders] = useState<any[]>([]);
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    const [selectedOrder, setSelectedOrder] = useState<any>(null);
    const [isPanelOpen, setIsPanelOpen] = useState(false);
    const [savingNotes, setSavingNotes] = useState(false);
    const [internalNotes, setInternalNotes] = useState('');

    const fetchOrders = async () => {
        if (!isLoaded || !isSignedIn) return;
        setLoading(true);
        try {
            const token = await getToken();
            const url = new URL('/api/orders', window.location.origin);
            if (search) url.searchParams.set('search', search);
            if (statusFilter) url.searchParams.set('status', statusFilter);

            const response = await fetch(url.toString(), {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await response.json();
            setOrders(data.orders || []);
        } catch (error) {
            console.error('Failed to fetch orders:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchOrders();
    }, [isLoaded, isSignedIn, statusFilter]);

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        fetchOrders();
    };

    const handleOpenOrder = async (order: any) => {
        setSelectedOrder(order);
        setInternalNotes(order.internalNotes || '');
        setIsPanelOpen(true);

        // Fetch detailed order for deeper info
        try {
            const token = await getToken();
            const res = await fetch(`/api/orders/${order._id}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const detailed = await res.json();
            if (detailed && !detailed.error) {
                setSelectedOrder(detailed);
            }
        } catch (err) {
            console.error('Failed to fetch order details:', err);
        }
    };

    const handleUpdateNotes = async () => {
        if (!selectedOrder) return;
        setSavingNotes(true);
        try {
            const token = await getToken();
            const res = await fetch(`/api/orders/${selectedOrder._id}`, {
                method: 'PATCH',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ internalNotes })
            });
            if (res.ok) {
                // Update local list
                setOrders(orders.map(o => o._id === selectedOrder._id ? { ...o, internalNotes } : o));
                // Update selected
                setSelectedOrder({ ...selectedOrder, internalNotes });
            }
        } catch (err) {
            console.error('Failed to save notes:', err);
        } finally {
            setSavingNotes(false);
        }
    };

    const getStatusStyles = (status: string) => {
        switch (status?.toLowerCase()) {
            case 'completed':
            case 'success':
                return 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20';
            case 'pending':
            case 'payment_initiated':
                return 'text-amber-400 bg-amber-500/10 border-amber-500/20';
            case 'failed':
                return 'text-red-400 bg-red-500/10 border-red-500/20';
            default:
                return 'text-zinc-400 bg-zinc-500/10 border-zinc-500/20';
        }
    };

    return (
        <div className="max-w-7xl mx-auto space-y-8 relative">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-black text-white mb-2">Orders</h1>
                    <p className="text-zinc-500 font-medium">Manage fulfillment and track customer transactions.</p>
                </div>
            </div>

            {/* Filters & Search */}
            <div className="flex flex-col md:flex-row gap-4">
                <form onSubmit={handleSearch} className="relative flex-1">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                    <input
                        type="text"
                        placeholder="Search by Order ID, Email, or Customer Name..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full bg-zinc-900/50 border border-white/5 rounded-2xl pl-12 pr-4 py-3 text-white focus:outline-none focus:border-indigo-500/50 transition-colors"
                    />
                </form>
                <div className="flex gap-4">
                    <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className="bg-zinc-900/50 border border-white/5 rounded-2xl px-6 py-3 text-sm font-bold text-white outline-none cursor-pointer focus:border-indigo-500/50"
                    >
                        <option value="">All Statuses</option>
                        <option value="completed">Completed</option>
                        <option value="pending">Pending</option>
                        <option value="failed">Failed</option>
                        <option value="refunded">Refunded</option>
                    </select>
                    <button
                        onClick={() => {
                            const csv = generateCSV(orders, [
                                { header: 'Order ID', key: '_id' },
                                { header: 'Customer', key: 'customerEmail' },
                                { header: 'Amount', key: 'total' },
                                { header: 'Status', key: 'status' },
                                { header: 'Date', key: 'createdAt' }
                            ]);
                            downloadCSV(csv, `orders-${new Date().toISOString().split('T')[0]}.csv`);
                        }}
                        className="bg-zinc-900/50 border border-white/5 rounded-2xl px-6 py-3 text-sm font-bold text-white hover:bg-white/5 transition-all flex items-center gap-2"
                    >
                        <Download className="w-4 h-4 text-zinc-500" />
                        Export
                    </button>
                </div>
            </div>

            {/* Orders List */}
            {loading ? (
                <div className="space-y-4">
                    {[1, 2, 3, 4, 5].map(i => (
                        <div key={i} className="bg-zinc-900/50 rounded-2xl border border-white/5 h-24 animate-pulse" />
                    ))}
                </div>
            ) : orders.length === 0 ? (
                <EmptyState
                    imageUrl="/empty-orders.png"
                    title="No orders found"
                    description="None of your orders matched the current filters. Your sales will appear here once customers start purchasing."
                />
            ) : (
                <div className="space-y-4">
                    {orders.map((order) => (
                        <div
                            key={order._id}
                            onClick={() => handleOpenOrder(order)}
                            className="bg-zinc-900/50 rounded-2xl border border-white/5 p-4 md:p-6 flex flex-col md:flex-row md:items-center gap-4 hover:bg-zinc-900 hover:border-white/10 transition-all group cursor-pointer"
                        >
                            <div className="w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center flex-shrink-0">
                                <ShoppingBag className="w-6 h-6 text-zinc-400 group-hover:text-white transition-colors" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-3 mb-1">
                                    <h3 className="text-white font-bold truncate">Order #{order.razorpayOrderId?.slice(-8).toUpperCase() || order._id.toString().slice(-8).toUpperCase()}</h3>
                                    <span className={`px-2 py-0.5 text-[8px] font-black uppercase tracking-widest rounded-md border ${getStatusStyles(order.status)}`}>
                                        {order.status || 'Success'}
                                    </span>
                                </div>
                                <p className="text-sm text-zinc-500 font-medium truncate">{order.customerEmail} • {new Date(order.createdAt).toLocaleDateString()}</p>
                            </div>
                            <div className="md:text-right">
                                <p className="text-lg font-black text-white tracking-tight">₹{order.total || order.amount}</p>
                                <p className="text-[10px] font-black text-zinc-600 uppercase tracking-widest">{order.items?.length || 1} items</p>
                            </div>
                            <button className="p-2 rounded-xl bg-white/5 text-zinc-400 group-hover:bg-white/10 group-hover:text-white transition-all">
                                <ChevronRight className="w-5 h-5" />
                            </button>
                        </div>
                    ))}
                </div>
            )}

            {/* Order Detail Modal / Sidebar */}
            {isPanelOpen && selectedOrder && (
                <>
                    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-40 transition-opacity" onClick={() => setIsPanelOpen(false)} />
                    <div className="fixed right-0 top-0 bottom-0 w-full max-w-2xl bg-[#080808] border-l border-white/5 z-50 p-8 overflow-y-auto animate-in slide-in-from-right duration-500">
                        <div className="flex items-center justify-between mb-12">
                            <h2 className="text-2xl font-black text-white uppercase tracking-tight">Order Details</h2>
                            <button onClick={() => setIsPanelOpen(false)} className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center text-zinc-500 hover:text-white hover:bg-white/10 transition-all">
                                <X className="w-6 h-6" />
                            </button>
                        </div>

                        <div className="space-y-12">
                            {/* Summary Card */}
                            <div className="bg-zinc-900/40 rounded-[2.5rem] border border-white/5 p-8 flex items-center justify-between">
                                <div className="space-y-1">
                                    <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Total Paid</p>
                                    <h3 className="text-4xl font-black text-white tracking-tighter">₹{(selectedOrder.total || selectedOrder.amount).toLocaleString()}</h3>
                                </div>
                                <div className={`px-4 py-2 rounded-2xl border font-black uppercase tracking-widest text-[10px] ${getStatusStyles(selectedOrder.status)}`}>
                                    {selectedOrder.status}
                                </div>
                            </div>

                            {/* Customer Info */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <div className="space-y-4">
                                    <div className="flex items-center gap-3 text-zinc-500">
                                        <User className="w-4 h-4" />
                                        <h4 className="text-[10px] font-black uppercase tracking-[0.2em]">Customer</h4>
                                    </div>
                                    <div className="bg-white/5 rounded-2xl p-4 space-y-2">
                                        <p className="font-bold text-white">{selectedOrder.customerName || 'N/A'}</p>
                                        <div className="flex items-center gap-2 text-zinc-400 text-xs">
                                            <Mail className="w-3 h-3" />
                                            {selectedOrder.customerEmail}
                                        </div>
                                    </div>
                                </div>
                                <div className="space-y-4">
                                    <div className="flex items-center gap-3 text-zinc-500">
                                        <Calendar className="w-4 h-4" />
                                        <h4 className="text-[10px] font-black uppercase tracking-[0.2em]">Purchase Date</h4>
                                    </div>
                                    <div className="bg-white/5 rounded-2xl p-4">
                                        <p className="font-bold text-white">{new Date(selectedOrder.createdAt).toLocaleString()}</p>
                                        <p className="text-[10px] text-zinc-500 uppercase tracking-widest font-black mt-1">Order ID: {selectedOrder._id.slice(-8).toUpperCase()}</p>
                                    </div>
                                </div>
                            </div>

                            {/* Internal Notes */}
                            <div className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3 text-zinc-500">
                                        <FileText className="w-4 h-4" />
                                        <h4 className="text-[10px] font-black uppercase tracking-[0.2em]">Internal Notes</h4>
                                    </div>
                                    <button
                                        onClick={handleUpdateNotes}
                                        disabled={savingNotes}
                                        className="text-[10px] font-black text-indigo-400 uppercase tracking-widest flex items-center gap-2 hover:text-indigo-300 disabled:opacity-50"
                                    >
                                        {savingNotes ? 'Saving...' : <><Save className="w-3 h-3" /> Save Notes</>}
                                    </button>
                                </div>
                                <textarea
                                    value={internalNotes}
                                    onChange={(e) => setInternalNotes(e.target.value)}
                                    placeholder="Add notes for fulfillment, shipping, or client support..."
                                    className="w-full bg-zinc-900/50 border border-white/5 rounded-[2rem] p-6 text-sm text-white focus:outline-none focus:border-indigo-500/50 min-h-[150px] resize-none transition-all placeholder:text-zinc-700 font-medium"
                                />
                            </div>

                            {/* Items Section */}
                            <div className="space-y-6">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3 text-zinc-500">
                                        <ShoppingBag className="w-4 h-4" />
                                        <h4 className="text-[10px] font-black uppercase tracking-[0.2em]">Order Items</h4>
                                    </div>
                                    {selectedOrder.downloadCount > 0 && (
                                        <div className="flex items-center gap-2 px-3 py-1 bg-indigo-500/10 border border-indigo-500/20 rounded-full">
                                            <Download className="w-3 h-3 text-indigo-400" />
                                            <span className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">{selectedOrder.downloadCount} Assets Downloaded</span>
                                        </div>
                                    )}
                                </div>
                                <div className="space-y-4">
                                    {selectedOrder.items?.map((item: any, idx: number) => (
                                        <div key={idx} className="bg-white/5 rounded-[2rem] p-6 flex items-center gap-6 group hover:bg-white/10 transition-all border border-transparent hover:border-white/5">
                                            <div className="w-16 h-16 bg-zinc-800 rounded-2xl overflow-hidden relative flex-shrink-0">
                                                {item.productId?.image && <img src={item.productId.image} className="object-cover w-full h-full" />}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <h5 className="font-bold text-white truncate">{item.name}</h5>
                                                <div className="flex items-center gap-3 mt-1">
                                                    <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">{item.type}</span>
                                                    <span className="w-1 h-1 bg-zinc-700 rounded-full" />
                                                    <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Qty: {item.quantity || 1}</span>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <p className="font-black text-white">₹{item.price}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}
