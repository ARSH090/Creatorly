import { NextResponse } from 'next/server';
import { withAuth } from '@/lib/auth/withAuth';
import { connectToDatabase } from '@/lib/db/mongodb';
import { AutoReplyRule } from '@/lib/models/AutoReplyRule';

/**
 * DELETE: Remove a specific automation rule
 */
export const DELETE = withAuth(async (req, user, { params }) => {
    try {
        const { ruleId } = await params;
        if (!ruleId) return NextResponse.json({ error: 'Rule ID required' }, { status: 400 });

        await connectToDatabase();

        const result = await AutoReplyRule.deleteOne({ _id: ruleId, creatorId: user._id });

        if (result.deletedCount === 0) {
            return NextResponse.json({ error: 'Rule not found or unauthorized' }, { status: 404 });
        }

        return NextResponse.json({ message: 'Rule deleted successfully' });
    } catch (error) {
        return NextResponse.json({ error: 'Failed to delete rule' }, { status: 500 });
    }
});
