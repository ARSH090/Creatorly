'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { toast } from 'react-hot-toast';
import { Loader2, Send, Users, Clock } from 'lucide-react';

export function BroadcastManager() {
    const [loading, setLoading] = useState(false);
    const [recipients, setRecipients] = useState('');
    const [message, setMessage] = useState('');
    const [platform, setPlatform] = useState('instagram');
    const [delay, setDelay] = useState(5);

    const handleSend = async () => {
        if (!recipients || !message) {
            return toast.error('Please enter recipients and a message');
        }

        setLoading(true);
        try {
            // Process recipient list (expecting comma separated IDs or handle list)
            const recipientList = recipients.split(',')
                .map(r => r.trim())
                .filter(r => r)
                .map(id => ({ id }));

            const res = await fetch('/api/creator/dm/broadcast', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    recipients: recipientList,
                    message,
                    platform,
                    delaySeconds: delay
                })
            });

            const data = await res.json();
            if (res.ok) {
                toast.success(data.message);
                setRecipients('');
                setMessage('');
            } else {
                throw new Error(data.error);
            }
        } catch (error: any) {
            toast.error(error.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Send className="h-5 w-5 text-indigo-600" />
                    New Broadcast Campaign
                </CardTitle>
                <CardDescription>
                    Send bulk messages to your leads or customers across Instagram and WhatsApp.
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label>Platform</Label>
                        <select
                            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                            value={platform}
                            onChange={(e) => setPlatform(e.target.value)}
                        >
                            <option value="instagram">Instagram DM</option>
                            <option value="whatsapp">WhatsApp Business</option>
                        </select>
                    </div>
                    <div className="space-y-2">
                        <Label className="flex items-center gap-2">
                            <Clock className="h-4 w-4" /> Delay Between (s)
                        </Label>
                        <Input
                            type="number"
                            value={delay}
                            onChange={(e) => setDelay(parseInt(e.target.value))}
                        />
                    </div>
                </div>

                <div className="space-y-2">
                    <Label className="flex items-center gap-2">
                        <Users className="h-4 w-4" /> Recipients (Social IDs, comma separated)
                    </Label>
                    <Textarea
                        placeholder="123456789, 987654321..."
                        value={recipients}
                        onChange={(e) => setRecipients(e.target.value)}
                        rows={3}
                    />
                </div>

                <div className="space-y-2">
                    <Label>Message Content</Label>
                    <Textarea
                        placeholder="Hey {{name}}, check out our new update!"
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        rows={5}
                    />
                    <p className="text-[10px] text-muted-foreground italic">
                        Supports {"{{name}}"} variable. Messages will be enqueued and delivered gradually.
                    </p>
                </div>

                <Button
                    className="w-full bg-indigo-600 hover:bg-indigo-700 text-white"
                    onClick={handleSend}
                    disabled={loading}
                >
                    {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
                    Launch Broadcast
                </Button>
            </CardContent>
        </Card>
    );
}
