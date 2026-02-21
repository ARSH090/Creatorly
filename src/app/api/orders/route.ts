import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db/mongodb';
import { Order } from '@/lib/models/Order';
import { withCreatorAuth } from '@/lib/auth/withAuth';

async function handler(req: NextRequest, user: any) {
    try {
        await connectToDatabase();

        const { searchParams } = new URL(req.url);
        const limit = parseInt(searchParams.get('limit') || '20');
        const page = parseInt(searchParams.get('page') || '1');
        const search = searchParams.get('search') || '';
        const status = searchParams.get('status') || '';
        const skip = (page - 1) * limit;

        // Build Query
        const query: any = { creatorId: user._id };

        if (status) {
            query.status = status;
        }

        if (search) {
            query.$or = [
                { razorpayOrderId: { $regex: search, $options: 'i' } },
                { customerEmail: { $regex: search, $options: 'i' } },
                { customerName: { $regex: search, $options: 'i' } },
                { orderNumber: { $regex: search, $options: 'i' } }
            ];
        }

        const orders = await Order.find(query)
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit)
            .lean();

        const totalContext = await Order.countDocuments(query);

        return NextResponse.json({
            orders,
            pagination: {
                total: totalContext,
                page,
                limit,
                pages: Math.ceil(totalContext / limit)
            }
        });
    } catch (error) {
        console.error('Orders API Error:', error);
        return NextResponse.json({ error: 'Failed to fetch orders' }, { status: 500 });
    }
}

export const GET = withCreatorAuth(handler);
