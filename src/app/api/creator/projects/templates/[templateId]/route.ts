import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db/mongodb';
import { ProjectTemplate } from '@/lib/models/ProjectTemplate';
import { withCreatorAuth } from '@/lib/auth/withAuth';
import { withErrorHandler } from '@/lib/utils/errorHandler';
import { successResponse, errorResponse } from '@/types/api';

/**
 * GET, PATCH, DELETE - Handler for individual project templates
 */
async function handler(req: NextRequest, user: any, { params }: any) {
    try {
        await connectToDatabase();
        const { templateId } = await params;

        const template = await ProjectTemplate.findOne({ _id: templateId, creatorId: user._id });
        if (!template) {
            return NextResponse.json(errorResponse('Template not found or unauthorized'), { status: 404 });
        }

        if (req.method === 'GET') {
            return NextResponse.json(template);
        }

        if (req.method === 'PATCH') {
            const body = await req.json();
            const updated = await ProjectTemplate.findByIdAndUpdate(templateId, body, { new: true });
            return NextResponse.json(updated);
        }

        if (req.method === 'DELETE') {
            await ProjectTemplate.findByIdAndDelete(templateId);
            return NextResponse.json({ success: true });
        }

        return NextResponse.json(errorResponse('Method not allowed'), { status: 405 });
    } catch (error: any) {
        console.error('Template Detail API Error:', error);
        return NextResponse.json(errorResponse('Operation failed', error.message), { status: 500 });
    }
}

export const GET = withCreatorAuth(withErrorHandler(handler));
export const PATCH = withCreatorAuth(withErrorHandler(handler));
export const DELETE = withCreatorAuth(withErrorHandler(handler));
