'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, Plus, FolderPlus } from 'lucide-react';
import { toast } from 'react-hot-toast';

interface Module {
    _id?: string;
    title: string;
    description?: string;
    order?: number;
}

interface CourseModuleModalProps {
    courseId: string;
    module?: Module;
    trigger?: React.ReactNode;
    onSuccess?: () => void;
}

export function CourseModuleModal({ courseId, module: initialModule, trigger, onSuccess }: CourseModuleModalProps) {
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');

    useEffect(() => {
        if (initialModule) {
            setTitle(initialModule.title || '');
            setDescription(initialModule.description || '');
        } else {
            setTitle('');
            setDescription('');
        }
    }, [initialModule, open]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            const url = initialModule
                ? `/api/creator/courses/modules/${initialModule._id}` // TODO: Implement PUT
                : `/api/creator/courses/${courseId}/modules`;

            const res = await fetch(url, {
                method: initialModule ? 'PUT' : 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ title, description, courseId })
            });

            if (!res.ok) throw new Error('Failed to save module');

            toast.success(initialModule ? 'Module updated' : 'Module created');
            setOpen(false);
            if (onSuccess) onSuccess();
        } catch (error) {
            toast.error('Failed to save module');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                {trigger || (
                    <Button variant="outline" className="border-indigo-500/50 text-indigo-400 hover:bg-indigo-500/10">
                        <FolderPlus className="mr-2 h-4 w-4" />
                        Add Module
                    </Button>
                )}
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px] bg-[#1a1a1a] border-gray-800 text-white">
                <DialogHeader>
                    <DialogTitle>{initialModule ? 'Edit Module' : 'Add New Module'}</DialogTitle>
                    <DialogDescription className="text-gray-400">
                        Organize your lessons into sections.
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4 py-4">
                    <div className="space-y-2">
                        <Label htmlFor="mod-title">Title</Label>
                        <Input id="mod-title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Getting Started" required className="bg-[#0a0a0a] border-gray-700" />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="mod-desc">Description</Label>
                        <Textarea id="mod-desc" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="What will students learn in this section?" className="bg-[#0a0a0a] border-gray-700" />
                    </div>
                    <div className="flex justify-end pt-4">
                        <Button type="submit" disabled={loading} className="bg-indigo-500 hover:bg-indigo-600">
                            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Save Module'}
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
}
