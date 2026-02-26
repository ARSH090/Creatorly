import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db/mongodb';
import { Project } from '@/lib/models/Project';
import { ProjectService } from '@/lib/services/projectService';
import { withCreatorAuth } from '@/lib/auth/withAuth';
import { errorResponse } from '@/types/api';

/**
 * GET - List messages for a project
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

        // Project.activityLog contains some messages, but we might want a dedicated collection
        // For now, we use a dedicated messages field in Project (simplified) or extra collection
        // Let's assume we use Project.messages for this Phase
        return NextResponse.json(project.messages || []);
    } catch (error: any) {
        console.error('Messages GET API Error:', error);
        return NextResponse.json(errorResponse('Failed to fetch messages', error.message), { status: 500 });
    }
}

/**
 * POST - Send a new message
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

        const newMessage = {
            sender: 'Creator',
            content: body.content,
            timestamp: new Date(),
            attachments: body.attachments || [],
            type: body.type || 'text'
        };

        const updatedProject = await Project.findByIdAndUpdate(
            projectId,
            { $push: { messages: newMessage } },
            { new: true }
        );

        // Also log to activity
        await Project.findByIdAndUpdate(projectId, {
            $push: {
                activityLog: {
                    action: 'message_sent',
                    performedBy: 'Creator',
                    timestamp: new Date(),
                    meta: { snippet: body.content.substring(0, 30) + '...' }
                }
            }
        });

        return NextResponse.json(newMessage);
    } catch (error: any) {
        console.error('Messages POST API Error:', error);
        return NextResponse.json(errorResponse('Failed to send message', error.message), { status: 500 });
    }
}

export const GET = withCreatorAuth(getHandler);
export const POST = withCreatorAuth(postHandler);
