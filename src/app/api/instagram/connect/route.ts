import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';

export async function GET(req: NextRequest) {
    const { userId } = await auth();
    if (!userId) {
        return NextResponse.redirect(new URL('/sign-in', req.url));
    }

    const clientId = process.env.NEXT_PUBLIC_INSTAGRAM_APP_ID || process.env.INSTAGRAM_APP_ID;
    const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL}/api/instagram/callback`;

    if (!clientId) {
        return NextResponse.json({ error: 'Instagram App ID not configured' }, { status: 500 });
    }

    const params = new URLSearchParams({
        client_id: clientId,
        redirect_uri: redirectUri,
        scope: [
            'instagram_basic',
            'instagram_manage_messages',
            'instagram_manage_comments',
            'pages_show_list',
            'pages_messaging',
        ].join(','),
        response_type: 'code',
        state: userId, // Pass Clerk userId as state for security to attach logic
    });

    return NextResponse.redirect(`https://api.instagram.com/oauth/authorize?${params.toString()}`);
}
