import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db/mongodb';
import { CourseProgress } from '@/lib/models/CourseProgress';
import { CourseLesson } from '@/lib/models/CourseContent';
import { getMongoUser } from '@/lib/auth/get-user';

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
    try {
        await connectToDatabase();
        const user = await getMongoUser();
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const { lessonId, completed, position, notes } = await req.json();

        if (!lessonId) return NextResponse.json({ error: 'Lesson ID required' }, { status: 400 });

        let progress = await CourseProgress.findOne({ userId: user._id, productId: params.id });

        if (!progress) {
            const lesson = await CourseLesson.findById(lessonId);
            if (!lesson) return NextResponse.json({ error: 'Lesson not found' }, { status: 404 });

            progress = await CourseProgress.create({
                userId: user._id,
                studentEmail: user.email,
                productId: params.id,
                creatorId: lesson.creatorId,
                completedLessons: [],
                startedAt: new Date()
            });
        }

        if (completed !== undefined) {
            if (completed) {
                if (!progress.completedLessons.includes(lessonId)) {
                    progress.completedLessons.push(lessonId);
                }
            } else {
                progress.completedLessons = progress.completedLessons.filter(id => id !== lessonId);
            }
        }

        if (position !== undefined) {
            progress.lastPositionSeconds = position;
        }

        if (notes !== undefined) {
            // Update notes for this lesson
            const noteIndex = progress.notes?.findIndex(n => n.lessonId === lessonId);
            if (noteIndex !== undefined && noteIndex > -1) {
                progress.notes[noteIndex].text = notes;
                progress.notes[noteIndex].updatedAt = new Date();
            } else {
                if (!progress.notes) progress.notes = [];
                progress.notes.push({ lessonId, text: notes, updatedAt: new Date() });
            }
        }

        // Calculate Percent Complete
        const totalLessons = await CourseLesson.countDocuments({ productId: params.id, isActive: true });
        progress.percentComplete = totalLessons > 0
            ? Math.round((progress.completedLessons.length / totalLessons) * 100)
            : 0;

        progress.lastLessonId = lessonId;
        progress.lastAccessedAt = new Date();

        if (progress.percentComplete === 100) {
            progress.isCompleted = true;
            progress.completedAt = new Date();
        }

        await progress.save();

        return NextResponse.json({ progress });


    } catch (error: any) {
        console.error('Course Progress API Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
