import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db/mongodb';
import { Affiliate } from '@/lib/models/Affiliate';
import { getMongoUser } from '@/lib/auth/get-user';
import crypto from 'crypto';

export const dynamic = 'force-dynamic';

// GET /api/v1/affiliates
export async function GET(req: NextRequest) {
    try {
        await connectToDatabase();
        const user = await getMongoUser();
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const affiliates = await Affiliate.find({ creatorId: user._id })
            .sort({ createdAt: -1 });

        return NextResponse.json({ affiliates });
    } catch (error: any) {
        console.error('Error fetching affiliates:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

// POST /api/v1/affiliates
export async function POST(req: NextRequest) {
    try {
        await connectToDatabase();
        const user = await getMongoUser();
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const body = await req.json();
        const { productId, affiliateEmail, commissionPercent, customCode } = body;

        if (!productId || !affiliateEmail || !commissionPercent) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        const affiliateCode = customCode || crypto.randomBytes(4).toString('hex').toUpperCase();

        const affiliate = await Affiliate.create({
            creatorId: user._id,
            productId,
            affiliateEmail,
            commissionPercent,
            affiliateCode,
            status: 'active'
        });

        return NextResponse.json({ affiliate }, { status: 201 });
    } catch (error: any) {
        if (error.code === 11000) {
            return NextResponse.json({ error: 'Affiliate code already exists' }, { status: 400 });
        }
        console.error('Error creating affiliate:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
