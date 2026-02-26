'use client';

import React, { useState, useEffect } from 'react';
import {
    ChevronRight, ChevronLeft, Check,
    UserPlus, Layout, CreditCard, Sparkles,
    Briefcase, Users, FileText, Zap,
    Search, Plus, X
} from 'lucide-react';
import { useAuth } from '@clerk/nextjs';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';

type Step = 'details' | 'client' | 'template' | 'review';

export default function NewProjectPage() {
    const { getToken, isLoaded, isSignedIn } = useAuth();
    const router = useRouter();
    const [step, setStep] = useState<Step>('details');
    const [loading, setLoading] = useState(false);

    // Form State
    const [formData, setFormData] = useState({
        name: '',
        category: 'Development',
        description: '',
        client: null as any,
        template: null as any,
        value: 0,
        startDate: new Date().toISOString().split('T')[0],
        dueDate: ''
    });

    // Data for Selection
    const [leads, setLeads] = useState<any[]>([]);
    const [templates, setTemplates] = useState<any[]>([]);
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
        if (isLoaded && isSignedIn) {
            fetchLeads();
            fetchTemplates();
        }
    }, [isLoaded, isSignedIn]);

    async function fetchLeads() {
        try {
            const token = await getToken();
            const res = await fetch('/api/creator/leads?limit=50', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await res.json();
            setLeads(data.leads || []);
        } catch (error) { console.error(error); }
    }

    async function fetchTemplates() {
        try {
            const token = await getToken();
            const res = await fetch('/api/creator/projects/templates', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await res.json();
            setTemplates(data || []);
        } catch (error) { console.error(error); }
    }

    const handleCreate = async () => {
        setLoading(true);
        try {
            const token = await getToken();
            const res = await fetch('/api/creator/projects', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    ...formData,
                    clientId: formData.client?._id,
                    clientEmail: formData.client?.email || 'test@example.com',
                    clientName: formData.client?.name || 'New Client',
                    templateId: formData.template?._id,
                    value: formData.value * 100 // convert to paise
                })
            });
            const project = await res.json();
            if (project._id) {
                router.push(`/dashboard/projects/${project._id}`);
            }
        } catch (error) {
            console.error('Project creation failed:', error);
        } finally {
            setLoading(false);
        }
    };

    const steps = [
        { id: 'details', label: 'Project Info', icon: Briefcase },
        { id: 'client', label: 'Assign Client', icon: Users },
        { id: 'template', label: 'Apply Blueprint', icon: Layout },
        { id: 'review', label: 'Final Review', icon: Sparkles }
    ];

    return (
        <div className="max-w-4xl mx-auto py-12 pb-32 space-y-12">
            {/* Header */}
            <div className="space-y-4 text-center">
                <h1 className="text-5xl font-black text-white tracking-tighter italic">Initialize.</h1>
                <p className="text-zinc-500 font-medium">Create a high-fidelity workspace for your next collaboration.</p>
            </div>

            {/* Step Indicator */}
            <div className="flex items-center justify-center gap-4">
                {steps.map((s, i) => (
                    <React.Fragment key={s.id}>
                        <div className={`flex flex-col items-center gap-3 transition-all ${step === s.id ? 'opacity-100' : 'opacity-40'}`}>
                            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center border-2 ${step === s.id ? 'bg-indigo-500 border-indigo-400 text-white' : 'bg-zinc-900 border-white/5 text-zinc-500'}`}>
                                <s.icon className="w-5 h-5" />
                            </div>
                            <span className="text-[10px] font-black uppercase tracking-widest">{s.label}</span>
                        </div>
                        {i < steps.length - 1 && <div className="w-12 h-0.5 bg-white/5 mb-8" />}
                    </React.Fragment>
                ))}
            </div>

            {/* Content Area */}
            <div className="bg-zinc-900/40 border border-white/5 rounded-[3rem] p-12 min-h-[500px] flex flex-col">
                <AnimatePresence mode="wait">
                    {step === 'details' && (
                        <motion.div
                            key="details"
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            className="space-y-8 flex-1"
                        >
                            <div className="space-y-6">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500 ml-2">Project Name</label>
                                    <input
                                        type="text"
                                        placeholder="e.g. Brand Identity Refresh"
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                        className="w-full bg-zinc-950 border border-white/5 rounded-2xl py-5 px-8 text-lg text-white font-black placeholder:text-zinc-800 focus:border-indigo-500 outline-none transition-all shadow-inner"
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500 ml-2">Category</label>
                                        <select
                                            value={formData.category}
                                            onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                                            className="w-full bg-zinc-950 border border-white/5 rounded-2xl py-5 px-8 text-white font-bold appearance-none outline-none focus:border-indigo-500 transition-all"
                                        >
                                            {['Design', 'Development', 'Coaching', 'Content', 'Video', 'Marketing', 'Consulting'].map(c => (
                                                <option key={c} value={c}>{c}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500 ml-2">Due Date (Optional)</label>
                                        <input
                                            type="date"
                                            value={formData.dueDate}
                                            onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                                            className="w-full bg-zinc-950 border border-white/5 rounded-2xl py-5 px-8 text-white font-bold outline-none focus:border-indigo-500 transition-all"
                                        />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500 ml-2">Description</label>
                                    <textarea
                                        rows={4}
                                        placeholder="Tell us a bit about the project scopes..."
                                        value={formData.description}
                                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                        className="w-full bg-zinc-950 border border-white/5 rounded-2xl py-5 px-8 text-zinc-400 font-medium outline-none focus:border-indigo-500 transition-all resize-none"
                                    />
                                </div>
                            </div>
                        </motion.div>
                    )}

                    {step === 'client' && (
                        <motion.div
                            key="client"
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            className="space-y-8 flex-1"
                        >
                            <div className="relative group">
                                <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-600 group-focus-within:text-white transition-colors" />
                                <input
                                    type="text"
                                    placeholder="Search existing leads or customers..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="w-full bg-zinc-950 border border-white/5 rounded-3xl py-5 pl-16 pr-8 text-white focus:outline-none focus:border-indigo-500 transition-all shadow-inner"
                                />
                            </div>

                            <div className="space-y-3 max-h-[300px] overflow-y-auto scrollbar-hide pr-2">
                                {leads.filter(l => l.name?.toLowerCase().includes(searchQuery.toLowerCase()) || l.email.toLowerCase().includes(searchQuery.toLowerCase())).map(lead => (
                                    <button
                                        key={lead._id}
                                        onClick={() => setFormData({ ...formData, client: lead })}
                                        className={`w-full flex items-center justify-between p-6 border rounded-2xl transition-all ${formData.client?._id === lead._id ? 'bg-indigo-500 border-indigo-400' : 'bg-transparent border-white/5 hover:border-white/10 hover:bg-white/[0.02]'}`}
                                    >
                                        <div className="flex items-center gap-4">
                                            <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center text-white font-black text-xs">
                                                {lead.name?.substring(0, 1) || '?'}
                                            </div>
                                            <div className="text-left">
                                                <p className={`font-black tracking-tight ${formData.client?._id === lead._id ? 'text-white' : 'text-zinc-300'}`}>{lead.name || 'Anonymous'}</p>
                                                <p className={`text-[10px] font-bold ${formData.client?._id === lead._id ? 'text-indigo-100' : 'text-zinc-600'}`}>{lead.email}</p>
                                            </div>
                                        </div>
                                        {formData.client?._id === lead._id && <Check className="w-5 h-5 text-white" />}
                                    </button>
                                ))}

                                <button className="w-full flex items-center gap-4 p-6 border-2 border-dashed border-white/5 rounded-2xl text-zinc-600 hover:text-white hover:border-white/20 transition-all group">
                                    <div className="p-3 bg-white/5 rounded-xl group-hover:bg-indigo-500 group-hover:text-white transition-all">
                                        <Plus className="w-4 h-4" />
                                    </div>
                                    <span className="text-[10px] font-black uppercase tracking-widest">Add New Client Manually</span>
                                </button>
                            </div>
                        </motion.div>
                    )}

                    {step === 'template' && (
                        <motion.div
                            key="template"
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            className="space-y-8 flex-1"
                        >
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <button
                                    onClick={() => setFormData({ ...formData, template: null })}
                                    className={`p-8 border rounded-[2.5rem] text-left transition-all flex flex-col gap-6 ${!formData.template ? 'bg-indigo-500 border-indigo-400 text-white' : 'bg-transparent border-white/5 hover:border-white/10'}`}
                                >
                                    <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center">
                                        <Zap className="w-6 h-6" />
                                    </div>
                                    <div>
                                        <h3 className="text-xl font-black mb-1">Scratch Project</h3>
                                        <p className={`text-xs font-medium ${!formData.template ? 'text-indigo-100' : 'text-zinc-600'}`}>Start a blank project and add tasks later.</p>
                                    </div>
                                </button>

                                {templates.map(tpl => (
                                    <button
                                        key={tpl._id}
                                        onClick={() => setFormData({ ...formData, template: tpl })}
                                        className={`p-8 border rounded-[2.5rem] text-left transition-all flex flex-col gap-6 ${formData.template?._id === tpl._id ? 'bg-indigo-500 border-indigo-400 text-white' : 'bg-transparent border-white/5 hover:border-white/10'}`}
                                    >
                                        <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center">
                                            <Layout className="w-6 h-6" />
                                        </div>
                                        <div>
                                            <h3 className="text-xl font-black mb-1">{tpl.name}</h3>
                                            <p className={`text-xs font-medium ${formData.template?._id === tpl._id ? 'text-indigo-100' : 'text-zinc-600'}`}>{tpl.tasks?.length} Tasks • {tpl.milestones?.length} Milestones</p>
                                        </div>
                                    </button>
                                ))}
                            </div>
                        </motion.div>
                    )}

                    {step === 'review' && (
                        <motion.div
                            key="review"
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            className="space-y-12 flex-1"
                        >
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                                <div className="space-y-8">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-emerald-500">Project Value (INR)</label>
                                        <div className="relative">
                                            <span className="absolute left-6 top-1/2 -translate-y-1/2 text-zinc-500 font-bold">₹</span>
                                            <input
                                                type="number"
                                                value={formData.value}
                                                onChange={(e) => setFormData({ ...formData, value: parseInt(e.target.value) || 0 })}
                                                className="w-full bg-zinc-950 border border-white/5 rounded-2xl py-6 pl-12 pr-8 text-3xl font-black text-white focus:border-emerald-500 outline-none transition-all"
                                            />
                                        </div>
                                    </div>

                                    <div className="bg-zinc-950 border border-white/5 p-8 rounded-[2.5rem] space-y-4">
                                        <p className="text-[10px] font-black uppercase tracking-widest text-zinc-600">Assigned Client</p>
                                        <div className="flex items-center gap-4">
                                            <div className="w-10 h-10 bg-indigo-500 rounded-xl flex items-center justify-center text-white font-black text-xs capitalize">{formData.client?.name?.substring(0, 2) || 'CL'}</div>
                                            <div>
                                                <p className="text-white font-bold">{formData.client?.name || 'New Client'}</p>
                                                <p className="text-[10px] text-zinc-600 font-bold">{formData.client?.email || 'test@example.com'}</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="bg-white/5 rounded-[2.5rem] p-8 space-y-6">
                                    <p className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Blueprint Review</p>
                                    {formData.template ? (
                                        <div className="space-y-6">
                                            <div>
                                                <h4 className="text-white font-black text-lg">{formData.template.name}</h4>
                                                <p className="text-zinc-500 text-xs mt-1">This template will automatically create:</p>
                                            </div>
                                            <div className="space-y-3">
                                                {formData.template.tasks?.slice(0, 3).map((t: any, idx: number) => (
                                                    <div key={idx} className="flex items-center gap-3 text-xs text-zinc-400">
                                                        <div className="w-1 h-1 bg-white/20 rounded-full" />
                                                        {t.title}
                                                    </div>
                                                ))}
                                                {formData.template.tasks?.length > 3 && <p className="text-[9px] text-zinc-600 font-black uppercase tracking-widest pl-4">+{formData.template.tasks.length - 3} more tasks</p>}
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="h-full flex flex-col items-center justify-center py-12 text-center opacity-30 grayscale">
                                            <Zap className="w-10 h-10 mb-4" />
                                            <p className="text-xs font-black uppercase tracking-widest">Custom Build</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Navigation Buttons */}
                <div className="mt-auto pt-12 flex items-center justify-between">
                    <button
                        onClick={() => {
                            if (step === 'details') router.back();
                            else if (step === 'client') setStep('details');
                            else if (step === 'template') setStep('client');
                            else if (step === 'review') setStep('template');
                        }}
                        className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-zinc-600 hover:text-white transition-colors p-4"
                    >
                        <ChevronLeft className="w-4 h-4" />
                        {step === 'details' ? 'Cancel' : 'Previous'}
                    </button>

                    <button
                        onClick={() => {
                            if (step === 'details' && formData.name) setStep('client');
                            else if (step === 'client') setStep('template');
                            else if (step === 'template') setStep('review');
                            else if (step === 'review') handleCreate();
                        }}
                        disabled={loading || (step === 'details' && !formData.name)}
                        className={`bg-white text-black font-black text-[10px] uppercase tracking-widest px-10 py-5 rounded-2xl hover:bg-zinc-200 transition-all flex items-center gap-3 shadow-2xl disabled:opacity-50 disabled:cursor-not-allowed`}
                    >
                        {loading ? 'Initializing...' : step === 'review' ? 'Launch Project' : 'Continue'}
                        {!loading && step !== 'review' && <ChevronRight className="w-4 h-4" />}
                        {!loading && step === 'review' && <Sparkles className="w-4 h-4" />}
                    </button>
                </div>
            </div>

            {/* Security Note */}
            <div className="flex items-center justify-center gap-2 py-8 text-[10px] font-black uppercase tracking-[0.3em] text-zinc-700">
                <Sparkles className="w-3 h-3" />
                Secure Environment • Encrypted Data • Creatorly CRM
            </div>
        </div>
    );
}
