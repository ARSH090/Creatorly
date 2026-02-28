'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
    DndContext, closestCenter, PointerSensor, KeyboardSensor,
    useSensor, useSensors, DragEndEvent,
} from '@dnd-kit/core';
import {
    arrayMove, SortableContext, sortableKeyboardCoordinates,
    useSortable, verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { motion, AnimatePresence } from 'framer-motion';
import {
    GripVertical, Plus, Trash2, Save, Zap, MessageSquare, HelpCircle,
    Mail, Clock, MousePointer, ChevronRight, ArrowRight, Loader2,
    ToggleLeft, ToggleRight, ExternalLink,
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { IAutoDMFlow, IFlowStep, FlowStepType } from '@/lib/models/AutoDMFlow';

// ─── Step type meta ────────────────────────────────────────────────────────────

const STEP_TYPES: { type: FlowStepType; icon: React.ReactNode; label: string; color: string; description: string }[] = [
    { type: 'message', icon: <MessageSquare size={16} />, label: 'Send Message', color: 'indigo', description: 'Send a DM to the user' },
    { type: 'question', icon: <HelpCircle size={16} />, label: 'Ask + Buttons', color: 'violet', description: 'Ask a question with button replies' },
    { type: 'email_collect', icon: <Mail size={16} />, label: 'Collect Email', color: 'emerald', description: 'Capture user\'s email address' },
    { type: 'delay', icon: <Clock size={16} />, label: 'Delay', color: 'amber', description: 'Wait before next step' },
];

function genId() {
    return `step_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
}

function newStep(type: FlowStepType, order: number): IFlowStep {
    return { id: genId(), type, content: '', order, buttons: [], nextStepId: undefined };
}

// ─── Sortable Step Card ────────────────────────────────────────────────────────

function SortableStep({
    step, isSelected, onClick, onDelete,
}: {
    step: IFlowStep;
    isSelected: boolean;
    onClick: () => void;
    onDelete: () => void;
}) {
    const meta = STEP_TYPES.find(s => s.type === step.type);
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: step.id });
    const style = { transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.4 : 1 };

    const colorMap: Record<string, string> = {
        indigo: 'border-indigo-500/60 bg-indigo-500/8 text-indigo-400',
        violet: 'border-violet-500/60 bg-violet-500/8 text-violet-400',
        emerald: 'border-emerald-500/60 bg-emerald-500/8 text-emerald-400',
        amber: 'border-amber-500/60 bg-amber-500/8 text-amber-400',
    };
    const iconClass = colorMap[meta?.color ?? 'indigo'];

    return (
        <div
            ref={setNodeRef}
            style={style}
            className={`group flex items-center gap-3 px-3 py-3 rounded-xl border transition-all cursor-pointer ${isSelected
                ? 'border-indigo-500/60 bg-indigo-500/8'
                : 'border-white/6 bg-white/[0.02] hover:border-white/15'
                }`}
            onClick={onClick}
        >
            <button {...attributes} {...listeners} className="text-zinc-700 hover:text-zinc-400 cursor-grab active:cursor-grabbing flex-shrink-0">
                <GripVertical size={15} />
            </button>
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center border flex-shrink-0 ${iconClass}`}>
                {meta?.icon}
            </div>
            <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-white truncate">{meta?.label}</p>
                <p className="text-[10px] text-zinc-600 truncate">{step.content || 'No message set'}</p>
            </div>
            <button
                onClick={e => { e.stopPropagation(); onDelete(); }}
                className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg text-zinc-700 hover:text-rose-400 hover:bg-rose-500/10"
            >
                <Trash2 size={12} />
            </button>
            {isSelected && <ChevronRight size={13} className="text-indigo-400 flex-shrink-0" />}
        </div>
    );
}

// ─── Step Settings Panel ───────────────────────────────────────────────────────

function StepSettings({ step, onChange }: { step: IFlowStep; onChange: (patch: Partial<IFlowStep>) => void }) {
    return (
        <div className="p-4 space-y-4">
            <div>
                <label className="text-[9px] font-black uppercase tracking-[0.2em] text-zinc-500 block mb-1.5">
                    {step.type === 'delay' ? 'Delay (seconds)' : 'Message Text'}
                </label>
                {step.type === 'delay' ? (
                    <input
                        type="number"
                        min={1}
                        max={3600}
                        value={step.delaySeconds ?? 5}
                        onChange={e => onChange({ delaySeconds: Number(e.target.value) })}
                        className="w-full bg-black/40 border border-white/8 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500/50"
                    />
                ) : (
                    <textarea
                        rows={4}
                        value={step.content}
                        onChange={e => onChange({ content: e.target.value })}
                        placeholder={step.type === 'email_collect'
                            ? "What's your email address? I'll send it right over!"
                            : "Hey {{name}}! Thanks for reaching out 🎉"}
                        className="w-full bg-black/40 border border-white/8 rounded-xl px-3 py-2.5 text-sm text-zinc-300 resize-none focus:outline-none focus:border-indigo-500/50 placeholder-zinc-700"
                    />
                )}
                {step.type !== 'delay' && (
                    <p className="text-[10px] text-zinc-700 mt-1">Use {'{{name}}'}, {'{{username}}'}, {'{{link}}'}, {'{{email}}'}</p>
                )}
            </div>

            {/* Quick reply buttons for question steps */}
            {step.type === 'question' && (
                <div>
                    <label className="text-[9px] font-black uppercase tracking-[0.2em] text-zinc-500 block mb-2">
                        Quick Reply Buttons
                    </label>
                    <div className="space-y-2">
                        {(step.buttons ?? []).map((btn, i) => (
                            <div key={btn.id} className="flex items-center gap-2">
                                <input
                                    value={btn.label}
                                    onChange={e => {
                                        const updated = [...(step.buttons ?? [])];
                                        updated[i] = { ...updated[i], label: e.target.value };
                                        onChange({ buttons: updated });
                                    }}
                                    placeholder={`Button ${i + 1}`}
                                    className="flex-1 bg-black/40 border border-white/8 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500/50"
                                />
                                <button
                                    onClick={() => {
                                        const updated = (step.buttons ?? []).filter((_, j) => j !== i);
                                        onChange({ buttons: updated });
                                    }}
                                    className="p-1.5 text-zinc-700 hover:text-rose-400"
                                >
                                    <Trash2 size={12} />
                                </button>
                            </div>
                        ))}
                        {(step.buttons?.length ?? 0) < 3 && (
                            <button
                                onClick={() => onChange({
                                    buttons: [...(step.buttons ?? []), {
                                        id: genId(),
                                        label: '',
                                        action: 'next_step',
                                    }],
                                })}
                                className="w-full flex items-center gap-1.5 px-3 py-2 border border-dashed border-white/10 rounded-lg text-xs text-zinc-600 hover:text-zinc-400 hover:border-white/20"
                            >
                                <Plus size={11} /> Add Button
                            </button>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}

// ─── Main FlowBuilder ─────────────────────────────────────────────────────────

export function FlowBuilder({ flowId, initialFlow }: { flowId?: string; initialFlow?: Partial<IAutoDMFlow> }) {
    const [steps, setSteps] = useState<IFlowStep[]>(initialFlow?.steps ?? []);
    const [name, setName] = useState(initialFlow?.name ?? 'New Flow');
    const [triggerType, setTriggerType] = useState<string>(initialFlow?.trigger?.type ?? 'comment');
    const [keyword, setKeyword] = useState(initialFlow?.trigger?.keywords?.[0] ?? '');
    const [isActive, setIsActive] = useState(initialFlow?.isActive ?? false);
    const [selectedStepId, setSelectedStepId] = useState<string | null>(null);
    const [isSaving, setIsSaving] = useState(false);

    const sensors = useSensors(
        useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
        useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
    );

    const handleDragEnd = (e: DragEndEvent) => {
        const { active, over } = e;
        if (!over || active.id === over.id) return;
        setSteps(prev => {
            const oldIdx = prev.findIndex(s => s.id === active.id);
            const newIdx = prev.findIndex(s => s.id === over.id);
            return arrayMove(prev, oldIdx, newIdx).map((s, i) => ({ ...s, order: i }));
        });
    };

    const addStep = (type: FlowStepType) => {
        const step = newStep(type, steps.length);
        setSteps(prev => [...prev, step]);
        setSelectedStepId(step.id);
    };

    const updateStep = (id: string, patch: Partial<IFlowStep>) => {
        setSteps(prev => prev.map(s => s.id === id ? { ...s, ...patch } : s));
    };

    const deleteStep = (id: string) => {
        setSteps(prev => prev.filter(s => s.id !== id));
        if (selectedStepId === id) setSelectedStepId(null);
    };

    const save = async () => {
        setIsSaving(true);
        try {
            const payload = {
                name,
                trigger: { type: triggerType, keywords: keyword ? [keyword] : [], matchType: 'contains', postId: 'all' },
                steps: steps.map((s, i) => ({ ...s, order: i })),
                isActive,
            };

            const url = flowId ? `/api/autodm/flows/${flowId}` : '/api/autodm/flows';
            const method = flowId ? 'PATCH' : 'POST';

            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });

            if (!res.ok) throw new Error('Save failed');
            toast.success(isActive ? 'Flow saved and live! 🚀' : 'Flow saved as draft');
        } catch (err) {
            toast.error('Failed to save flow');
        } finally {
            setIsSaving(false);
        }
    };

    const selectedStep = steps.find(s => s.id === selectedStepId) ?? null;

    return (
        <div className="flex h-[calc(100vh-120px)] overflow-hidden gap-0 bg-[#080808] rounded-2xl border border-white/5">
            {/* ── LEFT: Step List ───────────────────────────────────────────── */}
            <div className="w-72 flex-shrink-0 border-r border-white/5 flex flex-col">
                {/* Header */}
                <div className="px-4 py-4 border-b border-white/5">
                    <input
                        value={name}
                        onChange={e => setName(e.target.value)}
                        className="w-full bg-transparent text-lg font-black text-white outline-none border-b border-transparent focus:border-indigo-500/50 pb-1"
                        placeholder="Flow Name"
                    />
                    <div className="mt-3 flex items-center gap-2">
                        <select
                            value={triggerType}
                            onChange={e => setTriggerType(e.target.value)}
                            className="flex-1 bg-black/40 border border-white/8 rounded-lg px-2 py-1.5 text-[11px] text-zinc-400 outline-none"
                        >
                            <option value="comment">💬 Comment Keyword</option>
                            <option value="dm_keyword">📩 DM Keyword</option>
                            <option value="story_reply">📖 Story Reply</option>
                            <option value="new_follower">👋 New Follower</option>
                        </select>
                        <button
                            onClick={() => setIsActive(v => !v)}
                            className={`p-1.5 rounded-lg transition-colors ${isActive ? 'text-emerald-400' : 'text-zinc-600'}`}
                            title={isActive ? 'Active' : 'Draft'}
                        >
                            {isActive ? <ToggleRight size={20} /> : <ToggleLeft size={20} />}
                        </button>
                    </div>
                    {(triggerType === 'comment' || triggerType === 'dm_keyword') && (
                        <input
                            value={keyword}
                            onChange={e => setKeyword(e.target.value)}
                            placeholder="Trigger keyword (e.g. FREEBIE)"
                            className="mt-2 w-full bg-black/40 border border-white/8 rounded-lg px-3 py-2 text-xs text-white outline-none focus:border-indigo-500/50 placeholder-zinc-700"
                        />
                    )}
                </div>

                {/* Steps */}
                <div className="flex-1 overflow-y-auto p-3 space-y-2">
                    {steps.length === 0 && (
                        <div className="text-center py-8 text-zinc-700 text-sm">
                            <Zap size={24} className="mx-auto mb-2 opacity-30" />
                            No steps yet. Add one below.
                        </div>
                    )}
                    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                        <SortableContext items={steps.map(s => s.id)} strategy={verticalListSortingStrategy}>
                            {steps.map(s => (
                                <SortableStep
                                    key={s.id}
                                    step={s}
                                    isSelected={selectedStepId === s.id}
                                    onClick={() => setSelectedStepId(s.id)}
                                    onDelete={() => deleteStep(s.id)}
                                />
                            ))}
                        </SortableContext>
                    </DndContext>
                </div>

                {/* Add Step */}
                <div className="border-t border-white/5 p-3">
                    <p className="text-[9px] font-black uppercase tracking-[0.2em] text-zinc-600 mb-2">Add Step</p>
                    <div className="grid grid-cols-2 gap-1.5">
                        {STEP_TYPES.map(meta => (
                            <button
                                key={meta.type}
                                onClick={() => addStep(meta.type)}
                                className="flex items-center gap-1.5 px-2.5 py-2 rounded-xl border border-white/5 bg-white/[0.02] hover:border-indigo-500/40 hover:bg-indigo-500/5 text-left text-xs text-zinc-400 transition-all"
                            >
                                {meta.icon}
                                <span className="font-bold truncate">{meta.label}</span>
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* ── CENTER: Canvas ──────────────────────────────────────────────── */}
            <div className="flex-1 flex flex-col overflow-hidden">
                <div className="flex-1 overflow-auto p-8 flex flex-col items-center gap-0">
                    {/* Trigger Node */}
                    <div className="w-64 rounded-2xl border border-violet-500/40 bg-violet-500/5 p-4 text-center mb-1">
                        <div className="text-sm font-black text-violet-300 mb-1">⚡ Trigger</div>
                        <div className="text-xs text-zinc-500 capitalize">
                            {triggerType.replace('_', ' ')}
                            {keyword && <span className="ml-1 font-bold text-white">"{keyword}"</span>}
                        </div>
                    </div>

                    {steps.map((step, i) => {
                        const meta = STEP_TYPES.find(s => s.type === step.type);
                        const colorBorder: Record<string, string> = {
                            indigo: 'border-indigo-500/40 bg-indigo-500/5',
                            violet: 'border-violet-500/40 bg-violet-500/5',
                            emerald: 'border-emerald-500/40 bg-emerald-500/5',
                            amber: 'border-amber-500/40 bg-amber-500/5',
                        };
                        return (
                            <React.Fragment key={step.id}>
                                {/* Arrow */}
                                <div className="flex flex-col items-center py-1">
                                    <div className="w-px h-8 bg-white/10" />
                                    <ArrowRight size={12} className="text-zinc-700 -rotate-90" />
                                </div>
                                {/* Step node */}
                                <div
                                    className={`w-72 rounded-2xl border p-4 cursor-pointer transition-all ${colorBorder[meta?.color ?? 'indigo']} ${selectedStepId === step.id ? 'ring-2 ring-indigo-500/40' : ''}`}
                                    onClick={() => setSelectedStepId(step.id)}
                                >
                                    <div className="flex items-center gap-2 mb-1">
                                        <span className={`text-${meta?.color}-400`}>{meta?.icon}</span>
                                        <span className="text-xs font-bold text-white">{meta?.label}</span>
                                        <span className="ml-auto text-[10px] text-zinc-600">Step {i + 1}</span>
                                    </div>
                                    <p className="text-xs text-zinc-500 truncate">
                                        {step.type === 'delay'
                                            ? `Wait ${step.delaySeconds ?? 5}s`
                                            : step.content || 'Click to add message...'}
                                    </p>
                                    {step.buttons && step.buttons.length > 0 && (
                                        <div className="mt-2 flex flex-wrap gap-1">
                                            {step.buttons.map(b => (
                                                <span key={b.id} className="px-2 py-0.5 bg-white/5 border border-white/10 rounded-full text-[10px] text-zinc-400 flex items-center gap-1">
                                                    <MousePointer size={8} /> {b.label || 'Button'}
                                                </span>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </React.Fragment>
                        );
                    })}

                    {steps.length > 0 && (
                        <>
                            <div className="flex flex-col items-center py-1">
                                <div className="w-px h-8 bg-white/10" />
                            </div>
                            <div className="w-32 rounded-2xl border border-white/5 bg-white/[0.02] p-3 text-center text-xs text-zinc-600">
                                ✅ End
                            </div>
                        </>
                    )}
                </div>

                {/* Save bar */}
                <div className="border-t border-white/5 px-6 py-3 flex items-center gap-3">
                    <button
                        onClick={save}
                        disabled={isSaving}
                        className="flex items-center gap-2 bg-indigo-500 hover:bg-indigo-600 text-white text-sm font-black px-5 py-2.5 rounded-xl transition-colors disabled:opacity-50"
                    >
                        {isSaving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
                        {isActive ? 'Save & Go Live' : 'Save Draft'}
                    </button>
                    <span className="text-xs text-zinc-600">{steps.length} steps</span>
                    {isActive && (
                        <span className="flex items-center gap-1 text-xs text-emerald-400 font-bold">
                            <Zap size={11} /> Active
                        </span>
                    )}
                </div>
            </div>

            {/* ── RIGHT: Settings Panel ──────────────────────────────────────── */}
            <AnimatePresence>
                {selectedStep && (
                    <motion.div
                        initial={{ width: 0, opacity: 0 }}
                        animate={{ width: 300, opacity: 1 }}
                        exit={{ width: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="flex-shrink-0 border-l border-white/5 flex flex-col overflow-hidden bg-[#0A0A0A]"
                    >
                        <div className="px-4 py-4 border-b border-white/5">
                            <p className="text-sm font-black text-white">
                                {STEP_TYPES.find(s => s.type === selectedStep.type)?.label} Settings
                            </p>
                        </div>
                        <div className="flex-1 overflow-y-auto">
                            <StepSettings
                                step={selectedStep}
                                onChange={patch => updateStep(selectedStep.id, patch)}
                            />
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

export default FlowBuilder;
