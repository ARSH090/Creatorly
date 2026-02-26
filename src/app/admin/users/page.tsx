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
        setUsers(data.users);
        setTotalPages(data.pagination.pages);
      }
    } catch (error) {
      console.error('Failed to fetch users', error);
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
    if (selectedUsers.length === users.length) {
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
    if (!confirm(`Are you sure you want to ${action} ${selectedUsers.length} selected users?`)) return;

    setActionLoading(true);
    try {
      const res = await fetch('/api/admin/users/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userIds: selectedUsers, action })
      });
      if (res.ok) {
        // toast.success(`Bulk ${action} successful`);
        fetchUsers();
        setSelectedUsers([]);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setActionLoading(false);
    }
  };

  const handleSingleAction = async (userId: string, action: string) => {
    if (!confirm(`Are you sure you want to ${action} this user?`)) return;

    setActionLoading(true);
    try {
      const endpoint = `/api/admin/users/${userId}/actions`;
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action })
      });
      if (res.ok) {
        fetchUsers();
      }
    } catch (error) {
      console.error(error);
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h1 className="text-4xl font-black text-white tracking-tighter italic uppercase flex items-center gap-4">
            <div className="w-3 h-10 bg-indigo-500 rounded-full shadow-[0_0_15px_rgba(99,102,241,0.3)]" />
            Entity Overseer
          </h1>
          <p className="text-[10px] font-black text-zinc-600 uppercase tracking-[0.3em] ml-7">Platform Population • Authorized Access Only</p>
        </div>
        <div className="flex gap-2">
          {selectedUsers.length > 0 && (
            <div className="flex gap-2 animate-in fade-in slide-in-from-top-1">
              <Button variant="ghost" className="bg-zinc-900 border border-white/5 text-zinc-400 hover:text-white uppercase font-black text-[10px] tracking-widest rounded-xl" onClick={() => handleBulkAction('suspend')} disabled={actionLoading}>Freeze ({selectedUsers.length})</Button>
              <Button variant="ghost" className="bg-zinc-900 border border-white/5 text-zinc-400 hover:text-white uppercase font-black text-[10px] tracking-widest rounded-xl" onClick={() => handleBulkAction('unsuspend')} disabled={actionLoading}>Verify</Button>
              <Button variant="destructive" className="uppercase font-black text-[10px] tracking-widest rounded-xl px-6" onClick={() => handleBulkAction('delete')} disabled={actionLoading}>Purge</Button>
            </div>
          )}
        </div>
      </div>

      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-sm group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-600 group-focus-within:text-indigo-500 transition-colors" />
          <Input
            placeholder="Search entities..."
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
            <SelectItem value="all">All Entities</SelectItem>
            <SelectItem value="active">Verified</SelectItem>
            <SelectItem value="suspended">Frozen</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="rounded-[2.5rem] border border-white/5 bg-zinc-900/40 overflow-hidden shadow-2xl backdrop-blur-sm">
        <Table>
          <TableHeader className="bg-white/[0.02]">
            <TableRow className="border-white/5 hover:bg-transparent">
              <TableHead className="w-12 px-8 py-6 border-b border-white/5">
                <input
                  type="checkbox"
                  className="rounded border-zinc-300 accent-indigo-500"
                  checked={users.length > 0 && selectedUsers.length === users.length}
                  onChange={toggleSelectAll}
                />
              </TableHead>
              <TableHead className="px-8 py-6 text-[10px] font-black text-zinc-500 uppercase tracking-widest border-b border-white/5">Entity</TableHead>
              <TableHead className="px-8 py-6 text-[10px] font-black text-zinc-500 uppercase tracking-widest border-b border-white/5">Role</TableHead>
              <TableHead className="px-8 py-6 text-[10px] font-black text-zinc-500 uppercase tracking-widest border-b border-white/5">Tier</TableHead>
              <TableHead className="px-8 py-6 text-[10px] font-black text-zinc-500 uppercase tracking-widest border-b border-white/5">Status</TableHead>
              <TableHead className="px-8 py-6 text-right text-[10px] font-black text-zinc-500 uppercase tracking-widest border-b border-white/5">Operations</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={6} className="h-24 text-center">
                  <Loader2 className="mx-auto h-6 w-6 animate-spin text-muted-foreground" />
                </TableCell>
              </TableRow>
            ) : users.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="h-24 text-center">
                  No users found.
                </TableCell>
              </TableRow>
            ) : (
              users.map((user) => (
                <TableRow key={user._id} className={cn("border-white/5 hover:bg-white/[0.02] transition-colors group", selectedUsers.includes(user._id) ? 'bg-white/[0.03]' : '')}>
                  <TableCell className="px-8 py-6">
                    <input
                      type="checkbox"
                      className="rounded border-zinc-300 accent-indigo-500"
                      checked={selectedUsers.includes(user._id)}
                      onChange={() => toggleSelectUser(user._id)}
                    />
                  </TableCell>
                  <TableCell className="px-8 py-6">
                    <div className="flex flex-col">
                      <span className="font-black text-sm text-white tracking-tight uppercase italic">{user.displayName}</span>
                      <span className="text-[10px] font-bold text-zinc-600 uppercase tracking-tighter">{user.email}</span>
                    </div>
                  </TableCell>
                  <TableCell className="px-8 py-6">
                    <Badge variant="outline" className="uppercase text-[9px] font-black tracking-widest border-white/10 text-zinc-400">{user.role}</Badge>
                  </TableCell>
                  <TableCell className="px-8 py-6 uppercase text-[10px] font-black text-zinc-500 tracking-widest">{user.plan}</TableCell>
                  <TableCell className="px-8 py-6">
                    {user.isSuspended ? (
                      <Badge variant="destructive" className="uppercase text-[9px] font-black tracking-widest">Frozen</Badge>
                    ) : (
                      <Badge variant="secondary" className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20 uppercase text-[9px] font-black tracking-widest">Verified</Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-right flex items-center justify-end gap-2">
                    {user.isSuspended ? (
                      <Button variant="ghost" size="sm" className="text-green-600 h-8 px-2" onClick={() => handleSingleAction(user._id, 'unsuspend')} disabled={actionLoading}>
                        Unsuspend
                      </Button>
                    ) : (
                      <Button variant="ghost" size="sm" className="text-rose-600 h-8 px-2" onClick={() => handleSingleAction(user._id, 'suspend')} disabled={actionLoading}>
                        Suspend
                      </Button>
                    )}
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0" asChild>
                      <Link href={`/admin/users/${user._id}`}>
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

      <div className="flex items-center justify-end space-x-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setPage((p) => Math.max(1, p - 1))}
          disabled={page === 1 || loading}
        >
          Previous
        </Button>
        <div className="text-sm text-muted-foreground">
          Page {page} of {totalPages}
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
          disabled={page === totalPages || loading}
        >
          Next
        </Button>
      </div>
    </div>
  );
}
