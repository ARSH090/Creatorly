'use client';

import React, { useState, useEffect } from 'react';
import {
    Plus, Search, Filter, MoreVertical,
    ExternalLink, Edit2, Trash2, Eye,
    BarChart2, Package, Globe, Clock
} from 'lucide-react';
import Link from 'next/link';

export default function ProjectsPage() {
    const [loading, setLoading] = useState(true);
    const [projects, setProjects] = useState<any[]>([]);

    useEffect(() => {
        // Mocking projects data
        setProjects([
            {
                id: 'PRJ-001',
                name: 'Instagram Masterclass 2024',
                status: 'Active',
                type: 'Digital Product',
                lastModified: '2 hours ago',
                sales: 124,
                revenue: '₹61,876',
                visibility: 'Public',
                thumbnail: null
            },
            {
                id: 'PRJ-002',
                name: 'Lightroom Presets - Monsoon Pack',
                status: 'Draft',
                type: 'Digital Product',
                lastModified: '1 day ago',
                sales: 0,
                revenue: '₹0',
                visibility: 'Private',
                thumbnail: null
            },
            {
                id: 'PRJ-003',
                name: 'Creator Workflow Cheat Sheet',
                status: 'Active',
                type: 'E-book',
                lastModified: '3 days ago',
                sales: 89,
                revenue: '₹17,711',
                visibility: 'Public',
                thumbnail: null
            }
        ]);
        setLoading(false);
    }, []);

    return (
        <div className="max-w-7xl mx-auto space-y-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-black text-white mb-2">My Content & Projects</h1>
                    <p className="text-zinc-500">Create, manage, and analyze your digital products.</p>
                </div>
                <button className="bg-white text-black font-bold py-3 px-6 rounded-2xl hover:bg-zinc-200 transition-colors flex items-center justify-center gap-2 text-sm uppercase tracking-wider">
                    <Plus className="w-5 h-5" />
                    New Project
                </button>
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
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {projects.map((project) => (
                    <div key={project.id} className="bg-zinc-900/50 rounded-3xl border border-white/5 overflow-hidden group hover:border-indigo-500/30 transition-all flex flex-col">
                        <div className="aspect-video bg-zinc-800 relative flex items-center justify-center border-b border-white/5">
                            <Package className="w-12 h-12 text-zinc-700 group-hover:text-indigo-500/20 transition-colors" />
                            <div className="absolute top-4 right-4 flex gap-2">
                                <span className={`px-2 py-1 text-[10px] font-bold uppercase tracking-widest rounded-md border ${project.status === 'Active'
                                        ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                                        : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                                    }`}>
                                    {project.status}
                                </span>
                            </div>
                        </div>

                        <div className="p-6 space-y-4 flex-1">
                            <div>
                                <h3 className="text-lg font-bold text-white mb-1 group-hover:text-indigo-400 transition-colors line-clamp-1">{project.name}</h3>
                                <div className="flex items-center gap-2 text-zinc-500 text-xs">
                                    <Clock className="w-3 h-3" />
                                    Modified {project.lastModified}
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4 py-4 border-y border-white/5">
                                <div>
                                    <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-1">Sales</p>
                                    <p className="text-white font-bold">{project.sales}</p>
                                </div>
                                <div>
                                    <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-1">Revenue</p>
                                    <p className="text-white font-bold">{project.revenue}</p>
                                </div>
                            </div>

                            <div className="flex items-center justify-between pt-2">
                                <div className="flex gap-1">
                                    <button className="p-2 bg-white/5 rounded-lg text-zinc-400 hover:text-white transition-colors" title="Edit">
                                        <Edit2 className="w-4 h-4" />
                                    </button>
                                    <button className="p-2 bg-white/5 rounded-lg text-zinc-400 hover:text-white transition-colors" title="Analytics">
                                        <BarChart2 className="w-4 h-4" />
                                    </button>
                                    <button className="p-2 bg-white/5 rounded-lg text-zinc-400 hover:bg-red-500/10 hover:text-red-400 transition-colors" title="Delete">
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                                <Link
                                    href={`/store/${project.id}`}
                                    className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-indigo-400 hover:text-indigo-300 transition-colors"
                                >
                                    View Store
                                    <ExternalLink className="w-3 h-3" />
                                </Link>
                            </div>
                        </div>
                    </div>
                ))}

                {/* Create Project Card */}
                <button className="bg-transparent border-2 border-dashed border-white/10 rounded-3xl flex flex-col items-center justify-center p-12 group hover:border-indigo-500/30 transition-all space-y-4 min-h-[300px]">
                    <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center group-hover:bg-indigo-500/10 transition-all">
                        <Plus className="w-8 h-8 text-zinc-500 group-hover:text-indigo-500 transition-all" />
                    </div>
                    <div className="text-center">
                        <p className="font-bold text-white mb-2">Create New Project</p>
                        <p className="text-xs text-zinc-600">Start selling a new digital product</p>
                    </div>
                </button>
            </div>
        </div>
    );
}
