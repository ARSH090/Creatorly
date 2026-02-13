'use client';

import React, { useState, useEffect } from 'react';
import {
  Users, Search, Filter, Edit, Trash2,
  ShieldAlert, ShieldCheck, Wallet,
  MoreVertical, Loader2, AlertCircle,
  Mail, Calendar, Crown, User as UserIcon,
  ChevronLeft, ChevronRight, Ban
} from 'lucide-react';

interface UserStats {
  products: number;
  revenue: number;
  orders: number;
}

interface User {
  _id: string;
  email: string;
  displayName: string;
  username: string;
  role: 'user' | 'creator' | 'admin' | 'super-admin';
  plan: string;
  isSuspended: boolean;
  payoutStatus: string;
  createdAt: string;
  stats: UserStats;
}

export function UsersManagement() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '20',
        ...(search && { search }),
        ...(roleFilter !== 'all' && { role: roleFilter }),
        ...(statusFilter !== 'all' && { status: statusFilter }),
      });

      const res = await fetch(`/api/admin/users?${params}`);
      const json = await res.json();
      if (json.success) {
        setUsers(json.data.users);
        setTotalPages(json.data.pagination.pages);
      }
    } catch (err) {
      console.error('Failed to fetch users:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(fetchUsers, 500);
    return () => clearTimeout(timer);
  }, [search, roleFilter, statusFilter, page]);

  const handleUpdateStatus = async (userId: string, action: 'freeze' | 'unfreeze' | 'block_payouts' | 'enable_payouts') => {
    // Implementation for status updates if needed via /api/admin/users/[id]/actions or similar
    // For now, let's assume standard PUT to /api/admin/users/[id]
    try {
      setActionLoading(userId);
      const updates: any = {};
      if (action === 'freeze') updates.isSuspended = true;
      if (action === 'unfreeze') updates.isSuspended = false;

      const res = await fetch(`/api/admin/users/${userId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates)
      });

      if (res.ok) fetchUsers();
    } catch (error) {
      console.error('Update failed:', error);
    } finally {
      setActionLoading(null);
    }
  };

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'admin':
      case 'super-admin': return 'bg-rose-500/10 text-rose-400 border-rose-500/20';
      case 'creator': return 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20';
      default: return 'bg-zinc-800 text-zinc-400 border-white/5';
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Header Area */}
      <div className="bg-zinc-900 rounded-3xl lg:rounded-[2.5rem] border border-white/10 shadow-2xl overflow-hidden">
        <div className="p-4 lg:p-8 border-b border-white/5 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div>
            <h2 className="text-xl font-black text-white flex items-center gap-3 uppercase tracking-tighter italic">
              <div className="w-2 h-6 bg-indigo-500 rounded-full" />
              Entity Oversight
            </h2>
            <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mt-1">Platform Population Registry</p>
          </div>

          <div className="flex flex-wrap items-center gap-4">
            <div className="relative group w-full lg:w-auto">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-600 group-focus-within:text-indigo-500 transition-colors" />
              <input
                type="text"
                placeholder="Search entities..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="bg-black/40 border border-white/5 rounded-2xl pl-12 pr-6 py-3 text-sm text-white focus:outline-none focus:border-indigo-500/50 transition-all w-full lg:w-64 placeholder:text-zinc-700 font-medium"
              />
            </div>

            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="bg-black/40 border border-white/5 rounded-2xl px-6 py-2 text-[10px] font-black uppercase text-white tracking-widest outline-none focus:border-indigo-500/50"
            >
              <option value="all">All Roles</option>
              <option value="creator">Creators</option>
              <option value="user">Users</option>
              <option value="admin">Admins</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left whitespace-nowrap">
            <thead>
              <tr className="text-[10px] font-black text-zinc-600 uppercase tracking-[0.2em] border-b border-white/5 bg-white/[0.01]">
                <th className="px-8 py-5">Entity profile</th>
                <th className="px-8 py-5">Role & status</th>
                <th className="px-8 py-5">Performance metrics</th>
                <th className="px-8 py-5 text-right">Goverance</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {loading ? (
                <tr>
                  <td colSpan={4} className="py-20 text-center">
                    <Loader2 className="w-8 h-8 text-indigo-500 animate-spin mx-auto mb-4" />
                    <p className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Querying platform database...</p>
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={4} className="py-20 text-center">
                    <AlertCircle className="w-8 h-8 text-zinc-700 mx-auto mb-4" />
                    <p className="text-[10px] font-black uppercase tracking-widest text-zinc-500">No entities detected</p>
                  </td>
                </tr>
              ) : users.map((user) => (
                <tr key={user._id} className="hover:bg-white/[0.02] transition-colors group">
                  <td className="px-8 py-6">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 flex items-center justify-center font-black text-indigo-500 border border-indigo-500/20 group-hover:scale-110 transition-transform">
                        {user.displayName?.charAt(0) || 'U'}
                      </div>
                      <div>
                        <p className="font-black text-white text-sm tracking-tight group-hover:text-indigo-300 transition-colors uppercase italic">{user.displayName}</p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <Mail size={10} className="text-zinc-600" />
                          <p className="text-[10px] font-medium text-zinc-500 lowercase">{user.email}</p>
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    <div className="flex items-center gap-3">
                      <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border ${getRoleBadge(user.role)}`}>
                        {user.role}
                      </span>
                      {user.isSuspended ? (
                        <span className="flex items-center gap-1.5 text-rose-500 text-[10px] font-black uppercase tracking-widest">
                          <ShieldAlert size={12} />
                          Frozen
                        </span>
                      ) : (
                        <span className="flex items-center gap-1.5 text-emerald-500 text-[10px] font-black uppercase tracking-widest">
                          <ShieldCheck size={12} />
                          Verified
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    <div className="flex items-center gap-6">
                      <div>
                        <p className="text-[10px] font-black text-white italic tracking-tighter">₹{(user.stats?.revenue || 0).toLocaleString()}</p>
                        <p className="text-[8px] font-bold text-zinc-600 uppercase tracking-widest">Revenue</p>
                      </div>
                      <div>
                        <p className="text-[10px] font-black text-white italic tracking-tighter">{user.stats?.orders || 0}</p>
                        <p className="text-[8px] font-bold text-zinc-600 uppercase tracking-widest">Orders</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-8 py-6 text-right">
                    <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      {user.isSuspended ? (
                        <button
                          onClick={() => handleUpdateStatus(user._id, 'unfreeze')}
                          disabled={actionLoading === user._id}
                          className="px-4 py-2 bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-emerald-500 hover:text-white transition-all disabled:opacity-50"
                        >
                          Unfreeze
                        </button>
                      ) : (
                        <button
                          onClick={() => handleUpdateStatus(user._id, 'freeze')}
                          disabled={actionLoading === user._id}
                          className="px-4 py-2 bg-rose-500/10 text-rose-500 border border-rose-500/20 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-rose-500 hover:text-white transition-all disabled:opacity-50"
                        >
                          Freeze
                        </button>
                      )}
                      <button className="p-2 bg-white/5 border border-white/10 rounded-xl text-zinc-500 hover:text-white transition-all">
                        <Edit size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="p-8 bg-black/20 border-t border-white/5 flex items-center justify-between">
          <p className="text-[10px] font-black text-zinc-600 uppercase tracking-widest">
            Network Status: STABLE • End-to-End Encryption Enabled
          </p>
          <div className="flex items-center gap-4">
            <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Page {page} of {totalPages}</span>
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
