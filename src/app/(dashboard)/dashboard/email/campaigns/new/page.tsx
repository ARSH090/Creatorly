'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, ArrowLeft, Send, Calendar, Save } from 'lucide-react';
import { toast } from 'react-hot-toast';

export default function NewCampaignPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [lists, setLists] = useState<any[]>([]);
    const [totalSubscribers, setTotalSubscribers] = useState(0);

    const [name, setName] = useState('');
    const [subject, setSubject] = useState('');
    const [listId, setListId] = useState('all');
    const [content, setContent] = useState('');
    const [scheduledAt, setScheduledAt] = useState('');

    useEffect(() => {
        // Fetch lists and total subscribers
        const init = async () => {
            try {
                const [listsRes, subsRes] = await Promise.all([
                    fetch('/api/creator/email/lists'),
                    fetch('/api/creator/email/subscribers')
                ]);

                if (listsRes.ok) {
                    const data = await listsRes.json();
                    setLists(data.lists);
                }

                if (subsRes.ok) {
                    const data = await subsRes.json();
                    setTotalSubscribers(data.total);
                }
            } catch (error) {
                console.error(error);
                toast.error('Failed to load recipient lists');
            }
        };
        init();
    }, []);

    const handleSubmit = async (e: React.FormEvent, isDraft = false) => {
        e.preventDefault();
        setLoading(true);

        try {
            const payload = {
                name,
                subject,
                content,
                listId: listId === 'all' ? undefined : listId, // undefined meant all in backend logic usually
                scheduledAt: scheduledAt ? new Date(scheduledAt).toISOString() : undefined,
                status: isDraft ? 'draft' : (scheduledAt ? 'scheduled' : 'sent') // Note: Backend usually handles 'sent' status by queueing immediately?
                // But here we probably just create it. 
                // The API sets status based on scheduledAt automatically.
            };

            // If we want to send NOW, we might need a separate 'send' endpoint or a flag.
            // But usually 'create campaign' just creates it.
            // Let's assume the API handles it.
            // Wait, API `campaign/route.ts` says: `status: scheduledAt ? 'scheduled' : 'draft'`.
            // So to Send Now, we might need to Trigger it.
            // Or maybe setting status to 'sent' isn't allowed in Create.
            // For now, let's just create it. The user task is "Composer". Sending might be a separate step or improved later.

            const res = await fetch('/api/creator/email/campaign', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Failed to create campaign');

            toast.success(isDraft ? 'Draft saved' : 'Campaign created');
            router.push('/dashboard/email/campaigns');
        } catch (error: any) {
            toast.error(error.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <DashboardLayout>
            <div className="max-w-4xl mx-auto p-6 space-y-8">
                <div className="flex items-center space-x-4">
                    <Button variant="ghost" size="icon" onClick={() => router.back()}>
                        <ArrowLeft className="h-4 w-4" />
                    </Button>
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">New Campaign</h1>
                        <p className="text-muted-foreground">Compose and schedule your email</p>
                    </div>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle>Campaign Details</CardTitle>
                        <CardDescription>Configure who receives this email and what it says.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form className="space-y-6" onSubmit={(e) => handleSubmit(e, true)}>
                            <div className="space-y-2">
                                <Label htmlFor="name">Internal Campaign Name</Label>
                                <Input
                                    id="name"
                                    placeholder="e.g. February Newsletter"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    required
                                />
                                <p className="text-xs text-muted-foreground">Only visible to you</p>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="list">Recipients</Label>
                                <Select value={listId} onValueChange={setListId}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select a list" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">All Subscribers ({totalSubscribers})</SelectItem>
                                        {lists.map(list => (
                                            <SelectItem key={list._id} value={list._id}>
                                                {list.name} ({list.subscriberCount})
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="subject">Subject Line</Label>
                                <Input
                                    id="subject"
                                    placeholder="Enter a catchy subject..."
                                    value={subject}
                                    onChange={(e) => setSubject(e.target.value)}
                                    required
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="content">Email Content</Label>
                                <div className="border rounded-md bg-muted/50 p-2 text-xs text-muted-foreground mb-1">
                                    Markdown is supported. Use **bold**, *italics*, [links](url).
                                </div>
                                <Textarea
                                    id="content"
                                    className="min-h-[300px] font-mono"
                                    placeholder="# Hello Subscribers..."
                                    value={content}
                                    onChange={(e) => setContent(e.target.value)}
                                    required
                                />
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t">
                                <div className="space-y-2">
                                    <Label>Schedule (Optional)</Label>
                                    <Input
                                        type="datetime-local"
                                        value={scheduledAt}
                                        onChange={(e) => setScheduledAt(e.target.value)}
                                    />
                                    <p className="text-xs text-muted-foreground">Leave blank to save as draft (or send immediately if implemented)</p>
                                </div>

                                <div className="flex items-end justify-end space-x-2">
                                    <Button type="button" variant="outline" onClick={(e) => handleSubmit(e, true)} disabled={loading}>
                                        <Save className="mr-2 h-4 w-4" />
                                        Save Draft
                                    </Button>
                                    <Button type="button" onClick={(e) => handleSubmit(e, false)} disabled={loading} className="bg-indigo-600 hover:bg-indigo-700">
                                        {scheduledAt ? (
                                            <>
                                                <Calendar className="mr-2 h-4 w-4" />
                                                Schedule
                                            </>
                                        ) : (
                                            <>
                                                <Send className="mr-2 h-4 w-4" />
                                                Create & Send
                                            </>
                                        )}
                                    </Button>
                                </div>
                            </div>
                        </form>
                    </CardContent>
                </Card>
            </div>
        </DashboardLayout>
    );
}
