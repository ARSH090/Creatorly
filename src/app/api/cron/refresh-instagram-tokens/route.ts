import { NextRequest, NextResponse } from 'next/server';
import { InstagramService } from '@/lib/services/instagram';
import { connectToDatabase } from '@/lib/db/mongodb';
import { SocialAccount } from '@/lib/models/SocialAccount';
import { decryptTokenWithVersion, encryptTokenWithVersion } from '@/lib/security/encryption';

export async function POST(request: NextRequest) {
    try {
        // Simple security check for cron (Upstash Signature verification should be added for production)
        const authHeader = request.headers.get('Authorization');
        if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
            return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
        }

        await connectToDatabase();

        // 1. Find tokens expiring within the next 7 days
        const sevenDaysFromNow = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
        const accountsToRefresh = await SocialAccount.find({
            platform: 'instagram',
            isActive: true,
            tokenStatus: 'valid',
            tokenExpiresAt: { $lt: sevenDaysFromNow }
        });

        console.log(`[Token Refresh Cron] Found ${accountsToRefresh.length} tokens to refresh`);

        const results = {
            total: accountsToRefresh.length,
            success: 0,
            failed: 0
        };

        const appId = process.env.META_APP_ID!;
        const appSecret = process.env.META_APP_SECRET!;

        for (const account of accountsToRefresh) {
            try {
                // Decrypt existing token
                const currentToken = decryptTokenWithVersion(
                    account.pageAccessToken,
                    account.tokenIV,
                    account.tokenTag,
                    account.keyVersion
                );

                // Refresh via Meta API
                const newToken = await InstagramService.refreshAccessToken(currentToken, appId, appSecret);

                if (newToken) {
                    // Re-encrypt with current key version and update expiry (typically +60 days)
                    const { encryptedData, iv, tag, keyVersion } = encryptTokenWithVersion(newToken);

                    account.pageAccessToken = encryptedData;
                    account.tokenIV = iv;
                    account.tokenTag = tag;
                    account.keyVersion = keyVersion;
                    account.tokenExpiresAt = new Date(Date.now() + 60 * 24 * 60 * 60 * 1000);
                    account.lastTokenCheck = new Date();

                    await account.save();
                    results.success++;
                } else {
                    console.error(`[Token Refresh Cron] Failed to refresh token for account: ${account._id}`);
                    results.failed++;
                }
            } catch (err) {
                console.error(`[Token Refresh Cron] Error processing account ${account._id}:`, err);
                results.failed++;
            }
        }

        return NextResponse.json({
            success: true,
            results
        });

    } catch (error: any) {
        console.error('[Token Refresh Cron] Critical Error:', error);
        return NextResponse.json({ success: false, message: error.message }, { status: 500 });
    }
}
