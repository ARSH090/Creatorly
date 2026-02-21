import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db/mongodb';
import User from '@/lib/models/User';

export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const username = searchParams.get('username')?.toLowerCase();

        if (!username || username.length < 3) {
            return NextResponse.json({ available: false, error: 'Username too short' });
        }

        if (!/^[a-z0-9_-]+$/.test(username)) {
            return NextResponse.json({ available: false, error: 'Invalid characters' });
        }

        await connectToDatabase();

        const existing = await User.findOne({ username });

        return NextResponse.json({
            available: !existing,
            message: existing ? 'Username already taken' : 'Username available'
        });

    } catch (error: any) {
        console.error('Check Username API error:', error);
        return NextResponse.json({ available: false, error: 'Internal server error' }, { status: 500 });
    }
}
