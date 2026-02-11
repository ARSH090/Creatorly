import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db/mongodb';
import { InvitationService } from '@/lib/services/invitation';
import { withAuth } from '@/lib/firebase/withAuth';

async function handler(req: NextRequest, user: any) {
    try {
        await connectToDatabase();
        const { searchParams } = new URL(req.url);
        const inviteId = searchParams.get('id');

        if (!inviteId) {
            return NextResponse.json({ error: 'Missing invitation ID' }, { status: 400 });
        }

        // Execute acceptance
        const membership = await InvitationService.acceptInvite(inviteId, user._id.toString());

        return NextResponse.json({
            message: 'Invitation accepted successfully',
            teamId: membership.teamId
        });
    } catch (error: any) {
        console.error('[Accept Invite] Error:', error.message);
        return NextResponse.json({ error: error.message }, { status: 400 });
    }
}

// Any authenticated user can accept an invite
export const POST = withAuth(handler);
