'use client';

import React, { useState, useEffect } from 'react';
import {
  Ticket, Plus, Search, Edit, Trash2,
  Calendar, Percent, IndianRupee,
  CheckCircle, XCircle, Loader2, AlertCircle,
  Copy, ChevronLeft, ChevronRight, Hash
} from 'lucide-react';

interface Coupon {
  _id: string;
  code: string;
  type: 'percentage' | 'fixed';
  value: number;
  maxUses: number;
  validFrom: string;
  validityPeriodMonths?: number;
  isActive: boolean;
  usedCount: number;
  createdAt: string;
}

export function CouponsManagement() {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState<Coupon | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    code: '',
    type: 'percentage' as 'percentage' | 'fixed',
    value: 0,
    maxUses: 100,
    validityPeriodMonths: 1,
    description: '',
  });

  const fetchCoupons = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/admin/coupons?search=${search}`);
      const data = await res.json();
      if (data.success || data.coupons) {
        setCoupons(data.coupons || data.data.coupons);
      }
    } catch (error) {
      console.error('Failed to fetch coupons:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(fetchCoupons, 500);
    return () => clearTimeout(timer);
  }, [search]);

  const handleSaveCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const method = editingCoupon ? 'PUT' : 'POST';
      const url = editingCoupon ? `/api/admin/coupons/${editingCoupon._id}` : '/api/admin/coupons';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        setShowModal(false);
        setEditingCoupon(null);
        fetchCoupons();
      }
    } catch (error) {
      console.error('Failed to save coupon:', error);
    }
  };

  const handleDeleteCoupon = async (id: string) => {
    if (!confirm('Delete this voucher? This cannot be undone.')) return;
    try {
      setActionLoading(id);
      const res = await fetch(`/api/admin/coupons/${id}`, { method: 'DELETE' });
      if (res.ok) fetchCoupons();
    } catch (error) {
      console.error('Delete failed:', error);
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Action Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h2 className="text-2xl font-black text-white flex items-center gap-3 uppercase tracking-tighter italic">
            <Ticket className="text-emerald-500" />
            Discount Protocols
          </h2>
          <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mt-1">Acquisition Incentive Engine</p>
        </div>

        <div className="flex items-center gap-4">
          <div className="relative group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-600 transition-colors" />
            <input
              type="text"
              placeholder="Find code..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="bg-zinc-900 border border-white/5 rounded-2xl pl-12 pr-6 py-3 text-sm text-white focus:outline-none focus:border-emerald-500/50 transition-all w-48 placeholder:text-zinc-700 font-black uppercase italic"
            />
          </div>
          <button
            onClick={() => {
              setEditingCoupon(null);
              setFormData({ code: '', type: 'percentage', value: 0, maxUses: 100, validityPeriodMonths: 1, description: '' });
              setShowModal(true);
            }}
            className="bg-emerald-500 hover:bg-emerald-400 text-black px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all shadow-lg shadow-emerald-500/20 flex items-center gap-2"
          >
            <Plus size={16} />
            New Voucher
          </button>
        </div>
      </div>

      {/* Grid/Table Layout */}
      <div className="bg-zinc-900 rounded-[2.5rem] border border-white/10 shadow-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="text-[10px] font-black text-zinc-600 uppercase tracking-[0.2em] border-b border-white/5 bg-white/[0.01]">
                <th className="px-8 py-5">Voucher Code</th>
                <th className="px-8 py-5">Value Configuration</th>
                <th className="px-8 py-5">Usage Metrics</th>
                <th className="px-8 py-5">Status / Validity</th>
                <th className="px-8 py-5 text-right">Operations</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {loading ? (
                <tr>
                  <td colSpan={5} className="py-20 text-center">
                    <Loader2 className="w-8 h-8 text-emerald-500 animate-spin mx-auto mb-4" />
                    <p className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Syncing Voucher Database...</p>
                  </td>
                </tr>
              ) : coupons.map((c) => (
                <tr key={c._id} className="hover:bg-white/[0.02] transition-colors group">
                  <td className="px-8 py-6">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center font-black text-emerald-500 border border-emerald-500/20">
                        <Hash size={18} />
                      </div>
                      <p className="font-black text-white text-sm tracking-widest uppercase italic group-hover:text-emerald-400 transition-colors">{c.code}</p>
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    <div className="flex items-center gap-2">
                      <p className="font-black text-white text-lg tracking-tighter italic">
                        {c.type === 'percentage' ? `${c.value}%` : `₹${c.value}`}
                      </p>
                      <span className="text-[8px] font-black text-zinc-600 uppercase tracking-widest bg-white/5 px-2 py-0.5 rounded-full border border-white/5">
                        OFF
                      </span>
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    <div className="space-y-1.5 w-32">
                      <div className="flex justify-between text-[8px] font-black uppercase tracking-widest">
                        <span className="text-zinc-500">Utilization</span>
                        <span className="text-white">{c.usedCount}/{c.maxUses}</span>
                      </div>
                      <div className="h-1 bg-white/5 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-emerald-500"
                          style={{ width: `${Math.min(100, (c.usedCount / (c.maxUses || 1)) * 100)}%` }}
                        />
                      </div>
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    <div className="space-y-1">
                      <span className={`px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-widest border ${c.isActive ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' : 'bg-rose-500/10 text-rose-500 border-rose-500/20'
                        }`}>
                        {c.isActive ? 'Active' : 'Expired'}
                      </span>
                      <p className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest mt-1">Valid {c.validityPeriodMonths} Months</p>
                    </div>
                  </td>
                  <td className="px-8 py-6 text-right">
                    <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => {
                          setEditingCoupon(c);
                          setFormData({
                            code: c.code,
                            type: c.type,
                            value: c.value,
                            maxUses: c.maxUses,
                            validityPeriodMonths: c.validityPeriodMonths || 1,
                            description: '',
                          });
                          setShowModal(true);
                        }}
                        className="p-2 bg-white/5 border border-white/10 rounded-xl text-zinc-500 hover:text-white transition-all"
                      >
                        <Edit size={16} />
                      </button>
                      <button
                        onClick={() => handleDeleteCoupon(c._id)}
                        disabled={actionLoading === c._id}
                        className="p-2 bg-rose-500/10 text-rose-500 border border-rose-500/20 rounded-xl hover:bg-rose-500 hover:text-white transition-all disabled:opacity-50"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-6 animate-in fade-in duration-300">
          <div className="bg-zinc-900 border border-white/10 p-8 rounded-[2.5rem] shadow-2xl max-w-md w-full space-y-8">
            <div>
              <h3 className="text-xl font-black text-white italic uppercase tracking-tighter flex items-center gap-3">
                <div className="w-2 h-6 bg-emerald-500 rounded-full" />
                {editingCoupon ? 'Modifier Voucher' : 'Initiate Voucher'}
              </h3>
              <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mt-1">Voucher Configuration Matrix</p>
            </div>

            <form onSubmit={handleSaveCoupon} className="space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Protocol Code</label>
                <input
                  type="text"
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                  className="w-full bg-black border border-white/5 rounded-2xl px-6 py-4 text-white font-black uppercase italic tracking-widest focus:outline-none focus:border-emerald-500/50"
                  placeholder="SUMMER25"
                  disabled={!!editingCoupon}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Type</label>
                  <select
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value as 'percentage' | 'fixed' })}
                    className="w-full bg-black border border-white/5 rounded-2xl px-6 py-4 text-white font-black uppercase italic focus:outline-none"
                  >
                    <option value="percentage">Percent</option>
                    <option value="fixed">Fixed INR</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Magnitude</label>
                  <input
                    type="number"
                    value={formData.value}
                    onChange={(e) => setFormData({ ...formData, value: parseFloat(e.target.value) })}
                    className="w-full bg-black border border-white/5 rounded-2xl px-6 py-4 text-white font-black italic focus:outline-none focus:border-emerald-500/50"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Quantum Limit</label>
                  <input
                    type="number"
                    value={formData.maxUses}
                    onChange={(e) => setFormData({ ...formData, maxUses: parseInt(e.target.value) })}
                    className="w-full bg-black border border-white/5 rounded-2xl px-6 py-4 text-white font-black italic focus:outline-none focus:border-emerald-500/50"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Duration (Months)</label>
                  <input
                    type="number"
                    value={formData.validityPeriodMonths}
                    onChange={(e) => setFormData({ ...formData, validityPeriodMonths: parseInt(e.target.value) })}
                    className="w-full bg-black border border-white/5 rounded-2xl px-6 py-4 text-white font-black italic focus:outline-none focus:border-emerald-500/50"
                  />
                </div>
              </div>

              <div className="flex gap-4 pt-4">
                <button
                  type="submit"
                  className="flex-1 bg-emerald-500 text-black py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-emerald-400 transition-all shadow-lg shadow-emerald-500/20"
                >
                  Commit
                </button>
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 bg-white/5 text-white py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-white/10 transition-all"
                >
                  Abort
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
