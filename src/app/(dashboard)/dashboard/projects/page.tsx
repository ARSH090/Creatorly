'use client';

import React, { useState, useEffect } from 'react';
import {
    Plus, Search, Filter, MoreVertical,
    ExternalLink, Edit2, Trash2, Eye,
    BarChart2, Package, Globe, Clock,
    CheckCircle2, AlertCircle, TrendingUp,
    Calendar, Inbox, ChevronRight, LayoutDashboard,
    List, Columns, MessageSquare, Paperclip, Activity
} from 'lucide-react';
import Link from 'next/link';
import { useAuth, useUser } from '@clerk/nextjs';
import { motion, AnimatePresence } from 'framer-motion';

const STATS = [
    { label: 'Active Projects', value: '12', icon: LayoutDashboard, color: 'text-indigo-400', bg: 'bg-indigo-400/10' },
    { label: 'Due This Week', value: '4', icon: Calendar, color: 'text-amber-400', bg: 'bg-amber-400/10' },
    { label: 'Overdue Tasks', value: '2', icon: AlertCircle, color: 'text-red-400', bg: 'bg-red-400/10' },
    { label: 'Completed (Month)', value: '8', icon: CheckCircle2, color: 'text-emerald-400', bg: 'bg-emerald-400/10' },
    { label: 'Pipeline Value', value: '₹4.2k', icon: TrendingUp, color: 'text-purple-400', bg: 'bg-purple-400/10' },
];

const COLUMNS = [
    { id: 'notstarted', name: 'Not Started', count: 3, color: 'bg-zinc-800' },
    { id: 'inprogress', name: 'In Progress', count: 5, color: 'bg-indigo-500' },
    { id: 'review', name: 'In Review', count: 2, color: 'bg-amber-500' },
    { id: 'completed', name: 'Completed', count: 12, color: 'bg-emerald-500' },
    { id: 'onhold', name: 'On Hold', count: 1, color: 'bg-zinc-600' },
];

export default function ProjectsPage() {
    const { getToken, isLoaded, isSignedIn } = useAuth();
    const [loading, setLoading] = useState(true);
    const [view, setView] = useState<'kanban' | 'list' | 'gallery' | 'calendar'>('kanban');
    const [searchQuery, setSearchQuery] = useState('');
    const [activeTab, setActiveTab] = useState('All');
    const [isActivityOpen, setIsActivityOpen] = useState(true);

    // Real data state
    const [projects, setProjects] = useState<any[]>([]);
    const [statsData, setStatsData] = useState<any>(null);
    const [activities, setActivities] = useState<any[]>([]);

    async function fetchData() {
        if (!isLoaded || !isSignedIn) return;
        setLoading(true);
        try {
            const token = await getToken();
            const [projRes, statsRes, actRes] = await Promise.all([
                fetch('/api/creator/projects', { headers: { 'Authorization': `Bearer ${token}` } }),
                fetch('/api/projects/stats', { headers: { 'Authorization': `Bearer ${token}` } }),
                fetch('/api/projects/activity', { headers: { 'Authorization': `Bearer ${token}` } })
            ]);

            const [projData, statsData, actData] = await Promise.all([
                projRes.json(),
                statsRes.json(),
                actRes.json()
            ]);

            setProjects(projData);
            setStatsData(statsData);
            setActivities(actData);
        } catch (error) {
            console.error('Failed to fetch dashboard data:', error);
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        fetchData();
    }, [isLoaded, isSignedIn]);

    const filteredProjects = projects.filter(p =>
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.clientName?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const getGroupedProjects = (status: string) => {
        // Map status names to database status values
        const statusMap: Record<string, string> = {
            'notstarted': 'Not Started',
            'inprogress': 'In Progress',
            'review': 'In Review',
            'completed': 'Completed',
            'onhold': 'On Hold'
        };
        return filteredProjects.filter(p => p.status === statusMap[status]);
    };

    const stats = [
        { label: 'Active Projects', value: statsData?.activeCount || '0', icon: LayoutDashboard, color: 'text-indigo-400', bg: 'bg-indigo-400/10' },
        { label: 'Due This Week', value: statsData?.dueThisWeekCount || '0', icon: Calendar, color: 'text-amber-400', bg: 'bg-amber-400/10' },
        { label: 'Overdue Tasks', value: statsData?.overdueTasksCount || '0', icon: AlertCircle, color: 'text-red-400', bg: 'bg-red-400/10' },
        { label: 'Completed (Month)', value: statsData?.completedThisMonthCount || '0', icon: CheckCircle2, color: 'text-emerald-400', bg: 'bg-emerald-400/10' },
        { label: 'Pipeline Value', value: `₹${((statsData?.pipelineValue || 0) / 100).toLocaleString()}`, icon: TrendingUp, color: 'text-purple-400', bg: 'bg-purple-400/10' },
    ];

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-12 h-12 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin" />
                    <p className="text-zinc-500 font-bold text-xs uppercase tracking-widest">Loading Workspace...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="flex bg-[#030303] min-h-screen text-zinc-400">
            {/* Main Content */}
            <div className="flex-1 flex flex-col p-8 space-y-12">

                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div>
                        <h1 className="text-4xl font-black text-white mb-2 tracking-tight">Projects Workspace</h1>
                        <p className="text-zinc-500 text-sm font-medium">Manage your delivery pipeline and client relationships.</p>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="bg-zinc-900/80 p-1.5 rounded-2xl flex border border-white/5">
                            <button
                                title="Kanban"
                                onClick={() => setView('kanban')}
                                className={`p-2.5 rounded-xl transition-all ${view === 'kanban' ? 'bg-white text-black shadow-xl' : 'text-zinc-500 hover:text-white'}`}>
                                <Columns className="w-5 h-5" />
                            </button>
                            <button
                                title="List View"
                                onClick={() => setView('list')}
                                className={`p-2.5 rounded-xl transition-all ${view === 'list' ? 'bg-white text-black shadow-xl' : 'text-zinc-500 hover:text-white'}`}>
                                <List className="w-5 h-5" />
                            </button>
                            <button
                                title="Gallery View"
                                onClick={() => setView('gallery')}
                                className={`p-2.5 rounded-xl transition-all ${view === 'gallery' ? 'bg-white text-black shadow-xl' : 'text-zinc-500 hover:text-white'}`}>
                                <Package className="w-5 h-5" />
                            </button>
                            <button
                                title="Calendar"
                                onClick={() => setView('calendar')}
                                className={`p-2.5 rounded-xl transition-all ${view === 'calendar' ? 'bg-white text-black shadow-xl' : 'text-zinc-500 hover:text-white'}`}>
                                <Calendar className="w-5 h-5" />
                            </button>
                        </div>
                        <Link
                            href="/dashboard/projects/new"
                            className="bg-indigo-500 text-white font-black py-4 px-8 rounded-2xl hover:bg-indigo-600 transition-all flex items-center gap-3 shadow-2xl shadow-indigo-500/20 text-xs uppercase tracking-widest"
                        >
                            <Plus className="w-5 h-5" />
                            Start Project
                        </Link>
                    </div>
                </div>

                {/* Hero Stats (Truncated view if Calendar) */}
                {view !== 'calendar' && (
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6">
                        {stats.map((stat) => (
                            <div key={stat.label} className="bg-zinc-900/40 border border-white/5 p-6 rounded-[2rem] hover:border-white/10 transition-all group relative overflow-hidden">
                                <div className={`absolute top-0 right-0 w-32 h-32 ${stat.bg} blur-[60px] opacity-0 group-hover:opacity-100 transition-opacity`} />
                                <div className="relative z-10 flex flex-col gap-4">
                                    <div className={`w-10 h-10 ${stat.bg} rounded-xl flex items-center justify-center`}>
                                        <stat.icon className={`w-5 h-5 ${stat.color}`} />
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500 mb-1">{stat.label}</p>
                                        <p className="text-3xl font-black text-white tracking-tight">{stat.value}</p>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* Filters & Actions */}
                <div className="flex flex-col xl:flex-row items-center justify-between gap-6">
                    <div className="flex flex-wrap items-center gap-2">
                        {['All', 'My Active', 'Due This Week', 'Overdue', 'Awaiting Client'].map((tab) => (
                            <button
                                key={tab}
                                onClick={() => setActiveTab(tab)}
                                className={`px-5 py-2.5 rounded-full text-xs font-black uppercase tracking-widest transition-all ${activeTab === tab
                                    ? 'bg-white text-black border-white'
                                    : 'bg-zinc-900/40 border border-white/5 text-zinc-500 hover:text-white hover:bg-zinc-900'}`}
                            >
                                {tab}
                            </button>
                        ))}
                    </div>

                    <div className="flex items-center gap-4 w-full xl:w-auto">
                        <div className="relative flex-1 xl:w-80">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                            <input
                                type="text"
                                placeholder="Search projects or clients..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full bg-zinc-900/50 border border-white/5 rounded-2xl pl-12 pr-4 py-3 text-sm text-white focus:outline-none focus:border-indigo-500 transition-all"
                            />
                        </div>
                        <button className="bg-zinc-900/50 border border-white/5 p-3 rounded-2xl text-zinc-500 hover:text-white transition-all">
                            <Filter className="w-5 h-5" />
                        </button>
                    </div>
                </div>

                {/* Main Views */}
                <div className="flex-1 overflow-visible">
                    {view === 'kanban' && (
                        <div className="overflow-x-auto pb-12 -mx-8 px-8 scrollbar-hide">
                            <div className="flex gap-8 min-w-[1200px] h-full">
                                {COLUMNS.map((col) => {
                                    const columnProjects = getGroupedProjects(col.id);
                                    return (
                                        <div key={col.id} className="w-[320px] flex flex-col gap-6">
                                            <div className="flex items-center justify-between px-4">
                                                <div className="flex items-center gap-3">
                                                    <div className={`w-2 h-2 rounded-full ${col.color}`} />
                                                    <h3 className="text-xs font-black text-white uppercase tracking-widest">{col.name}</h3>
                                                    <span className="bg-zinc-900 text-zinc-500 text-[10px] font-black px-2 py-1 rounded-lg">{columnProjects.length}</span>
                                                </div>
                                                <button className="text-zinc-600 hover:text-white py-1 px-1 rounded-lg transition-colors">
                                                    <MoreVertical className="w-4 h-4" />
                                                </button>
                                            </div>

                                            <div className="flex flex-col gap-4">
                                                {columnProjects.map((project) => (
                                                    <ProjectCard key={project._id} project={project} />
                                                ))}
                                                <Link
                                                    href="/dashboard/projects/new"
                                                    className="w-full border-2 border-dashed border-white/5 rounded-[2rem] py-4 flex items-center justify-center text-zinc-600 hover:text-zinc-400 hover:border-white/10 transition-all group">
                                                    <Plus className="w-5 h-5 group-hover:scale-110 transition-transform" />
                                                </Link>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    {view === 'list' && (
                        <div className="bg-zinc-900/40 border border-white/5 rounded-[2.5rem] overflow-hidden">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="border-b border-white/5">
                                        <th className="px-8 py-6 text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500">Project</th>
                                        <th className="px-8 py-6 text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500">Client</th>
                                        <th className="px-8 py-6 text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500">Progress/Health</th>
                                        <th className="px-8 py-6 text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500">Value</th>
                                        <th className="px-8 py-6 text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500 text-right">Action</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredProjects.map((project) => (
                                        <tr key={project._id} className="border-b border-white/5 hover:bg-white/[0.02] transition-colors group">
                                            <td className="px-8 py-6">
                                                <div className="flex items-center gap-4">
                                                    <div className="bg-indigo-500/10 w-10 h-10 rounded-xl flex items-center justify-center text-indigo-400">
                                                        <Package className="w-5 h-5" />
                                                    </div>
                                                    <div>
                                                        <p className="text-white font-bold group-hover:text-indigo-400 transition-colors">{project.name}</p>
                                                        <p className="text-[10px] text-zinc-600 font-black uppercase tracking-widest">{project.projectNumber || 'UNASSIGNED'}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-8 py-6">
                                                <div className="flex items-center gap-3">
                                                    <img className="w-8 h-8 rounded-full border border-white/10" src={project.clientId?.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${project._id}`} alt="" />
                                                    <p className="text-sm text-zinc-400 font-medium">{project.clientName || 'Direct'}</p>
                                                </div>
                                            </td>
                                            <td className="px-8 py-6">
                                                <div className="w-48 space-y-2">
                                                    <div className="flex justify-between text-[8px] font-black uppercase tracking-widest">
                                                        <span className="text-zinc-600">Health</span>
                                                        <span className="text-white">{project.health?.score || 100}%</span>
                                                    </div>
                                                    <div className="h-1 bg-white/5 rounded-full overflow-hidden">
                                                        <div
                                                            className={`h-full bg-gradient-to-r ${project.health?.score < 50 ? 'from-red-500 to-orange-500' : 'from-indigo-500 to-purple-500'}`}
                                                            style={{ width: `${project.health?.score || 100}%` }}
                                                        />
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-8 py-6">
                                                <p className="text-white font-black tracking-tight text-lg">₹{(project.value / 100).toLocaleString()}</p>
                                                <p className="text-[9px] font-black uppercase tracking-widest text-emerald-500/60">{project.paymentStatus}</p>
                                            </td>
                                            <td className="px-8 py-6 text-right">
                                                <Link href={`/dashboard/projects/${project._id}`} className="inline-flex bg-zinc-800 p-2.5 rounded-xl text-zinc-500 hover:text-white hover:bg-zinc-700 transition-all">
                                                    <Eye className="w-4 h-4" />
                                                </Link>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}

                    {view === 'gallery' && (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
                            {filteredProjects.map((project) => (
                                <ProjectCard key={project._id} project={project} />
                            ))}
                        </div>
                    )}

                    {view === 'calendar' && (
                        <div className="bg-zinc-900/40 border border-white/5 rounded-[2.5rem] p-12 text-center flex flex-col items-center justify-center min-h-[400px]">
                            <Calendar className="w-16 h-16 text-zinc-800 mb-6" />
                            <h3 className="text-2xl font-black text-white mb-2 underline decoration-indigo-500 underline-offset-8">Calendar Integrated</h3>
                            <p className="text-zinc-500 text-sm max-w-md">Your project deadlines are now reflected in the central workspace calendar view.</p>
                            <div className="grid grid-cols-7 gap-px bg-white/5 mt-12 w-full max-w-4xl border border-white/10 rounded-3xl overflow-hidden">
                                {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(d => (
                                    <div key={d} className="bg-zinc-950 p-4 text-[10px] font-black uppercase text-zinc-600 border-b border-white/5">{d}</div>
                                ))}
                                {Array.from({ length: 28 }).map((_, i) => (
                                    <div key={i} className="bg-zinc-900/40 h-32 p-4 text-xs font-bold text-zinc-700 border-r border-b border-white/5 group hover:bg-indigo-500/5 transition-all">
                                        {i + 1}
                                        {i === 12 && (
                                            <div className="mt-2 bg-indigo-500/20 text-indigo-400 p-2 rounded-lg text-[9px] font-black uppercase truncate border border-indigo-500/20">
                                                Brand Launch
                                            </div>
                                        )}
                                        {i === 15 && (
                                            <div className="mt-2 bg-emerald-500/20 text-emerald-400 p-2 rounded-lg text-[9px] font-black uppercase truncate border border-emerald-500/20">
                                                Final Deliv.
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>


            {/* Right Sidebar: Activity Feed */}
            {isActivityOpen && (
                <div className="w-[400px] border-l border-white/5 bg-[#050505] flex flex-col overflow-hidden hidden 2xl:flex">
                    <div className="p-8 border-b border-white/5 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-indigo-500/10 rounded-xl flex items-center justify-center">
                                <Activity className="w-5 h-5 text-indigo-400" />
                            </div>
                            <h2 className="text-lg font-black text-white tracking-tight">Recent Activity</h2>
                        </div>
                        <button onClick={() => setIsActivityOpen(false)} className="text-zinc-600 hover:text-white p-2">
                            <ChevronRight className="w-5 h-5" />
                        </button>
                    </div>

                    <div className="flex-1 overflow-y-auto p-8 space-y-8">
                        {activities.length > 0 ? activities.map((activity, i) => (
                            <ActivityItem key={i} activity={activity} />
                        )) : (
                            <div className="flex flex-col items-center justify-center h-full text-center text-zinc-600 gap-4">
                                <Activity className="w-8 h-8 opacity-10" />
                                <p className="text-xs font-black uppercase tracking-widest">No recent activity</p>
                            </div>
                        )}
                    </div>

                    <div className="p-8 border-t border-white/5">
                        <button className="w-full bg-zinc-900 border border-white/10 text-zinc-400 font-black text-[10px] uppercase tracking-widest py-4 rounded-2xl hover:bg-zinc-800 hover:text-white transition-all">
                            View All History
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}

function ProjectCard({ project }: { project: any }) {
    const daysLeft = project.dueDate ? Math.ceil((new Date(project.dueDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)) : null;

    return (
        <Link href={`/dashboard/projects/${project._id}`}>
            <motion.div
                whileHover={{ y: -4 }}
                className="bg-zinc-900/60 border border-white/5 p-6 rounded-[2.5rem] hover:border-indigo-500/30 transition-all cursor-pointer group shadow-xl shadow-black/20"
            >
                <div className="flex justify-between items-start mb-6">
                    <div className="flex flex-col gap-1">
                        <h4 className="text-white font-black tracking-tight text-lg group-hover:text-indigo-400 transition-colors line-clamp-1">{project.name}</h4>
                        <p className="text-zinc-500 text-[10px] font-black uppercase tracking-widest">Client: {project.clientName || 'Direct'}</p>
                    </div>
                    <div className="bg-indigo-500/10 p-2 rounded-xl text-indigo-400 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Eye className="w-4 h-4" />
                    </div>
                </div>

                <div className="space-y-6">
                    {/* Progress bar */}
                    <div className="space-y-2">
                        <div className="flex justify-between text-[10px] font-black uppercase tracking-widest">
                            <span className="text-zinc-600">Health</span>
                            <span className="text-white">{project.health?.score || 100}%</span>
                        </div>
                        <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                            <div
                                className={`h-full bg-gradient-to-r ${project.health?.score < 50 ? 'from-red-500 to-orange-500' : 'from-indigo-500 to-purple-500'}`}
                                style={{ width: `${project.health?.score || 100}%` }}
                            />
                        </div>
                    </div>

                    <div className="flex items-center justify-between pt-4 border-t border-white/5">
                        <div className="flex items-center -space-x-3">
                            <div className="w-8 h-8 rounded-full border-2 border-zinc-900 bg-zinc-800 flex items-center justify-center overflow-hidden">
                                <img src={project.clientId?.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${project._id}`} alt="User" />
                            </div>
                        </div>

                        <div className="flex items-center gap-4 text-zinc-500">
                            <div className="flex items-center gap-1.5">
                                <Clock className="w-3.5 h-3.5" />
                                <span className="text-[10px] font-black">{project.loggedHours || 0}h</span>
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center justify-between pt-4 border-t border-white/5">
                        <div className={`flex items-center gap-2 ${daysLeft !== null && daysLeft < 3 ? 'text-red-400' : 'text-zinc-500'}`}>
                            <Calendar className="w-3.5 h-3.5" />
                            <span className="text-[10px] font-black uppercase tracking-[0.1em]">
                                {daysLeft !== null ? (daysLeft < 0 ? 'Overdue' : `${daysLeft} Days Left`) : 'No Date'}
                            </span>
                        </div>
                        <div className="text-white font-black text-sm">₹{(project.value / 100).toLocaleString()}</div>
                    </div>
                </div>
            </motion.div>
        </Link>
    );
}

function ActivityItem({ activity }: { activity: any }) {
    const isClient = activity.performedBy === 'Client';

    return (
        <div className="flex gap-4 group">
            <div className="flex flex-col items-center">
                <div className={`w-10 h-10 rounded-full border-2 border-white/5 flex items-center justify-center overflow-hidden bg-zinc-900 text-xs font-black ${isClient ? 'text-amber-400' : 'text-indigo-400'}`}>
                    {activity.performedBy === 'Creator' ? 'CR' : 'CL'}
                </div>
                <div className="w-px flex-1 bg-white/5 mt-4" />
            </div>
            <div className="flex-1 pt-1">
                <p className="text-white text-sm font-bold mb-1">
                    {activity.performedBy} <span className="text-zinc-500 font-medium">{activity.action.replace('_', ' ')}</span>
                </p>
                <div className="bg-white/5 rounded-2xl p-4 mt-3 border border-white/5 group-hover:border-indigo-500/20 transition-all">
                    <p className="text-xs font-bold text-white truncate">{activity.projectName}</p>
                    {activity.meta && (
                        <p className="text-[10px] text-zinc-500 mt-1">{activity.meta.name || activity.meta.title || ''}</p>
                    )}
                </div>
                <p className="text-[10px] text-zinc-600 font-bold uppercase tracking-widest mt-3">
                    {new Date(activity.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </p>
            </div>
        </div>
    );
}
