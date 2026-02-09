import { NextRequest, NextResponse } from 'next/server';
import { getGoogleAuthUrl } from '@/lib/integrations/google';
import { withAuth } from '@/lib/firebase/withAuth';

export const dynamic = 'force-dynamic';

export const GET = withAuth(async (req, user) => {
    try {
        // Use user ID as state to verify callback
        const authUrl = getGoogleAuthUrl(user._id.toString());
        return NextResponse.redirect(authUrl);
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
});
