import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db/mongodb';
import { CourseLesson } from '@/lib/models/CourseContent';
import { getMongoUser } from '@/lib/auth/get-user';
import { isContentUnlocked } from '@/lib/utils/drip';

export const dynamic = 'force-dynamic';

// GET /api/v1/courses/:id/status
export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
    try {
        await connectToDatabase();
        const user = await getMongoUser();
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const lessons = await CourseLesson.find({ productId: params.id, isActive: true })
            .sort({ orderIndex: 1 });

        const statusMap = await Promise.all(lessons.map(async (lesson) => {
            const status = await isContentUnlocked(user._id.toString(), params.id, lesson.dripDelayDays);
            return {
                lessonId: lesson._id,
                unlocked: status.unlocked,
                unlockDate: status.unlockDate,
                daysRemaining: status.daysRemaining
            };
        }));

        return NextResponse.json({ lessons: statusMap });
    } catch (error: any) {
        console.error('Error fetching course drip status:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
