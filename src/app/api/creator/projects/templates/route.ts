import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db/mongodb';
import { ProjectTemplate } from '@/lib/models/ProjectTemplate';
import { withCreatorAuth } from '@/lib/auth/withAuth';
import { withErrorHandler } from '@/lib/utils/errorHandler';
import { successResponse, errorResponse } from '@/types/api';

/**
 * GET /api/creator/projects/templates
 * Fetches all templates for the current creator + public templates
 */
async function getHandler(req: NextRequest, user: any) {
    try {
        await connectToDatabase();

        const templates = await ProjectTemplate.find({
            $or: [
                { creatorId: user._id },
                { isPublic: true }
            ]
        }).sort({ createdAt: -1 });

        return NextResponse.json(templates);
    } catch (error: any) {
        console.error('Templates GET API Error:', error);
        return NextResponse.json(errorResponse('Failed to fetch templates', error.message), { status: 500 });
    }
}

/**
 * POST /api/creator/projects/templates
 * Creates a new project template
 */
async function postHandler(req: NextRequest, user: any) {
    try {
        await connectToDatabase();
        const body = await req.json();

        const template = await ProjectTemplate.create({
            ...body,
            creatorId: user._id
        });

        return NextResponse.json(template);
    } catch (error: any) {
        console.error('Templates POST API Error:', error);
        return NextResponse.json(errorResponse('Failed to create template', error.message), { status: 500 });
    }
}

export const GET = withCreatorAuth(withErrorHandler(getHandler));
export const POST = withCreatorAuth(withErrorHandler(postHandler));
