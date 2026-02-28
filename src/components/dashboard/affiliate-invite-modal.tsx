'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'react-hot-toast';
import { Loader2, Plus, Copy, Check } from 'lucide-react';

interface AffiliateInviteModalProps {
    onSuccess: () => void;
}

export function AffiliateInviteModal({ onSuccess }: AffiliateInviteModalProps) {
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [email, setEmail] = useState('');
    const [name, setName] = useState('');
    const [commissionRate, setCommissionRate] = useState('10');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            const res = await fetch('/api/creator/affiliates/invite', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    email,
                    name,
                    commissionRate: parseFloat(commissionRate)
                })
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.message || 'Failed to invite affiliate');

            toast.success('Invitation sent successfully');
            setOpen(false);
            setEmail('');
            setName('');
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
                <Button>
                    <Plus className="mr-2 h-4 w-4" />
                    Invite Affiliate
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Invite Affiliate</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="email">Email Address</Label>
                        <Input
                            id="email"
                            type="email"
                            required
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="affiliate@example.com"
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="name">Name (Optional)</Label>
                        <Input
                            id="name"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="John Doe"
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="commission">Commission Rate (%)</Label>
                        <Input
                            id="commission"
                            type="number"
                            min="0"
                            max="100"
                            required
                            value={commissionRate}
                            onChange={(e) => setCommissionRate(e.target.value)}
                        />
                        <p className="text-xs text-muted-foreground">
                            Percentage of each sale this affiliate will earn.
                        </p>
                    </div>

                    <div className="flex justify-end pt-4">
                        <Button type="submit" disabled={loading}>
                            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Send Invitation
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
}
