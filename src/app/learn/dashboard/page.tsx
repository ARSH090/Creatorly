'use client';

/* eslint-disable react-hooks/exhaustive-deps, react/no-unescaped-entities, @next/next/no-img-element, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars, prefer-const, import/no-anonymous-default-export */

import React, { useState, useEffect } from "react";
import {
    Play, Clock, CheckCircle2,
    ArrowRight, Search, LayoutGrid,
    List, BookOpen, Download,
    Trophy, Zap, Star
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";

export default function StudentDashboard() {
    const [purchases, setPurchases] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [view, setView] = useState<'grid' | 'list'>('grid');

    useEffect(() => {
        const fetchPurchases = async () => {
            try {
                const res = await fetch('/api/student/purchases');
                const data = await res.json();
                setPurchases(data.purchases || []);
            } catch (error) {
                console.error("Failed to fetch purchases:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchPurchases();
    }, []);

    const courses = purchases.filter(p => p.type === 'course');
    const resources = purchases.filter(p => p.type !== 'course');

    if (loading) return (
        <div className="min-h-screen bg-[#030303] flex items-center justify-center">
            <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
        </div>
    );

    return (
        <div className="min-h-screen bg-[#030303] text-zinc-400 font-sans selection:bg-indigo-500/30 overflow-x-hidden pt-20 pb-40">
            {/* Ambient Background */}
            <div className="fixed inset-0 pointer-events-none z-0">
                <div className="absolute top-0 right-0 w-[50%] h-[50%] bg-indigo-500/5 rounded-full blur-[120px]" />
                <div className="absolute bottom-0 left-0 w-[50%] h-[50%] bg-purple-500/5 rounded-full blur-[120px]" />
            </div>

            <main className="relative z-10 max-w-7xl mx-auto px-6">
                {/* Header */}
                <header className="flex flex-col md:flex-row md:items-end justify-between gap-8 mb-16">
                    <div className="space-y-4">
                        <div className="inline-flex items-center gap-2 px-3 py-1 bg-indigo-500/10 border border-indigo-500/20 rounded-full text-indigo-400">
                            <Zap className="w-3.5 h-3.5 fill-indigo-400/20" />
                            <span className="text-[10px] font-black uppercase tracking-widest">Student Portal</span>
                        </div>
                        <h1 className="text-5xl lg:text-7xl font-black text-white tracking-tightest leading-none uppercase italic">Your Library</h1>
                        <p className="text-xl text-zinc-500 font-medium">Continue where you left off. Your masterclass journey starts here.</p>
                    </div>

                    <div className="flex items-center gap-4 bg-zinc-900/40 p-2 rounded-2xl border border-white/5">
                        <button
                            onClick={() => setView('grid')}
                            className={`p-3 rounded-xl transition-all ${view === 'grid' ? 'bg-white/10 text-white' : 'text-zinc-600 hover:text-white'}`}
                        >
                            <LayoutGrid className="w-5 h-5" />
                        </button>
                        <button
                            onClick={() => setView('list')}
                            className={`p-3 rounded-xl transition-all ${view === 'list' ? 'bg-white/10 text-white' : 'text-zinc-600 hover:text-white'}`}
                        >
                            <List className="w-5 h-5" />
                        </button>
                    </div>
                </header>

                {/* Stats Bar */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-20">
                    {[
                        { icon: BookOpen, label: "Total Courses", value: courses.length, color: "indigo" },
                        { icon: Trophy, label: "Certificates", value: courses.filter(c => c.progress?.isCompleted).length, color: "emerald" },
                        { icon: Star, label: "Resources", value: resources.length, color: "amber" }
                    ].map((stat) => (
                        <div key={stat.label} className="p-8 bg-zinc-900/20 border border-white/5 rounded-[2.5rem] flex items-center gap-6 group hover:border-white/10 transition-all">
                            <div className={`w-14 h-14 rounded-2xl bg-${stat.color}-500/10 flex items-center justify-center`}>
                                <stat.icon className={`w-6 h-6 text-${stat.color}-400`} />
                            </div>
                            <div>
                                <p className="text-[10px] font-black text-zinc-600 uppercase tracking-widest">{stat.label}</p>
                                <h3 className="text-3xl font-black text-white mt-1">{stat.value}</h3>
                            </div>
                        </div>
                    ))}
                </div>

                {/* In Progress Courses */}
                {courses.length > 0 && (
                    <section className="space-y-8 mb-20">
                        <h2 className="text-2xl font-black text-white italic uppercase tracking-tighter">Continued Learning</h2>
                        <div className={`grid ${view === 'grid' ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3' : 'grid-cols-1'} gap-8`}>
                            {courses.map((course) => (
                                <Link
                                    key={course.id}
                                    href={`/learn/course/${course.id}`}
                                    className="group"
                                >
                                    <div className="bg-zinc-900/40 border border-white/5 rounded-[3rem] overflow-hidden hover:border-indigo-500/20 transition-all">
                                        <div className="aspect-video relative overflow-hidden">
                                            <img
                                                src={course.thumbnail ? `https://${process.env.NEXT_PUBLIC_S3_BUCKET}.s3.amazonaws.com/${course.thumbnail}` : '/placeholder-course.jpg'}
                                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                                                alt={course.title}
                                            />
                                            <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                                <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center text-black">
                                                    <Play className="w-6 h-6 fill-black ml-1" />
                                                </div>
                                            </div>
                                            {/* Progress Bar Overlay */}
                                            <div className="absolute bottom-0 left-0 right-0 h-1.5 bg-white/10">
                                                <motion.div
                                                    initial={{ width: 0 }}
                                                    animate={{ width: `${course.progress?.percent || 0}%` }}
                                                    className="h-full bg-indigo-500"
                                                />
                                            </div>
                                        </div>
                                        <div className="p-8 space-y-4">
                                            <div className="flex justify-between items-start">
                                                <h3 className="text-xl font-bold text-white group-hover:text-indigo-400 transition-colors">{course.title}</h3>
                                                <span className="text-[10px] font-black text-zinc-600 uppercase tracking-widest">{course.progress?.percent || 0}%</span>
                                            </div>
                                            <div className="flex items-center gap-4 text-xs font-medium text-zinc-500">
                                                <span className="flex items-center gap-1.5">
                                                    <Clock className="w-3.5 h-3.5" />
                                                    {course.preview?.[0] || 'Getting Started'}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    </section>
                )}

                {/* Digital Downloads */}
                {resources.length > 0 && (
                    <section className="space-y-8">
                        <h2 className="text-2xl font-black text-white italic uppercase tracking-tighter">Your Assets</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {resources.map((asset) => (
                                <div
                                    key={asset.id}
                                    className="p-6 bg-zinc-900/20 border border-white/5 rounded-3xl flex items-center justify-between group hover:border-white/10 transition-all"
                                >
                                    <div className="flex items-center gap-6">
                                        <div className="w-16 h-16 rounded-2xl bg-zinc-800 flex items-center justify-center text-zinc-600">
                                            <Download className="w-6 h-6" />
                                        </div>
                                        <div>
                                            <h4 className="text-white font-bold">{asset.title}</h4>
                                            <p className="text-[10px] text-zinc-600 font-black uppercase tracking-widest mt-1 italic">{asset.type.replace('_', ' ')}</p>
                                        </div>
                                    </div>
                                    <Link
                                        href={`/order-success/${asset.orderId}`}
                                        className="p-4 bg-white/5 border border-white/5 rounded-2xl text-white hover:bg-white hover:text-black transition-all"
                                    >
                                        <ArrowRight className="w-5 h-5" />
                                    </Link>
                                </div>
                            ))}
                        </div>
                    </section>
                )}

                {purchases.length === 0 && (
                    <div className="py-40 text-center space-y-8">
                        <div className="w-24 h-24 bg-zinc-900/40 rounded-full flex items-center justify-center mx-auto border border-white/5">
                            <BookOpen className="w-10 h-10 text-zinc-700" />
                        </div>
                        <div className="space-y-2">
                            <h3 className="text-2xl font-black text-white italic uppercase">No purchases yet</h3>
                            <p className="text-zinc-500 font-medium">Explore the marketplace and start your creative journey.</p>
                        </div>
                        <Link
                            href="/"
                            className="inline-flex bg-indigo-500 text-white px-10 py-5 rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-indigo-600 transition-all shadow-2xl shadow-indigo-500/20"
                        >
                            Browse Storefront
                        </Link>
                    </div>
                )}
            </main>
        </div>
    );
}
