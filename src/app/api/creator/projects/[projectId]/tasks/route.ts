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
            .sort({ order: 1, createdAt: 1 });

        return NextResponse.json(tasks);
    } catch (error: any) {
        console.error('Tasks GET API Error:', error);
        return NextResponse.json(errorResponse('Failed to fetch tasks', error.message), { status: 500 });
    }
}

/**
 * POST - Add a task to project
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

        const task = await ProjectService.addTask(projectId, {
            title: body.title,
            description: body.description,
            priority: body.priority,
            dueDate: body.dueDate
        });

        return NextResponse.json(task);
    } catch (error: any) {
        console.error('Tasks POST API Error:', error);
        return NextResponse.json(errorResponse('Failed to create task', error.message), { status: 500 });
    }
}

export const GET = withCreatorAuth(getHandler);
export const POST = withCreatorAuth(postHandler);
