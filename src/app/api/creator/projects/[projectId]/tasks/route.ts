import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db/mongodb';
import { Task } from '@/lib/models/Task';
import { Project } from '@/lib/models/Project';
import { ProjectService } from '@/lib/services/projectService';
import { withCreatorAuth } from '@/lib/auth/withAuth';
import { successResponse, errorResponse } from '@/types/api';

/**
 * GET - List tasks for a project
 */
async function getHandler(req: NextRequest, user: any, { params }: any) {
    try {
        await connectToDatabase();
        const { projectId } = await params;

        // Verify ownership
        const project = await Project.findOne({ _id: projectId, creatorId: user._id });
        if (!project) {
            return NextResponse.json(errorResponse('Project not found or unauthorized'), { status: 404 });
        }

        const tasks = await Task.find({ projectId })
            .sort({ columnId: 1, position: 1, createdAt: 1 });

        return NextResponse.json(tasks);
    } catch (error: any) {
        console.error('Tasks GET API Error:', error);
        return NextResponse.json(errorResponse('Failed to fetch tasks', error.message), { status: 500 });
    }
}

/**
 * POST - Add a task with CRM metadata
 */
async function postHandler(req: NextRequest, user: any, { params }: any) {
    try {
        await connectToDatabase();
        const { projectId } = await params;
        const body = await req.json();

        // Verify ownership
        const project = await Project.findOne({ _id: projectId, creatorId: user._id });
        if (!project) {
            return NextResponse.json(errorResponse('Project not found or unauthorized'), { status: 404 });
        }

        // Get highest position in the column
        const lastTask = await Task.findOne({ projectId, columnId: body.columnId || 'todo' })
            .sort({ position: -1 });
        const position = (lastTask?.position || 0) + 1;

        const task = await Task.create({
            projectId,
            title: body.title,
            description: body.description,
            priority: body.priority || 'Medium',
            dueDate: body.dueDate,
            columnId: body.columnId || 'todo',
            status: 'To Do',
            position,
            subtasks: body.subtasks || [],
            attachments: []
        });

        // Log activity
        await Project.findByIdAndUpdate(projectId, {
            $push: {
                activityLog: {
                    action: 'task_created',
                    performedBy: 'Creator',
                    timestamp: new Date(),
                    meta: { title: body.title }
                }
            }
        });

        return NextResponse.json(task);
    } catch (error: any) {
        console.error('Tasks POST API Error:', error);
        return NextResponse.json(errorResponse('Failed to create task', error.message), { status: 500 });
    }
}


export const GET = withCreatorAuth(getHandler);
export const POST = withCreatorAuth(postHandler);
