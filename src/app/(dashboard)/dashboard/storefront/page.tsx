'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
    Layout, Palette, Type, Image as ImageIcon,
    Layers, Save, Eye, RefreshCcw, Check,
    ArrowUp, ArrowDown, Trash2, Plus, Zap, Upload, Loader2,
    MessageCircle, Camera, Play, Mail, Calendar, Send,
    Twitter, Linkedin, Music2, ExternalLink, Globe,
    Star, Tag, Clock, ToggleLeft, ToggleRight, GripVertical,
    Monitor
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/hooks/useAuth';
import StoreThemeSelector from '@/components/storefront/StoreThemeSelector';
import { toast } from 'react-hot-toast';

// ─── Constants ────────────────────────────────────────────────────────────────

const LINK_TYPES = [
    { value: 'link', label: '🔗 Link' },
    { value: 'video', label: '🎬 Video' },
    { value: 'music', label: '🎵 Music' },
    { value: 'shop', label: '🛍️ Shop' },
    { value: 'social', label: '📱 Social' },
    { value: 'download', label: '⬇️ Download' },
    { value: 'newsletter', label: '📧 Newsletter' },
    { value: 'event', label: '🎟️ Event' },
    { value: 'blog', label: '✍️ Blog' },
    { value: 'podcast', label: '🎙️ Podcast' },
];

const ICON_OPTIONS = [
    { name: 'ExternalLink', Icon: ExternalLink },
    { name: 'Globe', Icon: Globe },
    { name: 'MessageCircle', Icon: MessageCircle },
    { name: 'Mail', Icon: Mail },
    { name: 'Camera', Icon: Camera },
    { name: 'Play', Icon: Play },
    { name: 'Calendar', Icon: Calendar },
    { name: 'Send', Icon: Send },
    { name: 'Twitter', Icon: Twitter },
    { name: 'Linkedin', Icon: Linkedin },
    { name: 'Music2', Icon: Music2 },
    { name: 'Star', Icon: Star },
    { name: 'Tag', Icon: Tag },
    { name: 'Zap', Icon: Zap },
    { name: 'Clock', Icon: Clock },
];

const ICON_MAP: Record<string, React.ElementType> = {
    ExternalLink, Globe, MessageCircle, Mail, Camera, Play,
    Calendar, Send, Twitter, Linkedin, Music2, Star, Tag, Zap, Clock,
};

const FONTS = ['Inter', 'Outfit', 'Space Grotesk', 'Playfair Display', 'Roboto'];

const BUTTON_STYLES = [
    { value: 'rounded', label: 'Rounded' },
    { value: 'pill', label: 'Pill' },
    { value: 'square', label: 'Square' },
];

const SECTIONS = [
    { id: 'hero', name: 'Hero / Bio' },
    { id: 'services', name: 'Service Buttons' },
    { id: 'links', name: 'Custom Links' },
    { id: 'products', name: 'Product Grid' },
    { id: 'newsletter', name: 'Newsletter' },
    { id: 'testimonials', name: 'Testimonials' },
    { id: 'faq', name: 'FAQ' },
];

const newTestimonial = () => ({
    id: Math.random().toString(36).substr(2, 9),
    name: 'Customer Name',
    role: 'Product Designer',
    content: 'This product changed my life! Highly recommended.',
    avatar: '',
});

const newFAQ = () => ({
    id: Math.random().toString(36).substr(2, 9),
    question: 'How does it work?',
    answer: 'It works by integrating directly with your workflow...',
});

const BADGE_COLORS = [
    '#6366f1', '#a855f7', '#ec4899', '#f59e0b',
    '#10b981', '#0ea5e9', '#ef4444', '#ffffff',
];

const newLink = (order: number) => ({
    id: Math.random().toString(36).substr(2, 9),
    title: 'New Link',
    url: 'https://',
    isActive: true,
    order,
    linkType: 'link',
    description: '',
    thumbnail: '',
    iconName: 'ExternalLink',
    badgeColor: '',
    badgeText: '',
    highlightBorder: false,
});

// ─── Component ────────────────────────────────────────────────────────────────

export default function StorefrontBuilder() {
    const { user, email, displayName, photoURL } = useAuth();
    const [isSaving, setIsSaving] = useState(false);
    const [activeTab, setActiveTab] = useState<'design' | 'links' | 'layout' | 'testimonials' | 'faq'>('design');
    const [expandedLinkIdx, setExpandedLinkIdx] = useState<number | null>(null);
    const [expandedTestimonialIdx, setExpandedTestimonialIdx] = useState<number | null>(null);
    const [expandedFAQIdx, setExpandedFAQIdx] = useState<number | null>(null);
    const [showMobilePreview, setShowMobilePreview] = useState(false);
    const [uploadingThumbnailIdx, setUploadingThumbnailIdx] = useState<number | null>(null);
    const thumbnailInputRefs = useRef<(HTMLInputElement | null)[]>([]);

    const [theme, setTheme] = useState({
        primaryColor: '#6366f1',
        secondaryColor: '#a855f7',
        accentColor: '#ec4899',
        backgroundColor: '#030303',
        textColor: '#ffffff',
        fontFamily: 'Outfit',
        buttonStyle: 'rounded',
        backgroundImage: '',
    });

    const [layout, setLayout] = useState([
        { id: 'hero', enabled: true },
        { id: 'services', enabled: true },
        { id: 'links', enabled: true },
        { id: 'products', enabled: true },
        { id: 'newsletter', enabled: false },
    ]);

    const [links, setLinks] = useState<any[]>([]);
    const [testimonials, setTestimonials] = useState<any[]>([]);
    const [faqs, setFaqs] = useState<any[]>([]);
    const [storeSlug, setStoreSlug] = useState<string>('');

    // ── Fetch saved data ──
    useEffect(() => {
        async function fetchProfile() {
            try {
                const res = await fetch('/api/creator/profile');
                if (!res.ok) return;
                const data = await res.json();

                // data structure: { profile, theme, layout, links, storefrontData }
                if (data.profile?.storeSlug) setStoreSlug(data.profile.storeSlug);
                else if (data.profile?.username) setStoreSlug(data.profile.username);

                if (data.theme) setTheme(prev => ({ ...prev, ...data.theme }));
                if (data.layout) setLayout(data.layout);
                if (data.links) setLinks(data.links.map((l: any) => ({
                    ...newLink(l.order ?? 0),
                    ...l,
                })));
                if (data.storefrontData?.testimonials) setTestimonials(data.storefrontData.testimonials);
                if (data.storefrontData?.faqs) setFaqs(data.storefrontData.faqs);
            } catch (err) {
                console.error('fetchProfile', err);
            }
        }
        fetchProfile();
    }, []);

    // ── Link helpers ──
    const updateLink = useCallback((idx: number, patch: Partial<any>) => {
        setLinks(prev => prev.map((l, i) => i === idx ? { ...l, ...patch } : l));
    }, []);

    const toggleLink = useCallback((idx: number) => {
        setLinks(prev => prev.map((l, i) => i === idx ? { ...l, isActive: !l.isActive } : l));
    }, []);

    const deleteLink = useCallback((idx: number) => {
        setLinks(prev => prev.filter((_, i) => i !== idx));
        setExpandedLinkIdx(prev => prev === idx ? null : prev);
    }, []);

    const moveLink = useCallback((idx: number, dir: 'up' | 'down') => {
        setLinks(prev => {
            const arr = [...prev];
            const target = dir === 'up' ? idx - 1 : idx + 1;
            if (target < 0 || target >= arr.length) return arr;
            [arr[idx], arr[target]] = [arr[target], arr[idx]];
            return arr.map((l, i) => ({ ...l, order: i }));
        });
    }, []);

    // ── Layout helpers ──
    const moveSection = (idx: number, dir: 'up' | 'down') => {
        setLayout(prev => {
            const arr = [...prev];
            const t = dir === 'up' ? idx - 1 : idx + 1;
            if (t < 0 || t >= arr.length) return arr;
            [arr[idx], arr[t]] = [arr[t], arr[idx]];
            return arr;
        });
    };

    const toggleSection = (id: string) =>
        setLayout(prev => prev.map(s => s.id === id ? { ...s, enabled: !s.enabled } : s));

    // ── Thumbnail upload ──
    const handleThumbnailUpload = async (e: React.ChangeEvent<HTMLInputElement>, idx: number) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setUploadingThumbnailIdx(idx);
        try {
            const presignRes = await fetch('/api/creator/upload', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ filename: file.name, contentType: file.type, fileSize: file.size }),
            });
            if (!presignRes.ok) throw new Error('Failed to get upload URL');
            const { uploadUrl, publicUrl } = await presignRes.json();
            await fetch(uploadUrl, { method: 'PUT', body: file, headers: { 'Content-Type': file.type } });
            updateLink(idx, { thumbnail: publicUrl });
            toast.success('Image uploaded!');
        } catch (err: any) {
            toast.error(err.message || 'Upload failed');
        } finally {
            setUploadingThumbnailIdx(null);
            const ref = thumbnailInputRefs.current[idx];
            if (ref) ref.value = '';
        }
    };

    // ── Save ──
    const handleSave = async () => {
        try {
            setIsSaving(true);
            const res = await fetch('/api/creator/profile', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ theme, layout, links, testimonials, faqs }),
            });
            if (!res.ok) throw new Error('Save failed');
            toast.success('Storefront saved!');
        } catch (err: any) {
            toast.error(err.message || 'Save failed');
        } finally {
            setIsSaving(false);
        }
    };

    const effectiveUsername = storeSlug || (user as any)?.username || email?.split('@')[0] || 'creator';

    // ─── Render ──────────────────────────────────────────────────────────────
    return (
        <div className="flex flex-col md:flex-row h-screen md:h-[calc(100vh-80px)] overflow-hidden -m-4 md:-m-8">

            {/* ── Editor Sidebar ────────────────────────────── */}
            <aside className={`w-full md:w-[400px] md:min-w-[320px] bg-[#0A0A0A] border-r border-white/5 flex flex-col flex-shrink-0 ${showMobilePreview ? 'hidden md:flex' : 'flex'}`}>

                {/* Header */}
                <div className="px-6 py-5 border-b border-white/5 flex items-center justify-between flex-shrink-0">
                    <h2 className="text-lg font-black uppercase tracking-tight flex items-center gap-2">
                        <Monitor className="w-4 h-4 text-indigo-400" /> Storefront Editor
                    </h2>
                    <div className="flex gap-2">
                        <button
                            onClick={() => setShowMobilePreview(!showMobilePreview)}
                            className="md:hidden p-2 bg-white/5 rounded-xl hover:bg-white/10 transition-colors"
                            title="Toggle preview"
                        >
                            <Monitor className="w-4 h-4 text-indigo-400" />
                        </button>
                        <button
                            onClick={() => window.open(`/u/${effectiveUsername}`, '_blank')}
                            className="p-2 bg-white/5 rounded-xl hover:bg-white/10 transition-colors"
                            title="Open live storefront"
                        >
                            <Eye className="w-4 h-4 text-zinc-400" />
                        </button>
                        <button
                            onClick={handleSave}
                            disabled={isSaving}
                            className="bg-indigo-500 px-4 py-2 rounded-xl hover:bg-indigo-600 transition-colors flex items-center gap-2 text-xs font-bold disabled:opacity-50"
                        >
                            {isSaving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                            Save
                        </button>
                    </div>
                </div>

                {/* Tabs */}
                <div className="flex border-b border-white/5 flex-shrink-0 bg-black/20 overflow-x-auto scrollbar-hide">
                    {(['design', 'links', 'layout', 'testimonials', 'faq'] as const).map(tab => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            className={`flex-1 py-4 text-[10px] font-black uppercase tracking-widest relative transition-colors ${activeTab === tab
                                ? 'text-white'
                                : 'text-zinc-600 hover:text-zinc-400'
                                }`}
                        >
                            <span className="relative z-10 whitespace-nowrap">{tab === 'faq' ? 'FAQ' : tab}</span>
                            {activeTab === tab && (
                                <motion.div
                                    layoutId="activeTabIndicator"
                                    className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-500 shadow-[0_0_8px_rgba(99,102,241,0.5)]"
                                />
                            )}
                        </button>
                    ))}
                </div>

                {/* Tab content — scrollable */}
                <div className="flex-1 overflow-y-auto">

                    {/* ══ DESIGN TAB ══════════════════════════════════════ */}
                    {activeTab === 'design' && (
                        <div className="p-6 space-y-8">
                            {/* Quick themes */}
                            <StoreThemeSelector
                                currentTheme={theme}
                                onApply={(preset: any) => setTheme(prev => ({ ...prev, ...preset }))}
                            />

                            {/* Colors */}
                            <section className="space-y-4">
                                <h3 className="text-[10px] font-black uppercase tracking-widest text-zinc-500 flex items-center gap-2">
                                    <Palette className="w-3 h-3" /> Brand Colors
                                </h3>
                                <div className="grid grid-cols-1 gap-3">
                                    {[
                                        { label: 'Primary Accent', key: 'primaryColor' },
                                        { label: 'Secondary', key: 'secondaryColor' },
                                        { label: 'Background', key: 'backgroundColor' },
                                        { label: 'Text Color', key: 'textColor' },
                                    ].map(({ label, key }) => (
                                        <div key={key} className="flex items-center justify-between p-3 bg-white/[0.03] rounded-xl border border-white/5">
                                            <span className="text-sm text-zinc-400">{label}</span>
                                            <div className="flex items-center gap-3">
                                                <span className="text-[10px] font-mono text-zinc-600">
                                                    {(theme as any)[key]}
                                                </span>
                                                <input
                                                    type="color"
                                                    value={(theme as any)[key]}
                                                    onChange={e => setTheme(prev => ({ ...prev, [key]: e.target.value }))}
                                                    className="w-9 h-9 rounded-lg cursor-pointer border-2 border-white/10 bg-transparent"
                                                />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </section>

                            {/* Background image */}
                            <section className="space-y-3">
                                <h3 className="text-[10px] font-black uppercase tracking-widest text-zinc-500 flex items-center gap-2">
                                    <ImageIcon className="w-3 h-3" /> Background Image
                                </h3>
                                <input
                                    type="url"
                                    value={theme.backgroundImage}
                                    onChange={e => setTheme(prev => ({ ...prev, backgroundImage: e.target.value }))}
                                    className="w-full bg-zinc-900 border border-white/10 rounded-xl px-3 py-2.5 text-xs text-white placeholder-zinc-600 focus:outline-none focus:border-indigo-500/50"
                                    placeholder="https://example.com/bg.jpg"
                                />
                                {theme.backgroundImage && (
                                    <button
                                        onClick={() => setTheme(prev => ({ ...prev, backgroundImage: '' }))}
                                        className="text-[10px] text-zinc-600 hover:text-rose-400 transition-colors"
                                    >
                                        ✕ Clear image
                                    </button>
                                )}
                            </section>

                            {/* Typography */}
                            <section className="space-y-4">
                                <h3 className="text-[10px] font-black uppercase tracking-widest text-zinc-500 flex items-center gap-2">
                                    <Type className="w-3 h-3" /> Font
                                </h3>
                                <div className="grid grid-cols-1 gap-2">
                                    {FONTS.map(f => (
                                        <button
                                            key={f}
                                            onClick={() => setTheme(prev => ({ ...prev, fontFamily: f }))}
                                            className={`p-3.5 rounded-xl border text-left text-sm transition-all ${theme.fontFamily === f
                                                ? 'border-indigo-500 bg-indigo-500/10 text-white font-bold'
                                                : 'border-white/5 bg-white/[0.03] text-zinc-400 hover:border-white/10'
                                                }`}
                                        >
                                            {f}
                                        </button>
                                    ))}
                                </div>
                            </section>

                            {/* Button style */}
                            <section className="space-y-4">
                                <h3 className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Button Shape</h3>
                                <div className="grid grid-cols-3 gap-2">
                                    {BUTTON_STYLES.map(({ value, label }) => (
                                        <button
                                            key={value}
                                            onClick={() => setTheme(prev => ({ ...prev, buttonStyle: value }))}
                                            className={`p-3 rounded-xl border text-xs font-bold transition-all ${theme.buttonStyle === value
                                                ? 'border-indigo-500 bg-indigo-500/10 text-white'
                                                : 'border-white/5 bg-white/[0.03] text-zinc-500 hover:border-white/10'
                                                }`}
                                        >
                                            {label}
                                        </button>
                                    ))}
                                </div>
                            </section>
                        </div>
                    )}

                    {/* ══ LINKS TAB ════════════════════════════════════════ */}
                    {activeTab === 'links' && (
                        <div className="p-6 space-y-5">
                            {/* Header */}
                            <div className="flex items-center justify-between">
                                <div>
                                    <h3 className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Custom Links</h3>
                                    <p className="text-[10px] text-zinc-700 mt-0.5">{links.length} link{links.length !== 1 ? 's' : ''}</p>
                                </div>
                                <button
                                    onClick={() => {
                                        const l = newLink(links.length);
                                        setLinks(prev => [...prev, l]);
                                        setExpandedLinkIdx(links.length);
                                    }}
                                    className="flex items-center gap-1.5 px-3 py-2 bg-indigo-500 rounded-xl hover:bg-indigo-600 transition-colors text-xs font-bold text-white"
                                >
                                    <Plus className="w-3.5 h-3.5" /> Add Link
                                </button>
                            </div>

                            {/* Link cards */}
                            <AnimatePresence>
                                {links.length === 0 && (
                                    <div className="text-center py-12 text-zinc-700">
                                        <Globe className="w-8 h-8 mx-auto mb-3 opacity-30" />
                                        <p className="text-sm font-bold">No links yet</p>
                                        <p className="text-xs mt-1">Click "Add Link" to get started</p>
                                    </div>
                                )}
                                {links.map((link, idx) => {
                                    const IconComp = ICON_MAP[link.iconName] || ExternalLink;
                                    const isExpanded = expandedLinkIdx === idx;

                                    return (
                                        <motion.div
                                            key={link.id}
                                            layout
                                            initial={{ opacity: 0, y: -8 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0, y: -8 }}
                                            className={`border rounded-2xl overflow-hidden transition-all ${link.isActive
                                                ? 'border-white/10 bg-zinc-900/60'
                                                : 'border-white/5 bg-zinc-900/30 opacity-60'
                                                }`}
                                        >
                                            {/* Card header — always visible */}
                                            <div className="p-4 flex items-center gap-3">
                                                {/* Drag handle visual */}
                                                <GripVertical className="w-4 h-4 text-zinc-700 flex-shrink-0" />

                                                {/* Icon preview */}
                                                <div
                                                    className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                                                    style={{ backgroundColor: link.badgeColor || theme.primaryColor + '22' }}
                                                >
                                                    {link.thumbnail
                                                        ? <img src={link.thumbnail} alt="" className="w-full h-full object-cover rounded-xl" />
                                                        : <IconComp className="w-4 h-4" style={{ color: link.badgeColor || theme.primaryColor }} />
                                                    }
                                                </div>

                                                {/* Title & url inline edit */}
                                                <div className="flex-1 min-w-0 space-y-1">
                                                    <input
                                                        className="w-full bg-transparent text-sm font-bold placeholder-zinc-600 focus:outline-none truncate"
                                                        value={link.title}
                                                        onChange={e => updateLink(idx, { title: e.target.value })}
                                                        placeholder="Link Title"
                                                        onClick={e => e.stopPropagation()}
                                                    />
                                                    <input
                                                        className="w-full bg-transparent text-[11px] text-zinc-500 placeholder-zinc-700 focus:outline-none truncate"
                                                        value={link.url}
                                                        onChange={e => updateLink(idx, { url: e.target.value })}
                                                        placeholder="https://"
                                                        onClick={e => e.stopPropagation()}
                                                    />
                                                </div>

                                                {/* Actions */}
                                                <div className="flex items-center gap-1.5 flex-shrink-0">
                                                    {/* Active toggle */}
                                                    <button
                                                        type="button"
                                                        onClick={() => toggleLink(idx)}
                                                        className={`w-10 h-6 rounded-full transition-colors relative flex-shrink-0 ${link.isActive ? 'bg-indigo-500' : 'bg-zinc-700'}`}
                                                    >
                                                        <span
                                                            className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full shadow transition-transform duration-200 ${link.isActive ? 'translate-x-4' : 'translate-x-0'}`}
                                                        />
                                                    </button>

                                                    {/* Expand / collapse */}
                                                    <button
                                                        type="button"
                                                        onClick={() => setExpandedLinkIdx(isExpanded ? null : idx)}
                                                        className="p-1.5 rounded-lg hover:bg-white/10 text-zinc-500 hover:text-white transition-colors text-xs font-bold"
                                                        title={isExpanded ? 'Collapse' : 'Edit more'}
                                                    >
                                                        {isExpanded ? '▲' : '▼'}
                                                    </button>

                                                    {/* Delete */}
                                                    <button
                                                        type="button"
                                                        onClick={() => deleteLink(idx)}
                                                        className="p-1.5 rounded-lg hover:bg-rose-500/10 text-zinc-600 hover:text-rose-400 transition-colors"
                                                    >
                                                        <Trash2 className="w-3.5 h-3.5" />
                                                    </button>
                                                </div>
                                            </div>

                                            {/* Expanded editor */}
                                            <AnimatePresence>
                                                {isExpanded && (
                                                    <motion.div
                                                        initial={{ height: 0, opacity: 0 }}
                                                        animate={{ height: 'auto', opacity: 1 }}
                                                        exit={{ height: 0, opacity: 0 }}
                                                        transition={{ duration: 0.2 }}
                                                        className="overflow-hidden"
                                                    >
                                                        <div className="border-t border-white/5 p-4 space-y-4 bg-black/20">

                                                            {/* Reorder */}
                                                            <div className="flex items-center gap-2">
                                                                <span className="text-[10px] font-black uppercase tracking-widest text-zinc-600">Order</span>
                                                                <button
                                                                    onClick={() => moveLink(idx, 'up')}
                                                                    disabled={idx === 0}
                                                                    className="p-1 rounded bg-white/5 hover:bg-white/10 disabled:opacity-30 text-zinc-400"
                                                                >
                                                                    <ArrowUp className="w-3 h-3" />
                                                                </button>
                                                                <button
                                                                    onClick={() => moveLink(idx, 'down')}
                                                                    disabled={idx === links.length - 1}
                                                                    className="p-1 rounded bg-white/5 hover:bg-white/10 disabled:opacity-30 text-zinc-400"
                                                                >
                                                                    <ArrowDown className="w-3 h-3" />
                                                                </button>
                                                            </div>

                                                            {/* Link type */}
                                                            <div className="space-y-1.5">
                                                                <label className="text-[10px] font-black uppercase tracking-widest text-zinc-600">Type</label>
                                                                <select
                                                                    value={link.linkType || 'link'}
                                                                    onChange={e => updateLink(idx, { linkType: e.target.value })}
                                                                    className="w-full bg-zinc-900 border border-white/10 rounded-xl px-3 py-2 text-xs text-zinc-300 focus:outline-none focus:border-indigo-500/50"
                                                                >
                                                                    {LINK_TYPES.map(lt => (
                                                                        <option key={lt.value} value={lt.value}>{lt.label}</option>
                                                                    ))}
                                                                </select>
                                                            </div>

                                                            {/* Icon picker */}
                                                            <div className="space-y-2">
                                                                <label className="text-[10px] font-black uppercase tracking-widest text-zinc-600">Icon</label>
                                                                <div className="grid grid-cols-5 gap-2">
                                                                    {ICON_OPTIONS.map(({ name, Icon }) => (
                                                                        <button
                                                                            key={name}
                                                                            type="button"
                                                                            onClick={() => updateLink(idx, { iconName: name })}
                                                                            title={name}
                                                                            className={`p-2.5 rounded-xl border flex items-center justify-center transition-all ${link.iconName === name
                                                                                ? 'border-indigo-500 bg-indigo-500/20 text-white'
                                                                                : 'border-white/5 bg-white/5 text-zinc-500 hover:border-white/20'
                                                                                }`}
                                                                        >
                                                                            <Icon className="w-4 h-4" />
                                                                        </button>
                                                                    ))}
                                                                </div>
                                                            </div>

                                                            {/* Thumbnail */}
                                                            <div className="space-y-2">
                                                                <label className="text-[10px] font-black uppercase tracking-widest text-zinc-600">Thumbnail Image</label>
                                                                <div className="flex items-center gap-2">
                                                                    {link.thumbnail && (
                                                                        // eslint-disable-next-line @next/next/no-img-element
                                                                        <img src={link.thumbnail} alt="thumb" className="w-10 h-10 rounded-lg object-cover border border-white/10 flex-shrink-0" />
                                                                    )}
                                                                    <input
                                                                        ref={el => { thumbnailInputRefs.current[idx] = el; }}
                                                                        type="file"
                                                                        accept="image/*"
                                                                        className="hidden"
                                                                        onChange={e => handleThumbnailUpload(e, idx)}
                                                                    />
                                                                    <button
                                                                        type="button"
                                                                        disabled={uploadingThumbnailIdx === idx}
                                                                        onClick={() => thumbnailInputRefs.current[idx]?.click()}
                                                                        className="flex items-center gap-1.5 px-3 py-2 bg-zinc-800 hover:bg-zinc-700 rounded-xl text-xs text-zinc-300 font-medium transition-colors disabled:opacity-50 flex-shrink-0"
                                                                    >
                                                                        {uploadingThumbnailIdx === idx
                                                                            ? <><Loader2 className="w-3 h-3 animate-spin" /> Uploading…</>
                                                                            : <><Upload className="w-3 h-3" /> Upload</>}
                                                                    </button>
                                                                    <input
                                                                        className="flex-1 min-w-0 bg-zinc-900 border border-white/10 rounded-xl px-2.5 py-2 text-xs text-zinc-400 focus:outline-none focus:border-indigo-500/50"
                                                                        value={link.thumbnail || ''}
                                                                        onChange={e => updateLink(idx, { thumbnail: e.target.value })}
                                                                        placeholder="or paste URL"
                                                                    />
                                                                    {link.thumbnail && (
                                                                        <button
                                                                            type="button"
                                                                            onClick={() => updateLink(idx, { thumbnail: '' })}
                                                                            className="text-zinc-600 hover:text-rose-400 flex-shrink-0"
                                                                        >
                                                                            <Trash2 className="w-3.5 h-3.5" />
                                                                        </button>
                                                                    )}
                                                                </div>
                                                            </div>

                                                            {/* Description */}
                                                            <div className="space-y-1.5">
                                                                <label className="text-[10px] font-black uppercase tracking-widest text-zinc-600">Short Description</label>
                                                                <textarea
                                                                    rows={2}
                                                                    value={link.description || ''}
                                                                    onChange={e => updateLink(idx, { description: e.target.value })}
                                                                    className="w-full bg-zinc-900 border border-white/10 rounded-xl px-3 py-2 text-xs text-zinc-300 resize-none focus:outline-none focus:border-indigo-500/50 placeholder-zinc-700"
                                                                    placeholder="Optional short description shown below the link…"
                                                                />
                                                            </div>

                                                            {/* Badge */}
                                                            <div className="space-y-2">
                                                                <label className="text-[10px] font-black uppercase tracking-widest text-zinc-600">
                                                                    Badge / Label <span className="text-zinc-700 normal-case font-normal">(optional)</span>
                                                                </label>
                                                                <div className="flex gap-2">
                                                                    <input
                                                                        className="flex-1 bg-zinc-900 border border-white/10 rounded-xl px-3 py-2 text-xs text-zinc-300 focus:outline-none focus:border-indigo-500/50"
                                                                        value={link.badgeText || ''}
                                                                        onChange={e => updateLink(idx, { badgeText: e.target.value })}
                                                                        placeholder="e.g. New, Hot, Free"
                                                                        maxLength={16}
                                                                    />
                                                                </div>
                                                                {/* Badge color swatches */}
                                                                <div className="flex gap-2 flex-wrap">
                                                                    {BADGE_COLORS.map(c => (
                                                                        <button
                                                                            type="button"
                                                                            key={c}
                                                                            onClick={() => updateLink(idx, { badgeColor: c })}
                                                                            className={`w-7 h-7 rounded-full border-2 transition-transform hover:scale-110 ${link.badgeColor === c ? 'border-white scale-110' : 'border-transparent'}`}
                                                                            style={{ backgroundColor: c }}
                                                                            title={c}
                                                                        />
                                                                    ))}
                                                                    <button
                                                                        type="button"
                                                                        onClick={() => updateLink(idx, { badgeColor: '' })}
                                                                        className="text-[10px] text-zinc-700 hover:text-zinc-400 self-center ml-1"
                                                                    >
                                                                        clear
                                                                    </button>
                                                                </div>
                                                            </div>

                                                            {/* Highlight border toggle */}
                                                            <div className="flex items-center justify-between py-1">
                                                                <div>
                                                                    <p className="text-xs font-bold text-zinc-400">Highlight Border</p>
                                                                    <p className="text-[10px] text-zinc-700">Adds a glowing accent border</p>
                                                                </div>
                                                                <button
                                                                    type="button"
                                                                    onClick={() => updateLink(idx, { highlightBorder: !link.highlightBorder })}
                                                                    className={`w-10 h-6 rounded-full transition-colors relative flex-shrink-0 ${link.highlightBorder ? 'bg-indigo-500' : 'bg-zinc-700'}`}
                                                                >
                                                                    <span className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full shadow transition-transform duration-200 ${link.highlightBorder ? 'translate-x-4' : 'translate-x-0'}`} />
                                                                </button>
                                                            </div>

                                                            {/* Schedule */}
                                                            <div className="space-y-3 pt-1 border-t border-white/5">
                                                                <label className="text-[10px] font-black uppercase tracking-widest text-zinc-600 flex items-center gap-1.5">
                                                                    <Clock className="w-3 h-3" /> Scheduled Visibility
                                                                </label>
                                                                <div className="grid grid-cols-2 gap-2">
                                                                    <div className="space-y-1">
                                                                        <span className="text-[10px] text-zinc-700 font-medium">Show from</span>
                                                                        <input
                                                                            type="datetime-local"
                                                                            value={link.scheduleStart || ''}
                                                                            onChange={e => updateLink(idx, { scheduleStart: e.target.value })}
                                                                            className="w-full bg-zinc-900 border border-white/10 rounded-xl px-2.5 py-2 text-[10px] text-zinc-400 focus:outline-none"
                                                                        />
                                                                    </div>
                                                                    <div className="space-y-1">
                                                                        <span className="text-[10px] text-zinc-700 font-medium">Hide after</span>
                                                                        <input
                                                                            type="datetime-local"
                                                                            value={link.scheduleEnd || ''}
                                                                            onChange={e => updateLink(idx, { scheduleEnd: e.target.value })}
                                                                            className="w-full bg-zinc-900 border border-white/10 rounded-xl px-2.5 py-2 text-[10px] text-zinc-400 focus:outline-none"
                                                                        />
                                                                    </div>
                                                                </div>
                                                                {(link.scheduleStart || link.scheduleEnd) && (
                                                                    <button
                                                                        onClick={() => updateLink(idx, { scheduleStart: '', scheduleEnd: '' })}
                                                                        className="text-[10px] text-zinc-700 hover:text-rose-400 transition-colors"
                                                                    >
                                                                        ✕ Clear schedule
                                                                    </button>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </motion.div>
                                                )}
                                            </AnimatePresence>
                                        </motion.div>
                                    );
                                })}
                            </AnimatePresence>

                            {/* Save button */}
                            {links.length > 0 && (
                                <button
                                    onClick={handleSave}
                                    disabled={isSaving}
                                    className="w-full flex items-center justify-center gap-2 bg-indigo-500 py-3.5 rounded-xl font-bold text-sm text-white hover:bg-indigo-600 transition-all active:scale-[0.98] disabled:opacity-50"
                                >
                                    {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                                    Save Links
                                </button>
                            )}
                        </div>
                    )}

                    {/* ══ TESTIMONIALS TAB ══════════════════════════════════ */}
                    {activeTab === 'testimonials' && (
                        <div className="p-6 space-y-5">
                            <div className="flex items-center justify-between">
                                <div>
                                    <h3 className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Testimonials</h3>
                                    <p className="text-[10px] text-zinc-700 mt-0.5">{testimonials.length} testimonial{testimonials.length !== 1 ? 's' : ''}</p>
                                </div>
                                <button
                                    onClick={() => {
                                        const t = newTestimonial();
                                        setTestimonials(prev => [...prev, t]);
                                        setExpandedTestimonialIdx(testimonials.length);
                                    }}
                                    className="flex items-center gap-1.5 px-3 py-2 bg-indigo-500 rounded-xl hover:bg-indigo-600 transition-colors text-xs font-bold text-white"
                                >
                                    <Plus className="w-3.5 h-3.5" /> Add New
                                </button>
                            </div>

                            <div className="space-y-3">
                                {testimonials.map((t, idx) => (
                                    <div key={t.id} className="border border-white/10 bg-zinc-900/60 rounded-2xl overflow-hidden">
                                        <div className="p-4 flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-full bg-indigo-500/10 flex items-center justify-center overflow-hidden">
                                                {t.avatar ? <img src={t.avatar} alt="" className="w-full h-full object-cover" /> : <Star className="w-4 h-4 text-indigo-400" />}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-bold truncate">{t.name || 'Anonymous'}</p>
                                                <p className="text-[10px] text-zinc-500 truncate">{t.role || 'Customer'}</p>
                                            </div>
                                            <div className="flex gap-1">
                                                <button onClick={() => setExpandedTestimonialIdx(expandedTestimonialIdx === idx ? null : idx)} className="p-1.5 hover:bg-white/10 rounded-lg text-zinc-500">
                                                    {expandedTestimonialIdx === idx ? <ArrowDown className="w-4 h-4" /> : <ArrowUp className="w-4 h-4" />}
                                                </button>
                                                <button onClick={() => setTestimonials(prev => prev.filter((_, i) => i !== idx))} className="p-1.5 hover:bg-rose-500/10 text-zinc-600 hover:text-rose-400">
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </div>

                                        <AnimatePresence>
                                            {expandedTestimonialIdx === idx && (
                                                <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }} className="overflow-hidden border-t border-white/5 bg-black/20 p-4 space-y-4">
                                                    <div className="grid grid-cols-2 gap-3">
                                                        <div className="space-y-1">
                                                            <label className="text-[10px] font-black uppercase tracking-widest text-zinc-600">Name</label>
                                                            <input
                                                                value={t.name}
                                                                onChange={e => setTestimonials(prev => prev.map((item, i) => i === idx ? { ...item, name: e.target.value } : item))}
                                                                className="w-full bg-zinc-900 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
                                                            />
                                                        </div>
                                                        <div className="space-y-1">
                                                            <label className="text-[10px] font-black uppercase tracking-widest text-zinc-600">Role / Company</label>
                                                            <input
                                                                value={t.role}
                                                                onChange={e => setTestimonials(prev => prev.map((item, i) => i === idx ? { ...item, role: e.target.value } : item))}
                                                                className="w-full bg-zinc-900 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
                                                            />
                                                        </div>
                                                    </div>
                                                    <div className="space-y-1">
                                                        <label className="text-[10px] font-black uppercase tracking-widest text-zinc-600">Content</label>
                                                        <textarea
                                                            value={t.content}
                                                            onChange={e => setTestimonials(prev => prev.map((item, i) => i === idx ? { ...item, content: e.target.value } : item))}
                                                            rows={3}
                                                            className="w-full bg-zinc-900 border border-white/10 rounded-xl px-3 py-2 text-xs text-white resize-none focus:outline-none"
                                                        />
                                                    </div>
                                                    <div className="space-y-1">
                                                        <label className="text-[10px] font-black uppercase tracking-widest text-zinc-600">Avatar URL</label>
                                                        <input
                                                            value={t.avatar}
                                                            onChange={e => setTestimonials(prev => prev.map((item, i) => i === idx ? { ...item, avatar: e.target.value } : item))}
                                                            placeholder="https://..."
                                                            className="w-full bg-zinc-900 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
                                                        />
                                                    </div>
                                                </motion.div>
                                            )}
                                        </AnimatePresence>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* ══ FAQ TAB ═══════════════════════════════════════════ */}
                    {activeTab === 'faq' && (
                        <div className="p-6 space-y-5">
                            <div className="flex items-center justify-between">
                                <div>
                                    <h3 className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Frequently Asked Questions</h3>
                                    <p className="text-[10px] text-zinc-700 mt-0.5">{faqs.length} question{faqs.length !== 1 ? 's' : ''}</p>
                                </div>
                                <button
                                    onClick={() => {
                                        const f = newFAQ();
                                        setFaqs(prev => [...prev, f]);
                                        setExpandedFAQIdx(faqs.length);
                                    }}
                                    className="flex items-center gap-1.5 px-3 py-2 bg-indigo-500 rounded-xl hover:bg-indigo-600 transition-colors text-xs font-bold text-white"
                                >
                                    <Plus className="w-3.5 h-3.5" /> Add FAQ
                                </button>
                            </div>

                            <div className="space-y-3">
                                {faqs.map((f, idx) => (
                                    <div key={f.id} className="border border-white/10 bg-zinc-900/60 rounded-2xl overflow-hidden">
                                        <div className="p-4 flex items-center justify-between gap-3">
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-bold truncate">{f.question || 'Untitled Question'}</p>
                                            </div>
                                            <div className="flex gap-1">
                                                <button onClick={() => setExpandedFAQIdx(expandedFAQIdx === idx ? null : idx)} className="p-1.5 hover:bg-white/10 rounded-lg text-zinc-500">
                                                    {expandedFAQIdx === idx ? <ArrowDown className="w-4 h-4" /> : <ArrowUp className="w-4 h-4" />}
                                                </button>
                                                <button onClick={() => setFaqs(prev => prev.filter((_, i) => i !== idx))} className="p-1.5 hover:bg-rose-500/10 text-zinc-600 hover:text-rose-400">
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </div>

                                        <AnimatePresence>
                                            {expandedFAQIdx === idx && (
                                                <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }} className="overflow-hidden border-t border-white/5 bg-black/20 p-4 space-y-4">
                                                    <div className="space-y-1">
                                                        <label className="text-[10px] font-black uppercase tracking-widest text-zinc-600">Question</label>
                                                        <input
                                                            value={f.question}
                                                            onChange={e => setFaqs(prev => prev.map((item, i) => i === idx ? { ...item, question: e.target.value } : item))}
                                                            className="w-full bg-zinc-900 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
                                                        />
                                                    </div>
                                                    <div className="space-y-1">
                                                        <label className="text-[10px] font-black uppercase tracking-widest text-zinc-600">Answer</label>
                                                        <textarea
                                                            value={f.answer}
                                                            onChange={e => setFaqs(prev => prev.map((item, i) => i === idx ? { ...item, answer: e.target.value } : item))}
                                                            rows={3}
                                                            className="w-full bg-zinc-900 border border-white/10 rounded-xl px-3 py-2 text-xs text-white resize-none focus:outline-none"
                                                        />
                                                    </div>
                                                </motion.div>
                                            )}
                                        </AnimatePresence>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* ══ LAYOUT TAB ════════════════════════════════════════ */}
                    {activeTab === 'layout' && (
                        <div className="p-6 space-y-6">
                            <div>
                                <h3 className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Storefront Structure</h3>
                                <p className="text-[10px] text-zinc-700 mt-1">Toggle and reorder the sections of your page</p>
                            </div>
                            <div className="space-y-2">
                                {layout.map((item, idx) => (
                                    <div
                                        key={item.id}
                                        className={`bg-white/[0.03] border border-white/5 rounded-2xl p-4 flex items-center justify-between group transition-all ${!item.enabled ? 'opacity-40' : ''}`}
                                    >
                                        <div className="flex items-center gap-3">
                                            <button
                                                onClick={() => toggleSection(item.id)}
                                                className={`w-10 h-6 rounded-full transition-colors relative flex-shrink-0 ${item.enabled ? 'bg-indigo-500' : 'bg-zinc-700'}`}
                                            >
                                                <span className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full shadow transition-transform duration-200 ${item.enabled ? 'translate-x-4' : 'translate-x-0'}`} />
                                            </button>
                                            <div>
                                                <span className="text-xs font-bold text-white block capitalize">{item.id}</span>
                                                <span className="text-[10px] text-zinc-500">
                                                    {item.id === 'hero' ? 'Profile picture and bio' :
                                                        item.id === 'services' ? 'Action buttons' :
                                                            item.id === 'links' ? 'Custom link list' :
                                                                item.id === 'products' ? 'Featured products' :
                                                                    item.id === 'newsletter' ? 'Email subscription' :
                                                                        item.id === 'testimonials' ? 'Social proof' : 'Questions & Answers'}
                                                </span>
                                            </div>
                                        </div>
                                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button
                                                onClick={() => moveSection(idx, 'up')}
                                                disabled={idx === 0}
                                                className="p-1.5 hover:bg-white/10 rounded-lg text-zinc-500 disabled:opacity-20"
                                            >
                                                <ArrowUp className="w-3 h-3" />
                                            </button>
                                            <button
                                                onClick={() => moveSection(idx, 'down')}
                                                disabled={idx === layout.length - 1}
                                                className="p-1.5 hover:bg-white/10 rounded-lg text-zinc-500 disabled:opacity-20"
                                            >
                                                <ArrowDown className="w-3 h-3" />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </aside>

            {/* ── Right: Phone Preview ──────────────────────── */}
            <div className={`flex-1 bg-[#050505] flex items-center justify-center p-4 md:p-8 overflow-hidden relative ${showMobilePreview ? 'flex' : 'hidden md:flex'}`}>
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(99,102,241,0.03)_0%,transparent_70%)]" />

                {/* Mobile Preview Header (Close button) */}
                <button
                    onClick={() => setShowMobilePreview(false)}
                    className="absolute top-4 right-4 z-50 p-3 bg-white/5 rounded-full md:hidden"
                >
                    <Plus className="w-6 h-6 rotate-45" />
                </button>

                {/* ── 2D Minimal Phone UI ──────────────────────── */}
                <div className="relative w-[340px] h-[680px] bg-black rounded-[2.5rem] border-[6px] border-[#1A1A1A] shadow-[0_24px_48px_-12px_rgba(0,0,0,0.5)] flex-shrink-0 overflow-hidden flex flex-col">

                    {/* Mock Status Bar */}
                    <div className="h-10 w-full flex items-center justify-between px-8 pt-2 z-50 bg-inherit flex-shrink-0">
                        <span className="text-[10px] font-bold opacity-40">9:41</span>
                        <div className="w-16 h-4 bg-[#1A1A1A] rounded-full" />
                        <div className="flex gap-1 opacity-40">
                            <div className="w-3 h-1.5 bg-current rounded-[1px]" />
                            <div className="w-1.5 h-1.5 bg-current rounded-full" />
                        </div>
                    </div>

                    {/* Scrolling Content Area */}
                    <div className="flex-1 overflow-y-auto overflow-x-hidden scrollbar-hide relative overscroll-contain"
                        style={{
                            backgroundColor: theme.backgroundColor,
                            backgroundImage: theme.backgroundImage ? `url(${theme.backgroundImage})` : undefined,
                            backgroundSize: 'cover',
                            backgroundPosition: 'center',
                            color: theme.textColor,
                            fontFamily: `'${theme.fontFamily}', sans-serif`,
                            scrollbarWidth: 'none',
                            msOverflowStyle: 'none',
                        }}
                    >
                        <div className="px-5 pt-6 pb-12 space-y-8">
                            {layout.filter(item => item.enabled).map((item) => {
                                switch (item.id) {
                                    case 'hero':
                                        return (
                                            <div key="hero" className="flex flex-col items-center text-center space-y-4">
                                                <div className="w-20 h-20 rounded-[1.5rem] bg-zinc-800 border-4 border-black shadow-2xl overflow-hidden">
                                                    {/* eslint-disable-next-line @next/next/no-img-element */}
                                                    <img
                                                        src={photoURL || `https://api.dicebear.com/7.x/initials/svg?seed=${displayName || 'Creator'}`}
                                                        alt="avatar"
                                                        className="w-full h-full object-cover"
                                                    />
                                                </div>
                                                <div>
                                                    <h1 className="text-xl font-black">{displayName || 'Your Name'}</h1>
                                                    <p className="text-sm mt-0.5" style={{ color: theme.textColor + '80' }}>@{effectiveUsername}</p>
                                                </div>
                                                <p className="text-xs max-w-[220px] leading-relaxed" style={{ color: theme.textColor + '60' }}>
                                                    Digital creator building tools for the future.
                                                </p>
                                            </div>
                                        );
                                    case 'services':
                                        return (
                                            <div key="services" className="space-y-2.5">
                                                <div className="flex items-center gap-3">
                                                    <h2 className="text-[10px] font-black uppercase tracking-widest opacity-30">Services</h2>
                                                    <div className="h-px flex-1 bg-white/5" />
                                                </div>
                                                <div className="grid grid-cols-2 gap-2">
                                                    {['Whatsapp', 'Booking'].map(label => (
                                                        <div
                                                            key={label}
                                                            className="flex items-center gap-2 p-2.5 bg-white/5 border border-white/10 rounded-xl"
                                                        >
                                                            <div className="w-6 h-6 rounded-lg bg-indigo-500/20 flex items-center justify-center">
                                                                <Zap className="w-3 h-3 text-indigo-400" />
                                                            </div>
                                                            <span className="text-[10px] font-bold">{label}</span>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        );
                                    case 'links':
                                        return (
                                            <div key="links" className="space-y-2.5">
                                                {links.filter(l => l.isActive).map(link => {
                                                    const IconComp = ICON_MAP[link.iconName] || ExternalLink;
                                                    const br = theme.buttonStyle === 'pill' ? '9999px' : theme.buttonStyle === 'square' ? '8px' : '14px';
                                                    return (
                                                        <div
                                                            key={link.id}
                                                            className="w-full flex items-center gap-3 px-4 py-3 border transition-all"
                                                            style={{
                                                                backgroundColor: 'rgba(255,255,255,0.05)',
                                                                borderColor: link.highlightBorder ? theme.primaryColor : 'rgba(255,255,255,0.08)',
                                                                borderRadius: br,
                                                                boxShadow: link.highlightBorder ? `0 0 12px ${theme.primaryColor}40` : undefined,
                                                            }}
                                                        >
                                                            <div
                                                                className="w-8 h-8 rounded-xl flex-shrink-0 flex items-center justify-center overflow-hidden"
                                                                style={{ backgroundColor: (link.badgeColor || theme.primaryColor) + '22' }}
                                                            >
                                                                {link.thumbnail
                                                                    // eslint-disable-next-line @next/next/no-img-element
                                                                    ? <img src={link.thumbnail} alt="" className="w-full h-full object-cover" />
                                                                    : <IconComp className="w-3.5 h-3.5" style={{ color: link.badgeColor || theme.primaryColor }} />
                                                                }
                                                            </div>
                                                            <div className="flex-1 min-w-0">
                                                                <p className="text-xs font-bold truncate">{link.title}</p>
                                                                {link.description && (
                                                                    <p className="text-[10px] truncate mt-0.5" style={{ color: theme.textColor + '60' }}>{link.description}</p>
                                                                )}
                                                            </div>
                                                            {link.badgeText && (
                                                                <span
                                                                    className="text-[8px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full flex-shrink-0"
                                                                    style={{ backgroundColor: link.badgeColor || theme.primaryColor, color: '#fff' }}
                                                                >
                                                                    {link.badgeText}
                                                                </span>
                                                            )}
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        );
                                    case 'products':
                                        return (
                                            <div key="products" className="space-y-4">
                                                <div className="flex items-center gap-3">
                                                    <h2 className="text-xs font-black uppercase tracking-widest" style={{ opacity: 0.5 }}>Featured</h2>
                                                    <div className="h-px flex-1 bg-white/10" />
                                                </div>
                                                <div className="bg-white/5 border border-white/5 rounded-2xl p-4 space-y-3">
                                                    <div className="aspect-[4/3] bg-zinc-800 rounded-xl relative overflow-hidden">
                                                        <div className="absolute top-2 left-2 bg-black/40 backdrop-blur-md border border-white/10 rounded-lg px-2 py-1 flex items-center gap-1.5">
                                                            <Zap className="w-2.5 h-2.5" style={{ color: theme.primaryColor }} />
                                                            <span className="text-[7px] font-black uppercase tracking-widest">Digital</span>
                                                        </div>
                                                    </div>
                                                    <div>
                                                        <p className="text-xs font-bold">Creator Workflow Pack</p>
                                                        <p className="text-sm font-black mt-0.5" style={{ color: theme.primaryColor }}>₹999</p>
                                                    </div>
                                                    <button
                                                        className="w-full py-2.5 rounded-xl text-[9px] font-black uppercase tracking-widest text-white"
                                                        style={{ backgroundColor: theme.primaryColor, boxShadow: `0 6px 16px ${theme.primaryColor}30` }}
                                                    >
                                                        Get Access
                                                    </button>
                                                </div>
                                            </div>
                                        );
                                    case 'newsletter':
                                        return (
                                            <div key="newsletter" className="p-4 bg-white/5 rounded-2xl border border-white/10 space-y-3">
                                                <h3 className="text-xs font-bold text-center">Join the Newsletter</h3>
                                                <div className="flex gap-2">
                                                    <div className="flex-1 bg-zinc-900 border border-white/10 rounded-lg px-2 py-1.5 text-[9px] text-zinc-500">
                                                        your@email.com
                                                    </div>
                                                    <div className="bg-indigo-500 rounded-lg px-3 py-1.5 text-[9px] font-bold">Join</div>
                                                </div>
                                            </div>
                                        );
                                    case 'testimonials':
                                        return (
                                            <div key="testimonials" className="space-y-4">
                                                <div className="flex items-center gap-3">
                                                    <h2 className="text-[10px] font-black uppercase tracking-widest opacity-30">What people say</h2>
                                                    <div className="h-px flex-1 bg-white/5" />
                                                </div>
                                                <div className="flex gap-3 overflow-x-auto scrollbar-hide pb-2">
                                                    {(testimonials.length > 0 ? testimonials : [newTestimonial()]).map((t, i) => (
                                                        <div key={i} className="min-w-[240px] p-4 bg-white/5 border border-white/10 rounded-2xl space-y-3">
                                                            <div className="flex items-center gap-3">
                                                                <div className="w-8 h-8 rounded-full bg-indigo-500/20 flex items-center justify-center overflow-hidden">
                                                                    {t.avatar ? <img src={t.avatar} alt="" className="w-full h-full object-cover" /> : <Star className="w-3 h-3 text-indigo-400" />}
                                                                </div>
                                                                <div>
                                                                    <p className="text-[10px] font-bold">{t.name}</p>
                                                                    <p className="text-[8px] opacity-40">{t.role}</p>
                                                                </div>
                                                            </div>
                                                            <p className="text-[10px] italic leading-relaxed opacity-70">"{t.content}"</p>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        );
                                    case 'faq':
                                        return (
                                            <div key="faq" className="space-y-4">
                                                <div className="flex items-center gap-3">
                                                    <h2 className="text-[10px] font-black uppercase tracking-widest opacity-30">FAQ</h2>
                                                    <div className="h-px flex-1 bg-white/5" />
                                                </div>
                                                <div className="space-y-2">
                                                    {(faqs.length > 0 ? faqs : [newFAQ()]).map((f, i) => (
                                                        <div key={i} className="p-3 bg-white/5 border border-white/10 rounded-xl space-y-1">
                                                            <p className="text-[10px] font-bold">{f.question}</p>
                                                            <p className="text-[9px] opacity-60 leading-relaxed">{f.answer}</p>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        );
                                    default:
                                        return null;
                                }
                            })}
                        </div>
                    </div>

                </div>

                {/* Live preview badge */}
                <div className="absolute bottom-8 left-1/2 -translate-x-1/2">
                    <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl px-5 py-2.5 flex items-center gap-3">
                        <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                        <p className="text-zinc-400 text-[10px] font-bold uppercase tracking-widest">Live Preview</p>
                    </div>
                </div>
            </div>
        </div>
    );
}
