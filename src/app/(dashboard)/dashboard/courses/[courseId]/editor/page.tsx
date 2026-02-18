'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import { CourseLessonModal } from '@/components/dashboard/course-lesson-modal';
import { CourseModuleModal } from '@/components/dashboard/course-module-modal';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, ArrowLeft, GripVertical, Video, FileText, Trash2, Edit, ChevronDown, ChevronRight } from 'lucide-react';
import { toast } from 'react-hot-toast';

export default function CourseEditorPage() {
    const params = useParams();
    const router = useRouter();
    const courseId = params.courseId as string;

    const [loading, setLoading] = useState(true);
    const [course, setCourse] = useState<any>(null);
    const [modules, setModules] = useState<any[]>([]);
    const [lessons, setLessons] = useState<any[]>([]);
    const [expandedModules, setExpandedModules] = useState<string[]>([]);

    const fetchData = async () => {
        try {
            const [courseRes, modRes, lessonRes] = await Promise.all([
                fetch(`/api/creator/products/${courseId}`),
                fetch(`/api/creator/courses/${courseId}/modules`),
                fetch(`/api/creator/courses/${courseId}/lessons`)
            ]);

            const courseData = await courseRes.json();
            const modData = await modRes.json();
            const lessonData = await lessonRes.json();

            if (courseRes.ok) setCourse(courseData.product);
            if (modRes.ok) {
                setModules(modData.modules || []);
                setExpandedModules(modData.modules.map((m: any) => m._id));
            }
            if (lessonRes.ok) setLessons(lessonData.lessons || []);
        } catch (error) {
            console.error(error);
            toast.error('Failed to load course details');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (courseId) fetchData();
    }, [courseId]);

    const toggleModule = (id: string) => {
        setExpandedModules(prev =>
            prev.includes(id) ? prev.filter(mid => mid !== id) : [...prev, id]
        );
    };

    const handleDeleteLesson = async (lessonId: string) => {
        if (!confirm('Are you sure you want to delete this lesson?')) return;
        try {
            const res = await fetch(`/api/creator/courses/lessons/${lessonId}?courseId=${courseId}`, { method: 'DELETE' });
            if (res.ok) {
                toast.success('Lesson deleted');
                fetchData();
            }
        } catch (error) {
            toast.error('Failed to delete lesson');
        }
    };

    if (loading) {
        return (
            <DashboardLayout>
                <div className="flex h-[50vh] items-center justify-center">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
            </DashboardLayout>
        );
    }

    return (
        <DashboardLayout>
            <div className="max-w-5xl mx-auto p-6 space-y-8">
                <div className="flex items-center justify-between">
                    <div className="space-y-1">
                        <div className="flex items-center gap-2">
                            <Button variant="ghost" size="icon" onClick={() => router.back()}>
                                <ArrowLeft className="h-4 w-4" />
                            </Button>
                            <h1 className="text-3xl font-bold tracking-tight">{course?.name}</h1>
                        </div>
                        <p className="text-muted-foreground ml-10">Manage course modules and lessons</p>
                    </div>
                    <div className="flex gap-2">
                        <CourseModuleModal courseId={courseId} onSuccess={fetchData} />
                        <CourseLessonModal courseId={courseId} onSuccess={fetchData} />
                    </div>
                </div>

                <div className="space-y-6">
                    {modules.length === 0 ? (
                        <div className="text-center py-20 border-2 border-dashed border-[#333] rounded-3xl">
                            <FolderPlus className="h-12 w-12 text-gray-600 mx-auto mb-4" />
                            <h3 className="text-lg font-bold text-white">No content structure yet</h3>
                            <p className="text-gray-500 mb-6">Create your first module to begin organizing lessons.</p>
                            <CourseModuleModal courseId={courseId} onSuccess={fetchData} />
                        </div>
                    ) : (
                        modules.map((module, mIdx) => (
                            <div key={module._id} className="space-y-4">
                                <div
                                    onClick={() => toggleModule(module._id)}
                                    className="flex items-center justify-between p-4 bg-[#111] border border-white/5 rounded-2xl cursor-pointer hover:border-white/10 transition-all group"
                                >
                                    <div className="flex items-center gap-4">
                                        {expandedModules.includes(module._id) ? <ChevronDown className="w-5 h-5 text-zinc-500" /> : <ChevronRight className="w-5 h-5 text-zinc-500" />}
                                        <div>
                                            <h3 className="font-black uppercase tracking-tight text-sm flex items-center gap-3">
                                                <span className="text-zinc-600">SECTION {mIdx + 1}</span>
                                                {module.title}
                                            </h3>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <CourseModuleModal courseId={courseId} module={module} onSuccess={fetchData} trigger={<Button variant="ghost" size="sm" className="h-8 w-8 p-0"><Edit className="h-4 w-4" /></Button>} />
                                    </div>
                                </div>

                                {expandedModules.includes(module._id) && (
                                    <div className="pl-12 space-y-3">
                                        {lessons.filter(l => l.moduleId === module._id).length === 0 ? (
                                            <p className="text-xs text-zinc-600 italic py-2">No lessons in this module yet.</p>
                                        ) : (
                                            lessons.filter(l => l.moduleId === module._id).map((lesson, lIdx) => (
                                                <div key={lesson._id} className="flex items-center justify-between p-4 bg-white/5 border border-white/5 rounded-2xl hover:border-indigo-500/30 transition-all group">
                                                    <div className="flex items-center gap-4">
                                                        <div className="w-8 h-8 rounded-xl bg-zinc-900 flex items-center justify-center text-indigo-400">
                                                            {lesson.videoUrl ? <Video className="w-4 h-4" /> : <FileText className="w-4 h-4" />}
                                                        </div>
                                                        <div>
                                                            <h4 className="text-sm font-bold text-white">{lesson.title}</h4>
                                                            <p className="text-[10px] text-zinc-500 uppercase tracking-widest font-black">Lesson {lIdx + 1}</p>
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                        <CourseLessonModal courseId={courseId} lesson={lesson} onSuccess={fetchData} trigger={<Button variant="ghost" size="sm" className="h-8 w-8 p-0"><Edit className="h-4 w-4" /></Button>} />
                                                        <Button variant="ghost" size="sm" onClick={() => handleDeleteLesson(lesson._id)} className="h-8 w-8 p-0 text-rose-500 hover:text-rose-400 hover:bg-rose-500/10">
                                                            <Trash2 className="h-4 w-4" />
                                                        </Button>
                                                    </div>
                                                </div>
                                            ))
                                        )}
                                    </div>
                                )}
                            </div>
                        ))
                    )}
                </div>
            </div>
        </DashboardLayout>
    );
}

import { FolderPlus } from 'lucide-react';
