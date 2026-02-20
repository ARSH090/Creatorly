import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/admin/[...nextauth]/route';
import { connectToDatabase as dbConnect } from '@/lib/db/mongodb';
import { Payout } from '@/lib/models/Payout';
import { AdminLog } from '@/lib/models/AdminLog';

export async function PUT(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || session.user?.role !== 'admin') {
            return new NextResponse('Unauthorized', { status: 401 });
        }

        const { id } = await params;
        const body = await req.json(); // { status: 'paid' | 'rejected', notes: string }
        await dbConnect();

        const payout = await Payout.findById(id);
        if (!payout) return new NextResponse('Payout not found', { status: 404 });

        // Update Payout
        const oldStatus = payout.status;
        payout.status = body.status;
        if (body.status === 'paid') {
            payout.processedAt = new Date();
            payout.transactionId = body.transactionReference || body.transactionId; // Optional manual reference
        }
        if (body.notes) {
            payout.notes = body.notes; // Assuming schema has notes or we add it
        }

        await payout.save();

        await AdminLog.create({
            adminEmail: session.user.email,
            action: 'update_payout_status',
            targetType: 'payout',
            targetId: payout._id,
            changes: { from: oldStatus, to: body.status, notes: body.notes },
            ipAddress: req.headers.get('x-forwarded-for') || 'unknown'
        });

        return NextResponse.json(payout);

    } catch (error) {
        return new NextResponse('Internal Server Error', { status: 500 });
    }
}
