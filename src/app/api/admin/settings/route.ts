import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase as dbConnect } from '@/lib/db/mongodb';
import { PlatformSettings } from '@/lib/models/PlatformSettings';
import { AdminLog } from '@/lib/models/AdminLog';
import { withAdminAuth } from '@/lib/auth/withAuth';
import { withErrorHandler } from '@/lib/utils/errorHandler';

async function getHandler(req: NextRequest) {
    await dbConnect();

    let settings = await PlatformSettings.findOne().lean();
    if (!settings) {
        settings = await PlatformSettings.create({});
    }

    return NextResponse.json(settings);
}

async function putHandler(req: NextRequest, user: any) {
    const body = await req.json();
    await dbConnect();

    let settings = await PlatformSettings.findOne();
    if (!settings) {
        settings = new PlatformSettings(body);
    } else {
        Object.assign(settings, body);
    }

    await settings.save();

    await AdminLog.create({
        adminEmail: user.email,
        action: 'update_settings',
        targetType: 'settings',
        changes: body,
        ipAddress: req.headers.get('x-forwarded-for') || 'unknown'
    });

    return NextResponse.json(settings);
}

export const GET = withAdminAuth(withErrorHandler(getHandler));
export const PUT = withAdminAuth(withErrorHandler(putHandler));

