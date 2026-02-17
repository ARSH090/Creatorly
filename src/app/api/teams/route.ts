import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db/mongodb';
import { Team } from '@/lib/models/Team';
import { Membership, MembershipRole, MembershipStatus } from '@/lib/models/Membership';
import { withCreatorAuth } from '@/lib/auth/withAuth';
import { z } from 'zod';

const createTeamSchema = z.object({
    name: z.string().min(2).max(50),
    slug: z.string().min(2).max(50).regex(/^[a-z0-9-]+$/, 'Slug must be lowercase alphanumeric with hyphens'),
    description: z.string().max(200).optional(),
});

async function handler(req: NextRequest, user: any) {
    try {
        await connectToDatabase();
        const body = await req.json();

        const validation = createTeamSchema.safeParse(body);
        if (!validation.success) {
            return NextResponse.json({ error: validation.error.format() }, { status: 400 });
        }

        const { name, slug, description } = validation.data;

        // 1. Check if slug exists
        const existingTeam = await Team.findOne({ slug });
        if (existingTeam) {
            return NextResponse.json({ error: 'Team slug already taken' }, { status: 409 });
        }

        // 2. Create the team
        const team = await Team.create({
            name,
            slug,
            description,
            ownerId: user._id,
            settings: {
                maxMembers: user.planLimits?.maxTeamMembers || 1
            }
        });

        // 3. Create the owner membership
        await Membership.create({
            teamId: team._id,
            userId: user._id,
            role: MembershipRole.OWNER,
            status: MembershipStatus.ACTIVE,
            joinedAt: new Date()
        });

        return NextResponse.json(team, { status: 201 });
    } catch (error: any) {
        console.error('[Create Team] Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

export const POST = withCreatorAuth(handler);
