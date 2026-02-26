'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
    DndContext, closestCenter, KeyboardSensor, PointerSensor,
    useSensor, useSensors, DragEndEvent, DragOverlay, DragStartEvent,
} from '@dnd-kit/core';
import {
    arrayMove, SortableContext, sortableKeyboardCoordinates,
    useSortable, verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { motion, AnimatePresence } from 'framer-motion';
import {
    GripVertical, Plus, Eye, EyeOff, Trash2, Copy, Settings2,
    Save, Monitor, Tablet, Smartphone, Undo2, Redo2, ExternalLink,
    Palette, Layers, X, ChevronRight, ChevronLeft, Loader2, Check,
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import {
    StorefrontBlock, BlockType, BLOCK_LIBRARY, newBlock,
    THEME_PRESETS, DEFAULT_THEME_V2, StorefrontThemeV2, ThemePresetName,
} from '@/types/storefront-blocks.types';
// Settings panels
import HeroSettings from '@/components/storefront/editor/HeroSettings';
import LinksSettings from '@/components/storefront/editor/LinksSettings';
import SocialLinksSettings from '@/components/storefront/editor/SocialLinksSettings';
import ProductsSettings from '@/components/storefront/editor/ProductsSettings';
import VideoSettings from '@/components/storefront/editor/VideoSettings';
import TestimonialsSettings from '@/components/storefront/editor/TestimonialsSettings';
import FAQSettings from '@/components/storefront/editor/FAQSettings';
import CountdownSettings from '@/components/storefront/editor/CountdownSettings';
import NewsletterSettings from '@/components/storefront/editor/NewsletterSettings';
import StatsSettings from '@/components/storefront/editor/StatsSettings';
import GallerySettings from '@/components/storefront/editor/GallerySettings';
import AnnouncementSettings from '@/components/storefront/editor/AnnouncementSettings';
import TextBlockSettings from '@/components/storefront/editor/TextBlockSettings';
import GenericSettings from '@/components/storefront/editor/GenericSettings';
import { BlockRenderer } from '@/components/storefront/BlockRenderer';

type ViewMode = 'desktop' | 'tablet' | 'mobile';

// ─── Sortable Block Card ──────────────────────────────────────────────────────
function SortableBlockCard({
    block, isSelected, onClick, onToggle, onDuplicate, onDelete,
}: {
    block: StorefrontBlock;
    isSelected: boolean;
    onClick: () => void;
    onToggle: () => void;
    onDuplicate: () => void;
    onDelete: () => void;
}) {
    const meta = BLOCK_LIBRARY.find(b => b.type === block.type);
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
        useSortable({ id: block.id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.4 : 1,
    };

    return (
        <div
            ref={setNodeRef}
            style={style}
            className={`group relative flex items-center gap-3 px-3 py-3 rounded-xl border transition-all cursor-pointer ${isSelected
                ? 'border-indigo-500/60 bg-indigo-500/8'
                : 'border-white/6 bg-white/[0.02] hover:border-white/15 hover:bg-white/[0.04]'
                } ${!block.isVisible ? 'opacity-40' : ''}`}
            onClick={onClick}
        >
            {/* Drag handle */}
            <button
                {...attributes}
                {...listeners}
                className="text-zinc-700 hover:text-zinc-400 cursor-grab active:cursor-grabbing flex-shrink-0"
                onClick={e => e.stopPropagation()}
            >
                <GripVertical size={16} />
            </button>

            {/* Icon + label */}
            <span className="text-xl leading-none flex-shrink-0">{meta?.icon ?? '📦'}</span>
            <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-white truncate">{meta?.label ?? block.type}</p>
                <p className="text-[10px] text-zinc-600 truncate capitalize">{block.width} width</p>
            </div>

            {/* Actions (show on hover/selected) */}
            <div className={`flex items-center gap-1 flex-shrink-0 transition-opacity ${isSelected ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}>
                <button
                    onClick={e => { e.stopPropagation(); onToggle(); }}
                    className="p-1.5 rounded-lg hover:bg-white/10 text-zinc-500 hover:text-white"
                    title={block.isVisible ? 'Hide' : 'Show'}
                >
                    {block.isVisible ? <Eye size={13} /> : <EyeOff size={13} />}
                </button>
                <button
                    onClick={e => { e.stopPropagation(); onDuplicate(); }}
                    className="p-1.5 rounded-lg hover:bg-white/10 text-zinc-500 hover:text-white"
                    title="Duplicate"
                >
                    <Copy size={13} />
                </button>
                <button
                    onClick={e => { e.stopPropagation(); onDelete(); }}
                    className="p-1.5 rounded-lg hover:bg-rose-500/10 text-zinc-600 hover:text-rose-400"
                    title="Delete"
                >
                    <Trash2 size={13} />
                </button>
            </div>

            {/* Selected chevron */}
            {isSelected && (
                <ChevronRight size={14} className="text-indigo-400 flex-shrink-0" />
            )}
        </div>
    );
}

// ─── Settings Panel Router ────────────────────────────────────────────────────
function BlockSettingsPanel({
    block,
    onChange,
}: {
    block: StorefrontBlock;
    onChange: (patch: Partial<StorefrontBlock['settings']>) => void;
}) {
    switch (block.type) {
        case 'hero': return <HeroSettings settings={block.settings as any} onChange={onChange} />;
        case 'links': return <LinksSettings settings={block.settings as any} onChange={onChange} />;
        case 'social_links': return <SocialLinksSettings settings={block.settings as any} onChange={onChange} />;
        case 'products': return <ProductsSettings settings={block.settings as any} onChange={onChange} />;
        case 'video': return <VideoSettings settings={block.settings as any} onChange={onChange} />;
        case 'testimonials': return <TestimonialsSettings settings={block.settings as any} onChange={onChange} />;
        case 'faq': return <FAQSettings settings={block.settings as any} onChange={onChange} />;
        case 'countdown': return <CountdownSettings settings={block.settings as any} onChange={onChange} />;
        case 'newsletter': return <NewsletterSettings settings={block.settings as any} onChange={onChange} />;
        case 'stats': return <StatsSettings settings={block.settings as any} onChange={onChange} />;
        case 'gallery': return <GallerySettings settings={block.settings as any} onChange={onChange} />;
        case 'announcement': return <AnnouncementSettings settings={block.settings as any} onChange={onChange} />;
        case 'text': return <TextBlockSettings settings={block.settings as any} onChange={onChange} />;
        default: return <GenericSettings block={block} onChange={onChange} />;
    }
}

// ─── Main Editor ──────────────────────────────────────────────────────────────
export default function StorefrontEditor() {
    const [blocks, setBlocks] = useState<StorefrontBlock[]>([]);
    const [theme, setTheme] = useState<StorefrontThemeV2>(DEFAULT_THEME_V2);
    const [selectedId, setSelectedId] = useState<string | null>(null);
    const [leftPanel, setLeftPanel] = useState<'blocks' | 'add' | 'theme'>('blocks');
    const [viewMode, setViewMode] = useState<ViewMode>('desktop');
    const [isSaving, setIsSaving] = useState(false);
    const [username, setUsername] = useState('');
    const [autoSaveTimer, setAutoSaveTimer] = useState<ReturnType<typeof setTimeout> | null>(null);
    const [activeId, setActiveId] = useState<string | null>(null);

    // Undo/Redo stacks
    const [history, setHistory] = useState<StorefrontBlock[][]>([]);
    const [future, setFuture] = useState<StorefrontBlock[][]>([]);
    const MAX_HISTORY = 20;

    // --- Load profile data ---
    useEffect(() => {
        fetch('/api/creator/profile')
            .then(r => r.json())
            .then(d => {
                if (d.profile?.username) setUsername(d.profile.username);
                else if (d.profile?.storeSlug) setUsername(d.profile.storeSlug);
                if (d.blocksLayout?.length) setBlocks(d.blocksLayout);
                if (d.themeV2) setTheme(prev => ({ ...prev, ...d.themeV2 }));
                else if (d.theme) {
                    // Migrate legacy theme
                    setTheme(prev => ({
                        ...prev,
                        primaryColor: d.theme.primaryColor || prev.primaryColor,
                        backgroundColor: d.theme.backgroundColor || prev.backgroundColor,
                        textColor: d.theme.textColor || prev.textColor,
                        fontFamily: d.theme.fontFamily || prev.fontFamily,
                    }));
                }
            })
            .catch(() => { });
    }, []);

    // --- Keyboard shortcuts (Ctrl+Z / Ctrl+Y) ---
    useEffect(() => {
        const handler = (e: KeyboardEvent) => {
            if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
                e.preventDefault();
                undo();
            }
            if ((e.ctrlKey || e.metaKey) && (e.key === 'y' || (e.key === 'z' && e.shiftKey))) {
                e.preventDefault();
                redo();
            }
        };
        window.addEventListener('keydown', handler);
        return () => window.removeEventListener('keydown', handler);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [history, future, blocks]);

    // --- History helpers ---
    const pushHistory = useCallback((prev: StorefrontBlock[]) => {
        setHistory(h => [...h.slice(-MAX_HISTORY), prev]);
        setFuture([]);
    }, []);

    const undo = useCallback(() => {
        if (!history.length) return;
        const prev = history[history.length - 1];
        setFuture(f => [blocks, ...f]);
        setBlocks(prev);
        setHistory(h => h.slice(0, -1));
    }, [history, blocks]);

    const redo = useCallback(() => {
        if (!future.length) return;
        const next = future[0];
        pushHistory(blocks);
        setBlocks(next);
        setFuture(f => f.slice(1));
    }, [future, blocks, pushHistory]);

    // --- Debounced auto-save ---
    const scheduleAutoSave = useCallback((newBlocks: StorefrontBlock[], newTheme: StorefrontThemeV2) => {
        if (autoSaveTimer) clearTimeout(autoSaveTimer);
        const t = setTimeout(() => {
            saveLayout(newBlocks, newTheme, true);
        }, 1500);
        setAutoSaveTimer(t);
    }, [autoSaveTimer]);

    // --- Block mutations ---
    const updateBlocks = useCallback((updater: (prev: StorefrontBlock[]) => StorefrontBlock[]) => {
        setBlocks(prev => {
            pushHistory(prev);
            const next = updater(prev);
            scheduleAutoSave(next, theme);
            return next;
        });
    }, [pushHistory, scheduleAutoSave, theme]);

    const addBlock = (type: BlockType) => {
        const block = newBlock(type, blocks.length);
        updateBlocks(prev => [...prev, block]);
        setSelectedId(block.id);
        setLeftPanel('blocks');
    };

    const deleteBlock = (id: string) => {
        updateBlocks(prev => prev.filter(b => b.id !== id));
        if (selectedId === id) setSelectedId(null);
    };

    const duplicateBlock = (id: string) => {
        updateBlocks(prev => {
            const src = prev.find(b => b.id === id);
            if (!src) return prev;
            const clone: StorefrontBlock = {
                ...JSON.parse(JSON.stringify(src)),
                id: `block_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
                order: src.order + 1,
            };
            const idx = prev.findIndex(b => b.id === id);
            const next = [...prev];
            next.splice(idx + 1, 0, clone);
            return next.map((b, i) => ({ ...b, order: i }));
        });
    };

    const toggleBlock = (id: string) => {
        updateBlocks(prev => prev.map(b => b.id === id ? { ...b, isVisible: !b.isVisible } : b));
    };

    const updateBlockSettings = (id: string, patch: Partial<StorefrontBlock['settings']>) => {
        setBlocks(prev => {
            const next = prev.map(b => b.id === id ? { ...b, settings: { ...b.settings, ...patch } } : b);
            scheduleAutoSave(next, theme);
            return next;
        });
    };

    const updateBlockWidth = (id: string, width: StorefrontBlock['width']) => {
        updateBlocks(prev => prev.map(b => b.id === id ? { ...b, width } : b));
    };

    // --- DnD ---
    const sensors = useSensors(
        useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
        useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
    );

    const handleDragStart = (e: DragStartEvent) => setActiveId(e.active.id as string);

    const handleDragEnd = (e: DragEndEvent) => {
        setActiveId(null);
        const { active, over } = e;
        if (!over || active.id === over.id) return;
        updateBlocks(prev => {
            const oldIdx = prev.findIndex(b => b.id === active.id);
            const newIdx = prev.findIndex(b => b.id === over.id);
            return arrayMove(prev, oldIdx, newIdx).map((b, i) => ({ ...b, order: i }));
        });
    };

    // --- Save ---
    const saveLayout = async (b = blocks, t = theme, silent = false) => {
        if (!silent) setIsSaving(true);
        try {
            await fetch('/api/creator/profile', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ blocksLayout: b, themeV2: t }),
            });
            if (!silent) toast.success('Saved!');
        } catch {
            if (!silent) toast.error('Save failed');
        } finally {
            if (!silent) setIsSaving(false);
        }
    };

    const selectedBlock = blocks.find(b => b.id === selectedId) ?? null;

    const previewWidth = viewMode === 'desktop' ? '100%' : viewMode === 'tablet' ? '768px' : '390px';

    // --- Theme patch ---
    const applyThemePatch = (patch: Partial<StorefrontThemeV2>) => {
        setTheme(prev => {
            const next = { ...prev, ...patch };
            scheduleAutoSave(blocks, next);
            return next;
        });
    };

    const applyPreset = (name: ThemePresetName) => {
        const preset = THEME_PRESETS[name];
        applyThemePatch({ ...preset, preset: name });
    };

    // ─── RENDER ───────────────────────────────────────────────────────────────
    return (
        <div className="flex h-[calc(100vh-56px)] overflow-hidden -m-4 md:-m-8 bg-[#080808]">

            {/* ── LEFT PANEL ───────────────────────────────── */}
            <aside className="w-72 flex-shrink-0 bg-[#0A0A0A] border-r border-white/5 flex flex-col">

                {/* Header */}
                <div className="px-4 py-4 border-b border-white/5 flex items-center justify-between">
                    <div className="flex gap-1 bg-black/40 rounded-xl p-1">
                        {(['blocks', 'add', 'theme'] as const).map(panel => (
                            <button
                                key={panel}
                                onClick={() => setLeftPanel(panel)}
                                className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${leftPanel === panel
                                    ? 'bg-white/10 text-white'
                                    : 'text-zinc-600 hover:text-zinc-400'
                                    }`}
                            >
                                {panel === 'blocks' ? <Layers size={12} /> : panel === 'add' ? <Plus size={12} /> : <Palette size={12} />}
                            </button>
                        ))}
                    </div>
                    <div className="flex gap-1">
                        <button onClick={() => undo()} disabled={!history.length} className="p-1.5 rounded-lg disabled:opacity-20 text-zinc-600 hover:text-zinc-300 hover:bg-white/5" title="Undo (Ctrl+Z)">
                            <Undo2 size={14} />
                        </button>
                        <button onClick={() => redo()} disabled={!future.length} className="p-1.5 rounded-lg disabled:opacity-20 text-zinc-600 hover:text-zinc-300 hover:bg-white/5" title="Redo">
                            <Redo2 size={14} />
                        </button>
                    </div>
                </div>

                {/* Panel content */}
                <div className="flex-1 overflow-y-auto">

                    {/* BLOCKS LIST */}
                    {leftPanel === 'blocks' && (
                        <div className="p-3 space-y-2">
                            {blocks.length === 0 && (
                                <div className="text-center py-12 text-zinc-700">
                                    <Layers size={28} className="mx-auto mb-3 opacity-30" />
                                    <p className="text-sm font-bold">No blocks yet</p>
                                    <p className="text-xs mt-1">Click + to add blocks</p>
                                </div>
                            )}
                            <DndContext
                                sensors={sensors}
                                collisionDetection={closestCenter}
                                onDragStart={handleDragStart}
                                onDragEnd={handleDragEnd}
                            >
                                <SortableContext items={blocks.map(b => b.id)} strategy={verticalListSortingStrategy}>
                                    {blocks.map(block => (
                                        <SortableBlockCard
                                            key={block.id}
                                            block={block}
                                            isSelected={selectedId === block.id}
                                            onClick={() => { setSelectedId(block.id); setLeftPanel('blocks'); }}
                                            onToggle={() => toggleBlock(block.id)}
                                            onDuplicate={() => duplicateBlock(block.id)}
                                            onDelete={() => deleteBlock(block.id)}
                                        />
                                    ))}
                                </SortableContext>
                            </DndContext>
                        </div>
                    )}

                    {/* ADD BLOCK */}
                    {leftPanel === 'add' && (
                        <div className="p-3">
                            {(['content', 'social', 'commerce', 'media', 'layout'] as const).map(cat => {
                                const items = BLOCK_LIBRARY.filter(b => b.category === cat);
                                return (
                                    <div key={cat} className="mb-5">
                                        <p className="text-[9px] font-black uppercase tracking-[0.2em] text-zinc-600 mb-2 px-1">
                                            {cat}
                                        </p>
                                        <div className="space-y-1">
                                            {items.map(meta => (
                                                <button
                                                    key={meta.type}
                                                    onClick={() => addBlock(meta.type)}
                                                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl border border-white/5 bg-white/[0.02] hover:border-indigo-500/40 hover:bg-indigo-500/5 transition-all text-left group"
                                                >
                                                    <span className="text-lg leading-none">{meta.icon}</span>
                                                    <div className="flex-1 min-w-0">
                                                        <p className="text-xs font-bold text-zinc-300 group-hover:text-white">{meta.label}</p>
                                                        <p className="text-[10px] text-zinc-700 truncate">{meta.description}</p>
                                                    </div>
                                                    <Plus size={12} className="text-zinc-700 group-hover:text-indigo-400 flex-shrink-0" />
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}

                    {/* THEME */}
                    {leftPanel === 'theme' && (
                        <div className="p-4 space-y-6">
                            {/* Preset chips */}
                            <div>
                                <p className="text-[9px] font-black uppercase tracking-[0.2em] text-zinc-600 mb-2">Theme Presets</p>
                                <div className="grid grid-cols-2 gap-2">
                                    {(Object.keys(THEME_PRESETS) as ThemePresetName[]).map(name => {
                                        const p = THEME_PRESETS[name];
                                        return (
                                            <button
                                                key={name}
                                                onClick={() => applyPreset(name)}
                                                className={`relative h-14 rounded-xl overflow-hidden border transition-all text-left ${theme.preset === name ? 'border-indigo-500' : 'border-white/10 hover:border-white/20'
                                                    }`}
                                                style={{ background: p.bgValue || p.backgroundColor }}
                                            >
                                                <div className="absolute inset-0 flex items-center justify-center">
                                                    <span className="text-[10px] font-black uppercase tracking-widest text-white/80 drop-shadow" style={{ color: p.textColor }}>
                                                        {name.replace(/_/g, ' ')}
                                                    </span>
                                                </div>
                                                {theme.preset === name && (
                                                    <div className="absolute top-1.5 right-1.5 w-4 h-4 bg-indigo-500 rounded-full flex items-center justify-center">
                                                        <Check size={9} className="text-white" />
                                                    </div>
                                                )}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* Color pickers */}
                            <div>
                                <p className="text-[9px] font-black uppercase tracking-[0.2em] text-zinc-600 mb-2">Colors</p>
                                <div className="space-y-2">
                                    {([
                                        { key: 'primaryColor', label: 'Primary' },
                                        { key: 'backgroundColor', label: 'Background' },
                                        { key: 'cardColor', label: 'Card' },
                                        { key: 'textColor', label: 'Text' },
                                        { key: 'accentColor', label: 'Accent' },
                                    ] as { key: keyof StorefrontThemeV2; label: string }[]).map(({ key, label }) => (
                                        <div key={key} className="flex items-center justify-between px-3 py-2 bg-white/3 rounded-xl border border-white/5">
                                            <span className="text-xs text-zinc-400">{label}</span>
                                            <div className="flex items-center gap-2">
                                                <span className="text-[10px] font-mono text-zinc-600">{theme[key] as string}</span>
                                                <input
                                                    type="color"
                                                    value={(theme[key] as string) || '#000000'}
                                                    onChange={e => applyThemePatch({ [key]: e.target.value })}
                                                    className="w-8 h-8 rounded-lg cursor-pointer border-2 border-white/10 bg-transparent"
                                                />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Font */}
                            <div>
                                <p className="text-[9px] font-black uppercase tracking-[0.2em] text-zinc-600 mb-2">Font Family</p>
                                <div className="grid grid-cols-1 gap-1.5">
                                    {['Inter', 'Outfit', 'Space Grotesk', 'Playfair Display', 'Roboto', 'Poppins', 'DM Sans'].map(f => (
                                        <button
                                            key={f}
                                            onClick={() => applyThemePatch({ fontFamily: f })}
                                            className={`px-3 py-2 rounded-xl border text-left text-sm transition-all ${theme.fontFamily === f
                                                ? 'border-indigo-500 bg-indigo-500/10 text-white font-bold'
                                                : 'border-white/5 bg-white/[0.02] text-zinc-500 hover:border-white/10'
                                                }`}
                                            style={{ fontFamily: f }}
                                        >
                                            {f}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Border radius */}
                            <div>
                                <p className="text-[9px] font-black uppercase tracking-[0.2em] text-zinc-600 mb-2">
                                    Border Radius — {theme.borderRadius}px
                                </p>
                                <input
                                    type="range" min={0} max={24} step={2}
                                    value={theme.borderRadius}
                                    onChange={e => applyThemePatch({ borderRadius: Number(e.target.value) })}
                                    className="w-full accent-indigo-500"
                                />
                            </div>

                            {/* Button style */}
                            <div>
                                <p className="text-[9px] font-black uppercase tracking-[0.2em] text-zinc-600 mb-2">Button Style</p>
                                <div className="grid grid-cols-3 gap-1.5">
                                    {(['rounded', 'square', 'pill', 'outlined', 'ghost'] as const).map(s => (
                                        <button
                                            key={s}
                                            onClick={() => applyThemePatch({ buttonStyle: s })}
                                            className={`py-2 text-[10px] font-bold border transition-all capitalize ${theme.buttonStyle === s
                                                ? 'border-indigo-500 bg-indigo-500/10 text-white'
                                                : 'border-white/5 bg-white/[0.02] text-zinc-600 hover:border-white/10'
                                                }`}
                                            style={{ borderRadius: theme.borderRadius }}
                                        >
                                            {s}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Custom CSS */}
                            <div>
                                <p className="text-[9px] font-black uppercase tracking-[0.2em] text-zinc-600 mb-2">Custom CSS</p>
                                <textarea
                                    rows={5}
                                    value={theme.customCss || ''}
                                    onChange={e => applyThemePatch({ customCss: e.target.value })}
                                    className="w-full bg-black/40 border border-white/8 rounded-xl px-3 py-2.5 text-[11px] font-mono text-zinc-400 resize-none focus:outline-none focus:border-indigo-500/50 placeholder-zinc-700"
                                    placeholder=".my-storefront { ... }"
                                />
                            </div>
                        </div>
                    )}
                </div>

                {/* Bottom action bar */}
                <div className="border-t border-white/5 px-4 py-3 flex items-center gap-2">
                    <button
                        onClick={() => saveLayout()}
                        disabled={isSaving}
                        className="flex-1 flex items-center justify-center gap-2 bg-indigo-500 hover:bg-indigo-600 text-white text-xs font-black py-2.5 rounded-xl transition-all disabled:opacity-50"
                    >
                        {isSaving ? <Loader2 size={13} className="animate-spin" /> : <Save size={13} />}
                        Save
                    </button>
                    <button
                        onClick={() => window.open(`/u/${username}`, '_blank')}
                        className="p-2.5 bg-white/5 hover:bg-white/10 rounded-xl transition-colors"
                        title="Open live storefront"
                    >
                        <ExternalLink size={14} className="text-zinc-400" />
                    </button>
                </div>
            </aside>

            {/* ── MAIN PREVIEW AREA ─────────────────────────────── */}
            <div className="flex-1 flex flex-col overflow-hidden">

                {/* Toolbar */}
                <div className="h-12 bg-[#0A0A0A] border-b border-white/5 flex items-center justify-between px-4 flex-shrink-0">
                    <div className="flex items-center gap-1 bg-black/40 rounded-xl p-1">
                        {([
                            { mode: 'desktop' as ViewMode, Icon: Monitor, label: 'Desktop' },
                            { mode: 'tablet' as ViewMode, Icon: Tablet, label: 'Tablet' },
                            { mode: 'mobile' as ViewMode, Icon: Smartphone, label: 'Mobile' },
                        ]).map(({ mode, Icon, label }) => (
                            <button
                                key={mode}
                                onClick={() => setViewMode(mode)}
                                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${viewMode === mode ? 'bg-white/10 text-white' : 'text-zinc-600 hover:text-zinc-400'
                                    }`}
                            >
                                <Icon size={12} /> <span className="hidden sm:inline">{label}</span>
                            </button>
                        ))}
                    </div>

                    <div className="flex items-center gap-3">
                        <span className="text-[11px] text-zinc-600 font-mono hidden md:block">
                            creatorly.in/<span className="text-zinc-400">{username}</span>
                        </span>
                        <button
                            onClick={() => setLeftPanel('add')}
                            className="flex items-center gap-1.5 px-3 py-1.5 bg-white/5 hover:bg-white/10 border border-white/8 rounded-xl text-xs font-bold text-zinc-300 transition-all"
                        >
                            <Plus size={13} /> Add Block
                        </button>
                    </div>
                </div>

                {/* Canvas */}
                <div className="flex-1 overflow-auto bg-[#050505] flex justify-center py-8 px-4">
                    <div
                        className="transition-all duration-300 relative"
                        style={{ width: previewWidth, maxWidth: '100%' }}
                    >
                        {blocks.length === 0 ? (
                            <div className="flex flex-col items-center justify-center h-64 border-2 border-dashed border-white/10 rounded-2xl text-center gap-4">
                                <p className="text-zinc-600 text-sm font-bold">Your storefront is empty</p>
                                <button
                                    onClick={() => setLeftPanel('add')}
                                    className="px-5 py-2.5 bg-indigo-500 hover:bg-indigo-600 text-white text-sm font-bold rounded-xl transition-colors flex items-center gap-2"
                                >
                                    <Plus size={16} /> Add your first block
                                </button>
                            </div>
                        ) : (
                            <div
                                className="space-y-4 transition-all duration-300 min-h-full"
                                style={{
                                    '--color-primary': theme.primaryColor,
                                    '--color-secondary': theme.secondaryColor,
                                    '--color-accent': theme.accentColor,
                                    '--color-bg': theme.backgroundColor,
                                    '--color-card': theme.cardColor,
                                    '--color-text': theme.textColor,
                                    '--color-muted': theme.mutedColor,
                                    '--font-family': `'${theme.fontFamily}', sans-serif`,
                                    '--border-radius': `${theme.borderRadius}px`,
                                    fontFamily: `'${theme.fontFamily}', sans-serif`,
                                } as any}
                            >
                                {(() => {
                                    // Row grouping logic for grid preview in editor
                                    const rows: StorefrontBlock[][] = [];
                                    let curr: StorefrontBlock[] = [];
                                    blocks.forEach(b => {
                                        if (b.width === 'full') {
                                            if (curr.length) rows.push(curr);
                                            rows.push([b]);
                                            curr = [];
                                        } else {
                                            curr.push(b);
                                            const sum = curr.reduce((s, x) => s + (x.width === 'half' ? 0.5 : 0.33), 0);
                                            if (sum >= 0.95) { rows.push(curr); curr = []; }
                                        }
                                    });
                                    if (curr.length) rows.push(curr);

                                    return rows.map((row, ridx) => (
                                        <div key={ridx} className="flex flex-wrap gap-4">
                                            {row.map(block => (
                                                <div
                                                    key={block.id}
                                                    className={`relative rounded-2xl border-2 transition-all cursor-pointer group flex-auto ${selectedId === block.id
                                                        ? 'border-indigo-500 shadow-[0_0_0_4px_rgba(99,102,241,0.1)]'
                                                        : 'border-transparent hover:border-white/10'
                                                        } ${!block.isVisible ? 'opacity-30' : ''} ${block.width === 'half' ? 'w-[calc(50%-8px)]' :
                                                            block.width === 'third' ? 'w-[calc(33.33%-10px)]' : 'w-full'
                                                        }`}
                                                    onClick={() => { setSelectedId(block.id); setLeftPanel('blocks'); }}
                                                >
                                                    {/* Block type label */}
                                                    <div className={`absolute -top-3 left-3 z-10 bg-indigo-500 text-white text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full transition-opacity ${selectedId === block.id ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}>
                                                        {BLOCK_LIBRARY.find(b => b.type === block.type)?.label ?? block.type}
                                                    </div>

                                                    {/* Block preview */}
                                                    <div className="relative pointer-events-none select-none">
                                                        <BlockRenderer
                                                            block={block}
                                                            theme={theme}
                                                            creatorId="preview"
                                                            creatorUsername={username}
                                                            products={[]}
                                                        />
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    ));
                                })()}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* ── RIGHT SETTINGS PANEL ─────────────────────────── */}
            <AnimatePresence>
                {selectedBlock && (
                    <motion.aside
                        initial={{ width: 0, opacity: 0 }}
                        animate={{ width: 320, opacity: 1 }}
                        exit={{ width: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="flex-shrink-0 bg-[#0A0A0A] border-l border-white/5 flex flex-col overflow-hidden"
                    >
                        {/* Panel header */}
                        <div className="px-4 py-4 border-b border-white/5 flex items-center justify-between flex-shrink-0">
                            <div className="flex items-center gap-2">
                                <Settings2 size={15} className="text-indigo-400" />
                                <span className="text-sm font-black text-white">
                                    {BLOCK_LIBRARY.find(b => b.type === selectedBlock.type)?.label} Settings
                                </span>
                            </div>
                            <button
                                onClick={() => setSelectedId(null)}
                                className="p-1.5 rounded-lg text-zinc-600 hover:text-zinc-300 hover:bg-white/5"
                            >
                                <X size={14} />
                            </button>
                        </div>

                        {/* Width selector */}
                        <div className="px-4 py-3 border-b border-white/5 flex-shrink-0">
                            <p className="text-[9px] font-black uppercase tracking-[0.2em] text-zinc-600 mb-2">Block Width</p>
                            <div className="grid grid-cols-3 gap-1.5">
                                {(['full', 'half', 'third'] as const).map(w => (
                                    <button
                                        key={w}
                                        onClick={() => updateBlockWidth(selectedBlock.id, w)}
                                        className={`py-1.5 text-[10px] font-bold border rounded-lg transition-all capitalize ${selectedBlock.width === w
                                            ? 'border-indigo-500 bg-indigo-500/10 text-white'
                                            : 'border-white/5 text-zinc-600 hover:border-white/15'
                                            }`}
                                    >
                                        {w}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Scrollable settings */}
                        <div className="flex-1 overflow-y-auto">
                            <BlockSettingsPanel
                                block={selectedBlock}
                                onChange={patch => updateBlockSettings(selectedBlock.id, patch)}
                            />
                        </div>
                    </motion.aside>
                )}
            </AnimatePresence>
        </div>
    );
}
