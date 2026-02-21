// @ts-nocheck
'use client';

import { useState, useEffect } from 'react';
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
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Loader2, Plus, Trash2, Tag, ShieldAlert } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'react-hot-toast';

export default function CouponsPage() {
  const [coupons, setCoupons] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [open, setOpen] = useState(false);

  // Create Form
  const [form, setForm] = useState({
    code: '',
    discountType: 'percentage',
    discountValue: '',
    validUntil: '',
    usageLimit: ''
  });

  const fetchCoupons = async () => {
    try {
      const res = await fetch('/api/admin/coupons');
      if (res.ok) {
        const data = await res.json();
        setCoupons(data.coupons);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCoupons();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);
    try {
      const res = await fetch('/api/admin/coupons', {
        method: 'POST',
        body: JSON.stringify({
          ...form,
          discountValue: parseFloat(form.discountValue),
          usageLimit: form.usageLimit ? parseInt(form.usageLimit) : undefined,
        }),
        headers: { 'Content-Type': 'application/json' }
      });
      if (res.ok) {
        toast.success('Coupon created');
        setOpen(false);
        setForm({ code: '', discountType: 'percentage', discountValue: '', validUntil: '', usageLimit: '' });
        fetchCoupons();
      } else {
        const data = await res.json();
        toast.error(data.error || 'Failed to create coupon');
      }
    } catch (error) {
      toast.error('Error creating coupon');
    } finally {
      setCreating(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this coupon?')) return;
    try {
      const res = await fetch(`/api/admin/coupons/${id}`, { method: 'DELETE' });
      if (res.ok) {
        toast.success('Coupon deleted');
        setCoupons(coupons.filter(c => c._id !== id));
      } else {
        toast.error('Failed to delete');
      }
    } catch (error) {
      toast.error('Error deleting coupon');
    }
  };

  return (
    <div className="space-y-12">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h1 className="text-4xl font-black text-white tracking-tighter italic uppercase flex items-center gap-4">
            <Tag className="w-10 h-10 text-indigo-500 shadow-[0_0_20px_rgba(99,102,241,0.4)]" />
            COUPON REGISTRY
          </h1>
          <p className="text-[10px] font-black text-zinc-600 uppercase tracking-[0.4em] mt-2 ml-14">
            Promotion Engine • Incentive Distribution Active
          </p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="bg-indigo-600 hover:bg-indigo-700 text-white border-white/10 rounded-2xl px-8 h-14 font-black uppercase text-[10px] tracking-widest shadow-xl shadow-indigo-500/20 active:scale-95 transition-all">
              <Plus className="mr-3 h-5 w-5" /> CREATE PROMO
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-zinc-900 border-white/10 rounded-[2.5rem] shadow-2xl p-10 max-w-2xl">
            <DialogHeader>
              <DialogTitle className="text-2xl font-black text-white italic uppercase tracking-tighter flex items-center gap-3">
                <div className="w-2 h-8 bg-indigo-500 rounded-full" />
                Initialize Promotion
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleCreate} className="space-y-8 pt-6">
              <div className="space-y-2">
                <Label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-1">Voucher Code</Label>
                <Input
                  placeholder="e.g. ALPHA2026"
                  value={form.code}
                  onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })}
                  required
                  className="bg-black/40 border-white/5 border-2 rounded-2xl h-14 text-white font-mono font-black uppercase tracking-widest focus:border-indigo-500 transition-all placeholder:text-zinc-700"
                />
              </div>
              <div className="grid grid-cols-2 gap-8">
                <div className="space-y-2">
                  <Label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-1">Reward Type</Label>
                  <Select
                    value={form.discountType}
                    onValueChange={(v: string) => setForm({ ...form, discountType: v })}
                  >
                    <SelectTrigger className="bg-black/40 border-white/5 border-2 rounded-2xl h-14 text-white font-black uppercase tracking-widest">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-zinc-900 border-white/10">
                      <SelectItem value="percentage" className="font-black uppercase text-[10px] tracking-widest">Percentage Impact (%)</SelectItem>
                      <SelectItem value="fixed" className="font-black uppercase text-[10px] tracking-widest">Fixed Settlement (₹)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-1">Market Value</Label>
                  <Input
                    type="number"
                    placeholder="Value"
                    value={form.discountValue}
                    onChange={(e) => setForm({ ...form, discountValue: e.target.value })}
                    required
                    className="bg-black/40 border-white/5 border-2 rounded-2xl h-14 text-white font-black tracking-widest focus:border-indigo-500 transition-all"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-8">
                <div className="space-y-2">
                  <Label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-1">Expiration Window</Label>
                  <Input
                    type="date"
                    value={form.validUntil}
                    onChange={(e) => setForm({ ...form, validUntil: e.target.value })}
                    className="bg-black/40 border-white/5 border-2 rounded-2xl h-14 text-white font-black tracking-widest focus:border-indigo-500 transition-all [color-scheme:dark]"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-1">Quota Limit</Label>
                  <Input
                    type="number"
                    placeholder="Infinity"
                    value={form.usageLimit}
                    onChange={(e) => setForm({ ...form, usageLimit: e.target.value })}
                    className="bg-black/40 border-white/5 border-2 rounded-2xl h-14 text-white font-black tracking-widest focus:border-indigo-500 transition-all"
                  />
                </div>
              </div>
              <DialogFooter className="pt-4">
                <Button type="submit" disabled={creating} className="w-full bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl h-16 font-black uppercase text-xs tracking-[0.2em] shadow-2xl shadow-indigo-500/30">
                  {creating ? <Loader2 className="mr-3 h-5 w-5 animate-spin" /> : <ShieldAlert className="mr-3 h-5 w-5" />}
                  COMMIT TO REGISTRY
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="bg-zinc-900/40 rounded-[3rem] border border-white/5 shadow-2xl backdrop-blur-md overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-700">
        <Table>
          <TableHeader className="bg-white/[0.02]">
            <TableRow className="border-white/5 hover:bg-transparent px-8">
              <TableHead className="px-10 py-8 text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em]">Promo Core</TableHead>
              <TableHead className="px-10 py-8 text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em]">Net Impact</TableHead>
              <TableHead className="px-10 py-8 text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em]">Utilization Hub</TableHead>
              <TableHead className="px-10 py-8 text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em]">Protocol</TableHead>
              <TableHead className="px-10 py-8 text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em]">Status</TableHead>
              <TableHead className="px-10 py-8 text-right text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em]">Directive</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={6} className="h-64 text-center">
                  <div className="flex flex-col items-center gap-4">
                    <Loader2 className="h-10 w-10 animate-spin text-indigo-500" />
                    <p className="text-[10px] font-black text-zinc-600 uppercase tracking-[0.3em]">Querying Registry</p>
                  </div>
                </TableCell>
              </TableRow>
            ) : coupons.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="h-64 text-center">
                  <p className="text-[10px] font-black text-zinc-700 uppercase tracking-widest">No Promotions Active</p>
                </TableCell>
              </TableRow>
            ) : (
              coupons.map((coupon) => (
                <TableRow key={coupon._id} className="border-white/5 hover:bg-white/[0.02] transition-colors group">
                  <TableCell className="px-10 py-8 font-mono font-black text-white text-base tracking-widest uppercase italic">
                    {coupon.code}
                  </TableCell>
                  <TableCell className="px-10 py-8">
                    <span className="text-xl font-black text-white tracking-tighter italic">
                      {coupon.discountType === 'percentage' ? `${coupon.discountValue}%` : `₹${coupon.discountValue}`}
                    </span>
                  </TableCell>
                  <TableCell className="px-10 py-8">
                    <div className="flex items-center gap-3">
                      <div className="w-full h-2 bg-black/40 rounded-full overflow-hidden border border-white/5 flex-1 max-w-[100px]">
                        <div
                          className="h-full bg-indigo-500"
                          style={{ width: `${Math.min(100, (coupon.usedCount / (coupon.usageLimit || 1)) * 100)}%` }}
                        />
                      </div>
                      <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">
                        {coupon.usedCount} / {coupon.usageLimit || '∞'}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="px-10 py-8 capitalize text-[10px] font-black text-zinc-500 tracking-widest">{coupon.discountType}</TableCell>
                  <TableCell className="px-10 py-8">
                    <Badge variant={coupon.status === 'active' ? 'default' : 'secondary'} className="uppercase text-[9px] font-black tracking-widest px-4 py-1.5">
                      {coupon.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="px-10 py-8 text-right">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="bg-black/40 border border-white/5 text-zinc-600 hover:text-rose-500 hover:bg-rose-500/10 hover:border-rose-500/20 rounded-xl h-12 w-12 transition-all"
                      onClick={() => handleDelete(coupon._id)}
                    >
                      <Trash2 className="h-5 w-5" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
