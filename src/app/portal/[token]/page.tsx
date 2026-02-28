'use client';

/* eslint-disable react-hooks/exhaustive-deps, react/no-unescaped-entities, @next/next/no-img-element, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars, prefer-const, import/no-anonymous-default-export */

import React, { useState, useEffect } from 'react';
import {
    CheckCircle2, Clock, Calendar,
    Download, MessageSquare, Shield,
    ExternalLink, Check, ArrowRight,
    Package, History, Star
} from 'lucide-react';
import { useParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';


interface Comment {
    sender: 'Creator' | 'Client';
    content: string;
    timestamp: Date | string;
}

interface Deliverable {
    _id: string;
    name: string;
    description?: string;
    fileUrl: string;
    versionNumber: number;
    status: 'Pending' | 'Approved' | 'Revision Requested';
    comments: Comment[];
}

export default function ClientPortalPage() {
    const { token } = useParams();
    const [loading, setLoading] = useState(true);
    const [data, setData] = useState<any>(null);
    const [activeTab, setActiveTab] = useState<'overview' | 'deliverables' | 'messages'>('overview');

    async function fetchPortalData() {
        try {
            const res = await fetch(`/api/portal/${token}`);
            const portalData = await res.json();
            setData(portalData);
        } catch (error) {
            console.error('Failed to load portal:', error);
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        fetchPortalData();
    }, [token]);

    const handleApprove = async (delId: string) => {
        try {
            await fetch(`/api/portal/${token}`, {
                method: 'PATCH',
                body: JSON.stringify({ action: 'approve_deliverable', deliverableId: delId })
            });
            fetchPortalData(); // Refresh
        } catch (error) {
            console.error('Approval failed:', error);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-[#030303]">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-12 h-12 border-4 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin" />
                    <p className="text-zinc-500 font-black text-[10px] uppercase tracking-widest">Entering Portal...</p>
                </div>
            </div>
        );
    }

    if (!data?.project) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-[#030303] p-8 text-center">
                <div className="max-w-md space-y-6">
                    <div className="w-20 h-20 bg-red-500/10 rounded-[2rem] flex items-center justify-center mx-auto text-red-500">
                        <Shield className="w-10 h-10" />
                    </div>
                    <h1 className="text-2xl font-black text-white">Invalid Access Token</h1>
                    <p className="text-zinc-500 text-sm">This portal link is invalid or has expired. Please contact the creator for a new link.</p>
                </div>
            </div>
        );
    }

    const { project, tasks, deliverables } = data;

    return (
        <div className="min-h-screen bg-[#030303] text-zinc-400 font-sans">
            {/* Top Branding Bar */}
            <div className="border-b border-white/5 bg-[#030303]/80 backdrop-blur-xl sticky top-0 z-50">
                <div className="max-w-7xl mx-auto px-8 py-6 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl flex items-center justify-center text-white font-black text-sm">
                            {project.creatorId?.brandName?.substring(0, 1) || 'C'}
                        </div>
                        <div>
                            <h2 className="text-white font-black tracking-tight">{project.creatorId?.brandName || 'Creator Portal'}</h2>
                            <p className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Project Workspace</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-8">
                        <div className="hidden md:flex items-center gap-6 text-[10px] font-black uppercase tracking-widest">
                            <button onClick={() => setActiveTab('overview')} className={`hover:text-white transition-colors ${activeTab === 'overview' ? 'text-white' : 'text-zinc-600'}`}>Overview</button>
                            <button onClick={() => setActiveTab('deliverables')} className={`hover:text-white transition-colors ${activeTab === 'deliverables' ? 'text-white' : 'text-zinc-600'}`}>Deliverables</button>
                            <button onClick={() => setActiveTab('messages')} className={`hover:text-white transition-colors ${activeTab === 'messages' ? 'text-white' : 'text-zinc-600'}`}>Messages</button>
                        </div>
                        <div className="h-8 w-px bg-white/5" />
                        <div className="flex items-center gap-3">
                            <img className="w-8 h-8 rounded-full border border-white/10" src={project.clientId?.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${project._id}`} alt="" />
                            <span className="text-xs font-black text-white tracking-tight hidden sm:block">Client Member</span>
                        </div>
                    </div>
                </div>
            </div>

            <main className="max-w-7xl mx-auto px-8 py-12 space-y-12">
                {/* Hero / Header */}
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-8">
                    <div className="space-y-4">
                        <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-emerald-500/10 rounded-full border border-emerald-500/20 text-emerald-500 text-[10px] font-black uppercase tracking-widest">
                            <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
                            {project.status}
                        </div>
                        <h1 className="text-5xl font-black text-white tracking-tight">{project.name}</h1>
                        <p className="text-zinc-500 max-w-2xl font-medium">{project.description || 'Welcome to your dedicated project portal. Track progress and review deliverables below.'}</p>
                    </div>

                    <div className="bg-zinc-900/40 border border-white/5 p-8 rounded-[2.5rem] flex items-center gap-8 min-w-[300px]">
                        <div>
                            <p className="text-[10px] font-black uppercase tracking-widest text-zinc-600 mb-1">Target Date</p>
                            <p className="text-white font-black text-xl">{project.dueDate ? new Date(project.dueDate).toLocaleDateString() : 'N/A'}</p>
                        </div>
                        <div className="w-px h-10 bg-white/5" />
                        <div>
                            <p className="text-[10px] font-black uppercase tracking-widest text-zinc-600 mb-1">Completion</p>
                            <p className="text-white font-black text-xl">
                                {Math.round((tasks.filter((t: any) => t.status === 'Done').length / (tasks.length || 1)) * 100)}%
                            </p>
                        </div>
                    </div>
                </div>

                <AnimatePresence mode="wait">
                    {activeTab === 'overview' && (
                        <motion.div
                            key="overview"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            className="grid grid-cols-1 lg:grid-cols-12 gap-12"
                        >
                            <div className="lg:col-span-8 space-y-12">
                                <section className="space-y-6">
                                    <h3 className="text-sm font-black text-white uppercase tracking-[0.2em]">Latest Updates</h3>
                                    <div className="space-y-4">
                                        {project.activityLog?.slice(0, 3).reverse().map((log: any, i: number) => (
                                            <div key={i} className="flex gap-6 items-start group">
                                                <div className="w-10 h-10 bg-white/5 rounded-2xl flex items-center justify-center flex-shrink-0 group-hover:bg-emerald-500/10 transition-colors">
                                                    <History className="w-4 h-4 text-zinc-600 group-hover:text-emerald-500 transition-colors" />
                                                </div>
                                                <div className="pt-2">
                                                    <p className="text-zinc-300 font-medium text-sm">
                                                        <span className="text-white font-bold">{log.performedBy === 'Creator' ? project.creatorId?.brandName || 'Creator' : 'System'}</span> {log.action.replace(/_/g, ' ')}
                                                    </p>
                                                    <p className="text-[10px] font-black uppercase tracking-widest text-zinc-600 mt-1">{new Date(log.timestamp).toLocaleDateString()}</p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </section>

                                <section className="space-y-6">
                                    <h3 className="text-sm font-black text-white uppercase tracking-[0.2em]">Milestones</h3>
                                    <div className="bg-zinc-900/40 border border-white/5 rounded-[3rem] p-4 lg:p-8 space-y-4">
                                        {tasks.length > 0 ? tasks.map((task: any) => (
                                            <div key={task._id} className="flex items-center gap-6 p-6 hover:bg-white/[0.02] rounded-[2rem] transition-all">
                                                <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${task.status === 'Done' ? 'border-emerald-500 bg-emerald-500/20 text-emerald-500' : 'border-zinc-800 text-zinc-700'}`}>
                                                    {task.status === 'Done' ? <Check className="w-4 h-4" /> : <Clock className="w-4 h-4" />}
                                                </div>
                                                <div className="flex-1">
                                                    <p className={`font-bold transition-colors ${task.status === 'Done' ? 'text-zinc-500 line-through decoration-white/10' : 'text-white'}`}>{task.title}</p>
                                                </div>
                                                <div className="text-[10px] font-black uppercase tracking-widest text-zinc-600">{task.status}</div>
                                            </div>
                                        )) : (
                                            <div className="py-12 text-center text-zinc-700 font-black uppercase tracking-widest text-xs italic">Awaiting Milestone Roadmaps</div>
                                        )}
                                    </div>
                                </section>
                            </div>

                            <div className="lg:col-span-4 space-y-8">
                                <div className="bg-gradient-to-br from-emerald-500 to-teal-600 rounded-[3rem] p-10 text-white shadow-2xl shadow-emerald-500/20">
                                    <Star className="w-10 h-10 mb-6" />
                                    <h3 className="text-2xl font-black mb-2 tracking-tight">Need Support?</h3>
                                    <p className="text-emerald-100 text-sm font-medium mb-8 leading-relaxed">Have questions about the current deliverables or timeline? Message us directly.</p>
                                    <button onClick={() => setActiveTab('messages')} className="w-full bg-white text-emerald-600 font-black text-[10px] uppercase tracking-widest py-5 rounded-2xl flex items-center justify-center gap-3 hover:shadow-xl transition-all active:scale-95">
                                        Open Messenger
                                        <ArrowRight className="w-4 h-4" />
                                    </button>
                                </div>

                                <div className="bg-zinc-900/40 border border-white/5 rounded-[3rem] p-8 space-y-6">
                                    <h3 className="text-sm font-black text-white uppercase tracking-widest">Deliverables Waiting</h3>
                                    <div className="space-y-4">
                                        {deliverables.filter((d: any) => d.status === 'Pending').slice(0, 2).map((del: any) => (
                                            <div key={del._id} className="p-5 bg-white/5 rounded-2xl flex items-center justify-between group">
                                                <div className="flex items-center gap-4">
                                                    <div className="w-10 h-10 bg-emerald-500/10 rounded-xl flex items-center justify-center text-emerald-500">
                                                        <Package className="w-5 h-5" />
                                                    </div>
                                                    <div>
                                                        <p className="text-xs font-bold text-white mb-0.5">{del.name}</p>
                                                        <p className="text-[9px] font-black uppercase tracking-widest text-zinc-600">v{del.versionNumber}</p>
                                                    </div>
                                                </div>
                                                <button onClick={() => setActiveTab('deliverables')} className="text-zinc-600 group-hover:text-white transition-all">
                                                    <ExternalLink className="w-4 h-4" />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    )}

                    {activeTab === 'deliverables' && (
                        <motion.div
                            key="deliverables"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            className="space-y-12"
                        >
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                                {deliverables.map((del: any) => (
                                    <DeliverableCard
                                        key={del._id}
                                        del={del}
                                        onApprove={() => handleApprove(del._id)}
                                        onComment={(content, requestRevision) => {
                                            fetch(`/api/portal/${token}`, {
                                                method: 'PATCH',
                                                body: JSON.stringify({
                                                    action: 'add_comment',
                                                    deliverableId: del._id,
                                                    content,
                                                    requestRevision
                                                })
                                            }).then(() => fetchPortalData());
                                        }}
                                    />
                                ))}
                            </div>
                        </motion.div>
                    )}


                    {activeTab === 'messages' && (
                        <motion.div
                            key="messages"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            className="bg-zinc-900/40 border border-white/5 rounded-[3rem] h-[700px] flex flex-col overflow-hidden relative"
                        >
                            {/* Chat Header */}
                            <div className="p-8 border-b border-white/5 bg-white/[0.02] flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 bg-emerald-500/10 rounded-2xl flex items-center justify-center text-emerald-500">
                                        <MessageSquare className="w-6 h-6" />
                                    </div>
                                    <div>
                                        <h3 className="text-white font-black tracking-tight">Direct Support</h3>
                                        <p className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Typical response: Under 2 hours</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                                    <span className="text-[10px] font-black uppercase tracking-widest text-emerald-500/80">Online</span>
                                </div>
                            </div>

                            {/* Messages Area */}
                            <div className="flex-1 overflow-y-auto p-12 space-y-8 scrollbar-hide" id="message-container">
                                {data.messages?.length > 0 ? data.messages.map((m: any, i: number) => (
                                    <div key={i} className={`flex ${m.senderType === 'client' ? 'justify-end' : 'justify-start'}`}>
                                        <div className={`max-w-[70%] space-y-2 ${m.senderType === 'client' ? 'items-end' : 'items-start'}`}>
                                            <div className={`p-6 rounded-[2rem] text-sm leading-relaxed ${m.senderType === 'client'
                                                    ? 'bg-indigo-600 text-white rounded-tr-none shadow-xl shadow-indigo-600/10'
                                                    : 'bg-zinc-800 text-zinc-300 rounded-tl-none'
                                                }`}>
                                                {m.content}
                                            </div>
                                            <p className={`text-[9px] font-black uppercase tracking-widest text-zinc-600 ${m.senderType === 'client' ? 'text-right' : 'text-left'}`}>
                                                {m.senderName} • {new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </p>
                                        </div>
                                    </div>
                                )) : (
                                    <div className="h-full flex flex-col items-center justify-center text-center opacity-40">
                                        <div className="w-16 h-16 bg-white/5 rounded-3xl flex items-center justify-center mb-6">
                                            <MessageSquare className="w-8 h-8 text-zinc-700" />
                                        </div>
                                        <h4 className="text-white font-black mb-1">No messages yet</h4>
                                        <p className="text-xs text-zinc-500 max-w-[200px]">Start the conversation by sending a message below.</p>
                                    </div>
                                )}
                            </div>

                            {/* Input Area */}
                            <div className="p-8 bg-zinc-950/50 border-t border-white/5">
                                <form
                                    className="flex items-center gap-4"
                                    onSubmit={async (e) => {
                                        e.preventDefault();
                                        const form = e.target as HTMLFormElement;
                                        const input = form.elements.namedItem('message') as HTMLInputElement;
                                        const content = input.value;
                                        if (!content.trim()) return;

                                        input.value = '';
                                        await fetch(`/api/portal/${token}`, {
                                            method: 'PATCH',
                                            body: JSON.stringify({ action: 'send_message', content })
                                        });
                                        fetchPortalData();
                                    }}
                                >
                                    <input
                                        name="message"
                                        type="text"
                                        placeholder="Type your message to the creator..."
                                        className="flex-1 bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-sm text-white focus:border-indigo-500 outline-none transition-all"
                                    />
                                    <button
                                        type="submit"
                                        className="bg-white text-black font-black text-[10px] uppercase tracking-widest px-8 py-4 rounded-2xl hover:bg-zinc-200 transition-all active:scale-95"
                                    >
                                        Send Message
                                    </button>
                                </form>
                            </div>
                        </motion.div>
                    )}

                </AnimatePresence>
            </main>

            <footer className="max-w-7xl mx-auto px-8 py-20 border-t border-white/5 flex flex-col items-center gap-6 text-center">
                <div className="w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center text-zinc-700">
                    <Shield className="w-6 h-6" />
                </div>
                <p className="text-[10px] font-black uppercase tracking-[0.3em] text-zinc-600">Secure Client Portal powered by Creatorly</p>
                <p className="text-sm font-medium text-zinc-500 max-w-lg">&copy; {new Date().getFullYear()} {project.creatorId?.brandName || 'Creator'}. All rights reserved. Access to this workspace is restricted to authorized clients only.</p>
            </footer>
        </div>
    );
}

function DeliverableCard({ del, onApprove, onComment }: { del: Deliverable, onApprove: () => void, onComment: (content: string, requestRevision: boolean) => void }) {
    const [showComments, setShowComments] = useState(false);
    const [comment, setComment] = useState('');
    const [requestRevision, setRequestRevision] = useState(false);

    return (
        <div className="bg-zinc-900/40 border border-white/5 p-8 rounded-[3rem] hover:border-white/10 transition-all flex flex-col h-full group relative overflow-hidden">
            <div className="flex items-start justify-between mb-8">
                <div className={`w-14 h-14 rounded-[1.5rem] flex items-center justify-center transition-colors ${del.status === 'Approved' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-white/5 text-zinc-500 group-hover:text-emerald-500'}`}>
                    <Package className="w-8 h-8" />
                </div>
                <div className="flex flex-col items-end gap-2">
                    <span className="text-[10px] font-black uppercase text-zinc-600 bg-white/5 px-3 py-1 rounded-lg border border-white/5">v{del.versionNumber}</span>
                    <span className={`text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded ${del.status === 'Approved' ? 'text-emerald-500' :
                        del.status === 'Revision Requested' ? 'text-amber-500' : 'text-zinc-500'
                        }`}>{del.status}</span>
                </div>
            </div>

            <div className="flex-1 space-y-3 mb-8">
                <h3 className="text-white text-xl font-black tracking-tight">{del.name}</h3>
                <p className="text-xs font-medium text-zinc-500 leading-relaxed line-clamp-2">{del.description || 'Deliverable ready for your review.'}</p>
            </div>

            <div className="flex flex-col gap-3">
                <div className="grid grid-cols-2 gap-3">
                    <a
                        href={del.fileUrl}
                        target="_blank"
                        className="bg-zinc-800 text-white font-black text-[10px] uppercase tracking-widest py-4 rounded-2xl flex items-center justify-center gap-2 hover:bg-zinc-700 transition-all"
                    >
                        <Download className="w-3.5 h-3.5" />
                        View
                    </a>
                    <button
                        onClick={() => setShowComments(!showComments)}
                        className={`font-black text-[10px] uppercase tracking-widest py-4 rounded-2xl flex items-center justify-center gap-2 transition-all ${showComments ? 'bg-indigo-500 text-white' : 'bg-white/5 text-zinc-400 hover:text-white'}`}
                    >
                        <MessageSquare className="w-3.5 h-3.5" />
                        Feedback ({del.comments?.length || 0})
                    </button>
                </div>

                {del.status !== 'Approved' ? (
                    <button
                        onClick={onApprove}
                        className="w-full bg-emerald-500 text-white font-black text-[10px] uppercase tracking-widest py-5 rounded-2xl flex items-center justify-center gap-3 hover:bg-emerald-600 transition-all shadow-xl shadow-emerald-500/20"
                    >
                        <CheckCircle2 className="w-4 h-4" />
                        Approve Version
                    </button>
                ) : (
                    <div className="w-full bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 font-black text-[10px] uppercase tracking-widest py-5 rounded-2xl flex items-center justify-center gap-3 cursor-default">
                        <Check className="w-4 h-4" />
                        Approved
                    </div>
                )}
            </div>

            <AnimatePresence>
                {showComments && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="pt-8 mt-8 border-t border-white/5 space-y-6 overflow-hidden"
                    >
                        <div className="space-y-4 max-h-[200px] overflow-y-auto pr-2 scrollbar-hide">
                            {del.comments?.length > 0 ? del.comments.map((c: Comment, i: number) => (
                                <div key={i} className={`flex flex-col gap-1 p-4 rounded-2xl ${c.sender === 'Client' ? 'bg-indigo-500/10 border border-indigo-500/20' : 'bg-white/5'}`}>
                                    <div className="flex items-center justify-between">
                                        <span className="text-[10px] font-black uppercase text-zinc-500">{c.sender}</span>
                                        <span className="text-[9px] text-zinc-600 font-medium">{new Date(c.timestamp).toLocaleDateString()}</span>
                                    </div>
                                    <p className="text-xs text-zinc-300 leading-relaxed">{c.content}</p>
                                </div>
                            )) : (
                                <div className="py-8 text-center text-zinc-700 font-black uppercase tracking-widest text-[9px] italic">No feedback yet</div>
                            )}
                        </div>

                        <div className="space-y-4">
                            <textarea
                                value={comment}
                                onChange={(e) => setComment(e.target.value)}
                                placeholder="Type your feedback..."
                                className="w-full bg-zinc-950 border border-white/5 rounded-2xl p-4 text-xs text-white focus:border-indigo-500 outline-none transition-all resize-none"
                                rows={3}
                            />
                            <div className="flex items-center justify-between gap-4">
                                <label className="flex items-center gap-2 cursor-pointer group">
                                    <input
                                        type="checkbox"
                                        checked={requestRevision}
                                        onChange={(e) => setRequestRevision(e.target.checked)}
                                        className="hidden"
                                    />
                                    <div className={`w-4 h-4 rounded border flex items-center justify-center transition-all ${requestRevision ? 'bg-amber-500 border-amber-400' : 'border-white/10 group-hover:border-white/20'}`}>
                                        {requestRevision && <Check className="w-3 h-3 text-black font-bold" />}
                                    </div>
                                    <span className={`text-[10px] font-black uppercase tracking-widest transition-colors ${requestRevision ? 'text-amber-500' : 'text-zinc-600'}`}>Request Revision</span>
                                </label>
                                <button
                                    onClick={() => {
                                        if (comment.trim()) {
                                            onComment(comment, requestRevision);
                                            setComment('');
                                            setRequestRevision(false);
                                        }
                                    }}
                                    className="bg-zinc-100 text-black font-black text-[10px] uppercase tracking-widest px-6 py-3 rounded-xl hover:bg-white transition-all"
                                >
                                    Send
                                </button>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
