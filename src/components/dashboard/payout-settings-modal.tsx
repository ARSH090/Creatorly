'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'react-hot-toast';
import { Loader2, Settings } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface PayoutSettingsModalProps {
    onSuccess: () => void;
}

export function PayoutSettingsModal({ onSuccess }: PayoutSettingsModalProps) {
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [fetching, setFetching] = useState(false);

    // Form state
    const [type, setType] = useState<'bank' | 'paypal' | 'stripe'>('bank');
    const [accountId, setAccountId] = useState('');
    const [email, setEmail] = useState('');

    // Fetch existing settings when modal opens
    useEffect(() => {
        if (open) {
            fetchSettings();
        }
    }, [open]);

    const fetchSettings = async () => {
        setFetching(true);
        try {
            const res = await fetch('/api/creator/payouts/settings');
            if (res.ok) {
                const data = await res.json();
                if (data.payoutMethod) {
                    setType(data.payoutMethod.type || 'bank');
                    setAccountId(data.payoutMethod.accountId || '');
                    setEmail(data.payoutMethod.email || '');
                }
            }
        } catch (error) {
            console.error('Failed to fetch payout settings:', error);
        } finally {
            setFetching(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            const payload: any = { type };
            if (type === 'bank' || type === 'stripe') {
                payload.accountId = accountId;
            }
            if (type === 'paypal' || type === 'bank') { // Some banks use email for verification/notifications
                payload.email = email;
            }

            const res = await fetch('/api/creator/payouts/settings', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.message || 'Failed to save settings');

            toast.success('Payout settings saved');
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
            <DialogTrigger asChild>
                <Button variant="outline" size="sm">
                    <Settings className="mr-2 h-4 w-4" />
                    Payout Settings
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Configure Payout Method</DialogTitle>
                </DialogHeader>

                {fetching ? (
                    <div className="flex justify-center p-8">
                        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                    </div>
                ) : (
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="type">Payment Method</Label>
                            <Select
                                value={type}
                                onValueChange={(val: 'bank' | 'paypal' | 'stripe') => setType(val)}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Select method" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="bank">Bank Transfer</SelectItem>
                                    <SelectItem value="paypal">PayPal</SelectItem>
                                    <SelectItem value="stripe">Stripe Connect</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        {type === 'bank' && (
                            <div className="space-y-2">
                                <Label htmlFor="accountId">Account Number / IBAN</Label>
                                <Input
                                    id="accountId"
                                    required
                                    value={accountId}
                                    onChange={(e) => setAccountId(e.target.value)}
                                    placeholder="Enter your account details"
                                />
                            </div>
                        )}

                        {type === 'stripe' && (
                            <div className="space-y-2">
                                <Label htmlFor="accountId">Stripe Account ID</Label>
                                <Input
                                    id="accountId"
                                    required
                                    value={accountId}
                                    onChange={(e) => setAccountId(e.target.value)}
                                    placeholder="acct_..."
                                />
                            </div>
                        )}

                        {(type === 'paypal' || type === 'bank') && (
                            <div className="space-y-2">
                                <Label htmlFor="email">
                                    {type === 'paypal' ? 'PayPal Email' : 'Notification Email'}
                                </Label>
                                <Input
                                    id="email"
                                    type="email"
                                    required={type === 'paypal'}
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="your@email.com"
                                />
                            </div>
                        )}

                        <div className="flex justify-end pt-4">
                            <Button type="submit" disabled={loading}>
                                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Save Changes
                            </Button>
                        </div>
                    </form>
                )}
            </DialogContent>
        </Dialog>
    );
}
