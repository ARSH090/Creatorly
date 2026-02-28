'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'react-hot-toast';
import { Loader2, Plus, Edit, Zap } from 'lucide-react';

interface AutomationRuleModalProps {
    rule?: any;
    onSuccess: () => void;
    trigger?: React.ReactNode;
}

export function AutomationRuleModal({ rule, onSuccess, trigger }: AutomationRuleModalProps) {
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);

    // Form state
    const [platform, setPlatform] = useState('instagram');
    const [triggerType, setTriggerType] = useState('keyword');
    const [keywords, setKeywords] = useState('');
    const [action, setAction] = useState('auto_reply');
    const [response, setResponse] = useState('');
    const [isActive, setIsActive] = useState(true);

    // New Fields
    const [followRequired, setFollowRequired] = useState(false);
    const [cooldownHours, setCooldownHours] = useState(24);
    const [attachmentType, setAttachmentType] = useState('none');
    const [attachmentId, setAttachmentId] = useState('');

    useEffect(() => {
        if (rule) {
            setPlatform(rule.platform || 'instagram');
            // Support both trigger and triggerType from backend
            const t = rule.triggerType || rule.trigger || 'keyword';
            setTriggerType(t === 'dm' && rule.keywords?.length > 0 ? 'keyword' : t);
            setKeywords(rule.keywords ? rule.keywords.join(', ') : '');
            setAction(rule.action || 'auto_reply');
            setResponse(rule.replyText || rule.response || '');
            setIsActive(rule.isActive);

            // New fields
            setFollowRequired(rule.followRequired || false);
            setCooldownHours(rule.cooldownHours || 24);
            setAttachmentType(rule.attachmentType || 'none');
            setAttachmentId(rule.attachmentId || '');
        } else {
            // Reset for new rule
            setPlatform('instagram');
            setTriggerType('keyword');
            setKeywords('');
            setAction('auto_reply');
            setResponse('');
            setIsActive(true);
            setFollowRequired(false);
            setCooldownHours(24);
            setAttachmentType('none');
            setAttachmentId('');
        }
    }, [rule, open]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            const keywordList = keywords.split(',').map(k => k.trim()).filter(k => k);

            const payload = {
                platform,
                trigger: triggerType,
                keywords: keywordList,
                action,
                response,
                isActive,
                followRequired,
                cooldownHours,
                attachmentType,
                attachmentId
            };

            const url = rule
                ? `/api/creator/automation/rules/${rule._id}`
                : '/api/creator/automation/rules';

            const method = rule ? 'PUT' : 'POST';

            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.message || 'Failed to save rule');

            toast.success(rule ? 'Rule updated' : 'Rule created');
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
                {trigger || (
                    <Button>
                        <Plus className="mr-2 h-4 w-4" />
                        Create Rule
                    </Button>
                )}
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px] h-[80vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>{rule ? 'Edit Rule' : 'New Automation Rule'}</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="platform">Platform</Label>
                            <select
                                id="platform"
                                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                value={platform}
                                onChange={(e) => setPlatform(e.target.value)}
                            >
                                <option value="instagram">Instagram</option>
                                <option value="facebook">Facebook</option>
                                <option value="twitter">X (Twitter)</option>
                            </select>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="isActive">Status</Label>
                            <select
                                id="isActive"
                                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                value={isActive ? 'true' : 'false'}
                                onChange={(e) => setIsActive(e.target.value === 'true')}
                            >
                                <option value="true">Active</option>
                                <option value="false">Paused</option>
                            </select>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="trigger">Trigger</Label>
                        <select
                            id="trigger"
                            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                            value={triggerType}
                            onChange={(e) => setTriggerType(e.target.value)}
                        >
                            <option value="keyword">Keyword Mention</option>
                            <option value="dm">Direct Message (DM)</option>
                            <option value="comment">Comments on Post</option>
                            <option value="story_reply">Story Reply</option>
                            <option value="new_follow">New Follower</option>
                        </select>
                    </div>

                    <div className="p-4 bg-indigo-50/50 rounded-lg space-y-4 border border-indigo-100">
                        <Label className="text-indigo-900 font-bold flex items-center gap-2">
                            <Zap className="h-4 w-4" /> Growth Automation (Follow First)
                        </Label>
                        <div className="flex items-center space-x-2">
                            <input
                                type="checkbox"
                                id="followRequired"
                                className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-600"
                                checked={followRequired}
                                onChange={(e) => setFollowRequired(e.target.checked)}
                            />
                            <Label htmlFor="followRequired" className="text-xs">Require user to follow you before receiving reply</Label>
                        </div>
                        {followRequired && (
                            <div className="space-y-1">
                                <Label htmlFor="cooldown" className="text-[10px] uppercase font-bold text-indigo-600">Retry Cooldown (Hours)</Label>
                                <Input
                                    id="cooldown"
                                    type="number"
                                    value={cooldownHours}
                                    onChange={(e) => setCooldownHours(parseInt(e.target.value))}
                                    className="h-8"
                                />
                            </div>
                        )}
                    </div>

                    <div className="space-y-4 border-t pt-4">
                        <div className="space-y-2">
                            <Label htmlFor="attachmentType">Reply With Attachment</Label>
                            <select
                                id="attachmentType"
                                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                value={attachmentType}
                                onChange={(e) => setAttachmentType(e.target.value)}
                            >
                                <option value="none">None (Text Only)</option>
                                <option value="product">Product Link</option>
                                <option value="pdf">PDF Guide</option>
                                <option value="booking">Booking Link</option>
                                <option value="custom">Custom Link</option>
                            </select>
                        </div>

                        {attachmentType !== 'none' && (
                            <div className="space-y-2">
                                <Label htmlFor="attachmentId">Destination {attachmentType === 'product' ? 'Product ID' : 'URL'}</Label>
                                <Input
                                    id="attachmentId"
                                    value={attachmentId}
                                    onChange={(e) => setAttachmentId(e.target.value)}
                                    placeholder={attachmentType === 'product' ? 'mongo_id_of_product' : 'https://...'}
                                />
                            </div>
                        )}
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="response">Response Message</Label>
                        <Textarea
                            id="response"
                            value={response}
                            onChange={(e) => setResponse(e.target.value)}
                            placeholder="Hey! Thanks for your message. Here is the link..."
                            rows={4}
                        />
                        <p className="text-[10px] text-muted-foreground italic">Use {"{{name}}"} for personalization.</p>
                    </div>

                    <div className="flex justify-end pt-4">
                        <Button type="submit" disabled={loading}>
                            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            {rule ? 'Save Changes' : 'Create Rule'}
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
}
