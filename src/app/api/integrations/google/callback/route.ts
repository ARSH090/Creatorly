import { NextRequest, NextResponse } from 'next/server';
import { getTokensFromCode } from '@/lib/integrations/google';
import { connectToDatabase } from '@/lib/db/mongodb';
import CreatorProfile from '@/lib/models/CreatorProfile';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url);
    const code = searchParams.get('code');
    const state = searchParams.get('state'); // creatorId

    if (!code || !state) {
        return NextResponse.json({ error: 'Missing code or state' }, { status: 400 });
    }

    try {
        await connectToDatabase();
        const tokens = await getTokensFromCode(code);

        // Update Creator Profile with tokens
        await CreatorProfile.findOneAndUpdate(
            { creatorId: state },
            {
                $set: {
                    'availability.googleCalendarTokens': tokens,
                    'availability.isGoogleCalendarSyncEnabled': true
                }
            }
        );

        // Redirect back to dashboard integrations page
        return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/dashboard/integrations?success=google_calendar`);
    } catch (error: any) {
        console.error('Google callback error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
