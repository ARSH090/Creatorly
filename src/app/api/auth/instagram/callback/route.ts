import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import jwt from 'jsonwebtoken';
import { InstagramService } from '@/lib/services/instagram';
import { connectToDatabase } from '@/lib/db/mongodb';
import { SocialAccount } from '@/lib/models/SocialAccount';
import { User } from '@/lib/models/User';
import { encryptTokenWithVersion } from '@/lib/security/encryption';

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const code = searchParams.get('code');
        const state = searchParams.get('state');
        const error = searchParams.get('error');

        if (error) {
            console.warn('[Instagram Callback] OAuth error:', error);
            return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/dashboard/automation?error=meta_oauth_failed&desc=${error}`);
        }

        if (!code || !state) {
            return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/dashboard/automation?error=missing_params`);
        }

        const { userId: currentClerkUserId } = await auth();
        const stateSecret = process.env.JWT_STATE_SECRET;

        if (!stateSecret) {
            console.error('[Instagram Callback] Missing JWT_STATE_SECRET');
            return NextResponse.json({ success: false, message: 'Server configuration error' }, { status: 500 });
        }

        // 1. Verify State (CSRF & Correct User Binding)
        let decoded: any;
        try {
            decoded = jwt.verify(state, stateSecret);
        } catch (err) {
            console.error('[Instagram Callback] Invalid state JWT:', err);
            return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/dashboard/automation?error=invalid_state`);
        }

        if (decoded.sub !== currentClerkUserId) {
            console.error('[Instagram Callback] User mismatch. State sub:', decoded.sub, 'Current user:', currentClerkUserId);
            return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/dashboard/automation?error=user_mismatch`);
        }

        await connectToDatabase();

        // 2. Exchange Code for Short-Lived User Token
        const appId = process.env.META_APP_ID!;
        const appSecret = process.env.META_APP_SECRET!;
        const redirectUri = process.env.META_OAUTH_REDIRECT_URI!;

        const shortLivedToken = await InstagramService.exchangeCodeForToken(code, appId, appSecret, redirectUri);
        if (!shortLivedToken) {
            return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/dashboard/automation?error=exchange_failed`);
        }

        // 3. Exchange for Long-Lived User Token (60 days)
        const longLivedToken = await InstagramService.getLongLivedToken(shortLivedToken, appId, appSecret);
        if (!longLivedToken) {
            return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/dashboard/automation?error=long_lived_failed`);
        }

        // 4. Fetch User Pages & Business ID
        const pages = await InstagramService.getUserPages(longLivedToken);
        if (pages.length === 0) {
            return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/dashboard/automation?error=no_pages`);
        }

        // We use the first page that has an Instagram Business Account for now
        const eligiblePage = pages.find(p => p.instagram_business_account);
        if (!eligiblePage) {
            return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/dashboard/automation?error=no_ig_business_account`);
        }

        const igBusinessId = eligiblePage.instagram_business_account.id;
        const pageId = eligiblePage.id;
        const pageAccessToken = eligiblePage.access_token; // This is a short-lived page token, but if derived from LL user token, it can be persisted

        // 5. Encrypt & Store/Update SocialAccount
        const creator = await User.findOne({ clerkId: currentClerkUserId });
        if (!creator) {
            return NextResponse.json({ success: false, message: 'Creator not found' }, { status: 404 });
        }

        const { encryptedData, iv, tag, keyVersion } = encryptTokenWithVersion(pageAccessToken);

        await SocialAccount.findOneAndUpdate(
            { instagramBusinessId: igBusinessId },
            {
                userId: creator._id,
                platform: 'instagram',
                pageId,
                instagramBusinessId: igBusinessId,
                pageAccessToken: encryptedData,
                tokenIV: iv,
                tokenTag: tag,
                keyVersion,
                tokenStatus: 'valid',
                isActive: true,
                lastTokenCheck: new Date(),
                metadata: {
                    pageName: eligiblePage.name,
                    connectedAt: new Date()
                }
            },
            { upsert: true }
        );

        return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/dashboard/automation?connected=instagram`);

    } catch (error: any) {
        console.error('[Instagram Callback] Critical Error:', error);
        return NextResponse.json({ success: false, message: error.message }, { status: 500 });
    }
}
