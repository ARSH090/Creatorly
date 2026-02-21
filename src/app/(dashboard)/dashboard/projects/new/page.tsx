'use client';

import React, { useState } from 'react';
import {
    Plus, ArrowLeft, Save, User,
    Calendar, FileText, ChevronRight
} from 'lucide-react';
import Link from 'next/link';
import { useAuth } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';

export default function NewProjectPage() {
    const router = useRouter();
    const { getToken, isLoaded, isSignedIn } = useAuth();

    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        clientId: '', // Optional for manual projects
        dueDate: ''
    });

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        if (!formData.name) return;

        setLoading(true);
        try {
            const token = await getToken();
            const res = await fetch('/api/creator/projects', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(formData)
            });

            if (res.ok) {
                const project = await res.json();
                router.push(`/dashboard/projects/${project._id}`);
            }
        } catch (error) {
            console.error('Failed to create project:', error);
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="max-w-3xl mx-auto space-y-8 pb-20">
            {/* Header */}
            <div className="space-y-4">
                <Link href="/dashboard/projects" className="flex items-center gap-2 text-zinc-500 hover:text-white transition-colors text-sm font-bold uppercase tracking-widest">
                    <ArrowLeft className="w-4 h-4" />
                    Back to Projects
                </Link>
                <h1 className="text-3xl font-black text-white">Create New Project</h1>
                <p className="text-zinc-500">Set up a manual project to track tasks and client deliverables.</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
                <div className="bg-zinc-900/50 border border-white/5 rounded-[2.5rem] p-8 space-y-8">
                    {/* Basic Info */}
                    <div className="space-y-6">
                        <div className="space-y-2">
                            <label className="text-xs font-black text-white uppercase tracking-widest flex items-center gap-2">
                                <FileText className="w-3.5 h-3.5 text-indigo-400" />
                                Project Name
                            </label>
                            <input
                                required
                                type="text"
                                placeholder="e.g., Brand Identity Design for Nike"
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                className="w-full bg-black/40 border border-white/5 rounded-2xl px-5 py-4 text-white focus:outline-none focus:border-indigo-500/50 transition-all font-medium"
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-xs font-black text-white uppercase tracking-widest flex items-center gap-2">
                                <Plus className="w-3.5 h-3.5 text-indigo-400" />
                                Description
                            </label>
                            <textarea
                                rows={4}
                                placeholder="Describe the scope of work and expectations..."
                                value={formData.description}
                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                className="w-full bg-black/40 border border-white/5 rounded-2xl px-5 py-4 text-white focus:outline-none focus:border-indigo-500/50 transition-all text-sm font-medium"
                            ></textarea>
                        </div>
                    </div>

                    {/* Meta Data */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-6 border-t border-white/5">
                        <div className="space-y-2">
                            <label className="text-xs font-black text-white uppercase tracking-widest flex items-center gap-2">
                                <User className="w-3.5 h-3.5 text-indigo-400" />
                                Client ID (Optional)
                            </label>
                            <input
                                type="text"
                                placeholder="User ID from platform"
                                value={formData.clientId}
                                onChange={(e) => setFormData({ ...formData, clientId: e.target.value })}
                                className="w-full bg-black/40 border border-white/5 rounded-2xl px-5 py-4 text-white focus:outline-none focus:border-indigo-500/50 transition-all text-sm font-mono"
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-xs font-black text-white uppercase tracking-widest flex items-center gap-2">
                                <Calendar className="w-3.5 h-3.5 text-indigo-400" />
                                Due Date
                            </label>
                            <input
                                type="date"
                                value={formData.dueDate}
                                onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                                className="w-full bg-black/40 border border-white/5 rounded-2xl px-5 py-4 text-white focus:outline-none focus:border-indigo-500/50 transition-all text-sm"
                            />
                        </div>
                    </div>
                </div>

                <div className="flex justify-end gap-4">
                    <Link
                        href="/dashboard/projects"
                        className="py-4 px-8 text-zinc-500 font-black uppercase tracking-widest hover:text-white transition-all text-xs"
                    >
                        Cancel
                    </Link>
                    <button
                        disabled={loading || !formData.name}
                        type="submit"
                        className="bg-indigo-500 disabled:opacity-50 text-white font-black py-4 px-10 rounded-2xl hover:bg-indigo-600 transition-all flex items-center gap-2 text-xs uppercase tracking-widest shadow-xl shadow-indigo-500/20"
                    >
                        {loading ? 'Creating...' : 'Create Project'}
                        {!loading && <ChevronRight className="w-4 h-4" />}
                    </button>
                </div>
            </form>
        </div>
    );
}
