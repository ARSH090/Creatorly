import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db/mongodb';
import { Team } from '@/lib/models/Team';
import { Membership, MembershipRole, MembershipStatus } from '@/lib/models/Membership';
import { User } from '@/lib/models/User';
import { withCreatorAuth } from '@/lib/auth/withAuth';
import { withErrorHandler } from '@/lib/utils/errorHandler';

/**
 * GET /api/creator/team
 * Fetch team and members
 */
async function getHandler(req: NextRequest, user: any) {
    await connectToDatabase();

    // 1. Find or create the primary team for this creator
    let team = await Team.findOne({ ownerId: user._id, deletedAt: null });

    if (!team) {
        const slug = `${user.username || 'team'}-${Math.random().toString(36).substring(2, 7)}`;
        team = await Team.create({
            name: `${user.displayName || user.username || 'My'}'s Team`,
            slug,
            ownerId: user._id,
            settings: {
                maxMembers: user.planLimits?.maxTeamMembers || 1,
                allowMemberInvites: true
            }
        });

        // Create owner membership
        await Membership.create({
            teamId: team._id,
            userId: user._id,
            role: MembershipRole.OWNER,
            status: MembershipStatus.ACTIVE,
            joinedAt: new Date()
        });
    }

    // 2. Fetch all active/pending memberships
    const memberships = await Membership.find({
        teamId: team._id,
        deletedAt: null
    }).populate('userId', 'displayName email username avatar');

    return {
        team,
        memberships,
        planLimit: user.planLimits?.maxTeamMembers || 1
    };
}

/**
 * POST /api/creator/team
 * Invite a member
 */
async function postHandler(req: NextRequest, user: any) {
    await connectToDatabase();
    const body = await req.json();
    const { email, role = MembershipRole.MEMBER } = body;

    if (!email) {
        return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    // 1. Get the team
    const team = await Team.findOne({ ownerId: user._id, deletedAt: null });
    if (!team) {
        return NextResponse.json({ error: 'Team not found' }, { status: 404 });
    }

    // 2. Check limits
    const currentMemberCount = await Membership.countDocuments({
        teamId: team._id,
        deletedAt: null,
        status: { $in: [MembershipStatus.ACTIVE, MembershipStatus.PENDING] }
    });

    const maxMembers = user.planLimits?.maxTeamMembers || 1;
    if (currentMemberCount >= maxMembers) {
        return NextResponse.json({
            error: 'Plan limit reached',
            message: `Your current plan supports up to ${maxMembers} team members.`
        }, { status: 403 });
    }

    // 3. Check for existing invite/membership
    const existing = await Membership.findOne({
        teamId: team._id,
        invitedEmail: email.toLowerCase(),
        deletedAt: null
    });

    if (existing) {
        return NextResponse.json({ error: 'User already invited or a member' }, { status: 400 });
    }

    // 4. Create membership/invite
    // Check if user already exists on the platform
    const targetUser = await User.findOne({ email: email.toLowerCase() });

    const membership = await Membership.create({
        teamId: team._id,
        userId: targetUser ? targetUser._id : null,
        invitedEmail: email.toLowerCase(),
        role,
        status: MembershipStatus.PENDING,
        invitedBy: user._id
    });

    // 5. TODO: Send invitation email
    // await sendTeamInviteEmail(email, team.name, user.displayName);

    return {
        success: true,
        membership: {
            ...membership.toObject(),
            userId: targetUser ? {
                displayName: targetUser.displayName,
                email: targetUser.email,
                username: targetUser.username,
                avatar: targetUser.avatar
            } : null
        }
    };
}

export const GET = withCreatorAuth(withErrorHandler(getHandler));
export const POST = withCreatorAuth(withErrorHandler(postHandler));
