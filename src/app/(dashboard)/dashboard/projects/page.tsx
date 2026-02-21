'use client';

import React, { useState, useEffect } from 'react';
import {
    Plus, Search, Filter, MoreVertical,
    ExternalLink, Edit2, Trash2, Eye,
    BarChart2, Package, Globe, Clock
} from 'lucide-react';
import Link from 'next/link';
import { useAuth, useUser } from '@clerk/nextjs';

export default function ProjectsPage() {
    const [loading, setLoading] = useState(true);
    const [projects, setProjects] = useState<any[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState('All');

    const { getToken, isLoaded, isSignedIn } = useAuth();
    const { user } = useUser();

    async function fetchProjects() {
        if (!isLoaded || !isSignedIn) return;
        setLoading(true);
        try {
            const token = await getToken();
            if (!token) return;
            const url = new URL('/api/creator/projects', window.location.origin);
            if (statusFilter !== 'All') url.searchParams.set('status', statusFilter);

            const response = await fetch(url.toString(), {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await response.json();
            setProjects(data);
        } catch (error) {
            console.error('Failed to fetch projects:', error);
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        fetchProjects();
    }, [isLoaded, isSignedIn, getToken, statusFilter]);

    const filteredProjects = projects.filter(p =>
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.clientId?.displayName?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="max-w-7xl mx-auto space-y-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-black text-white mb-2">Projects & Deliverables</h1>
                    <p className="text-zinc-500">Manage client work, tasks, and project delivery.</p>
                </div>
                <Link
                    href="/dashboard/projects/new"
                    className="bg-white text-black font-bold py-3 px-6 rounded-2xl hover:bg-zinc-200 transition-colors flex items-center justify-center gap-2 text-sm uppercase tracking-wider"
                >
                    <Plus className="w-5 h-5" />
                    New Project
                </Link>
            </div>

            {/* Filters & Search */}
            <div className="flex flex-col md:flex-row gap-4">
                <div className="relative flex-1">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                    <input
                        type="text"
                        placeholder="Search by name or client..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full bg-zinc-900/50 border border-white/5 rounded-2xl pl-12 pr-4 py-3 text-white focus:outline-none focus:border-indigo-500/50 transition-colors"
                    />
                </div>
                <div className="flex gap-4">
                    <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className="bg-zinc-900/50 border border-white/5 rounded-2xl px-6 py-3 text-white text-sm font-medium hover:bg-zinc-900 outline-none cursor-pointer"
                    >
                        <option value="All">All Status</option>
                        <option value="Active">Active</option>
                        <option value="In Review">In Review</option>
                        <option value="Completed">Completed</option>
                        <option value="Cancelled">Cancelled</option>
                    </select>
                </div>
            </div>

            {/* Projects List */}
            {loading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {[1, 2, 3].map(i => (
                        <div key={i} className="bg-zinc-900/50 rounded-3xl border border-white/5 h-[300px] animate-pulse" />
                    ))}
                </div>
            ) : filteredProjects.length === 0 ? (
                <div className="bg-zinc-900/50 rounded-[3rem] border border-dashed border-white/10 p-20 text-center flex flex-col items-center justify-center space-y-6">
                    <div className="w-24 h-24 bg-white/5 rounded-full flex items-center justify-center">
                        <Package className="w-12 h-12 text-zinc-700" />
                    </div>
                    <div>
                        <h2 className="text-2xl font-bold text-white mb-2">No projects found</h2>
                        <p className="text-zinc-500 max-w-sm mx-auto">Create a manual project or wait for an order to auto-generate one.</p>
                    </div>
                    <Link
                        href="/dashboard/projects/new"
                        className="bg-indigo-500 text-white font-bold py-4 px-8 rounded-2xl hover:bg-indigo-600 transition-all flex items-center gap-3 shadow-xl shadow-indigo-500/20"
                    >
                        <Plus className="w-5 h-5" />
                        Start New Project
                    </Link>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredProjects.map((project) => (
                        <div key={project._id} className="bg-zinc-900/50 rounded-3xl border border-white/5 overflow-hidden group hover:border-indigo-500/30 transition-all flex flex-col p-6 space-y-4">
                            <div className="flex justify-between items-start">
                                <div className={`px-2 py-1 text-[10px] font-bold uppercase tracking-widest rounded-md border ${project.status === 'Completed'
                                    ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                                    : project.status === 'Active'
                                        ? 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20'
                                        : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                                    }`}>
                                    {project.status}
                                </div>
                                {project.dueDate && (
                                    <div className="flex items-center gap-1.5 text-zinc-500 text-[10px] font-bold uppercase tracking-widest">
                                        <Clock className="w-3.5 h-3.5" />
                                        {new Date(project.dueDate).toLocaleDateString()}
                                    </div>
                                )}
                            </div>

                            <div className="space-y-1">
                                <h3 className="text-xl font-bold text-white group-hover:text-indigo-400 transition-colors line-clamp-1">{project.name}</h3>
                                <p className="text-zinc-500 text-sm line-clamp-2 min-h-[2.5rem]">{project.description || 'No description provided.'}</p>
                            </div>

                            <div className="pt-4 border-t border-white/5 flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-full bg-indigo-500/20 flex items-center justify-center text-indigo-400 font-bold text-xs">
                                        {project.clientId?.displayName?.charAt(0) || project.clientId?.email?.charAt(0) || 'C'}
                                    </div>
                                    <div className="flex flex-col">
                                        <p className="text-xs font-bold text-white">{project.clientId?.displayName || 'Direct Order'}</p>
                                        <p className="text-[10px] text-zinc-500 font-medium truncate max-w-[120px]">{project.clientId?.email || 'N/A'}</p>
                                    </div>
                                </div>
                                <Link href={`/dashboard/projects/${project._id}`} className="bg-white/5 hover:bg-white/10 p-2.5 rounded-xl text-white transition-all">
                                    <Eye className="w-4 h-4" />
                                </Link>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
