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
import { Loader2, AlertTriangle, Save, Ban, CheckCircle, DollarSign } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { format } from 'date-fns';

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
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">{user.displayName}</h1>
                    <p className="text-muted-foreground">ID: {user._id}</p>
                </div>
                <div className="flex gap-2">
                    {user.isSuspended ? (
                        <Button variant="outline" className="border-green-500 text-green-600 hover:text-green-700" onClick={() => handleAction('unsuspend')}>
                            <CheckCircle className="mr-2 h-4 w-4" /> Unsuspend User
                        </Button>
                    ) : (
                        <Button variant="destructive" onClick={() => handleAction('suspend')}>
                            <Ban className="mr-2 h-4 w-4" /> Suspend User
                        </Button>
                    )}
                </div>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
                <Card>
                    <CardHeader>
                        <CardTitle>Profile Details</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleUpdate} className="space-y-4">
                            <div className="grid gap-2">
                                <Label>Display Name</Label>
                                <Input
                                    value={editForm.displayName}
                                    onChange={(e) => setEditForm({ ...editForm, displayName: e.target.value })}
                                />
                            </div>
                            <div className="grid gap-2">
                                <Label>Email</Label>
                                <Input
                                    value={editForm.email}
                                    onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="grid gap-2">
                                    <Label>Plan</Label>
                                    <Select value={editForm.plan} onValueChange={(v) => setEditForm({ ...editForm, plan: v })}>
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="free">Free</SelectItem>
                                            <SelectItem value="creator">Creator</SelectItem>
                                            <SelectItem value="creator_pro">Creator Pro</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="grid gap-2">
                                    <Label>Role</Label>
                                    <Select value={editForm.role} onValueChange={(v) => setEditForm({ ...editForm, role: v })}>
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="user">User</SelectItem>
                                            <SelectItem value="creator">Creator</SelectItem>
                                            <SelectItem value="admin">Admin</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                            <Button type="submit" disabled={updating}>
                                {updating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Save Changes
                            </Button>
                        </form>
                    </CardContent>
                </Card>

                <div className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Status & Governance</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex justify-between items-center border-b pb-2">
                                <span className="font-medium">Account Status</span>
                                {user.isSuspended ? (
                                    <Badge variant="destructive">Suspended</Badge>
                                ) : (
                                    <Badge variant="secondary" className="bg-green-100 text-green-800">Active</Badge>
                                )}
                            </div>
                            <div className="flex justify-between items-center border-b pb-2">
                                <span className="font-medium">Payout Status</span>
                                <div className="flex items-center gap-2">
                                    <span className="capitalize text-sm">{user.payoutStatus}</span>
                                    {user.payoutStatus === 'held' ? (
                                        <Button size="sm" variant="outline" onClick={() => handleAction('unfreeze_payout')}>Unfreeze</Button>
                                    ) : (
                                        <Button size="sm" variant="outline" className="text-red-500" onClick={() => handleAction('freeze_payout')}>Freeze</Button>
                                    )}
                                </div>
                            </div>
                            <div className="flex justify-between items-center border-b pb-2">
                                <span className="font-medium">Joined</span>
                                <span className="text-sm text-muted-foreground">{format(new Date(user.createdAt), 'PP')}</span>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>Recent Activity</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <Tabs defaultValue="orders">
                                <TabsList className="w-full">
                                    <TabsTrigger value="orders" className="flex-1">Orders</TabsTrigger>
                                    <TabsTrigger value="products" className="flex-1">Products</TabsTrigger>
                                    <TabsTrigger value="payouts" className="flex-1">Payouts</TabsTrigger>
                                </TabsList>
                                <TabsContent value="orders">
                                    {stats.orders.length === 0 ? <p className="text-sm text-muted-foreground py-4">No recent orders.</p> : (
                                        <ul className="space-y-2 text-sm mt-2">
                                            {stats.orders.map((o: any) => (
                                                <li key={o._id} className="flex justify-between">
                                                    <span>Order #{o._id.substring(0, 6)}</span>
                                                    <span>₹{o.total}</span>
                                                </li>
                                            ))}
                                        </ul>
                                    )}
                                </TabsContent>
                                <TabsContent value="products">
                                    {stats.products.length === 0 ? <p className="text-sm text-muted-foreground py-4">No products.</p> : (
                                        <ul className="space-y-2 text-sm mt-2">
                                            {stats.products.map((p: any) => (
                                                <li key={p._id} className="flex justify-between">
                                                    <span className="truncate max-w-[200px]">{p.title}</span>
                                                    <Badge variant={p.status === 'active' ? 'default' : 'secondary'}>{p.status}</Badge>
                                                </li>
                                            ))}
                                        </ul>
                                    )}
                                </TabsContent>
                                <TabsContent value="payouts">
                                    {stats.payouts.length === 0 ? <p className="text-sm text-muted-foreground py-4">No payouts found.</p> : (
                                        <ul className="space-y-2 text-sm mt-2">
                                            {stats.payouts.map((p: any) => (
                                                <li key={p._id} className="flex justify-between">
                                                    <span>{format(new Date(p.createdAt), 'MMM d')}</span>
                                                    <span className={p.status === 'paid' ? 'text-green-600' : 'text-orange-500'}>₹{p.amount}</span>
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
