import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db/mongodb';
import { User } from '@/lib/models/User';
import { withAdminAuth } from '@/lib/auth/withAuth';
import { mailQueue } from '@/lib/queue';
import AuditLog from '@/lib/models/AuditLog';

// POST /api/admin/emails (Dispatch Bulk Email)
export const POST = withAdminAuth(async (req, admin) => {
    try {
        const body = await req.json();
        const { subject, content, targetGroup } = body; // targetGroup: all, free, starter, pro, business

        await connectToDatabase();

        const query: any = { role: 'creator', email: { $exists: true } };
        if (targetGroup && targetGroup !== 'all') {
            query.subscriptionTier = targetGroup;
        }

        const creators = await User.find(query).select('email displayName').lean();

        // Enqueue jobs
        const jobs = creators.map(creator => ({
            name: `bulk-email-${creator.email}`,
            data: {
                to: creator.email,
                subject,
                html: `
          <div style="font-family: sans-serif; max-width: 600px; margin: auto; padding: 40px; background: #fff; border: 1px solid #eee; border-radius: 12px;">
            <div style="margin-bottom: 30px; border-bottom: 2px solid #6366f1; padding-bottom: 10px;">
              <h1 style="margin: 0; color: #6366f1; text-transform: uppercase; font-style: italic;">CREATORLY ANNOUNCEMENT</h1>
            </div>
            <p>Hi ${creator.displayName || 'there'},</p>
            <div style="font-size: 16px; line-height: 1.6; color: #333;">
              ${content}
            </div>
            <div style="margin-top: 40px; border-top: 1px solid #eee; padding-top: 20px; font-size: 12px; color: #666;">
              &copy; 2026 Creatorly Platform. All rights reserved.<br/>
              This is a mandatory system update for and was sent to ${creator.email}
            </div>
          </div>
        `
            }
        }));

        if (jobs.length > 0) {
            await mailQueue.addBulk(jobs);
        }

        await AuditLog.create({
            adminId: admin.id,
            action: 'SEND_BULK_EMAIL',
            entityType: 'setting',
            details: { subject, targetGroup, count: creators.length },
            ipAddress: req.headers.get('x-forwarded-for') || 'local'
        });

        return NextResponse.json({ success: true, enqueued: creators.length });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
});
