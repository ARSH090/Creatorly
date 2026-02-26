'use client';

import React, { useState, useEffect } from "react";
import {
    ChevronRight, ChevronLeft, Check, Package,
    Zap, Book, Layout, Image as ImageIcon,
    CreditCard, Globe, Shield, Sparkles,
    CheckCircle2, AlertCircle, Info, Clock,
    Upload, FileText, Video, Music, Settings,
    Eye, Edit3, Wand2, Download, Copy,
    BarChart3, Users, Star, TrendingUp,
    Calendar, DollarSign, Lock, Mail,
    Camera, Palette, Layers, FolderOpen, X
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import AntiGravityUpload from "@/components/dashboard/AntiGravityUpload";

const STEPS = [
    { title: "Type", icon: Package, description: "Choose your product category" },
    { title: "Details", icon: Info, description: "Basic information" },
    { title: "Media", icon: ImageIcon, description: "Visuals & preview" },
    { title: "Files", icon: Upload, description: "Upload your product" },
    { title: "Pricing", icon: CreditCard, description: "Set your price" },
    { title: "Upsells", icon: Zap, description: "Add order bumps" },
    { title: "Delivery", icon: Mail, description: "Configure access" },
    { title: "SEO", icon: Globe, description: "Search optimization" },
    { title: "Publish", icon: CheckCircle2, description: "Launch your product" }
];

const PRODUCT_TYPES = [
    {
        id: 'ebook',
        title: 'Ebook / PDF',
        desc: 'Perfect for guides, reports, and books with PDF protection.',
        icon: Book,
        color: 'blue',
        popular: true,
        examples: 'Guides, Reports, Books, Workbooks'
    },
    {
        id: 'template',
        title: 'Template',
        desc: 'Notion, Figma, Canva, Excel, or any file type.',
        icon: Layout,
        color: 'emerald',
        popular: true,
        examples: 'Notion Templates, Canva Designs, Excel Sheets'
    },
    {
        id: 'preset',
        title: 'Preset / Filter',
        desc: 'Lightroom presets, Photoshop actions, video LUTs.',
        icon: Palette,
        color: 'purple',
        examples: 'Lightroom Presets, Photoshop Actions, LUTs'
    },
    {
        id: 'audio',
        title: 'Audio',
        desc: 'Music tracks, podcasts, sound effects, meditations.',
        icon: Music,
        color: 'amber',
        examples: 'Music, Podcasts, Sound Effects, Meditations'
    },
    {
        id: 'video',
        title: 'Video (Download)',
        desc: 'Single video or video pack for download only.',
        icon: Video,
        color: 'rose',
        examples: 'Tutorials, Workshops, Recordings'
    },
    {
        id: 'course',
        title: 'Course',
        desc: 'Multi-lesson video course with progress tracking.',
        icon: Globe,
        color: 'indigo',
        popular: true,
        examples: 'Online Courses, Training Programs, Workshops'
    },
    {
        id: 'bundle',
        title: 'Bundle',
        desc: 'Package multiple products together at a discount.',
        icon: Package,
        color: 'orange',
        examples: 'Product Bundles, Starter Packs, Collections'
    },
    {
        id: 'software',
        title: 'Software / Code',
        desc: 'ZIP files with code, scripts, or plugins.',
        icon: Settings,
        color: 'cyan',
        examples: 'Code Libraries, Scripts, Plugins, Tools'
    },
    {
        id: 'swipefile',
        title: 'Swipe File',
        desc: 'Collection of templates, scripts, examples.',
        icon: FolderOpen,
        color: 'teal',
        examples: 'Swipe Files, Resource Packs, Examples'
    },
    {
        id: 'lead_magnet',
        title: 'Lead Magnet (Free)',
        desc: 'Free download to capture emails.',
        icon: Star,
        color: 'green',
        examples: 'Free Guides, Checklists, Templates'
    },
    {
        id: 'pay_what_you_want',
        title: 'Pay What You Want',
        desc: 'Buyers choose their own price above minimum.',
        icon: DollarSign,
        color: 'pink',
        examples: 'Name Your Price Products, Donations'
    },
    {
        id: 'membership',
        title: 'Membership',
        desc: 'Recurring monthly or yearly billing.',
        icon: Users,
        color: 'violet',
        examples: 'Subscription Content, Members Area'
    }
];

const CATEGORIES = [
    'Social Media', 'Business', 'Finance', 'Design',
    'Photography', 'Fitness', 'Cooking', 'Education',
    'Technology', 'Personal Development', 'Other'
];

export default function NewProductWizard() {
    const { user } = useUser();
    const router = useRouter();
    const [step, setStep] = useState(1);
    const [loading, setLoading] = useState(false);
    const [autoSaving, setAutoSaving] = useState(false);
    const [formData, setFormData] = useState({
        // Step 1
        productType: '',

        // Step 2
        title: '',
        tagline: '',
        slug: '',
        description: '',
        category: '',
        tags: [],
        language: 'English',

        // Step 3
        thumbnailKey: '',
        galleryKeys: [],
        previewFileKey: '',

        // Step 4
        files: [],
        currentVersion: '1.0',

        // Step 5
        pricingType: 'fixed',
        basePrice: '',
        compareAtPrice: '',
        minPrice: '',
        suggestedPrice: '',
        salePrice: '',
        saleStartsAt: '',
        saleEndsAt: '',

        // Step 6: Upsells
        upsellProductIds: [],
        orderBumpProductIds: [],

        // Step 7: Delivery
        deliveryMethod: 'both',
        downloadLimit: 3,
        downloadExpiryHours: 72,
        pdfWatermark: true,
        pdfNoPrint: false,
        pdfNoCopy: false,
        accessExpiryDays: 0,
        thankYouMessage: '',
        thankYouRedirect: '',

        // Step 8: SEO
        metaTitle: '',
        metaDescription: '',
        ogImageKey: '',

        // Step 9: Publish
        status: 'draft',
        scheduledPublishAt: '',
        notifySubscribers: true
    });

    // Auto-save draft every 30 seconds
    useEffect(() => {
        if (step > 1 && (formData.title || formData.productType)) {
            const timer = setTimeout(() => {
                saveDraft();
            }, 30000);
            return () => clearTimeout(timer);
        }
    }, [formData, step]);

    const saveDraft = async () => {
        setAutoSaving(true);
        try {
            await fetch('/api/products/draft', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });
        } catch (error) {
            console.error('Failed to save draft:', error);
        } finally {
            setAutoSaving(false);
        }
    };

    const generateSlug = (title: string) => {
        return title
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/^-+|-+$/g, '')
            .substring(0, 50);
    };

    const nextStep = () => {
        if (step === 2 && !formData.slug) {
            setFormData({ ...formData, slug: generateSlug(formData.title) });
        }
        setStep(s => Math.min(s + 1, STEPS.length));
    };

    const prevStep = () => setStep(s => Math.max(s - 1, 1));

    const handleSubmit = async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/products', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });
            const product = await res.json();
            if (product._id) {
                // Trigger confetti
                router.push(`/dashboard/products/${product._id}?new=true`);
            }
        } catch (error) {
            console.error("Failed to create product:", error);
        } finally {
            setLoading(false);
        }
    };

    const isStepValid = () => {
        switch (step) {
            case 1: return formData.productType !== '';
            case 2: return !!formData.title && !!formData.description;
            case 3: return true; // Media is optionally valid
            case 4: return formData.productType === 'course' ? true : formData.files.length > 0;
            case 5: return formData.pricingType === 'free' || !!formData.basePrice;
            case 6: return true; // Upsells optional
            case 7: return true; // Delivery defaults ok
            case 8: return !!formData.slug;
            case 9: return true;
            default: return true;
        }
    };

    return (
        <div className="max-w-6xl mx-auto py-10 px-4">
            {/* Auto-save indicator */}
            {autoSaving && (
                <div className="fixed top-24 right-8 bg-zinc-900 border border-white/10 px-4 py-2 rounded-xl flex items-center gap-2 z-50">
                    <div className="w-3 h-3 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
                    <span className="text-xs text-zinc-400">Saving draft...</span>
                </div>
            )}

            {/* Header */}
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-3xl font-black text-white tracking-tightest mb-2">Create New Product</h1>
                    <p className="text-zinc-500 font-medium">Launch your digital masterpiece in minutes</p>
                </div>
                <button
                    onClick={saveDraft}
                    className="flex items-center gap-2 bg-zinc-900/50 border border-white/5 text-white px-4 py-2 rounded-xl text-sm font-bold hover:bg-zinc-800 transition-all"
                >
                    <Download className="w-4 h-4" />
                    Save Draft
                </button>
            </div>

            {/* Steps Progress */}
            <div className="flex items-center justify-between mb-16 relative">
                <div className="absolute top-1/2 left-0 w-full h-0.5 bg-zinc-900 -translate-y-1/2 z-0" />
                <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${((step - 1) / (STEPS.length - 1)) * 100}%` }}
                    className="absolute top-1/2 left-0 h-0.5 bg-indigo-500 -translate-y-1/2 z-0"
                />

                {STEPS.map((s, i) => (
                    <div key={s.title} className="relative z-10 flex flex-col items-center group">
                        <motion.div
                            animate={{
                                scale: step >= i + 1 ? 1 : 0.8,
                                backgroundColor: step >= i + 1 ? '#6366f1' : '#18181b',
                                borderColor: step >= i + 1 ? '#818cf8' : '#27272a'
                            }}
                            className="w-12 h-12 rounded-2xl border-2 flex items-center justify-center text-white shadow-xl shadow-black/50 transition-all"
                        >
                            {step > i + 1 ? <Check className="w-6 h-6" /> : <s.icon className="w-5 h-5" />}
                        </motion.div>
                        <p className={`mt-3 text-[10px] font-black uppercase tracking-widest transition-all ${step >= i + 1 ? 'text-white' : 'text-zinc-600'}`}>
                            {s.title}
                        </p>
                        <p className="absolute -bottom-6 text-xs text-zinc-600 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                            {s.description}
                        </p>
                    </div>
                ))}
            </div>

            {/* Step Content */}
            <div className="min-h-[400px]">
                <AnimatePresence mode="wait">
                    {step === 1 && (
                        <motion.div
                            key="step1"
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            className="space-y-8"
                        >
                            <div className="text-center space-y-2">
                                <h2 className="text-4xl font-black text-white tracking-tightest uppercase italic">Select Product Type</h2>
                                <p className="text-zinc-500 font-medium">What kind of masterpiece are we launching today?</p>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {PRODUCT_TYPES.map((type) => (
                                    <button
                                        key={type.id}
                                        onClick={() => setFormData({ ...formData, productType: type.id })}
                                        className={`p-6 rounded-[2rem] text-left transition-all duration-300 border-2 relative overflow-hidden group ${formData.productType === type.id ? 'bg-indigo-500/10 border-indigo-500/50 shadow-2xl shadow-indigo-500/10' : 'bg-zinc-900/40 border-white/5 hover:border-white/10'}`}
                                    >
                                        <div className={`w-14 h-14 rounded-2xl bg-${type.color}-500/10 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                                            <type.icon className={`w-7 h-7 text-${type.color}-400`} />
                                        </div>
                                        <h3 className="text-xl font-bold text-white mb-2">{type.title}</h3>
                                        <p className="text-sm text-zinc-500 font-medium leading-relaxed">{type.desc}</p>

                                        {formData.productType === type.id && (
                                            <div className="absolute top-6 right-6 w-6 h-6 bg-indigo-500 rounded-full flex items-center justify-center shadow-lg">
                                                <Check className="w-4 h-4 text-white" />
                                            </div>
                                        )}
                                    </button>
                                ))}
                            </div>
                        </motion.div>
                    )}

                    {step === 2 && (
                        <motion.div
                            key="step2"
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            className="space-y-8"
                        >
                            <div className="text-center space-y-2">
                                <h2 className="text-4xl font-black text-white tracking-tightest uppercase italic">The Essentials</h2>
                                <p className="text-zinc-500 font-medium">Define your product's identity.</p>
                            </div>

                            <div className="space-y-6 max-w-2xl mx-auto bg-zinc-900/40 p-10 rounded-[3rem] border border-white/5">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-zinc-600 uppercase tracking-[0.2em] ml-2">Product Title</label>
                                    <input
                                        type="text"
                                        placeholder="e.g. Master Your Morning Ritual"
                                        value={formData.title}
                                        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                        className="w-full bg-black/50 border border-white/5 rounded-2xl py-4 px-6 text-white text-lg font-bold placeholder:text-zinc-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500/40 transition-all font-sans"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-zinc-600 uppercase tracking-[0.2em] ml-2">Short Tagline</label>
                                    <input
                                        type="text"
                                        placeholder="A 5-minute guide to crushing your day."
                                        value={formData.tagline}
                                        onChange={(e) => setFormData({ ...formData, tagline: e.target.value })}
                                        className="w-full bg-black/50 border border-white/5 rounded-2xl py-4 px-6 text-white font-medium placeholder:text-zinc-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500/40 transition-all"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-zinc-600 uppercase tracking-[0.2em] ml-2">Description</label>
                                    <textarea
                                        rows={4}
                                        placeholder="Explain what value this adds to your audience's life..."
                                        value={formData.description}
                                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                        className="w-full bg-black/50 border border-white/5 rounded-2xl py-4 px-6 text-white font-medium placeholder:text-zinc-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500/40 transition-all resize-none"
                                    />
                                </div>
                            </div>
                        </motion.div>
                    )}

                    {step === 3 && (
                        <motion.div
                            key="step3"
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            className="space-y-8"
                        >
                            <div className="text-center space-y-2">
                                <h2 className="text-4xl font-black text-white tracking-tightest uppercase italic">Media & Visuals</h2>
                                <p className="text-zinc-500 font-medium">Make your product look premium.</p>
                            </div>

                            <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-8">
                                <div className="space-y-4">
                                    <label className="text-[10px] font-black text-zinc-600 uppercase tracking-[0.2em] ml-2">Product Thumbnail</label>
                                    <AntiGravityUpload
                                        type="product_thumbnail"
                                        accept="image/*"
                                        onUploadComplete={(url, key) => setFormData({ ...formData, thumbnailKey: key })}
                                        onUploadError={(err) => console.error(err)}
                                    />
                                </div>
                                <div className="space-y-4">
                                    <label className="text-[10px] font-black text-zinc-600 uppercase tracking-[0.2em] ml-2">Preview File (PDF/Video)</label>
                                    <AntiGravityUpload
                                        type="product_preview"
                                        onUploadComplete={(url, key) => setFormData({ ...formData, previewFileKey: key })}
                                        onUploadError={(err) => console.error(err)}
                                    />
                                </div>
                            </div>
                        </motion.div>
                    )}

                    {step === 4 && (
                        <motion.div
                            key="step4"
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            className="space-y-8"
                        >
                            <div className="text-center space-y-2">
                                <h2 className="text-4xl font-black text-white tracking-tightest uppercase italic">Product Assets</h2>
                                <p className="text-zinc-500 font-medium">Upload the actual files buyers will receive.</p>
                            </div>

                            <div className="max-w-2xl mx-auto space-y-6">
                                <AntiGravityUpload
                                    type="product_asset"
                                    onUploadComplete={(url, key, meta) => {
                                        setFormData({
                                            ...formData,
                                            files: [...formData.files, { key, name: meta.name, size: meta.size, type: meta.mimeType, order: formData.files.length }] as any
                                        });
                                    }}
                                    onUploadError={(err) => console.error(err)}
                                />

                                {formData.files.length > 0 && (
                                    <div className="space-y-3">
                                        {formData.files.map((file: any, i) => (
                                            <div key={i} className="flex items-center justify-between p-4 bg-zinc-900/50 border border-white/5 rounded-2xl">
                                                <div className="flex items-center gap-3">
                                                    <FileText className="w-5 h-5 text-indigo-400" />
                                                    <div>
                                                        <p className="text-sm font-bold text-white">{file.name}</p>
                                                        <p className="text-[10px] text-zinc-500 uppercase font-black">{Math.round(file.size / 1024)} KB</p>
                                                    </div>
                                                </div>
                                                <button
                                                    onClick={() => setFormData({ ...formData, files: formData.files.filter((_, idx) => idx !== i) })}
                                                    className="text-zinc-600 hover:text-rose-400 transition-colors"
                                                >
                                                    <X className="w-4 h-4" />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    )}

                    {step === 5 && (
                        <motion.div
                            key="step5"
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            className="space-y-8"
                        >
                            <div className="text-center space-y-2">
                                <h2 className="text-4xl font-black text-white tracking-tightest uppercase italic">Pricing Strategy</h2>
                                <p className="text-zinc-500 font-medium">How much is this masterpiece worth?</p>
                            </div>

                            <div className="max-w-2xl mx-auto space-y-8">
                                <div className="grid grid-cols-3 gap-4">
                                    {['fixed', 'pwyw', 'free'].map(type => (
                                        <button
                                            key={type}
                                            onClick={() => setFormData({ ...formData, pricingType: type as any })}
                                            className={`p-6 rounded-[2rem] border-2 transition-all ${formData.pricingType === type ? 'bg-indigo-500/10 border-indigo-500/50 shadow-2xl shadow-indigo-500/10' : 'bg-zinc-900/40 border-white/5 hover:border-white/10'}`}
                                        >
                                            <p className="text-[10px] font-black uppercase tracking-widest text-zinc-500 mb-2">{type}</p>
                                            <h3 className="text-lg font-bold text-white uppercase">{type === 'pwyw' ? 'PWYW' : type}</h3>
                                        </button>
                                    ))}
                                </div>

                                {formData.pricingType !== 'free' && (
                                    <div className="bg-zinc-900/40 p-10 rounded-[3rem] border border-white/5 space-y-6">
                                        <div className="space-y-2 italic">
                                            <label className="text-[10px] font-black text-zinc-600 uppercase tracking-[0.2em] ml-2 italic">Price (INR)</label>
                                            <div className="relative group">
                                                <span className="absolute left-6 top-1/2 -translate-y-1/2 text-2xl font-black text-zinc-700 group-focus-within:text-white transition-colors">₹</span>
                                                <input
                                                    type="number"
                                                    placeholder="0"
                                                    value={formData.basePrice}
                                                    onChange={(e) => setFormData({ ...formData, basePrice: e.target.value })}
                                                    className="w-full bg-black/50 border border-white/5 rounded-2xl py-6 pl-12 pr-6 text-4xl font-black text-white placeholder:text-zinc-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500/40 transition-all tracking-tighter"
                                                />
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="space-y-2">
                                                <label className="text-[10px] font-black text-zinc-600 uppercase tracking-[0.2em] ml-2">Compare At Price</label>
                                                <input
                                                    type="number"
                                                    placeholder="₹0"
                                                    value={formData.compareAtPrice}
                                                    onChange={(e) => setFormData({ ...formData, compareAtPrice: e.target.value })}
                                                    className="w-full bg-black/50 border border-white/5 rounded-2xl py-4 px-6 text-white font-bold focus:border-indigo-500/40 transition-all"
                                                />
                                            </div>
                                            {formData.pricingType === 'pwyw' && (
                                                <div className="space-y-2">
                                                    <label className="text-[10px] font-black text-zinc-600 uppercase tracking-[0.2em] ml-2">Minimum Price</label>
                                                    <input
                                                        type="number"
                                                        placeholder="₹0"
                                                        value={formData.minPrice}
                                                        onChange={(e) => setFormData({ ...formData, minPrice: e.target.value })}
                                                        className="w-full bg-black/50 border border-white/5 rounded-2xl py-4 px-6 text-white font-bold focus:border-indigo-500/40 transition-all"
                                                    />
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    )}

                    {step === 6 && (
                        <motion.div
                            key="step6"
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            className="space-y-8"
                        >
                            <div className="text-center space-y-2">
                                <h2 className="text-4xl font-black text-white tracking-tightest uppercase italic">Upsells & Bumps</h2>
                                <p className="text-zinc-500 font-medium">Increase your average order value.</p>
                            </div>

                            <div className="max-w-2xl mx-auto p-10 bg-zinc-900/40 rounded-[3rem] border border-white/5 text-center">
                                <Zap className="w-12 h-12 text-amber-400 mx-auto mb-6" />
                                <h3 className="text-xl font-bold text-white mb-2">Coming Soon</h3>
                                <p className="text-zinc-500">You'll be able to select other products to offer as upsells or order bumps here.</p>
                            </div>
                        </motion.div>
                    )}

                    {step === 7 && (
                        <motion.div
                            key="step7"
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            className="space-y-8"
                        >
                            <div className="text-center space-y-2">
                                <h2 className="text-4xl font-black text-white tracking-tightest uppercase italic">Secure Delivery</h2>
                                <p className="text-zinc-500 font-medium">Configure how buyers receive their assets.</p>
                            </div>

                            <div className="max-w-2xl mx-auto space-y-6">
                                <div className="bg-zinc-900/40 p-10 rounded-[3rem] border border-white/5 space-y-6">
                                    <div className="flex items-start gap-5 p-6 bg-black/40 rounded-3xl border border-white/5 group hover:border-indigo-500/30 transition-all cursor-pointer" onClick={() => setFormData({ ...formData, pdfWatermark: !formData.pdfWatermark })}>
                                        <div className="w-12 h-12 rounded-xl bg-indigo-500/10 flex items-center justify-center shrink-0">
                                            <Shield className="w-6 h-6 text-indigo-400" />
                                        </div>
                                        <div>
                                            <h4 className="text-white font-bold mb-1">Dynamic Email Watermarking</h4>
                                            <p className="text-sm text-zinc-500 leading-relaxed font-medium">Stamp buyer's email on PDFs to prevent piracy.</p>
                                        </div>
                                        <div className="ml-auto mt-2">
                                            <div className={`w-12 h-6 rounded-full relative flex items-center px-1 transition-all ${formData.pdfWatermark ? 'bg-indigo-500' : 'bg-zinc-800'}`}>
                                                <div className={`w-4 h-4 bg-white rounded-full shadow-lg transition-transform ${formData.pdfWatermark ? 'translate-x-6' : 'translate-x-0'}`} />
                                            </div>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black text-zinc-600 uppercase tracking-[0.2em] ml-2">Download Limit</label>
                                            <input
                                                type="number"
                                                value={formData.downloadLimit}
                                                onChange={(e) => setFormData({ ...formData, downloadLimit: parseInt(e.target.value) })}
                                                className="w-full bg-black/50 border border-white/5 rounded-2xl py-4 px-6 text-white font-bold focus:border-indigo-500/40 transition-all"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black text-zinc-600 uppercase tracking-[0.2em] ml-2">Expiry (Hours)</label>
                                            <input
                                                type="number"
                                                value={formData.downloadExpiryHours}
                                                onChange={(e) => setFormData({ ...formData, downloadExpiryHours: parseInt(e.target.value) })}
                                                className="w-full bg-black/50 border border-white/5 rounded-2xl py-4 px-6 text-white font-bold focus:border-indigo-500/40 transition-all"
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    )}

                    {step === 8 && (
                        <motion.div
                            key="step8"
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            className="space-y-8"
                        >
                            <div className="text-center space-y-2">
                                <h2 className="text-4xl font-black text-white tracking-tightest uppercase italic">Search Engine Optimization</h2>
                                <p className="text-zinc-500 font-medium">Make it easier for people to find your product.</p>
                            </div>

                            <div className="max-w-2xl mx-auto space-y-6 bg-zinc-900/40 p-10 rounded-[3rem] border border-white/5">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-zinc-600 uppercase tracking-[0.2em] ml-2">URL Slug</label>
                                    <div className="relative group">
                                        <span className="absolute left-6 top-1/2 -translate-y-1/2 text-sm font-bold text-zinc-700">creatorly.in/p/</span>
                                        <input
                                            type="text"
                                            value={formData.slug}
                                            onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                                            className="w-full bg-black/50 border border-white/5 rounded-2xl py-4 pl-[6.5rem] pr-6 text-white font-bold focus:border-indigo-500/40 transition-all"
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-zinc-600 uppercase tracking-[0.2em] ml-2">Meta Title</label>
                                    <input
                                        type="text"
                                        placeholder={formData.title}
                                        value={formData.metaTitle}
                                        onChange={(e) => setFormData({ ...formData, metaTitle: e.target.value })}
                                        className="w-full bg-black/50 border border-white/5 rounded-2xl py-4 px-6 text-white font-bold focus:border-indigo-500/40 transition-all"
                                    />
                                </div>
                            </div>
                        </motion.div>
                    )}

                    {step === 9 && (
                        <motion.div
                            key="step9"
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="space-y-8 text-center py-10"
                        >
                            <div className="w-24 h-24 bg-indigo-500 rounded-full flex items-center justify-center mx-auto shadow-2xl shadow-indigo-500/40 mb-8">
                                <CheckCircle2 className="w-12 h-12 text-white" />
                            </div>
                            <div className="space-y-4">
                                <h2 className="text-4xl font-black text-white tracking-tightest uppercase italic">Launch Protocol</h2>
                                <p className="text-zinc-500 font-medium max-w-sm mx-auto">Everything looks solid. Review your details and hit publish to go live!</p>
                            </div>

                            <div className="max-w-md mx-auto bg-zinc-900/40 border border-white/5 p-8 rounded-[2.5rem] mt-10 space-y-4">
                                <div className="flex items-center justify-between pb-4 border-b border-white/5">
                                    <span className="text-zinc-500 font-bold uppercase tracking-widest text-[10px]">Title</span>
                                    <span className="text-white font-black truncate max-w-[200px]">{formData.title}</span>
                                </div>
                                <div className="flex items-center justify-between pb-4 border-b border-white/5">
                                    <span className="text-zinc-500 font-bold uppercase tracking-widest text-[10px]">Price</span>
                                    <span className="text-white font-black">{formData.pricingType === 'free' ? 'FREE' : `₹${formData.basePrice || 0}`}</span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-zinc-500 font-bold uppercase tracking-widest text-[10px]">Assets</span>
                                    <span className="text-white font-black">{formData.files.length} uploaded</span>
                                </div>
                            </div>
                        </motion.div>
                    )}

                </AnimatePresence>
            </div>

            {/* Navigation Buttons */}
            <div className="mt-16 flex items-center justify-between">
                {step > 1 ? (
                    <button
                        onClick={prevStep}
                        className="flex items-center gap-2 text-zinc-500 hover:text-white font-bold uppercase tracking-widest text-xs transition-all"
                    >
                        <ChevronLeft className="w-4 h-4" />
                        Back
                    </button>
                ) : (
                    <div />
                )}

                <button
                    onClick={step === STEPS.length ? handleSubmit : nextStep}
                    disabled={!isStepValid() || loading}
                    className={`flex items-center gap-3 px-10 py-4 rounded-2xl font-black text-sm uppercase tracking-[0.2em] transition-all ${!isStepValid() || loading
                        ? 'bg-zinc-800 text-zinc-600 cursor-not-allowed'
                        : 'bg-white text-black hover:bg-zinc-200 shadow-2xl shadow-white/5 group'
                        }`}
                >
                    {loading ? (
                        <div className="w-5 h-5 border-2 border-black border-t-transparent rounded-full animate-spin" />
                    ) : (
                        <>
                            {step === STEPS.length ? 'Launch Product' : 'Next Step'}
                            <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                        </>
                    )}
                </button>
            </div>
        </div>
    );
}
