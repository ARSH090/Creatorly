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
import { Search, Eye, ShoppingCart, PackageSearch } from 'lucide-react';
import { format } from 'date-fns';
import { TableSkeleton } from '@/components/ui/skeleton-loaders';
import { EmptyState } from '@/components/ui/empty-state';
import { toast } from 'react-hot-toast';
import { cn } from '@/lib/utils';

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
        setOrders(data.orders || []);
        setTotalPages(data.pagination?.pages || 1);
      } else {
        throw new Error('Signal lost');
      }
    } catch (error) {
      toast.error('Failed to sync with transaction relay');
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
    <div className="max-w-7xl mx-auto space-y-12 pb-24 animate-in fade-in duration-700">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-black text-white italic uppercase tracking-tighter flex items-center gap-4">
            <ShoppingCart className="w-10 h-10 text-emerald-500 shadow-[0_0_20px_rgba(16,185,129,0.4)]" />
            LEDGER COMMAND
          </h1>
          <p className="text-[10px] font-black text-zinc-600 uppercase tracking-[0.4em] mt-2 ml-14">
            Transaction Flow • Revenue Extraction
          </p>
        </div>
      </header>

      <div className="flex flex-col md:flex-row items-center gap-6">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
          <Input
            placeholder="SEARCH TRANSACTION ID..."
            className="pl-12 bg-zinc-900/40 border-white/5 h-14 rounded-2xl text-white font-black uppercase text-xs tracking-widest focus:ring-emerald-500/20"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Select value={status} onValueChange={setStatus}>
          <SelectTrigger className="w-full md:w-[240px] bg-zinc-900/40 border-white/5 h-14 rounded-2xl text-zinc-400 font-black uppercase text-[10px] tracking-[0.2em]">
            <SelectValue placeholder="TRANS STATUS" />
          </SelectTrigger>
          <SelectContent className="bg-zinc-900 border-white/10 rounded-2xl overflow-hidden">
            <SelectItem value="all" className="text-[10px] font-black uppercase tracking-widest text-zinc-400 focus:text-white">All Signals</SelectItem>
            <SelectItem value="paid" className="text-[10px] font-black uppercase tracking-widest text-zinc-400 focus:text-white">Success (Paid)</SelectItem>
            <SelectItem value="pending" className="text-[10px] font-black uppercase tracking-widest text-zinc-400 focus:text-white">Processing</SelectItem>
            <SelectItem value="refunded" className="text-[10px] font-black uppercase tracking-widest text-zinc-400 focus:text-white">Reversed</SelectItem>
            <SelectItem value="failed" className="text-[10px] font-black uppercase tracking-widest text-zinc-400 focus:text-white">Dropped</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="rounded-[3rem] border border-white/5 bg-zinc-900/40 backdrop-blur-xl overflow-hidden min-h-[400px]">
        <Table>
          <TableHeader className="bg-white/5">
            <TableRow className="border-b-white/5 hover:bg-transparent">
              <TableHead className="text-[10px] font-black text-zinc-500 uppercase tracking-widest py-6 pl-8">Signal ID</TableHead>
              <TableHead className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Origin</TableHead>
              <TableHead className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Value</TableHead>
              <TableHead className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Protocol</TableHead>
              <TableHead className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Timestamp</TableHead>
              <TableHead className="text-[10px] font-black text-zinc-500 uppercase tracking-widest text-right pr-8">Inspect</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={6} className="p-8">
                  <TableSkeleton rows={5} />
                </TableCell>
              </TableRow>
            ) : orders.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="p-0">
                  <EmptyState
                    icon={PackageSearch}
                    title="Ledger Empty"
                    description="No transaction signals detected in the specified range."
                    actionLabel="Reset Link"
                    onAction={() => { setSearch(''); setStatus('all'); }}
                    className="border-none bg-transparent"
                  />
                </TableCell>
              </TableRow>
            ) : (
              orders.map((order) => (
                <TableRow key={order._id} className="border-b-white/5 transition-colors hover:bg-white/[0.02]">
                  <TableCell className="py-6 pl-8">
                    <span className="text-[10px] font-bold text-zinc-500 font-mono uppercase tracking-widest truncate max-w-[120px] block">
                      {order._id}
                    </span>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="text-sm font-black text-white italic tracking-tight">{order.userId?.displayName || 'GUEST UNIT'}</span>
                      <span className="text-[9px] font-bold text-zinc-600 uppercase tracking-widest">{order.userId?.email || 'OFF-GRID'}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-[11px] font-black text-white italic tracking-tighter">₹{order.total.toLocaleString()}</TableCell>
                  <TableCell>
                    <span className={cn(
                      "px-3 py-1 rounded-full border text-[9px] font-black uppercase tracking-widest shadow-sm",
                      order.status === 'paid' ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" :
                        order.status === 'refunded' ? "bg-rose-500/10 text-rose-500 border-rose-500/20" :
                          "bg-zinc-800 text-zinc-400 border-white/5"
                    )}>
                      {order.status}
                    </span>
                  </TableCell>
                  <TableCell className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">
                    {format(new Date(order.createdAt), 'MMM dd, HH:mm')}
                  </TableCell>
                  <TableCell className="text-right pr-8">
                    <Button variant="ghost" size="sm" asChild className="h-9 w-9 bg-white/5 hover:bg-white/10 text-white rounded-xl p-0">
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

      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-8 p-6 bg-zinc-900/40 border border-white/5 rounded-3xl backdrop-blur-sm">
          <p className="text-[10px] font-black text-zinc-600 uppercase tracking-widest">
            Ledger Batch {page} <span className="text-white mx-1 text-xs">/</span> {totalPages}
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
