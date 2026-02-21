'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, Plus, Mail, Send, Calendar } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { format } from 'date-fns';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function EmailCampaignsPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [campaigns, setCampaigns] = useState<any[]>([]);

    const fetchCampaigns = async () => {
        try {
            const res = await fetch('/api/creator/email/campaigns');
            const json = await res.json();
            if (res.ok) {
                setCampaigns(json.campaigns);
            } else {
                if (res.status === 403) {
                    // Plan limit
                    toast.error('Upgrade to Pro to access Email Marketing');
                }
            }
        } catch (error) {
            console.error('Failed to fetch campaigns:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchCampaigns();
    }, []);

    return (
        <div className="p-6 space-y-8">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Email Campaigns</h1>
                    <p className="text-muted-foreground">Manage your newsletters and broadcasts</p>
                </div>
                <Link href="/dashboard/email/campaigns/new">
                    <Button>
                        <Plus className="mr-2 h-4 w-4" />
                        New Campaign
                    </Button>
                </Link>
            </div>

            <div className="grid gap-6">
                {loading ? (
                    <div className="flex justify-center p-12">
                        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                    </div>
                ) : campaigns.length === 0 ? (
                    <Card className="border-dashed">
                        <CardContent className="flex flex-col items-center justify-center p-12 space-y-4">
                            <Mail className="h-12 w-12 text-muted-foreground opacity-50" />
                            <div className="text-center">
                                <h3 className="text-lg font-medium">No campaigns yet</h3>
                                <p className="text-muted-foreground">Create your first email campaign to reach your audience.</p>
                            </div>
                            <Link href="/dashboard/email/campaigns/new">
                                <Button>Create Campaign</Button>
                            </Link>
                        </CardContent>
                    </Card>
                ) : (
                    campaigns.map((campaign) => (
                        <Card key={campaign._id} className="hover:border-indigo-500/50 transition-colors group relative overflow-hidden">
                            <CardContent className="p-4 sm:p-6">
                                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                                    <div className="space-y-1 flex-1 min-w-0">
                                        <div className="flex items-center flex-wrap gap-2 mb-1">
                                            <h3 className="font-bold text-base sm:text-lg truncate max-w-[200px] sm:max-w-md text-white">{campaign.name}</h3>
                                            <Badge variant={
                                                campaign.status === 'sent' ? 'default' :
                                                    campaign.status === 'scheduled' ? 'secondary' : 'outline'
                                            } className="text-[10px] sm:text-xs">
                                                {campaign.status === 'sent' ? 'Sent' :
                                                    campaign.status === 'scheduled' ? 'Scheduled' : 'Draft'}
                                            </Badge>
                                        </div>
                                        <div className="text-xs sm:text-sm text-zinc-500 truncate">
                                            Subject: <span className="text-zinc-400">"{campaign.subject}"</span>
                                        </div>
                                        <div className="flex flex-wrap items-center gap-3 text-[10px] sm:text-xs text-zinc-500 mt-2">
                                            <span className="flex items-center">
                                                <Calendar className="h-3 w-3 mr-1" />
                                                {campaign.createdAt ? format(new Date(campaign.createdAt), 'MMM d, yyyy') : 'Recently'}
                                            </span>
                                            {campaign.status === 'sent' && (
                                                <span className="flex items-center text-emerald-500">
                                                    <Send className="h-3 w-3 mr-1" />
                                                    Sent {campaign.sentAt ? format(new Date(campaign.sentAt), 'MMM d, h:mm a') : ''}
                                                </span>
                                            )}
                                        </div>
                                    </div>

                                    <div className="flex sm:flex-col justify-between items-end sm:text-right gap-2 pt-3 sm:pt-0 border-t sm:border-none border-white/5">
                                        <div className="flex flex-col">
                                            <div className="text-xl sm:text-2xl font-black text-white leading-none">{campaign.stats?.sent || 0}</div>
                                            <div className="text-[10px] text-zinc-600 font-bold uppercase tracking-widest mt-1">Recipients</div>
                                        </div>

                                        {campaign.status === 'sent' && (
                                            <div className="flex gap-4 text-xs">
                                                <div className="text-right">
                                                    <span className="font-black text-white block leading-none">{campaign.stats?.opened || 0}</span>
                                                    <span className="text-[10px] text-zinc-600 font-bold uppercase">Opened</span>
                                                </div>
                                                <div className="text-right">
                                                    <span className="font-black text-white block leading-none">{campaign.stats?.clicked || 0}</span>
                                                    <span className="text-[10px] text-zinc-600 font-bold uppercase">Clicked</span>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ))
                )}
            </div>
        </div>
    );
}
