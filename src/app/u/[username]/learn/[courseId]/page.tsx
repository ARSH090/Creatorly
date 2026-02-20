'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
    ChevronDown, ChevronRight, CheckCircle2, Circle,
    ArrowLeft, Play, FileText, Award, Loader2, Lock, Star
} from 'lucide-react';
import Link from 'next/link';
import { toast } from 'react-hot-toast';

interface Lesson {
    id: string;
    title: string;
    type: 'video' | 'text' | 'quiz' | 'file';
    content: string;
    duration: string;
    isFreePreview?: boolean;
}

interface Module {
    id: string;
    title: string;
    description?: string;
    lessons: Lesson[];
}

export default function CourseLearnPage() {
    const params = useParams();
    const username = params.username as string;
    const courseId = params.courseId as string;

    const [loading, setLoading] = useState(true);
    const [course, setCourse] = useState<any>(null);
    const [modules, setModules] = useState<Module[]>([]);
    const [completedLessons, setCompletedLessons] = useState<string[]>([]);
    const [activeLesson, setActiveLesson] = useState<Lesson | null>(null);
    const [expanded, setExpanded] = useState<string[]>([]);
    const [marking, setMarking] = useState(false);
    const [certDownloading, setCertDownloading] = useState(false);

    useEffect(() => {
        fetch(`/api/courses/${courseId}`)
            .then(r => r.json())
            .then(data => {
                if (data.product) {
                    setCourse(data.product);
                    const mods: Module[] = data.product.curriculum || [];
                    setModules(mods);
                    setExpanded(mods.map((m: Module) => m.id));
                    // Start on first lesson
                    if (mods.length > 0 && mods[0].lessons.length > 0) {
                        setActiveLesson(mods[0].lessons[0]);
                    }
                }
                if (data.progress) {
                    setCompletedLessons(data.progress.completedLessons || []);
                }
            })
            .catch(console.error)
            .finally(() => setLoading(false));
    }, [courseId]);

    const totalLessons = modules.reduce((acc, m) => acc + m.lessons.length, 0);
    const progressPct = totalLessons > 0 ? Math.round((completedLessons.length / totalLessons) * 100) : 0;
    const isComplete = progressPct === 100;

    const markComplete = async () => {
        if (!activeLesson || completedLessons.includes(activeLesson.id)) return;
        setMarking(true);
        try {
            const res = await fetch(`/api/courses/${courseId}/progress`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ lessonId: activeLesson.id })
            });
            if (res.ok) {
                setCompletedLessons(prev => [...prev, activeLesson.id]);
            }
        } finally {
            setMarking(false);
        }
    };

    const getVideoEmbed = (url: string) => {
        // YouTube
        const ytMatch = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\s]+)/);
        if (ytMatch) {
            return `https://www.youtube.com/embed/${ytMatch[1]}?rel=0&modestbranding=1`;
        }
        // Vimeo
        const vimeoMatch = url.match(/vimeo\.com\/(\d+)/);
        if (vimeoMatch) {
            return `https://player.vimeo.com/video/${vimeoMatch[1]}`;
        }
        return url;
    };

    const downloadCertificate = async () => {
        setCertDownloading(true);
        try {
            const { jsPDF } = await import('jspdf');
            const doc = new jsPDF({
                orientation: 'landscape',
                unit: 'px',
                format: [1200, 800]
            });

            // Background
            doc.setFillColor(10, 10, 10);
            doc.rect(0, 0, 1200, 800, 'F');

            // Border
            doc.setDrawColor(99, 102, 241); // indigo-500
            doc.setLineWidth(8);
            doc.rect(40, 40, 1120, 720, 'S');

            // Title
            doc.setTextColor(99, 102, 241);
            doc.setFont('helvetica', 'bold');
            doc.setFontSize(28);
            doc.text('CERTIFICATE OF COMPLETION', 600, 130, { align: 'center' });

            // Course Name
            doc.setTextColor(255, 255, 255);
            doc.setFontSize(52);
            // Split long course names
            const splitTitle = doc.splitTextToSize(course?.name || 'Course', 1000);
            doc.text(splitTitle, 600, 350, { align: 'center' });

            // Student Name
            doc.setTextColor(161, 161, 170); // zinc-400
            doc.setFont('helvetica', 'normal');
            doc.setFontSize(22);
            doc.text(`Presented to a student of @${username}`, 600, 430, { align: 'center' });

            // Date
            doc.setTextColor(99, 102, 241);
            doc.setFont('helvetica', 'bold');
            doc.setFontSize(18);
            const dateStr = new Date().toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' });
            doc.text(`Completed on ${dateStr}`, 600, 600, { align: 'center' });

            // Footer
            doc.setTextColor(255, 255, 255);
            doc.setFontSize(24);
            doc.text('Creatorly', 600, 700, { align: 'center' });

            doc.save(`certificate-${courseId}.pdf`);
        } catch (err) {
            console.error('Certificate generation failed', err);
            toast.error('Failed to generate certificate');
        } finally {
            setCertDownloading(false);
        }
    };

    const toggleModule = (id: string) => {
        setExpanded(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-[#030303] flex items-center justify-center">
                <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
            </div>
        );
    }

    if (!course) {
        return (
            <div className="min-h-screen bg-[#030303] text-white flex items-center justify-center">
                <div className="text-center space-y-4">
                    <Lock className="w-12 h-12 text-zinc-600 mx-auto" />
                    <h2 className="text-xl font-black">Access Denied</h2>
                    <p className="text-zinc-500 text-sm">You haven't purchased this course.</p>
                    <Link href={`/u/${username}`} className="inline-flex items-center gap-2 text-indigo-400 hover:text-indigo-300 text-sm font-bold">
                        <ArrowLeft className="w-4 h-4" /> View store
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#030303] text-white flex flex-col">
            {/* Top bar */}
            <header className="sticky top-0 z-50 bg-[#030303]/90 backdrop-blur-xl border-b border-white/5 px-4 py-3 flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Link href={`/u/${username}`} className="p-2 rounded-xl hover:bg-white/10 transition-colors">
                        <ArrowLeft className="w-4 h-4 text-zinc-400" />
                    </Link>
                    <div>
                        <h1 className="text-sm font-black uppercase tracking-wide text-white">{course.name}</h1>
                        <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest">@{username}</p>
                    </div>
                </div>

                <div className="flex items-center gap-4">
                    {/* Progress bar */}
                    <div className="hidden sm:flex items-center gap-3">
                        <div className="w-32 h-1.5 rounded-full bg-white/10 overflow-hidden">
                            <div
                                className="h-full bg-indigo-500 rounded-full transition-all duration-500"
                                style={{ width: `${progressPct}%` }}
                            />
                        </div>
                        <span className="text-xs font-black text-zinc-400">{progressPct}%</span>
                    </div>
                    {isComplete && (
                        <button
                            onClick={downloadCertificate}
                            disabled={certDownloading}
                            className="flex items-center gap-2 bg-amber-500/10 border border-amber-500/30 text-amber-400 px-4 py-2 rounded-2xl text-xs font-black uppercase tracking-wider hover:bg-amber-500/20 transition-all"
                        >
                            <Award className="w-4 h-4" />
                            {certDownloading ? 'Generating...' : 'Certificate'}
                        </button>
                    )}
                </div>
            </header>

            <div className="flex flex-1 overflow-hidden">
                {/* Sidebar */}
                <aside className="w-80 hidden md:flex flex-col border-r border-white/5 bg-[#050505] overflow-y-auto">
                    <div className="p-4 border-b border-white/5">
                        <p className="text-[10px] font-black uppercase tracking-widest text-zinc-500">
                            {completedLessons.length}/{totalLessons} completed
                        </p>
                        <div className="mt-2 h-1 rounded-full bg-white/10 overflow-hidden">
                            <div
                                className="h-full bg-indigo-500 rounded-full transition-all duration-700"
                                style={{ width: `${progressPct}%` }}
                            />
                        </div>
                    </div>

                    <nav className="flex-1 p-2">
                        {modules.map((module) => (
                            <div key={module.id} className="mb-1">
                                <button
                                    onClick={() => toggleModule(module.id)}
                                    className="w-full flex items-center justify-between p-3 rounded-xl hover:bg-white/5 transition-colors text-left"
                                >
                                    <span className="text-xs font-black uppercase tracking-wide text-zinc-400">{module.title}</span>
                                    {expanded.includes(module.id)
                                        ? <ChevronDown className="w-3.5 h-3.5 text-zinc-600" />
                                        : <ChevronRight className="w-3.5 h-3.5 text-zinc-600" />}
                                </button>

                                {expanded.includes(module.id) && (
                                    <div className="pl-2 space-y-0.5">
                                        {module.lessons.map((lesson) => {
                                            const done = completedLessons.includes(lesson.id);
                                            const active = activeLesson?.id === lesson.id;
                                            return (
                                                <button
                                                    key={lesson.id}
                                                    onClick={() => setActiveLesson(lesson)}
                                                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-all group
                                                        ${active ? 'bg-indigo-500/10 border border-indigo-500/20' : 'hover:bg-white/5'}
                                                    `}
                                                >
                                                    {done
                                                        ? <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                                                        : <Circle className={`w-4 h-4 flex-shrink-0 ${active ? 'text-indigo-400' : 'text-zinc-700'}`} />}
                                                    <div className="flex-1 min-w-0">
                                                        <p className={`text-xs font-bold truncate ${active ? 'text-indigo-300' : done ? 'text-zinc-500' : 'text-zinc-400'}`}>
                                                            {lesson.title}
                                                        </p>
                                                        <p className="text-[10px] text-zinc-700 font-medium">{lesson.duration}</p>
                                                    </div>
                                                    {lesson.type === 'video'
                                                        ? <Play className="w-3 h-3 text-zinc-700 group-hover:text-zinc-500 flex-shrink-0" />
                                                        : <FileText className="w-3 h-3 text-zinc-700 flex-shrink-0" />}
                                                </button>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>
                        ))}
                    </nav>
                </aside>

                {/* Main content */}
                <main className="flex-1 overflow-y-auto">
                    {activeLesson ? (
                        <div className="max-w-4xl mx-auto p-6 space-y-6">
                            {/* Video player */}
                            {activeLesson.type === 'video' && activeLesson.content && (
                                <div className="relative bg-black rounded-3xl overflow-hidden shadow-2xl" style={{ paddingBottom: '56.25%' }}>
                                    <iframe
                                        src={getVideoEmbed(activeLesson.content)}
                                        className="absolute inset-0 w-full h-full"
                                        allowFullScreen
                                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                    />
                                </div>
                            )}

                            {/* Lesson header */}
                            <div className="flex items-start justify-between gap-4">
                                <div>
                                    <h2 className="text-2xl font-black uppercase tracking-tight text-white">{activeLesson.title}</h2>
                                    <p className="text-zinc-500 text-sm mt-1">{activeLesson.duration && `${activeLesson.duration} min`}</p>
                                </div>
                                <button
                                    onClick={markComplete}
                                    disabled={marking || completedLessons.includes(activeLesson.id)}
                                    className={`flex-shrink-0 flex items-center gap-2 px-5 py-2.5 rounded-2xl text-xs font-black uppercase tracking-wider transition-all
                                        ${completedLessons.includes(activeLesson.id)
                                            ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 cursor-default'
                                            : 'bg-indigo-500 hover:bg-indigo-600 text-white shadow-lg shadow-indigo-500/20'
                                        }`}
                                >
                                    {marking
                                        ? <Loader2 className="w-4 h-4 animate-spin" />
                                        : completedLessons.includes(activeLesson.id)
                                            ? <><CheckCircle2 className="w-4 h-4" /> Completed</>
                                            : <><Circle className="w-4 h-4" /> Mark Complete</>}
                                </button>
                            </div>

                            {/* Text content */}
                            {activeLesson.type === 'text' && activeLesson.content && (
                                <div className="bg-white/[0.03] border border-white/5 rounded-3xl p-8 prose prose-invert max-w-none text-zinc-300 text-sm leading-relaxed">
                                    {activeLesson.content}
                                </div>
                            )}

                            {/* Quiz content */}
                            {activeLesson.type === 'quiz' && activeLesson.content && (() => {
                                try {
                                    const quizData = JSON.parse(activeLesson.content);
                                    const [answers, setAnswers] = useState<Record<number, number>>({});
                                    const [submitted, setSubmitted] = useState(false);
                                    const [score, setScore] = useState(0);

                                    const handleOptionSelect = (qIdx: number, oIdx: number) => {
                                        if (submitted) return;
                                        setAnswers(prev => ({ ...prev, [qIdx]: oIdx }));
                                    };

                                    const handleSubmitQuiz = () => {
                                        let correctCount = 0;
                                        quizData.questions.forEach((q: any, i: number) => {
                                            if (answers[i] === q.correctAnswer) correctCount++;
                                        });
                                        setScore(correctCount);
                                        setSubmitted(true);
                                        if (correctCount === quizData.questions.length) {
                                            markComplete();
                                        }
                                    };

                                    return (
                                        <div className="space-y-8">
                                            {quizData.questions.map((q: any, i: number) => (
                                                <div key={i} className="bg-white/[0.03] border border-white/5 rounded-3xl p-6 space-y-4">
                                                    <h3 className="font-bold text-white text-lg">{i + 1}. {q.question}</h3>
                                                    <div className="space-y-2">
                                                        {q.options.map((opt: string, oIdx: number) => {
                                                            const isSelected = answers[i] === oIdx;
                                                            const isCorrect = q.correctAnswer === oIdx;
                                                            let className = "w-full text-left p-4 rounded-xl border transition-all ";

                                                            if (submitted) {
                                                                if (isCorrect) className += "bg-emerald-500/10 border-emerald-500/50 text-emerald-400";
                                                                else if (isSelected) className += "bg-rose-500/10 border-rose-500/50 text-rose-400";
                                                                else className += "border-white/5 text-zinc-500 opacity-50";
                                                            } else {
                                                                if (isSelected) className += "bg-indigo-500/20 border-indigo-500 text-indigo-300";
                                                                else className += "border-white/5 hover:bg-white/5 text-zinc-300";
                                                            }

                                                            return (
                                                                <button
                                                                    key={oIdx}
                                                                    onClick={() => handleOptionSelect(i, oIdx)}
                                                                    className={className}
                                                                    disabled={submitted}
                                                                >
                                                                    {opt}
                                                                </button>
                                                            );
                                                        })}
                                                    </div>
                                                </div>
                                            ))}

                                            {!submitted ? (
                                                <button
                                                    onClick={handleSubmitQuiz}
                                                    disabled={Object.keys(answers).length < quizData.questions.length}
                                                    className="w-full bg-indigo-500 hover:bg-indigo-600 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-4 rounded-2xl transition-all"
                                                >
                                                    Submit Quiz
                                                </button>
                                            ) : (
                                                <div className="bg-zinc-900 border border-white/10 rounded-3xl p-6 text-center space-y-2">
                                                    <p className="text-zinc-400 text-sm uppercase tracking-widest">You Scored</p>
                                                    <p className="text-4xl font-black text-white">{score} / {quizData.questions.length}</p>
                                                    {score === quizData.questions.length ? (
                                                        <p className="text-emerald-400 font-bold">Perfect Score! Lesson Completed.</p>
                                                    ) : (
                                                        <button
                                                            onClick={() => { setSubmitted(false); setAnswers({}); }}
                                                            className="text-indigo-400 hover:text-indigo-300 text-sm font-bold mt-2"
                                                        >
                                                            Retry Quiz
                                                        </button>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    );
                                } catch (e) {
                                    return <div className="text-rose-500">Error loading quiz configuration.</div>;
                                }
                            })()}

                            {/* Completion banner */}
                            {isComplete && (
                                <div className="bg-amber-500/10 border border-amber-500/20 rounded-3xl p-6 flex items-center justify-between">
                                    <div className="flex items-center gap-4">
                                        <Award className="w-10 h-10 text-amber-400" />
                                        <div>
                                            <h3 className="font-black uppercase tracking-wide text-amber-400">Course Complete! 🎉</h3>
                                            <p className="text-zinc-400 text-sm">You've finished this course. Download your certificate!</p>
                                        </div>
                                    </div>
                                    <button
                                        onClick={downloadCertificate}
                                        disabled={certDownloading}
                                        className="bg-amber-500 hover:bg-amber-600 text-black font-black text-xs uppercase px-5 py-3 rounded-2xl transition-all"
                                    >
                                        {certDownloading ? 'Generating...' : 'Download Certificate'}
                                    </button>
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="flex items-center justify-center h-full">
                            <p className="text-zinc-600 text-sm">Select a lesson to start learning</p>
                        </div>
                    )}
                </main>

                {/* Reviews Section */}
                <div className="border-t border-white/5 p-6 mt-8">
                    <h3 className="text-xl font-bold mb-6">Student Reviews</h3>
                    <ReviewsSection courseId={courseId} />
                </div>
            </div>
        </div>
    );
}



function ReviewsSection({ courseId }: { courseId: string }) {
    const [reviews, setReviews] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [rating, setRating] = useState(5);
    const [comment, setComment] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [hasReviewed, setHasReviewed] = useState(false);

    useEffect(() => {
        fetch(`/api/reviews/${courseId}`)
            .then(res => res.json())
            .then(data => {
                setReviews(data.reviews || []);
                // Check if current user has reviewed (needs auth context or check from API)
                // accurate check would be done by the API telling us, but for now relies on client knowing user ID?
                // Actually API doesn't tell us if *we* reviewed. 
                // We'll just try to submit and handle "already reviewed" error.
            })
            .finally(() => setLoading(false));
    }, [courseId]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            const res = await fetch(`/api/reviews/${courseId}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ rating, comment })
            });
            const data = await res.json();
            if (res.ok) {
                setReviews(prev => [data.review, ...prev]);
                setComment('');
                setHasReviewed(true);
                toast.success('Review submitted!');
            } else {
                toast.error(data.error);
            }
        } catch (err) {
            toast.error('Failed to submit review');
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) return <Loader2 className="w-5 h-5 animate-spin text-zinc-500" />;

    return (
        <div className="space-y-8 max-w-2xl">
            {/* Write Review */}
            {!hasReviewed && (
                <form onSubmit={handleSubmit} className="bg-white/5 rounded-2xl p-6 space-y-4">
                    <h4 className="font-bold text-sm uppercase tracking-wide text-zinc-400">Write a Review</h4>
                    <div className="flex items-center gap-1">
                        {[1, 2, 3, 4, 5].map(star => (
                            <button
                                key={star}
                                type="button"
                                onClick={() => setRating(star)}
                                className={`p-1 transition-colors ${rating >= star ? 'text-amber-400' : 'text-zinc-600 hover:text-amber-400/50'}`}
                            >
                                <Star className="w-6 h-6 fill-current" />
                            </button>
                        ))}
                    </div>
                    <textarea
                        value={comment}
                        onChange={e => setComment(e.target.value)}
                        placeholder="Share your experience..."
                        className="w-full bg-black/20 border border-white/5 rounded-xl p-3 text-sm text-zinc-200 focus:outline-none focus:border-indigo-500/50 transition-all resize-none"
                        rows={3}
                        required
                    />
                    <div className="flex justify-end">
                        <button
                            type="submit"
                            disabled={submitting}
                            className="bg-indigo-500 hover:bg-indigo-600 text-white px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all disabled:opacity-50"
                        >
                            {submitting ? 'Submitting...' : 'Post Review'}
                        </button>
                    </div>
                </form>
            )}

            {/* List Reviews */}
            <div className="space-y-4">
                {reviews.length === 0 ? (
                    <p className="text-zinc-500 text-sm italic">No reviews yet. Be the first!</p>
                ) : (
                    reviews.map((review, i) => (
                        <div key={i} className="border-b border-white/5 pb-4 last:border-0">
                            <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center gap-2">
                                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center font-bold text-xs">
                                        {review.userId?.displayName?.[0] || 'U'}
                                    </div>
                                    <div>
                                        <p className="text-xs font-bold text-white">{review.userId?.displayName || 'User'}</p>
                                        <div className="flex text-amber-400">
                                            {[...Array(5)].map((_, i) => (
                                                <Star key={i} className={`w-3 h-3 ${i < review.rating ? 'fill-current' : 'text-zinc-700'}`} />
                                            ))}
                                        </div>
                                    </div>
                                </div>
                                <span className="text-[10px] text-zinc-600">{new Date(review.createdAt).toLocaleDateString()}</span>
                            </div>
                            <p className="text-zinc-400 text-sm leading-relaxed pl-10">{review.comment}</p>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}
