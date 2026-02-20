import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db/mongodb';
import { withAdminAuth } from '@/lib/auth/withAuth';
import { getDashboardSummary } from '@/lib/services/dashboardService';
import mongoose from 'mongoose';

/**
 * GET /api/admin/dashboard/[creatorId]
 * Get dashboard summary for a specific creator (admin view)
 */
export const GET = withAdminAuth(async (request: NextRequest, user: any, context: any) => {
    try {
        await connectToDatabase();
        
        const creatorId = context.params.creatorId;
        
        if (!creatorId || !mongoose.Types.ObjectId.isValid(creatorId)) {
            return NextResponse.json(
                { error: 'Invalid creator ID' },
                { status: 400 }
            );
        }
        
        const summary = await getDashboardSummary(creatorId);
        
        return NextResponse.json({
            creatorId,
            summary
        });
    } catch (error) {
        console.error('Admin creator dashboard error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
});
