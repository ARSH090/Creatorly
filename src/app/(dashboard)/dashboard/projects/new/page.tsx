'use client';

import React, { useState } from 'react';
import {
    ChevronRight, ChevronLeft, Package, FileText,
    Youtube, Users, Calendar, Banknote, Sparkles,
    Image as ImageIcon, Upload, Check, Zap, Info, Plus, Trash2, Settings, Loader2, Play
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';

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

interface ProductFormData {
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

export default function NewProductWizard() {
    const [currentStep, setCurrentStep] = useState(0);
    const [isPublishing, setIsPublishing] = useState(false);
    const { user } = useAuth();
    const [formData, setFormData] = useState<ProductFormData>({
        type: 'digital',
        name: '',
        description: '',
        price: '',
        currency: 'INR',
        isFeatured: false,
        isPublic: true,
        isFeaturedInCollections: false,
        files: [],
        image: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=1000&auto=format&fit=crop', // Default mock image
        curriculum: [
            {
                id: 'mod-1',
                title: 'Introduction to the Course',
                lessons: [
                    { id: 'les-1', title: 'Welcome to the Community', duration: '02:45' }
                ]
            }
        ],
    });
    const router = useRouter();

    const handleNext = () => {
        if (currentStep < STEPS.length - 1) setCurrentStep(c => c + 1);
    };

    const handleBack = () => {
        if (currentStep > 0) setCurrentStep(c => c - 1);
    };

    const handleTypeSelect = (type: ProductFormData['type']) => {
        setFormData({ ...formData, type });
        handleNext();
    };

    const handlePublish = async () => {
        try {
            setIsPublishing(true);
            const response = await fetch('/api/products', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ...formData,
                    price: Number(formData.price),
                    creatorId: user?.uid || 'mock-id'
                }),
            });

            if (!response.ok) throw new Error('Failed to publish product');

            // Redirect to projects list on success
            router.push('/dashboard/projects');
            router.refresh();
        } catch (error) {
            console.error('Publish Error:', error);
            alert('Something went wrong. Please try again.');
        } finally {
            setIsPublishing(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#030303] text-white p-8">
            <div className="max-w-4xl mx-auto space-y-12">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-black tracking-tight">Create New Product</h1>
                        <p className="text-zinc-500 font-medium mt-1">Transform your knowledge into a digital asset.</p>
                    </div>
                    <button
                        onClick={() => router.back()}
                        className="p-3 bg-white/5 rounded-2xl hover:bg-white/10 transition-colors"
                    >
                        <ChevronLeft className="w-6 h-6" />
                    </button>
                </div>

                {/* Progress Bar */}
                <div className="flex items-center justify-between px-4">
                    {STEPS.map((step, idx) => (
                        <div key={step.id} className="flex items-center flex-1 last:flex-none">
                            <div className="flex flex-col items-center gap-3">
                                <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${idx <= currentStep ? 'bg-indigo-500 text-white shadow-lg shadow-indigo-500/20' : 'bg-white/5 text-zinc-500'
                                    }`}>
                                    <step.icon className="w-5 h-5" />
                                </div>
                                <span className={`text-[10px] font-black uppercase tracking-widest hidden md:block ${idx <= currentStep ? 'text-white' : 'text-zinc-500'
                                    }`}>
                                    {step.title}
                                </span>
                            </div>
                            {idx < STEPS.length - 1 && (
                                <div className={`h-px flex-1 mx-4 ${idx < currentStep ? 'bg-indigo-500' : 'bg-white/5'}`} />
                            )}
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
                            transition={{ duration: 0.3 }}
                            className="flex-1 flex flex-col"
                        >
                            {/* Step 1: Type Selection */}
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
                                                className={`p-6 rounded-[2rem] border transition-all text-left flex gap-6 hover:scale-[1.02] ${formData.type === type.id
                                                    ? 'border-indigo-500 bg-indigo-500/10'
                                                    : 'border-white/5 bg-white/[0.02] hover:bg-white/[0.04]'
                                                    }`}
                                            >
                                                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center bg-${type.color}-500/20 text-${type.color}-400`}>
                                                    <type.icon className="w-7 h-7" />
                                                </div>
                                                <div className="flex-1">
                                                    <h3 className="font-bold text-lg">{type.name}</h3>
                                                    <p className="text-sm text-zinc-500 font-medium mt-1">{type.desc}</p>
                                                </div>
                                                {formData.type === type.id && (
                                                    <div className="bg-indigo-500 p-1.5 rounded-lg shadow-lg">
                                                        <Check className="w-3 h-3 text-white" />
                                                    </div>
                                                )}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Step 2: Info */}
                            {currentStep === 1 && (
                                <div className="space-y-8 flex-1">
                                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                                        <div className="space-y-6">
                                            <div className="space-y-2">
                                                <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Product Name</label>
                                                <input
                                                    type="text"
                                                    placeholder="e.g. Master the Creator Economy"
                                                    value={formData.name}
                                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                                    className="w-full bg-white/5 border border-white/5 rounded-2xl px-6 py-4 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all font-bold"
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Description</label>
                                                <textarea
                                                    rows={6}
                                                    placeholder="Describe what makes your product unique..."
                                                    value={formData.description}
                                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                                    className="w-full bg-white/5 border border-white/5 rounded-2xl px-6 py-4 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all font-medium resize-none"
                                                />
                                            </div>
                                        </div>

                                        <div className="space-y-6">
                                            <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Cover Image</label>
                                            <div className="aspect-[4/3] bg-white/5 rounded-[2rem] border border-dashed border-white/10 flex flex-col items-center justify-center p-8 text-center group cursor-pointer hover:border-indigo-500/50 transition-colors">
                                                <div className="w-16 h-16 bg-white/5 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                                                    <ImageIcon className="w-8 h-8 text-zinc-500 group-hover:text-indigo-400" />
                                                </div>
                                                <p className="font-bold text-sm">Upload Cover Image</p>
                                                <p className="text-[10px] text-zinc-500 uppercase tracking-widest mt-2">JPG, PNG or WEBP (Max 5MB)</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Step 3: Pricing */}
                            {currentStep === 2 && (
                                <div className="max-w-md mx-auto w-full space-y-12 py-8 flex-1">
                                    <div className="text-center space-y-2">
                                        <h2 className="text-2xl font-bold">Set Your Value</h2>
                                        <p className="text-zinc-500">Transparent pricing builds trust.</p>
                                    </div>

                                    <div className="space-y-8">
                                        <div className="bg-white/5 rounded-[2.5rem] p-8 border border-white/5 flex items-center gap-6">
                                            <div className="w-16 h-16 bg-indigo-500 rounded-2xl flex items-center justify-center text-2xl font-black">₹</div>
                                            <div className="flex-1">
                                                <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500 mb-2 block">Price (INR)</label>
                                                <input
                                                    type="number"
                                                    placeholder="0.00"
                                                    value={formData.price}
                                                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                                                    className="bg-transparent border-none p-0 text-4xl font-black focus:ring-0 w-full placeholder:text-zinc-800"
                                                />
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-3 gap-4">
                                            {['INR', 'USD', 'EUR'].map(curr => (
                                                <button
                                                    key={curr}
                                                    onClick={() => setFormData({ ...formData, currency: curr })}
                                                    className={`py-4 rounded-2xl font-black text-xs transition-all ${formData.currency === curr ? 'bg-white text-black' : 'bg-white/5 text-zinc-500 border border-white/5'
                                                        }`}
                                                >
                                                    {curr}
                                                </button>
                                            ))}
                                        </div>

                                        <div className="bg-emerald-500/5 border border-emerald-500/10 rounded-2xl p-6 flex items-start gap-4">
                                            <Zap className="w-5 h-5 text-emerald-400 mt-1" />
                                            <div>
                                                <p className="font-bold text-sm text-emerald-400">Smart Pricing Tip</p>
                                                <p className="text-xs text-emerald-400/70 font-medium mt-1">Products priced between ₹499 - ₹1,999 see 40% higher conversion rates on Creatorly.</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Step 4: Content & Delivery */}
                            {currentStep === 3 && (
                                <div className="space-y-8 flex-1">
                                    <div className="text-center space-y-2">
                                        <h2 className="text-2xl font-bold">Add Your Value</h2>
                                        <p className="text-zinc-500">Deliver your content exactly how you want it.</p>
                                    </div>

                                    {formData.type === 'digital' ? (
                                        <div className="max-w-2xl mx-auto w-full space-y-6">
                                            <div className="aspect-video bg-white/5 rounded-[2.5rem] border border-dashed border-white/10 flex flex-col items-center justify-center p-8 text-center group cursor-pointer hover:border-indigo-500/50 transition-colors">
                                                <div className="w-20 h-20 bg-indigo-500/10 rounded-3xl flex items-center justify-center mb-6">
                                                    <Upload className="w-10 h-10 text-indigo-400" />
                                                </div>
                                                <h3 className="text-xl font-bold">Upload Digital Asset</h3>
                                                <p className="text-zinc-500 font-medium mt-2 max-w-xs mx-auto">
                                                    Drag and drop your ZIP, PDF, or Video file here. (Max 2GB)
                                                </p>
                                                <button className="mt-8 bg-white/10 px-8 py-3 rounded-2xl font-black uppercase tracking-widest text-[10px] hover:bg-white/20 transition-all">
                                                    Browse Files
                                                </button>
                                            </div>

                                            <div className="bg-white/[0.02] rounded-2xl p-6 flex items-center justify-between border border-white/5">
                                                <div className="flex items-center gap-4">
                                                    <div className="w-10 h-10 bg-indigo-500/20 rounded-xl flex items-center justify-center">
                                                        <Info className="w-5 h-5 text-indigo-400" />
                                                    </div>
                                                    <div>
                                                        <p className="font-bold text-sm">Download Limits</p>
                                                        <p className="text-xs text-zinc-500">Customers get 3 download attempts by default.</p>
                                                    </div>
                                                </div>
                                                <button className="text-xs font-black uppercase tracking-widest text-indigo-400">Change</button>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="space-y-6">
                                            <div className="flex items-center justify-between mb-2">
                                                <h3 className="font-bold text-lg">Curriculum Builder</h3>
                                                <button className="bg-indigo-500 px-6 py-2 rounded-xl font-black uppercase tracking-widest text-[10px] flex items-center gap-2">
                                                    <Plus className="w-3 h-3" />
                                                    Add Module
                                                </button>
                                            </div>

                                            {formData.curriculum.map((module, mIdx) => (
                                                <div key={module.id} className="bg-white/5 rounded-3xl p-6 border border-white/5 space-y-4">
                                                    <div className="flex items-center justify-between">
                                                        <div className="flex items-center gap-4">
                                                            <div className="w-8 h-8 bg-zinc-800 rounded-lg flex items-center justify-center text-xs font-black">{String(mIdx + 1).padStart(2, '0')}</div>
                                                            <input
                                                                type="text"
                                                                placeholder="Module Title"
                                                                className="bg-transparent border-none p-0 font-bold focus:ring-0 text-lg w-full"
                                                                value={module.title}
                                                                onChange={(e) => {
                                                                    const newCurriculum = [...formData.curriculum];
                                                                    newCurriculum[mIdx].title = e.target.value;
                                                                    setFormData({ ...formData, curriculum: newCurriculum });
                                                                }}
                                                            />
                                                        </div>
                                                        <button className="p-2 hover:bg-white/5 rounded-lg text-zinc-500"><Trash2 className="w-4 h-4" /></button>
                                                    </div>
                                                    <div className="pl-12 space-y-3">
                                                        {module.lessons.map((lesson) => (
                                                            <div key={lesson.id} className="bg-white/5 rounded-2xl p-4 flex items-center justify-between border border-white/5">
                                                                <div className="flex items-center gap-4">
                                                                    <Play className="w-4 h-4 text-zinc-500" />
                                                                    <span className="text-sm font-medium">{lesson.title}</span>
                                                                </div>
                                                                <div className="flex items-center gap-3">
                                                                    <span className="text-[10px] font-black uppercase tracking-widest text-zinc-600">{lesson.duration}</span>
                                                                    <button className="p-1.5 hover:bg-white/5 rounded-md text-zinc-500"><Settings className="w-3 h-3" /></button>
                                                                </div>
                                                            </div>
                                                        ))}
                                                        <button className="w-full py-3 rounded-2xl border border-dashed border-white/10 text-zinc-500 text-[10px] font-black uppercase tracking-widest hover:border-white/20 transition-all">
                                                            + Add Lesson
                                                        </button>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Step 5: Review */}
                            {currentStep === 4 && (
                                <div className="space-y-12 flex-1">
                                    <div className="text-center space-y-2">
                                        <h2 className="text-2xl font-bold text-emerald-400">Ready to Launch!</h2>
                                        <p className="text-zinc-500">Review your product details before going live.</p>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                                        <div className="space-y-8">
                                            <div className="bg-white/5 rounded-3xl p-8 border border-white/5 space-y-6">
                                                <div className="flex items-center gap-4">
                                                    <div className="w-16 h-16 bg-white/5 rounded-2xl flex items-center justify-center">
                                                        <Package className="w-8 h-8 text-indigo-400" />
                                                    </div>
                                                    <div>
                                                        <p className="text-[10px] font-black uppercase tracking-widest text-zinc-500">{formData.type}</p>
                                                        <h3 className="text-xl font-bold">{formData.name || 'Unnamed Product'}</h3>
                                                    </div>
                                                </div>
                                                <p className="text-zinc-500 text-sm font-medium leading-relaxed line-clamp-3">
                                                    {formData.description || 'No description provided.'}
                                                </p>
                                                <div className="pt-6 border-t border-white/5 flex items-center justify-between">
                                                    <p className="text-2xl font-black text-indigo-400">₹{formData.price || '0.00'}</p>
                                                    <div className="flex items-center gap-2 bg-emerald-500/10 text-emerald-400 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest">
                                                        <Check className="w-3 h-3" />
                                                        Verified
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="space-y-6">
                                            <div className="bg-indigo-500/5 rounded-3xl p-8 border border-indigo-500/10">
                                                <h4 className="font-black text-xs uppercase tracking-widest text-indigo-400 mb-6">Publication Settings</h4>
                                                <div className="space-y-4">
                                                    <label className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/5 cursor-pointer hover:bg-white/10 transition-colors">
                                                        <div className="flex items-center gap-3">
                                                            <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-lg shadow-emerald-500/50" />
                                                            <span className="text-sm font-bold">Public Storefront</span>
                                                        </div>
                                                        <input
                                                            type="checkbox"
                                                            className="w-5 h-5 rounded-lg border-white/10 bg-black text-indigo-500"
                                                            checked={formData.isPublic}
                                                            onChange={(e) => setFormData({ ...formData, isPublic: e.target.checked })}
                                                        />
                                                    </label>
                                                    <label className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/5 cursor-pointer hover:bg-white/10 transition-colors opacity-50">
                                                        <div className="flex items-center gap-3">
                                                            <div className="w-2 h-2 rounded-full bg-zinc-700" />
                                                            <span className="text-sm font-bold">Featured in Collections</span>
                                                        </div>
                                                        <input
                                                            type="checkbox"
                                                            className="w-5 h-5 rounded-lg border-white/10 bg-black"
                                                            disabled
                                                            checked={formData.isFeaturedInCollections}
                                                            onChange={(e) => setFormData({ ...formData, isFeaturedInCollections: e.target.checked })}
                                                        />
                                                    </label>
                                                </div>
                                            </div>

                                            <button
                                                onClick={handlePublish}
                                                disabled={isPublishing}
                                                className="w-full bg-indigo-500 text-white py-6 rounded-[2rem] font-black uppercase tracking-widest text-sm flex items-center justify-center gap-4 hover:bg-indigo-600 transition-all shadow-2xl shadow-indigo-500/20 disabled:opacity-50"
                                            >
                                                {isPublishing ? (
                                                    <Loader2 className="w-6 h-6 animate-spin" />
                                                ) : (
                                                    <Sparkles className="w-6 h-6" />
                                                )}
                                                {isPublishing ? 'Publishing...' : 'Publish Product'}
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Navigation Buttons for Step 1-4 */}
                            {currentStep > 0 && currentStep < STEPS.length - 1 && (
                                <div className="mt-12 flex items-center justify-between pt-12 border-t border-white/5">
                                    <button
                                        onClick={handleBack}
                                        className="flex items-center gap-2 px-8 py-4 rounded-2xl font-black uppercase tracking-widest text-xs text-zinc-500 hover:text-white transition-all"
                                    >
                                        <ChevronLeft className="w-4 h-4" />
                                        Back
                                    </button>
                                    <button
                                        onClick={handleNext}
                                        className="bg-white text-black px-12 py-4 rounded-2xl font-black uppercase tracking-widest text-xs flex items-center gap-3 hover:bg-zinc-200 transition-all shadow-xl shadow-white/5"
                                    >
                                        Next Step
                                        <ChevronRight className="w-4 h-4" />
                                    </button>
                                </div>
                            )}

                            {/* Sidebar / Bottom Navigation for Step 0 */}
                            {currentStep === 0 && (
                                <div className="mt-12 flex items-center justify-center">
                                    <p className="text-[10px] font-black text-zinc-600 uppercase tracking-widest">Select an option to continue</p>
                                </div>
                            )}
                        </motion.div>
                    </AnimatePresence>
                </div>
            </div>
        </div>
    );
}
