import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db/mongodb';
import { Project } from '@/lib/models/Project';
import { ProjectService } from '@/lib/services/projectService';
import { withCreatorAuth } from '@/lib/auth/withAuth';
import { successResponse, errorResponse } from '@/types/api';

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
        if (status) query.status = status;

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
 * POST - Create a manual project
 */
async function postHandler(req: NextRequest, user: any) {
    try {
        await connectToDatabase();
        const body = await req.json();

        if (!body.name) {
            return NextResponse.json(errorResponse('Project name is required'), { status: 400 });
        }

        const project = await ProjectService.createProject({
            creatorId: user._id.toString(),
            name: body.name,
            description: body.description,
            clientId: body.clientId,
            dueDate: body.dueDate
        });

        return NextResponse.json(project);
    } catch (error: any) {
        console.error('Projects POST API Error:', error);
        return NextResponse.json(errorResponse('Failed to create project', error.message), { status: 500 });
    }
}

export const GET = withCreatorAuth(getHandler);
export const POST = withCreatorAuth(postHandler);
