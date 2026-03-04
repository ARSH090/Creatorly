'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
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
import FeaturedProductSettings from '@/components/storefront/editor/FeaturedProductSettings';
import CategoriesSettings from '@/components/storefront/editor/CategoriesSettings';
import SocialFeedSettings from '@/components/storefront/editor/SocialFeedSettings';
import ProgressBarSettings from '@/components/storefront/editor/ProgressBarSettings';
import PricingTableSettings from '@/components/storefront/editor/PricingTableSettings';
import SingleImageSettings from '@/components/storefront/editor/SingleImageSettings';
import GenericSettings from '@/components/storefront/editor/GenericSettings';
import { BlockRenderer } from '@/components/storefront/BlockRenderer';
import { CustomCursor } from '@/components/storefront/theme/CustomCursor';
import { BackgroundAnimation } from '@/components/storefront/theme/BackgroundAnimation';

type ViewMode = 'desktop' | 'tablet' | 'mobile';

function applyTheme(theme: StorefrontThemeV2): React.CSSProperties {
    const style: React.CSSProperties = {
        '--color-primary': theme.primaryColor,
        '--color-secondary': theme.secondaryColor,
        '--color-accent': theme.accentColor,
        '--color-bg': theme.backgroundColor,
        '--color-card': theme.cardColor,
        '--color-text': theme.textColor,
        '--color-muted': theme.mutedColor,
        '--font-family': `'${theme.fontFamily}', system-ui, sans-serif`,
        '--border-radius': `${theme.borderRadius}px`,
        fontFamily: `'${theme.fontFamily}', system-ui, sans-serif`,
        backgroundColor: theme.bgType === 'color' ? theme.backgroundColor : undefined,
        color: theme.textColor,
    } as any;

    if (theme.bgType === 'gradient' && theme.bgValue) {
        style.background = theme.bgValue;
    }

    if (theme.bgType === 'image' && theme.bgValue) {
        style.backgroundImage = `url(${theme.bgValue})`;
        style.backgroundSize = 'cover';
        style.backgroundPosition = 'center';
        style.backgroundAttachment = 'fixed';
    }

    return style;
}

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
            <button
                {...attributes}
                {...listeners}
                className="text-zinc-700 hover:text-zinc-400 cursor-grab active:cursor-grabbing flex-shrink-0"
                onClick={e => e.stopPropagation()}
            >
                <GripVertical size={16} />
            </button>

            <span className="text-xl leading-none flex-shrink-0">{meta?.icon ?? '📦'}</span>
            <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-white truncate">{meta?.label ?? block.type}</p>
                <p className="text-[10px] text-zinc-600 truncate capitalize">{block.width} width</p>
            </div>

            <div className={`flex items-center gap-1 flex-shrink-0 transition-opacity ${isSelected ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}>
                <button
                    onClick={e => { e.stopPropagation(); onToggle(); }}
                    className="p-1.5 rounded-lg hover:bg-white/10 text-zinc-500 hover:text-white"
                >
                    {block.isVisible ? <Eye size={13} /> : <EyeOff size={13} />}
                </button>
                <button
                    onClick={e => { e.stopPropagation(); onDuplicate(); }}
                    className="p-1.5 rounded-lg hover:bg-white/10 text-zinc-500 hover:text-white"
                >
                    <Copy size={13} />
                </button>
                <button
                    onClick={e => { e.stopPropagation(); onDelete(); }}
                    className="p-1.5 rounded-lg hover:bg-rose-500/10 text-zinc-600 hover:text-rose-400"
                >
                    <Trash2 size={13} />
                </button>
            </div>

            {isSelected && <ChevronRight size={14} className="text-indigo-400 flex-shrink-0" />}
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
        case 'featured_product': return <FeaturedProductSettings settings={block.settings as any} onChange={onChange} />;
        case 'categories': return <CategoriesSettings settings={block.settings as any} onChange={onChange} />;
        case 'social_feed': return <SocialFeedSettings settings={block.settings as any} onChange={onChange} />;
        case 'progress_bar': return <ProgressBarSettings settings={block.settings as any} onChange={onChange} />;
        case 'pricing_table': return <PricingTableSettings settings={block.settings as any} onChange={onChange} />;
        case 'image': return <SingleImageSettings settings={block.settings as any} onChange={onChange} />;
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
    const [isPublished, setIsPublished] = useState(false);
    const [lastSaved, setLastSaved] = useState<Date | null>(null);

    const [history, setHistory] = useState<StorefrontBlock[][]>([]);
    const [future, setFuture] = useState<StorefrontBlock[][]>([]);
    const MAX_HISTORY = 20;

    useEffect(() => {
        fetch('/api/creator/profile')
            .then(r => r.json())
            .then(d => {
                if (d.profile?.username) setUsername(d.profile.username);
                else if (d.profile?.storeSlug) setUsername(d.profile.storeSlug);
                if (d.blocksLayout?.length) setBlocks(d.blocksLayout);
                if (d.themeV2) setTheme(prev => ({ ...prev, ...d.themeV2 }));
                if (d.storefrontData?.isPublished) setIsPublished(true);
                setLastSaved(new Date());
            })
            .catch(() => { });
    }, []);

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

    const scheduleAutoSave = useCallback((newBlocks: StorefrontBlock[], newTheme: StorefrontThemeV2) => {
        if (autoSaveTimer) clearTimeout(autoSaveTimer);
        const t = setTimeout(() => {
            saveLayout(newBlocks, newTheme, true);
        }, 1500);
        setAutoSaveTimer(t);
    }, [autoSaveTimer]);

    const updateBlocks = useCallback((updater: (prev: StorefrontBlock[]) => StorefrontBlock[]) => {
        setBlocks(prev => {
            pushHistory(prev);
            const next = updater(prev);
            scheduleAutoSave(next, theme);
            return next;
        });
    }, [pushHistory, scheduleAutoSave, theme]);

    const saveLayout = async (b = blocks, t = theme, silent = false, isLive = isPublished) => {
        if (!silent) setIsSaving(true);
        try {
            await fetch('/api/creator/profile', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ blocksLayout: b, themeV2: t, isPublished: isLive }),
            });
            setLastSaved(new Date());
            if (!silent) toast.success('Saved!');
        } catch {
            if (!silent) toast.error('Save failed');
        } finally {
            if (!silent) setIsSaving(false);
        }
    };

    // Block Handlers
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
            const clone = { ...JSON.parse(JSON.stringify(src)), id: `block_${Date.now()}`, order: src.order + 1 };
            const idx = prev.findIndex(b => b.id === id);
            const next = [...prev];
            next.splice(idx + 1, 0, clone);
            return next.map((b, i) => ({ ...b, order: i }));
        });
    };

    const toggleBlock = (id: string) => {
        updateBlocks(prev => prev.map(b => b.id === id ? { ...b, isVisible: !b.isVisible } : b));
    };

    const updateBlockSettings = (id: string, patch: any) => {
        setBlocks(prev => {
            const next = prev.map(b => b.id === id ? { ...b, settings: { ...(b.settings as any), ...patch } } : b);
            scheduleAutoSave(next, theme);
            return next;
        });
    };

    const updateBlockWidth = (id: string, width: any) => {
        updateBlocks(prev => prev.map(b => b.id === id ? { ...b, width } : b));
    };

    // DnD
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

    const selectedBlock = blocks.find(b => b.id === selectedId) ?? null;
    const previewWidth = viewMode === 'desktop' ? '100%' : viewMode === 'tablet' ? '768px' : '390px';

    const applyThemePatch = (patch: Partial<StorefrontThemeV2>) => {
        setTheme(prev => {
            const next = { ...prev, ...patch };
            scheduleAutoSave(blocks, next);
            return next;
        });
    };

    return (
        <div className="flex h-[calc(100vh-56px)] overflow-hidden -m-4 md:-m-8 bg-[#080808]">
            {/* LEFT PANEL */}
            <aside className="w-72 flex-shrink-0 bg-[#0A0A0A] border-r border-white/5 flex flex-col">
                <div className="px-4 py-4 border-b border-white/5 flex items-center justify-between">
                    <div className="flex gap-1 bg-black/40 rounded-xl p-1">
                        {(['blocks', 'add', 'theme'] as const).map(panel => (
                            <button
                                key={panel}
                                onClick={() => setLeftPanel(panel)}
                                className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${leftPanel === panel ? 'bg-white/10 text-white' : 'text-zinc-600'}`}
                            >
                                {panel === 'blocks' ? <Layers size={12} /> : panel === 'add' ? <Plus size={12} /> : <Palette size={12} />}
                            </button>
                        ))}
                    </div>
                </div>
                <div className="flex-1 overflow-y-auto p-3">
                    {leftPanel === 'blocks' && (
                        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
                            <SortableContext items={blocks.map(b => b.id)} strategy={verticalListSortingStrategy}>
                                {blocks.map(block => (
                                    <SortableBlockCard
                                        key={block.id}
                                        block={block}
                                        isSelected={selectedId === block.id}
                                        onClick={() => setSelectedId(block.id)}
                                        onToggle={() => toggleBlock(block.id)}
                                        onDuplicate={() => duplicateBlock(block.id)}
                                        onDelete={() => deleteBlock(block.id)}
                                    />
                                ))}
                            </SortableContext>
                        </DndContext>
                    )}
                    {leftPanel === 'add' && (
                        <div className="space-y-6">
                            {(['content', 'social', 'commerce', 'media', 'layout'] as const).map(cat => (
                                <div key={cat}>
                                    <p className="text-[9px] font-black uppercase tracking-widest text-zinc-600 mb-2">{cat}</p>
                                    <div className="space-y-1">
                                        {BLOCK_LIBRARY.filter(b => b.category === cat).map(meta => (
                                            <button
                                                key={meta.type}
                                                onClick={() => addBlock(meta.type)}
                                                className="w-full flex items-center gap-3 px-3 py-2 rounded-xl border border-white/5 bg-white/[0.02] hover:bg-white/[0.05] text-left group"
                                            >
                                                <span className="text-lg">{meta.icon}</span>
                                                <div className="flex-1">
                                                    <p className="text-xs font-bold text-zinc-300">{meta.label}</p>
                                                    <p className="text-[9px] text-zinc-700 truncate">{meta.description}</p>
                                                </div>
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
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
                                                onClick={() => applyThemePatch({ ...p, preset: name })}
                                                className={`relative h-14 rounded-xl overflow-hidden border transition-all text-left ${theme.preset === name ? 'border-indigo-500' : 'border-white/10 hover:border-white/20'
                                                    }`}
                                                style={{ background: p.bgValue || p.backgroundColor }}
                                            >
                                                <div className="absolute inset-0 flex items-center justify-center">
                                                    <span className="text-[10px] font-black uppercase tracking-widest drop-shadow" style={{ color: p.textColor }}>
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
                                    {['Inter', 'Outfit', 'Space Grotesk', 'Playfair Display', 'Roboto', 'Poppins'].map(f => (
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
                                    type="range" min={0} max={32} step={2}
                                    value={theme.borderRadius}
                                    onChange={e => applyThemePatch({ borderRadius: Number(e.target.value) })}
                                    className="w-full accent-indigo-500"
                                />
                            </div>

                            {/* Button style */}
                            <div>
                                <p className="text-[9px] font-black uppercase tracking-[0.2em] text-zinc-600 mb-2">Button Style</p>
                                <div className="grid grid-cols-3 gap-1.5">
                                    {(['rounded', 'pill', 'square'] as const).map(s => (
                                        <button
                                            key={s}
                                            onClick={() => applyThemePatch({ buttonStyle: s })}
                                            className={`py-2 text-[10px] font-bold border transition-all capitalize ${theme.buttonStyle === s
                                                ? 'border-indigo-500 bg-indigo-500/10 text-white'
                                                : 'border-white/5 bg-white/[0.02] text-zinc-600 hover:border-white/10'
                                                }`}
                                            style={{ borderRadius: theme.borderRadius / 2 }}
                                        >
                                            {s}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Special Effects */}
                            <div className="pt-6 border-t border-white/5 space-y-6">
                                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-indigo-400">Special Effects</p>

                                {/* Cursor Settings */}
                                <div className="space-y-3">
                                    <div className="flex items-center justify-between">
                                        <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Custom Cursor</span>
                                        <select
                                            value={theme.cursor?.type || 'default'}
                                            onChange={e => applyThemePatch({ cursor: { ...(theme.cursor || { color: theme.primaryColor, size: 20, trailEffect: false, trailLength: 5, magneticButtons: false }), type: e.target.value as any } })}
                                            className="bg-zinc-950 border border-white/10 rounded-lg px-2 py-1 text-[10px] text-white focus:ring-0 outline-none"
                                        >
                                            <option value="default">Default</option>
                                            <option value="dot">Dot</option>
                                            <option value="ring">Ring</option>
                                            <option value="blob">Glow Blob</option>
                                            <option value="crosshair">Crosshair</option>
                                            <option value="emoji">Emoji</option>
                                            <option value="none">Hidden</option>
                                        </select>
                                    </div>

                                    {theme.cursor?.type && theme.cursor.type !== 'default' && theme.cursor.type !== 'none' && (
                                        <div className="space-y-3 pl-2 border-l border-white/5 ml-1">
                                            <div className="flex items-center justify-between">
                                                <span className="text-[9px] text-zinc-500">Color</span>
                                                <input
                                                    type="color"
                                                    value={theme.cursor?.color || theme.primaryColor}
                                                    onChange={e => applyThemePatch({ cursor: { ...theme.cursor!, color: e.target.value } })}
                                                    className="w-6 h-6 rounded cursor-pointer border-none bg-transparent"
                                                />
                                            </div>
                                            {theme.cursor?.type === 'emoji' && (
                                                <div className="flex items-center justify-between">
                                                    <span className="text-[9px] text-zinc-500">Emoji</span>
                                                    <input
                                                        type="text"
                                                        value={theme.cursor?.emoji || '✨'}
                                                        onChange={e => applyThemePatch({ cursor: { ...theme.cursor!, emoji: e.target.value } })}
                                                        className="w-12 bg-zinc-950 border border-white/10 rounded px-1 py-0.5 text-[10px] text-center"
                                                        maxLength={2}
                                                    />
                                                </div>
                                            )}
                                            <div className="flex items-center gap-3">
                                                <span className="text-[9px] text-zinc-500 flex-1">Trail</span>
                                                <input
                                                    type="checkbox"
                                                    checked={theme.cursor?.trailEffect || false}
                                                    onChange={e => applyThemePatch({ cursor: { ...theme.cursor!, trailEffect: e.target.checked } })}
                                                    className="w-3 h-3 rounded"
                                                />
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* Background Animation Settings */}
                                <div className="space-y-3">
                                    <div className="flex items-center justify-between">
                                        <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">BG Animation</span>
                                        <select
                                            value={theme.backgroundAnimation?.type || 'none'}
                                            onChange={e => applyThemePatch({ backgroundAnimation: { ...(theme.backgroundAnimation || { color: theme.primaryColor, speed: 'normal', density: 'medium', opacity: 20, interactive: true }), type: e.target.value as any } })}
                                            className="bg-zinc-950 border border-white/10 rounded-lg px-2 py-1 text-[10px] text-white focus:ring-0 outline-none"
                                        >
                                            <option value="none">None</option>
                                            <option value="particles">Connected Particles</option>
                                            <option value="floating_shapes">Floating Shapes</option>
                                            <option value="fireflies">Magic Fireflies</option>
                                            <option value="stars">Night Sky Stars</option>
                                            <option value="falling_emojis">Falling Emojis</option>
                                        </select>
                                    </div>

                                    {theme.backgroundAnimation?.type && theme.backgroundAnimation.type !== 'none' && (
                                        <div className="space-y-3 pl-2 border-l border-white/5 ml-1">
                                            <div className="flex items-center justify-between">
                                                <span className="text-[9px] text-zinc-500">Opacity — {theme.backgroundAnimation?.opacity}%</span>
                                                <input
                                                    type="range" min={5} max={100} step={5}
                                                    value={theme.backgroundAnimation?.opacity || 20}
                                                    onChange={e => applyThemePatch({ backgroundAnimation: { ...theme.backgroundAnimation!, opacity: Number(e.target.value) } })}
                                                    className="w-24 accent-indigo-500"
                                                />
                                            </div>
                                            <div className="flex items-center justify-between">
                                                <span className="text-[9px] text-zinc-500">Speed</span>
                                                <div className="flex gap-1">
                                                    {(['slow', 'normal', 'fast'] as const).map(s => (
                                                        <button
                                                            key={s}
                                                            onClick={() => applyThemePatch({ backgroundAnimation: { ...theme.backgroundAnimation!, speed: s } })}
                                                            className={`px-2 py-1 rounded text-[8px] uppercase font-bold transition-all ${theme.backgroundAnimation?.speed === s ? 'bg-indigo-500 text-white' : 'bg-white/5 text-zinc-500'}`}
                                                        >
                                                            {s}
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>
                                            {theme.backgroundAnimation?.type === 'falling_emojis' && (
                                                <div className="flex items-center justify-between">
                                                    <span className="text-[9px] text-zinc-500">Emoji</span>
                                                    <input
                                                        type="text"
                                                        value={theme.backgroundAnimation?.emoji || '✨'}
                                                        onChange={e => applyThemePatch({ backgroundAnimation: { ...theme.backgroundAnimation!, emoji: e.target.value } })}
                                                        className="w-12 bg-zinc-950 border border-white/10 rounded px-1 py-0.5 text-[10px] text-center"
                                                        maxLength={2}
                                                    />
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>




                    )}
                </div>
            </aside>

            {/* PREVIEW AREA */}
            <div className="flex-1 flex flex-col overflow-hidden">
                <div className="h-12 bg-[#0A0A0A] border-b border-white/5 flex items-center justify-between px-4">
                    <div className="flex items-center gap-2 sm:gap-4">
                        <Link
                            href="/dashboard/storefront"
                            className="flex items-center gap-1 text-zinc-400 hover:text-white transition-all text-[10px] font-black uppercase tracking-widest bg-white/5 px-2 py-1.5 rounded-lg hover:bg-white/10 border border-white/5"
                            title="Back to Legacy Editor"
                        >
                            <ChevronLeft size={14} />
                            <span className="hidden sm:inline">Legacy Editor</span>
                        </Link>
                        <div className="flex items-center gap-1 bg-black/40 rounded-xl p-1 hidden sm:flex">
                            {([
                                { m: 'desktop' as ViewMode, i: Monitor },
                                { m: 'tablet' as ViewMode, i: Tablet },
                                { m: 'mobile' as ViewMode, i: Smartphone },
                            ]).map(v => (
                                <button key={v.m} onClick={() => setViewMode(v.m)} className={`p-1.5 rounded-lg ${viewMode === v.m ? 'bg-white/10 text-white' : 'text-zinc-600'}`}>
                                    <v.i size={14} />
                                </button>
                            ))}
                        </div>
                    </div>
                    <div className="flex items-center gap-4">
                        <div className="flex gap-1 hidden sm:flex">
                            <button onClick={undo} disabled={!history.length} className={`p-1.5 rounded-lg transition-all ${history.length ? 'text-zinc-400 hover:text-white hover:bg-white/10' : 'text-zinc-700 cursor-not-allowed'}`}>
                                <Undo2 size={16} />
                            </button>
                            <button onClick={redo} disabled={!future.length} className={`p-1.5 rounded-lg transition-all ${future.length ? 'text-zinc-400 hover:text-white hover:bg-white/10' : 'text-zinc-700 cursor-not-allowed'}`}>
                                <Redo2 size={16} />
                            </button>
                        </div>

                        {lastSaved && (
                            <span className="text-[10px] text-zinc-500 hidden md:block tracking-widest uppercase">
                                Saved {lastSaved.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                        )}

                        <button
                            onClick={() => saveLayout()}
                            disabled={isSaving}
                            className="flex items-center gap-2 px-4 py-1.5 bg-white/5 hover:bg-white/10 text-white rounded-xl text-[10px] font-black uppercase tracking-widest transition-all"
                        >
                            {isSaving ? <Loader2 size={12} className="animate-spin" /> : <Save size={12} />}
                            Save
                        </button>

                        <div className="h-4 w-px bg-white/10 hidden sm:block" />

                        <div className="items-center gap-2 px-3 py-1.5 bg-black/40 rounded-xl border border-white/5 hidden xl:flex">
                            <div className={`w-2 h-2 rounded-full ${isPublished ? 'bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]' : 'bg-zinc-700'}`} />
                            <span className="text-[10px] font-black uppercase tracking-widest text-zinc-400">{isPublished ? 'Live' : 'Draft'}</span>
                        </div>
                        <button
                            onClick={async () => {
                                const nextState = !isPublished;
                                setIsPublished(nextState);
                                await saveLayout(blocks, theme, false, nextState);
                            }}
                            className={`px-4 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${isPublished ? 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700 border border-white/5' : 'bg-indigo-500 text-white hover:bg-indigo-600 border border-indigo-400/20 shadow-[0_0_15px_rgba(99,102,241,0.3)]'}`}
                        >
                            {isPublished ? 'Unpublish' : 'Publish'}
                        </button>

                        {username && isPublished && (
                            <Link href={`/u/${username}`} target="_blank" className="p-1.5 flex items-center justify-center text-zinc-400 hover:text-white bg-white/5 hover:bg-white/10 rounded-lg transition-all border border-white/5 group">
                                <ExternalLink size={14} className="group-hover:scale-110 transition-transform" />
                            </Link>
                        )}
                    </div>
                </div>

                <div className="flex-1 overflow-auto bg-[#050505] flex justify-center py-8 p-4">
                    <div className="transition-all duration-300 relative shadow-2xl rounded-[32px] sm:rounded-[40px] border-[8px] border-zinc-900 overflow-hidden" style={{ width: previewWidth, maxWidth: '100%', minHeight: '800px', ...applyTheme(theme) }}>
                        {theme.backgroundAnimation && theme.backgroundAnimation.type !== 'none' && (
                            <BackgroundAnimation animation={theme.backgroundAnimation as any} />
                        )}
                        {theme.cursor && theme.cursor.type !== 'default' && (
                            <CustomCursor cursor={theme.cursor as any} />
                        )}
                        <div className="space-y-4 relative z-10 w-full max-w-2xl mx-auto px-4 sm:px-6 py-12 sm:py-20">
                            {blocks.map(block => (
                                <div key={block.id} className={`relative rounded-2xl border-2 transition-all ${selectedId === block.id ? 'border-indigo-500' : 'border-transparent'}`} onClick={() => setSelectedId(block.id)}>
                                    <BlockRenderer block={block} theme={theme} products={[]} creatorUsername={username} />
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* SETTINGS PANEL */}
            <AnimatePresence>
                {selectedBlock && (
                    <motion.aside initial={{ width: 0 }} animate={{ width: 320 }} exit={{ width: 0 }} className="bg-[#0A0A0A] border-l border-white/5 flex flex-col overflow-hidden">
                        <div className="p-4 border-b border-white/5 flex items-center justify-between">
                            <span className="text-xs font-black text-white uppercase tracking-widest">Settings</span>
                            <button onClick={() => setSelectedId(null)}><X size={14} className="text-zinc-500" /></button>
                        </div>
                        <div className="flex-1 overflow-y-auto">
                            <BlockSettingsPanel block={selectedBlock} onChange={patch => updateBlockSettings(selectedBlock.id, patch)} />
                        </div>
                    </motion.aside>
                )}
            </AnimatePresence>
        </div>
    );
}
