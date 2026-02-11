import mongoose from 'mongoose';
import crypto from 'crypto';

import Membership, { MembershipRole, MembershipStatus } from '@/lib/models/Membership';
import { connectToDatabase } from '@/lib/db/mongodb';
import { Team } from '@/lib/models/Team';
import { User } from '@/lib/models/User';
import { sendEmail } from '@/lib/services/email';

/**
 * Service to handle team invitations
 */
export class InvitationService {
    /**
     * Create an invitation for a team
     */
    static async createInvite(params: {
        teamId: string;
        inviterId: string;
        email: string;
        role: MembershipRole;
    }) {
        await connectToDatabase();

        const { teamId, inviterId, email, role } = params;

        // 1. Verify team exists and limit not reached
        const team = await Team.findById(teamId);
        if (!team) throw new Error('Team not found');

        const currentMemberCount = await Membership.countDocuments({
            teamId,
            status: MembershipStatus.ACTIVE
        });

        if (currentMemberCount >= team.settings.maxMembers) {
            throw new Error('Team member limit reached. Please upgrade your plan.');
        }

        // 2. Check if already invited or member
        const existing = await Membership.findOne({
            teamId,
            $or: [{ invitedEmail: email.toLowerCase() }, { userId: (await User.findOne({ email: email.toLowerCase() }))?._id }]
        });

        if (existing) {
            if (existing.status === MembershipStatus.ACTIVE) throw new Error('User is already a member');
            if (existing.status === MembershipStatus.PENDING) throw new Error('Invitation already pending');
        }

        // 3. Create membership entry with pending status
        const membership = await Membership.create({
            teamId,
            invitedBy: inviterId,
            invitedEmail: email.toLowerCase(),
            role,
            status: MembershipStatus.PENDING
        });

        // 4. Send invitation email
        const inviteLink = `${process.env.NEXT_PUBLIC_APP_URL}/invites/accept?id=${membership._id}`;

        await sendEmail({
            to: email,
            subject: `You've been invited to join ${team.name} on Creatorly`,
            html: `
                <div style="font-family: sans-serif; max-width: 600px; margin: auto;">
                    <h2>Join the Team!</h2>
                    <p>You have been invited to join the team <strong>${team.name}</strong> on Creatorly.</p>
                    <p>Click the button below to accept the invitation and start collaborating.</p>
                    <a href="${inviteLink}" style="display: inline-block; padding: 12px 24px; background: #6366f1; color: white; text-decoration: none; border-radius: 8px; font-weight: bold;">Accept Invitation</a>
                    <p style="margin-top: 24px; font-size: 12px; color: #666;">If you didn't expect this invite, you can safely ignore this email.</p>
                </div>
            `
        });

        return membership;
    }

    /**
     * Accept an invitation
     */
    static async acceptInvite(inviteId: string, userId: string) {
        await connectToDatabase();

        const membership = await Membership.findById(inviteId);
        if (!membership || membership.status !== MembershipStatus.PENDING) {
            throw new Error('Invalid or expired invitation');
        }

        membership.userId = new mongoose.Types.ObjectId(userId);
        membership.status = MembershipStatus.ACTIVE;
        membership.joinedAt = new Date();
        await membership.save();

        // 🟢 IN-APP NOTIFICATION: Notify the inviter
        if (membership.invitedBy) {
            try {
                const { NotificationService } = await import('@/lib/services/notification');
                await NotificationService.send({
                    userId: membership.invitedBy.toString(),
                    type: 'team_invite',
                    title: 'Invitation Accepted',
                    message: `${membership.invitedEmail} has joined your team.`
                });
            } catch (e) {
                console.error('Failed to send notification:', e);
            }
        }


        return membership;

    }
}
