import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db/mongodb';
import { InvitationService } from '@/lib/services/invitation';
import { Membership, MembershipRole } from '@/lib/models/Membership';
import { withAuth } from '@/lib/firebase/withAuth';
import { z } from 'zod';

const inviteSchema = z.object({
    teamId: z.string(),
    email: z.string().email(),
    role: z.nativeEnum(MembershipRole).default(MembershipRole.MEMBER),
});

async function handler(req: NextRequest, user: any) {
    try {
        await connectToDatabase();
        const body = await req.json();

        const validation = inviteSchema.safeParse(body);
        if (!validation.success) {
            return NextResponse.json({ error: validation.error.format() }, { status: 400 });
        }

        const { teamId, email, role } = validation.data;

        // 1. Authorize: User must be an ADMIN or OWNER of the team to invite
        const inviterMembership = await Membership.findOne({
            teamId,
            userId: user._id,
            role: { $in: [MembershipRole.OWNER, MembershipRole.ADMIN] }
        });

        if (!inviterMembership) {
            return NextResponse.json({ error: 'Forbidden - High-level team access required to invite' }, { status: 403 });
        }

        // 2. Execute invitation
        const membership = await InvitationService.createInvite({
            teamId,
            inviterId: user._id.toString(),
            email,
            role
        });

        return NextResponse.json({
            message: 'Invitation sent successfully',
            inviteId: membership._id
        });
    } catch (error: any) {
        console.error('[Team Invite] Error:', error.message);
        return NextResponse.json({ error: error.message }, { status: 400 });
    }
}

export const POST = withAuth(handler);
