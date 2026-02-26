import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db/mongodb';
import { Project } from '@/lib/models/Project';
import { Task } from '@/lib/models/Task';
import { withCreatorAuth } from '@/lib/auth/withAuth';
import { startOfWeek, endOfWeek, startOfMonth } from 'date-fns';

/**
 * GET - Fetch project-related stats for the dashboard
 */
async function getHandler(req: NextRequest, user: any) {
    try {
        await connectToDatabase();
        const creatorId = user._id;

        const now = new Date();
        const weekStart = startOfWeek(now);
        const weekEnd = endOfWeek(now);
        const monthStart = startOfMonth(now);

        // Run queries in parallel for performance
        const [
            activeCount,
            dueThisWeekCount,
            overdueTasksCount,
            completedThisMonthCount,
            pipelineValue
        ] = await Promise.all([
            // Active Projects
            Project.countDocuments({ creatorId, status: 'In Progress', isArchived: false }),

            // Due This Week
            Project.countDocuments({
                creatorId,
                dueDate: { $gte: weekStart, $lte: weekEnd },
                status: { $ne: 'Completed' }
            }),

            // Overdue Tasks
            Task.countDocuments({
                projectId: { $in: await Project.find({ creatorId }).distinct('_id') },
                dueDate: { $lt: now },
                status: { $ne: 'Done' }
            }),

            // Completed This Month
            Project.countDocuments({
                creatorId,
                status: 'Completed',
                completedAt: { $gte: monthStart }
            }),

            // Pipeline Value (Sum of values of projects not fully paid)
            Project.aggregate([
                { $match: { creatorId: creatorId, paymentStatus: { $ne: 'Fully Paid' } } },
                { $group: { _id: null, total: { $sum: '$value' } } }
            ])
        ]);

        return NextResponse.json({
            activeCount,
            dueThisWeekCount,
            overdueTasksCount,
            completedThisMonthCount,
            pipelineValue: pipelineValue[0]?.total || 0
        });

    } catch (error: any) {
        console.error('Project Stats API Error:', error);
        return NextResponse.json({ error: 'Failed to fetch project stats' }, { status: 500 });
    }
}

export const GET = withCreatorAuth(getHandler);
