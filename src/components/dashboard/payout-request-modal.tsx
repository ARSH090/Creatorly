'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'react-hot-toast';
import { Loader2, Zap, Clock } from 'lucide-react';

interface PayoutRequestModalProps {
    availableBalance: number;
    onSuccess: () => void;
}

export function PayoutRequestModal({ availableBalance, onSuccess }: PayoutRequestModalProps) {
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [amount, setAmount] = useState(availableBalance.toString());
    const [upiId, setUpiId] = useState('');
    const [mode, setMode] = useState<'UPI' | 'IMPS' | 'NEFT'>('UPI');
    const [instantResult, setInstantResult] = useState<{ instant: boolean; message?: string } | null>(null);

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setLoading(true);
        setInstantResult(null);

        try {
            const reqAmount = parseFloat(amount);
            if (isNaN(reqAmount) || reqAmount <= 0) throw new Error('Invalid amount');
            if (reqAmount > availableBalance) throw new Error('Amount exceeds available balance');
            if (mode === 'UPI' && upiId && !upiId.includes('@')) throw new Error('Enter a valid UPI ID (e.g. name@upi)');

            const res = await fetch('/api/creator/payouts/request', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ amount: reqAmount, upiId: upiId || undefined, mode }),
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.message || data.error || 'Failed to request payout');

            if (data.instant) {
                toast.success('Instant payout sent! Check your UPI in 60 seconds.');
            } else {
                toast.success('Payout request submitted. Processing in 1-2 business days.');
            }
            setInstantResult({ instant: data.instant, message: data.message });
            setTimeout(() => { setOpen(false); setInstantResult(null); onSuccess(); }, 2000);
        } catch (error: any) {
            toast.error(error.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button disabled={availableBalance <= 0}>Request Payout</Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
                <DialogHeader>
                    <DialogTitle>Request Payout</DialogTitle>
                </DialogHeader>

                {instantResult ? (
                    <div className={`p-4 rounded-xl text-sm font-medium ${instantResult.instant ? 'bg-green-500/10 text-green-400 border border-green-500/20' : 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20'}`}>
                        {instantResult.instant
                            ? '⚡ Instant UPI transfer initiated! Money arrives in 60 seconds.'
                            : '⏳ Payout queued. Will be processed within 1-2 business days.'}
                    </div>
                ) : (
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="space-y-2">
                            <Label>Amount (₹)</Label>
                            <Input
                                type="number"
                                value={amount}
                                onChange={(e) => setAmount(e.target.value)}
                                max={availableBalance}
                                min={1}
                                step="0.01"
                                required
                            />
                            <p className="text-xs text-zinc-500">Available: ₹{availableBalance.toLocaleString('en-IN')}</p>
                        </div>

                        <div className="space-y-2">
                            <Label>Payout Method</Label>
                            <div className="grid grid-cols-3 gap-2">
                                {(['UPI', 'IMPS', 'NEFT'] as const).map((m) => (
                                    <button
                                        key={m}
                                        type="button"
                                        onClick={() => setMode(m)}
                                        className={`py-2 px-3 rounded-lg text-sm font-medium border transition-all ${mode === m ? 'bg-indigo-600 text-white border-indigo-600' : 'border-zinc-700 text-zinc-400 hover:border-zinc-500'}`}
                                    >
                                        {m === 'UPI' ? '⚡ UPI' : m}
                                    </button>
                                ))}
                            </div>
                            {mode === 'UPI' && (
                                <p className="text-xs text-green-400 flex items-center gap-1">
                                    <Zap size={12} /> Instant transfer in 60 seconds
                                </p>
                            )}
                            {(mode === 'IMPS' || mode === 'NEFT') && (
                                <p className="text-xs text-amber-400 flex items-center gap-1">
                                    <Clock size={12} /> IMPS: within hours · NEFT: next business day
                                </p>
                            )}
                        </div>

                        {mode === 'UPI' && (
                            <div className="space-y-2">
                                <Label>UPI ID</Label>
                                <Input
                                    type="text"
                                    placeholder="yourname@upi"
                                    value={upiId}
                                    onChange={(e) => setUpiId(e.target.value.trim())}
                                />
                                <p className="text-xs text-zinc-500">e.g. 9876543210@paytm · name@gpay · name@oksbi</p>
                            </div>
                        )}

                        <Button type="submit" disabled={loading} className="w-full">
                            {loading ? (
                                <><Loader2 size={16} className="animate-spin mr-2" /> Processing...</>
                            ) : mode === 'UPI' && upiId ? (
                                <><Zap size={16} className="mr-2" /> Instant UPI Payout</>
                            ) : (
                                'Request Payout'
                            )}
                        </Button>
                    </form>
                )}
            </DialogContent>
        </Dialog>
    );
}
