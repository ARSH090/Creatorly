'use client';

import { useEffect, useState } from 'react';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import { PayoutRequestModal } from '@/components/dashboard/payout-request-modal';
import { PayoutSettingsModal } from '@/components/dashboard/payout-settings-modal';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '../../../components/ui/badge';
import { format } from 'date-fns';
import { Loader2, ArrowUpRight, CheckCircle2, Clock } from 'lucide-react';

export default function CreatorPayoutsPage() {
    const [loading, setLoading] = useState(true);
    const [data, setData] = useState<any>({ payouts: [], summary: {} });

    const fetchPayouts = async () => {
        try {
            const res = await fetch('/api/creator/payouts');
            const json = await res.json();
            if (res.ok) setData(json);
        } catch (error) {
            console.error('Failed to fetch payouts:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchPayouts();
    }, []);

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'paid': return 'bg-green-100 text-green-800';
            case 'pending': return 'bg-yellow-100 text-yellow-800';
            case 'processed': return 'bg-blue-100 text-blue-800';
            case 'rejected': return 'bg-red-100 text-red-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    };

    return (
        <DashboardLayout>
            <div className="p-6 space-y-8">
                <div className="flex justify-between items-center">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">Payouts</h1>
                        <p className="text-muted-foreground">Manage your earnings and withdrawals</p>
                    </div>
                    <div className="flex items-center gap-2">
                        <PayoutSettingsModal onSuccess={fetchPayouts} />
                        <PayoutRequestModal
                            availableBalance={data.summary.available || 0}
                            onSuccess={fetchPayouts}
                        />
                    </div>
                </div>

                {/* Stats Grid */}
                <div className="grid gap-4 md:grid-cols-3">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Available to Payout</CardTitle>
                            <ArrowUpRight className="h-4 w-4 text-green-600" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">₹{(data.summary.available || 0).toLocaleString()}</div>
                            <p className="text-xs text-muted-foreground">Ready for withdrawal</p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Pending Payouts</CardTitle>
                            <Clock className="h-4 w-4 text-yellow-600" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">₹{((data.summary.pending || 0) - (data.summary.available || 0)).toLocaleString()}</div>
                            <p className="text-xs text-muted-foreground">Processing requests</p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Total Paid Out</CardTitle>
                            <CheckCircle2 className="h-4 w-4 text-blue-600" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">₹{(data.summary.paidOut || 0).toLocaleString()}</div>
                            <p className="text-xs text-muted-foreground">Lifetime earnings withdrawn</p>
                        </CardContent>
                    </Card>
                </div>

                {/* Payout History */}
                <Card>
                    <CardHeader>
                        <CardTitle>Payout History</CardTitle>
                    </CardHeader>
                    <CardContent>
                        {loading ? (
                            <div className="flex justify-center p-8">
                                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                            </div>
                        ) : data.payouts.length === 0 ? (
                            <div className="text-center py-8 text-muted-foreground">
                                No payout history found.
                            </div>
                        ) : (
                            <div className="relative w-full overflow-auto">
                                <table className="w-full caption-bottom text-sm text-left">
                                    <thead className="[&_tr]:border-b">
                                        <tr className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted">
                                            <th className="h-10 px-2 text-left align-middle font-medium text-muted-foreground">Date</th>
                                            <th className="h-10 px-2 text-left align-middle font-medium text-muted-foreground">Amount</th>
                                            <th className="h-10 px-2 text-left align-middle font-medium text-muted-foreground">Status</th>
                                            <th className="h-10 px-2 text-left align-middle font-medium text-muted-foreground">Method</th>
                                            <th className="h-10 px-2 text-left align-middle font-medium text-muted-foreground">Notes</th>
                                        </tr>
                                    </thead>
                                    <tbody className="[&_tr:last-child]:border-0">
                                        {data.payouts.map((payout: any) => (
                                            <tr key={payout._id} className="border-b transition-colors hover:bg-muted/50">
                                                <td className="p-2 align-middle">{format(new Date(payout.createdAt), 'MMM d, yyyy')}</td>
                                                <td className="p-2 align-middle font-medium">₹{payout.amount.toLocaleString()}</td>
                                                <td className="p-2 align-middle">
                                                    <Badge variant="secondary" className={getStatusColor(payout.status)}>
                                                        {payout.status.charAt(0).toUpperCase() + payout.status.slice(1)}
                                                    </Badge>
                                                </td>
                                                <td className="p-2 align-middle uppercase">{payout.payoutMethod || 'Bank'}</td>
                                                <td className="p-2 align-middle text-muted-foreground">{payout.description || '-'}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </DashboardLayout>
    );
}
