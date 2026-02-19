'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
    Layout, Palette, Type, Image as ImageIcon,
    Layers, Save, Eye, RefreshCcw, Check,
    ArrowUp, ArrowDown, Trash2, Plus, Zap, Upload, Loader2, Link as LinkIcon
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/hooks/useAuth';

const LINK_TYPES = [
    { value: 'link', label: '🔗 Link' },
    { value: 'video', label: '🎬 Video' },
    { value: 'music', label: '🎵 Music' },
    { value: 'shop', label: '🛍️ Shop' },
    { value: 'social', label: '📱 Social' },
    { value: 'download', label: '⬇️ Download' },
    { value: 'newsletter', label: '📧 Newsletter' },
];

const FONTS = [
    { name: 'Inter', value: 'var(--font-inter)' },
    { name: 'Outfit', value: 'var(--font-outfit)' },
    { name: 'Cabinet Grotesk', value: 'var(--font-cabinet)' },
    { name: 'Space Grotesk', value: 'var(--font-space)' },
];

const SECTIONS = [
    { id: 'hero', name: 'Hero / Bio', icon: Type },
    { id: 'links', name: 'Custom Links', icon: Layers },
    { id: 'products', name: 'Product Grid', icon: Layers },
    { id: 'socials', name: 'Social Links', icon: Zap },
    { id: 'newsletter', name: 'Newsletter', icon: Save },
];

export default function StorefrontBuilder() {
    const { user } = useAuth();
    const [isSaving, setIsSaving] = useState(false);
    const [activeTab, setActiveTab] = useState('design');
    const [uploadingThumbnailIdx, setUploadingThumbnailIdx] = useState<number | null>(null);
    const thumbnailInputRefs = useRef<(HTMLInputElement | null)[]>([]);
    const [theme, setTheme] = useState({
        primaryColor: '#6366f1',
        backgroundColor: '#030303',
        textColor: '#ffffff',
        fontFamily: 'Outfit',
        borderRadius: '2rem',
        backgroundImage: '',
    });

    const [layout, setLayout] = useState([
        { id: 'hero', enabled: true },
        { id: 'links', enabled: true },
        { id: 'products', enabled: true },
        { id: 'socials', enabled: true },
        { id: 'newsletter', enabled: false },
    ]);

    const [links, setLinks] = useState<any[]>([]);

    useEffect(() => {
        async function fetchProfile() {
            try {
                const response = await fetch('/api/creator/profile');
                if (response.ok) {
                    const data = await response.json();
                    if (data.theme) setTheme(data.theme);
                    if (data.layout) setLayout(data.layout);
                    if (data.links) setLinks(data.links);
                }
            } catch (error) {
                console.error('Fetch Profile Error:', error);
            }
        }
        fetchProfile();
    }, []);

    const moveSection = (index: number, direction: 'up' | 'down') => {
        const newLayout = [...layout];
        const targetIndex = direction === 'up' ? index - 1 : index + 1;
        if (targetIndex < 0 || targetIndex >= newLayout.length) return;

        const temp = newLayout[index];
        newLayout[index] = newLayout[targetIndex];
        newLayout[targetIndex] = temp;
        setLayout(newLayout);
    };

    const toggleSection = (id: string) => {
        setLayout(layout.map(item =>
            item.id === id ? { ...item, enabled: !item.enabled } : item
        ));
    };

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
            const newLinks = [...links];
            newLinks[idx].thumbnail = publicUrl;
            setLinks(newLinks);
        } catch (err) {
            console.error('Thumbnail upload failed', err);
        } finally {
            setUploadingThumbnailIdx(null);
            if (thumbnailInputRefs.current[idx]) thumbnailInputRefs.current[idx]!.value = '';
        }
    };

    const handleSave = async () => {

        try {
            setIsSaving(true);
            const response = await fetch('/api/creator/profile', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    theme,
                    layout,
                    links,
                }),
            });
            if (!response.ok) throw new Error('Save failed');
            alert('Storefront updated successfully!');
        } catch (error) {
            console.error('Save Error:', error);
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="flex flex-col h-[calc(100vh-80px)] overflow-hidden -m-8">
            <div className="flex flex-1">
                {/* Editor Sidebar */}
                <aside className="w-96 bg-[#0A0A0A] border-r border-white/5 flex flex-col">
                    <div className="p-8 border-b border-white/5 flex items-center justify-between">
                        <h2 className="text-xl font-black uppercase tracking-tight">Editor</h2>
                        <div className="flex gap-2">
                            <button
                                onClick={() => window.open(`/u/${(user as any)?.username || user?.email?.split('@')[0]}`, '_blank')}
                                className="p-2 bg-white/5 rounded-xl hover:bg-white/10 transition-colors"
                            >
                                <Eye className="w-4 h-4 text-zinc-400" />
                            </button>
                            <button
                                onClick={handleSave}
                                disabled={isSaving}
                                className="bg-indigo-500 p-2 rounded-xl hover:bg-indigo-600 transition-colors"
                            >
                                {isSaving ? <RefreshCcw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                            </button>
                        </div>
                    </div>

                    <div className="flex border-b border-white/5">
                        {['design', 'links', 'layout'].map(tab => (
                            <button
                                key={tab}
                                onClick={() => setActiveTab(tab)}
                                className={`flex-1 py-4 text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === tab ? 'text-white border-b-2 border-indigo-500' : 'text-zinc-500'
                                    }`}
                            >
                                {tab}
                            </button>
                        ))}
                    </div>

                    <div className="flex-1 overflow-y-auto p-8 space-y-12">
                        {activeTab === 'design' ? (
                            <div className="space-y-10">
                                {/* Color Palette */}
                                <section className="space-y-4">
                                    <h3 className="text-[10px] font-black uppercase tracking-widest text-zinc-500 flex items-center gap-2">
                                        <Palette className="w-3 h-3" />
                                        Brand Colors
                                    </h3>
                                    <div className="space-y-6">
                                        <div className="flex items-center justify-between">
                                            <span className="text-sm font-bold text-zinc-400">Accent Color</span>
                                            <input
                                                type="color"
                                                value={theme.primaryColor}
                                                onChange={(e) => setTheme({ ...theme, primaryColor: e.target.value })}
                                                className="w-10 h-10 rounded-xl bg-transparent border-none cursor-pointer"
                                            />
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <span className="text-sm font-bold text-zinc-400">Background</span>
                                            <input
                                                type="color"
                                                value={theme.backgroundColor}
                                                onChange={(e) => setTheme({ ...theme, backgroundColor: e.target.value })}
                                                className="w-10 h-10 rounded-xl bg-transparent border-none cursor-pointer"
                                            />
                                        </div>

                                        {/* Background Image URL */}
                                        <div className="space-y-2">
                                            <span className="text-sm font-bold text-zinc-400">Background Image</span>
                                            <input
                                                type="url"
                                                value={theme.backgroundImage || ''}
                                                onChange={(e) => setTheme({ ...theme, backgroundImage: e.target.value })}
                                                className="w-full bg-zinc-900 border border-white/10 rounded-xl px-3 py-2 text-xs text-white placeholder-zinc-600 focus:outline-none focus:border-indigo-500/50 transition-colors"
                                                placeholder="https://example.com/bg.jpg"
                                            />
                                            {theme.backgroundImage && (
                                                <button
                                                    type="button"
                                                    onClick={() => setTheme({ ...theme, backgroundImage: '' })}
                                                    className="text-[10px] text-zinc-600 hover:text-rose-400 transition-colors"
                                                >
                                                    Clear image
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                </section>

                                {/* Typography */}
                                <section className="space-y-4">
                                    <h3 className="text-[10px] font-black uppercase tracking-widest text-zinc-500 flex items-center gap-2">
                                        <Type className="w-3 h-3" />
                                        Typography
                                    </h3>
                                    <div className="grid grid-cols-1 gap-2">
                                        {FONTS.map(font => (
                                            <button
                                                key={font.name}
                                                onClick={() => setTheme({ ...theme, fontFamily: font.name })}
                                                className={`p-4 rounded-2xl border text-left transition-all ${theme.fontFamily === font.name ? 'border-indigo-500 bg-indigo-500/10' : 'border-white/5 bg-white/5'
                                                    }`}
                                            >
                                                <span className="font-bold">{font.name}</span>
                                            </button>
                                        ))}
                                    </div>
                                </section>
                            </div>
                        ) : activeTab === 'links' ? (
                            <div className="space-y-6">
                                <div className="flex items-center justify-between">
                                    <h3 className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Custom Links</h3>
                                    <button
                                        onClick={() => setLinks([...links, { id: Math.random().toString(36).substr(2, 9), title: 'New Link', url: 'https://', isActive: true, order: links.length }])}
                                        className="p-2 bg-indigo-500 rounded-lg hover:bg-indigo-600 transition-colors"
                                    >
                                        <Plus className="w-3 h-3 text-white" />
                                    </button>
                                </div>

                                <div className="space-y-4">
                                    {links.map((link, idx) => (
                                        <div key={link.id} className="p-4 bg-white/5 border border-white/5 rounded-2xl bg-zinc-900/50 space-y-3">
                                            <div className="flex items-center justify-between gap-2">
                                                <input
                                                    className="bg-transparent border-none text-sm font-bold focus:ring-0 p-0 flex-1 min-w-0"
                                                    value={link.title}
                                                    onChange={(e) => {
                                                        const newLinks = [...links];
                                                        newLinks[idx].title = e.target.value;
                                                        setLinks(newLinks);
                                                    }}
                                                    placeholder="Link Title"
                                                />
                                                {/* Enable / Disable toggle */}
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        const newLinks = [...links];
                                                        newLinks[idx].isActive = !newLinks[idx].isActive;
                                                        setLinks(newLinks);
                                                    }}
                                                    title={link.isActive ? 'Disable link' : 'Enable link'}
                                                    className={`w-10 h-5 rounded-full transition-colors flex-shrink-0 relative ${link.isActive ? 'bg-indigo-500' : 'bg-zinc-700'
                                                        }`}
                                                >
                                                    <span
                                                        className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${link.isActive ? 'translate-x-5' : 'translate-x-0.5'
                                                            }`}
                                                    />
                                                </button>
                                                <button
                                                    onClick={() => setLinks(links.filter((_, i) => i !== idx))}
                                                    className="text-zinc-500 hover:text-rose-500 flex-shrink-0"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                            <input
                                                className="bg-zinc-800/50 border border-white/5 rounded-lg text-xs p-2 w-full text-zinc-400"
                                                value={link.url}
                                                onChange={(e) => {
                                                    const newLinks = [...links];
                                                    newLinks[idx].url = e.target.value;
                                                    setLinks(newLinks);
                                                }}
                                                placeholder="https://your-link.com"
                                            />
                                            {/* Thumbnail Upload */}
                                            <div className="flex items-center gap-2">
                                                <input
                                                    ref={el => { thumbnailInputRefs.current[idx] = el; }}
                                                    type="file"
                                                    accept="image/*"
                                                    className="hidden"
                                                    onChange={(e) => handleThumbnailUpload(e, idx)}
                                                />
                                                {link.thumbnail ? (
                                                    // eslint-disable-next-line @next/next/no-img-element
                                                    <img src={link.thumbnail} alt="thumb" className="w-8 h-8 rounded object-cover border border-white/10" />
                                                ) : (
                                                    <div className="w-8 h-8 rounded bg-zinc-800 border border-white/5 flex items-center justify-center">
                                                        <ImageIcon className="w-3 h-3 text-zinc-600" />
                                                    </div>
                                                )}
                                                <button
                                                    type="button"
                                                    disabled={uploadingThumbnailIdx === idx}
                                                    onClick={() => thumbnailInputRefs.current[idx]?.click()}
                                                    className="flex items-center gap-1 px-2 py-1 bg-zinc-800 hover:bg-zinc-700 rounded-lg text-[10px] text-zinc-400 transition-colors disabled:opacity-50"
                                                >
                                                    {uploadingThumbnailIdx === idx
                                                        ? <><Loader2 className="w-3 h-3 animate-spin" /> Uploading…</>
                                                        : <><Upload className="w-3 h-3" /> Image</>}
                                                </button>
                                                <input
                                                    className="bg-zinc-800/50 border border-white/5 rounded-lg text-xs p-1.5 flex-1 text-zinc-400"
                                                    value={link.thumbnail || ''}
                                                    onChange={(e) => { const nl = [...links]; nl[idx].thumbnail = e.target.value; setLinks(nl); }}
                                                    placeholder="or paste URL"
                                                />
                                            </div>

                                            {/* Link Type */}
                                            <select
                                                value={link.linkType || 'link'}
                                                onChange={(e) => { const nl = [...links]; nl[idx].linkType = e.target.value; setLinks(nl); }}
                                                className="bg-zinc-800/50 border border-white/5 rounded-lg text-xs p-2 w-full text-zinc-400 focus:outline-none"
                                            >
                                                {LINK_TYPES.map(lt => (
                                                    <option key={lt.value} value={lt.value}>{lt.label}</option>
                                                ))}
                                            </select>

                                            {/* Description */}
                                            <textarea
                                                rows={2}
                                                value={link.description || ''}
                                                onChange={(e) => { const nl = [...links]; nl[idx].description = e.target.value; setLinks(nl); }}
                                                className="bg-zinc-800/50 border border-white/5 rounded-lg text-xs p-2 w-full text-zinc-400 resize-none focus:outline-none"
                                                placeholder="Short description (optional)"
                                            />
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ) : (
                            <div className="space-y-6">
                                <h3 className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Storefront Structure</h3>
                                <div className="space-y-3">
                                    {layout.map((item, idx) => (
                                        <div
                                            key={item.id}
                                            className={`bg-white/5 border border-white/5 rounded-2xl p-4 flex items-center justify-between group transition-all ${!item.enabled ? 'opacity-50 grayscale' : ''
                                                }`}
                                        >
                                            <div className="flex items-center gap-4">
                                                <button
                                                    onClick={() => toggleSection(item.id)}
                                                    className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${item.enabled ? 'bg-indigo-500 border-indigo-500' : 'border-white/10 hover:border-white/30'
                                                        }`}
                                                >
                                                    {item.enabled && <Check className="w-3 h-3 text-white" />}
                                                </button>
                                                <span className="font-bold text-sm uppercase tracking-wide">
                                                    {SECTIONS.find(s => s.id === item.id)?.name}
                                                </span>
                                            </div>
                                            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button
                                                    onClick={() => moveSection(idx, 'up')}
                                                    disabled={idx === 0}
                                                    className="p-1.5 hover:bg-white/10 rounded-md text-zinc-500 disabled:opacity-0"
                                                >
                                                    <ArrowUp className="w-3 h-3" />
                                                </button>
                                                <button
                                                    onClick={() => moveSection(idx, 'down')}
                                                    disabled={idx === layout.length - 1}
                                                    className="p-1.5 hover:bg-white/10 rounded-md text-zinc-500 disabled:opacity-0"
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

                {/* Live Preview Overlay */}
                <main className="flex-1 bg-zinc-950 relative overflow-hidden flex items-center justify-center p-12">
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-indigo-500/10 via-transparent to-transparent opacity-50" />

                    {/* Phone Frame */}
                    <div className="relative w-[375px] h-[812px] bg-[#030303] rounded-[4rem] border-[12px] border-[#1A1A1A] shadow-[0_0_100px_rgba(0,0,0,0.8)] overflow-hidden group">
                        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-40 h-8 bg-[#1A1A1A] rounded-b-3xl z-50 flex items-center justify-center">
                            <div className="w-12 h-1 bg-zinc-800 rounded-full" />
                        </div>

                        {/* Mock Storefront Canvas */}
                        <div
                            className="w-full h-full overflow-y-auto scrollbar-hide pt-16 pb-20 px-6 space-y-12"
                            style={{
                                backgroundColor: theme.backgroundColor,
                                backgroundImage: theme.backgroundImage ? `url(${theme.backgroundImage})` : undefined,
                                backgroundSize: 'cover',
                                backgroundPosition: 'center',
                                color: theme.textColor,
                                fontFamily: theme.fontFamily
                            }}
                        >
                            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-1000">
                                {/* Header Mock */}
                                <div className="flex items-center justify-between">
                                    <div className="w-10 h-10 rounded-full bg-white/10 border border-white/10" />
                                    <div className="w-8 h-8 rounded-xl bg-white/5" />
                                </div>

                                {/* Bio Mock */}
                                <div className="flex flex-col items-center text-center space-y-4">
                                    <div className="w-24 h-24 rounded-[2rem] bg-zinc-800 border-4 border-black shadow-2xl overflow-hidden">
                                        <img src={user?.photoURL || 'https://api.dicebear.com/7.x/avataaars/svg?seed=Felix'} alt="Bio" className="w-full h-full object-cover" />
                                    </div>
                                    <div className="space-y-1">
                                        <h1 className="text-2xl font-black">{user?.displayName || 'Your Name'}</h1>
                                        <p className="text-zinc-500 text-sm font-medium">@{(user as any)?.username || user?.email?.split('@')[0] || 'username'}</p>
                                    </div>
                                    <p className="text-xs text-zinc-400 max-w-[240px] leading-relaxed">
                                        Digital creator building tools for the future of the internet.
                                    </p>
                                </div>

                                {/* Links Mock */}
                                <div className="space-y-3">
                                    {links.filter(l => l.isActive).map((link) => (
                                        <div
                                            key={link.id}
                                            className="w-full py-4 px-6 border border-white/10 flex items-center justify-center transition-all"
                                            style={{
                                                backgroundColor: 'rgba(255, 255, 255, 0.05)',
                                                borderRadius: theme.borderRadius === '2rem' ? '1rem' : '0.5rem',
                                            }}
                                        >
                                            <span className="text-xs font-bold">{link.title}</span>
                                        </div>
                                    ))}
                                </div>

                                {/* Product Card Mock */}
                                <div className="space-y-6">
                                    <div className="flex items-center justify-between">
                                        <h2 className="text-sm font-black uppercase tracking-widest opacity-50">Featured</h2>
                                        <div className="h-px flex-1 bg-white/10 ml-4" />
                                    </div>

                                    <div className="bg-white/5 border border-white/5 rounded-3xl p-6 space-y-4">
                                        <div className="aspect-[4/3] bg-zinc-800 rounded-2xl relative overflow-hidden">
                                            <div className="absolute top-3 left-3 bg-black/40 backdrop-blur-md border border-white/10 rounded-xl px-3 py-1.5 flex items-center gap-2">
                                                <Zap className="w-3 h-3" style={{ color: theme.primaryColor }} />
                                                <span className="text-[8px] font-black uppercase tracking-widest">Digital</span>
                                            </div>
                                        </div>
                                        <div className="space-y-2">
                                            <h3 className="font-bold">Creator Workflow Pack</h3>
                                            <p className="text-xl font-black" style={{ color: theme.primaryColor }}>₹999</p>
                                        </div>
                                        <button
                                            className="w-full py-4 rounded-2xl font-black uppercase tracking-widest text-[10px] shadow-2xl"
                                            style={{
                                                backgroundColor: theme.primaryColor,
                                                color: '#fff',
                                                boxShadow: `0 10px 20px ${theme.primaryColor}30`
                                            }}
                                        >
                                            Get Access
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="absolute bottom-10 left-12">
                        <div className="bg-white/5 backdrop-blur-xl border border-white/5 rounded-2xl px-6 py-4 flex items-center gap-4">
                            <div className="w-4 h-4 rounded-full bg-emerald-500 animate-pulse" />
                            <p className="text-zinc-500 text-xs font-bold uppercase tracking-widest">Live Preview System</p>
                        </div>
                    </div>
                </main>
            </div>
        </div>
    );
}
