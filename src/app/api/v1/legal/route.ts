import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db/mongodb';
import LegalPage from '@/lib/models/LegalPage';
import { getMongoUser } from '@/lib/auth/get-user';

export async function GET(req: NextRequest) {
    try {
        await connectToDatabase();
        const { searchParams } = new URL(req.url);
        const slug = searchParams.get('slug');
        const creatorId = searchParams.get('creatorId');

        // Public access if creatorId and slug provided
        if (slug && creatorId) {
            const page = await LegalPage.findOne({ creatorId, slug, isActive: true }).lean();
            return NextResponse.json({ page });
        }

        // Creator management access
        const user = await getMongoUser();
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const pages = await LegalPage.find({ creatorId: user._id }).lean();
        return NextResponse.json({ pages });

    } catch (error: any) {
        console.error('Legal Page API Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    try {
        await connectToDatabase();
        const user = await getMongoUser();
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const { title, slug, content, isActive } = await req.json();

        const page = await LegalPage.findOneAndUpdate(
            { creatorId: user._id, slug },
            { title, content, isActive },
            { upsert: true, new: true }
        );

        return NextResponse.json({ success: true, page });

    } catch (error: any) {
        console.error('Legal Page Save Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
