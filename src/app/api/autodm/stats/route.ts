import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/auth/withAuth';
import { connectToDatabase } from '@/lib/db/mongodb';
import { AutoReplyRule } from '@/lib/models/AutoReplyRule';
import { DMLog } from '@/lib/models/DMLog';
import { WhatsAppContact } from '@/lib/models/WhatsAppContact';

export const GET = withAuth(async (req: NextRequest, user: any) => {
    try {
        const userId = user._id;
        await connectToDatabase();

        const [rules, logsCount, contactsCount] = await Promise.all([
            AutoReplyRule.find({ creatorId: userId }).lean(),
            DMLog.countDocuments({ creatorId: userId, status: 'success' }),
            WhatsAppContact.countDocuments({ creatorId: userId })
        ]);

        const totalSent = rules.reduce((acc, rule) => acc + (rule.stats?.totalSent || 0), 0);
        const totalFailed = rules.reduce((acc, rule) => acc + (rule.stats?.totalFailed || 0), 0);

        // Group by platform
        const instagramSent = rules
            .filter(r => r.platform === 'instagram')
            .reduce((acc, rule) => acc + (rule.stats?.totalSent || 0), 0);

        const whatsappSent = rules
            .filter(r => r.platform === 'whatsapp')
            .reduce((acc, rule) => acc + (rule.stats?.totalSent || 0), 0);

        return NextResponse.json({
            success: true,
            stats: {
                totalSent,
                totalFailed,
                instagramSent,
                whatsappSent,
                activeRules: rules.filter(r => r.isActive).length,
                totalContacts: contactsCount,
                deliveryRate: totalSent > 0 ? ((totalSent / (totalSent + totalFailed)) * 100).toFixed(1) : 100
            }
        });

    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
});
