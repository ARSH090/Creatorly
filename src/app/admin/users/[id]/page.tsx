// @ts-nocheck
'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Loader2, AlertTriangle, Save, Ban, CheckCircle, DollarSign, ArrowLeft } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import Link from 'next/link';

export default function UserDetailPage() {
    const params = useParams();
    const router = useRouter();
    const [user, setUser] = useState<any>(null);
    const [stats, setStats] = useState<any>({ products: [], orders: [], payouts: [] });
    const [loading, setLoading] = useState(true);
    const [updating, setUpdating] = useState(false);

    // Edit state
    const [editForm, setEditForm] = useState({
        displayName: '',
        email: '',
        plan: '',
        role: ''
    });

    const fetchUser = async () => {
        try {
            const res = await fetch(`/api/admin/users/${params.id}`);
            if (res.ok) {
                const data = await res.json();
                setUser(data.user);
                setStats({
                    products: data.products,
                    orders: data.orders,
                    payouts: data.payouts
                });
                setEditForm({
                    displayName: data.user.displayName,
                    email: data.user.email,
                    plan: data.user.plan || 'free',
                    role: data.user.role || 'user'
                });
            } else {
                toast.error('Failed to load user');
            }
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchUser();
    }, [params.id]);

    const handleUpdate = async (e: React.FormEvent) => {
        e.preventDefault();
        setUpdating(true);
        try {
            const res = await fetch(`/api/admin/users/${params.id}`, {
                method: 'PUT',
                body: JSON.stringify(editForm),
                headers: { 'Content-Type': 'application/json' }
            });
            if (res.ok) {
                toast.success('User updated successfully');
                fetchUser();
            } else {
                toast.error('Update failed');
            }
        } catch (error) {
            toast.error('Error updating user');
        } finally {
            setUpdating(false);
        }
    };

    const handleAction = async (action: string) => {
        if (!confirm(`Are you sure you want to ${action} this user?`)) return;

        let endpoint = '';
        if (action === 'suspend') endpoint = 'suspend';
        if (action === 'unsuspend') endpoint = 'unsuspend';
        if (action === 'freeze_payout') endpoint = 'freeze-payout';
        if (action === 'unfreeze_payout') endpoint = 'unfreeze-payout';

        try {
            const res = await fetch(`/api/admin/users/${params.id}/${endpoint}`, {
                method: 'POST'
            });
            if (res.ok) {
                toast.success(`Action ${action} successful`);
                fetchUser();
            } else {
                toast.error('Action failed');
            }
        } catch (error) {
            toast.error('Error performing action');
        }
    };

    if (loading) return <div className="p-8"><Loader2 className="animate-spin h-8 w-8" /></div>;
    if (!user) return <div className="p-8">User not found</div>;

    return (
        <div className="space-y-8">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-6">
                    <Link href="/admin/users">
                        <Button variant="ghost" size="sm" className="bg-zinc-900 border border-white/5 h-12 w-12 rounded-2xl text-zinc-400 hover:text-white transition-all">
                            <ArrowLeft className="h-5 w-5 text-zinc-500" />
                        </Button>
                    </Link>
                    <div className="space-y-1">
                        <h1 className="text-4xl font-black text-white tracking-tighter italic uppercase flex items-center gap-4">
                            <div className="w-3 h-10 bg-indigo-500 rounded-full shadow-[0_0_15px_rgba(99,102,241,0.3)]" />
                            Entity Briefing
                        </h1>
                        <p className="text-[10px] font-black text-zinc-600 uppercase tracking-[0.3em] ml-7">Registry: {user._id}</p>
                    </div>
                </div>
                <div className="flex gap-4">
                    {user.isSuspended ? (
                        <Button variant="ghost" className="bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 uppercase font-black text-[10px] tracking-widest rounded-xl px-6 h-12 hover:bg-emerald-500 hover:text-white transition-all shadow-lg shadow-emerald-500/10" onClick={() => handleAction('unsuspend')}>
                            <CheckCircle className="mr-2 h-4 w-4" /> Restore Access
                        </Button>
                    ) : (
                        <Button variant="ghost" className="bg-rose-500/10 text-rose-500 border border-rose-500/20 uppercase font-black text-[10px] tracking-widest rounded-xl px-6 h-12 hover:bg-rose-500 hover:text-white transition-all shadow-lg shadow-rose-500/10" onClick={() => handleAction('suspend')}>
                            <Ban className="mr-2 h-4 w-4" /> Revoke Access
                        </Button>
                    )}
                </div>
            </div>

            <div className="grid gap-8 md:grid-cols-2">
                <Card className="bg-zinc-900/40 border-white/5 rounded-[2.5rem] shadow-2xl backdrop-blur-sm overflow-hidden">
                    <CardHeader className="bg-white/[0.02] px-10 py-8 border-b border-white/5">
                        <CardTitle className="text-xl font-black text-white uppercase tracking-tighter italic flex items-center gap-3">
                            <div className="w-2 h-6 bg-indigo-500 rounded-full" />
                            Core Identity
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="px-10 py-8">
                        <form onSubmit={handleUpdate} className="space-y-6">
                            <div className="grid gap-3">
                                <Label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-1">Designation</Label>
                                <Input
                                    className="bg-black/40 border-white/5 rounded-2xl h-14 text-white placeholder:text-zinc-700 focus:border-indigo-500/50 transition-all font-black uppercase tracking-tight italic"
                                    value={editForm.displayName}
                                    onChange={(e) => setEditForm({ ...editForm, displayName: e.target.value })}
                                />
                            </div>
                            <div className="grid gap-3">
                                <Label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-1">Communication Channel</Label>
                                <Input
                                    className="bg-black/40 border-white/5 rounded-2xl h-14 text-white placeholder:text-zinc-700 focus:border-indigo-500/50 transition-all font-bold"
                                    value={editForm.email}
                                    onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-6">
                                <div className="grid gap-3">
                                    <Label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-1">Access Tier</Label>
                                    <Select value={editForm.plan} onValueChange={(v) => setEditForm({ ...editForm, plan: v })}>
                                        <SelectTrigger className="bg-black/40 border-white/5 rounded-2xl h-14 text-white font-black uppercase tracking-widest text-[10px]">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent className="bg-zinc-900 border-white/10 text-white">
                                            <SelectItem value="free" className="uppercase font-black text-[10px] tracking-widest">Base</SelectItem>
                                            <SelectItem value="creator" className="uppercase font-black text-[10px] tracking-widest">Creator</SelectItem>
                                            <SelectItem value="creator_pro" className="uppercase font-black text-[10px] tracking-widest">Elite</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="grid gap-3">
                                    <Label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-1">System Role</Label>
                                    <Select value={editForm.role} onValueChange={(v) => setEditForm({ ...editForm, role: v })}>
                                        <SelectTrigger className="bg-black/40 border-white/5 rounded-2xl h-14 text-white font-black uppercase tracking-widest text-[10px]">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent className="bg-zinc-900 border-white/10 text-white">
                                            <SelectItem value="user" className="uppercase font-black text-[10px] tracking-widest">Operator</SelectItem>
                                            <SelectItem value="creator" className="uppercase font-black text-[10px] tracking-widest">Architect</SelectItem>
                                            <SelectItem value="admin" className="uppercase font-black text-[10px] tracking-widest">Overseer</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                            <Button type="submit" disabled={updating} className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-black uppercase tracking-[0.2em] h-14 rounded-2xl shadow-xl shadow-indigo-500/20 transition-all">
                                {updating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Overwrite Protocol
                            </Button>
                        </form>
                    </CardContent>
                </Card>

                <div className="space-y-8">
                    <Card className="bg-zinc-900/40 border-white/5 rounded-[2.5rem] shadow-2xl backdrop-blur-sm overflow-hidden">
                        <CardHeader className="bg-white/[0.02] px-10 py-8 border-b border-white/5">
                            <CardTitle className="text-xl font-black text-white uppercase tracking-tighter italic flex items-center gap-3">
                                <div className="w-2 h-6 bg-amber-500 rounded-full" />
                                Status & Governance
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="px-10 py-8 space-y-6">
                            <div className="flex justify-between items-center border-b border-white/5 pb-4">
                                <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Vitals Status</span>
                                {user.isSuspended ? (
                                    <Badge variant="destructive" className="uppercase text-[9px] font-black tracking-widest">Terminated</Badge>
                                ) : (
                                    <Badge variant="secondary" className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20 uppercase text-[9px] font-black tracking-widest">Verified</Badge>
                                )}
                            </div>
                            <div className="flex justify-between items-center border-b border-white/5 pb-4">
                                <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Financial Clearance</span>
                                <div className="flex items-center gap-3">
                                    <span className="font-black text-[10px] uppercase text-zinc-300 tracking-widest italic">{user.payoutStatus}</span>
                                    {user.payoutStatus === 'held' ? (
                                        <Button size="sm" variant="ghost" className="bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 uppercase font-black text-[9px] tracking-widest rounded-lg h-8 px-4" onClick={() => handleAction('unfreeze_payout')}>Release</Button>
                                    ) : (
                                        <Button size="sm" variant="ghost" className="bg-rose-500/10 text-rose-500 border border-rose-500/20 uppercase font-black text-[9px] tracking-widest rounded-lg h-8 px-4" onClick={() => handleAction('freeze_payout')}>Intercept</Button>
                                    )}
                                </div>
                            </div>
                            <div className="flex justify-between items-center border-b border-white/5 pb-4">
                                <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Registry Date</span>
                                <span className="text-xs font-bold text-zinc-400 uppercase tracking-tight italic font-mono">{format(new Date(user.createdAt), 'PP')}</span>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="bg-zinc-900/40 border-white/5 rounded-[2.5rem] shadow-2xl backdrop-blur-sm overflow-hidden">
                        <CardHeader className="bg-white/[0.02] px-10 py-8 border-b border-white/5">
                            <CardTitle className="text-xl font-black text-white uppercase tracking-tighter italic flex items-center gap-3">
                                <div className="w-2 h-6 bg-indigo-500 rounded-full" />
                                Action Logs
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="px-10 py-8">
                            <Tabs defaultValue="orders" className="w-full">
                                <TabsList className="w-full bg-black/40 border border-white/5 rounded-2xl p-1 mb-6">
                                    <TabsTrigger value="orders" className="flex-1 rounded-xl data-[state=active]:bg-zinc-800 text-[10px] font-black uppercase tracking-widest">Orders</TabsTrigger>
                                    <TabsTrigger value="products" className="flex-1 rounded-xl data-[state=active]:bg-zinc-800 text-[10px] font-black uppercase tracking-widest">Assets</TabsTrigger>
                                    <TabsTrigger value="payouts" className="flex-1 rounded-xl data-[state=active]:bg-zinc-800 text-[10px] font-black uppercase tracking-widest">Ledger</TabsTrigger>
                                </TabsList>
                                <TabsContent value="orders">
                                    {stats.orders.length === 0 ? <p className="text-[10px] font-black text-zinc-600 uppercase tracking-widest py-4 text-center">No trace detected</p> : (
                                        <ul className="space-y-4">
                                            {stats.orders.map((o: any) => (
                                                <li key={o._id} className="flex justify-between items-center bg-black/20 p-4 rounded-xl border border-white/5">
                                                    <span className="font-mono text-[10px] text-zinc-500 font-black">#{o._id.substring(0, 10)}</span>
                                                    <span className="font-black text-sm text-white italic">₹{o.total}</span>
                                                </li>
                                            ))}
                                        </ul>
                                    )}
                                </TabsContent>
                                <TabsContent value="products">
                                    {stats.products.length === 0 ? <p className="text-[10px] font-black text-zinc-600 uppercase tracking-widest py-4 text-center">No assets registered</p> : (
                                        <ul className="space-y-4">
                                            {stats.products.map((p: any) => (
                                                <li key={p._id} className="flex justify-between items-center bg-black/20 p-4 rounded-xl border border-white/5">
                                                    <span className="text-[10px] font-black text-white uppercase tracking-tight italic truncate max-w-[150px]">{p.title}</span>
                                                    <Badge variant={p.status === 'active' ? 'secondary' : 'outline'} className="uppercase text-[8px] font-black tracking-widest">{p.status}</Badge>
                                                </li>
                                            ))}
                                        </ul>
                                    )}
                                </TabsContent>
                                <TabsContent value="payouts">
                                    {stats.payouts.length === 0 ? <p className="text-[10px] font-black text-zinc-600 uppercase tracking-widest py-4 text-center">Zero settlements</p> : (
                                        <ul className="space-y-4">
                                            {stats.payouts.map((p: any) => (
                                                <li key={p._id} className="flex justify-between items-center bg-black/20 p-4 rounded-xl border border-white/5">
                                                    <span className="font-mono text-[10px] text-zinc-500 font-black uppercase">{format(new Date(p.createdAt), 'MMM d')}</span>
                                                    <span className={cn("font-black text-sm italic", p.status === 'paid' ? 'text-emerald-500' : 'text-amber-500')}>₹{p.amount}</span>
                                                </li>
                                            ))}
                                        </ul>
                                    )}
                                </TabsContent>
                            </Tabs>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
