// @ts-nocheck
'use client';

import { useState, useEffect } from 'react';
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
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogFooter,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Loader2, CheckCircle, XCircle } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'react-hot-toast';

export default function PayoutsPage() {
    const [payouts, setPayouts] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [status, setStatus] = useState('all');
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);

    // Action State
    const [processingId, setProcessingId] = useState<string | null>(null);
    const [actionType, setActionType] = useState<'approve' | 'reject' | null>(null);
    const [actionNotes, setActionNotes] = useState('');
    const [transactionRef, setTransactionRef] = useState('');

    const fetchPayouts = async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams({
                page: page.toString(),
                limit: '10',
                status
            });
            const res = await fetch(`/api/admin/payouts?${params}`);
            if (res.ok) {
                const data = await res.json();
                setPayouts(data.payouts);
                setTotalPages(data.pagination.pages);
            }
        } catch (error) {
            console.error('Failed to fetch payouts', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchPayouts();
    }, [status, page]);

    const handleAction = async () => {
        if (!processingId || !actionType) return;

        try {
            const body: any = {
                status: actionType === 'approve' ? 'paid' : 'rejected',
                notes: actionNotes
            };
            if (actionType === 'approve') {
                body.transactionReference = transactionRef;
            }

            const res = await fetch(`/api/admin/payouts/${processingId}`, {
                method: 'PUT',
                body: JSON.stringify(body),
                headers: { 'Content-Type': 'application/json' }
            });

            if (res.ok) {
                toast.success(`Payout ${actionType === 'approve' ? 'approved' : 'rejected'}`);
                setProcessingId(null);
                setActionType(null);
                setActionNotes('');
                setTransactionRef('');
                fetchPayouts();
            } else {
                toast.error('Action failed');
            }
        } catch (error) {
            toast.error('Error processing payout');
        }
    };

    const openActionDialog = (id: string, type: 'approve' | 'reject') => {
        setProcessingId(id);
        setActionType(type);
        setActionNotes('');
        setTransactionRef('');
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-3xl font-bold tracking-tight">Payouts</h1>
                <Dialog open={!!processingId} onOpenChange={(open) => !open && setProcessingId(null)}>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>
                                {actionType === 'approve' ? 'Approve Payout' : 'Reject Payout'}
                            </DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4">
                            {actionType === 'approve' && (
                                <div className="grid gap-2">
                                    <Label>Transaction Reference (Optional)</Label>
                                    <Input
                                        placeholder="Bank Transaction ID"
                                        value={transactionRef}
                                        onChange={(e) => setTransactionRef(e.target.value)}
                                    />
                                </div>
                            )}
                            <div className="grid gap-2">
                                <Label>Notes / Reason</Label>
                                <Input
                                    placeholder={actionType === 'approve' ? "Notes" : "Rejection Reason"}
                                    value={actionNotes}
                                    onChange={(e) => setActionNotes(e.target.value)}
                                />
                            </div>
                        </div>
                        <DialogFooter>
                            <Button variant="ghost" onClick={() => setProcessingId(null)}>Cancel</Button>
                            <Button
                                variant={actionType === 'approve' ? 'default' : 'destructive'}
                                onClick={handleAction}
                            >
                                Confirm
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>

            <div className="flex items-center gap-4">
                <Select value={status} onValueChange={setStatus}>
                    <SelectTrigger className="w-[180px]">
                        <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All Status</SelectItem>
                        <SelectItem value="pending">Pending</SelectItem>
                        <SelectItem value="paid">Paid</SelectItem>
                        <SelectItem value="rejected">Rejected</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            <div className="rounded-md border bg-white">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Creator</TableHead>
                            <TableHead>Amount</TableHead>
                            <TableHead>Method</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Requested</TableHead>
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
                        ) : payouts.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={6} className="h-24 text-center">
                                    No payouts found.
                                </TableCell>
                            </TableRow>
                        ) : (
                            payouts.map((payout) => (
                                <TableRow key={payout._id}>
                                    <TableCell>
                                        <div className="flex flex-col">
                                            <span className="font-medium">{payout.userId?.displayName || 'Unknown'}</span>
                                            <span className="text-xs text-muted-foreground">{payout.userId?.email}</span>
                                        </div>
                                    </TableCell>
                                    <TableCell>₹{payout.amount}</TableCell>
                                    <TableCell className="capitalize">{payout.payoutMethod}</TableCell>
                                    <TableCell>
                                        <Badge variant={
                                            payout.status === 'paid' ? 'default' :
                                                payout.status === 'rejected' ? 'destructive' : 'secondary'
                                        }>
                                            {payout.status}
                                        </Badge>
                                    </TableCell>
                                    <TableCell>
                                        {format(new Date(payout.createdAt), 'MMM d, yyyy')}
                                    </TableCell>
                                    <TableCell className="text-right">
                                        {payout.status === 'pending' && (
                                            <div className="flex justify-end gap-2">
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    className="text-green-600 border-green-200 hover:bg-green-50"
                                                    onClick={() => openActionDialog(payout._id, 'approve')}
                                                >
                                                    <CheckCircle className="h-4 w-4 mr-1" /> Approve
                                                </Button>
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    className="text-red-600 border-red-200 hover:bg-red-50"
                                                    onClick={() => openActionDialog(payout._id, 'reject')}
                                                >
                                                    <XCircle className="h-4 w-4 mr-1" /> Reject
                                                </Button>
                                            </div>
                                        )}
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
