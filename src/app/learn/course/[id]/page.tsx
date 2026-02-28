'use client';

import React, { useState, useEffect } from "react";
import {
    Play, Clock, CheckCircle2,
    ChevronLeft, ChevronRight,
    Menu, Download, FileText,
    Video, Headphones, Globe,
    ArrowLeft, MoreVertical, X,
    Layout, Check, Circle
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";

export default function CoursePlayerPage() {
    const { id } = useParams();
    const router = useRouter();

    const [course, setCourse] = useState<any>(null);
    const [progress, setProgress] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [currentLesson, setCurrentLesson] = useState<any>(null);
    const [lessonUrl, setLessonUrl] = useState<string | null>(null);
    const [sidebarOpen, setSidebarOpen] = useState(true);

    useEffect(() => {
        const fetchCourse = async () => {
            try {
                const res = await fetch(`/api/student/course/${id}`);
                const data = await res.json();
                if (data.success) {
                    setCourse(data.course);
                    setProgress(data.progress);
                    // Set first lesson as default if none selected
                    if (data.course.sections?.[0]?.lessons?.[0]) {
                        setCurrentLesson(data.course.sections[0].lessons[0]);
                    }
                } else {
                    router.push('/learn/dashboard');
                }
            } catch (error) {
                console.error("Failed to fetch course:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchCourse();
    }, [id, router]);

    // Fetch Lesson URL when current lesson changes
    useEffect(() => {
        if (!currentLesson) return;

        const fetchLessonUrl = async () => {
            setLessonUrl(null);
            try {
                const res = await fetch(`/api/student/course/${id}/lesson/${currentLesson._id}/url`);
                const data = await res.json();
                if (data.success) {
                    setLessonUrl(data.url);
                }
            } catch (error) {
                console.error("Failed to fetch lesson URL:", error);
            }
        };
        fetchLessonUrl();
    }, [currentLesson, id]);

    const toggleLessonCompletion = async (lessonId: string) => {
        const isCompleted = progress.completedLessons.includes(lessonId);
        try {
            const res = await fetch(`/api/student/course/${id}/progress`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ lessonId, completed: !isCompleted })
            });
            const data = await res.json();
            if (data.success) {
                setProgress(data.progress);
            }
        } catch (error) {
            console.error("Failed to toggle completion:", error);
        }
    };

    if (loading) return (
        <div className="min-h-screen bg-[#030303] flex items-center justify-center">
            <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
        </div>
    );

    if (!course) return null;

    const allLessons = course.sections.flatMap((s: any) => s.lessons);
    const currentIndex = allLessons.findIndex((l: any) => l._id === currentLesson?._id);
    const nextLesson = allLessons[currentIndex + 1];
    const prevLesson = allLessons[currentIndex - 1];

    return (
        <div className="h-screen bg-[#030303] flex flex-col font-sans selection:bg-indigo-500/30 overflow-hidden text-zinc-400">
            {/* Header */}
            <header className="h-20 border-b border-white/5 bg-black/50 backdrop-blur-2xl px-6 flex items-center justify-between shrink-0 z-50">
                <div className="flex items-center gap-6">
                    <Link href="/learn/dashboard" className="p-2 hover:bg-white/5 rounded-xl transition-all">
                        <ArrowLeft className="w-5 h-5 text-white" />
                    </Link>
                    <div className="w-px h-6 bg-white/5" />
                    <div className="space-y-0.5">
                        <h1 className="text-white font-black text-sm uppercase tracking-widest">{course.title}</h1>
                        <p className="text-[10px] text-zinc-600 font-bold uppercase tracking-[0.2em]">{currentLesson?.title}</p>
                    </div>
                </div>

                <div className="flex items-center gap-6">
                    <div className="hidden md:flex flex-col items-end gap-1.5">
                        <div className="w-32 h-1 bg-white/5 rounded-full overflow-hidden">
                            <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: `${progress.percentComplete}%` }}
                                className="h-full bg-indigo-500"
                            />
                        </div>
                        <span className="text-[9px] font-black text-zinc-600 uppercase tracking-widest">{progress.percentComplete}% COMPLETE</span>
                    </div>
                    <button
                        onClick={() => setSidebarOpen(!sidebarOpen)}
                        className={`p-3 rounded-xl transition-all ${sidebarOpen ? 'bg-indigo-500/10 text-indigo-400' : 'hover:bg-white/5 text-zinc-500'}`}
                    >
                        <Layout className="w-5 h-5" />
                    </button>
                </div>
            </header>

            {/* Main Layout */}
            <div className="flex flex-1 overflow-hidden">
                {/* Content Area */}
                <main className="flex-1 overflow-y-auto bg-black relative flex flex-col">
                    <div className="flex-1 flex flex-col">
                        {/* Player Container */}
                        <div className="aspect-video bg-zinc-950 relative group">
                            {lessonUrl ? (
                                currentLesson?.type === 'video' ? (
                                    <video
                                        src={lessonUrl}
                                        controls
                                        className="w-full h-full"
                                        onEnded={() => toggleLessonCompletion(currentLesson._id)}
                                    />
                                ) : (
                                    <div className="w-full h-full flex flex-col items-center justify-center space-y-8 bg-zinc-900/20">
                                        <div className="w-24 h-24 bg-white/5 rounded-[2.5rem] flex items-center justify-center border border-white/5">
                                            <FileText className="w-10 h-10 text-zinc-600" />
                                        </div>
                                        <div className="text-center space-y-4">
                                            <h3 className="text-2xl font-black text-white italic uppercase tracking-tighter">Resource Material</h3>
                                            <p className="text-zinc-500 max-w-sm mx-auto">This lesson contains a PDF or text guide. You can access it via the link below.</p>
                                        </div>
                                        <a
                                            href={lessonUrl}
                                            target="_blank"
                                            className="bg-white text-black px-10 py-5 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-zinc-200 transition-all shadow-2xl shadow-white/5"
                                        >
                                            Open Content
                                        </a>
                                    </div>
                                )
                            ) : (
                                <div className="w-full h-full flex items-center justify-center">
                                    <div className="w-10 h-10 border-2 border-zinc-900 border-t-indigo-500 rounded-full animate-spin" />
                                </div>
                            )}
                        </div>

                        {/* Lesson Details */}
                        <div className="p-12 max-w-4xl mx-auto w-full space-y-12">
                            <div className="flex items-start justify-between gap-8">
                                <div className="space-y-4">
                                    <div className="flex items-center gap-3">
                                        <span className="text-[10px] font-black text-indigo-500 uppercase tracking-[0.2em]">{currentLesson?.type}</span>
                                        <div className="w-1.5 h-1.5 rounded-full bg-zinc-800" />
                                        <span className="text-[10px] font-black text-zinc-600 uppercase tracking-[0.2em]">{currentLesson?.duration || 0} mins</span>
                                    </div>
                                    <h2 className="text-5xl font-black text-white italic uppercase tracking-tightest leading-none">{currentLesson?.title}</h2>
                                </div>

                                <button
                                    onClick={() => toggleLessonCompletion(currentLesson._id)}
                                    className={`shrink-0 flex items-center gap-3 px-6 py-4 rounded-2xl border font-black text-[10px] uppercase tracking-widest transition-all ${progress.completedLessons.includes(currentLesson?._id)
                                        ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                                        : 'bg-white/5 border-white/5 text-zinc-500 hover:text-white hover:bg-white/10'
                                        }`}
                                >
                                    {progress.completedLessons.includes(currentLesson?._id) ? (
                                        <>
                                            <Check className="w-4 h-4" />
                                            Completed
                                        </>
                                    ) : (
                                        <>
                                            <Circle className="w-4 h-4" />
                                            Mark as Complete
                                        </>
                                    )}
                                </button>
                            </div>

                            <div className="prose prose-invert max-w-none text-zinc-500 leading-relaxed font-medium text-lg">
                                {currentLesson?.description || "No description provided for this lesson."}
                            </div>
                        </div>
                    </div>

                    {/* Navigation Bar */}
                    <div className="sticky bottom-0 bg-black border-t border-white/5 p-6 flex items-center justify-between shrink-0">
                        <button
                            disabled={!prevLesson}
                            onClick={() => setCurrentLesson(prevLesson)}
                            className="flex items-center gap-3 px-6 py-4 rounded-2xl bg-zinc-900/50 hover:bg-zinc-900 transition-all disabled:opacity-30 disabled:cursor-not-allowed group"
                        >
                            <ChevronLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
                            <span className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Previous</span>
                        </button>

                        <button
                            disabled={!nextLesson}
                            onClick={() => setCurrentLesson(nextLesson)}
                            className="flex items-center gap-3 px-8 py-4 rounded-2xl bg-white text-black hover:bg-zinc-200 transition-all disabled:opacity-30 disabled:cursor-not-allowed group"
                        >
                            <span className="text-[10px] font-black uppercase tracking-widest">Continue</span>
                            <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                        </button>
                    </div>
                </main>

                {/* Curriculum Sidebar */}
                <AnimatePresence>
                    {sidebarOpen && (
                        <motion.aside
                            initial={{ width: 0, opacity: 0 }}
                            animate={{ width: 380, opacity: 1 }}
                            exit={{ width: 0, opacity: 0 }}
                            className="border-l border-white/5 bg-[#050505] flex flex-col shrink-0 overflow-hidden"
                        >
                            <div className="p-8 border-b border-white/5 shrink-0">
                                <h3 className="text-xl font-black text-white italic uppercase tracking-tighter">Curriculum</h3>
                                <p className="text-[9px] font-black text-zinc-600 uppercase tracking-widest mt-1 italic">{allLessons.length} Total Lessons</p>
                            </div>

                            <div className="flex-1 overflow-y-auto">
                                {course.sections.map((section: any, sIdx: number) => (
                                    <div key={sIdx} className="border-b border-white/5 last:border-0">
                                        <div className="px-8 py-5 bg-white/[0.02]">
                                            <h4 className="text-[10px] font-black text-zinc-600 uppercase tracking-widest italic leading-none">{section.title}</h4>
                                        </div>
                                        <div className="py-2">
                                            {section.lessons.map((lesson: any, lIdx: number) => {
                                                const isActive = currentLesson?._id === lesson._id;
                                                const isCompleted = progress.completedLessons.includes(lesson._id);
                                                const isLocked = lesson.isLocked;

                                                return (
                                                    <button
                                                        key={lIdx}
                                                        disabled={isLocked}
                                                        onClick={() => setCurrentLesson(lesson)}
                                                        className={`w-full px-8 py-4 flex items-center gap-4 group transition-all relative ${isActive ? 'bg-indigo-500/5' : 'hover:bg-white/[0.02]'} ${isLocked ? 'opacity-50 cursor-not-allowed' : ''}`}
                                                    >
                                                        {isActive && <div className="absolute left-0 top-0 bottom-0 w-1 bg-indigo-500" />}

                                                        <div className={`shrink-0 w-8 h-8 rounded-lg flex items-center justify-center transition-all ${isCompleted ? 'bg-emerald-500/10 text-emerald-400' : isLocked ? 'bg-zinc-900/50 text-zinc-800' : 'bg-zinc-900 text-zinc-600'
                                                            }`}>
                                                            {isCompleted ? <Check className="w-4 h-4" /> : isLocked ? <X className="w-3 h-3" /> : <Play className="w-3 h-3" />}
                                                        </div>

                                                        <div className="flex-1 text-left space-y-1">
                                                            <p className={`text-xs font-bold transition-colors ${isActive ? 'text-white' : 'text-zinc-500'}`}>{lesson.title}</p>
                                                            <div className="flex items-center gap-2">
                                                                <span className="text-[8px] font-black text-zinc-700 uppercase tracking-widest">{lesson.type}</span>
                                                                <div className="w-1 h-1 rounded-full bg-zinc-900" />
                                                                {isLocked ? (
                                                                    <span className="text-[8px] font-black text-indigo-500/50 uppercase tracking-widest italic">Available {new Date(lesson.availableAt).toLocaleDateString()}</span>
                                                                ) : (
                                                                    <span className="text-[8px] font-black text-zinc-700 uppercase tracking-widest">{lesson.duration || 0}m</span>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </motion.aside>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
}
