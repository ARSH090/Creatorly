import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db/mongodb';
import { Project } from '@/lib/models/Project';
import { Task } from '@/lib/models/Task';
import { ProjectService } from '@/lib/services/projectService';
import { errorResponse } from '@/types/api';

/**
 * GET - Public project view for clients (Token based)
 */
export async function GET(req: NextRequest, { params }: any) {
    try {
        await connectToDatabase();
        const { token } = await params;

        // Find project by valid token
        const project = await Project.findOne({
            'accessTokens.token': token,
            'accessTokens.expiresAt': { $gt: new Date() },
            clientViewEnabled: true
        }).populate('creatorId', 'displayName email avatar');

        if (!project) {
            return NextResponse.json(errorResponse('Project not found or link expired'), { status: 404 });
        }

        // Fetch tasks for this project
        const tasks = await Task.find({ projectId: project._id })
            .sort({ order: 1, createdAt: 1 });

        return NextResponse.json({
            project: {
                name: project.name,
                description: project.description,
                status: project.status,
                dueDate: project.dueDate,
                creator: project.creatorId
            },
            tasks: tasks.map(t => ({
                title: t.title,
                description: t.description,
                status: t.status,
                priority: t.priority,
                dueDate: t.dueDate
            }))
        });
    } catch (error: any) {
        console.error('Public Project API Error:', error);
        return NextResponse.json(errorResponse('Failed to fetch project', error.message), { status: 500 });
    }
}
