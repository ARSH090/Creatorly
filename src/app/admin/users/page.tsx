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
      const endpoint = `/api/admin/users/${userId}/${action}`;
      const res = await fetch(endpoint, { method: 'POST' });
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
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Users</h1>
        <div className="flex gap-2">
          {selectedUsers.length > 0 && (
            <div className="flex gap-2 animate-in fade-in slide-in-from-top-1">
              <Button variant="outline" size="sm" onClick={() => handleBulkAction('suspend')} disabled={actionLoading}>Suspend ({selectedUsers.length})</Button>
              <Button variant="outline" size="sm" onClick={() => handleBulkAction('unsuspend')} disabled={actionLoading}>Unsuspend</Button>
              <Button variant="destructive" size="sm" onClick={() => handleBulkAction('delete')} disabled={actionLoading}>Delete</Button>
            </div>
          )}
        </div>
      </div>

      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search users..."
            className="pl-8"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Select value={status} onValueChange={setStatus}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="suspended">Suspended</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="rounded-md border bg-white">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12">
                <input
                  type="checkbox"
                  className="rounded border-zinc-300"
                  checked={users.length > 0 && selectedUsers.length === users.length}
                  onChange={toggleSelectAll}
                />
              </TableHead>
              <TableHead>User</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Plan</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
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
                <TableRow key={user._id} className={selectedUsers.includes(user._id) ? 'bg-zinc-50' : ''}>
                  <TableCell>
                    <input
                      type="checkbox"
                      className="rounded border-zinc-300"
                      checked={selectedUsers.includes(user._id)}
                      onChange={() => toggleSelectUser(user._id)}
                    />
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="font-medium">{user.displayName}</span>
                      <span className="text-sm text-muted-foreground">{user.email}</span>
                    </div>
                  </TableCell>
                  <TableCell className="capitalize">
                    <Badge variant="outline">{user.role}</Badge>
                  </TableCell>
                  <TableCell className="capitalize">{user.plan}</TableCell>
                  <TableCell>
                    {user.isSuspended ? (
                      <Badge variant="destructive">Suspended</Badge>
                    ) : (
                      <Badge variant="secondary" className="bg-green-100 text-green-800 hover:bg-green-100">Active</Badge>
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
