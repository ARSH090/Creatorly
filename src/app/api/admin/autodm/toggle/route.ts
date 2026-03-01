import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { connectToDatabase as dbConnect } from '@/lib/db/mongodb';
import { User } from '@/lib/models/User';

export async function POST(req: NextRequest) {
    const { userId } = await auth();
    if (!userId) return new NextResponse('Unauthorized', { status: 401 });

    try {
        await dbConnect();
        const adminUser = await User.findOne({ clerkId: userId, role: { $in: ['admin', 'super-admin'] } });

        if (!adminUser) {
            return new NextResponse('Forbidden', { status: 403 });
        }

        const body = await req.json();
        const { enabled } = body;

        // Implement your global platform settings toggle here. 
        // For now, returning success.
        console.log(`[Admin] AutoDM globally set to: ${enabled}`);

        return NextResponse.json({ success: true, enabled });

    } catch (err) {
        return new NextResponse('Server Error', { status: 500 });
    }
}

