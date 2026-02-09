'use client';

import React, { useState, useEffect } from 'react';
import {
    Play, CheckCircle, ChevronLeft, ChevronRight,
    Menu, X, FileText, Video, Lock, BookOpen, Clock, Loader2
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { IProduct, IModule, ILesson } from '@/lib/models/Product';

export default function CoursePlayer({ params }: { params: { username: string, slug: string } }) {
    const { data: session, status: authStatus } = useSession();
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [product, setProduct] = useState<IProduct | null>(null);
    const [activeLesson, setActiveLesson] = useState<ILesson | null>(null);
    const [completedLessons, setCompletedLessons] = useState<string[]>([]);
    const [sidebarOpen, setSidebarOpen] = useState(true);

    useEffect(() => {
        async function fetchCourse() {
            try {
                // In a real scenario, we'd have an API to fetch course content + access check
                const response = await fetch(`/api/courses/${params.slug}`);
                if (!response.ok) {
                    if (response.status === 403) router.push(`/u/${params.username}`);
                    throw new Error('Failed to fetch course');
                }
                const data = await response.json();
                setProduct(data.product);
                setCompletedLessons(data.progress?.completedLessons || []);

                // Set first lesson as active
                if (data.product.curriculum?.[0]?.lessons?.[0]) {
                    setActiveLesson(data.product.curriculum[0].lessons[0]);
                }
            } catch (error) {
                console.error('Course Fetch Error:', error);
            } finally {
                setLoading(false);
            }
        }

        if (authStatus === 'authenticated') fetchCourse();
        else if (authStatus === 'unauthenticated') router.push(`/u/${params.username}`);
    }, [params.slug, authStatus]);

    const handleLessonComplete = async (lessonId: string) => {
        if (completedLessons.includes(lessonId)) return;

        try {
            const newCompleted = [...completedLessons, lessonId];
            setCompletedLessons(newCompleted);

            await fetch(`/api/courses/${params.slug}/progress`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ lessonId })
            });
        } catch (error) {
            console.error('Progress Update Error:', error);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-[#030303] flex items-center justify-center">
                <Loader2 className="w-10 h-10 text-indigo-500 animate-spin" />
            </div>
        );
    }

    if (!product) return null;

    return (
        <div className="flex h-screen bg-[#030303] text-white overflow-hidden">
            {/* Sidebar */}
            <AnimatePresence>
                {sidebarOpen && (
                    <motion.aside
                        initial={{ x: -320 }}
                        animate={{ x: 0 }}
                        exit={{ x: -320 }}
                        className="w-80 bg-[#0A0A0A] border-r border-white/5 flex flex-col z-40 fixed inset-y-0 lg:relative"
                    >
                        <div className="p-6 border-b border-white/5 flex items-center justify-between">
                            <h2 className="font-black text-sm uppercase tracking-widest text-zinc-500">Curriculum</h2>
                            <button onClick={() => setSidebarOpen(false)} className="lg:hidden p-2 hover:bg-white/5 rounded-lg transition-colors">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="flex-1 overflow-y-auto px-4 py-6 space-y-8">
                            {product.curriculum?.map((module, mIdx) => (
                                <div key={module.id} className="space-y-3">
                                    <h3 className="text-xs font-bold text-zinc-400 px-2 uppercase tracking-tight flex items-center gap-2">
                                        <span className="w-5 h-5 rounded-md bg-white/5 flex items-center justify-center text-[10px]">{mIdx + 1}</span>
                                        {module.title}
                                    </h3>
                                    <div className="space-y-1">
                                        {module.lessons.map((lesson) => (
                                            <button
                                                key={lesson.id}
                                                onClick={() => setActiveLesson(lesson)}
                                                className={`w-full p-4 rounded-2xl flex items-center gap-4 transition-all group ${activeLesson?.id === lesson.id ? 'bg-indigo-500/10 border border-indigo-500/30' : 'hover:bg-white/5'
                                                    }`}
                                            >
                                                <div className={`w-8 h-8 rounded-xl flex items-center justify-center transition-colors ${completedLessons.includes(lesson.id) ? 'bg-emerald-500/20 text-emerald-400' : 'bg-zinc-800 text-zinc-500 group-hover:bg-zinc-700'
                                                    }`}>
                                                    {completedLessons.includes(lesson.id) ? <CheckCircle className="w-4 h-4" /> : (lesson.type === 'video' ? <Play className="w-4 h-4" /> : <FileText className="w-4 h-4" />)}
                                                </div>
                                                <div className="flex-1 text-left">
                                                    <p className={`text-sm font-bold truncate ${activeLesson?.id === lesson.id ? 'text-indigo-400' : 'text-zinc-300'}`}>
                                                        {lesson.title}
                                                    </p>
                                                    <span className="text-[10px] text-zinc-500 flex items-center gap-1 font-medium">
                                                        <Clock className="w-3 h-3" /> {lesson.duration || '5:00'}
                                                    </span>
                                                </div>
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </motion.aside>
                )}
            </AnimatePresence>

            {/* Main Player Area */}
            <main className="flex-1 flex flex-col relative overflow-hidden">
                {/* Header */}
                <div className="h-20 border-b border-white/5 bg-[#030303]/80 backdrop-blur-xl flex items-center justify-between px-8 absolute top-0 w-full z-30">
                    <div className="flex items-center gap-6">
                        {!sidebarOpen && (
                            <button onClick={() => setSidebarOpen(true)} className="p-2 hover:bg-white/5 rounded-xl transition-colors">
                                <Menu className="w-6 h-6" />
                            </button>
                        )}
                        <div className="space-y-1">
                            <h1 className="font-black text-sm uppercase tracking-widest text-zinc-500">{product.name}</h1>
                            <p className="text-xl font-bold line-clamp-1">{activeLesson?.title}</p>
                        </div>
                    </div>
                    <button
                        onClick={() => router.push(`/u/${params.username}`)}
                        className="bg-white/5 px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-white/10 transition-all border border-white/5"
                    >
                        Back to Store
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto pt-20 px-8 lg:px-20 pb-20">
                    <div className="max-w-5xl mx-auto py-12 space-y-12">
                        {/* Video / Content Embed */}
                        {activeLesson?.type === 'video' ? (
                            <div className="aspect-video bg-zinc-900 rounded-[3rem] border border-white/5 overflow-hidden shadow-2xl relative group">
                                <div className="absolute inset-0 flex items-center justify-center">
                                    <div className="w-20 h-20 rounded-full bg-indigo-500 flex items-center justify-center shadow-2xl group-hover:scale-110 transition-transform cursor-pointer">
                                        <Play className="w-8 h-8 fill-white" />
                                    </div>
                                </div>
                                {/* In real app: <iframe src={activeLesson.content} ... /> */}
                            </div>
                        ) : (
                            <div className="bg-[#0A0A0A] border border-white/5 rounded-[3rem] p-12 shadow-2xl min-h-[500px]">
                                <h2 className="text-3xl font-black mb-8">{activeLesson?.title}</h2>
                                <div className="prose prose-invert max-w-none text-zinc-400 leading-relaxed font-medium">
                                    {/* Markdown Content Renderer */}
                                    {activeLesson?.content || 'Learning content goes here...'}
                                </div>
                            </div>
                        )}

                        {/* Lesson Controls */}
                        <div className="flex flex-col md:flex-row items-center justify-between gap-8 pt-12 border-t border-white/5">
                            <div className="flex gap-4">
                                <button className="p-4 bg-white/5 hover:bg-white/10 rounded-2xl transition-all border border-white/5 text-zinc-400 hover:text-white flex items-center gap-2 font-bold text-sm">
                                    <ChevronLeft className="w-5 h-5" />
                                    Previous Lesson
                                </button>
                                <button className="p-4 bg-white/5 hover:bg-white/10 rounded-2xl transition-all border border-white/5 text-zinc-400 hover:text-white flex items-center gap-2 font-bold text-sm">
                                    Next Lesson
                                    <ChevronRight className="w-5 h-5" />
                                </button>
                            </div>

                            {!completedLessons.includes(activeLesson?.id || '') ? (
                                <button
                                    onClick={() => handleLessonComplete(activeLesson?.id || '')}
                                    className="bg-emerald-500 hover:bg-emerald-600 text-white font-black py-4 px-10 rounded-2xl transition-all shadow-xl shadow-emerald-500/20 text-sm uppercase tracking-widest flex items-center gap-3"
                                >
                                    <CheckCircle className="w-5 h-5" />
                                    Mark as Complete
                                </button>
                            ) : (
                                <div className="flex items-center gap-3 text-emerald-400 font-black uppercase tracking-widest text-xs px-10 py-4 bg-emerald-500/10 rounded-2xl border border-emerald-500/20">
                                    <CheckCircle className="w-5 h-5" />
                                    Lesson Completed
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}
