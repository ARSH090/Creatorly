import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db/mongodb';
import { Invoice } from '@/lib/models/Invoice';
import { withCreatorAuth } from '@/lib/auth/withAuth';
import { errorResponse } from '@/types/api';

/**
 * GET - List all invoices for a creator (or their orders)
 */
async function getHandler(req: NextRequest, user: any) {
    try {
        await connectToDatabase();

        // Find invoices where creatorId matches
        // Also find invoices where userId matches (for their own subscriptions)
        const invoices = await Invoice.find({
            $or: [
                { creatorId: user._id },
                { userId: user._id, creatorId: { $exists: false } }
            ]
        }).sort({ createdAt: -1 });

        return NextResponse.json(invoices);
    } catch (error: any) {
        console.error('Invoices GET API Error:', error);
        return NextResponse.json(errorResponse('Failed to fetch invoices', error.message), { status: 500 });
    }
}

export const GET = withCreatorAuth(getHandler);
