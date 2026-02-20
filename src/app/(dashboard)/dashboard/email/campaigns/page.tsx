'use client';

import { useEffect, useState } from 'react';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
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
        <DashboardLayout>
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
                            <Card key={campaign._id} className="hover:border-indigo-500/50 transition-colors">
                                <CardContent className="p-6">
                                    <div className="flex items-start justify-between">
                                        <div className="space-y-1">
                                            <div className="flex items-center space-x-2">
                                                <h3 className="font-semibold text-lg">{campaign.name}</h3>
                                                <Badge variant={
                                                    campaign.status === 'sent' ? 'default' :
                                                        campaign.status === 'scheduled' ? 'secondary' : 'outline'
                                                }>
                                                    {campaign.status === 'sent' ? 'Sent' :
                                                        campaign.status === 'scheduled' ? 'Scheduled' : 'Draft'}
                                                </Badge>
                                            </div>
                                            <div className="text-sm text-muted-foreground">
                                                Subject: "{campaign.subject}"
                                            </div>
                                            <div className="flex items-center gap-4 text-xs text-muted-foreground mt-2">
                                                <span className="flex items-center">
                                                    <Calendar className="h-3 w-3 mr-1" />
                                                    {campaign.createdAt ? format(new Date(campaign.createdAt), 'MMM d, yyyy') : 'Recently'}
                                                </span>
                                                {campaign.status === 'sent' && (
                                                    <span className="flex items-center text-green-600">
                                                        <Send className="h-3 w-3 mr-1" />
                                                        Sent {campaign.sentAt ? format(new Date(campaign.sentAt), 'MMM d, h:mm a') : ''}
                                                    </span>
                                                )}
                                            </div>
                                        </div>

                                        <div className="text-right space-y-1">
                                            <div className="text-2xl font-bold">{campaign.stats?.sent || 0}</div>
                                            <div className="text-xs text-muted-foreground uppercase tracking-wider">Recipients</div>

                                            {campaign.status === 'sent' && (
                                                <div className="flex gap-3 mt-2 text-xs">
                                                    <div>
                                                        <span className="font-bold block">{campaign.stats?.opened || 0}</span>
                                                        <span className="text-muted-foreground">Opened</span>
                                                    </div>
                                                    <div>
                                                        <span className="font-bold block">{campaign.stats?.clicked || 0}</span>
                                                        <span className="text-muted-foreground">Clicked</span>
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
        </DashboardLayout>
    );
}
