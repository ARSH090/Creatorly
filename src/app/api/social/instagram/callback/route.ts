import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';
import { connectToDatabase } from '@/lib/db/mongodb';
import { SocialAccount } from '@/lib/models/SocialAccount';
import { encryptTokenGCM } from '@/lib/security/encryption';
import { MetaGraphService } from '@/lib/services/meta';

const GRAPH_BASE_URL = 'https://graph.facebook.com/v19.0';

export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const code = searchParams.get('code');
        const state = searchParams.get('state');

        if (!code || !state) {
            return NextResponse.json({ error: 'Authorization code or state missing' }, { status: 400 });
        }

        // 1. Verify State (Simple Decoded Check - In prod would use session/cookie token)
        let userId: string;
        try {
            const decodedState = JSON.parse(Buffer.from(state, 'base64').toString());
            userId = decodedState.userId;
        } catch (e) {
            return NextResponse.json({ error: 'Invalid state parameter' }, { status: 400 });
        }

        await connectToDatabase();

        // 1.5. Development Bypass
        if (process.env.NODE_ENV === 'development' && code === 'dev_mock_code') {
            const { encryptedData, iv, tag } = encryptTokenGCM('mock_dev_token_123');
            await SocialAccount.findOneAndUpdate(
                { instagramBusinessId: 'mock_ig_id_789' },
                {
                    userId,
                    platform: 'instagram',
                    pageId: 'mock_page_id_456',
                    instagramBusinessId: 'mock_ig_id_789',
                    pageAccessToken: encryptedData,
                    tokenIV: iv,
                    tokenTag: tag,
                    tokenStatus: 'valid',
                    lastTokenCheck: new Date(),
                    isActive: true,
                    isBusiness: true,
                    connectedAt: new Date(),
                    metadata: {
                        username: 'mock_creator_account',
                        accountType: 'BUSINESS',
                        pageName: 'Mock Creator Page'
                    }
                },
                { upsert: true, new: true }
            );
            return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/dashboard/automation?success=true`);
        }

        // 2. Exchange Code for Short-Lived Access Token
        const tokenResponse = await axios.get(`${GRAPH_BASE_URL}/oauth/access_token`, {
            params: {
                client_id: process.env.INSTAGRAM_APP_ID,
                client_secret: process.env.INSTAGRAM_APP_SECRET,
                redirect_uri: `${process.env.NEXT_PUBLIC_APP_URL}/api/social/instagram/callback`,
                code,
            },
        });

        const shortLivedToken = tokenResponse.data.access_token;

        // 3. Exchange for Long-Lived Token (Essential for background automation)
        const longLivedToken = await MetaGraphService.exchangeForLongLivedToken(shortLivedToken);

        // 4. Fetch User's Pages to find IG Business Account
        const pagesResponse = await axios.get(`${GRAPH_BASE_URL}/me/accounts`, {
            params: { access_token: longLivedToken },
        });

        const pages = pagesResponse.data.data;
        if (!pages || pages.length === 0) {
            return NextResponse.json({ error: 'No Facebook Pages found associated with this account' }, { status: 404 });
        }

        // For this implementation, we take the first page that has an IG Business Account
        // In a complex UI, user would select the page.
        let connectedAccount = null;

        for (const page of pages) {
            // Check if page has an Instagram Business account
            const igResponse = await axios.get(`${GRAPH_BASE_URL}/${page.id}`, {
                params: {
                    fields: 'instagram_business_account{id,username,account_type}',
                    access_token: page.access_token
                },
            });

            const igAccount = igResponse.data.instagram_business_account;
            if (igAccount) {
                // Hardened Validation: Only BUSINESS accounts are allowed (Creator accounts can also work, but Stan store level usually mandates Business)
                // Meta sometimes returns 'BUSINESS' or 'CREATOR'. Both are valid for Messages API.
                // Personal accounts won't have instagram_business_account.

                const igId = igAccount.id;

                // Store/Update Social Account with AES-256-GCM encrypted token
                const { encryptedData, iv, tag } = encryptTokenGCM(page.access_token);

                connectedAccount = await SocialAccount.findOneAndUpdate(
                    { instagramBusinessId: igId },
                    {
                        userId,
                        platform: 'instagram',
                        pageId: page.id,
                        instagramBusinessId: igId,
                        pageAccessToken: encryptedData,
                        tokenIV: iv,
                        tokenTag: tag,
                        tokenStatus: 'valid',
                        lastTokenCheck: new Date(),
                        isActive: true,
                        isBusiness: true,
                        connectedAt: new Date(),
                        metadata: {
                            username: igAccount.username,
                            accountType: igAccount.account_type,
                            pageName: page.name
                        }
                    },
                    { upsert: true, new: true }
                );

                // Subscribe to Webhooks
                try {
                    await axios.post(`${GRAPH_BASE_URL}/${page.id}/subscribed_apps`,
                        { subscribed_fields: ['feed', 'messages', 'messaging_postbacks'] },
                        { params: { access_token: page.access_token } }
                    );
                } catch (subErr) {
                    console.error('Webhook subscription failed for page:', page.id);
                }

                break;
            }
        }


        if (!connectedAccount) {
            return NextResponse.json({ error: 'No Instagram Business Account linked to your Facebook Pages' }, { status: 404 });
        }

        // Redirect back to dashboard
        return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/dashboard/automation?success=true`);
    } catch (error: any) {
        console.error('Instagram Callback Error:', error.response?.data || error.message);
        return NextResponse.json({ error: 'Failed to complete Instagram connection' }, { status: 500 });
    }
}
