'use client';

import React, { useState, useEffect } from 'react';
import {
    ChevronRight, ChevronLeft, Check, Package,
    Zap, Book, Layout, Image as ImageIcon,
    CreditCard, Globe, Shield, Sparkles,
    CheckCircle2, AlertCircle, Info, Clock,
    Upload, FileText, Video, Music, Settings,
    Eye, Edit3, Download, Copy,
    BarChart3, Users, Star, TrendingUp,
    Calendar, DollarSign, Lock, Mail,
    Camera, Palette, Layers, FolderOpen, X,
    Save, Send, Archive, Trash2, ExternalLink
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { toast } from 'react-hot-toast';
import Link from 'next/link';
import AntiGravityUpload from '@/components/dashboard/AntiGravityUpload';
import RichTextEditor from '@/components/dashboard/RichTextEditor';

const PRODUCT_TYPES = [
    { id: 'ebook', title: 'Ebook / PDF', icon: Book, color: 'indigo', desc: 'Secure PDF with watermarking' },
    { id: 'course', title: 'Online Course', icon: Globe, color: 'purple', desc: 'Multi-lesson learning experience' },
    { id: 'template', title: 'Template', icon: Layout, color: 'emerald', desc: 'Figma, Notion, or Canva assets' },
    { id: 'service', title: 'Service', icon: Sparkles, color: 'rose', desc: 'Consulting or custom work' },
    { id: 'software', title: 'Software', icon: Settings, color: 'cyan', desc: 'ZIP files, tools, or code' },
    { id: 'bundle', title: 'Bundle', icon: Package, color: 'orange', desc: 'Package multiple items' }
];

interface ProductFormProps {
    initialData?: any;
    isEditing?: boolean;
}

export default function ProductForm({ initialData, isEditing = false }: ProductFormProps) {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [activeTab, setActiveTab] = useState('general');
    const [formData, setFormData] = useState({
        productType: initialData?.productType || 'ebook',
        title: initialData?.title || '',
        tagline: initialData?.tagline || '',
        description: initialData?.description || '',
        slug: initialData?.slug || '',
        isFree: initialData?.isFree || false,
        pricingType: initialData?.pricingType || 'fixed',
        basePrice: initialData?.pricing?.basePrice ? initialData.pricing.basePrice / 100 : (initialData?.price || ''),
        compareAtPrice: initialData?.compareAtPrice || '',
        currency: initialData?.pricing?.currency || 'INR',
        coverImageUrl: initialData?.coverImageUrl || '',
        previewImages: initialData?.previewImages || [],
        previewVideo: initialData?.previewVideo || '',
        files: initialData?.files || [],
        deliveryMethod: initialData?.deliveryMethod || 'both',
        downloadLimit: initialData?.downloadLimit || 0,
        pdfWatermark: initialData?.pdfWatermark ?? true,
        seo: initialData?.seo || { title: '', description: '', keywords: [] },
        status: initialData?.status || 'draft',
        limitedStock: initialData?.limitedStock || false,
        stockCount: initialData?.stockCount || -1
    });

    const handleChange = (field: string, value: any) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const handleSeoChange = (field: string, value: any) => {
        setFormData(prev => ({
            ...prev,
            seo: { ...prev.seo, [field]: value }
        }));
    };

    const handleSave = async (statusOverride?: string) => {
        const status = statusOverride || formData.status;
        setLoading(true);
        try {
            const endpoint = isEditing ? `/api/creator/products/${initialData._id}` : '/api/creator/products';
            const method = isEditing ? 'PUT' : 'POST';

            const payload = {
                ...formData,
                status,
                price: Number(formData.basePrice),
                pricing: {
                    basePrice: Number(formData.basePrice) * 100,
                    currency: formData.currency,
                    taxInclusive: false
                }
            };

            const res = await fetch(endpoint, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (res.ok) {
                toast.success(isEditing ? 'Changes Synced' : 'Product Deployed');
                router.push('/dashboard/products');
                router.refresh();
            } else {
                const err = await res.json();
                toast.error(err.message || 'Transmission Failed');
            }
        } catch (error) {
            console.error(error);
            toast.error('Sync Error');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex flex-col lg:flex-row gap-10">
            {/* Main Content Area */}
            <div className="flex-1 space-y-10">
                {/* Visual Identity Section */}
                <section className="bg-zinc-900/40 border border-white/5 rounded-[3rem] p-10 backdrop-blur-xl relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/5 rounded-full blur-3xl -mr-32 -mt-32" />

                    <div className="space-y-8">
                        <div>
                            <h2 className="text-xl font-black text-white italic uppercase tracking-tighter mb-6 flex items-center gap-3">
                                <Info className="w-5 h-5 text-indigo-500" />
                                General Intel
                            </h2>
                            <div className="space-y-6">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-zinc-600 uppercase tracking-widest ml-2">Product Title</label>
                                    <input
                                        type="text"
                                        value={formData.title}
                                        onChange={e => handleChange('title', e.target.value)}
                                        className="w-full bg-zinc-950 border border-white/5 rounded-2xl py-4 px-6 text-xl font-black text-white placeholder:text-zinc-800 focus:border-indigo-500/40 transition-all italic uppercase tracking-tight"
                                        placeholder="THE ULTIMATE CREATOR PLAYBOOK"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-zinc-600 uppercase tracking-widest ml-2">Tagline (Rapid Hook)</label>
                                    <input
                                        type="text"
                                        value={formData.tagline}
                                        onChange={e => handleChange('tagline', e.target.value)}
                                        className="w-full bg-zinc-950 border border-white/5 rounded-2xl py-4 px-6 text-white font-bold placeholder:text-zinc-800 focus:border-indigo-500/40 transition-all italic"
                                        placeholder="Monetize your audience from day one."
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-zinc-600 uppercase tracking-widest ml-2">Detailed Description (Rich Content)</label>
                                    <RichTextEditor
                                        content={formData.description}
                                        onChange={(html) => handleChange('description', html)}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Media & Assets Section */}
                <section className="bg-zinc-900/40 border border-white/5 rounded-[3rem] p-10 backdrop-blur-xl">
                    <h2 className="text-xl font-black text-white italic uppercase tracking-tighter mb-8 flex items-center gap-3">
                        <ImageIcon className="w-5 h-5 text-indigo-500" />
                        Assets & Media
                    </h2>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                        <div className="space-y-4">
                            <label className="text-[10px] font-black text-zinc-600 uppercase tracking-widest ml-2">Cover Identity / Thumbnail</label>
                            <AntiGravityUpload
                                type="product_thumbnail"
                                accept="image/*"
                                onUploadComplete={(url) => handleChange('coverImageUrl', url)}
                                onUploadError={() => { }}
                            />
                            {formData.coverImageUrl && (
                                <div className="relative group w-full aspect-video rounded-3xl overflow-hidden border border-white/10 mt-4">
                                    <img src={formData.coverImageUrl} className="w-full h-full object-cover" alt="Identity" />
                                    <button
                                        onClick={() => handleChange('coverImageUrl', '')}
                                        className="absolute top-4 right-4 p-2 bg-black/60 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity"
                                    >
                                        <Trash2 className="w-4 h-4 text-rose-500" />
                                    </button>
                                </div>
                            )}
                        </div>

                        <div className="space-y-4">
                            <label className="text-[10px] font-black text-zinc-600 uppercase tracking-widest ml-2">Digital Core (ZIP/PDF/Video)</label>
                            <AntiGravityUpload
                                type="product_asset"
                                onUploadComplete={(url, key, meta) => setFormData(prev => ({
                                    ...prev,
                                    files: [...prev.files, { url, key, ...meta }] as any
                                }))}
                                onUploadError={() => { }}
                            />
                            <div className="space-y-2 mt-4">
                                {formData.files.map((f: any, i: number) => (
                                    <div key={i} className="flex items-center justify-between p-4 bg-zinc-950 border border-white/5 rounded-2xl group">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-lg bg-zinc-900 flex items-center justify-center">
                                                <FileText className="w-4 h-4 text-indigo-400" />
                                            </div>
                                            <span className="text-xs font-bold truncate max-w-[150px] text-zinc-300">{f.name}</span>
                                        </div>
                                        <button onClick={() => handleChange('files', formData.files.filter((_: any, idx: number) => idx !== i))} className="text-zinc-700 hover:text-rose-500 transition-colors">
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </section>

                {/* SEO Optimization */}
                <section className="bg-zinc-900/40 border border-white/5 rounded-[3rem] p-10 backdrop-blur-xl">
                    <h2 className="text-xl font-black text-white italic uppercase tracking-tighter mb-6 flex items-center gap-3">
                        <Globe className="w-5 h-5 text-indigo-500" />
                        Visibility Protocol (SEO)
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-zinc-600 uppercase tracking-widest ml-2">URL Logic (Slug)</label>
                            <input
                                type="text"
                                value={formData.slug}
                                onChange={e => handleChange('slug', e.target.value)}
                                className="w-full bg-zinc-950 border border-white/5 rounded-2xl py-4 px-6 text-white font-bold"
                                placeholder="master-ritual"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-zinc-600 uppercase tracking-widest ml-2">Meta Performance Title</label>
                            <input
                                type="text"
                                value={formData.seo.title}
                                onChange={e => handleSeoChange('title', e.target.value)}
                                className="w-full bg-zinc-950 border border-white/5 rounded-2xl py-4 px-6 text-white font-bold"
                            />
                        </div>
                    </div>
                </section>
            </div>

            {/* Sidebar Controls */}
            <div className="lg:w-96 space-y-8">
                {/* Actions Box */}
                <div className="sticky top-10 space-y-8">
                    <div className="bg-zinc-900/60 border border-white/5 rounded-[2.5rem] p-8 space-y-6 backdrop-blur-2xl">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest italic">Status Monitor</span>
                            <div className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${formData.status === 'published' ? 'bg-emerald-500/10 text-emerald-400' :
                                formData.status === 'archived' ? 'bg-rose-500/10 text-rose-400' : 'bg-amber-500/10 text-amber-400'
                                }`}>
                                {formData.status}
                            </div>
                        </div>

                        <div className="space-y-3">
                            <button
                                onClick={() => handleSave('published')}
                                disabled={loading}
                                className="w-full flex items-center justify-center gap-3 bg-white text-black py-4 rounded-3xl font-black uppercase tracking-widest text-xs hover:bg-zinc-200 transition-all shadow-xl shadow-white/5 italic"
                            >
                                {loading ? <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" /> : <Send className="w-4 h-4" />}
                                Deploy To Public
                            </button>
                            <button
                                onClick={() => handleSave('draft')}
                                disabled={loading}
                                className="w-full flex items-center justify-center gap-3 bg-zinc-950 border border-white/5 text-white py-4 rounded-3xl font-black uppercase tracking-widest text-xs hover:bg-zinc-900 transition-all italic"
                            >
                                <Save className="w-4 h-4" />
                                Sync as Draft
                            </button>
                        </div>

                        <div className="flex items-center gap-2 pt-4 border-t border-white/5">
                            {isEditing && (
                                <Link
                                    href={`/p/${formData.slug}`}
                                    target="_blank"
                                    className="flex-1 flex items-center justify-center gap-2 bg-zinc-900 hover:bg-zinc-800 text-zinc-400 p-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all"
                                >
                                    <ExternalLink className="w-4 h-4" />
                                    Preview
                                </Link>
                            )}
                            <button className="flex-1 flex items-center justify-center gap-2 bg-zinc-900 hover:bg-rose-500/10 hover:text-rose-500 text-zinc-400 p-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all">
                                <Archive className="w-4 h-4" />
                                Archive
                            </button>
                        </div>
                    </div>

                    {/* Pricing Box */}
                    <div className="bg-zinc-900/60 border border-white/5 rounded-[2.5rem] p-8 space-y-6 backdrop-blur-2xl px-8">
                        <h3 className="text-[10px] font-black text-indigo-500 uppercase tracking-widest italic">Revenue Settings</h3>

                        <div className="flex bg-zinc-950 p-1.5 rounded-2xl border border-white/5 gap-1">
                            {['fixed', 'free', 'pwyw'].map(t => (
                                <button
                                    key={t}
                                    onClick={() => setFormData({ ...formData, pricingType: t as any, isFree: t === 'free' })}
                                    className={`flex-1 py-2.5 rounded-xl font-black uppercase text-[8px] tracking-widest transition-all ${formData.pricingType === t ? 'bg-zinc-800 text-white shadow-lg' : 'text-zinc-600 hover:text-white'}`}
                                >
                                    {t}
                                </button>
                            ))}
                        </div>

                        {formData.pricingType !== 'free' && (
                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <label className="text-[9px] font-black text-zinc-600 uppercase tracking-widest ml-2">Price (INR)</label>
                                    <div className="relative">
                                        <span className="absolute left-6 top-1/2 -translate-y-1/2 text-xl font-black text-zinc-700 italic">₹</span>
                                        <input
                                            type="number"
                                            value={formData.basePrice}
                                            onChange={e => handleChange('basePrice', e.target.value)}
                                            className="w-full bg-zinc-950 border border-white/5 rounded-2xl py-4 pl-12 pr-6 text-2xl font-black text-white placeholder:text-zinc-800 focus:border-indigo-500/40 transition-all"
                                            placeholder="0"
                                        />
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Category Box */}
                    <div className="bg-zinc-900/60 border border-white/5 rounded-[2.5rem] p-8 space-y-6 backdrop-blur-2xl h-fit">
                        <h3 className="text-[10px] font-black text-indigo-500 uppercase tracking-widest italic">Asset Logic</h3>
                        <div className="grid grid-cols-2 gap-3">
                            {PRODUCT_TYPES.map(type => (
                                <button
                                    key={type.id}
                                    onClick={() => handleChange('productType', type.id)}
                                    className={`flex flex-col items-center justify-center p-4 rounded-2xl border-2 transition-all gap-2 ${formData.productType === type.id ? 'bg-indigo-500/10 border-indigo-500/50' : 'bg-zinc-950 border-white/5 hover:border-white/10'}`}
                                >
                                    <type.icon className={`w-5 h-5 ${formData.productType === type.id ? 'text-indigo-400' : 'text-zinc-700'}`} />
                                    <span className={`text-[8px] font-black uppercase tracking-widest text-center ${formData.productType === type.id ? 'text-white' : 'text-zinc-600'}`}>{type.id}</span>
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
