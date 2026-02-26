import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db/mongodb';
import { Project } from '@/lib/models/Project';
import { Task } from '@/lib/models/Task';
import { Deliverable } from '@/lib/models/Deliverable';
import { ProjectMessage } from '@/lib/models/ProjectMessage';
import { successResponse, errorResponse } from '@/types/api';

/**
 * GET - Public endpoint for Client Portal access
 */
export async function GET(req: NextRequest, { params }: any) {
    try {
        await connectToDatabase();
        const { token } = await params;

        // Find project by client portal token
        const project = await Project.findOne({ clientPortalToken: token })
            .populate('creatorId', 'displayName brandName brandLogo email');

        if (!project) {
            return NextResponse.json(errorResponse('Access denied. Invalid portal link.'), { status: 403 });
        }

        // Fetch associated tasks and deliverables
        const tasks = await Task.find({ projectId: project._id, status: { $ne: 'Backlog' } })
            .sort({ position: 1 });

        const deliverables = await Deliverable.find({ projectId: project._id })
            .sort({ createdAt: -1 });

        const messages = await ProjectMessage.find({ projectId: project._id })
            .sort({ createdAt: 1 });

        return NextResponse.json({
            project,
            tasks,
            deliverables,
            messages
        });
    } catch (error: any) {
        console.error('Client Portal API Error:', error);
        return NextResponse.json(errorResponse('Failed to load portal data', error.message), { status: 500 });
    }
}

/**
 * PATCH - Allow clients to approve deliverables or update status
 */
export async function PATCH(req: NextRequest, { params }: any) {
    try {
        await connectToDatabase();
        const { token } = await params;
        const body = await req.json();

        const project = await Project.findOne({ clientPortalToken: token });
        if (!project) {
            return NextResponse.json(errorResponse('Unauthorized'), { status: 403 });
        }

        // Logic for client actions (approve, feedback, etc.)
        if (body.action === 'approve_deliverable') {
            await Deliverable.findByIdAndUpdate(body.deliverableId, {
                status: 'Approved',
                approvedAt: new Date()
            });

            // Log activity
            await Project.findByIdAndUpdate(project._id, {
                $push: {
                    activityLog: {
                        action: 'deliverable_approved',
                        performedBy: 'Client',
                        timestamp: new Date(),
                        meta: { deliverableId: body.deliverableId }
                    }
                }
            });
        }

        if (body.action === 'add_comment') {
            await Deliverable.findByIdAndUpdate(body.deliverableId, {
                $push: {
                    comments: {
                        sender: 'Client',
                        content: body.content,
                        timestamp: new Date()
                    }
                }
            });

            // If it's a revision request
            if (body.requestRevision) {
                await Deliverable.findByIdAndUpdate(body.deliverableId, {
                    status: 'Revision Requested',
                    $inc: { revisionCount: 1 }
                });
            }

            // Log activity
            await Project.findByIdAndUpdate(project._id, {
                $push: {
                    activityLog: {
                        action: body.requestRevision ? 'revision_requested' : 'comment_added',
                        performedBy: 'Client',
                        timestamp: new Date(),
                        meta: { deliverableId: body.deliverableId }
                    }
                }
            });
        }

        if (body.action === 'send_message') {
            await ProjectMessage.create({
                projectId: project._id,
                creatorId: project.creatorId,
                senderType: 'client',
                senderName: 'Client',
                content: body.content,
                readByCreator: false,
                readByClient: true
            });

            // Log activity
            await Project.findByIdAndUpdate(project._id, {
                $push: {
                    activityLog: {
                        action: 'message_sent',
                        performedBy: 'Client',
                        timestamp: new Date()
                    }
                }
            });
        }


        return NextResponse.json({ success: true });

    } catch (error: any) {
        console.error('Client Portal PATCH Error:', error);
        return NextResponse.json(errorResponse('Operation failed', error.message), { status: 500 });
    }
}
