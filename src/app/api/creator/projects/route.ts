import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db/mongodb';
import { Project } from '@/lib/models/Project';
import { ProjectService } from '@/lib/services/projectService';
import { withCreatorAuth } from '@/lib/auth/withAuth';
import { successResponse, errorResponse } from '@/types/api';

import { ProjectTemplate } from '@/lib/models/ProjectTemplate';
import { Task } from '@/lib/models/Task';

/**
 * GET - List projects for a creator
 */
async function getHandler(req: NextRequest, user: any) {
    try {
        await connectToDatabase();
        const { searchParams } = new URL(req.url);
        const status = searchParams.get('status');
        const archived = searchParams.get('archived') === 'true';

        let query: any = { creatorId: user._id, isArchived: archived };
        if (status && status !== 'All') query.status = status;

        const projects = await Project.find(query)
            .populate('clientId', 'displayName email avatar')
            .sort({ updatedAt: -1 });

        return NextResponse.json(projects);
    } catch (error: any) {
        console.error('Projects GET API Error:', error);
        return NextResponse.json(errorResponse('Failed to fetch projects', error.message), { status: 500 });
    }
}

/**
 * POST - Create a manual project with full CRM fields + Template support
 */
async function postHandler(req: NextRequest, user: any) {
    try {
        await connectToDatabase();
        const body = await req.json();

        if (!body.name) {
            return NextResponse.json(errorResponse('Project name is required'), { status: 400 });
        }

        // Generate project number and portal token
        const projectNumber = `PRJ-${Math.floor(100000 + Math.random() * 900000)}`;
        const clientPortalToken = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);

        let finalMilestones = body.milestones || [];
        let template = null;

        // If template provided, prepare automated tasks and milestones
        if (body.templateId) {
            template = await ProjectTemplate.findById(body.templateId);
            if (template) {
                // Calculate milestones from template percentages
                if (template.milestones?.length > 0 && body.value > 0) {
                    finalMilestones = template.milestones.map((m: any) => ({
                        name: m.name,
                        amount: (body.value * m.amountPercent) / 100, // already in paise
                        dueDate: new Date(Date.now() + (m.relativeDueDateDays || 0) * 86400000),
                        status: 'pending'
                    }));
                }
            }
        }

        const project = await Project.create({
            ...body,
            creatorId: user._id,
            projectNumber,
            clientPortalToken,
            status: body.status || 'Not Started',
            paymentStatus: body.paymentStatus || 'Unpaid',
            value: body.value || 0,
            milestones: finalMilestones,
            activityLog: [{
                action: 'project_created',
                performedBy: 'Creator',
                timestamp: new Date(),
                meta: { name: body.name, template: template?.name }
            }]
        });

        // Generate tasks from template
        if (template && template.tasks?.length > 0) {
            const tasksToCreate = template.tasks.map((t: any, idx: number) => ({
                projectId: project._id,
                title: t.title,
                description: t.description,
                priority: t.priority || 'Medium',
                status: 'To Do',
                columnId: 'todo',
                position: idx,
                subtasks: t.subtasks?.map((st: string) => ({ title: st, isCompleted: false })) || [],
                dueDate: t.relativeDueDateDays ? new Date(Date.now() + t.relativeDueDateDays * 86400000) : null
            }));

            await Task.insertMany(tasksToCreate);

            // Increment template usage
            await ProjectTemplate.findByIdAndUpdate(template._id, { $inc: { usageCount: 1 } });
        }

        return NextResponse.json(project);
    } catch (error: any) {
        console.error('Projects POST API Error:', error);
        return NextResponse.json(errorResponse('Failed to create project', error.message), { status: 500 });
    }
}



export const GET = withCreatorAuth(getHandler);
export const POST = withCreatorAuth(postHandler);
