import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { connectToDatabase } from '@/lib/db/mongodb';
import { Project } from '@/lib/models/Project';
import { Task } from '@/lib/models/Task';
import { successResponse, errorResponse } from '@/types/api';

/**
 * GET - Fetch all tasks across all projects for the creator
 */
export async function GET(req: NextRequest) {
    try {
        const { userId } = await auth();
        if (!userId) {
            return NextResponse.json(errorResponse('Unauthorized'), { status: 401 });
        }

        await connectToDatabase();

        // 1. Get all projects owned by the creator
        const projects = await Project.find({ creatorId: userId }).select('_id name category');
        const projectIds = projects.map(p => p._id);

        if (projectIds.length === 0) {
            return NextResponse.json({ tasks: [] });
        }

        // 2. Fetch all tasks for these projects
        // We'll also sort them by priority and due date
        const tasks = await Task.find({ projectId: { $in: projectIds } })
            .populate('projectId', 'name category')
            .sort({ dueDate: 1, priority: -1 });

        return NextResponse.json({ tasks });

    } catch (error: any) {
        console.error('Master Tasks API Error:', error);
        return NextResponse.json(errorResponse('Failed to fetch tasks', error.message), { status: 500 });
    }
}
