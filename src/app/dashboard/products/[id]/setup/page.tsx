'use client';

import React, { useState, useEffect } from "react";
import {
    ChevronLeft, Save, Globe, Lock,
    FileText, Video, Play, Plus,
    Trash2, GripVertical, Settings,
    DollarSign, Package, Layout,
    Zap, Check, AlertCircle, Upload,
    ExternalLink, BookOpen, Clock, Shield, Download
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";

// Helper for S3 Upload
async function uploadToS3(file: File, folder: string = 'products') {
    const res = await fetch(`/api/creator/upload/presigned?filename=${encodeURIComponent(file.name)}&fileType=${encodeURIComponent(file.type)}&folder=${folder}`);
    const { uploadUrl, key } = await res.json();

    await fetch(uploadUrl, {
        method: 'PUT',
        body: file,
        headers: { 'Content-Type': file.type }
    });

    return { key, name: file.name, size: file.size, type: file.type };
}

type Tab = 'general' | 'pricing' | 'content' | 'curriculum' | 'settings';

export default function ProductSetupPage() {
    const { id } = useParams();
    const router = useRouter();
    const [activeTab, setActiveTab] = useState<Tab>('general');
    const [product, setProduct] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [lastSaved, setLastSaved] = useState<Date | null>(null);

    useEffect(() => {
        const fetchProduct = async () => {
            try {
                const res = await fetch(`/api/creator/products/${id}`);
                const data = await res.json();
                setProduct(data.product);
            } catch (error) {
                console.error("Failed to fetch product:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchProduct();
    }, [id]);

    const handleSave = async (updatedData?: any) => {
        setSaving(true);
        try {
            const dataToSave = updatedData || product;
            const res = await fetch(`/api/creator/products/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(dataToSave)
            });
            if (res.ok) {
                setLastSaved(new Date());
            }
        } catch (error) {
            console.error("Failed to save product:", error);
        } finally {
            setSaving(false);
        }
    };

    if (loading) return (
        <div className="min-h-[60vh] flex items-center justify-center">
            <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
        </div>
    );

    const isCourse = product.productType === 'course';

    return (
        <div className="space-y-8 pb-24">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="flex items-center gap-4">
                    <Link
                        href="/dashboard/products"
                        className="p-3 rounded-2xl bg-zinc-900/50 border border-white/5 text-zinc-500 hover:text-white transition-all"
                    >
                        <ChevronLeft className="w-5 h-5" />
                    </Link>
                    <div>
                        <div className="flex items-center gap-2 mb-1">
                            <span className="text-[10px] font-black uppercase tracking-widest text-indigo-500">{product.productType}</span>
                            <span className="text-zinc-700 font-bold">•</span>
                            <span className="text-[10px] font-black uppercase tracking-widest text-zinc-500">{product.status}</span>
                        </div>
                        <h1 className="text-3xl font-black text-white tracking-tightest leading-tight">{product.title}</h1>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    {lastSaved && (
                        <span className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest mr-4">
                            Last saved: {lastSaved.toLocaleTimeString()}
                        </span>
                    )}
                    <button
                        onClick={() => handleSave()}
                        disabled={saving}
                        className="flex items-center gap-2 bg-indigo-500 text-white px-6 py-3 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-indigo-600 transition-all shadow-xl shadow-indigo-500/20 disabled:opacity-50"
                    >
                        {saving ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <Save className="w-4 h-4" />}
                        {saving ? 'Saving...' : 'Save Changes'}
                    </button>
                    <Link
                        href={`/dashboard/products/${id}/preview`}
                        className="p-3 rounded-2xl bg-white/5 border border-white/5 text-white hover:bg-white/10 transition-all"
                    >
                        <ExternalLink className="w-5 h-5" />
                    </Link>
                </div>
            </div>

            {/* Navigation Tabs */}
            <div className="flex items-center gap-2 p-1.5 bg-zinc-900/50 border border-white/5 rounded-2xl overflow-x-auto scrollbar-hide">
                {[
                    { id: 'general', label: 'General', icon: InfoIcon },
                    { id: 'pricing', label: 'Pricing', icon: DollarSign },
                    { id: 'content', label: 'Content', icon: FileText },
                    ...(isCourse ? [{ id: 'curriculum', label: 'Curriculum', icon: BookOpen }] : []),
                    { id: 'settings', label: 'Settings', icon: Settings }
                ].map((tab) => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id as Tab)}
                        className={`flex items-center gap-2 px-6 py-2.5 rounded-[14px] text-xs font-black uppercase tracking-widest transition-all whitespace-nowrap ${activeTab === tab.id ? 'bg-white text-black shadow-lg' : 'text-zinc-500 hover:text-white'}`}
                    >
                        <tab.icon className="w-4 h-4" />
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* Content Area */}
            <div className="min-h-[500px]">
                <AnimatePresence mode="wait">
                    {activeTab === 'general' && (
                        <TabGeneral key="general" product={product} setProduct={setProduct} />
                    )}
                    {activeTab === 'pricing' && (
                        <TabPricing key="pricing" product={product} setProduct={setProduct} />
                    )}
                    {activeTab === 'content' && (
                        <TabContent key="content" product={product} setProduct={setProduct} handleSave={handleSave} />
                    )}
                    {activeTab === 'curriculum' && isCourse && (
                        <TabCurriculum key="curriculum" product={product} setProduct={setProduct} handleSave={handleSave} />
                    )}
                    {activeTab === 'settings' && (
                        <TabSettings key="settings" product={product} setProduct={setProduct} />
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
}

// --- Sub-components (Tabs) ---

function TabGeneral({ product, setProduct, handleSave }: any) {
    const [uploading, setUploading] = useState(false);

    const handleThumbnailUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setUploading(true);
        try {
            const { key } = await uploadToS3(file, 'thumbnails');
            const updatedProduct = { ...product, thumbnailKey: key };
            setProduct(updatedProduct);
            await handleSave(updatedProduct);
        } catch (error) {
            console.error("Thumbnail upload failed:", error);
        } finally {
            setUploading(false);
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="grid grid-cols-1 lg:grid-cols-3 gap-8"
        >
            <div className="lg:col-span-2 space-y-6">
                <div className="bg-zinc-900/40 border border-white/5 p-8 rounded-[2.5rem] space-y-6">
                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-zinc-600 uppercase tracking-widest ml-2">Product Title</label>
                        <input
                            type="text"
                            value={product.title}
                            onChange={(e) => setProduct({ ...product, title: e.target.value })}
                            className="w-full bg-black/40 border border-white/5 rounded-2xl py-4 px-6 text-white font-bold focus:outline-none focus:border-indigo-500/30 transition-all shadow-inner"
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-zinc-600 uppercase tracking-widest ml-2">Tagline</label>
                        <input
                            type="text"
                            value={product.tagline}
                            onChange={(e) => setProduct({ ...product, tagline: e.target.value })}
                            placeholder="A short punchy line about your product..."
                            className="w-full bg-black/40 border border-white/5 rounded-2xl py-4 px-6 text-white font-medium focus:outline-none focus:border-indigo-500/30 transition-all"
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-zinc-600 uppercase tracking-widest ml-2">Description</label>
                        <textarea
                            rows={8}
                            value={product.description}
                            onChange={(e) => setProduct({ ...product, description: e.target.value })}
                            className="w-full bg-black/40 border border-white/5 rounded-2xl py-4 px-6 text-white font-medium focus:outline-none focus:border-indigo-500/30 transition-all resize-none"
                        />
                    </div>
                </div>
            </div>

            <div className="space-y-6">
                <div className="bg-zinc-900/40 border border-white/5 p-8 rounded-[2.5rem] space-y-6">
                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-zinc-600 uppercase tracking-widest ml-2">Product Thumbnail</label>
                        <label className="aspect-square bg-black/60 rounded-3xl border-2 border-dashed border-white/5 flex flex-col items-center justify-center p-8 group hover:border-indigo-500/30 transition-all cursor-pointer relative overflow-hidden">
                            {product.thumbnailKey ? (
                                <img src={`/api/files/${product.thumbnailKey}`} className="absolute inset-0 w-full h-full object-cover" />
                            ) : (
                                <>
                                    <ImageIcon className="w-10 h-10 text-zinc-800 mb-4 group-hover:scale-110 transition-transform" />
                                    <span className="text-[10px] font-black text-zinc-600 uppercase tracking-widest">{uploading ? 'Uploading...' : 'Upload Image'}</span>
                                </>
                            )}
                            <input type="file" className="hidden" onChange={handleThumbnailUpload} disabled={uploading} />
                        </label>
                        <p className="text-[10px] text-zinc-700 text-center font-bold px-4">Recommended: 1200x1200px (JPG, PNG)</p>
                    </div>

                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-zinc-600 uppercase tracking-widest ml-2">Category</label>
                        <select
                            value={product.category}
                            onChange={(e) => setProduct({ ...product, category: e.target.value })}
                            className="w-full bg-black/40 border border-white/5 rounded-2xl py-4 px-6 text-white font-bold focus:outline-none appearance-none"
                        >
                            <option value="business">Business</option>
                            <option value="design">Design</option>
                            <option value="development">Development</option>
                            <option value="marketing">Marketing</option>
                            <option value="productivity">Productivity</option>
                        </select>
                    </div>
                </div>
            </div>
        </motion.div>
    );
}

function TabPricing({ product, setProduct }: any) {
    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            className="max-w-3xl mx-auto space-y-8"
        >
            <div className="grid grid-cols-2 gap-4">
                {['fixed', 'pwyw', 'free'].map(type => (
                    <button
                        key={type}
                        onClick={() => setProduct({ ...product, pricingType: type })}
                        className={`p-8 rounded-[2.5rem] border-2 text-left transition-all ${product.pricingType === type ? 'bg-indigo-500/10 border-indigo-500/50 shadow-2xl shadow-indigo-500/5' : 'bg-zinc-900/40 border-white/5 hover:border-white/10'}`}
                    >
                        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-4 ${product.pricingType === type ? 'bg-indigo-500 text-white' : 'bg-zinc-800 text-zinc-500'}`}>
                            {type === 'fixed' ? <DollarSign className="w-6 h-6" /> : type === 'pwyw' ? <Zap className="w-6 h-6" /> : <GiftIcon className="w-6 h-6" />}
                        </div>
                        <h3 className="text-xl font-black text-white italic uppercase">{type === 'pwyw' ? 'Pay What You Want' : type}</h3>
                        <p className="text-xs text-zinc-500 font-medium mt-1">Set a {type === 'fixed' ? 'strict' : type === 'pwyw' ? 'flexible' : 'zero'} price point.</p>
                    </button>
                ))}
            </div>

            {product.pricingType !== 'free' && (
                <div className="bg-zinc-900/40 border border-white/5 p-10 rounded-[3.5rem] space-y-8">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-zinc-600 uppercase tracking-widest ml-2 italic">Standard Price (INR)</label>
                            <div className="relative group">
                                <span className="absolute left-6 top-1/2 -translate-y-1/2 text-2xl font-black text-zinc-700 group-focus-within:text-white transition-colors">₹</span>
                                <input
                                    type="number"
                                    value={product.price}
                                    onChange={(e) => setProduct({ ...product, price: Number(e.target.value) })}
                                    className="w-full bg-black/60 border border-white/5 rounded-3xl py-6 pl-12 pr-6 text-4xl font-black text-white focus:outline-none focus:border-indigo-500/40 transition-all tracking-tighter"
                                />
                            </div>
                        </div>

                        {product.pricingType === 'fixed' && (
                            <div className="space-y-2 opacity-50">
                                <label className="text-[10px] font-black text-zinc-600 uppercase tracking-widest ml-2 italic">Compare at Price (Optional)</label>
                                <div className="relative group">
                                    <span className="absolute left-6 top-1/2 -translate-y-1/2 text-2xl font-black text-zinc-800 group-focus-within:text-zinc-400 transition-colors">₹</span>
                                    <input
                                        type="number"
                                        value={product.compareAtPrice}
                                        onChange={(e) => setProduct({ ...product, compareAtPrice: Number(e.target.value) })}
                                        className="w-full bg-black/60 border border-white/5 rounded-3xl py-6 pl-12 pr-6 text-4xl font-black text-zinc-700 line-through focus:outline-none focus:border-indigo-500/20 transition-all tracking-tighter"
                                    />
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </motion.div>
    );
}

function TabContent({ product, setProduct, handleSave }: any) {
    const isEbook = product.productType === 'ebook';
    const [uploading, setUploading] = useState(false);

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setUploading(true);
        try {
            const fileData = await uploadToS3(file);
            const updatedFiles = [...(product.files || []), { ...fileData, order: (product.files?.length || 0) }];
            const updatedProduct = { ...product, files: updatedFiles };
            setProduct(updatedProduct);
            await handleSave(updatedProduct);
        } catch (error) {
            console.error("Upload failed:", error);
        } finally {
            setUploading(false);
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-4xl mx-auto space-y-8"
        >
            <div className="bg-zinc-900/40 border border-white/5 p-10 rounded-[3.5rem] space-y-10">
                <div className="flex items-center justify-between">
                    <div>
                        <h2 className="text-2xl font-black text-white italic uppercase tracking-tightest">Deliverable Files</h2>
                        <p className="text-sm text-zinc-500 font-medium font-sans">Add the files that customers will receive after purchase.</p>
                    </div>
                    <label className="flex items-center gap-2 bg-white text-black px-6 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-zinc-200 transition-all cursor-pointer">
                        <Plus className="w-4 h-4" />
                        {uploading ? 'Uploading...' : 'Add File'}
                        <input type="file" className="hidden" onChange={handleFileUpload} disabled={uploading} />
                    </label>
                </div>

                <div className="space-y-4">
                    {product.files?.length > 0 ? (
                        product.files.map((file: any, i: number) => (
                            <div key={file.key} className="flex items-center gap-4 p-5 bg-black/40 rounded-[2rem] border border-white/5 group hover:border-indigo-500/20 transition-all">
                                <div className="w-12 h-12 rounded-xl bg-indigo-500/10 flex items-center justify-center text-indigo-400">
                                    <FileText className="w-6 h-6" />
                                </div>
                                <div className="flex-1">
                                    <h4 className="text-white font-bold">{file.name}</h4>
                                    <p className="text-[10px] text-zinc-600 font-black uppercase tracking-widest">{(file.size / (1024 * 1024)).toFixed(2)} MB • {file.type}</p>
                                </div>
                                <button
                                    onClick={async () => {
                                        const updatedFiles = product.files.filter((f: any) => f.key !== file.key);
                                        const updatedProduct = { ...product, files: updatedFiles };
                                        setProduct(updatedProduct);
                                        await handleSave(updatedProduct);
                                    }}
                                    className="p-3 text-zinc-700 hover:text-red-500 transition-colors"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </button>
                                <div className="p-3 text-zinc-800 cursor-grab active:cursor-grabbing">
                                    <GripVertical className="w-5 h-5" />
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="py-16 flex flex-col items-center justify-center bg-black/20 border-2 border-dashed border-white/5 rounded-[3rem]">
                            <Upload className="w-12 h-12 text-zinc-800 mb-4" />
                            <p className="text-zinc-600 font-bold uppercase tracking-widest text-[10px]">No files uploaded yet</p>
                        </div>
                    )}
                </div>
            </div>

            {isEbook && (
                <div className="bg-indigo-500/5 border border-indigo-500/20 p-8 rounded-[3rem] flex items-start gap-6">
                    <div className="w-14 h-14 rounded-2xl bg-indigo-500/10 flex items-center justify-center shrink-0">
                        <Shield className="w-7 h-7 text-indigo-400" />
                    </div>
                    <div className="space-y-2">
                        <h3 className="text-lg font-black text-white italic uppercase tracking-tighter">Pro: PDF Protection</h3>
                        <p className="text-sm text-zinc-400 font-medium leading-relaxed">Dynamic watermarking is currently active. We will stamp the buyer's email address on the footer of every page of your PDF deliverables to prevent unauthorized sharing.</p>
                    </div>
                </div>
            )}
        </motion.div>
    );
}

function TabCurriculum({ product, setProduct, handleSave }: any) {
    const [sections, setSections] = useState(product.sections || []);

    const addSection = async () => {
        const newSections = [...sections, { title: 'New Module', order: sections.length, lessons: [] }];
        setSections(newSections);
        const updatedProduct = { ...product, sections: newSections };
        setProduct(updatedProduct);
        await handleSave(updatedProduct);
    };

    const addLesson = async (sIdx: number) => {
        const newSections = [...sections];
        newSections[sIdx].lessons.push({
            title: 'New Lesson',
            type: 'video',
            order: newSections[sIdx].lessons.length
        });
        setSections(newSections);
        const updatedProduct = { ...product, sections: newSections };
        setProduct(updatedProduct);
        await handleSave(updatedProduct);
    };

    const deleteSection = async (sIdx: number) => {
        const newSections = sections.filter((_: any, i: number) => i !== sIdx);
        setSections(newSections);
        const updatedProduct = { ...product, sections: newSections };
        setProduct(updatedProduct);
        await handleSave(updatedProduct);
    };

    const deleteLesson = async (sIdx: number, lIdx: number) => {
        const newSections = [...sections];
        newSections[sIdx].lessons = newSections[sIdx].lessons.filter((_: any, i: number) => i !== lIdx);
        setSections(newSections);
        const updatedProduct = { ...product, sections: newSections };
        setProduct(updatedProduct);
        await handleSave(updatedProduct);
    };

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            className="max-w-4xl mx-auto space-y-6"
        >
            <div className="flex items-center justify-between mb-4">
                <div>
                    <h2 className="text-2xl font-black text-white italic uppercase tracking-tightest">Course Curriculum</h2>
                    <p className="text-sm text-zinc-500 font-medium">Build your course modules and lessons.</p>
                </div>
                <button
                    onClick={addSection}
                    className="flex items-center gap-2 bg-indigo-500 text-white px-6 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-indigo-600 shadow-xl shadow-indigo-500/20 transition-all"
                >
                    <Plus className="w-4 h-4" />
                    Add Module
                </button>
            </div>

            <div className="space-y-4">
                {sections.map((section: any, sIdx: number) => (
                    <div key={sIdx} className="bg-zinc-900/40 border border-white/5 rounded-[2.5rem] overflow-hidden">
                        <div className="p-6 bg-white/[0.02] border-b border-white/5 flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <GripVertical className="w-5 h-5 text-zinc-800" />
                                <input
                                    className="bg-transparent text-lg font-black text-white focus:outline-none uppercase italic tracking-tighter"
                                    value={section.title}
                                    onChange={async (e) => {
                                        const n = [...sections];
                                        n[sIdx].title = e.target.value;
                                        setSections(n);
                                        setProduct({ ...product, sections: n });
                                    }}
                                    onBlur={() => handleSave()}
                                />
                            </div>
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => addLesson(sIdx)}
                                    className="p-2 text-zinc-600 hover:text-white transition-colors"
                                >
                                    <Plus className="w-4 h-4" />
                                </button>
                                <button
                                    onClick={() => deleteSection(sIdx)}
                                    className="p-2 text-zinc-600 hover:text-red-500 transition-colors"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                        <div className="p-4 space-y-2">
                            {section.lessons?.map((lesson: any, lIdx: number) => (
                                <div key={lIdx} className="flex items-center gap-4 p-4 bg-black/40 rounded-2xl border border-white/5 group hover:border-white/10 transition-all">
                                    <div className="w-10 h-10 rounded-xl bg-zinc-900 flex items-center justify-center text-zinc-600">
                                        {lesson.type === 'video' ? <Play className="w-4 h-4" /> : <FileText className="w-4 h-4" />}
                                    </div>
                                    <input
                                        className="bg-transparent text-sm font-bold text-zinc-400 flex-1 focus:outline-none"
                                        value={lesson.title}
                                        onChange={(e) => {
                                            const n = [...sections];
                                            n[sIdx].lessons[lIdx].title = e.target.value;
                                            setSections(n);
                                            setProduct({ ...product, sections: n });
                                        }}
                                        onBlur={() => handleSave()}
                                    />
                                    <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button className="p-2 text-zinc-700 hover:text-white transition-colors"><Settings className="w-4 h-4" /></button>
                                        <button
                                            onClick={() => deleteLesson(sIdx, lIdx)}
                                            className="p-2 text-zinc-700 hover:text-red-500 transition-colors"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                            ))}
                            {section.lessons?.length === 0 && (
                                <div className="py-8 text-center bg-black/10 border border-dashed border-white/5 rounded-2xl">
                                    <p className="text-[10px] font-black uppercase tracking-widest text-zinc-700">No lessons in this module</p>
                                </div>
                            )}
                        </div>
                    </div>
                ))}
            </div>
        </motion.div>
    );
}

function TabSettings({ product, setProduct }: any) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-3xl mx-auto space-y-8"
        >
            <div className="bg-zinc-900/40 border border-white/5 p-10 rounded-[3.5rem] space-y-10">
                <div className="space-y-6">
                    <h2 className="text-2xl font-black text-white italic uppercase tracking-tightest">Post-Purchase Flow</h2>

                    <div className="space-y-4">
                        <div className="flex items-center justify-between p-6 bg-black/40 rounded-[2rem] border border-white/5">
                            <div className="flex items-center gap-5">
                                <div className="w-12 h-12 rounded-xl bg-purple-500/10 flex items-center justify-center">
                                    <Clock className="w-6 h-6 text-purple-400" />
                                </div>
                                <div>
                                    <h4 className="text-white font-bold">Access Expiry</h4>
                                    <p className="text-xs text-zinc-500 font-medium font-sans">Revoke customer access after set number of days.</p>
                                </div>
                            </div>
                            <input
                                type="number"
                                placeholder="Forever"
                                className="w-24 bg-zinc-900 border border-white/10 rounded-xl py-3 px-4 text-center font-black text-white focus:outline-none"
                            />
                        </div>

                        <div className="flex items-center justify-between p-6 bg-black/40 rounded-[2rem] border border-white/5">
                            <div className="flex items-center gap-5">
                                <div className="w-12 h-12 rounded-xl bg-orange-500/10 flex items-center justify-center">
                                    <Download className="w-6 h-6 text-orange-400" />
                                </div>
                                <div>
                                    <h4 className="text-white font-bold">Download Limit</h4>
                                    <p className="text-xs text-zinc-500 font-medium font-sans">Max number of times files can be downloaded.</p>
                                </div>
                            </div>
                            <input
                                type="number"
                                placeholder="Unlimited"
                                className="w-24 bg-zinc-900 border border-white/10 rounded-xl py-3 px-4 text-center font-black text-white focus:outline-none"
                            />
                        </div>
                    </div>
                </div>

                <div className="space-y-6">
                    <h2 className="text-2xl font-black text-white italic uppercase tracking-tightest">Danger Zone</h2>
                    <div className="p-8 border-2 border-red-500/10 bg-red-500/[0.02] rounded-[2.5rem] flex items-center justify-between">
                        <div>
                            <h4 className="text-white font-black uppercase text-sm italic">Archive Product</h4>
                            <p className="text-xs text-zinc-500 font-medium mt-1">This will hide the product from your store.</p>
                        </div>
                        <button className="bg-red-500/10 text-red-500 border border-red-500/20 px-6 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-red-500 hover:text-white transition-all">
                            Archive
                        </button>
                    </div>
                </div>
            </div>
        </motion.div>
    );
}

// Custom icons
function InfoIcon(props: any) {
    return <Layout {...props} />
}

function GiftIcon(props: any) {
    return <Package {...props} />
}

function ImageIcon(props: any) {
    return <Layout {...props} />
}
