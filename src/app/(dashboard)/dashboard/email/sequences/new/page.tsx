'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Plus, Trash2, Loader2, Mail, Clock, Zap, Package } from 'lucide-react';
import toast from 'react-hot-toast';

interface EmailStep {
    delayHours: number;
    subject: string;
    content: string;
    sequenceOrder: number;
}

export default function NewSequencePage() {
    const router = useRouter();
    const [saving, setSaving] = useState(false);
    const [name, setName] = useState('');
    const [triggerType, setTriggerType] = useState('purchase');
    const [triggerProductId, setTriggerProductId] = useState('');
    const [products, setProducts] = useState<any[]>([]);
    const [steps, setSteps] = useState<EmailStep[]>([
        { delayHours: 0, subject: '', content: '', sequenceOrder: 0 },
    ]);

    useEffect(() => {
        // Fetch products for the selector
        fetch('/api/creator/products?status=published')
            .then(res => res.json())
            .then(data => setProducts(data.products || []))
            .catch(() => { });
    }, []);

    const addStep = () => {
        setSteps(prev => [
            ...prev,
            { delayHours: 24, subject: '', content: '', sequenceOrder: prev.length },
        ]);
    };

    const removeStep = (index: number) => {
        if (steps.length <= 1) return;
        setSteps(prev => prev.filter((_, i) => i !== index).map((s, i) => ({ ...s, sequenceOrder: i })));
    };

    const updateStep = (index: number, field: keyof EmailStep, value: string | number) => {
        setSteps(prev => prev.map((s, i) => i === index ? { ...s, [field]: value } : s));
    };

    const handleSave = async (activate: boolean) => {
        if (!name.trim()) return toast.error('Enter a sequence name');
        if (steps.some(s => !s.subject.trim() || !s.content.trim())) {
            return toast.error('All steps need a subject and body');
        }

        setSaving(true);
        try {
            const res = await fetch('/api/creator/email/automations', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name,
                    triggerType,
                    triggerProductId: (triggerType === 'purchase' || triggerType === 'lead_magnet') ? triggerProductId || undefined : undefined,
                    steps,
                    isActive: activate,
                }),
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.error || data.message || 'Failed to create sequence');

            toast.success(activate ? 'Sequence created & activated!' : 'Sequence saved as draft');
            router.push('/dashboard/email/sequences');
        } catch (err: any) {
            toast.error(err.message);
        } finally {
            setSaving(false);
        }
    };

    const showProductSelector = triggerType === 'purchase' || triggerType === 'lead_magnet';

    const triggerLabels: Record<string, { label: string; desc: string; icon: string }> = {
        purchase: { label: 'Product Purchase', desc: 'Triggered when someone buys a product', icon: '🛒' },
        lead_magnet: { label: 'Lead Magnet Download', desc: 'Triggered when someone downloads a freebie', icon: '🧲' },
        new_subscriber: { label: 'New Subscriber', desc: 'Triggered when someone joins your newsletter', icon: '📬' },
        signup: { label: 'Signup', desc: 'Triggered when someone creates an account', icon: '✨' },
        manual: { label: 'Manual', desc: 'Manually enroll subscribers via dashboard', icon: '✋' },
    };

    const delayOptions = [
        { value: 0, label: 'Immediately' },
        { value: 1, label: '1 hour' },
        { value: 4, label: '4 hours' },
        { value: 24, label: '1 day' },
        { value: 48, label: '2 days' },
        { value: 72, label: '3 days' },
        { value: 168, label: '1 week' },
    ];

    return (
        <div className="max-w-3xl mx-auto pb-20 space-y-8">
            {/* Header */}
            <div className="flex items-center gap-4">
                <button onClick={() => router.back()} className="w-10 h-10 rounded-2xl bg-white/5 border border-white/5 flex items-center justify-center hover:bg-white/10 transition-all">
                    <ArrowLeft className="w-4 h-4 text-zinc-400" />
                </button>
                <div>
                    <h1 className="text-2xl font-black text-white uppercase tracking-tight italic">New Sequence</h1>
                    <p className="text-[10px] text-zinc-600 font-black uppercase tracking-widest mt-0.5">Build an automated email flow</p>
                </div>
            </div>

            {/* Sequence Name */}
            <div className="space-y-2">
                <label className="text-[10px] font-black text-zinc-600 uppercase tracking-widest ml-1">Sequence Name</label>
                <input
                    type="text"
                    value={name}
                    onChange={e => setName(e.target.value)}
                    placeholder="e.g. Welcome Series, Post-Purchase Nurture"
                    className="w-full bg-[#0a0a0a] border border-white/10 rounded-2xl py-4 px-6 text-white font-bold focus:outline-none focus:border-indigo-500/50 transition-all placeholder:text-zinc-800"
                />
            </div>

            {/* Trigger Selector */}
            <div className="space-y-4">
                <label className="text-[10px] font-black text-zinc-600 uppercase tracking-widest ml-1 flex items-center gap-2">
                    <Zap className="w-3 h-3 text-indigo-400" /> Trigger Event
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {Object.entries(triggerLabels).map(([key, { label, desc, icon }]) => (
                        <button
                            key={key}
                            type="button"
                            onClick={() => setTriggerType(key)}
                            className={`text-left p-4 rounded-2xl border transition-all ${triggerType === key
                                    ? 'bg-indigo-500/10 border-indigo-500/30 ring-1 ring-indigo-500/20'
                                    : 'bg-[#0a0a0a] border-white/5 hover:border-white/10'
                                }`}
                        >
                            <div className="flex items-center gap-3">
                                <span className="text-xl">{icon}</span>
                                <div>
                                    <p className={`text-xs font-black uppercase tracking-wide ${triggerType === key ? 'text-indigo-400' : 'text-white'}`}>{label}</p>
                                    <p className="text-[10px] text-zinc-600 mt-0.5">{desc}</p>
                                </div>
                            </div>
                        </button>
                    ))}
                </div>
            </div>

            {/* Product Selector */}
            {showProductSelector && (
                <div className="space-y-2 animate-in slide-in-from-top-2 duration-200">
                    <label className="text-[10px] font-black text-zinc-600 uppercase tracking-widest ml-1 flex items-center gap-2">
                        <Package className="w-3 h-3 text-indigo-400" /> Select Product (Optional)
                    </label>
                    <select
                        value={triggerProductId}
                        onChange={e => setTriggerProductId(e.target.value)}
                        className="w-full bg-[#0a0a0a] border border-white/10 rounded-2xl py-4 px-6 text-white font-bold focus:outline-none focus:border-indigo-500/50 transition-all appearance-none"
                    >
                        <option value="">Any product</option>
                        {products.map(p => (
                            <option key={p._id} value={p._id}>{p.title || p.name}</option>
                        ))}
                    </select>
                    <p className="text-[10px] text-zinc-700 ml-1 italic">Leave blank to trigger for all products</p>
                </div>
            )}

            {/* Email Steps */}
            <div className="space-y-4">
                <div className="flex items-center justify-between">
                    <label className="text-[10px] font-black text-zinc-600 uppercase tracking-widest ml-1 flex items-center gap-2">
                        <Mail className="w-3 h-3 text-indigo-400" /> Email Steps ({steps.length})
                    </label>
                </div>

                <div className="space-y-4">
                    {steps.map((step, index) => (
                        <div key={index} className="relative bg-[#0a0a0a] border border-white/5 rounded-[2rem] p-6 space-y-4 group hover:border-white/10 transition-all">
                            {/* Step Number */}
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-full bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center">
                                        <span className="text-xs font-black text-indigo-400">{index + 1}</span>
                                    </div>
                                    <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">
                                        {index === 0 ? 'First email' : `Email #${index + 1}`}
                                    </p>
                                </div>
                                {steps.length > 1 && (
                                    <button
                                        onClick={() => removeStep(index)}
                                        className="text-zinc-700 hover:text-rose-400 transition-colors opacity-0 group-hover:opacity-100"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                )}
                            </div>

                            {/* Delay */}
                            <div className="flex items-center gap-3 p-3 bg-white/[0.02] border border-white/5 rounded-xl">
                                <Clock className="w-4 h-4 text-zinc-600 shrink-0" />
                                <label className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest shrink-0">Send after:</label>
                                <select
                                    value={step.delayHours}
                                    onChange={e => updateStep(index, 'delayHours', parseInt(e.target.value))}
                                    className="bg-transparent text-white font-bold text-sm focus:outline-none flex-1 appearance-none cursor-pointer"
                                >
                                    {delayOptions.map(opt => (
                                        <option key={opt.value} value={opt.value} className="bg-zinc-900">{opt.label}</option>
                                    ))}
                                </select>
                            </div>

                            {/* Subject */}
                            <input
                                type="text"
                                value={step.subject}
                                onChange={e => updateStep(index, 'subject', e.target.value)}
                                placeholder="Subject line..."
                                className="w-full bg-black border border-white/10 rounded-xl py-3 px-4 text-white font-bold text-sm focus:outline-none focus:border-indigo-500/50 transition-all placeholder:text-zinc-800"
                            />

                            {/* Body */}
                            <textarea
                                value={step.content}
                                onChange={e => updateStep(index, 'content', e.target.value)}
                                placeholder="Email body... Use {{first_name}} for personalization and {{product_link}} for the product URL"
                                rows={4}
                                className="w-full bg-black border border-white/10 rounded-xl py-3 px-4 text-white font-medium text-sm leading-relaxed focus:outline-none focus:border-indigo-500/50 transition-all placeholder:text-zinc-800 resize-none"
                            />
                        </div>
                    ))}
                </div>

                {/* Add Step Button */}
                <button
                    type="button"
                    onClick={addStep}
                    className="w-full py-4 border-2 border-dashed border-white/10 hover:border-indigo-500/30 rounded-2xl text-[10px] font-black text-zinc-600 uppercase tracking-widest hover:text-indigo-400 transition-all flex items-center justify-center gap-2"
                >
                    <Plus className="w-4 h-4" /> Add Another Email
                </button>
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-4 border-t border-white/5">
                <button
                    onClick={() => handleSave(false)}
                    disabled={saving}
                    className="flex-1 py-4 bg-white/5 hover:bg-white/10 text-white rounded-2xl font-black text-xs uppercase tracking-[0.15em] transition-all border border-white/5 disabled:opacity-50"
                >
                    {saving ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : 'Save Draft'}
                </button>
                <button
                    onClick={() => handleSave(true)}
                    disabled={saving}
                    className="flex-1 py-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl font-black text-xs uppercase tracking-[0.15em] transition-all shadow-xl shadow-indigo-500/20 disabled:opacity-50"
                >
                    {saving ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : 'Save & Activate'}
                </button>
            </div>
        </div>
    );
}
