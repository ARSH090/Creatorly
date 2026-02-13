'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'react-hot-toast';
import { Loader2 } from 'lucide-react';

interface PayoutRequestModalProps {
    availableBalance: number;
    onSuccess: () => void;
}

export function PayoutRequestModal({ availableBalance, onSuccess }: PayoutRequestModalProps) {
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [amount, setAmount] = useState(availableBalance.toString());
    const [description, setDescription] = useState('');

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setLoading(true);

        try {
            const reqAmount = parseFloat(amount);
            if (isNaN(reqAmount) || reqAmount <= 0) {
                throw new Error('Invalid amount');
            }
            if (reqAmount > availableBalance) {
                throw new Error('Amount exceeds available balance');
            }

            const res = await fetch('/api/creator/payouts/request', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ amount: reqAmount, description })
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.message || 'Failed to request payout');

            toast.success('Payout requested successfully');
            setOpen(false);
            onSuccess();
        } catch (error: any) {
            toast.error(error.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger>
                <Button disabled={availableBalance <= 0}>
                    Request Payout
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Request Payout</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                        <Label>Available Balance</Label>
                        <div className="text-2xl font-bold text-green-600">
                            ₹{availableBalance.toLocaleString()}
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="amount">Amount to Withdraw</Label>
                        <Input
                            id="amount"
                            type="number"
                            step="0.01"
                            value={amount}
                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setAmount(e.target.value)}
                            max={availableBalance}
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="description">Notes (Optional)</Label>
                        <Textarea
                            id="description"
                            value={description}
                            onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setDescription(e.target.value)}
                            placeholder="Bank transfer details or notes..."
                        />
                    </div>

                    <div className="flex justify-end pt-4">
                        <Button type="submit" disabled={loading || availableBalance <= 0}>
                            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Submit Request
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
}
