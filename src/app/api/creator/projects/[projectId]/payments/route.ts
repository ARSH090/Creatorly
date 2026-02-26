import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db/mongodb';
import { Project } from '@/lib/models/Project';
import { withCreatorAuth } from '@/lib/auth/withAuth';
import { errorResponse } from '@/types/api';

/**
 * GET - Calculate and return financial stats for the project
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

        // Aggregate financial data (simulated for Phase 3)
        const financials = {
            totalValue: project.value || 0,
            amountPaid: project.paymentStatus === 'Fully Paid' ? project.value : 0,
            remainingBalance: project.paymentStatus === 'Fully Paid' ? 0 : project.value,
            invoices: [
                { id: 'INV-001', amount: project.value, status: project.paymentStatus === 'Fully Paid' ? 'Paid' : 'Unpaid', date: project.createdAt }
            ],
            expenses: []
        };

        return NextResponse.json(financials);
    } catch (error: any) {
        console.error('Payments GET API Error:', error);
        return NextResponse.json(errorResponse('Failed to fetch financial data', error.message), { status: 500 });
    }
}

/**
 * PATCH - Update project value or payment status
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
            return NextResponse.json(errorResponse('Project not found'), { status: 404 });
        }

        // Log financial update
        await Project.findByIdAndUpdate(projectId, {
            $push: {
                activityLog: {
                    action: 'financial_update',
                    performedBy: 'Creator',
                    timestamp: new Date(),
                    meta: {
                        newValue: body.value,
                        newStatus: body.paymentStatus
                    }
                }
            }
        });

        return NextResponse.json(updatedProject);
    } catch (error: any) {
        console.error('Payments PATCH API Error:', error);
        return NextResponse.json(errorResponse('Failed to update financials', error.message), { status: 500 });
    }
}

export const GET = withCreatorAuth(getHandler);
export const PATCH = withCreatorAuth(patchHandler);
