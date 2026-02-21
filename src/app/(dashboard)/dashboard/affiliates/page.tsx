'use client';

import { useEffect, useState } from 'react';
import { AffiliateInviteModal } from '@/components/dashboard/affiliate-invite-modal';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { format } from 'date-fns';
import { Loader2, Users, DollarSign, Percent, Copy, Check } from 'lucide-react';
import { toast } from 'react-hot-toast';

export default function AffiliatePage() {
    const [loading, setLoading] = useState(true);
    const [affiliates, setAffiliates] = useState<any[]>([]);

    const fetchAffiliates = async () => {
        try {
            const res = await fetch('/api/creator/affiliates');
            const json = await res.json();
            if (res.ok) setAffiliates(json);
        } catch (error) {
            console.error('Failed to fetch affiliates:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchAffiliates();
    }, []);

    const copyLink = (code: string) => {
        const url = `${window.location.origin}?ref=${code}`;
        navigator.clipboard.writeText(url);
        toast.success('Affiliate link copied');
    };

    return (
        <div className="p-6 space-y-8">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Affiliates</h1>
                    <p className="text-muted-foreground">Manage your affiliate program and partners</p>
                </div>
                <AffiliateInviteModal onSuccess={fetchAffiliates} />
            </div>

            {/* Stats Grid */}
            <div className="grid gap-4 md:grid-cols-3">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Affiliates</CardTitle>
                        <Users className="h-4 w-4 text-blue-600" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{affiliates.length}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Commission Paid</CardTitle>
                        <DollarSign className="h-4 w-4 text-green-600" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            ₹{affiliates.reduce((sum, a) => sum + (a.paidCommission || 0), 0).toLocaleString()}
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Revenue Generated</CardTitle>
                        <DollarSign className="h-4 w-4 text-purple-600" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            ₹{affiliates.reduce((sum, a) => sum + (a.totalRevenue || 0), 0).toLocaleString()}
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Affiliates Table */}
            <Card>
                <CardHeader>
                    <CardTitle>Partner List</CardTitle>
                </CardHeader>
                <CardContent>
                    {loading ? (
                        <div className="flex justify-center p-8">
                            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                        </div>
                    ) : affiliates.length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground">
                            No affiliates found. Invite partners to boost your sales.
                        </div>
                    ) : (
                        <div className="relative w-full overflow-auto">
                            <table className="w-full caption-bottom text-sm text-left">
                                <thead className="[&_tr]:border-b">
                                    <tr className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted">
                                        <th className="h-10 px-2 text-left align-middle font-medium text-muted-foreground">Partner</th>
                                        <th className="h-10 px-2 text-left align-middle font-medium text-muted-foreground">Code</th>
                                        <th className="h-10 px-2 text-left align-middle font-medium text-muted-foreground">Commission</th>
                                        <th className="h-10 px-2 text-left align-middle font-medium text-muted-foreground">Sales</th>
                                        <th className="h-10 px-2 text-left align-middle font-medium text-muted-foreground">Revenue</th>
                                        <th className="h-10 px-2 text-left align-middle font-medium text-muted-foreground">Earned</th>
                                        <th className="h-10 px-2 text-left align-middle font-medium text-muted-foreground">Status</th>
                                        <th className="h-10 px-2 text-left align-middle font-medium text-muted-foreground">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="[&_tr:last-child]:border-0">
                                    {affiliates.map((aff) => (
                                        <tr key={aff._id} className="border-b transition-colors hover:bg-muted/50">
                                            <td className="p-2 align-middle">
                                                <div className="font-medium">{aff.name || 'Unknown'}</div>
                                                <div className="text-xs text-muted-foreground">{aff.email}</div>
                                            </td>
                                            <td className="p-2 align-middle font-mono">{aff.code}</td>
                                            <td className="p-2 align-middle">{aff.commissionRate}%</td>
                                            <td className="p-2 align-middle">{aff.totalSales}</td>
                                            <td className="p-2 align-middle">₹{aff.totalRevenue.toLocaleString()}</td>
                                            <td className="p-2 align-middle font-medium text-green-600">₹{aff.totalCommission.toLocaleString()}</td>
                                            <td className="p-2 align-middle">
                                                <Badge variant="outline" className={
                                                    aff.status === 'active' ? 'bg-green-50 text-green-700 border-green-200' :
                                                        aff.status === 'pending' ? 'bg-yellow-50 text-yellow-700 border-yellow-200' : ''
                                                }>
                                                    {aff.status}
                                                </Badge>
                                            </td>
                                            <td className="p-2 align-middle flex items-center gap-2">
                                                <Button variant="ghost" size="sm" onClick={() => copyLink(aff.code)}>
                                                    <Copy className="h-4 w-4" />
                                                </Button>
                                                {aff.status === 'pending' && (
                                                    <>
                                                        <Button
                                                            variant="outline"
                                                            size="sm"
                                                            className="text-green-600 border-green-200 hover:bg-green-50"
                                                            onClick={async () => {
                                                                setLoading(true);
                                                                await fetch(`/api/creator/affiliates/${aff._id}/status`, {
                                                                    method: 'PUT',
                                                                    body: JSON.stringify({ status: 'active' })
                                                                });
                                                                await fetchAffiliates();
                                                                setLoading(false);
                                                                toast.success('Affiliate approved');
                                                            }}
                                                        >
                                                            <Check className="h-4 w-4" />
                                                        </Button>
                                                        <Button
                                                            variant="outline"
                                                            size="sm"
                                                            className="text-red-600 border-red-200 hover:bg-red-50"
                                                            onClick={async () => {
                                                                if (!confirm('Reject this affiliate?')) return;
                                                                setLoading(true);
                                                                await fetch(`/api/creator/affiliates/${aff._id}/status`, {
                                                                    method: 'PUT',
                                                                    body: JSON.stringify({ status: 'rejected' })
                                                                });
                                                                await fetchAffiliates();
                                                                setLoading(false);
                                                                toast.error('Affiliate rejected');
                                                            }}
                                                        >
                                                            X
                                                        </Button>
                                                    </>
                                                )}
                                                {aff.status === 'active' && aff.totalCommission > (aff.paidCommission || 0) && (
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        className="text-blue-600 border-blue-200 hover:bg-blue-50"
                                                        onClick={async () => {
                                                            const amount = aff.totalCommission - (aff.paidCommission || 0);
                                                            if (!confirm(`Mark ₹${amount} as paid to ${aff.name}?`)) return;
                                                            setLoading(true);
                                                            await fetch('/api/creator/affiliates/pay', {
                                                                method: 'POST',
                                                                body: JSON.stringify({
                                                                    affiliateId: aff._id,
                                                                    amount
                                                                })
                                                            });
                                                            await fetchAffiliates();
                                                            setLoading(false);
                                                            toast.success('Commission marked as paid');
                                                        }}
                                                    >
                                                        Pay
                                                    </Button>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
