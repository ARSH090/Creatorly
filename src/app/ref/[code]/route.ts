import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { connectToDatabase } from '@/lib/db/mongodb';
import Referral from '@/lib/models/Referral';

export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ code: string }> }
) {
    const { code } = await params;
    const cookieStore = await cookies();

    // Set referral cookie (expires in 30 days)
    cookieStore.set('referral_code', code, {
        maxAge: 60 * 60 * 24 * 30, // 30 days
        path: '/',
        httpOnly: true,
        sameSite: 'lax',
    });

    // Increment clicks asynchronously (fire and forget)
    (async () => {
        try {
            await connectToDatabase();
            await Referral.findOneAndUpdate(
                { code },
                { $inc: { clicks: 1 } },
                { upsert: false }
            );
        } catch (err) {
            console.error('Failed to increment referral clicks', err);
        }
    })();

    // Redirect to home page
    return NextResponse.redirect(new URL('/', req.url));
}
