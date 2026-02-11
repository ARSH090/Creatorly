'use client';

import React, { useState, useEffect } from 'react';
import {
    Users, Search, Filter, MoreVertical,
    ShieldAlert, ShieldCheck, Wallet,
    ArrowUpRight, Mail, Calendar,
    ShieldOff, Loader2, AlertCircle
} from 'lucide-react';

export default function UserManagement() {
    const [users, setUsers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [filter, setFilter] = useState('all');
    const [actionLoading, setActionLoading] = useState<string | null>(null);

    const fetchUsers = async () => {
        try {
            setLoading(true);
            const res = await fetch(`/api/admin/users?search=${search}&role=${filter === 'all' ? '' : filter}`);
            const json = await res.json();
            setUsers(json.data || []);
        } catch (err) {
            console.error('Failed to fetch users:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        const timer = setTimeout(fetchUsers, 500);
        return () => clearTimeout(timer);
    }, [search, filter]);

    const handleAction = async (userId: string, action: string, reason: string = 'Administrative action') => {
        try {
            setActionLoading(userId);
            const res = await fetch(`/api/admin/users/${userId}/actions`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action, reason })
            });
            if (res.ok) {
                fetchUsers();
            }
        } catch (err) {
            console.error('Action failed:', err);
        } finally {
            setActionLoading(null);
        }
    };

    return (
        <div className="bg-zinc-900 rounded-[2.5rem] border border-white/10 shadow-2xl overflow-hidden">
            <div className="p-8 border-b border-white/5 space-y-6">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div>
                        <h2 className="text-xl font-black text-white flex items-center gap-3 uppercase tracking-tighter italic">
                            <div className="w-2 h-6 bg-indigo-500 rounded-full" />
                            Entity Oversight
                        </h2>
                        <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mt-1">Founders Command Center</p>
                    </div>

                    <div className="flex items-center gap-4">
                        <div className="relative group">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-600 group-focus-within:text-indigo-500 transition-colors" />
                            <input
                                type="text"
                                placeholder="Search email, username..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="bg-black/40 border border-white/5 rounded-2xl pl-12 pr-6 py-3 text-sm text-white focus:outline-none focus:border-indigo-500/50 transition-all w-64 placeholder:text-zinc-700 font-medium"
                            />
                        </div>
                        <select
                            value={filter}
                            onChange={(e) => setFilter(e.target.value)}
                            className="bg-black/40 border border-white/5 rounded-2xl px-6 py-3 text-sm text-white focus:outline-none focus:border-indigo-500/50 transition-all font-bold uppercase tracking-widest"
                        >
                            <option value="all">All Roles</option>
                            <option value="creator">Creators</option>
                            <option value="user">Users</option>
                            <option value="admin">Admins</option>
                        </select>
                    </div>
                </div>
            </div>

            <div className="overflow-x-auto">
                <table className="w-full text-left">
                    <thead>
                        <tr className="text-[10px] font-black text-zinc-600 uppercase tracking-[0.2em] border-b border-white/5 bg-white/[0.01]">
                            <th className="px-8 py-5">Entity</th>
                            <th className="px-8 py-5">Role & Status</th>
                            <th className="px-8 py-5">Financials</th>
                            <th className="px-8 py-5 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                        {loading ? (
                            <tr>
                                <td colSpan={4} className="py-20 text-center">
                                    <Loader2 className="w-8 h-8 text-indigo-500 animate-spin mx-auto mb-4" />
                                    <p className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Scanning Platform...</p>
                                </td>
                            </tr>
                        ) : users.length === 0 ? (
                            <tr>
                                <td colSpan={4} className="py-20 text-center">
                                    <AlertCircle className="w-8 h-8 text-zinc-700 mx-auto mb-4" />
                                    <p className="text-[10px] font-black uppercase tracking-widest text-zinc-500">No entities found</p>
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
                                            <p className="text-xs font-medium text-zinc-400">@{user.username}</p>
                                        </div>
                                    </div>
                                </td>
                                <td className="px-8 py-6">
                                    <div className="flex items-center gap-3">
                                        <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border ${user.role === 'admin' ? 'bg-rose-500/10 text-rose-400 border-rose-500/20' :
                                                user.role === 'creator' ? 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20' :
                                                    'bg-zinc-800 text-zinc-400 border-white/5'
                                            }`}>
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
                                    <div className="flex items-center gap-4">
                                        <div className={`flex items-center gap-2 ${user.payoutStatus === 'held' ? 'text-rose-400' : 'text-zinc-500'}`}>
                                            <Wallet size={14} />
                                            <span className="text-[10px] font-black uppercase tracking-widest">
                                                {user.payoutStatus === 'held' ? 'Payouts Held' : 'Payouts Enabled'}
                                            </span>
                                        </div>
                                    </div>
                                </td>
                                <td className="px-8 py-6 text-right">
                                    <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                        {user.isSuspended ? (
                                            <button
                                                onClick={() => handleAction(user._id, 'unfreeze')}
                                                disabled={actionLoading === user._id}
                                                className="px-4 py-2 bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-emerald-500 hover:text-white transition-all disabled:opacity-50"
                                            >
                                                Unfreeze
                                            </button>
                                        ) : (
                                            <button
                                                onClick={() => handleAction(user._id, 'freeze', 'Violated terms of service')}
                                                disabled={actionLoading === user._id}
                                                className="px-4 py-2 bg-rose-500/10 text-rose-500 border border-rose-500/20 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-rose-500 hover:text-white transition-all disabled:opacity-50"
                                            >
                                                Freeze Account
                                            </button>
                                        )}
                                        {user.payoutStatus === 'held' ? (
                                            <button
                                                onClick={() => handleAction(user._id, 'enable_payouts')}
                                                disabled={actionLoading === user._id}
                                                className="p-2 bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 rounded-xl hover:bg-indigo-500 hover:text-white transition-all disabled:opacity-50"
                                                title="Enable Payouts"
                                            >
                                                <Wallet size={16} />
                                            </button>
                                        ) : (
                                            <button
                                                onClick={() => handleAction(user._id, 'block_payouts', 'Unusual financial activity')}
                                                disabled={actionLoading === user._id}
                                                className="p-2 bg-amber-500/10 text-amber-500 border border-amber-500/20 rounded-xl hover:bg-amber-500 hover:text-white transition-all disabled:opacity-50"
                                                title="Hold Payouts"
                                            >
                                                <ShieldOff size={16} />
                                            </button>
                                        )}
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            <div className="p-8 bg-black/20 border-t border-white/5 flex items-center justify-between">
                <p className="text-[10px] font-black text-zinc-600 uppercase tracking-widest">
                    Live Surveillance Mode • SHA-256 Audit Trail Active
                </p>
                <div className="flex gap-2">
                    <button className="p-2 bg-white/5 border border-white/10 rounded-xl text-zinc-500 hover:text-white transition-all">
                        <Users size={16} />
                    </button>
                </div>
            </div>
        </div>
    );
}
