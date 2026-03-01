import { NextRequest, NextResponse } from 'next/server';
import { encryptToken } from '@/lib/security/encryption';
import { connectToDatabase as dbConnect } from '@/lib/db/mongodb';
import { User } from '@/lib/models/User';

export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url);
    const code = searchParams.get('code');
    const state = searchParams.get('state'); // Clerk userId
    const error = searchParams.get('error');

    const appUrl = process.env.NEXT_PUBLIC_APP_URL;

    if (error) {
        return NextResponse.redirect(new URL('/dashboard/autodm?error=instagram_denied', appUrl));
    }

    if (!code || !state) {
        return NextResponse.redirect(new URL('/dashboard/autodm?error=missing_params', appUrl));
    }

    try {
        await dbConnect();

        const clientId = process.env.NEXT_PUBLIC_INSTAGRAM_APP_ID || process.env.INSTAGRAM_APP_ID;
        const clientSecret = process.env.INSTAGRAM_APP_SECRET;
        const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL}/api/instagram/callback`;

        // Step 1 - Exchange code for short-lived token
        const tokenRes = await fetch('https://api.instagram.com/oauth/access_token', {
            method: 'POST',
            body: new URLSearchParams({
                client_id: clientId!,
                client_secret: clientSecret!,
                grant_type: 'authorization_code',
                redirect_uri: redirectUri,
                code: code,
            }),
        });

        if (!tokenRes.ok) {
            console.error('Failed short token exchange:', await tokenRes.text());
            return NextResponse.redirect(new URL('/dashboard/autodm?error=instagram_auth_failed', appUrl));
        }

        const { access_token: shortToken } = await tokenRes.json();

        // Step 2 - Exchange for long-lived token (60 days)
        const longTokenRes = await fetch(
            `https://graph.instagram.com/access_token?grant_type=ig_exchange_token&client_secret=${clientSecret}&access_token=${shortToken}`
        );

        if (!longTokenRes.ok) {
            console.error('Failed long token exchange:', await longTokenRes.text());
            return NextResponse.redirect(new URL('/dashboard/autodm?error=instagram_auth_failed_long', appUrl));
        }

        const { access_token: longToken, expires_in } = await longTokenRes.json();

        // Step 3 - Get Instagram profile
        const profileRes = await fetch(
            `https://graph.instagram.com/me?fields=id,username,followers_count,profile_picture_url&access_token=${longToken}`
        );

        if (!profileRes.ok) {
            console.error('Failed profile fetch:', await profileRes.text());
            return NextResponse.redirect(new URL('/dashboard/autodm?error=instagram_profile_failed', appUrl));
        }

        const profile = await profileRes.json();

        // Step 4 - Encrypt token and save to DB
        const encryptedToken = encryptToken(longToken);
        const expiresAt = new Date(Date.now() + expires_in * 1000);

        const updatedUser = await User.findOneAndUpdate(
            { clerkId: state },
            {
                'instagramConnection.instagramUserId': profile.id,
                'instagramConnection.username': profile.username,
                'instagramConnection.accessToken': encryptedToken,
                'instagramConnection.tokenExpiresAt': expiresAt,
                'instagramConnection.isConnected': true,
                'instagramConnection.connectedAt': new Date(),
                'instagramConnection.followersCount': profile.followers_count || 0,
                'instagramConnection.profilePicUrl': profile.profile_picture_url || null,
            },
            { new: true }
        );

        if (!updatedUser) {
            return NextResponse.redirect(new URL('/dashboard/autodm?error=user_not_found', appUrl));
        }

        // Step 5 - Subscribe this creator to webhook
        await subscribeToWebhook(profile.id, longToken);

        return NextResponse.redirect(new URL('/dashboard/autodm?connected=true', appUrl));

    } catch (err: any) {
        console.error('Instagram callback error:', err);
        return NextResponse.redirect(new URL('/dashboard/autodm?error=internal_error', appUrl));
    }
}

async function subscribeToWebhook(igUserId: string, accessToken: string) {
    const apiVersion = process.env.META_API_VERSION || 'v18.0';
    try {
        const res = await fetch(
            `https://graph.facebook.com/${apiVersion}/${igUserId}/subscribed_apps`,
            {
                method: 'POST',
                body: new URLSearchParams({
                    subscribed_fields: 'comments,messages,follows,mentions',
                    access_token: accessToken,
                }),
            }
        );
        if (!res.ok) {
            console.error('Webhook subscription failed:', await res.text());
        }
    } catch (e) {
        console.error('Failed to subscribe webhook:', e);
    }
}

