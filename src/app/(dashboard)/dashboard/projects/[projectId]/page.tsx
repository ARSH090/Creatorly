'use client';

import React, { useState, useEffect } from 'react';
import {
    ChevronLeft, MoreVertical, Calendar,
    Clock, CheckCircle2, AlertCircle,
    LayoutDashboard, CheckSquare, Paperclip,
    MessageSquare, History, CreditCard,
    ExternalLink, Share2, Settings, Star,
    ArrowUpRight, Users, Zap
} from 'lucide-react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useAuth, useUser } from '@clerk/nextjs';
import { motion, AnimatePresence } from 'framer-motion';

type TabType = 'tasks' | 'deliverables' | 'messages' | 'timeline' | 'payments';

export default function ProjectDetailPage() {
    const { projectId } = useParams();
    const router = useRouter();
    const { getToken, isLoaded, isSignedIn } = useAuth();
    const { user } = useUser();


    const [loading, setLoading] = useState(true);
    const [project, setProject] = useState<any>(null);
    const [activeTab, setActiveTab] = useState<TabType>('tasks');

    // Detailed states for tabs
    const [tasks, setTasks] = useState<any[]>([]);
    const [deliverables, setDeliverables] = useState<any[]>([]);
    const [messages, setMessages] = useState<any[]>([]);
    const [financials, setFinancials] = useState<any>(null);

    // Fetch project details
    async function fetchData() {
        if (!isLoaded || !isSignedIn) return;
        setLoading(true);
        try {
            const token = await getToken();
            const res = await fetch(`/api/creator/projects/${projectId}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await res.json();
            setProject(data);

            // Parallel fetch tab data
            const [tasksRes, delRes, msgRes, finRes] = await Promise.all([
                fetch(`/api/creator/projects/${projectId}/tasks`, { headers: { 'Authorization': `Bearer ${token}` } }),
                fetch(`/api/creator/projects/${projectId}/deliverables`, { headers: { 'Authorization': `Bearer ${token}` } }),
                fetch(`/api/creator/projects/${projectId}/messages`, { headers: { 'Authorization': `Bearer ${token}` } }),
                fetch(`/api/creator/projects/${projectId}/payments`, { headers: { 'Authorization': `Bearer ${token}` } })
            ]);

            const [tasksData, delData, msgData, finData] = await Promise.all([
                tasksRes.json(),
                delRes.json(),
                msgRes.json(),
                finRes.json()
            ]);

            setTasks(tasksData);
            setDeliverables(delData);
            setMessages(msgData);
            setFinancials(finData);

        } catch (error) {
            console.error('Failed to fetch project data:', error);
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        fetchData();
    }, [projectId, isLoaded, isSignedIn]);

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-12 h-12 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin" />
                    <p className="text-zinc-500 font-bold text-xs uppercase tracking-widest text-center">Loading Project<br />Details...</p>
                </div>
            </div>
        );
    }

    if (!project) return null;

    const tabs = [
        { id: 'tasks', label: 'Tasks', icon: CheckSquare },
        { id: 'deliverables', label: 'Deliverables', icon: Paperclip },
        { id: 'messages', label: 'Messages', icon: MessageSquare },
        { id: 'timeline', label: 'Timeline', icon: History },
        { id: 'payments', label: 'Payments', icon: CreditCard },
    ];

    return (
        <div className="flex flex-col space-y-8 pb-20">
            {/* Header / Breadcrumbs */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => router.back()}
                        className="bg-zinc-900/50 border border-white/5 p-3 rounded-2xl text-zinc-400 hover:text-white transition-all hover:bg-zinc-900"
                    >
                        <ChevronLeft className="w-5 h-5" />
                    </button>
                    <div>
                        <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-zinc-600 mb-1">
                            <Link href="/dashboard/projects" className="hover:text-white transition-colors">Projects</Link>
                            <span>/</span>
                            <span className="text-zinc-500">{project.projectNumber || 'PRJ-123'}</span>
                        </div>
                        <h1 className="text-3xl font-black text-white tracking-tight">{project.name}</h1>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <button className="bg-zinc-900/50 border border-white/5 px-6 py-4 rounded-2xl text-zinc-400 font-black text-[10px] uppercase tracking-widest hover:text-white transition-all flex items-center gap-2">
                        <Share2 className="w-4 h-4" />
                        Client Portal
                    </button>
                    <button className="bg-indigo-500 text-white px-8 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-indigo-600 transition-all shadow-xl shadow-indigo-500/20 flex items-center gap-2 text-xs">
                        <Zap className="w-4 h-4" />
                        Quick Action
                    </button>
                    <button className="bg-zinc-900/50 border border-white/5 p-4 rounded-2xl text-zinc-500 hover:text-white transition-all">
                        <MoreVertical className="w-5 h-5" />
                    </button>
                </div>
            </div>

            {/* Quick Stats Bar */}
            <div className="grid grid-cols-1 md:grid-cols-4 lg:grid-cols-5 gap-6">
                <div className="bg-zinc-900/40 border border-white/5 p-6 rounded-[2rem] flex flex-col gap-3">
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500">Status</p>
                    <div className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full animate-pulse ${project.status === 'In Progress' ? 'bg-indigo-500' : project.status === 'Completed' ? 'bg-emerald-500' : 'bg-amber-500'}`} />
                        <span className="text-white font-bold">{project.status}</span>
                    </div>
                </div>
                <div className="bg-zinc-900/40 border border-white/5 p-6 rounded-[2rem] flex flex-col gap-3">
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500">Due Date</p>
                    <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-zinc-600" />
                        <span className="text-white font-bold">{project.dueDate ? new Date(project.dueDate).toLocaleDateString() : 'No Date'}</span>
                    </div>
                </div>
                <div className="bg-zinc-900/40 border border-white/5 p-6 rounded-[2rem] flex flex-col gap-3">
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500">Project Health</p>
                    <div className="flex items-center gap-3">
                        <div className="flex-1 h-2 bg-white/5 rounded-full overflow-hidden">
                            <div
                                className={`h-full bg-gradient-to-r ${project.health?.score < 50 ? 'from-red-500 to-orange-500' : 'from-indigo-500 to-purple-500'}`}
                                style={{ width: `${project.health?.score || 100}%` }}
                            />
                        </div>
                        <span className="text-white font-bold text-xs">{project.health?.score || 100}%</span>
                    </div>
                </div>
                <div className="bg-zinc-900/40 border border-white/5 p-6 rounded-[2rem] flex flex-col gap-3">
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500">Value</p>
                    <div className="flex items-center gap-2">
                        <CreditCard className="w-4 h-4 text-zinc-600" />
                        <span className="text-white font-black text-lg">₹{(project.value / 100).toLocaleString()}</span>
                    </div>
                </div>
                <div className="bg-zinc-900/40 border border-white/5 p-6 rounded-[2rem] flex items-center justify-center lg:flex-col lg:items-start gap-4">
                    <div className="flex -space-x-2">
                        <div className="w-8 h-8 rounded-full border-2 border-zinc-900 bg-indigo-500 flex items-center justify-center text-[10px] font-black text-white capitalize">
                            {user?.firstName?.substring(0, 2) || project.creatorId?.substring(0, 2)}
                        </div>
                        <div className="w-8 h-8 rounded-full border-2 border-zinc-900 bg-zinc-800 flex items-center justify-center overflow-hidden">
                            <img src={project.clientId?.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${project._id}`} alt="" />
                        </div>
                    </div>
                    <div className="hidden lg:block">
                        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500">Team & Client</p>
                    </div>
                </div>
            </div>

            {/* Tab Navigation */}
            <div className="flex items-center gap-2 border-b border-white/5 pb-1 overflow-x-auto scrollbar-hide">
                {tabs.map((tab) => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id as TabType)}
                        className={`flex items-center gap-2.5 px-8 py-5 text-sm font-black uppercase tracking-widest transition-all relative whitespace-nowrap ${activeTab === tab.id ? 'text-white' : 'text-zinc-500 hover:text-zinc-300'}`}
                    >
                        <tab.icon className="w-4 h-4" />
                        {tab.label}
                        {activeTab === tab.id && (
                            <motion.div
                                layoutId="activeTabProject"
                                className="absolute bottom-0 left-0 right-0 h-1 bg-white rounded-full mx-6"
                            />
                        )}
                    </button>
                ))}
            </div>

            {/* Tab Content Area */}
            <div className="min-h-[500px]">
                <AnimatePresence mode="wait">
                    <motion.div
                        key={activeTab}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.2 }}
                    >
                        {activeTab === 'tasks' && <TasksTab projectId={projectId as string} tasks={tasks} />}
                        {activeTab === 'deliverables' && <DeliverablesTab deliverables={deliverables} />}
                        {activeTab === 'messages' && <MessagesTab messages={messages} />}
                        {activeTab === 'timeline' && <div className="text-zinc-600 p-20 text-center font-black uppercase tracking-widest">Timeline View - Coming Soon</div>}
                        {activeTab === 'payments' && <PaymentsTab financials={financials} />}
                    </motion.div>
                </AnimatePresence>
            </div>
        </div>
    );
}

function TasksTab({ projectId, tasks }: { projectId: string; tasks: any[] }) {
    return (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 pt-8">
            <div className="lg:col-span-8 space-y-12">
                <div className="flex items-center justify-between">
                    <h2 className="text-xl font-black text-white tracking-tight">Project Backlog</h2>
                    <button className="bg-white text-black font-black text-[10px] uppercase tracking-widest py-2.5 px-6 rounded-xl hover:bg-zinc-200 transition-all flex items-center gap-2">
                        <Plus className="w-4 h-4" />
                        Add Task
                    </button>
                </div>

                <div className="space-y-6">
                    {tasks.length > 0 ? tasks.map((task) => (
                        <div key={task._id} className="group bg-zinc-900/40 border border-white/5 p-6 rounded-[2rem] hover:border-white/10 transition-all flex items-center gap-6">
                            <div className="bg-zinc-800 p-3 rounded-2xl text-zinc-500 group-hover:text-indigo-400 transition-colors">
                                <CheckSquare className="w-5 h-5" />
                            </div>
                            <div className="flex-1">
                                <h3 className="text-white font-bold mb-1">{task.title}</h3>
                                <div className="flex items-center gap-4">
                                    <div className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-zinc-600">
                                        <Clock className="w-3 h-3" />
                                        <span>{task.loggedHours || 0}h logged</span>
                                    </div>
                                    <div className={`flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest ${task.priority === 'High' ? 'text-red-500/60' : 'text-zinc-600'}`}>
                                        <AlertCircle className="w-3 h-3" />
                                        <span>{task.priority} Priority</span>
                                    </div>
                                    {task.dueDate && (
                                        <div className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-zinc-600">
                                            <Calendar className="w-3 h-3" />
                                            <span>{new Date(task.dueDate).toLocaleDateString()}</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                            <button className="opacity-0 group-hover:opacity-100 transition-opacity bg-zinc-800 p-3 rounded-xl hover:text-white">
                                <ArrowUpRight className="w-4 h-4" />
                            </button>
                        </div>
                    )) : (
                        <div className="py-20 text-center border-2 border-dashed border-white/5 rounded-[2.5rem]">
                            <p className="text-zinc-600 font-black uppercase tracking-widest text-xs">No tasks found. Start by adding one above.</p>
                        </div>
                    )}
                </div>
            </div>

            <div className="lg:col-span-4 space-y-12">
                <div className="bg-indigo-600 rounded-[2.5rem] p-8 text-white relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-white/20 blur-[60px] group-hover:bg-white/30 transition-all" />
                    <h3 className="text-lg font-black mb-1 relative z-10">Timer</h3>
                    <p className="text-indigo-200 text-xs font-medium mb-6 relative z-10">Track your focus time on this project.</p>
                    <div className="text-4xl font-black mb-8 relative z-10 font-mono tracking-tighter">00:00:00</div>
                    <button className="w-full bg-white text-indigo-600 font-black text-xs uppercase tracking-[0.2em] py-5 rounded-2xl relative z-10 hover:shadow-2xl transition-all active:scale-95">
                        Start Focus
                    </button>
                </div>

                <div className="bg-zinc-900/40 border border-white/5 rounded-[2.5rem] p-8 space-y-6">
                    <h3 className="text-sm font-black text-white uppercase tracking-widest">Upcoming Deadlines</h3>
                    <div className="space-y-4">
                        {tasks.filter(t => t.dueDate).slice(0, 3).map((task) => (
                            <div key={task._id} className="flex gap-4">
                                <div className="w-10 h-10 bg-white/5 rounded-xl flex items-center justify-center flex-shrink-0">
                                    <Calendar className="w-4 h-4 text-zinc-500" />
                                </div>
                                <div>
                                    <p className="text-xs font-bold text-white mb-0.5 truncate max-w-[150px]">{task.title}</p>
                                    <p className="text-[10px] text-zinc-500 font-black uppercase tracking-widest">{new Date(task.dueDate).toLocaleDateString()}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}

function DeliverablesTab({ deliverables }: { deliverables: any[] }) {
    return (
        <div className="pt-8 space-y-8">
            <div className="flex items-center justify-between">
                <h2 className="text-xl font-black text-white tracking-tight">Project Assets & Deliverables</h2>
                <button className="bg-indigo-500 text-white font-black text-[10px] uppercase tracking-widest py-3 px-8 rounded-2xl hover:bg-indigo-600 transition-all">
                    Upload Deliverable
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {deliverables.length > 0 ? deliverables.map((del) => (
                    <div key={del._id} className="bg-zinc-900/40 border border-white/5 p-8 rounded-[2.5rem] hover:border-white/10 transition-all group">
                        <div className="w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center mb-6 text-zinc-400 group-hover:text-indigo-400 transition-colors">
                            <Paperclip className="w-6 h-6" />
                        </div>
                        <h3 className="text-white font-black mb-1">{del.name}</h3>
                        <p className="text-xs text-zinc-500 mb-6 line-clamp-2">{del.description || 'No description provided.'}</p>

                        <div className="flex items-center justify-between pt-6 border-t border-white/5">
                            <div className="flex flex-col gap-1">
                                <span className="text-[10px] font-black uppercase tracking-widest text-zinc-600">Version</span>
                                <span className="text-white font-black text-xs">v{del.versionNumber}</span>
                            </div>
                            <div className="flex flex-col items-end gap-1">
                                <span className="text-[10px] font-black uppercase tracking-widest text-zinc-600">Status</span>
                                <span className={`text-[10px] font-black uppercase tracking-widest ${del.status === 'Approved' ? 'text-emerald-500' : 'text-amber-500'}`}>{del.status}</span>
                            </div>
                        </div>
                    </div>
                )) : (
                    <div className="col-span-full py-20 text-center border-2 border-dashed border-white/5 rounded-[2.5rem]">
                        <p className="text-zinc-600 font-black uppercase tracking-widest text-xs">No deliverables uploaded yet.</p>
                    </div>
                )}
            </div>
        </div>
    );
}

function MessagesTab({ messages }: { messages: any[] }) {
    return (
        <div className="pt-8 flex flex-col h-[600px] bg-zinc-900/20 border border-white/5 rounded-[2.5rem] overflow-hidden">
            <div className="flex-1 overflow-y-auto p-8 space-y-8 scrollbar-hide">
                {messages.length > 0 ? messages.map((msg, i) => (
                    <div key={i} className={`flex ${msg.sender === 'Creator' ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-[70%] p-6 rounded-[2rem] ${msg.sender === 'Creator' ? 'bg-indigo-600 text-white rounded-tr-none' : 'bg-zinc-800 text-zinc-300 rounded-tl-none'}`}>
                            <p className="text-sm font-medium mb-3">{msg.content}</p>
                            <p className={`text-[9px] font-black uppercase tracking-widest ${msg.sender === 'Creator' ? 'text-indigo-200' : 'text-zinc-500'}`}>
                                {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </p>
                        </div>
                    </div>
                )) : (
                    <div className="h-full flex flex-col items-center justify-center opacity-20">
                        <MessageSquare className="w-16 h-16 mb-4" />
                        <p className="font-black uppercase tracking-[0.2em] text-xs">No messages yet</p>
                    </div>
                )}
            </div>

            <div className="p-6 bg-zinc-900/50 border-t border-white/5">
                <div className="relative">
                    <input
                        type="text"
                        placeholder="Type your message to the client..."
                        className="w-full bg-zinc-950 border border-white/5 rounded-2xl py-5 px-8 pr-16 text-sm text-white focus:outline-none focus:border-indigo-500 transition-all font-medium"
                    />
                    <button className="absolute right-4 top-1/2 -translate-y-1/2 bg-indigo-500 p-3 rounded-xl text-white hover:bg-indigo-600 transition-all">
                        <ArrowUpRight className="w-4 h-4" />
                    </button>
                </div>
            </div>
        </div>
    );
}

function PaymentsTab({ financials }: { financials: any }) {
    if (!financials) return null;

    return (
        <div className="pt-8 space-y-12">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div className="bg-zinc-900/40 border border-white/5 p-8 rounded-[2.5rem] space-y-2">
                    <p className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Total Project Value</p>
                    <p className="text-3xl font-black text-white">₹{(financials.totalValue / 100).toLocaleString()}</p>
                </div>
                <div className="bg-zinc-900/40 border border-white/5 p-8 rounded-[2.5rem] space-y-2">
                    <p className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Amount Paid</p>
                    <p className="text-3xl font-black text-emerald-500">₹{(financials.amountPaid / 100).toLocaleString()}</p>
                </div>
                <div className="bg-zinc-900/40 border border-white/5 p-8 rounded-[2.5rem] space-y-2">
                    <p className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Remaining Balance</p>
                    <p className="text-3xl font-black text-amber-500">₹{(financials.remainingBalance / 100).toLocaleString()}</p>
                </div>
            </div>

            <div className="space-y-6">
                <h3 className="text-xl font-black text-white tracking-tight">Invoices</h3>
                <div className="bg-zinc-900/40 border border-white/5 rounded-[2.5rem] overflow-hidden">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="border-b border-white/5">
                                <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-zinc-500">Invoice ID</th>
                                <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-zinc-500">Date</th>
                                <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-zinc-500">Amount</th>
                                <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-zinc-500">Status</th>
                                <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-zinc-500 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {financials.invoices.map((inv: any) => (
                                <tr key={inv.id} className="border-b border-white/5 hover:bg-white/[0.02] transition-colors group">
                                    <td className="px-8 py-6 font-bold text-white">{inv.id}</td>
                                    <td className="px-8 py-6 text-sm text-zinc-400">{new Date(inv.date).toLocaleDateString()}</td>
                                    <td className="px-8 py-6 font-black text-white text-lg">₹{(inv.amount / 100).toLocaleString()}</td>
                                    <td className="px-8 py-6">
                                        <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest ${inv.status === 'Paid' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-amber-500/10 text-amber-500'}`}>
                                            {inv.status}
                                        </span>
                                    </td>
                                    <td className="px-8 py-6 text-right">
                                        <button className="p-3 bg-zinc-800 rounded-xl text-zinc-400 hover:text-white transition-all">
                                            <ExternalLink className="w-4 h-4" />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}

const Plus = ({ className }: { className?: string }) => (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
    </svg>
);

