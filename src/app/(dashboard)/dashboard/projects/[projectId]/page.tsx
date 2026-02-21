'use client';

import React, { useState, useEffect } from 'react';
import {
    Plus, Clock, CheckCircle2, AlertCircle,
    MoreVertical, ArrowLeft, Send, ExternalLink,
    Paperclip, MessageSquare, Shield, Archive
} from 'lucide-react';
import Link from 'next/link';
import { useAuth } from '@clerk/nextjs';
import { useParams, useRouter } from 'next/navigation';

export default function ProjectDetailPage() {
    const { projectId } = useParams();
    const router = useRouter();
    const { getToken, isLoaded, isSignedIn } = useAuth();

    const [loading, setLoading] = useState(true);
    const [project, setProject] = useState<any>(null);
    const [tasks, setTasks] = useState<any[]>([]);
    const [newTaskTitle, setNewTaskTitle] = useState('');
    const [isAddingTask, setIsAddingTask] = useState(false);

    useEffect(() => {
        if (isLoaded && isSignedIn && projectId) {
            fetchProjectData();
        }
    }, [isLoaded, isSignedIn, projectId]);

    async function fetchProjectData() {
        setLoading(true);
        try {
            const token = await getToken();

            // Fetch Project
            const pRes = await fetch(`/api/creator/projects/${projectId}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const pData = await pRes.json();
            setProject(pData);

            // Fetch Tasks
            const tRes = await fetch(`/api/creator/projects/${projectId}/tasks`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const tData = await tRes.json();
            setTasks(tData);

        } catch (error) {
            console.error('Failed to fetch project details:', error);
        } finally {
            setLoading(false);
        }
    }

    async function handleAddTask(e: React.FormEvent) {
        e.preventDefault();
        if (!newTaskTitle.trim()) return;

        try {
            const token = await getToken();
            const res = await fetch(`/api/creator/projects/${projectId}/tasks`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ title: newTaskTitle })
            });

            if (res.ok) {
                setNewTaskTitle('');
                setIsAddingTask(false);
                fetchProjectData(); // Refresh tasks
            }
        } catch (error) {
            console.error('Failed to add task:', error);
        }
    }

    if (loading) return <div className="p-20 text-center text-zinc-500">Loading project details...</div>;
    if (!project) return <div className="p-20 text-center text-white font-bold">Project not found.</div>;

    return (
        <div className="max-w-7xl mx-auto space-y-8 pb-20">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
                <div className="space-y-4">
                    <Link href="/dashboard/projects" className="flex items-center gap-2 text-zinc-500 hover:text-white transition-colors text-sm font-bold uppercase tracking-widest">
                        <ArrowLeft className="w-4 h-4" />
                        Back to Projects
                    </Link>
                    <div className="space-y-2">
                        <div className="flex items-center gap-3">
                            <h1 className="text-3xl md:text-4xl font-black text-white">{project.name}</h1>
                            <span className={`px-3 py-1 text-[10px] font-black uppercase tracking-[0.2em] rounded-full border ${project.status === 'Active' ? 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20' :
                                    project.status === 'Completed' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
                                        'bg-amber-500/10 text-amber-400 border-amber-500/20'
                                }`}>
                                {project.status}
                            </span>
                        </div>
                        <p className="text-zinc-500 max-w-2xl">{project.description || 'No description provided for this project.'}</p>
                    </div>
                </div>

                <div className="flex flex-wrap gap-3">
                    <button className="bg-zinc-900 border border-white/5 text-white font-bold py-3 px-6 rounded-2xl flex items-center gap-2 hover:bg-zinc-800 transition-all text-xs uppercase tracking-widest">
                        <Archive className="w-4 h-4 text-zinc-500" />
                        Archive
                    </button>
                    <button className="bg-indigo-500 text-white font-bold py-3 px-6 rounded-2xl flex items-center gap-2 hover:bg-indigo-600 transition-all text-xs uppercase tracking-widest shadow-lg shadow-indigo-500/20">
                        <Send className="w-4 h-4" />
                        Share With Client
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left Column: Tasks */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="flex items-center justify-between">
                        <h2 className="text-xl font-black text-white uppercase tracking-tight">Project Tasks</h2>
                        <button
                            onClick={() => setIsAddingTask(true)}
                            className="p-2 bg-white/5 hover:bg-white/10 rounded-xl text-indigo-400 transition-all"
                        >
                            <Plus className="w-5 h-5" />
                        </button>
                    </div>

                    {isAddingTask && (
                        <form onSubmit={handleAddTask} className="bg-zinc-900/50 border border-indigo-500/30 rounded-2xl p-4 animate-in fade-in slide-in-from-top-2 duration-300">
                            <input
                                autoFocus
                                type="text"
                                placeholder="What needs to be done?"
                                value={newTaskTitle}
                                onChange={(e) => setNewTaskTitle(e.target.value)}
                                className="w-full bg-transparent border-none text-white focus:ring-0 placeholder:text-zinc-700 font-bold"
                            />
                            <div className="flex justify-end gap-2 mt-4">
                                <button type="button" onClick={() => setIsAddingTask(false)} className="px-4 py-2 text-xs font-bold text-zinc-500 uppercase">Cancel</button>
                                <button type="submit" className="bg-indigo-500 px-4 py-2 rounded-lg text-xs font-bold text-white uppercase shadow-lg shadow-indigo-500/20">Add Task</button>
                            </div>
                        </form>
                    )}

                    <div className="space-y-3">
                        {tasks.length === 0 && !isAddingTask ? (
                            <div className="bg-zinc-900/30 border border-white/5 border-dashed rounded-3xl p-12 text-center">
                                <p className="text-zinc-600 font-bold italic">No tasks yet. Create one to get started!</p>
                            </div>
                        ) : (
                            tasks.map((task) => (
                                <div key={task._id} className="bg-zinc-900/50 border border-white/5 rounded-2xl p-5 group hover:border-white/10 transition-all flex items-start justify-between gap-4">
                                    <div className="flex items-start gap-4">
                                        <button className="mt-1 text-zinc-700 hover:text-indigo-400 transition-colors">
                                            {task.status === 'Done' ? <CheckCircle2 className="w-6 h-6 text-emerald-500" /> : <div className="w-6 h-6 rounded-full border-2 border-current" />}
                                        </button>
                                        <div className="space-y-1">
                                            <h4 className={`font-bold ${task.status === 'Done' ? 'text-zinc-500 line-through' : 'text-white'}`}>{task.title}</h4>
                                            <div className="flex items-center gap-3">
                                                <span className={`text-[9px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded border ${task.priority === 'Urgent' ? 'bg-rose-500/10 text-rose-400 border-rose-500/20' :
                                                        task.priority === 'High' ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' :
                                                            'bg-zinc-500/10 text-zinc-500 border-zinc-500/20'
                                                    }`}>
                                                    {task.priority || 'Medium'}
                                                </span>
                                                {task.dueDate && (
                                                    <span className="text-[10px] text-zinc-600 font-bold uppercase tracking-widest flex items-center gap-1">
                                                        <Clock className="w-3 h-3" />
                                                        {new Date(task.dueDate).toLocaleDateString()}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                    <button className="opacity-0 group-hover:opacity-100 p-2 text-zinc-500 hover:text-white transition-all">
                                        <MoreVertical className="w-4 h-4" />
                                    </button>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                {/* Right Column: Sidebar */}
                <div className="space-y-6">
                    {/* Client Info */}
                    <div className="bg-zinc-900/50 border border-white/5 rounded-[2.5rem] p-8 space-y-6">
                        <h3 className="text-sm font-black text-white uppercase tracking-widest">Client Details</h3>
                        <div className="flex items-center gap-4">
                            <div className="w-14 h-14 rounded-2xl bg-indigo-500/20 flex items-center justify-center text-xl font-black text-indigo-400 shadow-inner">
                                {project.clientId?.displayName?.charAt(0) || project.clientId?.email?.charAt(0) || 'C'}
                            </div>
                            <div>
                                <p className="font-bold text-white text-lg">{project.clientId?.displayName || 'Direct Order'}</p>
                                <p className="text-sm text-zinc-500">{project.clientId?.email || 'N/A'}</p>
                            </div>
                        </div>
                        <div className="space-y-3 pt-4 border-t border-white/5">
                            <div className="flex justify-between text-xs">
                                <span className="text-zinc-500 font-bold uppercase tracking-widest">Order ID</span>
                                <span className="text-white font-mono">{project.orderId?.orderNumber || 'Manual'}</span>
                            </div>
                            <div className="flex justify-between text-xs">
                                <span className="text-zinc-500 font-bold uppercase tracking-widest">Project Start</span>
                                <span className="text-white">{new Date(project.createdAt).toLocaleDateString()}</span>
                            </div>
                        </div>
                        <button className="w-full py-4 bg-white/5 hover:bg-white/10 rounded-2xl text-white text-xs font-black uppercase tracking-[0.2em] transition-all flex items-center justify-center gap-2">
                            <MessageSquare className="w-4 h-4 text-indigo-400" />
                            Message Client
                        </button>
                    </div>

                    {/* Shared View */}
                    <div className="bg-indigo-500/5 border border-indigo-500/10 rounded-[2.5rem] p-8 space-y-6">
                        <div className="flex items-center gap-3">
                            <Shield className="w-5 h-5 text-indigo-400" />
                            <h3 className="text-sm font-black text-white uppercase tracking-widest">Client View</h3>
                        </div>
                        <p className="text-xs text-zinc-500 leading-relaxed">
                            Share this project's progress with your client via a secure, read-only link. They don't need to log in to see status updates and deliverables.
                        </p>
                        <div className="flex items-center gap-2 p-3 bg-black/40 rounded-xl border border-white/5">
                            <input
                                readOnly
                                value={project.clientViewEnabled ? `${window.location.origin}/p/view/temp-token` : 'Not shared yet'}
                                className="bg-transparent border-none text-zinc-400 text-[10px] font-mono focus:ring-0 flex-1 truncate"
                            />
                            <button className="text-indigo-400 hover:text-indigo-300 transition-colors">
                                <ExternalLink className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
