'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import {
    Loader2, ArrowLeft, Send, Calendar, Save, Eye,
    Mail, Layout, Users, Zap, CheckCircle2, ChevronRight,
    Edit3, Sparkles
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import ReactMarkdown from 'react-markdown';
import { cn } from '@/lib/utils';
import RichTextEditor from '@/components/dashboard/RichTextEditor';
import { sanitizeHtml } from '@/lib/utils/sanitizer';

export default function NewCampaignPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [fetching, setFetching] = useState(true);
    const [lists, setLists] = useState<any[]>([]);
    const [totalSubscribers, setTotalSubscribers] = useState(0);
    const [recipientCount, setRecipientCount] = useState(0);
    const [testEmail, setTestEmail] = useState('');
    const [sendingTest, setSendingTest] = useState(false);

    const [name, setName] = useState('');
    const [subject, setSubject] = useState('');
    const [listId, setListId] = useState('all');
    const [content, setContent] = useState('');
    const [scheduledAt, setScheduledAt] = useState('');
    const [activeView, setActiveView] = useState<'edit' | 'preview'>('edit');

    // Fetch initial data
    useEffect(() => {
        const init = async () => {
            try {
                const [listsRes, subsRes] = await Promise.all([
                    fetch('/api/creator/email/lists'),
                    fetch('/api/creator/email/subscribers/count?listId=all')
                ]);

                if (listsRes.ok) {
                    const data = await listsRes.json();
                    setLists(data.lists || []);
                }

                if (subsRes.ok) {
                    const data = await subsRes.json();
                    setTotalSubscribers(data.count || 0);
                    setRecipientCount(data.count || 0);
                }
            } catch (error) {
                console.error(error);
                toast.error('Failed to load recipient lists');
            } finally {
                setFetching(false);
            }
        };
        init();
    }, []);

    // Update recipient count when list changes
    useEffect(() => {
        const updateCount = async () => {
            try {
                const res = await fetch(`/api/creator/email/subscribers/count?listId=${listId}`);
                if (res.ok) {
                    const data = await res.json();
                    setRecipientCount(data.count);
                }
            } catch (err) {
                console.error('Failed to update recipient count', err);
            }
        };
        if (!fetching) updateCount();
    }, [listId, fetching]);

    const handleSendTest = async () => {
        if (!testEmail) {
            toast.error("Enter a mission-critical email address");
            return;
        }
        if (!subject || !content) {
            toast.error("Subject and Content required for simulation");
            return;
        }

        setSendingTest(true);
        try {
            const res = await fetch('/api/creator/email/campaigns/test', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ testEmail, subject, content })
            });

            if (res.ok) {
                toast.success('Test artifact delivered to your inbox');
            } else {
                const data = await res.json();
                throw new Error(data.error || 'Simulation failed');
            }
        } catch (error: any) {
            toast.error(error.message);
        } finally {
            setSendingTest(false);
        }
    };

    const handleSubmit = async (e?: React.FormEvent, isDraft = false, forceSendNow = false) => {
        if (e) e.preventDefault();

        if (!name || !subject || !content) {
            toast.error("Please fill in all required fields");
            return;
        }

        if (!isDraft && recipientCount === 0) {
            toast.error("Cannot deploy to zero-recipient target");
            return;
        }

        setLoading(true);
        const finalScheduledAt = forceSendNow ? new Date().toISOString() : (scheduledAt ? new Date(scheduledAt).toISOString() : undefined);

        try {
            const payload = {
                name,
                subject: subject.trim(),
                content,
                listId: listId === 'all' ? undefined : listId,
                scheduledAt: finalScheduledAt,
                status: isDraft ? 'draft' : (finalScheduledAt ? 'scheduled' : 'draft')
            };

            const res = await fetch('/api/creator/email/campaign', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Failed to create campaign');

            toast.success(isDraft ? 'Campaign preserved as draft' : 'Campaign deployed successfully');
            router.push('/dashboard/email/campaigns');
        } catch (error: any) {
            toast.error(error.message);
        } finally {
            setLoading(false);
        }
    };

    if (fetching) {
        return (
            <div className="h-[80vh] flex flex-col items-center justify-center gap-4">
                <Loader2 className="w-10 h-10 text-indigo-500 animate-spin" />
                <p className="text-[10px] font-black uppercase tracking-[0.3em] text-zinc-600 italic">Initializing Composer...</p>
            </div>
        );
    }

    return (
        <div className="max-w-[1600px] mx-auto space-y-10 pb-20 animate-in fade-in duration-700">
            {/* Header */}
            <header className="flex flex-col md:flex-row md:items-end justify-between gap-8">
                <div className="space-y-4">
                    <button
                        onClick={() => router.back()}
                        className="group flex items-center gap-2 text-zinc-600 hover:text-white transition-colors"
                    >
                        <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                        <span className="text-[10px] font-black uppercase tracking-widest italic">Back to campaigns</span>
                    </button>
                    <h1 className="text-5xl font-black text-white italic uppercase tracking-tighter flex items-center gap-4">
                        <Mail className="w-12 h-12 text-indigo-500 fill-indigo-500/20 shadow-[0_0_30px_rgba(99,102,241,0.4)]" />
                        New Campaign
                    </h1>
                    <p className="text-[10px] font-black text-zinc-600 uppercase tracking-[0.4em]">
                        Email Architecture • Audience Reach • Conversion Engine
                    </p>
                </div>

                <div className="flex items-center gap-4">
                    <button
                        onClick={(e) => handleSubmit(e, true)}
                        disabled={loading}
                        className="bg-zinc-900/50 text-zinc-400 border border-white/5 rounded-full h-14 px-8 uppercase text-[10px] font-black tracking-[0.2em] italic hover:text-white hover:border-white/10 transition-all flex items-center gap-3"
                    >
                        <Save className="w-4 h-4" />
                        PRESERVE DRAFT
                    </button>
                    <button
                        onClick={(e) => handleSubmit(e, false, !scheduledAt)}
                        disabled={loading || recipientCount === 0}
                        className="bg-white text-black rounded-full h-14 px-10 uppercase text-[10px] font-black tracking-[0.2em] italic shadow-2xl shadow-indigo-500/10 hover:scale-105 transition-all flex items-center gap-3 group disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                    >
                        {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : (
                            <>
                                {scheduledAt ? <Calendar className="w-4 h-4" /> : <Send className="w-4 h-4" />}
                                {scheduledAt ? 'SCHEDULE MISSION' : 'DEPLOY NOW'}
                                <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                            </>
                        )}
                    </button>
                </div>
            </header>

            {/* Mobile View Toggles */}
            <div className="flex md:hidden bg-zinc-900/50 p-1 rounded-2xl border border-white/5">
                <button
                    onClick={() => setActiveView('edit')}
                    className={cn(
                        "flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest italic transition-all",
                        activeView === 'edit' ? "bg-white text-black shadow-xl" : "text-zinc-500"
                    )}
                >
                    EDITOR
                </button>
                <button
                    onClick={() => setActiveView('preview')}
                    className={cn(
                        "flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest italic transition-all",
                        activeView === 'preview' ? "bg-white text-black shadow-xl" : "text-zinc-500"
                    )}
                >
                    PREVIEW
                </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                {/* Left Column: Editor */}
                <div className={cn(
                    "space-y-10 transition-all duration-500",
                    activeView === 'preview' ? "hidden lg:block" : "block"
                )}>
                    <section className="bg-zinc-900/20 backdrop-blur-2xl border border-white/5 rounded-[3rem] p-10 space-y-10 shadow-inner">
                        <div className="space-y-8">
                            <div className="flex items-center gap-3">
                                <Edit3 className="w-4 h-4 text-indigo-500" />
                                <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500 italic">Configuration Parameters</h3>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <div className="space-y-3">
                                    <label className="text-[10px] font-black text-zinc-700 uppercase tracking-widest ml-1 italic">Internal ID</label>
                                    <input
                                        type="text"
                                        placeholder="E.G. FEB_NEWSLETTER_01"
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                        className="w-full bg-black/40 border border-white/5 rounded-2xl py-4 px-6 text-sm font-bold text-white placeholder:text-zinc-800 focus:border-indigo-500/50 transition-all outline-none italic"
                                    />
                                </div>

                                <div className="space-y-3">
                                    <label className="text-[10px] font-black text-zinc-700 uppercase tracking-widest ml-1 italic">Target Audience</label>
                                    <select
                                        value={listId}
                                        onChange={(e) => setListId(e.target.value)}
                                        className="w-full bg-black/40 border border-white/5 rounded-2xl py-4 px-6 text-sm font-bold text-white focus:border-indigo-500/50 transition-all outline-none italic appearance-none cursor-pointer"
                                    >
                                        <option value="all">GLOBAL: ALL SUBSCRIBERS ({totalSubscribers})</option>
                                        {lists.map(list => (
                                            <option key={list._id} value={list._id}>
                                                LIST: {list.name.toUpperCase()} ({list.subscriberCount || 0})
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <div className="space-y-3">
                                <label className="text-[10px] font-black text-zinc-700 uppercase tracking-widest ml-1 italic">Engagement Subject</label>
                                <input
                                    type="text"
                                    placeholder="Enter your high-impact subject line..."
                                    value={subject}
                                    onChange={(e) => setSubject(e.target.value)}
                                    className="w-full bg-black/40 border border-white/5 rounded-2xl py-5 px-8 text-xl font-black text-white placeholder:text-zinc-800 focus:border-indigo-500/50 transition-all outline-none italic tracking-tight"
                                />
                            </div>

                            <div className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <label className="text-[10px] font-black text-zinc-700 uppercase tracking-widest ml-1 italic">Content Architecture</label>
                                    <div className="flex items-center gap-2 px-3 py-1 bg-white/5 rounded-lg border border-white/5">
                                        <Sparkles className="w-3 h-3 text-indigo-400" />
                                        <span className="text-[8px] font-black text-zinc-500 uppercase tracking-tighter">Rich Editor Enabled</span>
                                    </div>
                                </div>
                                <div className="min-h-[500px]">
                                    <RichTextEditor
                                        content={content}
                                        onChange={(html) => setContent(html)}
                                        placeholder="START COMPOSING YOUR MASTERPIECE..."
                                    />
                                </div>
                            </div>

                            <div className="pt-6 border-t border-white/5 space-y-6">
                                <div className="max-w-xs space-y-3">
                                    <label className="text-[10px] font-black text-zinc-700 uppercase tracking-widest ml-1 italic flex items-center gap-2">
                                        <Calendar className="w-3 h-3" /> Execution Schedule
                                    </label>
                                    <input
                                        type="datetime-local"
                                        value={scheduledAt}
                                        onChange={(e) => setScheduledAt(e.target.value)}
                                        className="w-full bg-black/40 border border-white/5 rounded-2xl py-4 px-6 text-sm font-bold text-white focus:border-indigo-500/50 transition-all outline-none italic"
                                    />
                                    <p className="text-[9px] text-zinc-600 font-black uppercase tracking-widest italic ml-1">Optional: Leave blank for immediate deployment.</p>
                                </div>
                            </div>
                        </div>
                    </section>

                    {/* Test Email Section */}
                    <section className="bg-zinc-900/20 backdrop-blur-2xl border border-white/5 rounded-[3rem] p-10 space-y-6">
                        <div className="flex items-center gap-3">
                            <Zap className="w-4 h-4 text-indigo-400" />
                            <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500 italic">Campaign Simulation</h3>
                        </div>
                        <div className="flex gap-4">
                            <input
                                type="email"
                                placeholder="YOUR-TEST-EMAIL@GMAIL.COM"
                                value={testEmail}
                                onChange={(e) => setTestEmail(e.target.value)}
                                className="flex-1 bg-black/40 border border-white/5 rounded-2xl py-4 px-6 text-xs font-bold text-white placeholder:text-zinc-800 focus:border-indigo-500/50 transition-all outline-none italic"
                            />
                            <button
                                onClick={handleSendTest}
                                disabled={sendingTest || !testEmail || !subject || !content}
                                className="bg-indigo-600 text-white rounded-2xl px-6 text-[10px] font-black uppercase tracking-widest italic hover:bg-indigo-500 transition-all disabled:opacity-30 flex items-center gap-2 whitespace-nowrap"
                            >
                                {sendingTest ? <Loader2 className="w-3 h-3 animate-spin" /> : <Send className="w-3 h-3" />}
                                SEND TEST
                            </button>
                        </div>
                    </section>
                </div>

                {/* Right Column: Preview */}
                <div className={cn(
                    "space-y-10 transition-all duration-500",
                    activeView === 'edit' ? "hidden lg:block" : "block"
                )}>
                    <section className="bg-zinc-900/10 backdrop-blur-2xl border border-white/5 rounded-[3rem] p-10 flex flex-col h-full shadow-inner relative overflow-hidden group">
                        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/5 blur-[100px] -z-10 group-hover:bg-indigo-500/10 transition-all duration-1000" />

                        <div className="space-y-8 flex-1">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <Eye className="w-4 h-4 text-emerald-500" />
                                    <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500 italic">Live Simulation</h3>
                                </div>
                                <div className="text-[9px] font-black text-zinc-700 uppercase tracking-widest italic">WYSIWYG Mode</div>
                            </div>

                            {/* Email Container Simulation */}
                            <div className="bg-black/40 border border-white/5 rounded-[2rem] overflow-hidden shadow-2xl flex flex-col min-h-[600px] h-full">
                                <div className="p-8 border-b border-white/5 bg-white/[0.02]">
                                    <div className="flex items-center gap-4 mb-4">
                                        <div className="w-10 h-10 rounded-full bg-indigo-500/20 flex items-center justify-center text-indigo-400 italic font-black text-xs border border-indigo-500/10">C</div>
                                        <div className="space-y-1">
                                            <p className="text-[10px] font-black text-white italic tracking-tight">{subject || "No Subject Defined"}</p>
                                            <p className="text-[9px] text-zinc-600 font-bold tracking-widest">From: Creatorly Team • To: {listId === 'all' ? 'Entire Audience' : 'Segmented List'}</p>
                                        </div>
                                    </div>
                                </div>
                                <div className="p-10 flex-1 overflow-y-auto scrollbar-hide bg-white/5">
                                    <div className="max-w-none prose prose-invert prose-indigo prose-sm sm:prose-base font-sans leading-relaxed text-zinc-300">
                                        {content ? (
                                            <div dangerouslySetInnerHTML={{ __html: sanitizeHtml(content.replace(/\{\{first_name\}\}/g, 'Subscriber')) }} />
                                        ) : (
                                            <div className="h-full flex flex-col items-center justify-center text-center space-y-4 py-20 opacity-20">
                                                <Edit3 className="w-12 h-12" />
                                                <p className="text-[10px] font-black uppercase tracking-[0.3em]">Content Pipeline Exhausted</p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                                <div className="p-8 border-t border-white/5 bg-black/40 text-[9px] text-zinc-700 font-black uppercase tracking-widest text-center italic">
                                    © 2026 CREATORLY • ALL RIGHTS RESERVED • UNSUBSCRIBE
                                </div>
                            </div>
                        </div>

                        {/* Audience Reach Estimate */}
                        <div className="mt-8 p-6 bg-indigo-500/5 rounded-[2rem] border border-indigo-500/10 flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <Users className="w-5 h-5 text-indigo-400" />
                                <div>
                                    <p className="text-[10px] font-black text-white italic uppercase tracking-widest">Estimated Impact</p>
                                    <p className="text-[9px] text-zinc-500 font-bold uppercase tracking-wider">{recipientCount} Potential Eyes</p>
                                </div>
                            </div>
                            <div className="w-12 h-12 rounded-2xl bg-indigo-500/20 flex items-center justify-center">
                                {recipientCount > 0 ? (
                                    <CheckCircle2 className="w-5 h-5 text-indigo-400" />
                                ) : (
                                    <Edit3 className="w-5 h-5 text-zinc-700" />
                                )}
                            </div>
                        </div>
                    </section>
                </div>
            </div>
        </div>
    );
}
