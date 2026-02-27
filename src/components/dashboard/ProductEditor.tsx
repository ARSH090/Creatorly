'use client';

import React, { useState, useEffect } from 'react';
import {
    ChevronRight, ChevronLeft, Package, FileText,
    Youtube, Users, Calendar, Banknote, Sparkles,
    Image as ImageIcon, Upload, Check, Zap, Info, Plus, Trash2, Settings, Loader2, Play
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import AntiGravityUpload from '@/components/dashboard/AntiGravityUpload';

interface Lesson {
    id: string;
    title: string;
    duration: string;
}

interface Module {
    id: string;
    title: string;
    lessons: Lesson[];
}

export interface ProductFormData {
    _id?: string;
    type: 'digital' | 'course' | 'membership' | 'physical' | 'coaching';
    name: string;
    description: string;
    price: string;
    currency: string;
    isFeatured: boolean;
    isPublic: boolean;
    isFeaturedInCollections: boolean;
    files: any[];
    image: string;
    curriculum: Module[];

    // Variants
    hasVariants: boolean;
    variants: Array<{
        id: string;
        title: string;
        price: string;
        stock?: number;
        isActive: boolean;
    }>;
}

const STEPS = [
    { id: 'type', title: 'Product Type', icon: Package },
    { id: 'info', title: 'Basic Info', icon: FileText },
    { id: 'pricing', title: 'Pricing & Access', icon: Banknote },
    { id: 'content', title: 'Content & Delivery', icon: Upload },
    { id: 'review', title: 'Review & Publish', icon: Sparkles },
];

const PRODUCT_TYPES: { id: ProductFormData['type']; name: string; desc: string; icon: any; color: string }[] = [
    {
        id: 'digital',
        name: 'Digital Download',
        desc: 'Ebooks, templates, presets, or any file.',
        icon: FileText,
        color: 'indigo'
    },
    {
        id: 'course',
        name: 'Online Course',
        desc: 'Structured video lessons and modules.',
        icon: Youtube,
        color: 'purple'
    },
    {
        id: 'membership',
        name: 'Membership',
        desc: 'Recurring access to exclusive content.',
        icon: Users,
        color: 'pink'
    },
    {
        id: 'coaching',
        name: 'Coaching/Service',
        desc: 'One-on-one sessions or custom services.',
        icon: Calendar,
        color: 'orange'
    },
];

export default function ProductEditor({ initialData }: { initialData?: ProductFormData }) {
    const [currentStep, setCurrentStep] = useState(initialData ? 1 : 0); // Skip type selection if editing
    const [isPublishing, setIsPublishing] = useState(false);
    const { user } = useAuth();
    const router = useRouter();

    const [formData, setFormData] = useState<ProductFormData>(initialData || {
        type: 'digital',
        name: '',
        description: '',
        price: '',
        currency: 'INR',
        isFeatured: false,
        isPublic: true,
        isFeaturedInCollections: false,
        files: [],
        image: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=1000&auto=format&fit=crop',
        curriculum: [
            {
                id: 'mod-1',
                title: 'Introduction to the Course',
                lessons: [
                    { id: 'les-1', title: 'Welcome to the Community', duration: '02:45' }
                ]
            }
        ],
        hasVariants: false,
        variants: []
    });

    const [productId, setProductId] = useState<string | null>(initialData?._id || null);
    const [lastSaved, setLastSaved] = useState<Date | null>(null);

    const handleNext = () => {
        if (currentStep < STEPS.length - 1) setCurrentStep(c => c + 1);
    };

    const handleBack = () => {
        if (currentStep > 0) setCurrentStep(c => c - 1);
    };

    // Auto-save logic
    useEffect(() => {
        if (currentStep === 0 && !productId) return;

        const saveTimeout = setTimeout(async () => {
            if (!user) return;

            try {
                const payload = {
                    ...formData,
                    productType: formData.type === 'digital' ? 'digital_download' : (formData.type === 'coaching' ? 'service' : formData.type),
                    price: Number(formData.price) || 0,
                    isActive: productId ? formData.isPublic : false // Draft logic
                };

                if (productId) {
                    await fetch(`/api/products/${productId}`, {
                        method: 'PATCH',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(payload)
                    });
                } else {
                    const res = await fetch('/api/products', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(payload)
                    });
                    if (res.ok) {
                        const data = await res.json();
                        setProductId(data.productId);
                    }
                }
                setLastSaved(new Date());
            } catch (err) {
                console.error('Auto-save failed:', err);
            }
        }, 3000); // 3 seconds for smoother save

        return () => clearTimeout(saveTimeout);
    }, [formData, user, productId, currentStep]);

    const handleTypeSelect = (type: ProductFormData['type']) => {
        setFormData({ ...formData, type });
        handleNext();
    };

    const handlePublish = async () => {
        // Frontend Publish Validation
        if (!formData.name.trim()) {
            alert('Product name is required.');
            return;
        }
        if (Number(formData.price) < 0 || isNaN(Number(formData.price))) {
            alert('Valid price is required (can be 0 for free).');
            return;
        }
        if (formData.type === 'digital' && formData.files.length === 0) {
            alert('At least one file is required for digital products.');
            return;
        }

        try {
            setIsPublishing(true);
            const url = productId ? `/api/products/${productId}` : '/api/products';
            const method = productId ? 'PATCH' : 'POST';

            await fetch(url, {
                method: method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ...formData,
                    productType: formData.type === 'digital' ? 'digital_download' : (formData.type === 'coaching' ? 'service' : formData.type),
                    price: Number(formData.price),
                    isActive: true
                }),
            });

            router.push('/dashboard/projects');
            router.refresh();
        } catch (error) {
            console.error('Publish Error:', error);
            alert('Publish failed.');
        } finally {
            setIsPublishing(false);
        }
    };

    const addVariant = () => {
        setFormData({
            ...formData,
            hasVariants: true,
            variants: [
                ...formData.variants,
                {
                    id: Math.random().toString(36).substr(2, 9),
                    title: 'New Variant',
                    price: formData.price,
                    isActive: true
                }
            ]
        });
    };

    const removeVariant = (idx: number) => {
        const newVariants = [...formData.variants];
        newVariants.splice(idx, 1);
        setFormData({
            ...formData,
            variants: newVariants,
            hasVariants: newVariants.length > 0
        });
    };

    const updateVariant = (idx: number, field: string, value: any) => {
        const newVariants = [...formData.variants];
        (newVariants[idx] as any)[field] = value;
        setFormData({ ...formData, variants: newVariants });
    };

    return (
        <div className="min-h-screen bg-[#030303] text-white p-8">
            <div className="max-w-4xl mx-auto space-y-12">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-black tracking-tight">{initialData ? 'Edit Product' : 'Create New Product'}</h1>
                        <p className="text-zinc-500 font-medium mt-1">Transform your knowledge into a digital asset.</p>
                    </div>
                    <button onClick={() => router.back()} className="p-3 bg-white/5 rounded-2xl hover:bg-white/10 transition-colors">
                        <ChevronLeft className="w-6 h-6" />
                    </button>
                </div>

                {/* Progress Bar */}
                <div className="flex items-center justify-between px-4">
                    {STEPS.map((step, idx) => (
                        <div key={step.id} className="flex items-center flex-1 last:flex-none">
                            <div className="flex flex-col items-center gap-3">
                                <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${idx <= currentStep ? 'bg-indigo-500 text-white shadow-lg shadow-indigo-500/20' : 'bg-white/5 text-zinc-500'}`}>
                                    <step.icon className="w-5 h-5" />
                                </div>
                                <span className={`text-[10px] font-black uppercase tracking-widest hidden md:block ${idx <= currentStep ? 'text-white' : 'text-zinc-500'}`}>{step.title}</span>
                            </div>
                            {idx < STEPS.length - 1 && <div className={`h-px flex-1 mx-4 ${idx < currentStep ? 'bg-indigo-500' : 'bg-white/5'}`} />}
                        </div>
                    ))}
                </div>

                {/* Step Content */}
                <div className="bg-[#0A0A0A] border border-white/5 rounded-[2.5rem] p-12 min-h-[500px] flex flex-col relative overflow-hidden">
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={currentStep}
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            className="flex-1 flex flex-col"
                        >
                            {currentStep === 0 && (
                                <div className="space-y-8 flex-1">
                                    <div className="text-center space-y-2">
                                        <h2 className="text-2xl font-bold">What are you creating?</h2>
                                        <p className="text-zinc-500">Pick the best format for your content.</p>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        {PRODUCT_TYPES.map((type) => (
                                            <button
                                                key={type.id}
                                                onClick={() => handleTypeSelect(type.id)}
                                                className={`p-6 rounded-[2rem] border transition-all text-left flex gap-6 hover:scale-[1.02] ${formData.type === type.id ? 'border-indigo-500 bg-indigo-500/10' : 'border-white/5 bg-white/[0.02] hover:bg-white/[0.04]'}`}
                                            >
                                                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center bg-${type.color}-500/20 text-${type.color}-400`}><type.icon className="w-7 h-7" /></div>
                                                <div className="flex-1"><h3 className="font-bold text-lg">{type.name}</h3><p className="text-sm text-zinc-500 font-medium mt-1">{type.desc}</p></div>
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {currentStep === 1 && (
                                <div className="space-y-8 flex-1">
                                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                                        <div className="space-y-6">
                                            <div className="space-y-2"><label className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Product Name</label><input type="text" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} className="w-full bg-white/5 border border-white/5 rounded-2xl px-6 py-4 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all font-bold" /></div>
                                            <div className="space-y-2"><label className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Description</label><textarea rows={6} value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} className="w-full bg-white/5 border border-white/5 rounded-2xl px-6 py-4 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all font-medium resize-none" /></div>
                                        </div>
                                        <div className="space-y-6">
                                            <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Cover Image</label>
                                            <AntiGravityUpload
                                                type="products/covers"
                                                onUploadComplete={(url) => setFormData({ ...formData, image: url })}
                                                onUploadError={(err) => console.error('Upload failed', err)}
                                            />
                                        </div>
                                    </div>
                                </div>
                            )}

                            {currentStep === 2 && (
                                <div className="max-w-md mx-auto w-full space-y-12 py-8 flex-1">
                                    <div className="text-center space-y-2"><h2 className="text-2xl font-bold">Set Your Value</h2></div>
                                    <div className="space-y-8">
                                        <div className="bg-white/5 rounded-[2.5rem] p-8 border border-white/5 flex items-center gap-6">
                                            <div className="w-16 h-16 bg-indigo-500 rounded-2xl flex items-center justify-center text-2xl font-black">₹</div>
                                            <div className="flex-1"><label className="text-[10px] font-black uppercase tracking-widest text-zinc-500 mb-2 block">Price (INR)</label><input type="number" value={formData.price} onChange={(e) => setFormData({ ...formData, price: e.target.value })} className="bg-transparent border-none p-0 text-4xl font-black focus:ring-0 w-full" /></div>
                                        </div>

                                        {/* Variants Config */}
                                        <div className="space-y-4">
                                            <div className="flex items-center justify-between">
                                                <h3 className="font-bold text-sm">Product Variants</h3>
                                                <button onClick={addVariant} className="text-[10px] font-black uppercase tracking-widest text-indigo-400 border border-indigo-400/20 px-3 py-1 rounded-lg hover:bg-indigo-400/10">+ Add Variant</button>
                                            </div>
                                            {formData.variants.length > 0 ? (
                                                <div className="space-y-3">
                                                    {formData.variants.map((v, idx) => (
                                                        <div key={v.id} className="bg-white/5 p-4 rounded-xl flex gap-3 items-center">
                                                            <input type="text" value={v.title} onChange={(e) => updateVariant(idx, 'title', e.target.value)} className="bg-transparent border-b border-white/10 w-full text-sm font-medium focus:border-indigo-500 outline-none pb-1" placeholder="Variant Name (e.g. XL)" />
                                                            <input type="number" value={v.price} onChange={(e) => updateVariant(idx, 'price', e.target.value)} className="bg-transparent border-b border-white/10 w-20 text-sm font-medium focus:border-indigo-500 outline-none pb-1" placeholder="Price" />
                                                            <button onClick={() => removeVariant(idx)} className="text-zinc-500 hover:text-rose-500"><Trash2 size={14} /></button>
                                                        </div>
                                                    ))}
                                                </div>
                                            ) : (
                                                <p className="text-xs text-zinc-600 italic">No variants active. Default price applies.</p>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            )}

                            {currentStep === 3 && (formData.type === 'course' ? (
                                <div className="space-y-6">
                                    <h3 className="font-bold text-lg">Curriculum Builder</h3>
                                    {/* Simplified for brevity - reuse module logic */}
                                    {formData.curriculum.map((module, mIdx) => (
                                        <div key={module.id} className="bg-white/5 rounded-3xl p-6 border border-white/5 space-y-4">
                                            <input type="text" value={module.title} onChange={(e) => {
                                                const newCurriculum = [...formData.curriculum];
                                                newCurriculum[mIdx].title = e.target.value;
                                                setFormData({ ...formData, curriculum: newCurriculum });
                                            }} className="bg-transparent text-lg font-bold w-full" />
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="space-y-6">
                                    <AntiGravityUpload
                                        type={`products/${formData.type}`}
                                        onUploadComplete={(url, key, meta) => setFormData(p => ({ ...p, files: [...p.files, { name: meta.name, url, size: meta.size }] }))}
                                        onUploadError={(err) => console.error('Upload failed', err)}
                                    />
                                    {formData.files.map((f, i) => (
                                        <div key={i} className="flex items-center justify-between bg-white/5 p-3 rounded-xl">
                                            <div className="flex items-center gap-3">
                                                <FileText size={16} />
                                                <span className="text-sm">{f.name}</span>
                                            </div>
                                            <button
                                                onClick={() => setFormData(p => ({ ...p, files: p.files.filter((_, idx) => idx !== i) }))}
                                                className="text-zinc-500 hover:text-rose-500 transition-colors p-2"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            ))}

                            {currentStep === 4 && (
                                <div className="space-y-8">
                                    <h2 className="text-2xl font-bold">Review & Publish</h2>
                                    <button onClick={handlePublish} disabled={isPublishing} className="w-full bg-indigo-500 py-4 rounded-xl font-black uppercase tracking-widest">{isPublishing ? 'Publishing...' : 'Publish Product'}</button>
                                </div>
                            )}

                            {/* Nav */}
                            {currentStep < STEPS.length - 1 && (
                                <div className="mt-8 flex justify-between">
                                    {currentStep > 0 && <button onClick={handleBack} className="px-6 py-3 bg-white/5 rounded-xl text-xs font-bold uppercase">Back</button>}
                                    <button onClick={handleNext} className="px-6 py-3 bg-white text-black rounded-xl text-xs font-bold uppercase ml-auto">Next Step</button>
                                </div>
                            )}
                        </motion.div>
                    </AnimatePresence>
                </div>
            </div>
        </div>
    );
}

