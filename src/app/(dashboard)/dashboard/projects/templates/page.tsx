'use client';

import React, { useState, useEffect } from 'react';
import {
    Layout, Plus, Search, Filter,
    MoreVertical, Copy, Trash2, Edit3,
    CheckSquare, CreditCard, ChevronRight,
    Zap, Sparkles, BookOpen
} from 'lucide-react';
import { useAuth } from '@clerk/nextjs';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';

export default function TemplatesPage() {
    const { getToken, isLoaded, isSignedIn } = useAuth();
    const [loading, setLoading] = useState(true);
    const [templates, setTemplates] = useState<any[]>([]);
    const [searchQuery, setSearchQuery] = useState('');

    async function fetchTemplates() {
        if (!isLoaded || !isSignedIn) return;
        try {
            const token = await getToken();
            const res = await fetch('/api/creator/projects/templates', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await res.json();
            setTemplates(Array.isArray(data) ? data : []);
        } catch (error) {
            console.error('Failed to fetch templates:', error);
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        fetchTemplates();
    }, [isLoaded, isSignedIn]);

    const filteredTemplates = templates.filter(t =>
        t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.category.toLowerCase().includes(searchQuery.toLowerCase())
    );

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-12 h-12 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin" />
                    <p className="text-zinc-500 font-black text-[10px] uppercase tracking-widest text-center">Loading Blueprints...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="flex flex-col space-y-12 pb-20">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-8">
                <div className="space-y-4">
                    <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-zinc-500">
                        <Link href="/dashboard/projects" className="hover:text-white transition-colors">Projects</Link>
                        <span>/</span>
                        <span className="text-zinc-300">Templates</span>
                    </div>
                    <h1 className="text-5xl font-black text-white tracking-tighter">Project Blueprints</h1>
                    <p className="text-zinc-500 max-w-xl font-medium">Standardize your delivery. Create reusable templates with pre-defined tasks, milestones, and payment structures.</p>
                </div>

                <div className="flex items-center gap-4">
                    <button className="bg-white text-black font-black text-[10px] uppercase tracking-widest px-8 py-5 rounded-2xl hover:bg-zinc-200 transition-all flex items-center gap-3 shadow-2xl shadow-white/5">
                        <Plus className="w-4 h-4" />
                        New Template
                    </button>
                </div>
            </div>

            {/* Stats & Filters */}
            <div className="flex flex-col md:flex-row items-center justify-between gap-6 pb-6 border-b border-white/5">
                <div className="grid grid-cols-2 md:flex items-center gap-4 w-full md:w-auto">
                    <div className="relative group flex-1 md:w-80">
                        <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-600 group-focus-within:text-white transition-colors" />
                        <input
                            type="text"
                            placeholder="Search templates..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full bg-zinc-900/50 border border-white/5 rounded-2xl py-4 pl-14 pr-6 text-sm text-white focus:outline-none focus:border-white/20 transition-all"
                        />
                    </div>
                    <button className="bg-zinc-900/50 border border-white/5 p-4 rounded-xl text-zinc-500 hover:text-white transition-all flex items-center gap-2">
                        <Filter className="w-4 h-4" />
                        <span className="text-[10px] font-black uppercase tracking-widest">Filter</span>
                    </button>
                </div>

                <div className="hidden lg:flex items-center gap-8">
                    <div className="flex flex-col items-end">
                        <span className="text-[10px] font-black uppercase tracking-widest text-zinc-600">Total Blueprints</span>
                        <span className="text-white font-black">{templates.length}</span>
                    </div>
                    <div className="h-8 w-px bg-white/5" />
                    <div className="flex flex-col items-end">
                        <span className="text-[10px] font-black uppercase tracking-widest text-zinc-600">Most Used</span>
                        <span className="text-white font-black">{templates.reduce((acc, curr) => curr.usageCount > (acc?.usageCount || 0) ? curr : acc, null)?.name || 'N/A'}</span>
                    </div>
                </div>
            </div>

            {/* Template Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                <AnimatePresence>
                    {filteredTemplates.map((template, i) => (
                        <motion.div
                            key={template._id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.05 }}
                            className="group bg-zinc-900/40 border border-white/5 p-8 rounded-[2.5rem] hover:border-white/10 hover:bg-zinc-900 transition-all relative overflow-hidden"
                        >
                            {/* Decorative Glow */}
                            <div className="absolute -top-24 -right-24 w-48 h-48 bg-indigo-500/5 blur-[80px] group-hover:bg-indigo-500/10 transition-all" />

                            <div className="flex items-start justify-between mb-8 relative z-10">
                                <div className={`p-4 rounded-2xl ${template.category === 'Design' ? 'bg-pink-500/10 text-pink-500' :
                                        template.category === 'Development' ? 'bg-indigo-500/10 text-indigo-500' :
                                            template.category === 'Content' ? 'bg-amber-500/10 text-amber-500' :
                                                'bg-zinc-800 text-zinc-400'
                                    }`}>
                                    <Layout className="w-6 h-6" />
                                </div>
                                <div className="flex items-center gap-2">
                                    {template.isPublic && (
                                        <span className="bg-indigo-500/10 text-indigo-500 text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full border border-indigo-500/20">Public</span>
                                    )}
                                    <button className="text-zinc-600 hover:text-white transition-colors">
                                        <MoreVertical className="w-5 h-5" />
                                    </button>
                                </div>
                            </div>

                            <div className="space-y-4 mb-10 relative z-10">
                                <h3 className="text-2xl font-black text-white tracking-tight leading-tight">{template.name}</h3>
                                <p className="text-zinc-500 text-xs font-medium line-clamp-2 leading-relaxed">{template.description || 'No description provided for this template.'}</p>
                            </div>

                            <div className="grid grid-cols-2 gap-4 mb-8 relative z-10">
                                <div className="bg-white/5 p-5 rounded-2xl flex flex-col gap-1">
                                    <div className="flex items-center gap-2 text-zinc-500">
                                        <CheckSquare className="w-3.5 h-3.5" />
                                        <span className="text-[10px] font-black uppercase tracking-widest">Tasks</span>
                                    </div>
                                    <span className="text-white font-black">{template.tasks?.length || 0}</span>
                                </div>
                                <div className="bg-white/5 p-5 rounded-2xl flex flex-col gap-1">
                                    <div className="flex items-center gap-2 text-zinc-500">
                                        <CreditCard className="w-3.5 h-3.5" />
                                        <span className="text-[10px] font-black uppercase tracking-widest">Milestones</span>
                                    </div>
                                    <span className="text-white font-black">{template.milestones?.length || 0}</span>
                                </div>
                            </div>

                            <div className="flex items-center justify-between pt-6 border-t border-white/5 relative z-10">
                                <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-zinc-600">
                                    <Zap className="w-3.5 h-3.5" />
                                    <span>Used {template.usageCount || 0} times</span>
                                </div>
                                <button className="text-white font-black text-[10px] uppercase tracking-widest flex items-center gap-2 group/btn">
                                    Preview
                                    <ChevronRight className="w-4 h-4 group-hover/btn:translate-x-1 transition-transform" />
                                </button>
                            </div>
                        </motion.div>
                    ))}

                    {/* Empty State / Add Card */}
                    {filteredTemplates.length === 0 && !loading && (
                        <div className="col-span-full py-20 bg-zinc-900/20 border-2 border-dashed border-white/5 rounded-[3rem] flex flex-col items-center justify-center text-center gap-6">
                            <div className="w-20 h-20 bg-white/5 rounded-[2rem] flex items-center justify-center text-zinc-700">
                                <Sparkles className="w-10 h-10" />
                            </div>
                            <div className="space-y-2">
                                <h3 className="text-xl font-black text-white">No templates found</h3>
                                <p className="text-zinc-600 text-sm font-medium max-w-sm">Start your automation journey by creating your first project blueprint.</p>
                            </div>
                            <button className="bg-indigo-500 text-white font-black text-[10px] uppercase tracking-widest px-8 py-5 rounded-2xl hover:bg-indigo-600 transition-all shadow-xl shadow-indigo-500/20">
                                Create Template
                            </button>
                        </div>
                    )}
                </AnimatePresence>
            </div>

            {/* Quick Tips Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="bg-indigo-600 rounded-[3rem] p-12 text-white relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 blur-[80px] group-hover:scale-110 transition-transform" />
                    <BookOpen className="w-12 h-12 mb-8" />
                    <h3 className="text-3xl font-black mb-4 tracking-tighter italic">"Scale through structure."</h3>
                    <p className="text-indigo-100 text-sm font-medium mb-10 max-w-md leading-relaxed">Templates are more than just task lists. They define your standard of quality and ensure every client receives the same premium experience.</p>
                    <div className="flex items-center gap-4">
                        <div className="flex -space-x-3">
                            <div className="w-10 h-10 rounded-full border-2 border-indigo-600 bg-white/20" />
                            <div className="w-10 h-10 rounded-full border-2 border-indigo-600 bg-white/40" />
                            <div className="w-10 h-10 rounded-full border-2 border-indigo-600 bg-white/60" />
                        </div>
                        <span className="text-[10px] font-black uppercase tracking-widest text-indigo-200">Used by top 1% creators</span>
                    </div>
                </div>

                <div className="bg-zinc-900/40 border border-white/5 rounded-[3rem] p-12 flex flex-col justify-center gap-8">
                    <h3 className="text-xl font-black text-white uppercase tracking-widest">Automation Ideas</h3>
                    <div className="space-y-6">
                        <div className="flex gap-6">
                            <div className="w-12 h-12 bg-white/5 rounded-2xl flex-shrink-0 flex items-center justify-center text-zinc-500">01</div>
                            <div>
                                <h4 className="text-white font-bold mb-1">Standard Onboarding</h4>
                                <p className="text-xs text-zinc-600 font-medium">Auto-create setup tasks and a "Welcome Packet" deliverable.</p>
                            </div>
                        </div>
                        <div className="flex gap-6">
                            <div className="w-12 h-12 bg-white/5 rounded-2xl flex-shrink-0 flex items-center justify-center text-zinc-500">02</div>
                            <div>
                                <h4 className="text-white font-bold mb-1">Feedback Loops</h4>
                                <p className="text-xs text-zinc-600 font-medium">Add "In Review" milestones with percentage-based payments.</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
