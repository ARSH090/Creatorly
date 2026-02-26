import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import jwt from 'jsonwebtoken';

export async function GET(request: NextRequest) {
    try {
        const { userId } = await auth();
        if (!userId) {
            return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
        }

        const appId = process.env.META_APP_ID;
        const redirectUri = process.env.META_OAUTH_REDIRECT_URI;
        const stateSecret = process.env.JWT_STATE_SECRET;

        if (!appId || !redirectUri || !stateSecret) {
            console.error('[Instagram Connect] Missing environment variables:', { appId: !!appId, redirectUri: !!redirectUri, stateSecret: !!stateSecret });
            return NextResponse.json({ success: false, message: 'Server configuration error' }, { status: 500 });
        }

        // Generate signed JWT state for CSRF protection
        const state = jwt.sign(
            { sub: userId, type: 'ig_connect' },
            stateSecret,
            { expiresIn: '10m' }
        );

        const scope = [
            'instagram_basic',
            'instagram_manage_messages',
            'instagram_manage_comments',
            'pages_show_list',
            'pages_read_engagement'
        ].join(',');

        const oauthUrl = `https://www.facebook.com/v19.0/dialog/oauth?client_id=${appId}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=${encodeURIComponent(scope)}&state=${state}&response_type=code`;

        return NextResponse.redirect(oauthUrl);

    } catch (error: any) {
        console.error('[Instagram Connect] Error:', error);
        return NextResponse.json({ success: false, message: error.message }, { status: 500 });
    }
}
