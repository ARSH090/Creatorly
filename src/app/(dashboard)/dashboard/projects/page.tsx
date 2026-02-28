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

    const { getToken, isLoaded, isSignedIn } = useAuth();
    const { user } = useUser();

    useEffect(() => {
        async function fetchProducts() {
            if (!isLoaded || !isSignedIn) return;
            try {
                const token = await getToken();
                if (!token) return;
                const response = await fetch('/api/creator/products', {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                });
                const data = await response.json();
                setProjects(data);
            } catch (error) {
                console.error('Failed to fetch products:', error);
            } finally {
                setLoading(false);
            }
        }
        fetchProducts();
    }, [isLoaded, isSignedIn, getToken]);

    // ... Rest of the component functionality ...

    return (
        <div className="max-w-7xl mx-auto space-y-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-black text-white mb-2">My Content & Projects</h1>
                    <p className="text-zinc-500">Create, manage, and analyze your digital products.</p>
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
                        placeholder="Search projects..."
                        className="w-full bg-zinc-900/50 border border-white/5 rounded-2xl pl-12 pr-4 py-3 text-white focus:outline-none focus:border-indigo-500/50 transition-colors"
                    />
                </div>
                <div className="flex gap-4">
                    <button className="bg-zinc-900/50 border border-white/5 rounded-2xl px-6 py-3 text-white text-sm font-medium hover:bg-zinc-900 flex items-center gap-2">
                        <Filter className="w-4 h-4" />
                        Filters
                    </button>
                    <select className="bg-zinc-900/50 border border-white/5 rounded-2xl px-6 py-3 text-white text-sm font-medium hover:bg-zinc-900 outline-none">
                        <option>Last Modified</option>
                        <option>Most Sales</option>
                        <option>Highest Revenue</option>
                    </select>
                </div>
            </div>

            {/* Projects List */}
            {loading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {[1, 2, 3].map(i => (
                        <div key={i} className="bg-zinc-900/50 rounded-3xl border border-white/5 aspect-[4/5] animate-pulse" />
                    ))}
                </div>
            ) : projects.length === 0 ? (
                <div className="bg-zinc-900/50 rounded-[3rem] border border-dashed border-white/10 p-20 text-center flex flex-col items-center justify-center space-y-6">
                    <div className="w-24 h-24 bg-white/5 rounded-full flex items-center justify-center">
                        <Package className="w-12 h-12 text-zinc-700" />
                    </div>
                    <div>
                        <h2 className="text-2xl font-bold text-white mb-2">No projects yet</h2>
                        <p className="text-zinc-500 max-w-sm mx-auto">Start your journey by creating your first digital product or course.</p>
                    </div>
                    <Link
                        href="/dashboard/projects/new"
                        className="bg-indigo-500 text-white font-bold py-4 px-8 rounded-2xl hover:bg-indigo-600 transition-all flex items-center gap-3 shadow-xl shadow-indigo-500/20"
                    >
                        <Plus className="w-5 h-5" />
                        Create Your First Project
                    </Link>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {projects.map((project) => (
                        <div key={project._id} className="bg-zinc-900/50 rounded-3xl border border-white/5 overflow-hidden group hover:border-indigo-500/30 transition-all flex flex-col">
                            <div className="aspect-video bg-zinc-800 relative flex items-center justify-center border-b border-white/5 overflow-hidden">
                                {project.image ? (
                                    <img src={project.image} alt={project.name} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                                ) : (
                                    <Package className="w-12 h-12 text-zinc-700 group-hover:text-indigo-500/20 transition-colors" />
                                )}
                                <div className="absolute top-4 right-4 flex gap-2">
                                    <span className={`px-2 py-1 text-[10px] font-bold uppercase tracking-widest rounded-md border ${project.isActive
                                        ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                                        : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                                        }`}>
                                        {project.isActive ? 'Active' : 'Draft'}
                                    </span>
                                </div>
                            </div>

                            <div className="p-6 space-y-4 flex-1">
                                <div>
                                    <h3 className="text-lg font-bold text-white mb-1 group-hover:text-indigo-400 transition-colors line-clamp-1">{project.name}</h3>
                                    <div className="flex items-center gap-2 text-zinc-500 text-xs">
                                        <Clock className="w-3 h-3" />
                                        {project.type}
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4 py-4 border-y border-white/5">
                                    <div>
                                        <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-1">Sales</p>
                                        <p className="text-white font-bold">0</p>
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-1">Revenue</p>
                                        <p className="text-white font-bold">₹{project.price}</p>
                                    </div>
                                </div>

                                <div className="flex items-center justify-between pt-2">
                                    <div className="flex gap-1">
                                        <Link href={`/dashboard/projects/${project._id}`} className="p-2 bg-white/5 rounded-lg text-zinc-400 hover:text-white transition-colors" title="Edit">
                                            <Edit2 className="w-4 h-4" />
                                        </Link>
                                        <button className="p-2 bg-white/5 rounded-lg text-zinc-400 hover:text-white transition-colors" title="Analytics">
                                            <BarChart2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                    <Link
                                        href={`/u/${user?.username || 'demo'}#products`}
                                        target="_blank"
                                        className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-indigo-400 hover:text-indigo-300 transition-colors"
                                    >
                                        View In Store
                                        <ExternalLink className="w-3 h-3" />
                                    </Link>
                                </div>
                            </div>
                        </div>
                    ))}

                    <Link
                        href="/dashboard/projects/new"
                        className="bg-transparent border-2 border-dashed border-white/10 rounded-3xl flex flex-col items-center justify-center p-12 group hover:border-indigo-500/30 transition-all space-y-4 min-h-[300px]"
                    >
                        <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center group-hover:bg-indigo-500/10 transition-all">
                            <Plus className="w-8 h-8 text-zinc-500 group-hover:text-indigo-500 transition-all" />
                        </div>
                        <div className="text-center">
                            <p className="font-bold text-white mb-2">Create New Project</p>
                            <p className="text-xs text-zinc-600">Start selling a new digital product</p>
                        </div>
                    </Link>
                </div>
            )}
        </div>
    );
}
