import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/auth/withAuth';
import { connectToDatabase } from '@/lib/db/mongodb';
import { DMLog } from '@/lib/models/DMLog';
import { AutoReplyRule } from '@/lib/models/AutoReplyRule';
import { AutoDMFlow } from '@/lib/models/AutoDMFlow';
import mongoose from 'mongoose';

// GET /api/autodm/analytics — ManyChat-style analytics aggregation
export const GET = withAuth(async (_req: NextRequest, user: any) => {
    try {
        await connectToDatabase();
        const creatorId = new mongoose.Types.ObjectId(user._id);

        // ─── Global Totals from DMLog ───────────────────────────────────────
        const [totalStats] = await DMLog.aggregate([
            { $match: { creatorId, provider: 'instagram' } },
            {
                $group: {
                    _id: null,
                    sent: { $sum: 1 },
                    delivered: { $sum: { $cond: [{ $in: ['$deliveryStatus', ['delivered', 'read']] }, 1, 0] } },
                    read: { $sum: { $cond: [{ $eq: ['$deliveryStatus', 'read'] }, 1, 0] } },
                    clicked: { $sum: { $cond: [{ $eq: ['$metadata.clicked', true] }, 1, 0] } },
                    emailsCollected: { $sum: { $cond: [{ $eq: ['$triggerSource', 'automation'] }, 1, 0] } },
                },
            },
        ]);

        const totals = totalStats ?? { sent: 0, delivered: 0, read: 0, clicked: 0, emailsCollected: 0 };

        // ─── Per-Rule Breakdown ─────────────────────────────────────────────
        const rules = await AutoReplyRule.find({ creatorId }).lean();
        const ruleStats = await DMLog.aggregate([
            { $match: { creatorId, provider: 'instagram', ruleId: { $exists: true } } },
            {
                $group: {
                    _id: '$ruleId',
                    sent: { $sum: 1 },
                    delivered: { $sum: { $cond: [{ $in: ['$deliveryStatus', ['delivered', 'read']] }, 1, 0] } },
                    clicked: { $sum: { $cond: [{ $eq: ['$metadata.clicked', true] }, 1, 0] } },
                },
            },
        ]);

        const ruleMap = new Map(ruleStats.map((r) => [r._id?.toString(), r]));

        const ruleBreakdown = rules.map((rule) => {
            const stats = ruleMap.get(rule._id?.toString()) ?? { sent: 0, delivered: 0, clicked: 0 };
            return {
                ruleId: rule._id,
                name: rule.name ?? rule.keywords?.[0] ?? 'Unnamed',
                triggerType: rule.triggerType,
                triggered: rule.stats?.triggered ?? 0,
                sent: stats.sent,
                delivered: stats.delivered,
                clicked: stats.clicked,
                isActive: rule.isActive,
            };
        });

        // ─── Per-Flow Stats ─────────────────────────────────────────────────
        const flows = await AutoDMFlow.find({ creatorId }).lean();
        const flowBreakdown = flows.map((flow) => ({
            flowId: flow._id,
            name: flow.name,
            trigger: flow.trigger,
            isActive: flow.isActive,
            triggered: flow.stats?.triggered ?? 0,
            dmsSent: flow.stats?.dmsSent ?? 0,
            emailsCollected: flow.stats?.emailsCollected ?? 0,
            linksClicked: flow.stats?.linksClicked ?? 0,
        }));

        // ─── Calculated Rates ───────────────────────────────────────────────
        const deliveryRate = totals.sent > 0 ? Math.round((totals.delivered / totals.sent) * 100) : 0;
        const readRate = totals.delivered > 0 ? Math.round((totals.read / totals.delivered) * 100) : 0;
        const clickRate = totals.read > 0 ? Math.round((totals.clicked / totals.read) * 100) : 0;

        return NextResponse.json({
            success: true,
            totals: { ...totals, deliveryRate, readRate, clickRate },
            rules: ruleBreakdown,
            flows: flowBreakdown,
        });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
});
