import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db/mongodb';
import { PlatformSettings } from '@/lib/models/PlatformSettings';
import { withAdminAuth } from '@/lib/auth/withAuth';
import AuditLog from '@/lib/models/AuditLog';

// GET /api/admin/settings
export const GET = withAdminAuth(async () => {
    try {
        await connectToDatabase();
        let settings = await PlatformSettings.findOne().lean();

        if (!settings) {
            // Initialize if not exists
            settings = await PlatformSettings.create({
                supportEmail: 'support@creatorly.in',
                businessName: 'Creatorly',
                taxId: 'PENDING',
                updateLastModifiedBy: 'system'
            });
        }

        return NextResponse.json({ settings });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
});

// PATCH /api/admin/settings
export const PATCH = withAdminAuth(async (req, user) => {
    try {
        const body = await req.json();
        await connectToDatabase();

        const previousSettings = await PlatformSettings.findOne();
        const settings = await PlatformSettings.findOneAndUpdate(
            {},
            {
                ...body,
                updateLastModifiedBy: user.emailAddresses[0]?.emailAddress || user.id,
                updateLastModifiedAt: new Date()
            },
            { new: true, upsert: true }
        );

        // Dynamic Audit Log for 106+ checkpoints - this records which key changed
        const changes = [];
        for (const key in body) {
            if (JSON.stringify(previousSettings?.[key]) !== JSON.stringify(body[key])) {
                changes.push({
                    field: key,
                    old: previousSettings?.[key],
                    new: body[key]
                });
            }
        }

        if (changes.length > 0) {
            await AuditLog.create({
                adminId: user.id,
                action: 'UPDATE_PLATFORM_SETTINGS',
                entityType: 'setting',
                details: { changes },
                ipAddress: req.headers.get('x-forwarded-for') || 'local'
            });
        }

        return NextResponse.json({ success: true, settings });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
});
