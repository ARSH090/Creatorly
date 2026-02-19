import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/admin/[...nextauth]/route';
import { connectToDatabase as dbConnect } from '@/lib/db/mongodb';
import { PlatformSettings } from '@/lib/models/PlatformSettings';
import { AdminLog } from '@/lib/models/AdminLog';

export async function GET() {
    try {
        const session = await getServerSession(authOptions);
        if (!session || session.user?.role !== 'admin') {
            return new NextResponse('Unauthorized', { status: 401 });
        }

        await dbConnect();

        let settings = await PlatformSettings.findOne().lean();
        if (!settings) {
            // Create default if not exists
            settings = await PlatformSettings.create({});
        }

        return NextResponse.json(settings);

    } catch (error) {
        console.error('Settings Get Error:', error);
        return new NextResponse('Internal Server Error', { status: 500 });
    }
}

export async function PUT(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || session.user?.role !== 'admin') {
            return new NextResponse('Unauthorized', { status: 401 });
        }

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
            adminEmail: session.user.email,
            action: 'update_settings',
            targetType: 'settings',
            changes: body, // Be careful if body is huge
            ipAddress: req.headers.get('x-forwarded-for') || 'unknown'
        });

        return NextResponse.json(settings);

    } catch (error) {
        console.error('Settings Update Error:', error);
        return new NextResponse('Internal Server Error', { status: 500 });
    }
}

