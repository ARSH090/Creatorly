'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, Plus, Edit } from 'lucide-react';
import { toast } from 'react-hot-toast';

interface Lesson {
    _id?: string;
    title: string;
    description?: string;
    videoUrl?: string;
    content?: string;
    order?: number;
    isPublished?: boolean;
}

interface CourseLessonModalProps {
    courseId: string;
    lesson?: Lesson; // If provided, mode is 'edit'
    trigger?: React.ReactNode;
    onSuccess?: () => void;
}

export function CourseLessonModal({ courseId, lesson, trigger, onSuccess }: CourseLessonModalProps) {
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);

    // Form State
    const [title, setTitle] = useState('');
    const [type, setType] = useState('video');
    const [description, setDescription] = useState('');
    const [videoUrl, setVideoUrl] = useState('');
    const [content, setContent] = useState('');
    const [order, setOrder] = useState<number | ''>('');
    const [moduleId, setModuleId] = useState<string>('');
    const [modules, setModules] = useState<any[]>([]);

    // Initialize form when opening/editing
    useEffect(() => {
        async function fetchModules() {
            try {
                const res = await fetch(`/api/creator/courses/${courseId}/modules`);
                const data = await res.json();
                if (res.ok) setModules(data.modules || []);
            } catch (err) {
                console.error('Failed to fetch modules', err);
            }
        }

        if (open) fetchModules();

        if (lesson) {
            setTitle(lesson.title || '');
            setType((lesson as any).type || 'video');
            setDescription(lesson.description || '');
            setVideoUrl(lesson.videoUrl || '');
            setContent(lesson.content || '');
            setOrder(lesson.order !== undefined ? lesson.order : '');
            setModuleId((lesson as any).moduleId || '');
        } else {
            setTitle('');
            setType('video');
            setDescription('');
            setVideoUrl('');
            setContent('');
            setOrder('');
            setModuleId('');
        }
    }, [lesson, open, courseId]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!moduleId) {
            toast.error('Please select a module');
            return;
        }
        setLoading(true);

        try {
            const payload = {
                courseId,
                moduleId,
                title,
                type,
                description,
                videoUrl,
                content,
                order: order === '' ? undefined : Number(order)
            };

            const url = lesson
                ? `/api/creator/courses/lessons/${lesson._id}`
                : `/api/creator/courses/${courseId}/lessons`;

            const method = lesson ? 'PUT' : 'POST';

            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.error || data.message || 'Failed to save lesson');
            }

            toast.success(lesson ? 'Lesson updated!' : 'Lesson added!');
            setOpen(false);
            if (onSuccess) onSuccess();
        } catch (error: any) {
            console.error(error);
            toast.error(error.message || 'Something went wrong');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                {trigger || (
                    <Button>
                        <Plus className="mr-2 h-4 w-4" />
                        Add Lesson
                    </Button>
                )}
            </DialogTrigger>
            <DialogContent className="sm:max-w-[600px] bg-[#1a1a1a] border-gray-800 text-white">
                <DialogHeader>
                    <DialogTitle>{lesson ? 'Edit Lesson' : 'Add New Lesson'}</DialogTitle>
                    <DialogDescription className="text-gray-400">
                        {lesson ? 'Update lesson details and content.' : 'Create a new lesson for your course curriculum.'}
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-4 py-4">
                    <div className="space-y-2">
                        <Label htmlFor="moduleId" className="text-gray-200">Module <span className="text-red-500">*</span></Label>
                        <Select value={moduleId} onValueChange={setModuleId}>
                            <SelectTrigger className="bg-[#0a0a0a] border-gray-700">
                                <SelectValue placeholder="Select a module" />
                            </SelectTrigger>
                            <SelectContent className="bg-[#1a1a1a] border-gray-700 text-white">
                                {modules.map((mod) => (
                                    <SelectItem key={mod._id} value={mod._id}>{mod.title}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="title" className="text-gray-200">Lesson Title <span className="text-red-500">*</span></Label>
                            <Input
                                id="title"
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                placeholder="e.g. Introduction to React"
                                required
                                className="bg-[#0a0a0a] border-gray-700"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="type" className="text-gray-200">Type</Label>
                            <Select value={type} onValueChange={setType}>
                                <SelectTrigger className="bg-[#0a0a0a] border-gray-700">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent className="bg-[#1a1a1a] border-gray-700 text-white">
                                    <SelectItem value="video">Video</SelectItem>
                                    <SelectItem value="text">Text / Article</SelectItem>
                                    <SelectItem value="quiz">Quiz</SelectItem>
                                    <SelectItem value="file">File Download</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        {type === 'video' && (
                            <div className="space-y-2">
                                <Label htmlFor="videoUrl" className="text-gray-200">Video URL</Label>
                                <Input
                                    id="videoUrl"
                                    value={videoUrl}
                                    onChange={(e) => setVideoUrl(e.target.value)}
                                    placeholder="https://vimeo.com/..."
                                    className="bg-[#0a0a0a] border-gray-700"
                                />
                            </div>
                        )}
                        <div className="space-y-2">
                            <Label htmlFor="order" className="text-gray-200">Order</Label>
                            <Input
                                id="order"
                                type="number"
                                value={order}
                                onChange={(e) => setOrder(e.target.value === '' ? '' : parseInt(e.target.value))}
                                placeholder="0"
                                className="bg-[#0a0a0a] border-gray-700"
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="description" className="text-gray-200">Description</Label>
                        <Textarea
                            id="description"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder="Brief summary of this lesson..."
                            className="bg-[#0a0a0a] border-gray-700 min-h-[80px]"
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="content" className="text-gray-200">
                            {type === 'quiz' ? 'Quiz JSON Configuration' : 'Content (Markdown supported)'}
                        </Label>
                        {type === 'quiz' && (
                            <p className="text-xs text-zinc-500 mb-2">
                                Format: <code>{`{ "questions": [ { "question": "...", "options": ["A", "B"], "correctAnswer": 0 } ] }`}</code>
                            </p>
                        )}
                        <Textarea
                            id="content"
                            value={content}
                            onChange={(e) => setContent(e.target.value)}
                            placeholder={type === 'quiz' ? '{ "questions": [] }' : '# Lesson Content...'}
                            className="bg-[#0a0a0a] border-gray-700 min-h-[150px] font-mono text-sm"
                        />
                    </div>

                    <div className="flex justify-end space-x-2 pt-4">
                        <Button type="button" variant="outline" onClick={() => setOpen(false)} className="border-gray-700 text-gray-300 hover:bg-gray-800">
                            Cancel
                        </Button>
                        <Button type="submit" disabled={loading} className="bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white">
                            {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : (lesson ? 'Save Changes' : 'Add Lesson')}
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
}
