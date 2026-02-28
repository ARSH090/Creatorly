'use client';

/* eslint-disable react-hooks/exhaustive-deps, react/no-unescaped-entities, @next/next/no-img-element, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars, prefer-const, import/no-anonymous-default-export */

import React, { useState, useEffect } from 'react';
import {
    Clock, CheckCircle2, Package, Globe,
    ExternalLink, Shield, ArrowRight
} from 'lucide-react';
import { useParams } from 'next/navigation';

export default function PublicProjectPage() {
    const { token } = useParams();
    const [loading, setLoading] = useState(true);
    const [project, setProject] = useState<any>(null);
    const [tasks, setTasks] = useState<any[]>([]);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (token) {
            fetchProject();
        }
    }, [token]);

    async function fetchProject() {
        try {
            const res = await fetch(`/api/public/projects/${token}`);
            const data = await res.json();

            if (res.ok) {
                setProject(data.project);
                setTasks(data.tasks);
            } else {
                setError(data.error || 'Failed to load project details.');
            }
        } catch (err) {
            setError('An unexpected error occurred.');
        } finally {
            setLoading(false);
        }
    }

    if (loading) return (
        <div className="min-h-screen bg-black flex items-center justify-center">
            <div className="animate-pulse flex flex-col items-center gap-4">
                <div className="w-16 h-16 bg-white/5 rounded-full" />
                <p className="text-zinc-500 font-bold tracking-widest uppercase text-xs">Loading Secure Project View...</p>
            </div>
        </div>
    );

    if (error) return (
        <div className="min-h-screen bg-black flex items-center justify-center p-6">
            <div className="max-w-md w-full text-center space-y-6">
                <div className="w-20 h-20 bg-rose-500/10 rounded-full flex items-center justify-center mx-auto">
                    <Shield className="w-10 h-10 text-rose-500" />
                </div>
                <h1 className="text-2xl font-black text-white">{error}</h1>
                <p className="text-zinc-500">This link may be expired or invalid. Please contact the project creator for a fresh link.</p>
                <div className="pt-4">
                    <a href="/" className="inline-flex items-center gap-2 text-indigo-400 font-bold uppercase tracking-widest text-xs hover:text-indigo-300 transition-colors">
                        Go to Home
                        <ArrowRight className="w-4 h-4" />
                    </a>
                </div>
            </div>
        </div>
    );

    return (
        <div className="min-h-screen bg-black text-white">
            {/* Top Bar */}
            <nav className="border-b border-white/5 bg-zinc-900/50 backdrop-blur-xl sticky top-0 z-50">
                <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-black font-black text-xl">C</div>
                        <div className="hidden md:block">
                            <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest -mb-1">Secure Client View</p>
                            <p className="text-sm font-bold text-white">Project: {project.name}</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-4">
                        <span className={`px-2 py-1 text-[10px] font-black uppercase tracking-widest rounded-md border ${project.status === 'Completed' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
                                'bg-indigo-500/10 text-indigo-400 border-indigo-500/20'
                            }`}>
                            {project.status}
                        </span>
                    </div>
                </div>
            </nav>

            <main className="max-w-5xl mx-auto px-6 py-12 space-y-12">
                {/* Project Overview */}
                <div className="space-y-6 text-center md:text-left">
                    <h1 className="text-4xl md:text-6xl font-black tracking-tight">{project.name}</h1>
                    <p className="text-lg text-zinc-500 max-w-2xl leading-relaxed">{project.description || 'No project description provided.'}</p>

                    <div className="flex flex-wrap items-center justify-center md:justify-start gap-6 pt-4">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-zinc-800 flex items-center justify-center text-zinc-500 overflow-hidden border border-white/5">
                                {project.creator?.avatar ? <img src={project.creator.avatar} className="w-full h-full object-cover" /> : <Package className="w-5 h-5" />}
                            </div>
                            <div>
                                <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest -mb-0.5">Creator</p>
                                <p className="text-sm font-bold text-white">{project.creator?.displayName || "Creatorly Professional"}</p>
                            </div>
                        </div>
                        {project.dueDate && (
                            <div className="flex items-center gap-3 pl-6 border-l border-white/10">
                                <Clock className="w-5 h-5 text-indigo-400" />
                                <div>
                                    <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest -mb-0.5">Target Completion</p>
                                    <p className="text-sm font-bold text-white">{new Date(project.dueDate).toLocaleDateString(undefined, { dateStyle: 'long' })}</p>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Progress Tracking */}
                <div className="space-y-6">
                    <div className="flex items-center justify-between">
                        <h2 className="text-xl font-black uppercase tracking-tight">Milestones & Tasks</h2>
                        <div className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">
                            {tasks.filter(t => t.status === 'Done').length} of {tasks.length} Complete
                        </div>
                    </div>

                    <div className="space-y-4">
                        {tasks.length === 0 ? (
                            <div className="bg-zinc-900/30 border border-white/5 border-dashed rounded-3xl p-16 text-center">
                                <p className="text-zinc-600 font-bold italic">The project is initialized. Milestones will appear here soon.</p>
                            </div>
                        ) : (
                            tasks.map((task, idx) => (
                                <div key={idx} className="bg-zinc-900/50 border border-white/5 rounded-3xl p-6 flex items-start gap-5 group hover:border-white/10 transition-all">
                                    <div className="mt-1">
                                        {task.status === 'Done' ? (
                                            <div className="w-6 h-6 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
                                                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                                            </div>
                                        ) : (
                                            <div className="w-6 h-6 rounded-full border-2 border-zinc-800" />
                                        )}
                                    </div>
                                    <div className="space-y-1 flex-1">
                                        <h4 className={`font-bold text-lg ${task.status === 'Done' ? 'text-zinc-500 line-through' : 'text-white'}`}>{task.title}</h4>
                                        <p className="text-sm text-zinc-500 line-clamp-2">{task.description}</p>
                                        <div className="flex gap-3 pt-2">
                                            <span className="text-[9px] font-black uppercase tracking-widest text-zinc-600 bg-zinc-900 px-2 py-0.5 rounded border border-white/5">
                                                {task.priority || 'Medium'} Priority
                                            </span>
                                            {task.status === 'In Progress' && (
                                                <span className="text-[9px] font-black uppercase tracking-widest text-indigo-400 bg-indigo-500/5 px-2 py-0.5 rounded border border-indigo-500/10">
                                                    Current Focus
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                {/* Footer Section */}
                <div className="pt-20 border-t border-white/5 grid grid-cols-1 md:grid-cols-2 gap-12">
                    <div className="space-y-4">
                        <div className="flex items-center gap-2 text-indigo-400">
                            <Shield className="w-5 h-5" />
                            <h3 className="text-sm font-black uppercase tracking-widest">Publicity & Privacy</h3>
                        </div>
                        <p className="text-xs text-zinc-500 leading-relaxed max-w-xs">
                            This page is a read-only progress report. Deliverables will be provided directly through your platform dashboard or email as specified in the service agreement.
                        </p>
                    </div>
                    <div className="flex flex-col md:items-end justify-center space-y-4">
                        <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Powered By</p>
                        <div className="flex items-center gap-2 text-white font-black text-2xl tracking-tighter">
                            Creatorly<span className="text-indigo-500">.</span>
                        </div>
                        <p className="text-[10px] text-zinc-600 font-bold uppercase tracking-widest">Premium Content Management</p>
                    </div>
                </div>
            </main>
        </div>
    );
}
