'use client';

import { useState, useEffect } from 'react';
import {
    Dialog, DialogContent, DialogHeader,
    DialogTitle, DialogTrigger, DialogFooter
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
    Select, SelectContent, SelectItem,
    SelectTrigger, SelectValue
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { toast } from 'react-hot-toast';
import {
    Loader2, Plus, Edit2, Zap,
    AtSign, Link, MessageSquare,
    ChevronRight, Shield, Trash2,
    CheckCircle2, History
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface AutomationRuleModalProps {
    rule?: any;
    onSuccess: () => void;
    children?: React.ReactNode;
}

export function AutomationRuleModal({ rule, onSuccess, children }: AutomationRuleModalProps) {
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [products, setProducts] = useState<any[]>([]);

    // Form state matching AutoDMRule
    const [formData, setFormData] = useState({
        name: '',
        keyword: '',
        matchType: 'contains',
        caseSensitive: false,
        dmMessage: '',
        link: '',
        productId: '',
        isActive: true,
        dmOncePerUser: true,
        dailyLimit: 500,
        commentReplies: [{ text: '' }],
        followGate: {
            enabled: false,
            replyToNonFollower: 'Follow us first @{{name}} then comment again 🙏',
            dmAfterFollow: "Thanks for following! Here's your gift 🎁 {{link}}",
            checkDurationHours: 24
        }
    });

    useEffect(() => {
        if (open) {
            fetchProducts();
            if (rule) {
                setFormData({
                    name: rule.name || '',
                    keyword: rule.keyword || '',
                    matchType: rule.matchType || 'contains',
                    caseSensitive: rule.caseSensitive || false,
                    dmMessage: rule.dmMessage || '',
                    link: rule.link || '',
                    productId: rule.productId || '',
                    isActive: rule.isActive !== undefined ? rule.isActive : true,
                    dmOncePerUser: rule.dmOncePerUser !== undefined ? rule.dmOncePerUser : true,
                    dailyLimit: rule.dailyLimit || 500,
                    commentReplies: rule.commentReplies?.length > 0 ? rule.commentReplies : [{ text: '' }],
                    followGate: {
                        enabled: rule.followGate?.enabled || false,
                        replyToNonFollower: rule.followGate?.replyToNonFollower || 'Follow us first @{{name}} then comment again 🙏',
                        dmAfterFollow: rule.followGate?.dmAfterFollow || "Thanks for following! Here's your gift 🎁 {{link}}",
                        checkDurationHours: rule.followGate?.checkDurationHours || 24
                    }
                });
            } else {
                setFormData({
                    name: '',
                    keyword: '',
                    matchType: 'contains',
                    caseSensitive: false,
                    dmMessage: '',
                    link: '',
                    productId: '',
                    isActive: true,
                    dmOncePerUser: true,
                    dailyLimit: 500,
                    commentReplies: [{ text: '' }],
                    followGate: {
                        enabled: false,
                        replyToNonFollower: 'Follow us first @{{name}} then comment again 🙏',
                        dmAfterFollow: "Thanks for following! Here's your gift 🎁 {{link}}",
                        checkDurationHours: 24
                    }
                });
            }
        }
    }, [open, rule]);

    const fetchProducts = async () => {
        try {
            const res = await fetch('/api/creator/products');
            const data = await res.json();
            setProducts(Array.isArray(data) ? data : (data.products || []));
        } catch (error) {
            console.error('Failed to fetch products');
        }
    };

    const handleAddReply = () => {
        setFormData(prev => ({
            ...prev,
            commentReplies: [...prev.commentReplies, { text: '' }]
        }));
    };

    const handleRemoveReply = (index: number) => {
        setFormData(prev => ({
            ...prev,
            commentReplies: prev.commentReplies.filter((_, i) => i !== index)
        }));
    };

    const handleReplyChange = (index: number, text: string) => {
        const newReplies = [...formData.commentReplies];
        newReplies[index] = { text };
        setFormData(prev => ({ ...prev, commentReplies: newReplies }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            const url = rule
                ? `/api/creator/autodm/rules/${rule._id}`
                : '/api/creator/autodm/rules';

            const method = rule ? 'PUT' : 'POST';

            // Clean up empty replies
            const cleanReplies = formData.commentReplies.filter(r => r.text.trim());

            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ...formData, commentReplies: cleanReplies })
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Failed to save rule');

            toast.success(rule ? 'Automation rule refined' : 'Automation rule deployed');
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
                {children}
            </DialogTrigger>
            <DialogContent className="sm:max-w-[700px] h-[90vh] overflow-y-auto bg-zinc-950 border-white/5 p-0 rounded-[3rem]">
                <form onSubmit={handleSubmit} className="flex flex-col h-full">
                    <DialogHeader className="p-10 border-b border-white/5 pb-8">
                        <DialogTitle className="text-3xl font-black text-white italic uppercase tracking-tighter flex items-center gap-4">
                            <Zap className="w-8 h-8 text-indigo-500 fill-indigo-500/20" />
                            {rule ? 'REFINE AUTOMATION' : 'DEPLOY AUTOMATION'}
                        </DialogTitle>
                        <p className="text-[10px] font-black text-zinc-600 uppercase tracking-[0.3em] mt-2 italic">
                            Rule Architecture • Logic Configuration • Trigger Parameters
                        </p>
                    </DialogHeader>

                    <div className="flex-1 p-10 space-y-12">
                        {/* Section 1: Identity & Trigger */}
                        <section className="space-y-8">
                            <div className="flex items-center gap-4">
                                <div className="p-3 bg-white/5 rounded-2xl border border-white/10">
                                    <AtSign className="w-5 h-5 text-indigo-400" />
                                </div>
                                <h3 className="text-lg font-black text-white italic uppercase tracking-tight font-black italic uppercase tracking-tight">TRIGGER CONFIGURATION</h3>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <div className="space-y-3">
                                    <Label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-1">Internal Name</Label>
                                    <Input
                                        value={formData.name}
                                        onChange={e => setFormData({ ...formData, name: e.target.value })}
                                        className="bg-zinc-900/50 border-white/10 rounded-2xl h-14 px-6 text-white font-black italic focus:ring-indigo-500/20"
                                        placeholder="E.G. SUMMER_GIVEAWAY_24"
                                    />
                                </div>
                                <div className="space-y-3">
                                    <Label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-1">Trigger Keyword</Label>
                                    <Input
                                        value={formData.keyword}
                                        onChange={e => setFormData({ ...formData, keyword: e.target.value })}
                                        className="bg-zinc-900/50 border-white/10 rounded-2xl h-14 px-6 text-white font-black italic focus:ring-indigo-500/20"
                                        placeholder="SENDME"
                                        required
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <div className="space-y-3">
                                    <Label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-1">Match Algorithm</Label>
                                    <Select
                                        value={formData.matchType}
                                        onValueChange={(val: any) => setFormData({ ...formData, matchType: val })}
                                    >
                                        <SelectTrigger className="bg-zinc-900/50 border-white/10 rounded-2xl h-14 px-6 text-white font-black italic focus:ring-indigo-500/20">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent className="bg-zinc-900 border-white/10 text-white font-black italic">
                                            <SelectItem value="contains">CONTAINS KEYWORD</SelectItem>
                                            <SelectItem value="exact">EXACT MATCH</SelectItem>
                                            <SelectItem value="startsWith">STARTS WITH</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="flex items-center justify-between p-6 bg-white/5 rounded-2xl border border-white/5">
                                    <div className="space-y-1">
                                        <Label className="text-xs font-black text-white uppercase italic tracking-wider">Case Sensitive</Label>
                                        <p className="text-[9px] font-black text-zinc-500 uppercase tracking-widest">STRICT CHARACTER MATCHING</p>
                                    </div>
                                    <Switch
                                        checked={formData.caseSensitive}
                                        onCheckedChange={val => setFormData({ ...formData, caseSensitive: val })}
                                    />
                                </div>
                            </div>
                        </section>

                        {/* Section 2: Artifact Delivery */}
                        <section className="space-y-8">
                            <div className="flex items-center gap-4">
                                <div className="p-3 bg-white/5 rounded-2xl border border-white/10">
                                    <MessageSquare className="w-5 h-5 text-indigo-400" />
                                </div>
                                <h3 className="text-lg font-black text-white italic uppercase tracking-tight">ARTIFACT DELIVERY (DM)</h3>
                            </div>

                            <div className="space-y-3">
                                <Label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-1">Direct Message Payload</Label>
                                <Textarea
                                    value={formData.dmMessage}
                                    onChange={e => setFormData({ ...formData, dmMessage: e.target.value })}
                                    className="w-full bg-zinc-900/50 border-white/10 rounded-[2rem] px-8 py-6 text-white font-black italic focus:ring-indigo-500/20 focus:outline-none focus:border-indigo-500/30 transition-all resize-none placeholder:text-zinc-700 min-h-[150px]"
                                    placeholder="HEY {{name}}! INITIALIZING DOWNLOAD SEQUENCE..."
                                    required
                                />
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <div className="space-y-3">
                                    <Label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-1">External Link Artifact</Label>
                                    <div className="relative">
                                        <Link className="absolute left-6 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-600" />
                                        <Input
                                            value={formData.link}
                                            onChange={e => setFormData({ ...formData, link: e.target.value })}
                                            className="bg-zinc-900/50 border-white/10 rounded-2xl h-14 pl-14 pr-6 text-white font-black italic focus:ring-indigo-500/20"
                                            placeholder="HTTPS://CREATORLY.IN/ACCESS/..."
                                        />
                                    </div>
                                </div>
                                <div className="space-y-3">
                                    <Label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-1">Linked Product</Label>
                                    <Select
                                        value={formData.productId}
                                        onValueChange={(val: any) => setFormData({ ...formData, productId: val })}
                                    >
                                        <SelectTrigger className="bg-zinc-900/50 border-white/10 rounded-2xl h-14 px-6 text-white font-black italic focus:ring-indigo-500/20">
                                            <SelectValue placeholder="SELECT ARTIFACT" />
                                        </SelectTrigger>
                                        <SelectContent className="bg-zinc-900 border-white/10 text-white font-black italic max-h-[200px]">
                                            <SelectItem value="none">NONE</SelectItem>
                                            {products.map(p => (
                                                <SelectItem key={p._id} value={p._id}>{p.title?.toUpperCase()}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                        </section>

                        {/* Section 3: Comment Replies */}
                        <section className="space-y-8">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                    <div className="p-3 bg-white/5 rounded-2xl border border-white/10">
                                        <History className="w-5 h-5 text-indigo-400" />
                                    </div>
                                    <h3 className="text-lg font-black text-white italic uppercase tracking-tight">COMMENT RESPONSE VARIANTS</h3>
                                </div>
                                <Button
                                    type="button"
                                    onClick={handleAddReply}
                                    className="bg-white/5 border border-white/10 text-zinc-400 hover:text-white rounded-full h-10 px-4 uppercase text-[8px] font-black tracking-widest italic"
                                >
                                    <Plus size={12} className="mr-2" /> ADD VARIANT
                                </Button>
                            </div>

                            <div className="space-y-4">
                                {formData.commentReplies.map((reply, index) => (
                                    <div key={index} className="group relative">
                                        <Input
                                            value={reply.text}
                                            onChange={e => handleReplyChange(index, e.target.value)}
                                            className="bg-zinc-900/50 border-white/10 rounded-2xl h-16 pl-8 pr-16 text-white font-black italic focus:ring-indigo-500/20"
                                            placeholder={`VARIANT ${index + 1}: HEY {{name}}, SENT YOU A DM! CHECK IT OUT.`}
                                        />
                                        {formData.commentReplies.length > 1 && (
                                            <Button
                                                type="button"
                                                size="icon"
                                                variant="ghost"
                                                onClick={() => handleRemoveReply(index)}
                                                className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-700 hover:text-red-500 hover:bg-transparent"
                                            >
                                                <Trash2 size={16} />
                                            </Button>
                                        )}
                                    </div>
                                ))}
                                <p className="text-[9px] font-black text-zinc-600 uppercase tracking-widest ml-4">Anti-Spam Rotation: System will alternate between variants to maintain account health.</p>
                            </div>
                        </section>

                        {/* Section 4: Advanced Gates */}
                        <section className="bg-indigo-500/5 rounded-[2.5rem] border border-indigo-500/10 p-10 space-y-10 group overflow-hidden relative">
                            <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/5 blur-[100px] -mr-32 -mt-32 rounded-full" />
                            <div className="flex items-center justify-between relative z-10">
                                <div className="flex items-center gap-4">
                                    <div className="p-3 bg-indigo-500/10 rounded-2xl border border-indigo-500/20">
                                        <Shield className="w-5 h-5 text-indigo-400" />
                                    </div>
                                    <div>
                                        <h3 className="text-lg font-black text-white italic uppercase tracking-tight">FOLLOW GATE LOGIC</h3>
                                        <p className="text-[9px] font-black text-zinc-500 uppercase tracking-widest mt-1">Growth sequence requirement</p>
                                    </div>
                                </div>
                                <Switch
                                    checked={formData.followGate.enabled}
                                    onCheckedChange={val => setFormData({
                                        ...formData,
                                        followGate: { ...formData.followGate, enabled: val }
                                    })}
                                />
                            </div>

                            {formData.followGate.enabled && (
                                <div className="space-y-8 animate-in slide-in-from-top-4 duration-500 relative z-10">
                                    <div className="space-y-3">
                                        <Label className="text-[10px] font-black text-indigo-400/70 uppercase tracking-widest ml-1">Follow Required Prompt (Comment Reply)</Label>
                                        <Input
                                            value={formData.followGate.replyToNonFollower}
                                            onChange={e => setFormData({
                                                ...formData,
                                                followGate: { ...formData.followGate, replyToNonFollower: e.target.value }
                                            })}
                                            className="bg-black/40 border-indigo-500/20 rounded-2xl h-14 px-6 text-white font-black italic focus:ring-indigo-500/20"
                                        />
                                    </div>
                                    <div className="space-y-3">
                                        <Label className="text-[10px] font-black text-indigo-400/70 uppercase tracking-widest ml-1">Post-Follow DM Delivery</Label>
                                        <Input
                                            value={formData.followGate.dmAfterFollow}
                                            onChange={e => setFormData({
                                                ...formData,
                                                followGate: { ...formData.followGate, dmAfterFollow: e.target.value }
                                            })}
                                            className="bg-black/40 border-indigo-500/20 rounded-2xl h-14 px-6 text-white font-black italic focus:ring-indigo-500/20"
                                        />
                                    </div>
                                </div>
                            )}
                        </section>
                    </div>

                    <DialogFooter className="p-10 border-t border-white/5 bg-zinc-900/20 rounded-b-[3rem]">
                        <Button
                            type="button"
                            variant="ghost"
                            onClick={() => setOpen(false)}
                            className="text-zinc-500 hover:text-white font-black uppercase tracking-widest italic"
                        >
                            ABORT MISSION
                        </Button>
                        <Button
                            type="submit"
                            disabled={loading}
                            className="h-16 px-12 bg-white text-black font-black uppercase text-xs tracking-[0.2em] italic rounded-[2rem] hover:scale-105 transition-all shadow-2xl shadow-white/5"
                        >
                            {loading ? <Loader2 className="w-5 h-5 animate-spin mr-3" /> : <CheckCircle2 className="w-4 h-4 mr-3" />}
                            {rule ? 'SYNC PARAMETERS' : 'DEPLOY SEQUENCE'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
