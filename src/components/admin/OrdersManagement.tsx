'use client';

import React, { useState, useEffect } from 'react';
import {
  ShoppingCart, Search, Filter, Eye,
  RefreshCw, IndianRupee, Clock, CheckCircle,
  XCircle, Loader2, AlertCircle, ExternalLink,
  ChevronLeft, ChevronRight, Package
} from 'lucide-react';

interface Order {
  _id: string;
  orderId: string;
  creator: string;
  customer: string;
  amount: number;
  status: string;
  paymentStatus: string;
  createdAt: string;
}

export function OrdersManagement() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '20',
        ...(search && { search }),
        ...(statusFilter !== 'all' && { status: statusFilter }),
      });

      const res = await fetch(`/api/admin/orders?${params}`);
      const data = await res.json();
      if (data.success || data.orders) {
        setOrders(data.orders || data.data.orders);
        setTotal(data.pagination?.total || 0);
        setTotalPages(data.pagination?.pages || 1);
      }
    } catch (error) {
      console.error('Failed to fetch orders:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(fetchOrders, 500);
    return () => clearTimeout(timer);
  }, [search, statusFilter, page]);

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'completed':
      case 'paid':
        return 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20';
      case 'pending':
        return 'bg-amber-500/10 text-amber-500 border-amber-500/20';
      case 'failed':
        return 'bg-rose-500/10 text-rose-500 border-rose-500/20';
      default:
        return 'bg-zinc-800 text-zinc-400 border-white/5';
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Header Area */}
      <div className="bg-zinc-900 rounded-[2.5rem] border border-white/10 shadow-2xl overflow-hidden">
        <div className="p-8 border-b border-white/5 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div>
            <h2 className="text-xl font-black text-white flex items-center gap-3 uppercase tracking-tighter italic">
              <ShoppingCart className="text-indigo-500" />
              Transaction Surveillance
            </h2>
            <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mt-1">Global Commerce Stream</p>
          </div>

          <div className="flex flex-wrap items-center gap-4">
            <div className="relative group">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-600 transition-colors" />
              <input
                type="text"
                placeholder="Scan Order ID..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="bg-black/40 border border-white/5 rounded-2xl pl-12 pr-6 py-3 text-sm text-white focus:outline-none focus:border-indigo-500/50 transition-all w-64 placeholder:text-zinc-700 font-bold uppercase italic"
              />
            </div>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-black/40 border border-white/5 rounded-2xl px-6 py-3 text-[10px] font-black uppercase text-white tracking-widest outline-none focus:border-indigo-500/50"
            >
              <option value="all">All Status</option>
              <option value="paid">Paid</option>
              <option value="pending">Pending</option>
              <option value="failed">Failed</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="text-[10px] font-black text-zinc-600 uppercase tracking-[0.2em] border-b border-white/5 bg-white/[0.01]">
                <th className="px-8 py-5">Order Identification</th>
                <th className="px-8 py-5">Economic Value</th>
                <th className="px-8 py-5">Origin / Destination</th>
                <th className="px-8 py-5 text-right">Surveillance</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {loading ? (
                <tr>
                  <td colSpan={4} className="py-20 text-center">
                    <Loader2 className="w-8 h-8 text-indigo-500 animate-spin mx-auto mb-4" />
                    <p className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Decrypting Transaction Flow...</p>
                  </td>
                </tr>
              ) : orders.length === 0 ? (
                <tr>
                  <td colSpan={4} className="py-20 text-center">
                    <AlertCircle className="w-8 h-8 text-zinc-700 mx-auto mb-4" />
                    <p className="text-[10px] font-black uppercase tracking-widest text-zinc-500">No signals detected</p>
                  </td>
                </tr>
              ) : orders.map((o) => (
                <tr key={o._id} className="hover:bg-white/[0.02] transition-colors group">
                  <td className="px-8 py-6">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-xl bg-indigo-500/10 flex items-center justify-center font-black text-indigo-500 border border-indigo-500/20">
                        <Package size={18} />
                      </div>
                      <div>
                        <p className="font-black text-white text-sm tracking-widest uppercase italic group-hover:text-indigo-400 transition-colors">#{o.orderId}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <Clock size={10} className="text-zinc-600" />
                          <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">{new Date(o.createdAt).toLocaleDateString()}</p>
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    <div className="space-y-1">
                      <p className="font-black text-white text-lg tracking-tighter italic">₹{o.amount.toLocaleString()}</p>
                      <span className={`px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-widest border ${getStatusColor(o.status || o.paymentStatus)}`}>
                        {o.status || o.paymentStatus}
                      </span>
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
                        <p className="text-[10px] font-black text-zinc-300 uppercase italic leading-none">{o.creator}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-zinc-700" />
                        <p className="text-[10px] font-bold text-zinc-500 lowercase leading-none">{o.customer}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-8 py-6 text-right">
                    <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button className="p-2 bg-white/5 border border-white/10 rounded-xl text-zinc-500 hover:text-white transition-all shadow-xl">
                        <Eye size={16} />
                      </button>
                      <button className="p-2 bg-white/5 border border-white/10 rounded-xl text-zinc-500 hover:text-white transition-all shadow-xl">
                        <ExternalLink size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="p-8 bg-black/20 border-t border-white/5 flex items-center justify-between">
          <p className="text-[10px] font-black text-zinc-600 uppercase tracking-widest animate-pulse">
            End-to-End Surveillance Active • Database Cluster: HQ-NORTH-01
          </p>
          <div className="flex items-center gap-4">
            <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Node {page} / {totalPages}</span>
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
