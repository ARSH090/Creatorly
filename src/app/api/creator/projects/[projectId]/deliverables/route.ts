import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db/mongodb';
import { Project } from '@/lib/models/Project';
import { Deliverable } from '@/lib/models/Deliverable';
import { withCreatorAuth } from '@/lib/auth/withAuth';
import { errorResponse } from '@/types/api';

/**
 * GET - List deliverables for a project
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

        const deliverables = await Deliverable.find({ projectId })
            .sort({ createdAt: -1 });

        return NextResponse.json(deliverables);
    } catch (error: any) {
        console.error('Deliverables GET API Error:', error);
        return NextResponse.json(errorResponse('Failed to fetch deliverables', error.message), { status: 500 });
    }
}

/**
 * POST - Upload/Add a new deliverable (or a new version)
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

        // If it's a new version of an existing deliverable
        if (body.parentDeliverableId) {
            const parent = await Deliverable.findById(body.parentDeliverableId);
            if (parent) {
                const newVersion = await Deliverable.create({
                    ...body,
                    projectId,
                    creatorId: user._id,
                    versionNumber: parent.versionNumber + 1,
                    previousVersions: [
                        ...parent.previousVersions,
                        {
                            fileKey: parent.fileKey,
                            versionNumber: parent.versionNumber,
                            uploadedAt: parent.createdAt
                        }
                    ]
                });

                // Update activity
                await Project.findByIdAndUpdate(projectId, {
                    $push: {
                        activityLog: {
                            action: 'new_version_uploaded',
                            performedBy: 'Creator',
                            timestamp: new Date(),
                            meta: { name: body.name, version: newVersion.versionNumber }
                        }
                    }
                });

                return NextResponse.json(newVersion);
            }
        }

        // Generate approval token
        const approvalToken = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);

        const deliverable = await Deliverable.create({
            ...body,
            projectId,
            creatorId: user._id,
            versionNumber: 1,
            approvalToken,
            status: 'Pending'
        });

        // Log activity
        await Project.findByIdAndUpdate(projectId, {
            $push: {
                activityLog: {
                    action: 'deliverable_uploaded',
                    performedBy: 'Creator',
                    timestamp: new Date(),
                    meta: { name: body.name }
                }
            }
        });

        return NextResponse.json(deliverable);
    } catch (error: any) {
        console.error('Deliverables POST API Error:', error);
        return NextResponse.json(errorResponse('Failed to create deliverable', error.message), { status: 500 });
    }
}

export const GET = withCreatorAuth(getHandler);
export const POST = withCreatorAuth(postHandler);
