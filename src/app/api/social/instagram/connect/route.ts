import { NextResponse } from 'next/server';
import { withAuth } from '@/lib/auth/withAuth';

const FB_AUTH_URL = 'https://www.facebook.com/v19.0/dialog/oauth';
const SCOPES = [
    'instagram_basic',
    'instagram_manage_messages',
    'pages_manage_metadata',
    'pages_read_engagement',
    'pages_manage_engagement'
].join(',');

export const GET = withAuth(async (req, user) => {
    try {
        const appId = process.env.INSTAGRAM_APP_ID;
        const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL}/api/social/instagram/callback`;

        if (!appId || !process.env.NEXT_PUBLIC_APP_URL) {
            return NextResponse.json({ error: 'Instagram App configuration missing' }, { status: 500 });
        }

        // State include userId to verify on callback (CSRF protection)
        const state = Buffer.from(JSON.stringify({ userId: user._id })).toString('base64');

        const authUrl = `${FB_AUTH_URL}?client_id=${appId}&redirect_uri=${redirectUri}&scope=${SCOPES}&response_type=code&state=${state}`;

        return NextResponse.redirect(authUrl);
    } catch (error) {
        console.error('Instagram Connect Error:', error);
        return NextResponse.json({ error: 'Failed to initiate Instagram connection' }, { status: 500 });
    }
});
