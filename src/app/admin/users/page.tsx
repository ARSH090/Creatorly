/* eslint-disable react-hooks/exhaustive-deps, react/no-unescaped-entities, @next/next/no-img-element, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars, prefer-const, import/no-anonymous-default-export */
﻿'use client';

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
import { Search, Eye, Users as UsersIcon, ShieldAlert, UserPlus } from 'lucide-react';
import { format } from 'date-fns';
import { TableSkeleton } from '@/components/ui/skeleton-loaders';
import { EmptyState } from '@/components/ui/empty-state';
import { toast } from 'react-hot-toast';
import { cn } from '@/lib/utils';

export default function UsersPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('all');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [actionLoading, setActionLoading] = useState(false);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '10',
        search,
        status
      });
      const res = await fetch(`/api/admin/users?${params}`);
      if (res.ok) {
        const data = await res.json();
        setUsers(data.users || []);
        setTotalPages(data.pagination?.pages || 1);
      } else {
        throw new Error('Signal lost');
      }
    } catch (error) {
      toast.error('Failed to sync with user database');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const debounce = setTimeout(() => {
      fetchUsers();
    }, 500);
    return () => clearTimeout(debounce);
  }, [search, status, page]);

  const toggleSelectAll = () => {
    if (selectedUsers.length === users.length && users.length > 0) {
      setSelectedUsers([]);
    } else {
      setSelectedUsers(users.map((u) => u._id));
    }
  };

  const toggleSelectUser = (userId: string) => {
    setSelectedUsers((prev) =>
      prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId]
    );
  };

  const handleBulkAction = async (action: string) => {
    if (!confirm(`Confirm protocol: ${action.toUpperCase()} ${selectedUsers.length} units?`)) return;

    setActionLoading(true);
    try {
      const res = await fetch('/api/admin/users/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userIds: selectedUsers, action })
      });
      if (res.ok) {
        toast.success(`Bulk ${action} successful`);
        fetchUsers();
        setSelectedUsers([]);
      } else {
        throw new Error('Protocol failure');
      }
    } catch (error) {
      toast.error(`Strategic action failed: ${action}`);
    } finally {
      setActionLoading(false);
    }
  };

  const handleSingleAction = async (userId: string, action: string) => {
    if (!confirm(`Confirm unit protocol: ${action.toUpperCase()}?`)) return;

    setActionLoading(true);
    try {
      const endpoint = `/api/admin/users/${userId}/${action}`;
      const res = await fetch(endpoint, { method: 'POST' });
      if (res.ok) {
        toast.success(`User ${action}ed`);
        fetchUsers();
      } else {
        throw new Error('Signal interference');
      }
    } catch (error) {
      toast.error(`Action failed: ${action}`);
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-12 pb-24 animate-in fade-in duration-700">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-black text-white italic uppercase tracking-tighter flex items-center gap-4">
            <UsersIcon className="w-10 h-10 text-indigo-500 shadow-[0_0_20px_rgba(99,102,241,0.4)]" />
            USER DIRECTORY
          </h1>
          <p className="text-[10px] font-black text-zinc-600 uppercase tracking-[0.4em] mt-2 ml-14">
            Identity Management • Access Control
          </p>
        </div>
        <div className="flex gap-4">
          {selectedUsers.length > 0 && (
            <div className="flex gap-2 animate-in slide-in-from-right-4 fade-in">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleBulkAction('suspend')}
                disabled={actionLoading}
                className="bg-zinc-900 border-rose-500/20 text-rose-500 h-12 px-6 rounded-2xl font-black uppercase text-[10px] tracking-widest hover:bg-rose-500/10"
              >
                Suspend ({selectedUsers.length})
              </Button>
              <Button
                variant="destructive"
                size="sm"
                onClick={() => handleBulkAction('delete')}
                disabled={actionLoading}
                className="bg-rose-600 h-12 px-6 rounded-2xl font-black uppercase text-[10px] tracking-widest"
              >
                Delete Units
              </Button>
            </div>
          )}
        </div>
      </header>

      <div className="flex flex-col md:flex-row items-center gap-6">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
          <Input
            placeholder="SEARCH ENCRYPTED IDENTITIES..."
            className="pl-12 bg-zinc-900/40 border-white/5 h-14 rounded-2xl text-white font-black uppercase text-xs tracking-widest focus:ring-indigo-500/20"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Select value={status} onValueChange={setStatus}>
          <SelectTrigger className="w-full md:w-[240px] bg-zinc-900/40 border-white/5 h-14 rounded-2xl text-zinc-400 font-black uppercase text-[10px] tracking-[0.2em]">
            <SelectValue placeholder="STATUS FILTER" />
          </SelectTrigger>
          <SelectContent className="bg-zinc-900 border-white/10 rounded-2xl overflow-hidden">
            <SelectItem value="all" className="text-[10px] font-black uppercase tracking-widest text-zinc-400 focus:text-white">All Identities</SelectItem>
            <SelectItem value="active" className="text-[10px] font-black uppercase tracking-widest text-zinc-400 focus:text-white">Active Clearance</SelectItem>
            <SelectItem value="suspended" className="text-[10px] font-black uppercase tracking-widest text-zinc-400 focus:text-white">Blacklisted</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="rounded-[3rem] border border-white/5 bg-zinc-900/40 backdrop-blur-xl overflow-hidden min-h-[400px]">
        <Table>
          <TableHeader className="bg-white/5">
            <TableRow className="border-b-white/5 hover:bg-transparent">
              <TableHead className="w-16 text-center">
                <input
                  type="checkbox"
                  className="rounded border-white/10 bg-black/40 text-indigo-500 focus:ring-indigo-500/20"
                  checked={users.length > 0 && selectedUsers.length === users.length}
                  onChange={toggleSelectAll}
                />
              </TableHead>
              <TableHead className="text-[10px] font-black text-zinc-500 uppercase tracking-widest py-6">Identity</TableHead>
              <TableHead className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Role</TableHead>
              <TableHead className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Tier</TableHead>
              <TableHead className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Status</TableHead>
              <TableHead className="text-[10px] font-black text-zinc-500 uppercase tracking-widest text-right pr-8">Control</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={6} className="p-8">
                  <TableSkeleton rows={5} />
                </TableCell>
              </TableRow>
            ) : users.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="p-0">
                  <EmptyState
                    icon={ShieldAlert}
                    title="No Units Found"
                    description="The search parameters yielded zero matches in the encrypted database."
                    actionLabel="Reset Link"
                    onAction={() => { setSearch(''); setStatus('all'); }}
                    className="border-none bg-transparent"
                  />
                </TableCell>
              </TableRow>
            ) : (
              users.map((user) => (
                <TableRow key={user._id} className={cn("border-b-white/5 transition-colors hover:bg-white/[0.02]", selectedUsers.includes(user._id) ? 'bg-white/[0.03]' : '')}>
                  <TableCell className="text-center">
                    <input
                      type="checkbox"
                      className="rounded border-white/10 bg-black/40 text-indigo-500 focus:ring-indigo-500/20"
                      checked={selectedUsers.includes(user._id)}
                      onChange={() => toggleSelectUser(user._id)}
                    />
                  </TableCell>
                  <TableCell className="py-6">
                    <div className="flex flex-col">
                      <span className="text-sm font-black text-white italic tracking-tight">{user.displayName || 'ANONYMOUS UNIT'}</span>
                      <span className="text-[9px] font-bold text-zinc-600 uppercase tracking-widest">{user.email}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="bg-zinc-800/40 border-white/5 text-[9px] font-black uppercase tracking-widest px-3 py-1 rounded-lg text-zinc-400">
                      {user.role}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-[10px] font-black text-zinc-300 uppercase tracking-widest italic">{user.plan || 'Free'}</TableCell>
                  <TableCell>
                    {user.isSuspended ? (
                      <span className="inline-flex items-center px-3 py-1 rounded-full border border-rose-500/20 bg-rose-500/10 text-rose-500 text-[9px] font-black uppercase tracking-widest shadow-[0_0_10px_rgba(244,63,94,0.1)]">
                        Blacklisted
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-3 py-1 rounded-full border border-emerald-500/20 bg-emerald-500/10 text-emerald-400 text-[9px] font-black uppercase tracking-widest shadow-[0_0_10px_rgba(16,185,129,0.1)]">
                        Clearance
                      </span>
                    )}
                  </TableCell>
                  <TableCell className="text-right pr-8">
                    <div className="flex items-center justify-end gap-3">
                      {user.isSuspended ? (
                        <Button variant="ghost" size="sm" onClick={() => handleSingleAction(user._id, 'unsuspend')} disabled={actionLoading} className="text-emerald-500 hover:bg-emerald-500/10 font-black uppercase text-[9px] tracking-widest h-9 px-4 rounded-xl transition-all">
                          Restore
                        </Button>
                      ) : (
                        <Button variant="ghost" size="sm" onClick={() => handleSingleAction(user._id, 'suspend')} disabled={actionLoading} className="text-rose-500 hover:bg-rose-500/10 font-black uppercase text-[9px] tracking-widest h-9 px-4 rounded-xl transition-all">
                          Suspend
                        </Button>
                      )}
                      <Button variant="ghost" size="sm" asChild className="h-9 w-9 bg-white/5 hover:bg-white/10 text-white rounded-xl p-0">
                        <Link href={`/admin/users/${user._id}`}>
                          <Eye className="h-4 w-4" />
                        </Link>
                      </Button>
                    </div>
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
            Identity Batch {page} <span className="text-white mx-1 text-xs">/</span> {totalPages}
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
