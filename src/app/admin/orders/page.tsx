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
import { Loader2, Search, Eye } from 'lucide-react';
import { format } from 'date-fns';

export default function OrdersPage() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('all');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '10',
        search,
        status
      });
      const res = await fetch(`/api/admin/orders?${params}`);
      if (res.ok) {
        const data = await res.json();
        setOrders(data.orders);
        setTotalPages(data.pagination.pages);
      }
    } catch (error) {
      console.error('Failed to fetch orders', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const debounce = setTimeout(() => {
      fetchOrders();
    }, 500);
    return () => clearTimeout(debounce);
  }, [search, status, page]);

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h1 className="text-4xl font-black text-white tracking-tighter italic uppercase flex items-center gap-4">
            <div className="w-3 h-10 bg-indigo-500 rounded-full shadow-[0_0_15px_rgba(99,102,241,0.3)]" />
            Order Ledger
          </h1>
          <p className="text-[10px] font-black text-zinc-600 uppercase tracking-[0.3em] ml-7">Platform Transactions • Verified Registry</p>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-sm group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-600 group-focus-within:text-indigo-500 transition-colors" />
          <Input
            placeholder="Search order ID..."
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
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="paid">Settled</SelectItem>
            <SelectItem value="pending">Awaiting</SelectItem>
            <SelectItem value="refunded">Reversed</SelectItem>
            <SelectItem value="failed">Voided</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="rounded-[2.5rem] border border-white/5 bg-zinc-900/40 overflow-hidden shadow-2xl backdrop-blur-sm">
        <Table>
          <TableHeader className="bg-white/[0.02]">
            <TableRow className="border-white/5 hover:bg-transparent">
              <TableHead className="px-8 py-6 text-[10px] font-black text-zinc-500 uppercase tracking-widest border-b border-white/5">Order ID</TableHead>
              <TableHead className="px-8 py-6 text-[10px] font-black text-zinc-500 uppercase tracking-widest border-b border-white/5">Customer</TableHead>
              <TableHead className="px-8 py-6 text-[10px] font-black text-zinc-500 uppercase tracking-widest border-b border-white/5">Amount</TableHead>
              <TableHead className="px-8 py-6 text-[10px] font-black text-zinc-500 uppercase tracking-widest border-b border-white/5">Status</TableHead>
              <TableHead className="px-8 py-6 text-[10px] font-black text-zinc-500 uppercase tracking-widest border-b border-white/5">Date</TableHead>
              <TableHead className="px-8 py-6 text-right text-[10px] font-black text-zinc-500 uppercase tracking-widest border-b border-white/5">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={6} className="h-24 text-center">
                  <Loader2 className="mx-auto h-6 w-6 animate-spin text-muted-foreground" />
                </TableCell>
              </TableRow>
            ) : orders.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="h-24 text-center">
                  No orders found.
                </TableCell>
              </TableRow>
            ) : (
              orders.map((order) => (
                <TableRow key={order._id} className="border-white/5 hover:bg-white/[0.02] transition-colors group">
                  <TableCell className="px-8 py-6 font-mono text-[10px] text-zinc-600 font-black uppercase tracking-tighter">
                    {order._id}
                  </TableCell>
                  <TableCell className="px-8 py-6">
                    <div className="flex flex-col">
                      <span className="font-black text-sm text-white tracking-tight uppercase italic">{order.userId?.displayName || 'Guest'}</span>
                      <span className="text-[10px] font-bold text-zinc-600 uppercase tracking-tighter">{order.userId?.email}</span>
                    </div>
                  </TableCell>
                  <TableCell className="px-8 py-6 font-black text-lg text-white tracking-tighter italic">₹{order.total}</TableCell>
                  <TableCell className="px-8 py-6">
                    <Badge variant={
                      order.status === 'paid' ? 'default' :
                        order.status === 'refunded' ? 'destructive' : 'secondary'
                    } className="uppercase text-[9px] font-black tracking-widest px-3 py-1">
                      {order.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="px-8 py-6 text-[10px] font-bold text-zinc-500 uppercase tracking-widest font-mono">
                    {format(new Date(order.createdAt), 'MMM d, yyyy')}
                  </TableCell>
                  <TableCell className="px-8 py-6 text-right">
                    <Button variant="ghost" size="sm" className="bg-zinc-900 border border-white/5 h-10 w-10 p-0 text-zinc-500 hover:text-white rounded-xl transition-all" asChild>
                      <Link href={`/admin/orders/${order._id}`}>
                        <Eye className="h-4 w-4" />
                      </Link>
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
      <div className="flex items-center justify-between p-8 bg-black/20 border-t border-white/5">
        <p className="text-[9px] font-black text-zinc-700 uppercase tracking-[0.4em]">Audit Trail Active • 256-bit Encrypted</p>
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
