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
    Camera, Palette, Layers, FolderOpen, X
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import AntiGravityUpload from '@/components/dashboard/AntiGravityUpload';

const STEPS = [
    { title: "Type", icon: Package, description: "Category" },
    { title: "Basics", icon: Info, description: "Content" },
    { title: "Media", icon: ImageIcon, description: "Visuals" },
    { title: "Pricing", icon: CreditCard, description: "Monetize" },
    { title: "Delivery", icon: Mail, description: "Access" },
    { title: "SEO", icon: Globe, description: "Visibility" },
    { title: "Review", icon: CheckCircle2, description: "Confirm" }
];

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
    const [step, setStep] = useState(1);
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        productType: initialData?.productType || 'ebook',
        title: initialData?.title || '',
        tagline: initialData?.tagline || '',
        description: initialData?.description || '',
        slug: initialData?.slug || '',
        isFree: initialData?.isFree || false,
        pricingType: initialData?.pricingType || 'fixed',
        basePrice: initialData?.pricing?.basePrice / 100 || initialData?.price || '',
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

    const handleNext = () => setStep(s => Math.min(s + 1, STEPS.length));
    const handleBack = () => setStep(s => Math.max(s - 1, 1));

    const handleSubmit = async () => {
        setLoading(true);
        try {
            const endpoint = isEditing ? `/api/creator/products/${initialData._id}` : '/api/creator/products';
            const method = isEditing ? 'PUT' : 'POST';

            const payload = {
                ...formData,
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
                router.push('/dashboard/products');
                router.refresh();
            } else {
                const err = await res.json();
                alert(err.message || 'Something went wrong');
            }
        } catch (error) {
            console.error(error);
            alert('Failed to save product');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-5xl mx-auto">
            {/* Step Progress */}
            <div className="flex items-center justify-between mb-12 relative px-4">
                <div className="absolute top-1/2 left-0 w-full h-0.5 bg-zinc-900 -translate-y-1/2 z-0" />
                <div
                    className="absolute top-1/2 left-0 h-0.5 bg-indigo-500 -translate-y-1/2 z-0 transition-all duration-500"
                    style={{ width: `${((step - 1) / (STEPS.length - 1)) * 100}%` }}
                />
                {STEPS.map((s, i) => (
                    <div key={i} className="relative z-10 flex flex-col items-center">
                        <div
                            className={`w-10 h-10 rounded-xl flex items-center justify-center border-2 transition-all duration-500 ${step > i + 1 ? 'bg-indigo-500 border-indigo-500' : step === i + 1 ? 'bg-zinc-950 border-indigo-500' : 'bg-zinc-950 border-zinc-900 text-zinc-700'}`}
                        >
                            {step > i + 1 ? <Check className="w-5 h-5 text-white" /> : <s.icon className={`w-4 h-4 ${step === i + 1 ? 'text-indigo-400' : ''}`} />}
                        </div>
                        <span className={`mt-3 text-[10px] font-black uppercase tracking-widest ${step >= i + 1 ? 'text-white' : 'text-zinc-600'}`}>{s.title}</span>
                    </div>
                ))}
            </div>

            {/* Form Content */}
            <div className="bg-zinc-900/40 border border-white/5 rounded-[3rem] p-10 min-h-[500px] backdrop-blur-xl relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/5 rounded-full blur-3xl -mr-32 -mt-32" />

                <AnimatePresence mode="wait">
                    <motion.div
                        key={step}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.3 }}
                        className="h-full"
                    >
                        {step === 1 && (
                            <div className="space-y-8">
                                <div className="text-center">
                                    <h2 className="text-3xl font-black text-white italic uppercase tracking-tighter mb-2">Choose Your Canvas</h2>
                                    <p className="text-zinc-500 font-medium">Select the format of the value you're delivering.</p>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                                    {PRODUCT_TYPES.map(type => (
                                        <button
                                            key={type.id}
                                            onClick={() => setFormData({ ...formData, productType: type.id })}
                                            className={`p-6 rounded-[2rem] text-left border-2 transition-all ${formData.productType === type.id ? 'bg-indigo-500/10 border-indigo-500/50 shadow-2xl' : 'bg-zinc-950/40 border-white/5 hover:border-white/10'}`}
                                        >
                                            <div className={`w-12 h-12 rounded-2xl bg-${type.color}-500/10 flex items-center justify-center mb-4`}>
                                                <type.icon className={`w-6 h-6 text-${type.color}-400`} />
                                            </div>
                                            <h3 className="text-white font-bold mb-1">{type.title}</h3>
                                            <p className="text-xs text-zinc-500 leading-relaxed font-medium">{type.desc}</p>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        {step === 2 && (
                            <div className="space-y-8 max-w-2xl mx-auto">
                                <div className="text-center">
                                    <h2 className="text-3xl font-black text-white italic uppercase tracking-tighter mb-2">The Masterpiece details</h2>
                                    <p className="text-zinc-500 font-medium">Capture attention with a compelling title and description.</p>
                                </div>
                                <div className="space-y-6">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-zinc-600 uppercase tracking-widest ml-2">Product Title</label>
                                        <input
                                            type="text"
                                            value={formData.title}
                                            onChange={e => setFormData({ ...formData, title: e.target.value })}
                                            className="w-full bg-zinc-950 border border-white/5 rounded-2xl py-4 px-6 text-white font-bold placeholder:text-zinc-800 focus:border-indigo-500/40 transition-all"
                                            placeholder="The Ultimate Creator Playbook"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-zinc-600 uppercase tracking-widest ml-2">Tagline (One sentence)</label>
                                        <input
                                            type="text"
                                            value={formData.tagline}
                                            onChange={e => setFormData({ ...formData, tagline: e.target.value })}
                                            className="w-full bg-zinc-950 border border-white/5 rounded-2xl py-4 px-6 text-white font-medium placeholder:text-zinc-800 focus:border-indigo-500/40 transition-all"
                                            placeholder="Build your audience and monetize from day one."
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-zinc-600 uppercase tracking-widest ml-2">Description</label>
                                        <textarea
                                            rows={5}
                                            value={formData.description}
                                            onChange={e => setFormData({ ...formData, description: e.target.value })}
                                            className="w-full bg-zinc-950 border border-white/5 rounded-2xl py-4 px-6 text-white font-medium placeholder:text-zinc-800 focus:border-indigo-500/40 transition-all resize-none"
                                            placeholder="Deep dive into the strategies..."
                                        />
                                    </div>
                                </div>
                            </div>
                        )}

                        {step === 3 && (
                            <div className="space-y-8">
                                <div className="text-center">
                                    <h2 className="text-3xl font-black text-white italic uppercase tracking-tighter mb-2">Visual Showcase</h2>
                                    <p className="text-zinc-500 font-medium">Upload a premium thumbnail and preview media.</p>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                    <div className="space-y-4">
                                        <label className="text-[10px] font-black text-zinc-600 uppercase tracking-widest ml-2">Cover Image / Thumbnail</label>
                                        <AntiGravityUpload
                                            type="product_thumbnail"
                                            accept="image/*"
                                            onUploadComplete={(url) => setFormData({ ...formData, coverImageUrl: url })}
                                            onUploadError={() => { }}
                                        />
                                        {formData.coverImageUrl && (
                                            <div className="w-full aspect-video rounded-[2rem] overflow-hidden border border-white/10">
                                                <img src={formData.coverImageUrl} className="w-full h-full object-cover" alt="Preview" />
                                            </div>
                                        )}
                                    </div>
                                    <div className="space-y-4">
                                        <label className="text-[10px] font-black text-zinc-600 uppercase tracking-widest ml-2">Asset File (ZIP/PDF/Video)</label>
                                        <AntiGravityUpload
                                            type="product_asset"
                                            onUploadComplete={(url, key, meta) => setFormData({
                                                ...formData,
                                                files: [...formData.files, { url, key, ...meta }] as any
                                            })}
                                            onUploadError={() => { }}
                                        />
                                        <div className="space-y-2">
                                            {formData.files.map((f: any, i: number) => (
                                                <div key={i} className="flex items-center justify-between p-4 bg-zinc-950 border border-white/5 rounded-2xl">
                                                    <span className="text-sm font-bold truncate max-w-[150px]">{f.name}</span>
                                                    <button onClick={() => setFormData({ ...formData, files: formData.files.filter((_: any, idx: number) => idx !== i) })} className="text-zinc-600 hover:text-white"><X className="w-4 h-4" /></button>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {step === 4 && (
                            <div className="space-y-8 max-w-2xl mx-auto">
                                <div className="text-center">
                                    <h2 className="text-3xl font-black text-white italic uppercase tracking-tighter mb-2">Monetization</h2>
                                    <p className="text-zinc-500 font-medium">Set your price or offer it for free.</p>
                                </div>
                                <div className="space-y-8">
                                    <div className="flex bg-zinc-950 p-2 rounded-2xl border border-white/5 gap-2">
                                        {['fixed', 'free', 'pwyw'].map(t => (
                                            <button
                                                key={t}
                                                onClick={() => setFormData({ ...formData, pricingType: t as any, isFree: t === 'free' })}
                                                className={`flex-1 py-3 rounded-xl font-black uppercase text-[10px] tracking-widest transition-all ${formData.pricingType === t ? 'bg-white text-black' : 'text-zinc-500 hover:text-white'}`}
                                            >
                                                {t}
                                            </button>
                                        ))}
                                    </div>

                                    {formData.pricingType !== 'free' && (
                                        <div className="p-8 bg-zinc-950 rounded-[2.5rem] border border-white/5 space-y-6">
                                            <div className="space-y-2">
                                                <label className="text-[10px] font-black text-zinc-600 uppercase tracking-widest ml-2">Price ({formData.currency})</label>
                                                <div className="relative">
                                                    <span className="absolute left-6 top-1/2 -translate-y-1/2 text-3xl font-black text-zinc-700">₹</span>
                                                    <input
                                                        type="number"
                                                        value={formData.basePrice}
                                                        onChange={e => setFormData({ ...formData, basePrice: e.target.value })}
                                                        className="w-full bg-black border border-white/5 rounded-3xl py-6 pl-12 pr-6 text-4xl font-black text-white placeholder:text-zinc-800"
                                                        placeholder="0"
                                                    />
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-3 p-4 bg-indigo-500/5 border border-indigo-500/20 rounded-2xl">
                                                <Sparkles className="w-5 h-5 text-indigo-400" />
                                                <p className="text-xs font-bold text-indigo-300">Tip: Suggested price for this category is ₹499 - ₹1,999</p>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {step === 5 && (
                            <div className="space-y-8 max-w-2xl mx-auto">
                                <div className="text-center">
                                    <h2 className="text-3xl font-black text-white italic uppercase tracking-tighter mb-2">Delivery & Logic</h2>
                                    <p className="text-zinc-500 font-medium">How assets are distributed after purchase.</p>
                                </div>
                                <div className="space-y-6">
                                    <div className="flex items-center justify-between p-6 bg-zinc-950 border border-white/5 rounded-[2rem] group hover:border-indigo-500/30 transition-all">
                                        <div>
                                            <h4 className="text-white font-bold mb-1">Email Watermarking</h4>
                                            <p className="text-xs text-zinc-500">Protect your PDFs with buyer's email.</p>
                                        </div>
                                        <button
                                            onClick={() => setFormData({ ...formData, pdfWatermark: !formData.pdfWatermark })}
                                            className={`w-12 h-6 rounded-full relative transition-all ${formData.pdfWatermark ? 'bg-indigo-500' : 'bg-zinc-800'}`}
                                        >
                                            <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${formData.pdfWatermark ? 'right-1' : 'left-1'}`} />
                                        </button>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-zinc-600 uppercase tracking-widest ml-2">Download Limit (0 = Unlimited)</label>
                                        <input
                                            type="number"
                                            value={formData.downloadLimit}
                                            onChange={e => setFormData({ ...formData, downloadLimit: Number(e.target.value) })}
                                            className="w-full bg-zinc-950 border border-white/5 rounded-2xl py-4 px-6 text-white font-bold"
                                        />
                                    </div>
                                </div>
                            </div>
                        )}

                        {step === 6 && (
                            <div className="space-y-8 max-w-2xl mx-auto">
                                <div className="text-center">
                                    <h2 className="text-3xl font-black text-white italic uppercase tracking-tighter mb-2">Search Logic</h2>
                                    <p className="text-zinc-500 font-medium">Optimize how your product appears in searches.</p>
                                </div>
                                <div className="space-y-6">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-zinc-600 uppercase tracking-widest ml-2">URL Slug</label>
                                        <div className="relative">
                                            <span className="absolute left-5 top-1/2 -translate-y-1/2 text-xs font-bold text-zinc-600">creatorly.in/p/</span>
                                            <input
                                                type="text"
                                                value={formData.slug}
                                                onChange={e => setFormData({ ...formData, slug: e.target.value })}
                                                className="w-full bg-zinc-950 border border-white/5 rounded-2xl py-4 pl-28 pr-6 text-white font-bold"
                                                placeholder="master-ritual"
                                            />
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-zinc-600 uppercase tracking-widest ml-2">Meta Title</label>
                                        <input
                                            type="text"
                                            value={formData.seo.title}
                                            onChange={e => setFormData({ ...formData, seo: { ...formData.seo, title: e.target.value } })}
                                            className="w-full bg-zinc-950 border border-white/5 rounded-2xl py-4 px-6 text-white font-bold"
                                        />
                                    </div>
                                </div>
                            </div>
                        )}

                        {step === 7 && (
                            <div className="space-y-12 text-center py-10">
                                <div className="w-24 h-24 bg-indigo-500 rounded-[2.5rem] flex items-center justify-center mx-auto shadow-2xl shadow-indigo-500/30">
                                    <Sparkles className="w-10 h-10 text-white" />
                                </div>
                                <div>
                                    <h2 className="text-4xl font-black text-white italic uppercase tracking-tighter mb-3">Protocol Ready</h2>
                                    <p className="text-zinc-500 max-w-xs mx-auto">Review your creation one last time before going live in the digital realm.</p>
                                </div>
                                <div className="max-w-md mx-auto grid grid-cols-2 gap-4">
                                    <div className="p-6 bg-zinc-950 rounded-3xl border border-white/5">
                                        <p className="text-[10px] font-black text-zinc-600 uppercase tracking-widest mb-1">Title</p>
                                        <p className="text-white font-bold truncate">{formData.title || 'Untitled'}</p>
                                    </div>
                                    <div className="p-6 bg-zinc-950 rounded-3xl border border-white/5">
                                        <p className="text-[10px] font-black text-zinc-600 uppercase tracking-widest mb-1">Price</p>
                                        <p className="text-emerald-400 font-bold tracking-tighter text-lg">₹{formData.basePrice || 0}</p>
                                    </div>
                                </div>
                            </div>
                        )}
                    </motion.div>
                </AnimatePresence>
            </div>

            {/* Navigation */}
            <div className="mt-8 flex items-center justify-between">
                <button
                    onClick={handleBack}
                    disabled={step === 1}
                    className={`flex items-center gap-2 font-black uppercase tracking-widest text-[10px] transition-all ${step === 1 ? 'opacity-0' : 'text-zinc-500 hover:text-white'}`}
                >
                    <ChevronLeft className="w-4 h-4" />
                    Archive Point
                </button>

                <button
                    onClick={step === STEPS.length ? handleSubmit : handleNext}
                    disabled={loading || (step === 2 && !formData.title)}
                    className="bg-white text-black px-12 py-4 rounded-[2rem] font-black uppercase tracking-widest text-[11px] shadow-2xl shadow-white/5 flex items-center gap-3 group hover:bg-zinc-200 transition-all disabled:opacity-50"
                >
                    {loading ? (
                        <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
                    ) : (
                        <>
                            {step === STEPS.length ? (isEditing ? 'Sync Changes' : 'Go Live') : 'Next Vector'}
                            <ChevronRight className={`w-4 h-4 group-hover:translate-x-1 transition-transform`} />
                        </>
                    )}
                </button>
            </div>
        </div>
    );
}
