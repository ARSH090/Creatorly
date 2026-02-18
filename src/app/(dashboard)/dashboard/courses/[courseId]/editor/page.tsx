'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import { CourseLessonModal } from '@/components/dashboard/course-lesson-modal';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, ArrowLeft, GripVertical, Video, FileText, Trash2, Edit } from 'lucide-react';
import { toast } from 'react-hot-toast';

export default function CourseEditorPage() {
    const params = useParams();
    const router = useRouter();
    const courseId = params.courseId as string;

    const [loading, setLoading] = useState(true);
    const [course, setCourse] = useState<any>(null);

    const fetchCourse = async () => {
        try {
            const res = await fetch(`/api/creator/products/${courseId}`);
            const json = await res.json();
            if (!res.ok) throw new Error(json.error || 'Failed to fetch course');
            setCourse(json.product);
        } catch (error) {
            console.error(error);
            toast.error('Failed to load course details');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (courseId) fetchCourse();
    }, [courseId]);

    const handleDeleteLesson = async (lessonId: string) => {
        if (!confirm('Are you sure you want to delete this lesson?')) return;

        try {
            const res = await fetch(`/api/creator/courses/lessons/${lessonId}?courseId=${courseId}`, {
                method: 'DELETE'
            });

            if (res.ok) {
                toast.success('Lesson deleted');
                fetchCourse();
            } else {
                throw new Error('Failed to delete lesson');
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

    if (!course) {
        return (
            <DashboardLayout>
                <div className="p-8 text-center">
                    <h2 className="text-xl font-bold">Course not found</h2>
                    <Button onClick={() => router.back()} className="mt-4">Go Back</Button>
                </div>
            </DashboardLayout>
        );
    }

    // Sort curriculum by order
    const curriculum = course.curriculum?.sort((a: any, b: any) => (a.order || 0) - (b.order || 0)) || [];

    return (
        <DashboardLayout>
            <div className="max-w-5xl mx-auto p-6 space-y-8">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div className="space-y-1">
                        <div className="flex items-center gap-2">
                            <Button variant="ghost" size="icon" onClick={() => router.back()}>
                                <ArrowLeft className="h-4 w-4" />
                            </Button>
                            <h1 className="text-3xl font-bold tracking-tight">{course.name}</h1>
                        </div>
                        <p className="text-muted-foreground ml-10">Manage curriculum and lessons</p>
                    </div>
                    <div className="flex gap-2">
                        <Button variant="outline" onClick={() => window.open(`/products/${course.slug}`, '_blank')}>
                            View Course
                        </Button>
                        <CourseLessonModal courseId={courseId} onSuccess={fetchCourse} />
                    </div>
                </div>

                {/* Quick Stats */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Card className="bg-[#1a1a1a] border-[#333]">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium text-gray-400">Total Lessons</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-white">{curriculum.length}</div>
                        </CardContent>
                    </Card>
                    <Card className="bg-[#1a1a1a] border-[#333]">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium text-gray-400">Total Duration</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-white">0 min</div>
                            <p className="text-xs text-gray-500">Auto-calculated</p>
                        </CardContent>
                    </Card>
                    <Card className="bg-[#1a1a1a] border-[#333]">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium text-gray-400">Students</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-white">{course.stats?.totalSales || 0}</div>
                        </CardContent>
                    </Card>
                </div>

                {/* Curriculum */}
                <Card className="border-[#333]">
                    <CardHeader>
                        <CardTitle>Course Curriculum</CardTitle>
                        <CardDescription>Drag and drop to reorder lessons (coming soon)</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {curriculum.length === 0 ? (
                            <div className="text-center py-12 border-2 border-dashed border-[#333] rounded-lg">
                                <FileText className="h-12 w-12 text-gray-600 mx-auto mb-4" />
                                <h3 className="text-lg font-medium text-gray-300">No lessons yet</h3>
                                <p className="text-gray-500 mb-4">Start building your course by adding the first lesson.</p>
                                <CourseLessonModal courseId={courseId} onSuccess={fetchCourse} />
                            </div>
                        ) : (
                            curriculum.map((lesson: any, index: number) => (
                                <div key={lesson._id} className="flex items-center justify-between p-4 bg-[#1a1a1a] border border-[#333] rounded-lg hover:border-indigo-500/50 transition-colors group">
                                    <div className="flex items-center gap-4">
                                        <div className="cursor-move text-gray-600 hover:text-gray-400">
                                            <GripVertical className="h-5 w-5" />
                                        </div>
                                        <div className="h-10 w-10 rounded bg-[#2a2a2a] flex items-center justify-center text-indigo-400">
                                            {lesson.videoUrl ? <Video className="h-5 w-5" /> : <FileText className="h-5 w-5" />}
                                        </div>
                                        <div>
                                            <h4 className="font-medium text-white">{lesson.title}</h4>
                                            <div className="flex items-center gap-2 mt-1">
                                                <Badge variant="secondary" className="text-[10px] h-5 bg-[#2a2a2a] text-gray-400">
                                                    Lesson {index + 1}
                                                </Badge>
                                                {lesson.duration > 0 && (
                                                    <span className="text-xs text-gray-500">{lesson.duration} min</span>
                                                )}
                                                {!lesson.isPublished && (
                                                    <Badge variant="outline" className="text-[10px] h-5 border-yellow-800 text-yellow-600">Draft</Badge>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <CourseLessonModal
                                            courseId={courseId}
                                            lesson={lesson}
                                            onSuccess={fetchCourse}
                                            trigger={
                                                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                                    <Edit className="h-4 w-4" />
                                                </Button>
                                            }
                                        />
                                        <Button variant="ghost" size="sm" onClick={() => handleDeleteLesson(lesson._id)} className="h-8 w-8 p-0 text-red-500 hover:text-red-400 hover:bg-red-500/10">
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </div>
                            ))
                        )}
                    </CardContent>
                </Card>
            </div>
        </DashboardLayout>
    );
}
