import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db/mongodb';
import { Project } from '@/lib/models/Project';
import { withCreatorAuth } from '@/lib/auth/withAuth';
import { successResponse, errorResponse } from '@/types/api';

/**
 * GET - Fetch individual project details
 */
async function getHandler(req: NextRequest, user: any, { params }: any) {
    try {
        await connectToDatabase();
        const { projectId } = await params;

        const project = await Project.findOne({ _id: projectId, creatorId: user._id })
            .populate('clientId', 'displayName email avatar')
            .populate('orderId');

        if (!project) {
            return NextResponse.json(errorResponse('Project not found'), { status: 404 });
        }

        return NextResponse.json(project);
    } catch (error: any) {
        console.error('Project Detail GET API Error:', error);
        return NextResponse.json(errorResponse('Failed to fetch project', error.message), { status: 500 });
    }
}

/**
 * PATCH - Update project details
 */
async function patchHandler(req: NextRequest, user: any, { params }: any) {
    try {
        await connectToDatabase();
        const { projectId } = await params;
        const body = await req.json();

        const updatedProject = await Project.findOneAndUpdate(
            { _id: projectId, creatorId: user._id },
            { $set: body },
            { new: true }
        );

        if (!updatedProject) {
            return NextResponse.json(errorResponse('Project not found or unauthorized'), { status: 404 });
        }

        return NextResponse.json(updatedProject);
    } catch (error: any) {
        console.error('Project Detail PATCH API Error:', error);
        return NextResponse.json(errorResponse('Failed to update project', error.message), { status: 500 });
    }
}

/**
 * DELETE - Archive project
 */
async function deleteHandler(req: NextRequest, user: any, { params }: any) {
    try {
        await connectToDatabase();
        const { projectId } = await params;

        const project = await Project.findOneAndUpdate(
            { _id: projectId, creatorId: user._id },
            { $set: { isArchived: true } },
            { new: true }
        );

        if (!project) {
            return NextResponse.json(errorResponse('Project not found'), { status: 404 });
        }

        return NextResponse.json({ success: true, message: 'Project archived successfully' });
    } catch (error: any) {
        console.error('Project Detail DELETE API Error:', error);
        return NextResponse.json(errorResponse('Failed to archive project', error.message), { status: 500 });
    }
}

export const GET = withCreatorAuth(getHandler);
export const PATCH = withCreatorAuth(patchHandler);
export const DELETE = withCreatorAuth(deleteHandler);
