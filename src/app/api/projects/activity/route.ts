import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db/mongodb';
import { Project } from '@/lib/models/Project';
import { Task } from '@/lib/models/Task';
import { Deliverable } from '@/lib/models/Deliverable';
import { withCreatorAuth } from '@/lib/auth/withAuth';

/**
 * GET - Fetch recent activity across all projects
 */
async function getHandler(req: NextRequest, user: any) {
    try {
        await connectToDatabase();
        const creatorId = user._id;

        // Fetch last 5 projects and their logs
        const projects = await Project.find({ creatorId })
            .select('name activityLog')
            .limit(10)
            .sort({ updatedAt: -1 })
            .lean();

        let allActivities: any[] = [];

        projects.forEach((project: any) => {
            const logs = project.activityLog.map((log: any) => ({
                ...log,
                projectName: project.name,
                projectId: project._id,
                type: 'log'
            }));
            allActivities = [...allActivities, ...logs];
        });

        // Add Recent Deliverables
        const recentDeliverables = await Deliverable.find({ creatorId })
            .populate('projectId', 'name')
            .sort({ createdAt: -1 })
            .limit(10);

        recentDeliverables.forEach(d => {
            allActivities.push({
                action: d.status === 'Approved' ? 'approved_deliverable' : 'uploaded_deliverable',
                performedBy: d.status === 'Approved' ? 'Client' : 'Creator',
                timestamp: d.updatedAt,
                projectName: (d.projectId as any).name,
                projectId: (d.projectId as any)._id,
                meta: { name: d.name, version: d.versionNumber },
                type: 'deliverable'
            });
        });

        // Add Overdue Tasks
        const overdueTasks = await Task.find({
            projectId: { $in: await Project.find({ creatorId }).distinct('_id') },
            dueDate: { $lt: new Date() },
            status: { $ne: 'Done' }
        }).populate('projectId', 'name').limit(5);

        overdueTasks.forEach(t => {
            allActivities.push({
                action: 'task_overdue',
                performedBy: 'System',
                timestamp: t.dueDate,
                projectName: (t.projectId as any).name,
                projectId: (t.projectId as any)._id,
                meta: { title: t.title },
                type: 'task'
            });
        });

        // Sort by timestamp and take last 15
        allActivities.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

        return NextResponse.json(allActivities.slice(0, 15));

    } catch (error: any) {
        console.error('Project Activity API Error:', error);
        return NextResponse.json({ error: 'Failed to fetch project activity' }, { status: 500 });
    }
}

export const GET = withCreatorAuth(getHandler);
